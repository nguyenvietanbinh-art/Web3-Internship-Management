
/**
 * Lớp giao tiếp API duy nhất của frontend.
 * - Tự gắn Bearer JWT.
 * - Ném Error có `status` / `code` để UI hiển thị thông báo rõ ràng.
 */
import { getToken, setToken, invalidateSession } from './session.js';
import { errorMessage } from './errorMessages.js';
export { getToken, setToken };
export const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
export const DEMO_ENABLED = import.meta.env?.DEV === true && import.meta.env?.VITE_ENABLE_DEMO === 'true';

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const binary = typeof Blob !== 'undefined' && body instanceof Blob;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { ...(!multipart && { 'Content-Type': binary ? body.type || 'application/octet-stream' : 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }), ...headers },
      // Chấp nhận cả object lẫn chuỗi JSON đã stringify.
      body: body === undefined ? undefined : multipart || binary || typeof body === 'string' ? body : JSON.stringify(body),
    });
  } catch {
    const err = new Error('Không thể kết nối hệ thống. Vui lòng thử lại sau.');
    err.code = 'NETWORK';
    throw err;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const sessionCodes = ['BAD_TOKEN','NO_TOKEN','NO_USER','SESSION_REVOKED','ACCOUNT_DISABLED'];
    if (response.status === 401 && (!path.startsWith('/auth/') || sessionCodes.includes(data.code))) invalidateSession(token);
    const err = new Error(errorMessage(data.error || 'Không thể hoàn tất thao tác. Vui lòng thử lại.',data.code));
    err.status = response.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Đăng nhập bằng MetaMask: xin nonce → ví ký message → backend xác minh chữ ký → nhận JWT.
 * Không có ví giả: thiếu MetaMask thì báo lỗi.
 */
export async function signInWithWallet(role, name) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Chưa phát hiện MetaMask. Hãy cài tiện ích MetaMask để đăng nhập.');
  }
  const { BrowserProvider } = await import('ethers');
  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const { message } = await apiRequest('/auth/nonce', { method: 'POST', body: { walletAddress: address } });
  const signature = await signer.signMessage(message);
  const result = await apiRequest('/auth/login-wallet', { method: 'POST', body: { walletAddress: address, signature, role, name } });
  setToken(result.token);
  const network = await provider.getNetwork();
  return { user: result.user, address, chainId: Number(network.chainId), networkName: network.name };
}

/** Đăng nhập tức thì với tài khoản Demo mà không cần MetaMask extension */
export async function demoLoginWallet(role = 'company') {
  if (!DEMO_ENABLED) throw new Error('Demo chưa được bật cho môi trường riêng.');
  const result = await apiRequest('/auth/demo-login', { method: 'POST', body: { role } });
  setToken(result.token);
  return {
    user: result.user,
    address: result.user.walletAddress,
    chainId: 31337,
    networkName: 'Hardhat Local / Simulated',
    isDemo: true,
  };
}

/** Khôi phục phiên từ token đã lưu; trả null nếu không còn hợp lệ. */
export async function restoreSession() {
  if (!getToken()) return null;
  try {
    return (await apiRequest('/auth/me')).user;
  } catch (err) {
    if (err.code === 'NETWORK') throw err;
    return null;
  }
}

export const logout = () => setToken('');

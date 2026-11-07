import {useState,useRef,useEffect,useCallback} from 'react';
import {apiRequest,setToken,getToken} from '../api/client';
import {Dialog} from './ui';

export default function PasswordWalletLink({onSession}){
 const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[open,setOpen]=useState(false),[visible,setVisible]=useState(false),[stage,setStage]=useState('');
 const operation=useRef(null),[notice,setNotice]=useState('');
 useEffect(()=>()=>{const op=operation.current;if(op){op.cancelled=true;if(!op.committing)op.controller.abort();}operation.current=null;},[]);
 const close=useCallback(()=>{const op=operation.current;if(op){op.cancelled=true;if(!op.committing)op.controller.abort();setNotice(op.committing?'Đã đóng hộp thoại. Yêu cầu lưu đã gửi tới hệ thống; hãy kiểm tra trạng thái ví khi có kết quả.':'Đã dừng liên kết ví. Nếu MetaMask còn yêu cầu đang chờ, hãy mở tiện ích và hủy yêu cầu đó.');}operation.current=null;setBusy(false);setOpen(false);setPassword('');setVisible(false);setError('');setStage('');},[]);
 useEffect(()=>{if(!open)return;const escape=e=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();close();}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[open,close]);
 async function link(event){
  event.preventDefault();if(operation.current||!password)return;
  const op={cancelled:false,committing:false,controller:new AbortController(),token:getToken()};operation.current=op;
  const stopped=()=>op.cancelled||operation.current!==op;
  setBusy(true);setError('');
  try{
   setStage('Đang xác thực mật khẩu…');
   const verified=await apiRequest('/auth/email/wallet-reauth',{method:'POST',body:{password},signal:op.controller.signal});if(stopped())return;setPassword('');
   if(!window.ethereum?.request)throw Error('Chưa tìm thấy MetaMask trong trình duyệt này. Bật tiện ích ví rồi thử lại.');
   setStage('Chờ kết nối ví trong MetaMask…');
   const {BrowserProvider}=await import('ethers'),provider=new BrowserProvider(window.ethereum);
   if(stopped())return;
   await provider.send('eth_requestAccounts',[]);
   if(stopped())return;
   const signer=await provider.getSigner();if(stopped())return;
   const network=await window.ethereum.request({method:'eth_chainId'});if(stopped())return;
   const address=await signer.getAddress();if(stopped())return;
   const c=await apiRequest('/auth/email/wallet-challenge',{method:'POST',body:{reauthId:verified.reauthId,walletAddress:address,chainId:network},signal:op.controller.signal});if(stopped())return;
   setStage('Chờ ký xác nhận trong MetaMask…');const signature=await signer.signMessage(c.message);if(stopped())return;
   const currentNetwork=await window.ethereum.request({method:'eth_chainId'});if(stopped())return;if(BigInt(currentNetwork)!==BigInt(network))throw Error('Mạng ví đã thay đổi. Hãy thử liên kết lại.');
   op.committing=true;setStage('Đang lưu liên kết đã xác nhận…');
   const result=await apiRequest('/auth/email/link-wallet',{method:'POST',body:{challengeId:c.challengeId,signature,chainId:currentNetwork}});
   if(getToken()!==op.token)return;
   if(operation.current===op){setOpen(false);setVisible(false);}setToken(result.token);await onSession(result);
  }catch(e){
   if(stopped())return;
   const codes=[e.code,e.error?.code,e.info?.error?.code];
   setError(codes.includes(-32002)?'Ví đang chờ bạn xác nhận yêu cầu trước. Mở MetaMask để xử lý rồi thử lại.':codes.includes(4001)||codes.includes('ACTION_REJECTED')?'Bạn đã hủy xác nhận trong ví. Tài khoản chưa được liên kết.':e.message);
  }finally{if(operation.current===op){operation.current=null;setBusy(false);setStage('');setPassword('');setVisible(false);}}
 }
 return <><button type="button" className="btn btn-primary" onClick={()=>{setError('');setNotice('');setOpen(true);}}>Liên kết ví MetaMask</button>{notice&&<p role="status">{notice}</p>}
 {open&&<Dialog label="Xác nhận liên kết ví" onClose={close}><div className="modal-content"><h2>Xác nhận liên kết ví</h2><form className="identity-credentials" onSubmit={link}>
  <p>Nhập mật khẩu tài khoản Internova để tiếp tục. Sau đó bạn sẽ chọn ví và ký xác nhận trong MetaMask.</p>
  <label>Mật khẩu tài khoản<input aria-label="Mật khẩu xác nhận liên kết ví" type={visible?'text':'password'} autoComplete="current-password" required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label>
  <button type="button" className="btn btn-secondary" aria-pressed={visible} disabled={busy} onClick={()=>setVisible(v=>!v)}>{visible?'Ẩn mật khẩu':'Hiển thị mật khẩu'}</button>
  <div className="business-actions"><button type="button" className="btn btn-secondary" onClick={close}>{busy?'Dừng liên kết':'Hủy'}</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?'Đang xác nhận…':'Tiếp tục'}</button></div>
  <p className="muted">Không nhập mật khẩu MetaMask, seed phrase hoặc private key. Chỉ ký thông điệp, không chuyển tiền.</p>
  {stage&&<p role="status">{stage}</p>}{error&&<p role="alert" className="inline-alert is-error">{error}</p>}
 </form></div></Dialog>}</>;
}

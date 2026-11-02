export const TOKEN_KEY = 'w3i_token';
export const SESSION_EXPIRED = 'internova:session-expired';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = token => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

// A response from an older request must never invalidate a newly established session.
export function invalidateSession(requestToken) {
  if (!requestToken || getToken() !== requestToken) return false;
  setToken('');
  window.dispatchEvent(new Event(SESSION_EXPIRED));
  return true;
}

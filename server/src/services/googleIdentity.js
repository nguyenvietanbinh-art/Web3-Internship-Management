const {OAuth2Client} = require('google-auth-library');
const {HttpError} = require('../utils/http');
const config = require('../config/env');
const client = new OAuth2Client({transporterOptions:{timeout:10000,retry:false}});
function validateClaims(p, nonce, audience, now=Math.floor(Date.now()/1000)) {
  if (!p || !['accounts.google.com','https://accounts.google.com'].includes(p.iss) || p.aud!==audience ||
      (p.azp!==undefined && p.azp!==audience) || !Number.isFinite(p.exp) || p.exp<=now ||
      !Number.isFinite(p.iat) || p.iat>now+60 || typeof p.sub!=='string' || !/^[a-zA-Z0-9_-]{1,255}$/.test(p.sub) ||
      p.email_verified!==true || typeof p.email!=='string' || p.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ||
      typeof nonce!=='string' || p.nonce!==nonce) {
    throw new HttpError(401,'Thông tin xác thực Google không hợp lệ hoặc đã hết hạn','GOOGLE_TOKEN_INVALID');
  }
  return {sub:p.sub,email:p.email.toLowerCase(),name:typeof p.name==='string'?p.name.slice(0,200):'Người dùng Google'};
}
async function verifyGoogle(credential, nonce) {
  if(typeof credential!=='string' || credential.length>16000)throw new HttpError(400,'Thiếu Google ID token','GOOGLE_TOKEN_REQUIRED');
  try {
    // Fixed Google certificates/issuer verification by the official library, never tokeninfo or decode-only.
    const ticket = await client.verifyIdToken({idToken:credential,audience:config.googleClientId});
    return validateClaims(ticket.getPayload(),nonce,config.googleClientId);
  } catch(error) {
    if(error instanceof HttpError)throw error;
    throw new HttpError(401,'Không xác minh được Google. Hãy thử lại; kiểm tra cấu hình và kết nối mạng.','GOOGLE_VERIFICATION_FAILED');
  }
}
module.exports={verifyGoogle,validateClaims};

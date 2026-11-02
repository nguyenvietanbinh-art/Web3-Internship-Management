const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "..", "..", "..", ".env") });

/**
 * Cấu hình tập trung. Mọi module đọc cấu hình từ đây thay vì dùng process.env rải rác.
 * Các giá trị được đọc lười (getter) để test có thể đổi process.env trước khi dùng.
 */
const config = {
  get userIdBusiness() { return process.env.USER_ID_BUSINESS_ENABLED==='true'; },
  get emailEnabled() { return process.env.EMAIL_AUTH_ENABLED === 'true'; },
  get googleEnabled() { return process.env.GOOGLE_AUTH_ENABLED === 'true' && /^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(this.googleClientId); },
  get googleClientId() { return process.env.GOOGLE_CLIENT_ID || ''; },
  get port() { return Number(process.env.PORT) || 5000; },
  get host() { return process.env.HOST || '127.0.0.1'; },
  get coreBusinessEnabled() { return process.env.CORE_BUSINESS_ENABLED === 'true'; },
  get chainListenerEnabled() { return process.env.CHAIN_LISTENER_ENABLED === 'true'; },
  get demoMode() {
    if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE !== 'true') return false;
    try {
      const uri = new URL(this.mongoUri);
      return uri.protocol === 'mongodb:' && uri.hostname === '127.0.0.1' &&
        /^\/web3_internship_demo_[a-z0-9_]+$/.test(uri.pathname);
    } catch { return false; }
  },
  get mongoUri() { return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/web3_internship"; },
  get jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) {
      // Không dùng secret mặc định: token có thể bị giả mạo nếu secret đoán được.
      throw new Error("JWT_SECRET chưa cấu hình hoặc quá ngắn (cần >= 16 ký tự)");
    }
    return secret;
  },
  get jwtExpiresIn() { return process.env.JWT_EXPIRES_IN || "8h"; },
  get nonceTtlMs() { return (Number(process.env.NONCE_TTL_SECONDS) || 300) * 1000; },
  get aiServiceUrl() { return process.env.AI_SERVICE_URL || "http://localhost:8000"; },
  get pinataJwt() { return process.env.PINATA_JWT || ""; },
  get corsOrigin() { return process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173'; },
  get authRateLimit() { return Math.max(1, Number(process.env.AUTH_RATE_LIMIT) || 120); },
};

module.exports = config;

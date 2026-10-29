const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "..", "..", "..", ".env") });

/**
 * Cấu hình tập trung. Mọi module đọc cấu hình từ đây thay vì dùng process.env rải rác.
 * Các giá trị được đọc lười (getter) để test có thể đổi process.env trước khi dùng.
 */
const config = {
  get port() { return Number(process.env.PORT) || 5000; },
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
  get corsOrigin() { return process.env.CORS_ORIGIN || "*"; },
};

module.exports = config;

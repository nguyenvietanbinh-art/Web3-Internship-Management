const mongoose = require("mongoose");

// Nonce dùng một lần cho đăng nhập bằng chữ ký ví. Lưu cả message để verify chính xác.
const AuthNonceSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, lowercase: true, trim: true, unique: true },
    nonce: { type: String, required: true },
    message: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "auth_nonces" }
);

// MongoDB tự xoá bản ghi hết hạn.
AuthNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AuthNonce", AuthNonceSchema);

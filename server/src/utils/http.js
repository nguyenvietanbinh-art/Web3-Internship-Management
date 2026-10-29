const mongoose = require("mongoose");

/** Lỗi nghiệp vụ có mã HTTP; errorHandler sẽ trả về đúng mã này. */
class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Bọc route async để lỗi được chuyển tới errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const isWallet = (v) => typeof v === "string" && WALLET_RE.test(v.trim());
const normalizeWallet = (v) => String(v || "").trim().toLowerCase();
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

module.exports = { HttpError, asyncHandler, isWallet, normalizeWallet, isObjectId };

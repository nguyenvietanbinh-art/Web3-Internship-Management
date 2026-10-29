const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const config = require("../config/env");
const AuthNonce = require("../models/AuthNonce");
const { HttpError } = require("../utils/http");

/** Message mà ví phải ký. Bao gồm ví + nonce + hạn để chống replay. */
function buildMessage(wallet, nonce, expiresAt) {
  return [
    "Web3 Internship Platform - Dang nhap",
    `Vi: ${wallet}`,
    `Nonce: ${nonce}`,
    `Het han: ${expiresAt.toISOString()}`,
  ].join("\n");
}

/** Cấp (hoặc làm mới) nonce cho ví. Mỗi ví chỉ có một nonce hợp lệ tại một thời điểm. */
async function issueNonce(wallet) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + config.nonceTtlMs);
  const message = buildMessage(wallet, nonce, expiresAt);
  await AuthNonce.findOneAndUpdate(
    { walletAddress: wallet },
    { $set: { nonce, message, expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { nonce, message, expiresAt };
}

/**
 * Xác minh chữ ký. Nonce bị xoá nguyên tử (findOneAndDelete) trước khi verify
 * nên mỗi nonce chỉ dùng được một lần, kể cả khi chữ ký sai.
 */
async function verifyLogin(wallet, signature) {
  const record = await AuthNonce.findOneAndDelete({ walletAddress: wallet });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, "Nonce không tồn tại hoặc đã hết hạn, hãy yêu cầu nonce mới", "NONCE_INVALID");
  }
  let recovered;
  try {
    recovered = ethers.verifyMessage(record.message, signature);
  } catch {
    throw new HttpError(401, "Chữ ký không hợp lệ", "BAD_SIGNATURE");
  }
  if (recovered.toLowerCase() !== wallet) {
    throw new HttpError(401, "Chữ ký không khớp với ví", "BAD_SIGNATURE");
  }
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id), wallet: user.walletAddress, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { buildMessage, issueNonce, verifyLogin, signToken, verifyToken };

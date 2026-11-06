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
  const now = new Date();
  const existing = await AuthNonce.findOne({walletAddress:wallet,expiresAt:{$gt:now}});
  if (existing) return {nonce:existing.nonce,message:existing.message,expiresAt:existing.expiresAt};
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + config.nonceTtlMs);
  const message = buildMessage(wallet, nonce, expiresAt);
  try {
    const record=await AuthNonce.findOneAndUpdate(
      { walletAddress:wallet,expiresAt:{$lte:now} },
      { $set: { nonce, message, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return {nonce:record.nonce,message:record.message,expiresAt:record.expiresAt};
  } catch(error) {
    if(error.code!==11000)throw error;
    const record=await AuthNonce.findOne({walletAddress:wallet,expiresAt:{$gt:new Date()}});
    if(!record)throw new HttpError(409,'Nonce vừa được sử dụng; hãy thử lại','NONCE_RETRY');
    return {nonce:record.nonce,message:record.message,expiresAt:record.expiresAt};
  }
}

/**
 * Verify before atomic consumption: an invalid signature cannot burn a valid nonce.
 * The compare-and-delete also permits only one successful concurrent login.
 */
async function verifyLogin(wallet, signature) {
  const record = await AuthNonce.findOne({ walletAddress: wallet });
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
  const consumed = await AuthNonce.findOneAndDelete({ walletAddress: wallet, nonce: record.nonce, expiresAt: { $gte: new Date() } });
  if (!consumed) throw new HttpError(401, 'Nonce đã được sử dụng hoặc hết hạn', 'NONCE_INVALID');
}

function signToken(user, authProvider = 'wallet') {
  return jwt.sign({ sub: String(user._id), sid: crypto.randomUUID(), wallet: user.walletAddress || null, role: user.role, authProvider, sessionVersion:user.authVersion||0 }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { buildMessage, issueNonce, verifyLogin, signToken, verifyToken };

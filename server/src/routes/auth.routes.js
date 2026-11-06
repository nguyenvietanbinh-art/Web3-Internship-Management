const express = require("express");
const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");
const { issueNonce, verifyLogin, signToken } = require("../services/authService");
const { requireAuth } = require("../middleware/auth");
const { HttpError, asyncHandler, isWallet, normalizeWallet } = require("../utils/http");

const router = express.Router();
const config = require('../config/env');

// Chỉ company/student được tự đăng ký. mentor/admin phải do hệ thống cấp, tránh tự nâng quyền.
const SELF_REGISTER_ROLES = ["company", "student"];

// Danh sách ví demo chuẩn kiểm thử
const DEMO_ACCOUNTS = {
  company: {
    wallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    name: "Nexus Labs Blockchain",
    role: "company",
  },
  student: {
    wallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
    name: "Trần Minh Khoa",
    role: "student",
  },
  mentor: {
    wallet: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
    name: "Mentor TS. Nguyễn Văn A",
    role: "mentor",
  },
};

// Bước 1: xin nonce để ký.
router.post("/nonce", asyncHandler(async (req, res) => {
  if (!isWallet(req.body.walletAddress)) throw new HttpError(400, "Địa chỉ ví không hợp lệ");
  const wallet = normalizeWallet(req.body.walletAddress);
  const { nonce, message, expiresAt } = await issueNonce(wallet);
  res.json({ nonce, message, expiresAt });
}));

// Bước 2: gửi chữ ký. Đúng chữ ký mới tạo/đăng nhập user và nhận JWT.
router.post("/login-wallet", asyncHandler(async (req, res) => {
  const { walletAddress, signature, role = "student", name } = req.body;
  if (!isWallet(walletAddress)) throw new HttpError(400, "Địa chỉ ví không hợp lệ");
  if (typeof signature !== "string" || !signature) throw new HttpError(400, "Thiếu chữ ký ví", "NO_SIGNATURE");
  const wallet = normalizeWallet(walletAddress);

  await verifyLogin(wallet, signature);

  let user = await User.findOne({ walletAddress: wallet });
  if (user?.disabled) throw new HttpError(403, 'Tài khoản đã bị khóa', 'ACCOUNT_DISABLED');
  if (!user) {
    if (config.schoolWorkflowEnabled) throw new HttpError(403, 'Tài khoản do nhà trường cấp; hãy đăng nhập và liên kết ví từ hồ sơ', 'PUBLIC_REGISTRATION_DISABLED');
    if (!SELF_REGISTER_ROLES.includes(role)) throw new HttpError(400, "Vai trò đăng ký không hợp lệ (company hoặc student)");
    user = await User.create({
      walletAddress: wallet,
      role,
      name: String(name || "").trim() || (role === "company" ? "Công ty đối tác" : "Sinh viên thực tập"),
      ...(role === "company" && { companyName: String(name || "").trim() }),
    });
  }

  // Đảm bảo có hồ sơ chuẩn hoá tương ứng với role.
  if (user.disabled) throw new HttpError(403, 'Tài khoản đã bị khóa', 'ACCOUNT_DISABLED');
  if (user.role === "student") {
    await Student.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { userId: user._id, fullName: user.name, skills: user.skills } }, { upsert: true, setDefaultsOnInsert: true });
  } else if (user.role === "company") {
    await Company.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { userId: user._id, name: user.companyName || user.name } }, { upsert: true, setDefaultsOnInsert: true });
  }

  if(!user.walletVerified){user=await User.findByIdAndUpdate(user._id,{$set:{walletVerified:true,walletVerifiedAt:new Date()}},{new:true});}
  res.json({ success: true, token: signToken(user), user });
}));

// Đăng nhập nhanh với ví mẫu Demo (khi người dùng chưa cài tiện ích MetaMask hoặc muốn kiểm thử tức thì)
router.post("/demo-login", asyncHandler(async (req, res) => {
  if (!config.demoMode) throw new HttpError(403, 'Đăng nhập demo chưa được bật trên database demo riêng', 'DEMO_DISABLED');
  const { role = "company" } = req.body;
  const demoPreset = DEMO_ACCOUNTS[role];
  if (!demoPreset) throw new HttpError(400, 'Vai trò demo không hợp lệ');
  const wallet = demoPreset.wallet;

  let user = await User.findOne({ walletAddress: wallet });
  if (!user) {
    user = await User.create({
      walletAddress: wallet,
      role: demoPreset.role,
      name: demoPreset.name,
      companyName: demoPreset.role === "company" ? demoPreset.name : "",
      skills: demoPreset.role === "student" ? ["Solidity", "React", "Web3.js", "TypeScript"] : [],
    });
  }

  if (user.disabled) throw new HttpError(403, 'Tài khoản đã bị khóa', 'ACCOUNT_DISABLED');
  if (user.role === "student") {
    await Student.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, fullName: user.name, skills: user.skills, kpiScore: 88 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } else if (user.role === "company") {
    await Company.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, name: user.companyName || user.name } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  res.json({ success: true, token: signToken(user), user, isDemo: true });
}));

router.get("/me", requireAuth, asyncHandler(async(req,res)=>{
  const linked=await User.findById(req.user._id).select('+googleSubject +googleEmail');
  const passwordEnabled=Boolean(await User.exists({_id:req.user._id,passwordHash:{$type:'string'}}));
  res.json({user:{...req.user.toObject(),authSessionId:req.authSid,passwordEnabled,googleLinked:Boolean(linked.googleSubject),emailVerified:Boolean(linked.googleSubject&&linked.googleEmail&&req.user.email?.toLowerCase()===linked.googleEmail),authProvider:req.authProvider}});
}));

// Hồ sơ công khai chỉ gồm thông tin không nhạy cảm.
router.get("/profile/:wallet", asyncHandler(async (req, res) => {
  const user = await User.findOne({ walletAddress: normalizeWallet(req.params.wallet) });
  if (!user) throw new HttpError(404, "Không tìm thấy người dùng");
  res.json({ walletAddress: user.walletAddress, name: user.name, role: user.role, companyName: user.companyName });
}));

// Chỉ chủ tài khoản được sửa hồ sơ của chính mình; không upsert, không đổi role.
router.put("/profile/:wallet", requireAuth, asyncHandler(async (req, res) => {
  if (normalizeWallet(req.params.wallet) !== req.user.walletAddress) {
    throw new HttpError(403, "Chỉ được sửa hồ sơ của chính mình", "NOT_OWNER");
  }
  const { profileFields, legacyUpdate } = require('../services/profileService');
  const allowed = {};
  for (const key of ['name','email','skills','bio','companyName']) if (req.body[key] !== undefined && (key !== 'companyName' || req.user.role === 'company')) allowed[key] = req.body[key];
  const user = await legacyUpdate(req.user, profileFields(allowed), 'profile.legacy_updated');

  if (user.role === "student") {
    await Student.findOneAndUpdate({ userId: user._id }, { $set: { fullName: user.name, skills: user.skills } }, { upsert: true, setDefaultsOnInsert: true });
  } else if (user.role === "company") {
    await Company.findOneAndUpdate({ userId: user._id }, { $set: { name: user.companyName || user.name } }, { upsert: true, setDefaultsOnInsert: true });
  }
  res.json({ success: true, user });
}));

module.exports = router;

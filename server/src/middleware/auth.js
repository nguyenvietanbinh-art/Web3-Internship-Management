const User = require("../models/User");
const Topic = require("../models/Topic");
const { verifyToken } = require("../services/authService");
const { HttpError, asyncHandler, isObjectId } = require("../utils/http");

/** Yêu cầu Bearer JWT hợp lệ; nạp user từ DB để role luôn là giá trị hiện tại. */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw new HttpError(401, "Thiếu token xác thực", "NO_TOKEN");
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new HttpError(401, "Token không hợp lệ hoặc đã hết hạn", "BAD_TOKEN");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.walletAddress !== payload.wallet) throw new HttpError(401, "Tài khoản không tồn tại", "NO_USER");
  req.user = user;
  next();
});

/** Giới hạn theo role. Dùng sau requireAuth. */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, `Cần vai trò: ${roles.join(" / ")}`, "FORBIDDEN_ROLE"));
  }
  next();
};

/** Nạp đề tài từ :id vào req.topic. */
const loadTopic = asyncHandler(async (req, _res, next) => {
  if (!isObjectId(req.params.id)) throw new HttpError(400, "ID đề tài không hợp lệ");
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw new HttpError(404, "Không tìm thấy đề tài");
  req.topic = topic;
  next();
});

/** Chỉ công ty sở hữu đề tài (ví khớp companyWallet). */
const requireTopicOwner = (req, _res, next) => {
  if (req.user.role !== "company" || req.user.walletAddress !== req.topic.companyWallet) {
    return next(new HttpError(403, "Bạn không phải công ty sở hữu đề tài này", "NOT_TOPIC_OWNER"));
  }
  next();
};

/** Công ty sở hữu hoặc mentor được chỉ định cho đề tài được phép chấm điểm. */
const requireTopicEvaluator = (req, _res, next) => {
  const w = req.user.walletAddress;
  const isOwner = req.user.role === "company" && w === req.topic.companyWallet;
  const isMentor = req.user.role === "mentor" && req.topic.mentorWallet && w === req.topic.mentorWallet;
  if (!isOwner && !isMentor) return next(new HttpError(403, "Bạn không có quyền đánh giá đề tài này", "NOT_EVALUATOR"));
  next();
};

/** Chỉ sinh viên được phân công vào đề tài. */
const requireAssignedStudent = (req, _res, next) => {
  if (req.user.role !== "student" || req.user.walletAddress !== req.topic.assignedStudentWallet) {
    return next(new HttpError(403, "Bạn không phải sinh viên được phân công", "NOT_ASSIGNED_STUDENT"));
  }
  next();
};

module.exports = { requireAuth, requireRole, loadTopic, requireTopicOwner, requireTopicEvaluator, requireAssignedStudent };

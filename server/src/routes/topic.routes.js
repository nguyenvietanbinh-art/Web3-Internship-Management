const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Topic = require("../models/Topic");
const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const KPIEvaluation = require("../models/KPIEvaluation");
const AIAnalysis = require("../models/AIAnalysis");
const { matchStudentWithTopic, analyzeKpiReport } = require("../services/aiClient");
// Dùng qua object module (không destructure) để test có thể thay thế bằng stub.
const ipfs = require("../services/ipfsService");
const {
  requireAuth, optionalAuth, requireRole, loadTopic, requireTopicOwner, requireTopicEvaluator, requireAssignedStudent,
} = require("../middleware/auth");
const { HttpError, asyncHandler, isWallet, normalizeWallet } = require("../utils/http");

const { canReadTopic } = require('../middleware/permissions');
function topicResponse(user, topic) {
  const obj=topic.toObject();
  if(canReadTopic(user,obj))return obj;
  obj.assignedStudentWallet=null; obj.assignedStudentName=''; obj.mentorWallet=null;
  obj.kpis=(obj.kpis||[]).map(k=>({...k,submissionContent:'',submissionIpfsHash:'',mentorFeedback:'',aiAnalysis:undefined,score:null}));
  obj.certificateIpfsHash='';obj.txHash='';
  return obj;
}

const sumWeights = (kpis) => kpis.reduce((sum, k) => sum + Number(k.weightPercent || 0), 0);

/**
 * Kiểm tra danh sách KPI khi tạo đề tài: không rỗng, trọng số nguyên 1..100, hạn hợp lệ,
 * và tổng trọng số BẮT BUỘC = 100%.
 */
function validateKpis(kpis) {
  if (!Array.isArray(kpis) || kpis.length === 0) throw new HttpError(400, "Đề tài cần ít nhất một KPI milestone");
  const normalized = kpis.map((kpi, milestoneIndex) => {
    const title = String(kpi?.title || "").trim();
    // `criteria` là tên theo đề tài; `description` giữ lại để tương thích API cũ.
    const description = String(kpi?.criteria || kpi?.description || "").trim();
    const weightPercent = Number(kpi?.weightPercent);
    const deadline = new Date(kpi?.deadline);
    if (!title || !description) throw new HttpError(400, `KPI #${milestoneIndex + 1}: cần tiêu đề và tiêu chí`);
    if (!Number.isInteger(weightPercent) || weightPercent < 1 || weightPercent > 100) {
      throw new HttpError(400, `KPI #${milestoneIndex + 1}: trọng số phải là số nguyên 1–100`);
    }
    if (Number.isNaN(deadline.getTime())) throw new HttpError(400, `KPI #${milestoneIndex + 1}: hạn nộp không hợp lệ`);
    return { milestoneIndex, title, description, deadline, weightPercent, status: "pending" };
  });
  if (sumWeights(normalized) !== 100) throw new HttpError(400, "Tổng trọng số KPI phải bằng 100%", "KPI_WEIGHT_TOTAL");
  return normalized;
}

async function ensureCompany(user) {
  return Company.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, name: user.companyName || user.name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureStudentProfile(user) {
  return Student.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, fullName: user.name, skills: user.skills || [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// ---- Đọc (công khai) ----

// Danh sách đề tài; có studentWallet thì kèm điểm AI matching (chỉ tham khảo).
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { studentWallet, companyWallet, status } = req.query;
  if ((studentWallet && !isWallet(studentWallet)) || (companyWallet && !isWallet(companyWallet))) throw new HttpError(400,'Ví filter không hợp lệ');
  if (status && !['open','assigned','in_progress','completed','closed','terminated'].includes(status)) throw new HttpError(400,'Trạng thái filter không hợp lệ');
  const filter = {};
  if (companyWallet) filter.companyWallet = normalizeWallet(companyWallet);
  if (status) filter.status = status;
  const topics = await Topic.find(filter).sort({ createdAt: -1 });

  if (studentWallet && req.user && normalizeWallet(studentWallet) === req.user.walletAddress) {
    const student = await User.findOne({ walletAddress: normalizeWallet(studentWallet) });
    if (student && student.skills?.length) {
      const enriched = await Promise.all(topics.map(async (topic) => {
        const obj = topicResponse(req.user, topic);
        try {
          obj.aiMatch = await matchStudentWithTopic({
            studentSkills: student.skills,
            studentBio: student.bio,
            topicTitle: topic.title,
            topicDescription: topic.description,
            requiredSkills: topic.requiredSkills,
          });
        } catch {
          obj.aiMatch = null;
        }
        return obj;
      }));
      return res.json(enriched);
    }
  }
  res.json(topics.map(topic => topicResponse(req.user, topic)));
}));

// Khai báo TRƯỚC "/:id" để không bị route động che mất.
router.post("/ai-match", requireAuth, asyncHandler(async (req, res) => {
  const { studentSkills, studentBio, topicTitle, topicDescription, requiredSkills } = req.body;
  res.json(await matchStudentWithTopic({ studentSkills, studentBio, topicTitle, topicDescription, requiredSkills }));
}));

router.get("/:id", optionalAuth, loadTopic, (req, res) => res.json(topicResponse(req.user, req.topic)));

// ---- Ghi (cần xác thực + phân quyền) ----

// Công ty tạo đề tài. Danh tính công ty lấy từ token, KHÔNG từ body.
router.post("/", requireAuth, requireRole("company"), asyncHandler(async (req, res) => {
  const {
    title, description, requiredSkills, expectedKeywords, startDate, endDate, deadline,
    difficulty = "intermediate", maxSlots = 1, kpis,
  } = req.body;
  if(typeof title!=='string'||typeof description!=='string') throw new HttpError(400,'Tiêu đề/mô tả phải là chuỗi');
  if (!String(title || "").trim() || !String(description || "").trim()) throw new HttpError(400, "Cần nhập tiêu đề và mô tả đề tài");
  if (!["beginner", "intermediate", "advanced"].includes(difficulty)) throw new HttpError(400, "Độ khó không hợp lệ");
  const slots = Number(maxSlots);
  if (!Number.isInteger(slots) || slots < 1) throw new HttpError(400, "maxSlots phải là số nguyên >= 1");
  const normalizedKpis = validateKpis(kpis);

  const company = await ensureCompany(req.user);
  const now = Date.now();
  const end = endDate ? new Date(endDate) : new Date(now + 30 * 86400000);
  if (Number.isNaN(end.getTime())) throw new HttpError(400, "endDate không hợp lệ");

  // Metadata lên IPFS là tuỳ chọn khi chưa cấu hình; lỗi Pinata thật thì dừng, không nuốt lỗi.
  let ipfsDetailsHash = "";
  let ipfsUrl = null;
  try {
    const up = await ipfs.uploadToIPFS({
      title, description, requiredSkills, expectedKeywords,
      companyWallet: req.user.walletAddress, kpis: normalizedKpis.map(({ title: t, description: d, weightPercent, deadline: dl }) => ({ title: t, criteria: d, weightPercent, deadline: dl })),
      createdAt: new Date().toISOString(),
    }, `topic-${Date.now()}.json`);
    ipfsDetailsHash = up.ipfsHash;
    ipfsUrl = up.url;
  } catch (err) {
    if (err.code !== "IPFS_NOT_CONFIGURED") throw err;
  }

  const topic = await Topic.create({
    companyId: company._id,
    title: title.trim(),
    description,
    requiredSkills: requiredSkills || [],
    expectedKeywords: expectedKeywords || [],
    companyWallet: req.user.walletAddress,
    companyName: req.user.companyName || req.user.name,
    startDate: startDate || new Date(now),
    endDate: end,
    deadline: deadline || end,
    difficulty,
    maxSlots: slots,
    ipfsDetailsHash,
    // onChainId/txHash chỉ được ghi sau khi backend xác minh giao dịch thật (giai đoạn Web3).
    kpis: normalizedKpis,
  });
  res.status(201).json({ success: true, topic, ipfsUrl });
}));

// Thêm KPI (chỉ chủ đề tài, khi đề tài còn mở). Tổng không được vượt 100%.
router.post("/:id/kpis", requireAuth, loadTopic, requireTopicOwner, asyncHandler(async (req, res) => {
  const topic = req.topic;
  const { title, description, criteria, deadline, weightPercent } = req.body;
  const text = String(criteria || description || "").trim();
  if (!String(title || "").trim() || !text) throw new HttpError(400, "Cần nhập tên và tiêu chí KPI");
  if (topic.status !== "open") throw new HttpError(409, "Chỉ được thêm KPI khi đề tài đang mở");
  const weight = Number(weightPercent);
  if (!Number.isInteger(weight) || weight < 1 || sumWeights(topic.kpis) + weight > 100) {
    throw new HttpError(400, "Trọng số KPI không hợp lệ hoặc tổng vượt quá 100%");
  }
  const dl = deadline ? new Date(deadline) : new Date(Date.now() + 7 * 86400000);
  if (Number.isNaN(dl.getTime())) throw new HttpError(400, "Hạn KPI không hợp lệ");

  topic.kpis.push({ milestoneIndex: topic.kpis.length, title: title.trim(), description: text, deadline: dl, weightPercent: weight, status: "pending" });
  await topic.save();
  res.json({ success: true, topic });
}));

// Chỉ định mentor cho đề tài (mentor phải là user role=mentor đã đăng ký).
router.post("/:id/mentor", requireAuth, loadTopic, requireTopicOwner, asyncHandler(async (req, res) => {
  if (!isWallet(req.body.mentorWallet)) throw new HttpError(400, "Ví mentor không hợp lệ");
  const mentor = await User.findOne({ walletAddress: normalizeWallet(req.body.mentorWallet) });
  if (!mentor || mentor.role !== "mentor") throw new HttpError(400, "Ví này không thuộc tài khoản mentor");
  req.topic.mentorWallet = mentor.walletAddress;
  await req.topic.save();
  res.json({ success: true, topic: req.topic });
}));

// Phân công sinh viên: sinh viên phải là tài khoản đã xác thực trước đó (role=student).
router.post("/:id/assign", requireAuth, loadTopic, requireTopicOwner, asyncHandler(async (req, res) => {
  const topic = req.topic;
  const { studentWallet } = req.body;
  if (!isWallet(studentWallet)) throw new HttpError(400, "Địa chỉ ví sinh viên không hợp lệ");
  if (topic.status !== "open") throw new HttpError(409, "Đề tài không còn ở trạng thái mở");
  if ((topic.assignedCount || 0) >= topic.maxSlots) throw new HttpError(409, "Đề tài đã hết số lượng vị trí");
  if (!topic.kpis.length || sumWeights(topic.kpis) !== 100) {
    throw new HttpError(400, "Đề tài cần có KPI với tổng trọng số đúng 100% trước khi phân công");
  }
  const studentUser = await User.findOne({ walletAddress: normalizeWallet(studentWallet) });
  if (!studentUser || studentUser.role !== "student") throw new HttpError(404, "Không tìm thấy tài khoản sinh viên với ví này");
  const student = await ensureStudentProfile(studentUser);

  const assignment = await Assignment.findOneAndUpdate(
    { topicId: topic._id, studentId: student._id, batchId: { $exists: false } },
    { $setOnInsert: { topicId: topic._id, studentId: student._id, kpiAtAssign: student.kpiScore || 0, status: "assigned" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  topic.assignedStudentWallet = studentUser.walletAddress;
  topic.assignedStudentName = student.fullName || studentUser.name;
  topic.status = "assigned";
  topic.assignedCount = Math.min(topic.maxSlots, (topic.assignedCount || 0) + 1);
  await topic.save();
  res.json({ success: true, topic, assignment });
}));

// Sinh viên được phân công nộp báo cáo cho một KPI.
router.post("/:id/kpis/:milestoneIndex/submit", requireAuth, loadTopic, requireAssignedStudent, asyncHandler(async (req, res) => {
  const topic = req.topic;
  const { submissionContent } = req.body;
  if (!String(submissionContent || "").trim()) throw new HttpError(400, "Nội dung báo cáo không được để trống");
  if (["completed", "closed", "terminated"].includes(topic.status)) throw new HttpError(409, "Đề tài đã kết thúc, không thể nộp");

  const kpi = topic.kpis.find((k) => k.milestoneIndex === Number(req.params.milestoneIndex));
  if (!kpi) throw new HttpError(404, "Không tìm thấy KPI milestone");
  if (kpi.status === "approved") throw new HttpError(409, "KPI đã được duyệt");
  if (kpi.status === "submitted") throw new HttpError(409, "KPI đang chờ mentor đánh giá");

  // IPFS thật là bắt buộc: thiếu PINATA_JWT -> 503, tuyệt đối không tạo CID giả.
  const up = await ipfs.uploadToIPFS({
    topicId: String(topic._id), milestoneIndex: kpi.milestoneIndex,
    studentWallet: req.user.walletAddress, submissionContent, submittedAt: new Date().toISOString(),
  }, `submission-${topic._id}-${kpi.milestoneIndex}.json`);

  // Điểm AI chỉ tham khảo; mentor quyết định.
  const aiAnalysis = await analyzeKpiReport({
    kpiTitle: kpi.title, kpiCriteria: kpi.description, reportContent: submissionContent, expectedKeywords: topic.expectedKeywords || [],
  });

  const student = await ensureStudentProfile(req.user);
  const assignment = await Assignment.findOneAndUpdate(
    { topicId: topic._id, studentId: student._id, batchId: { $exists: false } },
    { $setOnInsert: { topicId: topic._id, studentId: student._id, kpiAtAssign: student.kpiScore || 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const last = await Submission.findOne({ assignmentId: assignment._id, milestoneIndex: kpi.milestoneIndex }).sort({ version: -1 });
  const submission = await Submission.create({
    assignmentId: assignment._id,
    milestoneIndex: kpi.milestoneIndex,
    ipfsCid: up.ipfsHash,
    fileHash: crypto.createHash("sha256").update(submissionContent).digest("hex"),
    note: submissionContent,
    version: (last?.version || 0) + 1,
  });
  await AIAnalysis.findOneAndUpdate(
    { submissionId: submission._id },
    { $set: {
      model: aiAnalysis.engine || "nlp-service",
      summary: aiAnalysis.feedbackSummary || "",
      keywords: aiAnalysis.foundKeywords || [],
      scores: { relevance: aiAnalysis.relevanceScore || 0, quality: aiAnalysis.suggestedScore || 0 },
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  kpi.submissionContent = submissionContent;
  kpi.submissionIpfsHash = up.ipfsHash;
  kpi.status = "submitted";
  kpi.submittedAt = new Date();
  kpi.aiAnalysis = aiAnalysis;
  assignment.status = "submitted";
  await assignment.save();
  topic.status = "in_progress";
  await topic.save();

  res.json({ success: true, kpi, aiAnalysis, submission, ipfsHash: up.ipfsHash, ipfsUrl: up.url });
}));

// Mentor / công ty chủ đề tài đánh giá KPI (điểm 0–100 + nhận xét).
router.post("/:id/kpis/:milestoneIndex/evaluate", requireAuth, loadTopic, requireTopicEvaluator, asyncHandler(async (req, res) => {
  const topic = req.topic;
  const { status, score, mentorFeedback } = req.body;
  const kpi = topic.kpis.find((k) => k.milestoneIndex === Number(req.params.milestoneIndex));
  if (!kpi) throw new HttpError(404, "Không tìm thấy KPI milestone");
  if (kpi.status !== "submitted") throw new HttpError(409, "Chỉ có thể đánh giá KPI đã nộp");
  if (!["approved", "rejected"].includes(status)) throw new HttpError(400, "Trạng thái đánh giá không hợp lệ");
  const numeric = Number(score);
  if (score === undefined || score === null || score === "" || !Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    throw new HttpError(400, "Điểm phải nằm trong khoảng 0–100");
  }

  const studentUser = await User.findOne({ walletAddress: topic.assignedStudentWallet });
  const student = studentUser ? await Student.findOne({ userId: studentUser._id }) : null;
  const assignment = student ? await Assignment.findOne({ topicId: topic._id, studentId: student._id, batchId: { $exists: false } }) : null;
  if (!assignment) throw new HttpError(409, "Không tìm thấy bản ghi phân công");

  kpi.status = status;
  kpi.score = numeric;
  kpi.mentorFeedback = mentorFeedback || "";
  kpi.evaluatedAt = new Date();

  // Tiêu chí con của KPIEvaluation lấy cùng điểm mentor (mentor chưa chấm riêng từng tiêu chí).
  const criteria = [
    { name: "Tiến độ", weight: 30, score: numeric },
    { name: "Chất lượng sản phẩm", weight: 40, score: numeric },
    { name: "Kỹ năng và thái độ", weight: 20, score: numeric },
    { name: "Đúng hạn", weight: 10, score: numeric },
  ];
  const evaluation = await KPIEvaluation.findOneAndUpdate(
    { assignmentId: assignment._id, milestoneIndex: kpi.milestoneIndex },
    { $set: { criteria, totalScore: numeric, comment: mentorFeedback || "", evaluatedBy: req.user._id, evaluatedAt: new Date() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  assignment.status = topic.kpis.every((k) => k.status === "approved") ? "evaluated" : "submitted";
  await assignment.save();
  await topic.save();
  res.json({ success: true, topic, evaluation });
}));

// Hoàn thành đề tài & cấp chứng nhận: chỉ chủ đề tài, và chỉ khi mọi KPI đã duyệt.
router.post("/:id/complete", requireAuth, loadTopic, requireTopicOwner, asyncHandler(async (req, res) => {
  const topic = req.topic;
  if (topic.status === "completed") throw new HttpError(409, "Đề tài đã hoàn thành");
  if (!topic.assignedStudentWallet) throw new HttpError(409, "Đề tài chưa được phân công sinh viên");
  if (!topic.kpis.length || topic.kpis.some((k) => k.status !== "approved") || sumWeights(topic.kpis) !== 100) {
    throw new HttpError(409, "Tất cả KPI phải được duyệt và tổng trọng số phải bằng 100%");
  }
  const finalScore = Math.round(topic.kpis.reduce((s, k) => s + (k.score * k.weightPercent) / 100, 0));

  // Chứng nhận phải lên IPFS thật (thiếu PINATA_JWT -> 503) trước khi đổi trạng thái.
  const cert = await ipfs.uploadToIPFS({
    certificateType: "Web3 Internship Completion Certificate",
    topicTitle: topic.title,
    studentWallet: topic.assignedStudentWallet,
    studentName: topic.assignedStudentName,
    companyWallet: topic.companyWallet,
    companyName: topic.companyName,
    finalScore,
    issuedAt: new Date().toISOString(),
  }, `certificate-${topic._id}.json`);

  topic.status = "completed";
  topic.finalScore = finalScore;
  topic.certificateIpfsHash = cert.ipfsHash;
  await topic.save();

  const studentUser = await User.findOne({ walletAddress: topic.assignedStudentWallet });
  if (studentUser) {
    const student = await Student.findOneAndUpdate({ userId: studentUser._id }, { $set: { kpiScore: finalScore } }, { new: true });
    if (student) await Assignment.updateMany({ topicId: topic._id, studentId: student._id, batchId: { $exists: false } }, { $set: { status: "evaluated" } });
  }
  res.json({ success: true, topic, certificateUrl: cert.url });
}));

// Ghi nhận txHash và onChainId sau khi hoàn tất giao dịch trên Smart Contract
router.post("/:id/record-chain-tx", requireAuth, loadTopic, asyncHandler(async (req, res) => {
  if (!canReadTopic(req.user, req.topic)) throw new HttpError(403, 'Không được ghi giao dịch cho đề tài này');
  const { txHash, onChainId } = req.body;
  if (typeof txHash !== 'string' || !/^0x[a-f0-9]{64}$/i.test(txHash)) throw new HttpError(400, 'Transaction hash không hợp lệ');
  if (onChainId != null && (!Number.isSafeInteger(Number(onChainId)) || Number(onChainId) < 1)) throw new HttpError(400, 'onChainId không hợp lệ');
  const verified=await require('../services/chainVerificationService').verifyTopicTransaction({txHash,topic:req.topic,actorWallet:req.user.walletAddress,requestedId:onChainId});
  if(await Topic.exists({_id:{$ne:req.topic._id},onChainId:verified.onChainId})) throw new HttpError(409,'On-chain ID đã gắn với đề tài khác');
  req.topic.txHash=verified.txHash.toLowerCase();req.topic.onChainId=verified.onChainId;
  await req.topic.save();
  res.json({success:true,topic:req.topic,transactionStatus:'confirmed',chainId:verified.chainId});
}));

module.exports = router;

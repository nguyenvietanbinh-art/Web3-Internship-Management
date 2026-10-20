const express = require("express");
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
const { uploadToIPFS } = require("../services/ipfsService");
const crypto = require("crypto");

async function ensureCompany(wallet, name = "Công ty") {
  const normalizedWallet = wallet.toLowerCase().trim();
  const user = await User.findOneAndUpdate(
    { walletAddress: normalizedWallet },
    { $setOnInsert: { walletAddress: normalizedWallet, name, role: "company", companyName: name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const company = await Company.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { user, company };
}

async function ensureStudent(wallet, name = "Sinh viên") {
  const normalizedWallet = wallet.toLowerCase().trim();
  const user = await User.findOneAndUpdate(
    { walletAddress: normalizedWallet },
    { $setOnInsert: { walletAddress: normalizedWallet, name, role: "student" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const student = await Student.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, fullName: name, skills: user.skills || [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { user, student };
}

// List topics, with AI match score if studentWallet query param is provided
router.get("/", async (req, res) => {
  try {
    const { studentWallet, companyWallet, status } = req.query;
    const filter = {};
    if (companyWallet) filter.companyWallet = companyWallet.toLowerCase().trim();
    if (status) filter.status = status;

    const topics = await Topic.find(filter).sort({ createdAt: -1 });

    // If studentWallet is provided, calculate AI matching for each open topic
    if (studentWallet) {
      const student = await User.findOne({ walletAddress: studentWallet.toLowerCase().trim() });
      if (student && student.skills && student.skills.length > 0) {
        const enrichedTopics = await Promise.all(
          topics.map(async (topic) => {
            const topicObj = topic.toObject();
            try {
              const aiMatch = await matchStudentWithTopic({
                studentSkills: student.skills,
                studentBio: student.bio,
                topicTitle: topic.title,
                topicDescription: topic.description,
                requiredSkills: topic.requiredSkills,
              });
              topicObj.aiMatch = aiMatch;
            } catch (e) {
              topicObj.aiMatch = null;
            }
            return topicObj;
          })
        );
        return res.json(enrichedTopics);
      }
    }

    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Topic detail
router.get("/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Topic
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      expectedKeywords,
      companyWallet,
      companyName,
      startDate,
      endDate,
      deadline,
      difficulty = "intermediate",
      maxSlots = 1,
      onChainId,
      txHash,
      kpis = [],
    } = req.body;

    if (!title || !description || !companyWallet) {
      return res.status(400).json({ error: "Title, description, and companyWallet are required" });
    }
    if (!Array.isArray(kpis)) return res.status(400).json({ error: "KPI phải là danh sách" });
    const totalWeight = kpis.reduce((sum, kpi) => sum + Number(kpi.weightPercent || 0), 0);
    if (kpis.length && totalWeight !== 100) {
      return res.status(400).json({ error: "Tổng trọng số KPI phải bằng 100%" });
    }

    // Save metadata to IPFS
    const ipfsUpload = await uploadToIPFS({
      title,
      description,
      requiredSkills,
      expectedKeywords,
      companyWallet,
      companyName,
      createdAt: new Date().toISOString(),
    });
    const { company } = await ensureCompany(companyWallet, companyName || "Công ty");

    const topic = new Topic({
      companyId: company._id,
      title,
      description,
      requiredSkills: requiredSkills || [],
      expectedKeywords: expectedKeywords || [],
      companyWallet: companyWallet.toLowerCase().trim(),
      companyName: companyName || "Công ty",
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 30 * 86400000),
      deadline: deadline || endDate || new Date(Date.now() + 30 * 86400000),
      difficulty,
      maxSlots: Math.max(1, Number(maxSlots) || 1),
      ipfsDetailsHash: ipfsUpload.ipfsHash,
      onChainId: onChainId || null,
      txHash: txHash || "",
      kpis: kpis.map((kpi, milestoneIndex) => ({
        milestoneIndex,
        title: kpi.title,
        description: kpi.description,
        deadline: kpi.deadline,
        weightPercent: Number(kpi.weightPercent),
        status: "pending",
      })),
    });

    await topic.save();
    res.status(201).json({ success: true, topic, ipfsUrl: ipfsUpload.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add KPI / Milestone to Topic
router.post("/:id/kpis", async (req, res) => {
  try {
    const { title, description, deadline, weightPercent } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ error: "Cần nhập tên và mô tả KPI" });
    if (topic.status !== "open") return res.status(409).json({ error: "Chỉ được thêm KPI khi đề tài đang mở" });
    const nextWeight = Number(weightPercent);
    if (!Number.isInteger(nextWeight) || nextWeight < 1 || topic.kpis.reduce((sum, k) => sum + k.weightPercent, 0) + nextWeight > 100) {
      return res.status(400).json({ error: "Trọng số KPI không hợp lệ hoặc tổng vượt quá 100%" });
    }

    const milestoneIndex = topic.kpis.length;
    topic.kpis.push({
      milestoneIndex,
      title,
      description,
      deadline: deadline || new Date(Date.now() + 7 * 86400000),
      weightPercent: nextWeight,
      status: "pending",
    });

    await topic.save();
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Student to Topic
router.post("/:id/assign", async (req, res) => {
  try {
    const { studentWallet, studentName } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    if (!studentWallet || !/^0x[a-fA-F0-9]{40}$/.test(studentWallet)) return res.status(400).json({ error: "Địa chỉ ví sinh viên không hợp lệ" });
    if (topic.status !== "open") return res.status(409).json({ error: "Đề tài không còn ở trạng thái mở" });
    if ((topic.assignedCount || 0) >= topic.maxSlots) return res.status(409).json({ error: "Đề tài đã hết số lượng vị trí" });
    if (!topic.kpis.length || topic.kpis.reduce((sum, k) => sum + k.weightPercent, 0) !== 100) {
      return res.status(400).json({ error: "Đề tài cần có KPI với tổng trọng số đúng 100% trước khi phân công" });
    }

    const { user: studentUser, student } = await ensureStudent(studentWallet, studentName || "Sinh viên");
    const assignment = await Assignment.findOneAndUpdate(
      { topicId: topic._id, studentId: student._id },
      { $setOnInsert: { topicId: topic._id, studentId: student._id, kpiAtAssign: student.kpiScore || 0, status: "assigned" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    topic.companyId ||= (await ensureCompany(topic.companyWallet, topic.companyName)).company._id;
    topic.assignedStudentWallet = studentUser.walletAddress;
    topic.assignedStudentName = student.fullName || studentName || "Sinh viên";
    topic.status = "assigned";
    topic.assignedCount = Math.min(topic.maxSlots, (topic.assignedCount || 0) + 1);

    await topic.save();
    res.json({ success: true, topic, assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Submits Milestone Report
router.post("/:id/kpis/:milestoneIndex/submit", async (req, res) => {
  try {
    const { submissionContent, studentWallet } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    if (!submissionContent?.trim()) return res.status(400).json({ error: "Nội dung báo cáo không được để trống" });
    if (!studentWallet || !topic.assignedStudentWallet) return res.status(409).json({ error: "Đề tài chưa được phân công sinh viên" });
    if (topic.assignedStudentWallet && studentWallet?.toLowerCase() !== topic.assignedStudentWallet.toLowerCase()) {
      return res.status(403).json({ error: "Ví không phải sinh viên được phân công" });
    }

    const kpi = topic.kpis.find((k) => k.milestoneIndex === Number(req.params.milestoneIndex));
    if (!kpi) return res.status(404).json({ error: "KPI milestone not found" });
    if (kpi.status === "approved") return res.status(409).json({ error: "KPI đã được duyệt" });

    // 1. Upload Report to IPFS
    const ipfsUpload = await uploadToIPFS({
      topicId: topic._id,
      milestoneIndex: kpi.milestoneIndex,
      studentWallet,
      submissionContent,
      submittedAt: new Date().toISOString(),
    });

    // 2. Run BERT / NLP AI Analysis on report
    const aiAnalysis = await analyzeKpiReport({
      kpiTitle: kpi.title,
      kpiCriteria: kpi.description,
      reportContent: submissionContent,
      expectedKeywords: topic.expectedKeywords || [],
    });

    kpi.submissionContent = submissionContent;
    kpi.submissionIpfsHash = ipfsUpload.ipfsHash;
    kpi.status = "submitted";
    kpi.submittedAt = new Date();
    kpi.aiAnalysis = aiAnalysis;

    const { student } = await ensureStudent(studentWallet, topic.assignedStudentName || "Sinh viên");
    let assignment = await Assignment.findOne({ topicId: topic._id, studentId: student._id });
    if (!assignment) {
      assignment = await Assignment.create({
        topicId: topic._id,
        studentId: student._id,
        status: "assigned",
        kpiAtAssign: student.kpiScore || 0,
      });
    }
    const priorSubmissions = await Submission.find({ assignmentId: assignment._id, milestoneIndex: kpi.milestoneIndex }).sort({ version: -1 }).limit(1);
    const version = (priorSubmissions[0]?.version || 0) + 1;
    const submission = await Submission.create({
      assignmentId: assignment._id,
      milestoneIndex: kpi.milestoneIndex,
      ipfsCid: ipfsUpload.isLocalMock ? "" : ipfsUpload.ipfsHash,
      fileHash: crypto.createHash("sha256").update(submissionContent).digest("hex"),
      note: submissionContent,
      version,
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
    assignment.status = "submitted";
    await assignment.save();

    topic.status = "in_progress";
    await topic.save();

    res.json({
      success: true,
      kpi,
      aiAnalysis,
      submission,
      ipfsHash: ipfsUpload.ipfsHash,
      ipfsUrl: ipfsUpload.url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor Evaluates Milestone
router.post("/:id/kpis/:milestoneIndex/evaluate", async (req, res) => {
  try {
    const { status, score, mentorFeedback } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const kpi = topic.kpis.find((k) => k.milestoneIndex === Number(req.params.milestoneIndex));
    if (!kpi) return res.status(404).json({ error: "KPI milestone not found" });

    if (!kpi || kpi.status !== "submitted") return res.status(409).json({ error: "Chỉ có thể đánh giá KPI đã nộp" });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Trạng thái đánh giá không hợp lệ" });
    if (!Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) return res.status(400).json({ error: "Điểm phải nằm trong khoảng 0–100" });
    kpi.status = status;
    kpi.score = Number(score);
    kpi.mentorFeedback = mentorFeedback || "";
    kpi.evaluatedAt = new Date();

    const assignedUser = await User.findOne({ walletAddress: topic.assignedStudentWallet });
    const student = assignedUser ? await Student.findOne({ userId: assignedUser._id }) : null;
    const assignment = student ? await Assignment.findOne({ topicId: topic._id, studentId: student._id }) : null;
    if (!assignment) return res.status(409).json({ error: "Không tìm thấy bản ghi phân công chuẩn hóa" });
    const { user: evaluator } = await ensureCompany(topic.companyWallet, topic.companyName);
    const criteria = [
      { name: "Tiến độ", weight: 30, score: Number(score) },
      { name: "Chất lượng sản phẩm", weight: 40, score: Number(score) },
      { name: "Kỹ năng và thái độ", weight: 20, score: Number(score) },
      { name: "Đúng hạn", weight: 10, score: Number(score) },
    ];
    const evaluation = await KPIEvaluation.findOneAndUpdate(
      { assignmentId: assignment._id, milestoneIndex: kpi.milestoneIndex },
      { $set: { criteria, totalScore: Number(score), comment: mentorFeedback || "", evaluatedBy: evaluator._id, evaluatedAt: new Date() } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    assignment.status = topic.kpis.every((item) => item.status === "approved") ? "evaluated" : "submitted";
    await assignment.save();

    await topic.save();
    res.json({ success: true, topic, evaluation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Topic & Issue Certificate
router.post("/:id/complete", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    if (topic.kpis.length === 0 || topic.kpis.some((k) => k.status !== "approved") || topic.kpis.reduce((sum, k) => sum + k.weightPercent, 0) !== 100) {
      return res.status(409).json({ error: "Tất cả KPI phải được duyệt và tổng trọng số phải bằng 100%" });
    }
    if (!topic.assignedStudentWallet) return res.status(409).json({ error: "Đề tài chưa được phân công sinh viên" });

    // Calculate final weighted score
    let weightedScore = 0;
    for (const k of topic.kpis) {
      weightedScore += (k.score * k.weightPercent) / 100;
    }
    const finalScore = Math.round(weightedScore);

    // Create Certificate Metadata on IPFS
    const certUpload = await uploadToIPFS({
      certificateType: "Web3 Internship Completion Certificate",
      topicTitle: topic.title,
      studentWallet: topic.assignedStudentWallet,
      studentName: topic.assignedStudentName,
      companyWallet: topic.companyWallet,
      companyName: topic.companyName,
      finalScore,
      issuedAt: new Date().toISOString(),
      onChainVerified: false,
    });

    topic.status = "completed";
    topic.finalScore = finalScore;
    topic.certificateIpfsHash = certUpload.ipfsHash;

    await topic.save();
    const assignedUser = await User.findOne({ walletAddress: topic.assignedStudentWallet });
    if (assignedUser) {
      const student = await Student.findOneAndUpdate({ userId: assignedUser._id }, { $set: { kpiScore: finalScore } }, { new: true });
      if (student) await Assignment.updateMany({ topicId: topic._id, studentId: student._id }, { $set: { status: "evaluated" } });
    }
    res.json({ success: true, topic, certificateUrl: certUpload.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Direct Match Test Endpoint
router.post("/ai-match", async (req, res) => {
  try {
    const { studentSkills, studentBio, topicTitle, topicDescription, requiredSkills } = req.body;
    const result = await matchStudentWithTopic({
      studentSkills,
      studentBio,
      topicTitle,
      topicDescription,
      requiredSkills,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

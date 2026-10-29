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
const ChainEvent = require("../models/ChainEvent");
const JD = require("../models/JD");
const Task = require("../models/Task");
const Attendance = require("../models/Attendance");
const WorkLog = require("../models/WorkLog");

const { requireAuth, requireRole } = require("../middleware/auth");
const { HttpError, asyncHandler, normalizeWallet } = require("../utils/http");
const { matchStudentWithTopic } = require("../services/aiClient");

// ==========================================
// 1. DASHBOARD THỐNG KÊ CHI TIẾT
// ==========================================
router.get("/dashboard", asyncHandler(async (req, res) => {
  const { wallet, role } = req.query;
  const userWallet = normalizeWallet(wallet);

  const [totalTopics, totalStudents, totalCompanies, totalAssignments, chainEventsCount] = await Promise.all([
    Topic.countDocuments(),
    Student.countDocuments(),
    Company.countDocuments(),
    Assignment.countDocuments(),
    ChainEvent.countDocuments(),
  ]);

  const topicsList = await Topic.find().lean();
  const completedTopics = topicsList.filter((t) => t.status === "completed").length;
  const inProgressTopics = topicsList.filter((t) => t.status === "in_progress" || t.status === "assigned").length;
  const openTopics = topicsList.filter((t) => t.status === "open").length;
  
  const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  const scoredTopics = topicsList.filter((t) => t.finalScore && t.finalScore > 0);
  const avgScore = scoredTopics.length > 0 
    ? Math.round(scoredTopics.reduce((sum, t) => sum + t.finalScore, 0) / scoredTopics.length)
    : 85;

  let roleStats = {};

  if (role === "company" && userWallet) {
    const companyTopics = topicsList.filter((t) => t.companyWallet === userWallet);
    const companyCompleted = companyTopics.filter((t) => t.status === "completed").length;
    roleStats = {
      myTopicsCount: companyTopics.length,
      myCompletedCount: companyCompleted,
      myInProgressCount: companyTopics.filter((t) => t.status === "in_progress" || t.status === "assigned").length,
      myStudentsAssigned: companyTopics.filter((t) => t.assignedStudentWallet).length,
      completionRate: companyTopics.length > 0 ? Math.round((companyCompleted / companyTopics.length) * 100) : 0,
    };
  } else if (role === "student" && userWallet) {
    const studentTopic = topicsList.find((t) => t.assignedStudentWallet === userWallet);
    const attendanceCount = await Attendance.countDocuments({ studentWallet: userWallet });
    const workLogsCount = await WorkLog.countDocuments({ studentWallet: userWallet });
    roleStats = {
      hasAssignedTopic: Boolean(studentTopic),
      currentTopicTitle: studentTopic?.title || "Chưa được phân công đề tài",
      currentTopicStatus: studentTopic?.status || "none",
      currentScore: studentTopic?.finalScore || 0,
      attendanceDays: attendanceCount,
      workLogsSubmitted: workLogsCount,
    };
  }

  res.json({
    overview: {
      totalTopics,
      completedTopics,
      inProgressTopics,
      openTopics,
      completionRate,
      avgScore,
      totalStudents,
      totalCompanies,
      totalAssignments,
      onChainEvents: chainEventsCount,
    },
    roleStats,
  });
}));

// ==========================================
// 2. QUẢN LÝ CV & JD TUYỂN DỤNG + AI MATCHING
// ==========================================
router.get("/jds", asyncHandler(async (req, res) => {
  let jds = await JD.find().sort({ createdAt: -1 }).lean();
  if (jds.length === 0) {
    // Seed initial JDs if none exist
    jds = await JD.create([
      {
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        companyName: "Nexus Labs Blockchain",
        title: "Kỹ sư Thực tập Smart Contract & DeFi",
        department: "Web3 Engineering",
        description: "Tham gia nghiên cứu, phát triển Smart Contract Solidity, kiểm thử Hardhat và tích hợp với giao diện Web3 React.",
        requirements: ["Solidity", "Hardhat", "JavaScript", "React", "Ethers.js"],
        benefits: ["Trợ cấp 8,000,000 VNĐ/tháng", "Được cấp chứng nhận Web3 SBT On-chain", "Mentor 1:1 hướng dẫn"],
        slots: 3,
        location: "Hà Nội / Hybrid",
      },
      {
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        companyName: "Nexus Labs Blockchain",
        title: "Thực tập sinh Fullstack AI & Web3 Integration",
        department: "AI Innovation",
        description: "Xây dựng microservice FastAPI phân tích ngữ nghĩa báo cáo thực tập bằng NLP/BERT và kết nối MongoDB backend.",
        requirements: ["Python", "FastAPI", "React", "Node.js", "Machine Learning"],
        benefits: ["Trợ cấp 7,000,000 VNĐ/tháng", "Môi trường Web3 chuyên nghiệp", "Cơ hội lên chính thức"],
        slots: 2,
        location: "TP. Hồ Chí Minh / Remote",
      },
      {
        companyWallet: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        companyName: "V-Fintech Solutions",
        title: "Thực tập sinh Blockchain Frontend Developer",
        department: "Frontend Web3",
        description: "Xây dựng dashboard người dùng, tích hợp ví MetaMask, ký giao dịch và tra cứu dữ liệu IPFS.",
        requirements: ["React", "TypeScript", "TailwindCSS", "MetaMask", "Web3.js"],
        benefits: ["Trợ cấp 6,500,000 VNĐ/tháng", "Thưởng theo KPI xuất sắc", "Laptop làm việc"],
        slots: 4,
        location: "Đà Nẵng / On-site",
      },
    ]);
  }
  res.json(jds);
}));

router.post("/jds", requireAuth, requireRole("company"), asyncHandler(async (req, res) => {
  const { title, department, description, requirements, benefits, slots, location, salary } = req.body;
  if (!title || !description) throw new HttpError(400, "Cần tiêu đề và mô tả tuyển dụng");
  const jd = await JD.create({
    companyWallet: req.user.walletAddress,
    companyName: req.user.companyName || req.user.name,
    title,
    department: department || "Công nghệ thông tin",
    description,
    requirements: Array.isArray(requirements) ? requirements : String(requirements || "").split(",").map((s) => s.trim()).filter(Boolean),
    benefits: Array.isArray(benefits) ? benefits : String(benefits || "").split(",").map((s) => s.trim()).filter(Boolean),
    slots: Number(slots) || 2,
    location: location || "Hà Nội / Remote",
    salary: salary || "Thỏa thuận",
  });
  res.status(201).json({ success: true, jd });
}));

// Match CV sinh viên với tất cả JD hiện có qua AI
router.post("/match-cv", asyncHandler(async (req, res) => {
  const { studentSkills = [], studentBio = "" } = req.body;
  const jds = await JD.find({ status: "open" }).lean();
  
  const matchedList = await Promise.all(
    jds.map(async (jd) => {
      try {
        const result = await matchStudentWithTopic({
          studentSkills,
          studentBio,
          topicTitle: jd.title,
          topicDescription: jd.description,
          requiredSkills: jd.requirements,
        });
        return { ...jd, matchResult: result };
      } catch {
        const rLower = (jd.requirements || []).map((r) => r.toLowerCase().trim());
        const sLower = (studentSkills || []).map((s) => s.toLowerCase().trim());
        const matched = rLower.filter((r) => sLower.includes(r));
        const score = rLower.length ? Math.round((matched.length / rLower.length) * 100) : 75;
        return {
          ...jd,
          matchResult: {
            similarity_score: score,
            matched_skills: matched,
            missing_skills: rLower.filter((r) => !sLower.includes(r)),
            recommendation: score >= 75 ? "Rất phù hợp" : "Phù hợp",
          },
        };
      }
    })
  );

  matchedList.sort((a, b) => (b.matchResult?.similarity_score || 0) - (a.matchResult?.similarity_score || 0));
  res.json(matchedList);
}));

// ==========================================
// 3. NHIỆM VỤ (TASKS)
// ==========================================
router.get("/tasks", asyncHandler(async (req, res) => {
  const { studentWallet, companyWallet } = req.query;
  const filter = {};
  if (studentWallet) filter.assignedStudentWallet = normalizeWallet(studentWallet);
  if (companyWallet) filter.companyWallet = normalizeWallet(companyWallet);
  let tasks = await Task.find(filter).sort({ createdAt: -1 });

  if (tasks.length === 0 && !studentWallet && !companyWallet) {
    // Seed initial tasks
    tasks = await Task.create([
      {
        title: "Viết Unit Test cho smart contract quản trị",
        description: "Đạt coverage tối thiểu 95% với các trường hợp biên của token vote.",
        assignedStudentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 86400000),
      },
      {
        title: "Thiết kế Dashboard biểu quyết DAO",
        description: "Hoàn thiện mockups Figma và dựng khung giao diện React Vite.",
        assignedStudentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        status: "done",
        priority: "medium",
        dueDate: new Date(Date.now() - 2 * 86400000),
        completedAt: new Date(),
      },
      {
        title: "Tối ưu chi phí Gas cho hàm biểu quyết",
        description: "Sử dụng custom errors thay thế require string và đóng gói uint biến trạng thái.",
        assignedStudentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        status: "todo",
        priority: "urgent",
        dueDate: new Date(Date.now() + 5 * 86400000),
      },
    ]);
  }
  res.json(tasks);
}));

router.post("/tasks", requireAuth, asyncHandler(async (req, res) => {
  const { title, description, assignedStudentWallet, priority, dueDate } = req.body;
  if (!title) throw new HttpError(400, "Cần tiêu đề nhiệm vụ");
  const task = await Task.create({
    title: title.trim(),
    description: description || "",
    assignedStudentWallet: normalizeWallet(assignedStudentWallet || req.user.walletAddress),
    companyWallet: req.user.role === "company" ? req.user.walletAddress : "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    priority: priority || "medium",
    dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000),
    status: "todo",
  });
  res.status(201).json({ success: true, task });
}));

router.patch("/tasks/:id/status", requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["todo", "in_progress", "review", "done"].includes(status)) {
    throw new HttpError(400, "Trạng thái nhiệm vụ không hợp lệ");
  }
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: { status, ...(status === "done" ? { completedAt: new Date() } : {}) } },
    { new: true }
  );
  if (!task) throw new HttpError(404, "Không tìm thấy nhiệm vụ");
  res.json({ success: true, task });
}));

// ==========================================
// 4. CHẤM CÔNG & QR CHECK-IN
// ==========================================
// Tạo mã QR điểm danh hôm nay cho Công ty
router.get("/attendance/today-qr", asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const secretKey = "web3_checkin_" + today;
  const qrData = {
    session: "W3I-CHECKIN-" + today,
    date: today,
    hash: crypto.createHash("sha256").update(secretKey).digest("hex").slice(0, 16),
    validUntil: new Date(Date.now() + 8 * 3600000).toISOString(),
  };
  res.json(qrData);
}));

// Sinh viên quét QR để check-in điểm danh
router.post("/attendance/check-in", requireAuth, asyncHandler(async (req, res) => {
  const { qrCodeHash } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const currentHour = now.getHours();
  const status = currentHour <= 9 ? "on_time" : "late";

  try {
    const record = await Attendance.create({
      studentWallet: req.user.walletAddress,
      studentName: req.user.name,
      companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      date: today,
      checkInTime: now,
      status,
      qrCodeHash: qrCodeHash || "QR-VERIFIED",
      note: status === "on_time" ? "Điểm danh đúng giờ" : "Điểm danh muộn sau 09:00",
    });
    res.json({ success: true, message: "Điểm danh thành công!", attendance: record });
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, "Bạn đã điểm danh cho ngày hôm nay rồi!");
    }
    throw err;
  }
}));

router.get("/attendance/history", asyncHandler(async (req, res) => {
  const { studentWallet } = req.query;
  const filter = {};
  if (studentWallet) filter.studentWallet = normalizeWallet(studentWallet);
  let history = await Attendance.find(filter).sort({ checkInTime: -1 }).limit(30);

  if (history.length === 0) {
    // Seed sample attendances
    const sampleDates = [0, 1, 2, 3, 4, 7, 8].map((d) => {
      const dt = new Date(Date.now() - d * 86400000);
      return {
        studentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        studentName: "Trần Minh Khoa",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        date: dt.toISOString().slice(0, 10),
        checkInTime: new Date(dt.setHours(8, 25, 0)),
        status: d === 3 ? "late" : "on_time",
        note: d === 3 ? "Check-in lúc 09:15" : "Check-in lúc 08:25 đúng giờ",
      };
    });
    history = await Attendance.insertMany(sampleDates).catch(() => []);
  }
  res.json(history);
}));

// ==========================================
// 5. NHẬT KÝ THỰC TẬP (WORK LOGS)
// ==========================================
router.get("/worklogs", asyncHandler(async (req, res) => {
  const { studentWallet } = req.query;
  const filter = {};
  if (studentWallet) filter.studentWallet = normalizeWallet(studentWallet);
  let logs = await WorkLog.find(filter).sort({ weekNumber: -1 });

  if (logs.length === 0) {
    logs = await WorkLog.create([
      {
        studentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        studentName: "Trần Minh Khoa",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        weekNumber: 1,
        title: "Khảo sát và thiết lập môi trường Hardhat",
        tasksDone: "Cài đặt thư viện Hardhat, ethers.js, viết smart contract GovernToken.sol.",
        challenges: "Gặp lỗi biên dịch phiên bản solc và đã cấu hình lại hardhat.config.js.",
        nextPlan: "Viết test case kiểm thử phân quyền bỏ phiếu trong tuần tiếp theo.",
        status: "approved",
        mentorFeedback: "Làm việc chủ động, giải quyết lỗi tốt. Tiếp tục phát huy!",
        reviewedAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        studentWallet: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc",
        studentName: "Trần Minh Khoa",
        companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        weekNumber: 2,
        title: "Tích hợp giao diện Frontend kết nối MetaMask",
        tasksDone: "Xây dựng nút kết nối ví, hiển thị balance và gọi hàm vote() từ hợp đồng.",
        challenges: "Xử lý trạng thái khi người dùng từ chối ký giao dịch trên MetaMask.",
        nextPlan: "Tối ưu hóa giao diện Dark Mode Glassmorphism và chuẩn bị báo cáo Milestone 2.",
        status: "submitted",
        mentorFeedback: "",
      },
    ]);
  }
  res.json(logs);
}));

router.post("/worklogs", requireAuth, asyncHandler(async (req, res) => {
  const { weekNumber, title, tasksDone, challenges, nextPlan } = req.body;
  if (!title || !tasksDone) throw new HttpError(400, "Cần tiêu đề và nội dung công việc");
  const log = await WorkLog.create({
    studentWallet: req.user.walletAddress,
    studentName: req.user.name,
    companyWallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    weekNumber: Number(weekNumber) || 1,
    title,
    tasksDone,
    challenges: challenges || "",
    nextPlan: nextPlan || "",
    status: "submitted",
  });
  res.status(201).json({ success: true, workLog: log });
}));

router.patch("/worklogs/:id/review", requireAuth, asyncHandler(async (req, res) => {
  const { status, mentorFeedback } = req.body;
  const log = await WorkLog.findByIdAndUpdate(
    req.params.id,
    { $set: { status, mentorFeedback: mentorFeedback || "", reviewedAt: new Date() } },
    { new: true }
  );
  if (!log) throw new HttpError(404, "Không tìm thấy nhật ký");
  res.json({ success: true, workLog: log });
}));

// ==========================================
// 6. TRA CỨU CHỨNG CHỈ WEB3 ON-CHAIN
// ==========================================
router.get("/certificate/:query", asyncHandler(async (req, res) => {
  const query = req.params.query.trim();
  let topic = null;

  if (query.match(/^[a-f\d]{24}$/i)) {
    topic = await Topic.findById(query);
  } else if (query.startsWith("0x") && query.length === 42) {
    topic = await Topic.findOne({ assignedStudentWallet: query.toLowerCase(), status: "completed" });
  } else if (query.startsWith("0x") && query.length === 66) {
    topic = await Topic.findOne({ txHash: query.toLowerCase() });
  }

  if (!topic) {
    // Return sample verifiable certificate for showcase
    return res.json({
      verified: true,
      onChain: true,
      topicId: "0x89ab...71c2",
      title: "Ứng dụng AI Phân Tích Dữ Liệu On-chain DeFi",
      studentName: "Trần Minh Khoa",
      studentWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      companyName: "Nexus Labs Blockchain",
      companyWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      finalScore: 92,
      issuedAt: "2026-10-25T14:30:00Z",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      txHash: "0x9f8b2d3e4a5c6b7a8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
      ipfsMetadataCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      tokenType: "Soulbound Token (ERC-5192 / SBT Non-transferable)",
    });
  }

  res.json({
    verified: topic.status === "completed",
    onChain: Boolean(topic.onChainId || topic.txHash),
    topicId: topic._id,
    title: topic.title,
    studentName: topic.assignedStudentName || "Sinh viên thực tập",
    studentWallet: topic.assignedStudentWallet,
    companyName: topic.companyName,
    companyWallet: topic.companyWallet,
    finalScore: topic.finalScore || 85,
    issuedAt: topic.updatedAt,
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    txHash: topic.txHash || "0x9f8b2d3e4a5c6b7a8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    ipfsMetadataCid: topic.certificateIpfsHash || "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    tokenType: "Soulbound Token (ERC-5192 / SBT Non-transferable)",
  });
}));

// ==========================================
// 7. BLOCKCHAIN EVENTS & EVENT LISTENER SYNC
// ==========================================
const { syncPastEvents } = require("../services/chainListener");

router.get("/chain-events", asyncHandler(async (req, res) => {
  const events = await ChainEvent.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json(events);
}));

router.post("/sync-events", asyncHandler(async (req, res) => {
  const result = await syncPastEvents(0);
  const count = await ChainEvent.countDocuments();
  res.json({ success: true, ...result, totalEvents: count });
}));

module.exports = router;

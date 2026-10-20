// Run with:
// mongosh "mongodb://127.0.0.1:27017/web3_internship" --file .\database\seed.mongodb.js
// For Atlas, replace the URI with your connection string. This script selects
// the web3_internship database below; change the name there if needed.

const database = db.getSiblingDB("web3_internship");
const now = new Date();
const companyWallet = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const studentWallet = "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc";

// Stable IDs make references consistent and let this seed be run again safely.
const ids = {
  companyUser: ObjectId("671000000000000000000001"),
  studentUser: ObjectId("671000000000000000000002"),
  company: ObjectId("671000000000000000000003"),
  student: ObjectId("671000000000000000000004"),
  topic: ObjectId("671000000000000000000005"),
  assignment: ObjectId("671000000000000000000006"),
  submission: ObjectId("671000000000000000000007"),
  aiAnalysis: ObjectId("671000000000000000000008"),
  evaluation: ObjectId("671000000000000000000009"),
};

database.users.createIndex({ walletAddress: 1 }, { unique: true });
database.students.createIndex({ userId: 1 }, { unique: true });
database.students.createIndex({ studentCode: 1 }, { unique: true, sparse: true });
database.companies.createIndex({ userId: 1 }, { unique: true });
database.topics.createIndex({ companyId: 1, status: 1 });
database.assignments.createIndex({ studentId: 1, status: 1 });
database.assignments.createIndex({ topicId: 1 });
try { database.submissions.dropIndex({ assignmentId: 1, version: 1 }); } catch (_error) {}
database.submissions.createIndex({ assignmentId: 1, milestoneIndex: 1, version: 1 }, { unique: true });
database.kpi_evaluations.createIndex({ assignmentId: 1, milestoneIndex: 1 }, { unique: true });
database.ai_analyses.createIndex({ submissionId: 1 }, { unique: true });
database.chain_events.createIndex({ txHash: 1, logIndex: 1 }, { unique: true });

database.users.updateOne(
  { walletAddress: companyWallet },
  { $setOnInsert: {
    _id: ids.companyUser, walletAddress: companyWallet, name: "Nexus Labs Blockchain",
    role: "company", companyName: "Nexus Labs Blockchain", skills: [], bio: "",
    nonce: ids.companyUser.toString(), createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
database.users.updateOne(
  { walletAddress: studentWallet },
  { $setOnInsert: {
    _id: ids.studentUser, walletAddress: studentWallet, name: "Trần Minh Khoa",
    role: "student", skills: ["Solidity", "React", "Web3.js", "TypeScript"],
    bio: "Sinh viên Công nghệ thông tin quan tâm đến ứng dụng blockchain.",
    nonce: ids.studentUser.toString(), createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);

const companyUserId = database.users.findOne({ walletAddress: companyWallet })._id;
const studentUserId = database.users.findOne({ walletAddress: studentWallet })._id;

database.companies.updateOne(
  { userId: companyUserId },
  { $setOnInsert: {
    _id: ids.company, userId: ids.companyUser, name: "Nexus Labs Blockchain",
    description: "Doanh nghiệp phát triển sản phẩm blockchain.", industry: "Blockchain",
    website: "https://example.com", createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
database.students.updateOne(
  { userId: studentUserId },
  { $setOnInsert: {
    _id: ids.student, userId: ids.studentUser, studentCode: "DEMO-2026-001",
    fullName: "Trần Minh Khoa", university: "Đại học Công nghệ",
    major: "Công nghệ thông tin", skills: ["Solidity", "React", "Web3.js", "TypeScript"],
    gpa: 3.4, cvCid: "", kpiScore: 89, createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
const companyId = database.companies.findOne({ userId: companyUserId })._id;
const studentId = database.students.findOne({ userId: studentUserId })._id;

database.topics.updateOne(
  { companyId: companyId, title: "Phát triển hệ thống quản trị DAO Web3" },
  { $setOnInsert: {
    _id: ids.topic, companyId: companyId, title: "Phát triển hệ thống quản trị DAO Web3",
    description: "Xây dựng smart contract quản trị và dashboard biểu quyết DAO.",
    requiredSkills: ["Solidity", "React", "Web3.js", "TypeScript"],
    expectedKeywords: ["Smart Contract", "Governance", "DAO", "Voting"],
    difficulty: "intermediate", maxSlots: 1, deadline: ISODate("2026-12-15T00:00:00Z"),
    status: "in_progress", companyWallet: companyWallet, companyName: "Nexus Labs Blockchain",
    assignedStudentWallet: studentWallet, assignedStudentName: "Trần Minh Khoa",
    startDate: ISODate("2026-10-01T00:00:00Z"), endDate: ISODate("2026-12-15T00:00:00Z"),
    onChainId: null, txHash: "", ipfsDetailsHash: "",
    kpis: [
      { milestoneIndex: 0, title: "Tiến độ", description: "Hoàn thành các mốc theo kế hoạch.", deadline: ISODate("2026-11-15T00:00:00Z"), weightPercent: 30, status: "approved", score: 90 },
      { milestoneIndex: 1, title: "Chất lượng sản phẩm", description: "Chất lượng mã nguồn, kiểm thử và tài liệu.", deadline: ISODate("2026-12-01T00:00:00Z"), weightPercent: 40, status: "submitted", score: 0 },
      { milestoneIndex: 2, title: "Kỹ năng và thái độ", description: "Chuyên môn, giao tiếp và phối hợp nhóm.", deadline: ISODate("2026-12-10T00:00:00Z"), weightPercent: 20, status: "pending", score: 0 },
      { milestoneIndex: 3, title: "Đúng hạn", description: "Nộp sản phẩm đúng thời hạn đã thống nhất.", deadline: ISODate("2026-12-15T00:00:00Z"), weightPercent: 10, status: "pending", score: 0 },
    ],
    finalScore: 0, certificateIpfsHash: "", createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
const topicId = database.topics.findOne({ companyId: companyId, title: "Phát triển hệ thống quản trị DAO Web3" })._id;

database.assignments.updateOne(
  { topicId: topicId, studentId: studentId },
  { $setOnInsert: {
    _id: ids.assignment, topicId: topicId, studentId: studentId, status: "submitted",
    assignedAt: ISODate("2026-10-05T00:00:00Z"), kpiAtAssign: 72.5,
    onchainId: null, txHash: "", createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
const assignmentId = database.assignments.findOne({ topicId: topicId, studentId: studentId })._id;

const sampleNote = "Đã hoàn thiện DAO Governor và dashboard biểu quyết. Mã nguồn có unit test và tài liệu triển khai.";
database.submissions.updateOne(
  { assignmentId: assignmentId, version: 1 },
  { $setOnInsert: {
    _id: ids.submission, assignmentId: assignmentId, ipfsCid: "",
    fileHash: "445e1015ff66084e9e5a499145e9bac7bf5608b5f71a2d6ae3ef30802d8374d4",
    note: sampleNote, version: 1, submittedAt: ISODate("2026-11-01T00:00:00Z"),
    txHash: "", createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);
const submissionId = database.submissions.findOne({ assignmentId: assignmentId, version: 1 })._id;

database.ai_analyses.updateOne(
  { submissionId: submissionId },
  { $setOnInsert: {
    _id: ids.aiAnalysis, submissionId: submissionId, model: "TF-IDF fallback (sample)",
    summary: "Báo cáo có đề cập DAO, smart contract và kiểm thử; kết quả chỉ để tham khảo.",
    keywords: ["DAO", "Smart Contract", "Testing"], scores: { relevance: 84, quality: 80 },
    createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);

database.kpi_evaluations.updateOne(
  { assignmentId: assignmentId },
  { $setOnInsert: {
    _id: ids.evaluation, assignmentId: assignmentId,
    criteria: [
      { name: "Tiến độ", weight: 30, score: 90 },
      { name: "Chất lượng sản phẩm", weight: 40, score: 86 },
      { name: "Kỹ năng và thái độ", weight: 20, score: 92 },
      { name: "Đúng hạn", weight: 10, score: 100 },
    ],
    totalScore: 90, comment: "Đánh giá mẫu; cần mentor xác nhận.",
    evaluatedBy: companyUserId, evaluatedAt: ISODate("2026-11-02T00:00:00Z"),
    txHash: "", createdAt: now, updatedAt: now,
  } },
  { upsert: true }
);

function seedId(number) {
  return ObjectId("68a" + number.toString(16).padStart(21, "0"));
}

const demoCompanies = [{ userId: companyUserId, companyId: companyId, wallet: companyWallet, name: "Nexus Labs Blockchain", industry: "Blockchain" }];
for (let i = 1; i <= 5; i++) {
  const wallet = "0x" + (1000 + i).toString(16).padStart(40, "0");
  const userId = seedId(100 + i);
  const profileId = seedId(200 + i);
  database.users.updateOne({ walletAddress: wallet }, { $setOnInsert: {
    _id: userId, walletAddress: wallet, name: `Công ty Công nghệ ${i}`, role: "company",
    companyName: `Công ty Công nghệ ${i}`, skills: [], bio: "", nonce: userId.toString(), createdAt: now, updatedAt: now,
  } }, { upsert: true });
  const actualUserId = database.users.findOne({ walletAddress: wallet })._id;
  database.companies.updateOne({ userId: actualUserId }, { $setOnInsert: {
    _id: profileId, userId: actualUserId, name: `Công ty Công nghệ ${i}`,
    description: `Doanh nghiệp mẫu số ${i}, tham gia chương trình thực tập Web3.`,
    industry: ["Blockchain", "Fintech", "Phần mềm"][i % 3], website: "https://example.com",
    createdAt: now, updatedAt: now,
  } }, { upsert: true });
  demoCompanies.push({ userId: actualUserId, companyId: database.companies.findOne({ userId: actualUserId })._id, wallet, name: `Công ty Công nghệ ${i}`, industry: ["Blockchain", "Fintech", "Phần mềm"][i % 3] });
}

const demoStudents = [{ userId: studentUserId, studentId: studentId, wallet: studentWallet, name: "Trần Minh Khoa", skills: ["Solidity", "React", "Web3.js", "TypeScript"] }];
const skillSets = [
  ["Solidity", "React", "Ethers.js"], ["JavaScript", "Node.js", "MongoDB"],
  ["Python", "FastAPI", "Machine Learning"], ["React", "TypeScript", "UI/UX"],
  ["Solidity", "Hardhat", "Security"], ["Python", "Pandas", "Data Analysis"],
  ["Node.js", "Express", "MongoDB"], ["React", "Web3.js", "MetaMask"],
];
for (let i = 1; i <= 15; i++) {
  const wallet = "0x" + (2000 + i).toString(16).padStart(40, "0");
  const userId = seedId(300 + i);
  const profileId = seedId(400 + i);
  const skills = skillSets[(i - 1) % skillSets.length];
  const fullName = `Sinh viên mẫu ${String(i).padStart(2, "0")}`;
  database.users.updateOne({ walletAddress: wallet }, { $setOnInsert: {
    _id: userId, walletAddress: wallet, name: fullName, role: "student", skills,
    bio: `Sinh viên thực tập có kỹ năng ${skills.join(", ")}.`, nonce: userId.toString(), createdAt: now, updatedAt: now,
  } }, { upsert: true });
  const actualUserId = database.users.findOne({ walletAddress: wallet })._id;
  database.students.updateOne({ userId: actualUserId }, { $setOnInsert: {
    _id: profileId, userId: actualUserId, studentCode: `DEMO-2026-${String(i + 1).padStart(3, "0")}`,
    fullName, university: ["Đại học Công nghệ", "Đại học Bách khoa", "Đại học Khoa học Tự nhiên"][i % 3],
    major: ["Công nghệ thông tin", "Kỹ thuật phần mềm", "Khoa học dữ liệu"][i % 3],
    skills, gpa: 2.7 + (i % 13) / 10, cvCid: "", kpiScore: 60 + (i * 7) % 40,
    createdAt: now, updatedAt: now,
  } }, { upsert: true });
  demoStudents.push({ userId: actualUserId, studentId: database.students.findOne({ userId: actualUserId })._id, wallet, name: fullName, skills });
}

const topicTitles = [
  "Xây dựng ví Web3 đa chuỗi", "Phân tích dữ liệu giao dịch DeFi", "Dashboard quản trị DAO",
  "Smart Contract cho chuỗi cung ứng", "Ứng dụng NFT chứng nhận học tập", "Cổng tuyển dụng Web3",
  "Phát hiện giao dịch bất thường", "Hệ thống staking token", "Marketplace tài sản số",
  "Quản lý danh tính phi tập trung", "Ứng dụng lưu trữ IPFS", "Bộ công cụ kiểm thử Solidity",
];
const statuses = ["open", "assigned", "in_progress", "completed"];
const baseDeadline = new Date("2026-12-20T00:00:00Z");
let createdTopicCount = 0;
let createdAssignmentCount = 0;
let createdSubmissionCount = 0;
for (let i = 1; i <= 24; i++) {
  const company = demoCompanies[(i - 1) % demoCompanies.length];
  const student = demoStudents[(i - 1) % demoStudents.length];
  const status = statuses[(i - 1) % statuses.length];
  const assigned = status !== "open";
  const topicId = seedId(500 + i);
  const assignmentId = seedId(600 + i);
  const skills = skillSets[(i - 1) % skillSets.length];
  const kpiStatuses = status === "completed" ? ["approved", "approved", "approved", "approved"]
    : status === "in_progress" ? ["approved", "submitted", "pending", "pending"]
      : ["pending", "pending", "pending", "pending"];
  const kpiNames = ["Tiến độ", "Chất lượng sản phẩm", "Kỹ năng và thái độ", "Đúng hạn"];
  const weights = [30, 40, 20, 10];
  const kpis = kpiNames.map((title, index) => ({
    milestoneIndex: index, title, description: `${title}: tiêu chí đánh giá mốc ${index + 1} của đề tài.`,
    deadline: new Date(baseDeadline.getTime() - (3 - index) * 7 * 86400000), weightPercent: weights[index],
    status: kpiStatuses[index], score: kpiStatuses[index] === "approved" ? 75 + (i * 3 + index * 5) % 26 : 0,
    submissionContent: kpiStatuses[index] === "submitted" ? "Báo cáo tiến độ và kết quả triển khai smart contract, giao diện React, kiểm thử và tài liệu." : "",
    submissionIpfsHash: "", mentorFeedback: kpiStatuses[index] === "approved" ? "Đạt yêu cầu mốc KPI." : "",
  }));
  database.topics.updateOne({ _id: topicId }, { $setOnInsert: {
    _id: topicId, companyId: company.companyId, title: `Đề tài mẫu ${String(i).padStart(2, "0")}: ${topicTitles[(i - 1) % topicTitles.length]}`,
    description: `Đề tài thực tập Web3 do ${company.name} đề xuất. Sinh viên xây dựng sản phẩm, kiểm thử và báo cáo kết quả theo KPI.`,
    requiredSkills: skills, expectedKeywords: ["Web3", ...skills.slice(0, 2)], difficulty: ["beginner", "intermediate", "advanced"][i % 3],
    maxSlots: 1, assignedCount: assigned ? 1 : 0, deadline: baseDeadline,
    status, companyWallet: company.wallet, companyName: company.name,
    assignedStudentWallet: assigned ? student.wallet : null, assignedStudentName: assigned ? student.name : "",
    startDate: new Date("2026-10-01T00:00:00Z"), endDate: baseDeadline,
    onChainId: null, txHash: "", ipfsDetailsHash: "", kpis, finalScore: status === "completed" ? 82 : 0,
    certificateIpfsHash: "", createdAt: now, updatedAt: now,
  } }, { upsert: true });
  createdTopicCount++;

  if (!assigned) continue;
  const assignmentStatus = status === "completed" ? "evaluated" : status === "in_progress" ? "submitted" : "assigned";
  database.assignments.updateOne({ _id: assignmentId }, { $setOnInsert: {
    _id: assignmentId, topicId, studentId: student.studentId, status: assignmentStatus,
    assignedAt: new Date(now.getTime() - i * 86400000), kpiAtAssign: 55 + (i * 7) % 46,
    onchainId: null, txHash: "", createdAt: now, updatedAt: now,
  } }, { upsert: true });
  createdAssignmentCount++;

  const submittedMilestones = status === "completed" ? [0, 1, 2, 3] : status === "in_progress" ? [0, 1] : [];
  for (const milestoneIndex of submittedMilestones) {
    const submissionId = seedId(1000 + i * 10 + milestoneIndex);
    const report = sampleNote;
    database.submissions.updateOne({ assignmentId, milestoneIndex, version: 1 }, { $setOnInsert: {
      _id: submissionId, assignmentId, milestoneIndex, ipfsCid: "",
      fileHash: "445e1015ff66084e9e5a499145e9bac7bf5608b5f71a2d6ae3ef30802d8374d4",
      note: report, version: 1, submittedAt: new Date(now.getTime() - i * 3600000), txHash: "", createdAt: now, updatedAt: now,
    } }, { upsert: true });
    database.ai_analyses.updateOne({ submissionId }, { $setOnInsert: {
      _id: seedId(2000 + i * 10 + milestoneIndex), submissionId, model: "TF-IDF fallback (sample)",
      summary: "Phân tích mẫu tham khảo; mentor vẫn là người quyết định kết quả nghiệm thu.",
      keywords: ["Web3", "React", "Smart Contract"], scores: { relevance: 68 + (i * 3) % 31, quality: 65 + (i * 5) % 35 },
      createdAt: now, updatedAt: now,
    } }, { upsert: true });
    createdSubmissionCount++;
  }

  const evaluatedMilestones = status === "completed" ? [0, 1, 2, 3] : status === "in_progress" ? [0] : [];
  for (const milestoneIndex of evaluatedMilestones) {
    const score = kpis[milestoneIndex].score;
    database.kpi_evaluations.updateOne({ assignmentId, milestoneIndex }, { $setOnInsert: {
      _id: seedId(3000 + i * 10 + milestoneIndex), assignmentId, milestoneIndex,
      criteria: [
        { name: "Tiến độ", weight: 30, score }, { name: "Chất lượng sản phẩm", weight: 40, score },
        { name: "Kỹ năng và thái độ", weight: 20, score }, { name: "Đúng hạn", weight: 10, score },
      ], totalScore: score, comment: "Đánh giá dữ liệu mẫu.", evaluatedBy: company.userId,
      evaluatedAt: new Date(now.getTime() - i * 1800000), txHash: "", createdAt: now, updatedAt: now,
    } }, { upsert: true });
  }
}

print(`Seed complete. Added/confirmed ${demoCompanies.length} companies, ${demoStudents.length} students, ${createdTopicCount + 1} topics, ${createdAssignmentCount + 1} assignments, ${createdSubmissionCount + 1} submissions, and related evaluations/AI analyses.`);
print("chain_events is intentionally empty until real contract logs are synchronized.");
print("chain_events is intentionally empty until real contract logs are synchronized.");

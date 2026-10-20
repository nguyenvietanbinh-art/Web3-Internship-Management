require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Company = require("../src/models/Company");
const Topic = require("../src/models/Topic");
const Assignment = require("../src/models/Assignment");
const Submission = require("../src/models/Submission");
const KPIEvaluation = require("../src/models/KPIEvaluation");
const AIAnalysis = require("../src/models/AIAnalysis");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/web3_internship";

async function seed() {
  await mongoose.connect(uri);
  try { await Submission.collection.dropIndex("assignmentId_1_version_1"); } catch (_error) {}
  // Remove the old compound uniqueness rule before normalizing legacy records,
  // since missing milestoneIndex values all become milestone 0.
  try { await KPIEvaluation.collection.dropIndex("assignmentId_1_milestoneIndex_1"); } catch (_error) {}
  await KPIEvaluation.updateMany({ milestoneIndex: { $exists: false } }, { $set: { milestoneIndex: 0 } });
  const duplicateEvaluations = await KPIEvaluation.aggregate([
    { $group: { _id: { assignmentId: "$assignmentId", milestoneIndex: "$milestoneIndex" }, ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  for (const group of duplicateEvaluations) await KPIEvaluation.deleteMany({ _id: { $in: group.ids.slice(1) } });

  const companyUser = await User.findOneAndUpdate(
    { walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" },
    { $set: { name: "Nexus Labs Blockchain", role: "company", companyName: "Nexus Labs Blockchain" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const studentUser = await User.findOneAndUpdate(
    { walletAddress: "0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc" },
    { $set: { name: "Trần Minh Khoa", role: "student", skills: ["Solidity", "React", "Web3.js", "TypeScript"] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const company = await Company.findOneAndUpdate(
    { userId: companyUser._id },
    { $set: { name: "Nexus Labs Blockchain", description: "Doanh nghiệp phát triển sản phẩm blockchain.", industry: "Blockchain", website: "https://example.com" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const student = await Student.findOneAndUpdate(
    { userId: studentUser._id },
    { $set: { studentCode: "DEMO-2026-001", fullName: "Trần Minh Khoa", university: "Đại học Công nghệ", major: "Công nghệ thông tin", skills: studentUser.skills, gpa: 3.4, cvCid: "", kpiScore: 89 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const topic = await Topic.findOneAndUpdate(
    { title: "Phát triển hệ thống quản trị DAO Web3", companyId: company._id },
    { $set: {
      companyId: company._id,
      title: "Phát triển hệ thống quản trị DAO Web3",
      description: "Xây dựng smart contract quản trị và dashboard biểu quyết DAO.",
      requiredSkills: ["Solidity", "React", "Web3.js", "TypeScript"],
      expectedKeywords: ["Smart Contract", "Governance", "DAO", "Voting"],
      difficulty: "intermediate", maxSlots: 1, deadline: new Date("2026-12-15T00:00:00Z"),
      status: "in_progress", companyWallet: companyUser.walletAddress,
      companyName: company.name, assignedStudentWallet: studentUser.walletAddress,
      assignedStudentName: student.fullName, onChainId: null, txHash: "",
      startDate: new Date("2026-10-01T00:00:00Z"), endDate: new Date("2026-12-15T00:00:00Z"),
      kpis: [
        { milestoneIndex: 0, title: "Tiến độ", description: "Hoàn thành các mốc theo kế hoạch.", deadline: new Date("2026-11-15T00:00:00Z"), weightPercent: 30, status: "approved", score: 90 },
        { milestoneIndex: 1, title: "Chất lượng sản phẩm", description: "Chất lượng mã nguồn, kiểm thử và tài liệu.", deadline: new Date("2026-12-01T00:00:00Z"), weightPercent: 40, status: "submitted", score: 0 },
        { milestoneIndex: 2, title: "Kỹ năng và thái độ", description: "Chuyên môn, giao tiếp và phối hợp nhóm.", deadline: new Date("2026-12-10T00:00:00Z"), weightPercent: 20, status: "pending", score: 0 },
        { milestoneIndex: 3, title: "Đúng hạn", description: "Nộp sản phẩm đúng thời hạn đã thống nhất.", deadline: new Date("2026-12-15T00:00:00Z"), weightPercent: 10, status: "pending", score: 0 },
      ],
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const assignment = await Assignment.findOneAndUpdate(
    { topicId: topic._id, studentId: student._id },
    { $set: { status: "submitted", assignedAt: new Date("2026-10-05T00:00:00Z"), kpiAtAssign: 72.5, onchainId: null, txHash: "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const note = "Đã hoàn thiện DAO Governor và dashboard biểu quyết. Mã nguồn có unit test và tài liệu triển khai.";
  const fileHash = crypto.createHash("sha256").update(note).digest("hex");
  const submission = await Submission.findOneAndUpdate(
    { assignmentId: assignment._id, version: 1 },
    { $set: { ipfsCid: "", fileHash, note, submittedAt: new Date("2026-11-01T00:00:00Z"), txHash: "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await AIAnalysis.findOneAndUpdate(
    { submissionId: submission._id },
    { $set: { model: "TF-IDF fallback (sample)", summary: "Báo cáo có đề cập DAO, smart contract và kiểm thử; kết quả chỉ để tham khảo.", keywords: ["DAO", "Smart Contract", "Testing"], scores: { relevance: 84, quality: 80 } } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await KPIEvaluation.findOneAndUpdate(
    { assignmentId: assignment._id, milestoneIndex: 0 },
    { $set: {
      milestoneIndex: 0,
      criteria: [
        { name: "Tiến độ", weight: 30, score: 90 },
        { name: "Chất lượng sản phẩm", weight: 40, score: 86 },
        { name: "Kỹ năng và thái độ", weight: 20, score: 92 },
        { name: "Đúng hạn", weight: 10, score: 100 },
      ],
      totalScore: 90, comment: "Đánh giá mẫu; cần mentor xác nhận.", evaluatedBy: companyUser._id, evaluatedAt: new Date("2026-11-02T00:00:00Z"), txHash: "",
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const companies = [{ user: companyUser, company, wallet: companyUser.walletAddress, name: company.name }];
  for (let i = 1; i <= 5; i++) {
    const wallet = `0x${(1000 + i).toString(16).padStart(40, "0")}`;
    const name = `Công ty Công nghệ ${i}`;
    const user = await User.findOneAndUpdate({ walletAddress: wallet }, { $setOnInsert: { walletAddress: wallet, name, role: "company", companyName: name } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const profile = await Company.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { userId: user._id, name, description: `Doanh nghiệp mẫu ${i}, tham gia chương trình thực tập Web3.`, industry: ["Blockchain", "Fintech", "Phần mềm"][i % 3], website: "https://example.com" } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    companies.push({ user, company: profile, wallet, name });
  }

  const students = [{ user: studentUser, student, wallet: studentUser.walletAddress, name: student.fullName, skills: student.skills }];
  const skillSets = [
    ["Solidity", "React", "Ethers.js"], ["JavaScript", "Node.js", "MongoDB"], ["Python", "FastAPI", "Machine Learning"],
    ["React", "TypeScript", "UI/UX"], ["Solidity", "Hardhat", "Security"], ["Python", "Pandas", "Data Analysis"],
    ["Node.js", "Express", "MongoDB"], ["React", "Web3.js", "MetaMask"],
  ];
  for (let i = 1; i <= 15; i++) {
    const wallet = `0x${(2000 + i).toString(16).padStart(40, "0")}`;
    const name = `Sinh viên mẫu ${String(i).padStart(2, "0")}`;
    const skills = skillSets[(i - 1) % skillSets.length];
    const user = await User.findOneAndUpdate({ walletAddress: wallet }, { $setOnInsert: { walletAddress: wallet, name, role: "student", skills, bio: `Sinh viên thực tập có kỹ năng ${skills.join(", ")}.` } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const profile = await Student.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { userId: user._id, studentCode: `DEMO-2026-${String(i + 1).padStart(3, "0")}`, fullName: name, university: ["Đại học Công nghệ", "Đại học Bách khoa", "Đại học Khoa học Tự nhiên"][i % 3], major: ["Công nghệ thông tin", "Kỹ thuật phần mềm", "Khoa học dữ liệu"][i % 3], skills, gpa: 2.7 + (i % 13) / 10, cvCid: "", kpiScore: 60 + (i * 7) % 40 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    students.push({ user, student: profile, wallet, name, skills });
  }

  const topicTitles = ["Xây dựng ví Web3 đa chuỗi", "Phân tích dữ liệu giao dịch DeFi", "Dashboard quản trị DAO", "Smart Contract cho chuỗi cung ứng", "Ứng dụng NFT chứng nhận học tập", "Cổng tuyển dụng Web3", "Phát hiện giao dịch bất thường", "Hệ thống staking token", "Marketplace tài sản số", "Quản lý danh tính phi tập trung", "Ứng dụng lưu trữ IPFS", "Bộ công cụ kiểm thử Solidity"];
  const statuses = ["open", "assigned", "in_progress", "completed"];
  const kpiNames = ["Tiến độ", "Chất lượng sản phẩm", "Kỹ năng và thái độ", "Đúng hạn"];
  const weights = [30, 40, 20, 10];
  let assignmentCount = 0;
  let submissionCount = 1;
  for (let i = 1; i <= 24; i++) {
    const companyRecord = companies[(i - 1) % companies.length];
    const studentRecord = students[(i - 1) % students.length];
    const status = statuses[(i - 1) % statuses.length];
    const assigned = status !== "open";
    const due = new Date("2026-12-20T00:00:00Z");
    const topicTitle = `Đề tài mẫu ${String(i).padStart(2, "0")}: ${topicTitles[(i - 1) % topicTitles.length]}`;
    const milestoneStates = status === "completed" ? ["approved", "approved", "approved", "approved"] : status === "in_progress" ? ["approved", "submitted", "pending", "pending"] : ["pending", "pending", "pending", "pending"];
    const kpis = kpiNames.map((title, index) => ({
      milestoneIndex: index, title, description: `${title}: tiêu chí đánh giá mốc ${index + 1} của đề tài.`,
      deadline: new Date(due.getTime() - (3 - index) * 7 * 86400000), weightPercent: weights[index], status: milestoneStates[index],
      score: milestoneStates[index] === "approved" ? 75 + (i * 3 + index * 5) % 26 : 0,
      submissionContent: milestoneStates[index] === "submitted" ? "Báo cáo tiến độ và kết quả triển khai smart contract, giao diện React, kiểm thử và tài liệu." : "",
      submissionIpfsHash: "", mentorFeedback: milestoneStates[index] === "approved" ? "Đạt yêu cầu mốc KPI." : "",
    }));
    const topic = await Topic.findOneAndUpdate(
      { companyId: companyRecord.company._id, title: topicTitle },
      { $setOnInsert: {
        companyId: companyRecord.company._id, title: topicTitle,
        description: `Đề tài thực tập Web3 do ${companyRecord.name} đề xuất. Sinh viên xây dựng sản phẩm, kiểm thử và báo cáo kết quả theo KPI.`,
        requiredSkills: skillSets[(i - 1) % skillSets.length], expectedKeywords: ["Web3", ...skillSets[(i - 1) % skillSets.length].slice(0, 2)],
        difficulty: ["beginner", "intermediate", "advanced"][i % 3], maxSlots: 1, assignedCount: assigned ? 1 : 0,
        deadline: due, status, companyWallet: companyRecord.wallet, companyName: companyRecord.name,
        assignedStudentWallet: assigned ? studentRecord.wallet : null, assignedStudentName: assigned ? studentRecord.name : "",
        startDate: new Date("2026-10-01T00:00:00Z"), endDate: due, onChainId: null, txHash: "", ipfsDetailsHash: "",
        kpis, finalScore: status === "completed" ? 82 : 0, certificateIpfsHash: "",
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!assigned) continue;
    const assignmentStatus = status === "completed" ? "evaluated" : status === "in_progress" ? "submitted" : "assigned";
    const currentAssignment = await Assignment.findOneAndUpdate(
      { topicId: topic._id, studentId: studentRecord.student._id },
      { $setOnInsert: { topicId: topic._id, studentId: studentRecord.student._id, status: assignmentStatus, assignedAt: new Date(Date.now() - i * 86400000), kpiAtAssign: 55 + (i * 7) % 46, onchainId: null, txHash: "" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    assignmentCount++;

    const submittedMilestones = status === "completed" ? [0, 1, 2, 3] : status === "in_progress" ? [0, 1] : [];
    for (const milestoneIndex of submittedMilestones) {
      const note = `Báo cáo mẫu ${i}: đã triển khai ${topicTitles[(i - 1) % topicTitles.length]}, kiểm thử và cập nhật tài liệu.`;
      const hash = crypto.createHash("sha256").update(note).digest("hex");
      const savedSubmission = await Submission.findOneAndUpdate(
        { assignmentId: currentAssignment._id, milestoneIndex, version: 1 },
        { $setOnInsert: { assignmentId: currentAssignment._id, milestoneIndex, ipfsCid: "", fileHash: hash, note, version: 1, submittedAt: new Date(Date.now() - i * 3600000), txHash: "" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await AIAnalysis.findOneAndUpdate(
        { submissionId: savedSubmission._id },
        { $setOnInsert: { submissionId: savedSubmission._id, model: "TF-IDF fallback (sample)", summary: "Phân tích mẫu tham khảo; mentor vẫn là người quyết định kết quả nghiệm thu.", keywords: ["Web3", "React", "Smart Contract"], scores: { relevance: 68 + (i * 3) % 31, quality: 65 + (i * 5) % 35 } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      submissionCount++;
    }

    const evaluatedMilestones = status === "completed" ? [0, 1, 2, 3] : status === "in_progress" ? [0] : [];
    for (const milestoneIndex of evaluatedMilestones) {
      const score = kpis[milestoneIndex].score;
      await KPIEvaluation.findOneAndUpdate(
        { assignmentId: currentAssignment._id, milestoneIndex },
        { $setOnInsert: {
          assignmentId: currentAssignment._id, milestoneIndex,
          criteria: kpiNames.map((name, index) => ({ name, weight: weights[index], score })),
          totalScore: score, comment: "Đánh giá dữ liệu mẫu.", evaluatedBy: companyRecord.user._id,
          evaluatedAt: new Date(Date.now() - i * 1800000), txHash: "",
        } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  console.log(`Sample data upserted: ${companies.length} companies, ${students.length} students, 25 topics, ${assignmentCount + 1} assignments, ${submissionCount} submissions, AI analyses and KPI evaluations.`);
  console.log(`Demo wallets: company=${companyUser.walletAddress}; student=${studentUser.walletAddress}`);
  console.log("No chain_events were inserted because there are no real blockchain transactions yet.");
}

seed()
  .catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });

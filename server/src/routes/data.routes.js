const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Topic = require("../models/Topic");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const KPIEvaluation = require("../models/KPIEvaluation");
const AIAnalysis = require("../models/AIAnalysis");
const ChainEvent = require("../models/ChainEvent");
const { requireAuth } = require("../middleware/auth");

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const pagination = (req) => ({
  page: Math.max(1, Number.parseInt(req.query.page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20)),
});
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const pageResult = (items, total, page, limit) => ({ items, page, limit, total, pages: Math.ceil(total / limit) });

router.get("/overview", asyncRoute(async (_req, res) => {
  const [users, students, companies, topics, assignments, submissions, evaluations, analyses, pendingChainEvents] = await Promise.all([
    User.countDocuments(), Student.countDocuments(), Company.countDocuments(), Topic.countDocuments(),
    Assignment.countDocuments(), Submission.countDocuments(), KPIEvaluation.countDocuments(), AIAnalysis.countDocuments(),
    ChainEvent.countDocuments({ processed: false }),
  ]);
  res.json({ users, students, companies, topics, assignments, submissions, evaluations, analyses, pendingChainEvents });
}));

router.get("/students", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.skill) filter.skills = { $regex: String(req.query.skill).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [items, total] = await Promise.all([
    Student.find(filter).populate("userId", "name walletAddress email").sort({ fullName: 1 }).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/students/:id", asyncRoute(async (req, res) => {
  let student;
  if (validId(req.params.id)) student = await Student.findById(req.params.id).populate("userId", "name walletAddress email bio");
  else {
    const user = await User.findOne({ walletAddress: req.params.id.toLowerCase() }).select("_id");
    student = user ? await Student.findOne({ userId: user._id }).populate("userId", "name walletAddress email bio") : null;
  }
  if (!student) return res.status(404).json({ error: "Student not found" });
  const assignments = await Assignment.find({ studentId: student._id }).populate("topicId").sort({ assignedAt: -1 });
  res.json({ student, assignments });
}));

router.put("/students/:id", requireAuth, asyncRoute(async (req, res) => {
  let student;
  if (validId(req.params.id)) student = await Student.findById(req.params.id);
  else {
    const user = await User.findOne({ walletAddress: req.params.id.toLowerCase() });
    if (user) student = await Student.findOne({ userId: user._id });
  }
  if (!student) return res.status(404).json({ error: "Student not found" });
  if (String(student.userId) !== String(req.user._id)) return res.status(403).json({ error: "Chỉ chủ hồ sơ mới được sửa", code: "NOT_OWNER" });
  const allowed = ["studentCode", "fullName", "university", "major", "skills", "gpa", "cvCid"];
  for (const key of allowed) if (req.body[key] !== undefined) student[key] = req.body[key];
  await student.save();
  await User.updateOne({ _id: student.userId }, { $set: { ...(req.body.fullName ? { name: req.body.fullName } : {}), ...(req.body.skills ? { skills: req.body.skills } : {}) } });
  res.json({ student });
}));

router.get("/companies", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = req.query.industry ? { industry: new RegExp(String(req.query.industry).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
  const [items, total] = await Promise.all([
    Company.find(filter).populate("userId", "name walletAddress email").sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
    Company.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/companies/:id", asyncRoute(async (req, res) => {
  let company;
  if (validId(req.params.id)) company = await Company.findById(req.params.id).populate("userId", "name walletAddress email");
  else {
    const user = await User.findOne({ walletAddress: req.params.id.toLowerCase() }).select("_id");
    company = user ? await Company.findOne({ userId: user._id }).populate("userId", "name walletAddress email") : null;
  }
  if (!company) return res.status(404).json({ error: "Company not found" });
  const topics = await Topic.find({ companyId: company._id }).sort({ createdAt: -1 });
  res.json({ company, topics });
}));

router.put("/companies/:id", requireAuth, asyncRoute(async (req, res) => {
  let company;
  if (validId(req.params.id)) company = await Company.findById(req.params.id);
  else {
    const user = await User.findOne({ walletAddress: req.params.id.toLowerCase() });
    if (user) company = await Company.findOne({ userId: user._id });
  }
  if (!company) return res.status(404).json({ error: "Company not found" });
  if (String(company.userId) !== String(req.user._id)) return res.status(403).json({ error: "Chỉ chủ hồ sơ mới được sửa", code: "NOT_OWNER" });
  for (const key of ["name", "description", "industry", "website"]) if (req.body[key] !== undefined) company[key] = req.body[key];
  await company.save();
  if (req.body.name) await User.updateOne({ _id: company.userId }, { $set: { name: req.body.name, companyName: req.body.name } });
  res.json({ company });
}));

router.get("/topics", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  for (const key of ["status", "difficulty"]) if (req.query[key]) filter[key] = req.query[key];
  if (req.query.companyId && validId(req.query.companyId)) filter.companyId = req.query.companyId;
  if (req.query.search) {
    const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ title: new RegExp(escaped, "i") }, { description: new RegExp(escaped, "i") }, { requiredSkills: new RegExp(escaped, "i") }];
  }
  const [items, total] = await Promise.all([
    Topic.find(filter).populate("companyId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Topic.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/topics/:id", asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid topic ID" });
  const topic = await Topic.findById(req.params.id).populate("companyId");
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  const assignments = await Assignment.find({ topicId: topic._id }).populate({ path: "studentId", populate: { path: "userId", select: "name walletAddress" } });
  res.json({ topic, assignments });
}));

router.get("/assignments", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.topicId && validId(req.query.topicId)) filter.topicId = req.query.topicId;
  if (req.query.studentId && validId(req.query.studentId)) filter.studentId = req.query.studentId;
  const [items, total] = await Promise.all([
    Assignment.find(filter).populate("topicId").populate({ path: "studentId", populate: { path: "userId", select: "name walletAddress" } }).sort({ assignedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Assignment.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/submissions", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.assignmentId && validId(req.query.assignmentId)) filter.assignmentId = req.query.assignmentId;
  const [items, total] = await Promise.all([
    Submission.find(filter).populate({ path: "assignmentId", populate: ["topicId", "studentId"] }).sort({ submittedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Submission.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/evaluations", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.assignmentId && validId(req.query.assignmentId)) filter.assignmentId = req.query.assignmentId;
  const [items, total] = await Promise.all([
    KPIEvaluation.find(filter).populate({ path: "assignmentId", populate: ["topicId", "studentId"] }).populate("evaluatedBy", "name walletAddress").sort({ evaluatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    KPIEvaluation.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/ai-analyses", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.submissionId && validId(req.query.submissionId)) filter.submissionId = req.query.submissionId;
  const [items, total] = await Promise.all([
    AIAnalysis.find(filter).populate("submissionId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AIAnalysis.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

router.get("/chain-events", asyncRoute(async (req, res) => {
  const { page, limit } = pagination(req);
  const filter = {};
  if (req.query.eventName) filter.eventName = req.query.eventName;
  if (req.query.processed === "true" || req.query.processed === "false") filter.processed = req.query.processed === "true";
  const [items, total] = await Promise.all([
    ChainEvent.find(filter).sort({ blockNumber: -1, logIndex: -1 }).skip((page - 1) * limit).limit(limit),
    ChainEvent.countDocuments(filter),
  ]);
  res.json(pageResult(items, total, page, limit));
}));

// Lỗi được errorHandler toàn cục (app.js) xử lý để giữ đúng mã HTTP.

module.exports = router;

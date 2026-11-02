const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Assignment = require('../models/Assignment');
const ChainEvent = require('../models/ChainEvent');
const JD = require('../models/JD');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const WorkLog = require('../models/WorkLog');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError, asyncHandler, normalizeWallet, isWallet, isObjectId } = require('../utils/http');
const { topicScope, relation, activeStudentTopic, workScope, ownWalletQuery } = require('../middleware/permissions');
const { matchStudentWithTopic } = require('../services/aiClient');

function text(value, name, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > 20000) throw new HttpError(400, `${name} không hợp lệ`);
  return value.trim();
}
function validId(id) { if (!isObjectId(id)) throw new HttpError(400, 'ID không hợp lệ'); }
function walletQuery(req) { ownWalletQuery(req.user, req.query.studentWallet); }

router.get('/dashboard', requireAuth, asyncHandler(async (req, res) => {
  // Scope comes from authenticated identity, never wallet/role query parameters.
  const topics = await Topic.find(topicScope(req.user)).lean();
  const completed = topics.filter(t => t.status === 'completed');
  const scored = completed.filter(t => Number.isFinite(t.finalScore));
  const studentWallets = [...new Set(topics.map(t => t.assignedStudentWallet).filter(Boolean))];
  const students = req.user.role === 'admin' ? await Student.countDocuments() : studentWallets.length;
  const companies = req.user.role === 'admin' ? await Company.countDocuments() : new Set(topics.map(t => t.companyWallet)).size;
  const assigned = await Assignment.countDocuments({topicId:{$in:topics.map(t => t._id)}});
  const attendanceDays = await Attendance.countDocuments(await workScope(req.user,'studentWallet',false));
  const workLogsSubmitted = await WorkLog.countDocuments(await workScope(req.user));
  const rate = topics.length ? Math.round(completed.length / topics.length * 100) : 0;
  const current = topics.find(t => ['assigned','in_progress'].includes(t.status)) || topics[0];
  res.json({overview:{totalTopics:topics.length,completedTopics:completed.length,
    inProgressTopics:topics.filter(t=>['assigned','in_progress'].includes(t.status)).length,
    openTopics:topics.filter(t=>t.status==='open').length,completionRate:rate,
    avgScore:scored.length?Math.round(scored.reduce((sum,t)=>sum+t.finalScore,0)/scored.length):null,
    totalStudents:students,totalCompanies:companies,totalAssignments:assigned,
    onChainEvents:req.user.role==='admin'?await ChainEvent.countDocuments():null},
    roleStats:{myTopicsCount:topics.length,myCompletedCount:completed.length,
      myInProgressCount:topics.filter(t=>['assigned','in_progress'].includes(t.status)).length,
      myStudentsAssigned:studentWallets.length,completionRate:rate,hasAssignedTopic:Boolean(current),
      currentTopicTitle:current?.title||null,currentTopicStatus:current?.status||'none',
      currentScore:current?.status==='completed'?current.finalScore:null,attendanceDays,workLogsSubmitted}});
}));

router.get('/jds', asyncHandler(async (_req, res) => res.json(await JD.find({status:'open'}).sort({createdAt:-1}).lean())));
router.post('/jds', requireAuth, requireRole('company'), asyncHandler(async (req, res) => {
  const title=text(req.body.title,'Tiêu đề',true), description=text(req.body.description,'Mô tả',true);
  const toList=(value)=>{
    if(value==null)return [];
    const list=Array.isArray(value)?value:typeof value==='string'?value.split(','):null;
    if(!list||list.length>100||list.some(x=>typeof x!=='string'))throw new HttpError(400,'Danh sách không hợp lệ');
    return list.map(x=>x.trim()).filter(Boolean);
  };
  const slots=req.body.slots===undefined?2:Number(req.body.slots);
  if(!Number.isInteger(slots)||slots<1)throw new HttpError(400,'Số lượng không hợp lệ');
  const jd=await JD.create({title,description,companyWallet:req.user.walletAddress,companyName:req.user.companyName||req.user.name,
    department:text(req.body.department,'Bộ phận'),requirements:toList(req.body.requirements),benefits:toList(req.body.benefits),slots,
    location:text(req.body.location,'Địa điểm'),salary:text(req.body.salary,'Mức hỗ trợ')});
  res.status(201).json({success:true,jd});
}));
router.post('/match-cv', requireAuth, asyncHandler(async (req,res)=>{
  const {studentSkills=[],studentBio=''}=req.body;
  if(!Array.isArray(studentSkills)||studentSkills.length>100||studentSkills.some(s=>typeof s!=='string')||typeof studentBio!=='string')throw new HttpError(400,'Hồ sơ matching không hợp lệ');
  const jds=await JD.find({status:'open'}).lean();
  const result=await Promise.all(jds.map(async jd=>({...jd,matchResult:await matchStudentWithTopic({studentSkills,studentBio,topicTitle:jd.title,topicDescription:jd.description,requiredSkills:jd.requirements})})));
  result.sort((a,b)=>b.matchResult.similarity_score-a.matchResult.similarity_score);res.json(result);
}));

router.get('/tasks', requireAuth, asyncHandler(async(req,res)=>{
  walletQuery(req);const filter=await workScope(req.user,'assignedStudentWallet');
  if(req.query.studentWallet)filter.assignedStudentWallet=normalizeWallet(req.query.studentWallet);
  if(req.query.companyWallet){if(!isWallet(req.query.companyWallet))throw new HttpError(400,'Ví công ty không hợp lệ');if(req.user.role==='company'&&normalizeWallet(req.query.companyWallet)!==req.user.walletAddress)throw new HttpError(403,'Không có quyền');filter.companyWallet=normalizeWallet(req.query.companyWallet);}
  res.json(await Task.find(filter).sort({createdAt:-1}));
}));
router.post('/tasks', requireAuth, requireRole('company'), asyncHandler(async(req,res)=>{
  const title=text(req.body.title,'Tiêu đề',true),wallet=normalizeWallet(req.body.assignedStudentWallet);
  if(!isWallet(wallet))throw new HttpError(400,'Cần chọn sinh viên được phân công');
  const topic=await relation({studentWallet:wallet,companyWallet:req.user.walletAddress,topicId:req.body.topicId,user:req.user});
  if(!['assigned','in_progress'].includes(topic.status))throw new HttpError(409,'Phân công không còn hoạt động');
  const priority=req.body.priority||'medium',dueDate=req.body.dueDate?new Date(req.body.dueDate):new Date(Date.now()+7*86400000);
  if(!['low','medium','high','urgent'].includes(priority)||Number.isNaN(dueDate.getTime()))throw new HttpError(400,'Ưu tiên/hạn không hợp lệ');
  const task=await Task.create({title,description:text(req.body.description,'Mô tả'),assignedStudentWallet:wallet,companyWallet:req.user.walletAddress,topicId:topic._id,priority,dueDate,status:'todo'});
  res.status(201).json({success:true,task});
}));
router.patch('/tasks/:id/status', requireAuth, requireRole('student','company','admin'), asyncHandler(async(req,res)=>{
  validId(req.params.id);const status=req.body.status;
  if(!['todo','in_progress','review','done'].includes(status))throw new HttpError(400,'Trạng thái không hợp lệ');
  const task=await Task.findById(req.params.id);if(!task)throw new HttpError(404,'Không tìm thấy nhiệm vụ');if(task.assignmentId)throw new HttpError(409,'Công việc theo kỳ phải cập nhật qua API core để bảo toàn lịch sử');
  await relation({studentWallet:task.assignedStudentWallet,companyWallet:task.companyWallet,topicId:task.topicId,user:req.user});
  if(req.user.role==='student'&&task.assignedStudentWallet!==req.user.walletAddress)throw new HttpError(403,'Không có quyền');
  if(req.user.role==='company'&&task.companyWallet!==req.user.walletAddress)throw new HttpError(403,'Không có quyền');
  task.status=status;task.completedAt=status==='done'?new Date():undefined;await task.save();res.json({success:true,task});
}));

const attendanceService = require('../services/attendanceService');
router.post('/attendance/sessions', requireAuth, requireRole('company'), asyncHandler(async(req,res)=>res.status(201).json(await attendanceService.issue(req.user,req.body))));
router.get('/attendance/today-qr', requireAuth, requireRole('company'), asyncHandler(async(req,res)=>res.json(await attendanceService.current(req.user))));
router.post('/attendance/check-in', requireAuth, requireRole('student'), asyncHandler(async(req,res)=>res.json(await attendanceService.checkIn(req.user,req.body.qrCodeHash))));
router.get('/attendance/history', requireAuth, asyncHandler(async(req,res)=>{
  walletQuery(req);const filter=await workScope(req.user,'studentWallet',false);
  if(req.query.studentWallet)filter.studentWallet=normalizeWallet(req.query.studentWallet);
  res.json(await Attendance.find(filter).sort({checkInTime:-1}).limit(100));
}));
router.get('/worklogs', requireAuth, asyncHandler(async(req,res)=>{
  walletQuery(req);const filter=await workScope(req.user);
  if(req.query.studentWallet)filter.studentWallet=normalizeWallet(req.query.studentWallet);
  res.json(await WorkLog.find(filter).sort({weekNumber:-1}));
}));
router.post('/worklogs', requireAuth, requireRole('student'), asyncHandler(async(req,res)=>{
  const title=text(req.body.title,'Tiêu đề',true),tasksDone=text(req.body.tasksDone,'Công việc đã làm',true);
  const weekNumber=req.body.weekNumber===undefined?1:Number(req.body.weekNumber);
  if(!Number.isInteger(weekNumber)||weekNumber<1||weekNumber>104)throw new HttpError(400,'Tuần không hợp lệ');
  const topic=await activeStudentTopic(req.user,{topicId:req.body.topicId});
  const log=await WorkLog.create({studentWallet:req.user.walletAddress,studentName:req.user.name,companyWallet:topic.companyWallet,topicId:topic._id,
    title,tasksDone,weekNumber,challenges:text(req.body.challenges,'Khó khăn'),nextPlan:text(req.body.nextPlan,'Kế hoạch'),status:'submitted'});
  res.status(201).json({success:true,workLog:log});
}));
router.patch('/worklogs/:id/review', requireAuth, requireRole('company','mentor','admin'), asyncHandler(async(req,res)=>{
  validId(req.params.id);if(!['approved','need_revision'].includes(req.body.status))throw new HttpError(400,'Trạng thái đánh giá không hợp lệ');
  const log=await WorkLog.findById(req.params.id);if(!log)throw new HttpError(404,'Không tìm thấy nhật ký');if(log.assignmentId)throw new HttpError(409,'Nhật ký theo kỳ phải đánh giá qua API core');
  if(log.studentWallet===req.user.walletAddress)throw new HttpError(403,'Không được tự duyệt nhật ký');
  await relation({studentWallet:log.studentWallet,companyWallet:log.companyWallet,topicId:log.topicId,user:req.user});
  log.status=req.body.status;log.mentorFeedback=text(req.body.mentorFeedback,'Nhận xét');log.reviewedAt=new Date();await log.save();res.json({success:true,workLog:log});
}));

router.get('/certificate/:query', asyncHandler(async(req,res)=>{
  const query=req.params.query.trim();let topic;
  if(/^[a-f0-9]{24}$/i.test(query))topic=await Topic.findById(query);
  else if(/^0x[a-f0-9]{40}$/i.test(query))topic=await Topic.findOne({assignedStudentWallet:query.toLowerCase(),status:'completed'});
  else if(/^0x[a-f0-9]{64}$/i.test(query))topic=await Topic.findOne({txHash:query.toLowerCase()});
  if(!topic)throw new HttpError(404,'Không tìm thấy chứng nhận','CERTIFICATE_NOT_FOUND');
  // A completed Topic/CID/event is not a minted NFT/SBT. Never claim otherwise.
  throw new HttpError(503,'Chưa có bộ xác minh token on-chain được cấu hình','CERTIFICATE_VERIFIER_UNAVAILABLE');
}));
router.get('/chain-events', requireAuth, requireRole('admin'), asyncHandler(async(_req,res)=>res.json(await ChainEvent.find().sort({createdAt:-1}).limit(50).lean())));
router.post('/sync-events', requireAuth, requireRole('admin'), asyncHandler(async(req,res)=>{
  if(!require('../config/env').chainListenerEnabled)throw new HttpError(503,'Đồng bộ chain chưa được bật','CHAIN_UNAVAILABLE');
  const result=await require('../services/chainListener').syncPastEvents(0);
  if(result.error||result.message==='Contract chưa sẵn sàng')throw new HttpError(503,'Contract chưa sẵn sàng','CHAIN_UNAVAILABLE');
  res.json({success:true,...result,totalEvents:await ChainEvent.countDocuments()});
}));
module.exports=router;

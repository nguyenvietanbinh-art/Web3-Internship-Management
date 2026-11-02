const router=require('express').Router(),identity=require('../services/businessIdentity'),v=require('./shared');
const {requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const User=require('../models/User'),Topic=require('../models/Topic'),Student=require('../models/Student'),Assignment=require('../models/Assignment');
const {InternshipBatch,Application}=require('../models/BusinessModels');
router.use((_req,_res,next)=>identity.enabled()?next():next('router'));
router.post('/accounts/email',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['email','password','name','role','reason']);const auth=require('../routes/email.routes'),loginEmail=auth.normalizeEmail(req.body.email),plain=auth.validatePassword(req.body.password);
 const role=v.choice(req.body.role,['student','company','mentor'],'Vai trò cấp');
 if(await User.exists({$or:[{loginEmail},{email:loginEmail}]}))throw new HttpError(409,'Email đã tồn tại; không tự gộp');
 const user=await User.create({loginEmail,email:loginEmail,passwordHash:await require('bcryptjs').hash(plain,12),name:v.text(req.body.name,'Tên',{required:true,max:200}),role,auditHistory:[v.event(req.user,'account.email_provisioned',{role,reason:v.text(req.body.reason,'Lý do',{required:true})})]});
 await require('../services/accountProfiles').ensureProfile(user);res.status(201).json({_id:user._id,name:user.name,email:user.email,role:user.role});
}));
router.get('/topics',requireRole('company','admin'),asyncHandler(async(req,res)=>{
 const filter=req.user.role==='admin'?{}:identity.owned(req.user,'companyUserId','companyWallet');res.json(await v.paged(Topic,filter,req.query));
}));
router.post('/topics',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['title','description','kpis']);if(!Array.isArray(req.body.kpis)||!req.body.kpis.length||req.body.kpis.length>20)throw new HttpError(400,'Cần từ1 đến20 tiêu chí KPI');
 const kpis=req.body.kpis.map((k,i)=>{v.keys(k,['title','description','weightPercent','deadline']);return{milestoneIndex:i,title:v.text(k.title,'Tiêu chí',{required:true,max:200}),description:v.text(k.description,'Mô tả KPI',{required:true,max:2000}),weightPercent:v.integer(k.weightPercent,1,100,'Trọng số'),deadline:v.date(k.deadline,'Hạn KPI')};});
 if(kpis.reduce((n,k)=>n+k.weightPercent,0)!==100)throw new HttpError(400,'Tổng trọng số phải100');
 res.status(201).json(await Topic.create({...identity.refs(req.user,'companyUserId','companyWallet'),companyName:req.user.companyName||req.user.name,title:v.text(req.body.title,'Đề tài',{required:true,max:200}),description:v.text(req.body.description,'Mô tả',{required:true}),kpis}));
}));
router.get('/directory',requireRole('admin','company','mentor'),asyncHandler(async(req,res)=>{
 const role=v.choice(req.query.role,['student','company','mentor'],'Vai trò'),filter={role,disabled:{$ne:true}};
 if(req.user.role==='company'&&role==='student'){
  const applications=await Application.find({...identity.owned(req.user,'companyUserId','companyWallet'),status:'accepted'}).select('studentUserId studentWallet');
  const placements=await Assignment.find(require('./placementPolicy').scope(req.user)).select('studentUserId studentWallet');
  const ids=[...applications,...placements].flatMap(a=>a.studentUserId?[a.studentUserId]:[]),wallets=[...applications,...placements].flatMap(a=>a.studentWallet?[a.studentWallet]:[]);
  filter.$or=[{_id:{$in:ids}},{walletAddress:{$in:wallets}}];
 }else if(req.user.role==='mentor'){
  const a=await Assignment.find(require('./placementPolicy').scope(req.user)).lean();filter._id={$in:a.flatMap(x=>[x.studentUserId,x.companyUserId,x.mentorUserId].filter(Boolean))};
 }else if(req.user.role==='company'&&role==='company')filter._id=req.user._id;
 res.json(await v.paged(User,filter,req.query,{select:'name role walletAddress'}));
}));
router.post('/placements',requireRole('company','admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['topicId','batchId','studentUserId','mentorUserId','startDate','endDate']);
 const topic=await Topic.findById(v.id(req.body.topicId)),batch=await InternshipBatch.findById(v.id(req.body.batchId));if(!topic||!batch)throw new HttpError(404,'Không có đề tài/kỳ');
 if(req.user.role==='company'&&!identity.belongs(topic,req.user,'companyUserId','companyWallet'))throw new HttpError(403,'Đề tài ngoài quyền');
 const student=await User.findOne({_id:v.id(req.body.studentUserId),role:'student',disabled:{$ne:true}}),mentor=await User.findOne({_id:v.id(req.body.mentorUserId),role:'mentor',disabled:{$ne:true}});
 const company=topic.companyUserId?await User.findById(topic.companyUserId):await User.findOne({walletAddress:topic.companyWallet});
 if(!student||!mentor||!company||company.role!=='company'||company.disabled)throw new HttpError(400,'Thành viên không hợp lệ');
 if(req.user.role==='company'&&!await Application.exists({$and:[identity.owned(req.user,'companyUserId','companyWallet'),identity.owned(student,'studentUserId','studentWallet')],status:'accepted'}))throw new HttpError(403,'Sinh viên chưa được doanh nghiệp chấp nhận ứng tuyển');
 const normalized=await Student.findOne({userId:student._id});if(!normalized)throw new HttpError(409,'Sinh viên cần hoàn thiện tài khoản');
 const startDate=v.date(req.body.startDate,'Bắt đầu'),endDate=v.date(req.body.endDate,'Kết thúc');
 if(batch.status!=='open'||startDate>=endDate||startDate<batch.startDate||endDate>batch.endDate||topic.kpis.reduce((s,k)=>s+k.weightPercent,0)!==100||topic.kpis.some(k=>k.deadline<startDate||k.deadline>endDate))throw new HttpError(400,'Kỳ/ngày/rubric không hợp lệ');
 res.status(201).json(await Assignment.create({topicId:topic._id,studentId:normalized._id,kpiAtAssign:100,batchId:batch._id,...identity.refs(student,'studentUserId','studentWallet'),...identity.refs(company,'companyUserId','companyWallet'),...identity.refs(mentor,'mentorUserId','mentorWallet'),startDate,endDate,lifecycle:'proposed',kpis:topic.kpis.map((k,i)=>({milestoneIndex:i,title:k.title,description:k.description,weightPercent:k.weightPercent,deadline:k.deadline,status:'pending'})),history:[v.event(req.user,'placement.proposed')]}));
}));
router.patch('/placements/:id/details',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['mentorUserId','startDate','endDate','reason','version']);const a=await require('./placementPolicy').load(req.user,req.params.id);
 if(!['proposed','approved'].includes(a.lifecycle))throw new HttpError(409,'Chỉ sửa trước khi hoạt động');
 const mentor=await User.findOne({_id:v.id(req.body.mentorUserId),role:'mentor',disabled:{$ne:true}}),batch=await InternshipBatch.findById(a.batchId);if(!mentor||!batch||batch.status!=='open')throw new HttpError(400,'Giảng viên/kỳ không hợp lệ');
 const startDate=v.date(req.body.startDate,'Bắt đầu'),endDate=v.date(req.body.endDate,'Kết thúc');if(startDate>=endDate||startDate<batch.startDate||endDate>batch.endDate||a.kpis.some(k=>k.deadline<startDate||k.deadline>endDate))throw new HttpError(400,'Ngày không hợp lệ');
 res.json(await v.updateVersion(Assignment,a,req.body.version,{mentorUserId:mentor._id,mentorWallet:identity.validWallet(mentor)?mentor.walletAddress:null,startDate,endDate},v.event(req.user,'placement.details_updated',{reason:v.text(req.body.reason,'Lý do',{required:true})})));
}));
module.exports=router;

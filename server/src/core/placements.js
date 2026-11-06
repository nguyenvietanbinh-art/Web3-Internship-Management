const identity=require('../services/businessIdentity');
const router=require('express').Router();
const User=require('../models/User'),Student=require('../models/Student'),Topic=require('../models/Topic'),Assignment=require('../models/Assignment');
const {InternshipBatch,Application}=require('../models/BusinessModels');
const {requireRole}=require('../middleware/auth');
const {asyncHandler,HttpError}=require('../utils/http');const v=require('./shared'),policy=require('./placementPolicy');
router.get('/batches',asyncHandler(async(req,res)=>{
 const filter=req.user.role==='admin'?{}:{$or:[{status:'open'},{_id:{$in:await Assignment.find(policy.scope(req.user)).distinct('batchId')}}]};
 const q=v.search(req.query.q);if(q)filter.name=q;res.json(await v.paged(InternshipBatch,filter,req.query));
}));
router.post('/batches',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['code','name','startDate','endDate','status']);const code=v.text(req.body.code,'Mã kỳ',{required:true,max:32});if(!/^[A-Z0-9_-]+$/.test(code))throw new HttpError(400,'Mã kỳ chỉ chứa A-Z, số, _ hoặc -');
 const startDate=v.date(req.body.startDate,'Ngày bắt đầu'),endDate=v.date(req.body.endDate,'Ngày kết thúc');if(endDate<=startDate||endDate-startDate>366*864e5)throw new HttpError(400,'Khoảng thời gian kỳ không hợp lệ');
 res.status(201).json(await InternshipBatch.create({code,name:v.text(req.body.name,'Tên kỳ',{required:true,max:200}),startDate,endDate,status:v.choice(req.body.status||'draft',['draft','open'],'Trạng thái'),history:[v.event(req.user,'batch.created')]}));
}));
router.patch('/batches/:id',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['name','status','version']);const doc=await InternshipBatch.findById(v.id(req.params.id));if(!doc)throw new HttpError(404,'Không có kỳ thực tập');
 const set={};if(req.body.name!==undefined)set.name=v.text(req.body.name,'Tên kỳ',{required:true,max:200});if(req.body.status!==undefined){const status=v.choice(req.body.status,['draft','open','closed'],'Trạng thái');if(doc.status==='closed'&&status!=='closed')throw new HttpError(409,'Không mở lại kỳ đã đóng');if(status==='closed'&&await Assignment.exists({batchId:doc._id,lifecycle:{$in:['proposed','approved','active']}}))throw new HttpError(409,'Cần kết thúc/hủy các phân công trước khi đóng kỳ');set.status=status;}
 res.json(await v.updateVersion(InternshipBatch,doc,req.body.version,set,v.event(req.user,'batch.updated',{before:{name:doc.name,status:doc.status},after:set})));
}));
router.get('/directory',requireRole('admin','company','mentor'),asyncHandler(async(req,res)=>{
 const role=v.choice(req.query.role,['student','company','mentor'],'Vai trò');let filter={role,disabled:{$ne:true}};
 if(req.user.role==='mentor'){
  const assignments=await Assignment.find(policy.scope(req.user)).lean();const wallets=new Set(assignments.flatMap(a=>[a.studentWallet,a.companyWallet,a.mentorWallet]));filter.walletAddress={$in:[...wallets]};
 }else if(req.user.role==='company'&&role==='student'){
  const assigned=await Assignment.find(policy.scope(req.user)).distinct('studentWallet');
  const applicants=await Application.find({companyWallet:req.user.walletAddress,status:'accepted'}).distinct('studentWallet');
  const legacy=await Topic.find({companyWallet:req.user.walletAddress}).distinct('assignedStudentWallet');
  filter.walletAddress={$in:[...new Set([...assigned,...applicants,...legacy].filter(Boolean))]};
 }else if(req.user.role==='company'&&role!=='mentor')filter.walletAddress=req.user.walletAddress;
 // Companies only discover minimal identity to propose placements, never private CV/email.
 const q=v.search(req.query.q);if(q)filter.$or=[{name:q},{walletAddress:q}];res.json(await v.paged(User,filter,req.query,{select:'name role walletAddress'}));
}));
router.get('/placements',asyncHandler(async(req,res)=>{
 const filter=policy.scope(req.user);if(req.query.batchId)filter.batchId=v.id(req.query.batchId);if(req.query.lifecycle)filter.lifecycle=v.choice(req.query.lifecycle,['proposed','approved','active','completed','cancelled'],'Trạng thái');
 const data=await v.paged(Assignment,filter,req.query);const topicIds=data.items.map(a=>a.topicId);const topics=await Topic.find({_id:{$in:topicIds}}).select('title companyName kpis.title kpis.description kpis.weightPercent kpis.deadline').lean();const map=new Map(topics.map(t=>[String(t._id),t]));
 data.items=data.items.map(a=>({...a,topic:map.get(String(a.topicId))}));
 if(identity.enabled()){
  const ids=data.items.flatMap(a=>[a.studentUserId,a.companyUserId,a.mentorUserId].filter(Boolean)),people=await User.find({_id:{$in:ids}}).select('name role').lean(),names=new Map(people.map(u=>[String(u._id),u.name]));
  data.items=data.items.map(a=>({...a,participantNames:Object.fromEntries(['student','company','mentor'].map(role=>[role,names.get(String(a[role+'UserId']))||null]))}));
 }
 res.json(data);
}));
router.post('/placements',requireRole('admin','company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['topicId','batchId','studentWallet','mentorWallet','startDate','endDate']);
 const topic=await Topic.findById(v.id(req.body.topicId)),batch=await InternshipBatch.findById(v.id(req.body.batchId));
 if(!topic||!batch)throw new HttpError(404,'Không có đề tài hoặc kỳ');if(req.user.role==='company'&&topic.companyWallet!==req.user.walletAddress)throw new HttpError(403,'Không phải đề tài của doanh nghiệp');
 if(batch.status!=='open')throw new HttpError(409,'Kỳ chưa mở');
 const studentWallet=v.wallet(req.body.studentWallet),mentorWallet=v.wallet(req.body.mentorWallet);
 const studentUser=await User.findOne({walletAddress:studentWallet,role:'student',disabled:{$ne:true}}),mentor=await User.findOne({walletAddress:mentorWallet,role:'mentor',disabled:{$ne:true}}),company=await User.findOne({walletAddress:topic.companyWallet,role:'company',disabled:{$ne:true}});
 if(!studentUser||!mentor||!company)throw new HttpError(400,'Sinh viên, giảng viên hoặc doanh nghiệp chưa hợp lệ');
 const student=await Student.findOne({userId:studentUser._id});if(!student)throw new HttpError(409,'Sinh viên cần đăng nhập để có hồ sơ chuẩn hóa');
 const startDate=v.date(req.body.startDate,'Ngày bắt đầu'),endDate=v.date(req.body.endDate,'Ngày kết thúc');if(startDate>=endDate||startDate<batch.startDate||endDate>batch.endDate)throw new HttpError(400,'Ngày phân công phải nằm trong kỳ');
 const sum=topic.kpis.reduce((n,k)=>n+k.weightPercent,0);if(sum!==100)throw new HttpError(409,'Rubric đề tài chưa đủ trọng số100');
 if(topic.kpis.some(k=>k.deadline<startDate||k.deadline>endDate))throw new HttpError(400,'Hạn KPI phải nằm trong thời gian phân công');
 const kpis=topic.kpis.map((k,i)=>({milestoneIndex:i,title:k.title,description:k.description,weightPercent:k.weightPercent,deadline:k.deadline,status:'pending'}));
 const doc=await Assignment.create({topicId:topic._id,studentId:student._id,kpiAtAssign:sum,batchId:batch._id,studentWallet,companyWallet:topic.companyWallet,mentorWallet,startDate,endDate,lifecycle:'proposed',kpis,history:[v.event(req.user,'placement.proposed')]});
 res.status(201).json(doc);
}));
router.patch('/placements/:id/details',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['mentorWallet','startDate','endDate','reason','version']);const doc=await policy.load(req.user,req.params.id);
 if(!['proposed','approved'].includes(doc.lifecycle))throw new HttpError(409,'Chỉ chỉnh giảng viên/ngày trước khi phân công hoạt động');
 const batch=await InternshipBatch.findById(doc.batchId);if(!batch||batch.status!=='open')throw new HttpError(409,'Kỳ không còn mở');
 const mentorWallet=v.wallet(req.body.mentorWallet);if(!await User.exists({walletAddress:mentorWallet,role:'mentor',disabled:{$ne:true}}))throw new HttpError(400,'Giảng viên chưa hợp lệ');
 const startDate=v.date(req.body.startDate,'Ngày bắt đầu'),endDate=v.date(req.body.endDate,'Ngày kết thúc');if(startDate>=endDate||startDate<batch.startDate||endDate>batch.endDate)throw new HttpError(400,'Ngày phải trong kỳ');
 if(doc.kpis?.some(k=>k.deadline<startDate||k.deadline>endDate))throw new HttpError(400,'Ngày phân công phải bao gồm các hạn KPI');
 const reason=v.text(req.body.reason,'Lý do',{required:true,max:1000});res.json(await v.updateVersion(Assignment,doc,req.body.version,{mentorWallet,startDate,endDate},v.event(req.user,'placement.details_updated',{before:{mentorWallet:doc.mentorWallet,startDate:doc.startDate,endDate:doc.endDate},after:{mentorWallet,startDate,endDate},reason})));
}));
router.patch('/placements/:id',requireRole('admin','company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['lifecycle','reason','version']);const doc=await policy.load(req.user,req.params.id),target=v.choice(req.body.lifecycle,['approved','active','completed','cancelled'],'Trạng thái');
 const allowed={proposed:['approved','cancelled'],approved:['active','cancelled'],active:['completed','cancelled'],completed:[],cancelled:[]};
 if(!allowed[doc.lifecycle]?.includes(target))throw new HttpError(409,'Chuyển trạng thái không hợp lệ');
 if(['approved','completed'].includes(target)&&req.user.role!=='admin')throw new HttpError(403,'Nhà trường phê duyệt phân công/kết quả');
 if(target==='active'&&(doc.startDate>new Date()||doc.endDate<new Date()))throw new HttpError(409,'Chưa đến hoặc đã hết thời gian thực tập');
 if(target==='completed'){
  if(!doc.kpis?.length||doc.kpis.some(k=>k.status!=='approved')||doc.kpiScore===null)throw new HttpError(409,'Cần duyệt đủ KPI theo phân công');
  const {Report,WorkSession}=require('../models/BusinessModels');if(!await Report.exists({assignmentId:doc._id,kind:'final',state:'approved',current:true}))throw new HttpError(409,'Cần báo cáo cuối kỳ đã duyệt');if(await WorkSession.exists({assignmentId:doc._id,state:{$in:['open','pending','needs_adjustment']}}))throw new HttpError(409,'Cần xử lý phiên giờ làm chưa duyệt');
 }
 const reason=v.text(req.body.reason,'Lý do',{required:true,max:1000});res.json(await v.updateVersion(Assignment,doc,req.body.version,{lifecycle:target,...(target==='cancelled'?{studentBatchKey:null}:{})},v.event(req.user,'placement.state',{before:doc.lifecycle,after:target,reason})));
}));
module.exports=router;

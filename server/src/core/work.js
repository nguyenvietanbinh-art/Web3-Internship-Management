const identity=require('../services/businessIdentity');
const router=require('express').Router();const Task=require('../models/Task'),WorkLog=require('../models/WorkLog');
const {requireRole}=require('../middleware/auth');const {asyncHandler,HttpError}=require('../utils/http');const v=require('./shared'),policy=require('./placementPolicy');
async function scope(user){return{assignmentId:{$in:await require('../models/Assignment').find(policy.scope(user)).distinct('_id')}};}
async function resource(Model,user,id,active=false){const doc=await Model.findOne({_id:v.id(id),...await scope(user)});if(!doc)throw new HttpError(404,'Không có bản ghi trong phạm vi quyền');const assignment=await policy.load(user,String(doc.assignmentId),{active});return{doc,assignment};}
router.get('/tasks',asyncHandler(async(req,res)=>{
 const filter=await scope(req.user);if(req.query.assignmentId){await policy.load(req.user,req.query.assignmentId);filter.assignmentId=req.query.assignmentId;}
 if(req.query.status)filter.status=v.choice(req.query.status,['todo','in_progress','review','done'],'Trạng thái');const q=v.search(req.query.q);if(q)filter.title=q;res.json(await v.paged(Task,filter,req.query));
}));
router.post('/tasks',requireRole('company','mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['assignmentId','title','description','priority','dueDate']);const a=await policy.load(req.user,req.body.assignmentId,{active:true});
 const dueDate=v.date(req.body.dueDate,'Hạn task');if(dueDate<a.startDate||dueDate>a.endDate)throw new HttpError(400,'Hạn task ngoài thời gian phân công');
 res.status(201).json(await Task.create({assignmentId:a._id,topicId:a.topicId,title:v.text(req.body.title,'Tên task',{required:true,max:200}),description:v.text(req.body.description,'Mô tả'),priority:v.choice(req.body.priority||'medium',['low','medium','high','urgent'],'Độ ưu tiên'),dueDate,companyUserId:a.companyUserId,studentUserId:a.studentUserId,companyWallet:a.companyWallet,assignedStudentWallet:a.studentWallet,status:'todo',progress:0,history:[v.event(req.user,'task.created')]}));
}));
router.patch('/tasks/:id',requireRole('student','company','mentor'),asyncHandler(async(req,res)=>{
 const {doc,assignment}=await resource(Task,req.user,req.params.id,true);const allowed=req.user.role==='student'?['status','progress','version']:['title','description','priority','dueDate','status','progress','version'];v.keys(req.body,allowed);const set={};
 if(req.body.title!==undefined)set.title=v.text(req.body.title,'Tên task',{required:true,max:200});if(req.body.description!==undefined)set.description=v.text(req.body.description,'Mô tả');
 if(req.body.priority!==undefined)set.priority=v.choice(req.body.priority,['low','medium','high','urgent'],'Ưu tiên');
 if(req.body.dueDate!==undefined){set.dueDate=v.date(req.body.dueDate,'Hạn');if(set.dueDate<assignment.startDate||set.dueDate>assignment.endDate)throw new HttpError(400,'Hạn ngoài phân công');}
 if(req.body.status!==undefined)set.status=v.choice(req.body.status,['todo','in_progress','review','done'],'Trạng thái');if(req.body.progress!==undefined)set.progress=v.integer(req.body.progress,0,100,'Tiến độ');
 const progress=set.progress??doc.progress,status=set.status??doc.status;if((status==='done')!==(progress===100))throw new HttpError(400,'Task Xong phải có tiến độ100%; task khác chưa đủ100%');
 set.completedAt=status==='done'?new Date():null;res.json(await v.updateVersion(Task,doc,req.body.version,set,v.event(req.user,'task.updated',{before:{status:doc.status,progress:doc.progress,title:doc.title,priority:doc.priority,dueDate:doc.dueDate},after:set})));
}));
router.get('/worklogs',asyncHandler(async(req,res)=>{
 const filter=await scope(req.user);if(req.query.assignmentId){await policy.load(req.user,req.query.assignmentId);filter.assignmentId=req.query.assignmentId;}const q=v.search(req.query.q);if(q)filter.title=q;res.json(await v.paged(WorkLog,filter,req.query));
}));
function logInput(body){return{title:v.text(body.title,'Tiêu đề',{required:true,max:200}),tasksDone:v.text(body.tasksDone,'Công việc đã làm',{required:true}),challenges:v.text(body.challenges,'Khó khăn'),nextPlan:v.text(body.nextPlan,'Kế hoạch')};}
router.post('/worklogs',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['assignmentId','weekNumber','title','tasksDone','challenges','nextPlan']);const a=await policy.load(req.user,req.body.assignmentId,{active:true});
 res.status(201).json(await WorkLog.create({...logInput(req.body),weekNumber:v.integer(req.body.weekNumber,1,104,'Tuần'),assignmentId:a._id,topicId:a.topicId,...identity.participants(a),studentName:req.user.name,status:'submitted',history:[v.event(req.user,'worklog.submitted')]}));
}));
router.patch('/worklogs/:id',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['title','tasksDone','challenges','nextPlan','version']);const {doc}=await resource(WorkLog,req.user,req.params.id,true);if(doc.status==='approved')throw new HttpError(409,'Nhật ký đã duyệt không được sửa');
 res.json(await v.updateVersion(WorkLog,doc,req.body.version,{...logInput(req.body),status:'submitted',mentorFeedback:'',reviewedAt:null},v.event(req.user,'worklog.revised',{previous:{title:doc.title,tasksDone:doc.tasksDone,challenges:doc.challenges,nextPlan:doc.nextPlan,status:doc.status}})));
}));
router.patch('/worklogs/:id/review',requireRole('company','mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['status','mentorFeedback','version']);const {doc}=await resource(WorkLog,req.user,req.params.id,true);if(doc.status!=='submitted')throw new HttpError(409,'Chỉ duyệt nhật ký vừa nộp');
 const set={status:v.choice(req.body.status,['approved','need_revision'],'Trạng thái'),mentorFeedback:v.text(req.body.mentorFeedback,'Nhận xét',{required:true,max:5000}),reviewedAt:new Date()};res.json(await v.updateVersion(WorkLog,doc,req.body.version,set,v.event(req.user,'worklog.reviewed',{status:set.status,comment:set.mentorFeedback})));
}));
module.exports=router;

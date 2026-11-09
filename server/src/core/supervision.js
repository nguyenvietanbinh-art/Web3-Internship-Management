// Read-only administrator oversight. Never exposes student drafts or file bytes.
const router=require('express').Router();
const mongoose=require('mongoose');
const {requireRole}=require('../middleware/auth');
const {asyncHandler}=require('../utils/http');
const Assignment=require('../models/Assignment');
const User=require('../models/User');
const Student=require('../models/Student');
const Task=require('../models/Task');
const WorkLog=require('../models/WorkLog');
const {InternshipBatch,WorkSession}=require('../models/BusinessModels');
const policy=require('./placementPolicy'),v=require('./shared');
router.use('/admin/supervision',requireRole('admin'));
async function studentScope(query,user={role:'admin'}){
 const filter={};
 if(require('../config/env').schoolWorkflowEnabled&&query.batchId){
  const enrollment={};if(query.batchId)enrollment.batchId=v.id(query.batchId);
  filter.userId={$in:await require('../workflow/models').Enrollment.find(enrollment).distinct('studentUserId')};
 }
 if(query.companyUserId||query.mentorUserId){
  const assignment=policy.scope({role:'admin'});
  for(const key of ['batchId','companyUserId','mentorUserId'])if(query[key])assignment[key]=v.id(query[key]);
  const ids=await Assignment.find(assignment).distinct('studentUserId');
  filter.userId={$in:ids.filter(id=>!filter.userId||filter.userId.$in.some(allowed=>String(allowed)===String(id)))};
 }
 if(user.role!=='admin'){
  const owned=policy.scope(user);if(query.batchId)owned.batchId=v.id(query.batchId);
  let allowed=await Assignment.find(owned).distinct('studentUserId');
  if(user.role==='company'&&query.includeAdmissions==='true'&&query.batchId){const admitted=await require('../workflow/models').Enrollment.find({batchId:v.id(query.batchId),eligibility:'eligible','admission.state':'active','admission.companyUserId':user._id}).distinct('studentUserId');allowed=[...allowed,...admitted];}
  filter.userId={$in:allowed.filter(id=>!filter.userId||filter.userId.$in.some(x=>String(x)===String(id)))};
 }
 return filter;
}
router.get(['/admin/supervision/students','/student-lookup'],requireRole('admin','company','mentor'),asyncHandler(async(req,res)=>{
 const {page,limit,skip}=v.pagination({...req.query,limit:req.query.limit||'10'}),filter=await studentScope(req.query,req.user),search=v.personSearch(req.query.q);
 const pipeline=[{$match:filter},{$lookup:{from:'users',localField:'userId',foreignField:'_id',pipeline:[{$match:{role:'student'}},{$project:{name:1,email:1,disabled:1}}],as:'user'}},{$unwind:'$user'}];
 if(search)pipeline.push({$match:{$or:[{fullName:search},{studentCode:search},{'user.name':search},{'user.email':search}]}});
 pipeline.push({$facet:{items:[{$sort:{fullName:1,_id:1}},{$skip:skip},{$limit:limit},{$lookup:{from:'assignments',localField:'userId',foreignField:'studentUserId',pipeline:[{$match:policy.scope(req.user)},{$project:{lifecycle:1}}],as:'placements'}},{$project:{_id:'$userId',name:'$user.name',studentCode:1,email:'$user.email',disabled:'$user.disabled',internshipStates:'$placements.lifecycle',assignmentCount:{$size:'$placements'}}}],count:[{$count:'total'}]}});
 const [result]=await Student.aggregate(pipeline),total=result.count[0]?.total||0;
 res.json({items:result.items,total,page,limit,pages:Math.max(1,Math.ceil(total/limit)),readOnly:true});
}));
router.get(['/admin/supervision/students/:id/placements','/student-lookup/:id/placements'],requireRole('admin','company','mentor'),asyncHandler(async(req,res)=>{
 const studentUserId=v.id(req.params.id),eligible=await Student.exists({$and:[await studentScope(req.query,req.user),{userId:studentUserId}]});
 if(!eligible)throw new (require('../utils/http').HttpError)(404,'Không có sinh viên trong phạm vi bộ lọc');
 if(req.user.role==='company'&&req.query.includeAdmissions==='true'&&req.query.batchId){const roster=await require('../workflow/workRoster').roster(req.user,{batchId:req.query.batchId,studentUserId,limit:'100'});const batch=await InternshipBatch.findById(req.query.batchId).select('name').lean();return res.json({items:roster.items.map(a=>({...a,batch,topicSnapshot:a.topic,company:{name:req.user.name}})),readOnly:true});}
 const conditions={studentUserId};
 for(const key of ['batchId','companyUserId','mentorUserId'])if(req.query[key])conditions[key]=v.id(req.query[key]);
 const filter={$and:[policy.scope(req.user),conditions]};
 const rows=await Assignment.find(filter).select('_id batchId studentUserId studentWallet companyUserId companyWallet mentorUserId mentorWallet topicId kpis kpiScore topicSnapshot.title lifecycle startDate endDate __v').sort({startDate:-1,_id:1}).lean();
 const [batches,people]=await Promise.all([InternshipBatch.find({_id:{$in:rows.map(a=>a.batchId)}}).select('name').lean(),User.find({_id:{$in:rows.flatMap(a=>[a.companyUserId,a.mentorUserId]).filter(Boolean)}}).select('name companyName').lean()]);
 const name=(items,id)=>items.find(x=>String(x._id)===String(id));
 res.json({items:rows.map(a=>({...a,batch:name(batches,a.batchId),company:name(people,a.companyUserId),mentor:name(people,a.mentorUserId)})),readOnly:true});
}));
router.get('/admin/supervision/filters',asyncHandler(async(req,res)=>{
 const assignments=await Assignment.find(policy.scope(req.user)).select('batchId studentUserId companyUserId mentorUserId').lean();
 const ids=key=>[...new Set(assignments.map(a=>String(a[key]||'')).filter(Boolean))];
 const batchIds=require('../config/env').schoolWorkflowEnabled?await require('../workflow/models').Enrollment.distinct('batchId'):ids('batchId');
 const [batches,people]=await Promise.all([InternshipBatch.find({_id:{$in:batchIds}}).select('name').sort({startDate:-1}).lean(),User.find({_id:{$in:[...ids('companyUserId'),...ids('mentorUserId')]}}).select('name companyName role').sort({name:1}).lean()]);
 const peopleFor=key=>people.filter(u=>ids(key).includes(String(u._id))).map(u=>({_id:u._id,name:u.companyName||u.name}));
 res.json({batches,companies:peopleFor('companyUserId'),mentors:peopleFor('mentorUserId')});
}));
router.get('/admin/supervision/assignments',asyncHandler(async(req,res)=>{
 const filter=policy.scope(req.user);for(const key of ['batchId','companyUserId','studentUserId','mentorUserId'])if(req.query[key])filter[key]=v.id(req.query[key]);
 const data=await v.paged(Assignment,filter,req.query,{select:'studentUserId companyUserId mentorUserId batchId topicSnapshot lifecycle startDate endDate kpis kpiScore studentWallet topicId',sort:{startDate:-1,_id:1}});
 const ids=data.items.flatMap(a=>[a.studentUserId,a.companyUserId,a.mentorUserId]).filter(Boolean),[people,students,batches]=await Promise.all([User.find({_id:{$in:ids}}).select('name email companyName').lean(),Student.find({userId:{$in:data.items.map(a=>a.studentUserId)}}).select('userId studentCode').lean(),InternshipBatch.find({_id:{$in:data.items.map(a=>a.batchId)}}).select('name').lean()]);
 const person=id=>people.find(u=>String(u._id)===String(id));res.json({...data,items:data.items.map(a=>({...a,student:person(a.studentUserId),studentCode:students.find(s=>String(s.userId)===String(a.studentUserId))?.studentCode,batch:batches.find(b=>String(b._id)===String(a.batchId)),company:person(a.companyUserId),mentor:person(a.mentorUserId)})),readOnly:true});
}));
router.get('/admin/supervision/:kind',asyncHandler(async(req,res)=>{
 const kind=v.choice(req.params.kind,['tasks','logs','time'],'Danh sách giám sát'),{page,limit,skip}=v.pagination(req.query);
 const assignmentFilter=policy.scope(req.user);
 for(const key of ['batchId','companyUserId','studentUserId','mentorUserId'])if(req.query[key])assignmentFilter[key]=new mongoose.Types.ObjectId(v.id(req.query[key]));
 if(req.query.assignmentId)assignmentFilter._id=new mongoose.Types.ObjectId(v.id(req.query.assignmentId));
 const assignments=await Assignment.find(assignmentFilter).select('_id').lean();
 const Model={tasks:Task,logs:WorkLog,time:WorkSession}[kind],filter={assignmentId:{$in:assignments.map(a=>a._id)}};
 if(req.query.status)filter[kind==='time'?'state':'status']=v.choice(req.query.status,kind==='tasks'?['todo','in_progress','review','done']:kind==='logs'?['pending_submission','submitted','approved','need_revision']:['open','pending','needs_adjustment','approved','rejected'],'Trạng thái');
 const q=v.search(req.query.q);if(q&&kind!=='time')filter.title=q;
 const pipeline=[{$match:filter},{$lookup:{from:'assignments',localField:'assignmentId',foreignField:'_id',as:'assignment'}},{$unwind:'$assignment'}];
 for(const [name,field,collection]of [['batch','batchId','internship_batches'],['student','studentUserId','users'],['company','companyUserId','users'],['mentor','mentorUserId','users']]){
  pipeline.push({$lookup:{from:collection,localField:'assignment.'+field,foreignField:'_id',pipeline:[{$project:{name:1,companyName:1}}],as:name}},{$set:{[name]:{$arrayElemAt:['$'+name,0]}}});
 }
 pipeline.push({$facet:{items:[{$sort:kind==='time'?{checkInAt:1,_id:1}:{createdAt:-1,_id:-1}},{$skip:skip},{$limit:limit},{$project:{title:1,description:1,submission:1,review:1,requirement:1,challenges:1,nextPlan:1,status:1,state:1,confirmedProgress:1,dueDate:1,weekNumber:1,tasksDone:1,mentorFeedback:1,checkInAt:1,checkOutAt:1,minutes:1,reason:1,batch:1,student:1,company:1,mentor:1,'assignment.topicSnapshot.title':1,'assignment.lifecycle':1}}],summary:[{$group:{_id:null,total:{$sum:1},approvedMinutes:{$sum:{$cond:[{$eq:['$state','approved']},{$ifNull:['$minutes',0]},0]}},confirmedProgress:{$avg:'$confirmedProgress'}}}]}});
 const [data]=await Model.aggregate(pipeline),summary=data.summary[0]||{total:0,approvedMinutes:0,confirmedProgress:null};delete summary._id;
 res.json({items:data.items,summary,total:summary.total,page,limit,pages:Math.max(1,Math.ceil(summary.total/limit)),readOnly:true});
}));
module.exports=router;

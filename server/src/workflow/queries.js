const { Enrollment, Opportunity, Application } = require('./models');
const Assignment = require('../models/Assignment'), User=require('../models/User');
const {InternshipBatch:Batch}=require('../models/BusinessModels');
const v=require('../core/shared'),clock=require('./clock'),service=require('./service');
const mongoose=require('mongoose');
const {quota}=require('./applicationQuota');
async function students(batchId,query={}) {
 const b=await Batch.findById(v.id(String(batchId))).lean();if(!b)serviceFail();
 const {skip,limit,page}=v.pagination(query),now=clock.now(),due=now>=new Date(b.startDate.getTime()-7*86400000),filter={};
 const status=query.status||'all';v.choice(status,['all','unregistered','registered','missing_topic','has_topic','missing_mentor','assigned','active','completed'],'Bộ lọc');
 if(status==='unregistered')filter.registeredAt=null;if(status==='registered')filter.registeredAt={$type:'date'};
 if(status==='has_topic')filter.hasTopic=true;
 if(status==='missing_topic')Object.assign(filter,{hasTopic:false,actionable:true,...(query.due==='true'?{dueReached:true}:{})});
 if(status==='missing_mentor')Object.assign(filter,{hasTopic:true,hasMentor:false,actionable:true});
 if(status==='assigned')filter.hasMentor=true;if(['active','completed'].includes(status))filter['assignment.lifecycle']=status;
 const search=v.search(query.q);if(search)filter['student.name']=search;
 const summary={_id:null,total:{$sum:1},registered:{$sum:{$cond:['$registered',1,0]}},unregistered:{$sum:{$cond:['$registered',0,1]}},disabled:{$sum:{$cond:['$student.disabled',1,0]}},hasTopic:{$sum:{$cond:['$hasTopic',1,0]}},missingTopic:{$sum:{$cond:[{$and:['$actionable',{$not:['$hasTopic']}]},1,0]}},dueMissingTopic:{$sum:{$cond:[{$and:['$actionable',{$not:['$hasTopic']},'$dueReached']},1,0]}},missingMentor:{$sum:{$cond:[{$and:['$actionable','$hasTopic',{$not:['$hasMentor']}]},1,0]}},assigned:{$sum:{$cond:['$hasMentor',1,0]}},active:{$sum:{$cond:[{$eq:['$assignment.lifecycle','active']},1,0]}},completed:{$sum:{$cond:[{$eq:['$assignment.lifecycle','completed']},1,0]}}};
 const [data]=await Enrollment.aggregate([
  {$match:{batchId:new mongoose.Types.ObjectId(String(batchId)),eligibility:'eligible'}},
  {$lookup:{from:'users',localField:'studentUserId',foreignField:'_id',pipeline:[{$project:{name:1,email:1,disabled:1}}],as:'_student'}},
  {$lookup:{from:'assignments',localField:'assignmentId',foreignField:'_id',pipeline:[{$match:{workflow:true,activePlacement:true}},{$project:{lifecycle:1,mentorUserId:1,companyUserId:1,startDate:1,endDate:1,__v:1}}],as:'_assignment'}},
  {$set:{student:{$arrayElemAt:['$_student',0]},assignment:{$arrayElemAt:['$_assignment',0]},hasTopic:{$eq:['$admission.state','active']},registered:{$ne:['$registeredAt',null]},dueReached:due}},
  {$set:{actionable:{$eq:[{$ifNull:['$student.disabled',true]},false]},hasMentor:{$and:[{$ne:[{$ifNull:['$assignment.mentorUserId',null]},null]},'$hasTopic']}}},
  {$unset:['_student','_assignment','history']},
  {$facet:{summary:[{$group:summary}],items:[{$match:filter},{$sort:{'student.name':1,_id:1}},{$skip:skip},{$limit:limit}],filteredCount:[{$match:filter},{$count:'total'}]}},
 ]);
 const totals=data.summary[0]||{total:0,registered:0,unregistered:0,disabled:0,hasTopic:0,missingTopic:0,dueMissingTopic:0,missingMentor:0,assigned:0,active:0,completed:0};delete totals._id;const total=data.filteredCount[0]?.total||0;
 return {batch:b,summary:totals,items:data.items,total,page,limit,pages:Math.max(1,Math.ceil(total/limit)),serverNow:now.toISOString(),dueAt:new Date(b.startDate.getTime()-7*86400000).toISOString(),dueReached:due,timezone:'Asia/Ho_Chi_Minh',filters:{status,q:query.q||''}};
}
function serviceFail(){throw new (require('../utils/http').HttpError)(404,'Không tìm thấy kỳ');}
async function reminders(query={}) {const filter={};if(query.batchId)filter._id=v.id(query.batchId);if(query.type)filter.type=v.choice(query.type,['bachelor','engineer'],'Loại');const batches=await Batch.find({...filter,status:{$ne:'closed'}}).sort({startDate:1}).lean();return {items:await Promise.all(batches.map(b=>students(String(b._id),{limit:'1'}).then(r=>({batch:r.batch,summary:r.summary,dueAt:r.dueAt,dueReached:r.dueReached})))),serverNow:clock.now().toISOString()};}
async function mine(user) {const rows=await Enrollment.find({studentUserId:user._id}).sort({createdAt:-1}).lean(),batches=await Batch.find({_id:{$in:rows.map(r=>r.batchId)}}).lean();return {items:rows.map(e=>({...e,batch:batches.find(b=>String(b._id)===String(e.batchId)),...quota(e),needsWallet:!user.walletVerified})),serverNow:clock.now().toISOString()};}
async function opportunities(actor,id,query) {const e=await service.enrollment(actor,id),b=await service.batch(e.batchId);const filter={batchId:e.batchId,status:'open',_id:{$nin:e.usedOpportunities},$expr:{$lt:['$confirmedCount','$capacity']}};const companies=await User.find({role:'company',disabled:{$ne:true}}).select('_id name companyName');filter.companyUserId={$in:companies.map(c=>c._id)};if(query.companyUserId)filter.companyUserId={$in:companies.filter(c=>String(c._id)===v.id(query.companyUserId)).map(c=>c._id)};if(query.q){const search=v.search(query.q);filter.$or=[{title:search},{description:search},{companyName:search}];}if(query.skill){const skills=await require('../models/Topic').find({requiredSkills:v.search(query.skill)}).select('_id').lean();filter.topicId={$in:skills.map(t=>t._id)};}const data=await v.paged(Opportunity,filter,query),requirements=await require('./skillComparison').requirements(data.items);return {...data,companies:companies.map(c=>({_id:c._id,name:c.companyName||c.name})),items:data.items.filter(o=>companies.some(c=>String(c._id)===String(o.companyUserId))).map(o=>({...service.opportunityDto(o),requiredSkills:requirements.get(String(o._id))})),...quota(e),hasAdmission:service.active(e),registrationOpen:clock.now()>=b.registrationOpensAt&&clock.now()<b.registrationClosesAt};}
async function dashboard(user) {if(user.role==='admin')return {scope:'admin',workflow:true,...await reminders()};if(user.role==='student')return {scope:'student',workflow:true,...await mine(user)};const rows=await Assignment.find({...require('../core/placementPolicy').scope(user)}).select('lifecycle');return {scope:user.role,workflow:true,totals:{placements:rows.length,activePlacements:rows.filter(a=>a.lifecycle==='active').length}};}
module.exports={students,reminders,mine,opportunities,dashboard};

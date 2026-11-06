const Assignment=require('../models/Assignment'),User=require('../models/User'),Topic=require('../models/Topic');
const {InternshipBatch:Batch}=require('../models/BusinessModels'),{Enrollment}=require('./models'),policy=require('../core/placementPolicy'),v=require('../core/shared');

// Accepted students are visible before formalization, without inventing an Assignment.
// Only an actual official assignment can be passed to task/time/report commands.
async function roster(user,query){
 const {page,limit,skip}=v.pagination(query),batchId=v.id(query.batchId);
 const [assigned,admitted]=await Promise.all([
  Assignment.find({...policy.scope(user),batchId}).lean(),
  Enrollment.find({batchId,eligibility:'eligible','admission.state':'active','admission.companyUserId':user._id}).select('studentUserId batchId admission assignmentId').lean(),
 ]);
 const ids=[...new Set([...assigned,...admitted].map(a=>String(a.studentUserId)))];
 const [people,topics,batch]=await Promise.all([
  User.find({_id:{$in:ids}}).select('name').lean(),
  Topic.find({_id:{$in:assigned.map(a=>a.topicId)}}).select('title').lean(),
  admitted.length?Batch.findById(batchId).select('startDate endDate').lean():Promise.resolve(null),
 ]);
 const names=new Map(people.map(u=>[String(u._id),u.name])),topicMap=new Map(topics.map(t=>[String(t._id),t])),official=new Set(assigned.map(a=>String(a.studentUserId)));
 const items=[...assigned.map(a=>({...a,pendingAssignment:false,topic:a.topicSnapshot||topicMap.get(String(a.topicId)),participantNames:{student:names.get(String(a.studentUserId))||'Sinh viên'}})),...admitted.filter(e=>!official.has(String(e.studentUserId))).map(e=>({
  _id:'pending:'+e._id,enrollmentId:e._id,batchId:e.batchId,studentUserId:e.studentUserId,pendingAssignment:true,lifecycle:'awaiting_assignment',topic:{title:e.admission.title},participantNames:{student:names.get(String(e.studentUserId))||'Sinh viên'},startDate:batch?.startDate,endDate:batch?.endDate,
 }))].sort((a,b)=>a.participantNames.student.localeCompare(b.participantNames.student,'vi')||String(a._id).localeCompare(String(b._id)));
 return {items:items.slice(skip,skip+limit),total:items.length,page,limit,pages:Math.max(1,Math.ceil(items.length/limit))};
}
module.exports={roster};

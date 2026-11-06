const Topic=require('../models/Topic'),User=require('../models/User');
const {Opportunity}=require('./models'),svc=require('./service');

// Called only from an explicit batch creation/sync command, never from a catalog GET.
// Existing opportunities (including company-closed ones) are never reopened or overwritten.
async function populate(actor,batch,session){
 const companies=await User.find({role:'company',disabled:{$ne:true}}).select('_id name companyName').session(session).lean();
 const owners=new Map(companies.map(u=>[String(u._id),u]));
 const topics=await Topic.find({status:'open',companyUserId:{$in:companies.map(u=>u._id)}}).sort({_id:1}).session(session).lean();
 const existing=new Set((await Opportunity.find({batchId:batch._id}).select('topicId').session(session).lean()).map(o=>String(o.topicId)));
 const result={created:0,existing:0,skipped:[],adjustedDeadlines:0};
 for(const candidate of topics){
  if(existing.has(String(candidate._id))){result.existing++;continue;}
  const valid=Number.isInteger(candidate.maxSlots)&&candidate.maxSlots>=1&&candidate.maxSlots<=1000&&candidate.kpis?.length&&candidate.kpis.every(k=>k.title&&k.description&&Number.isInteger(k.weightPercent)&&k.weightPercent>0&&Number.isFinite(new Date(k.deadline).getTime()))&&candidate.kpis.reduce((n,k)=>n+k.weightPercent,0)===100;
  if(!valid){result.skipped.push({topicId:String(candidate._id),reason:'INVALID_CAPACITY_OR_KPIS'});continue;}
  // Serialize publishing with edits/deletion of the original template.
  const topic=await Topic.findOneAndUpdate({_id:candidate._id,status:'open',companyUserId:candidate.companyUserId,__v:candidate.__v},{$inc:{__v:1}},{new:true,session});
  if(!topic)throw new (require('../utils/http').HttpError)(409,'Đề tài vừa thay đổi; vui lòng thử lại');
  const adjusted=[];
  const kpis=topic.kpis.map((k,i)=>{
   const fits=k.deadline>=batch.startDate&&k.deadline<=batch.endDate;
   if(!fits)adjusted.push(i);
   return {milestoneIndex:i,title:k.title,description:k.description,weightPercent:k.weightPercent,deadline:fits?k.deadline:batch.endDate};
  });
  const company=owners.get(String(topic.companyUserId));
  await Opportunity.create([{topicId:topic._id,companyUserId:topic.companyUserId,batchId:batch._id,title:topic.title,description:topic.description,companyName:company.companyName||company.name,capacity:topic.maxSlots,confirmedCount:0,status:'open',schoolAllocationAllowed:false,topicVersion:topic.__v,kpis,history:[svc.event(actor,'batch_catalog_inherited',{topicVersion:topic.__v,adjustedDeadlineIndexes:adjusted,reason:'Publish open company topic for student applications in this period'})]}],{session});
  result.created++;result.adjustedDeadlines+=adjusted.length;
 }
 return result;
}
module.exports={populate};

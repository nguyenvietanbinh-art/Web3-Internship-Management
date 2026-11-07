const {HttpError}=require('../utils/http'),v=require('../core/shared'),svc=require('./service'),clock=require('./clock');
const {Opportunity}=require('./models'),{CV}=require('../models/BusinessModels'),User=require('../models/User'),skills=require('./skillComparison'),nlp=require('../services/nlpClient');
function state(batch,enrollment,now){return {allocation_available_now:batch.status==='open'&&now>=new Date(batch.startDate.getTime()-7*86400000)&&now<batch.endDate,allocation_opens_at:new Date(batch.startDate.getTime()-7*86400000).toISOString(),participation_confirmation_required:!enrollment.registeredAt};}
async function suggest(actor,input){
 if(actor.role!=='admin')throw new HttpError(403,'Chỉ nhà trường được xem gợi ý phân công');
 v.keys(input,['enrollmentId','engine','topK']);const engine=v.choice(input.engine||'sbert',['sbert','tfidf'],'Phương pháp'),topK=v.integer(input.topK??5,1,20,'Số đề tài');
 const e=await svc.enrollment(actor,v.id(input.enrollmentId)),b=await svc.batch(e.batchId),availability=state(b,e,clock.now());
 if(svc.active(e))return {items:[],reason:'ALREADY_ADMITTED',inference_performed:false,...availability};
 const cv=await CV.findOne({ownerUserId:e.studentUserId}).lean();if(!cv)throw new HttpError(409,'Sinh viên chưa có CV để đối chiếu');
 const companies=await User.find({role:'company',disabled:{$ne:true}}).distinct('_id');
 const filter={batchId:e.batchId,companyUserId:{$in:companies},status:'open',schoolAllocationAllowed:true,$expr:{$lt:['$confirmedCount','$capacity']}};
 const candidates=await Opportunity.find(filter).sort({_id:1}).limit(50).lean(),total=await Opportunity.countDocuments(filter);
 if(!candidates.length)return {items:[],reason:'NO_ELIGIBLE_OPPORTUNITIES',inference_performed:false,catalog_total:total,...availability};
 const required=await skills.requirements(candidates),data=await nlp.request('/rank',{engine,top_k:topK,query:{id:String(cv._id),text:[cv.title,cv.summary,cv.education,cv.experience,cv.extractedText].filter(Boolean).join('\n').slice(0,50000),skills:cv.skills||[]},candidates:candidates.map(o=>({id:String(o._id),text:o.title+'\n'+o.description,skills:required.get(String(o._id))}))});
 return {...data,...availability,catalog_total:total,catalog_limit:50,scope:'admin/eligible-enrollment/available-school-allocatable-opportunities',automatic_assignment:false,items:data.results.map(r=>{const o=candidates.find(o=>String(o._id)===r.id);return {...r,title:o.title,companyName:o.companyName,companyUserId:String(o.companyUserId),remainingSlots:o.capacity-o.confirmedCount,...skills.compare(cv.skills,required.get(r.id))};})};
}
module.exports={suggest,state};

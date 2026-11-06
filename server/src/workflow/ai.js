const router=require('express').Router(),{requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const {CV}=require('../models/BusinessModels'),{Application,Opportunity}=require('./models'),svc=require('./service'),q=require('./queries'),v=require('../core/shared'),nlp=require('../services/nlpClient');
const cvText=cv=>[cv?.title,cv?.summary,cv?.education,cv?.experience,cv?.extractedText].filter(Boolean).join('\n').slice(0,50000);
const options=body=>({engine:v.choice(body.engine||'sbert',['sbert','tfidf'],'Engine'),top_k:v.integer(body.topK??5,1,20,'Top K')});
router.post('/school/ai/match',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['enrollmentId','engine','topK']);const opts=options(req.body),catalog=await q.opportunities(req.user,v.id(req.body.enrollmentId),{limit:'50'}),cv=await CV.findOne({ownerUserId:req.user._id}).lean();if(!cv||!cvText(cv).trim())throw new HttpError(409,'Hãy lưu CV trước khi phân tích');if(catalog.hasAdmission)return res.json({items:[],scope:'own-eligible-period',catalog_total:0,candidate_count:0,engine:opts.engine});
 const data=await nlp.request('/rank',{...opts,query:{id:String(cv._id),text:cvText(cv),skills:cv.skills||[]},candidates:catalog.items.map(o=>({id:String(o._id),text:o.title+'\n'+o.description,skills:[]}))});res.json({...data,catalog_total:catalog.total,catalog_limit:50,scope:'own-eligible-period/available-opportunities',items:data.results.map(r=>({...r,title:catalog.items.find(o=>String(o._id)===r.id)?.title}))});
}));
router.post('/school/ai/rank-applicants',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['opportunityId','engine','topK']);const opts=options(req.body),o=await Opportunity.findOne({_id:v.id(req.body.opportunityId),companyUserId:req.user._id}).lean();if(!o)throw new HttpError(404,'Cơ hội ngoài phạm vi');const filter={...svc.companyGrant(req.user),opportunityId:o._id},apps=await Application.find(filter).sort({_id:1}).limit(50).lean();
 const data=await nlp.request('/rank',{...opts,query:{id:String(o._id),text:o.title+'\n'+o.description,skills:[]},candidates:apps.map(a=>({id:String(a._id),text:cvText(a.cvSnapshot),skills:a.cvSnapshot?.skills||[]}))});res.json({...data,catalog_total:await Application.countDocuments(filter),catalog_limit:50,scope:'school-dispatched-company-snapshots',items:data.results.map(r=>({...r,title:apps.find(a=>String(a._id)===r.id)?.studentName}))});
}));
module.exports=router;

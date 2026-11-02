const identity=require('../services/businessIdentity');
const router=require('express').Router();
const {requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const {CV,Application,Report,WorkSession}=require('../models/BusinessModels');
const JD=require('../models/JD'),Task=require('../models/Task');
const policy=require('./placementPolicy'),v=require('./shared'),nlp=require('../services/nlpClient');
function options(body,extra=[]){v.keys(body,['engine','topK',...extra]);return{engine:v.choice(body.engine||'sbert',['sbert','tfidf'],'Engine'),top_k:v.integer(body.topK===undefined?5:body.topK,1,20,'Top K')};}
const cvText=cv=>[cv.title,cv.summary,cv.education,cv.experience,cv.extractedText].filter(Boolean).join('\n').slice(0,50000);
const jdText=jd=>[jd.title,jd.description,...jd.requirements||[]].filter(Boolean).join('\n').slice(0,50000);
router.get('/ai/status',asyncHandler(async(_req,res)=>res.json(await nlp.request('/status'))));
router.post('/ai/match',requireRole('student'),asyncHandler(async(req,res)=>{
 const opts=options(req.body),cv=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet')).lean();
 if(!cv||!(cvText(cv).trim()||cv.skills?.length))throw new HttpError(409,'Cần lưu CV có nội dung trước khi phân tích');
 const filter={status:'open',deadline:{$gt:new Date()}},jds=await JD.find(filter).sort({_id:1}).limit(50).lean();
 const data=await nlp.request('/rank',{...opts,query:{id:String(cv._id),text:cvText(cv),skills:cv.skills||[]},candidates:jds.map(j=>({id:String(j._id),text:jdText(j),skills:j.requirements||[]}))});
 res.json({...data,catalog_total:await JD.countDocuments(filter),catalog_limit:50,scope:'current-student-cv/open-jds',items:data.results.map(r=>({...r,title:jds.find(j=>String(j._id)===r.id)?.title}))});
}));
router.post('/ai/rank-applicants',requireRole('company'),asyncHandler(async(req,res)=>{
 const opts=options(req.body,['jdId']),jd=await JD.findOne({_id:v.id(req.body.jdId),...identity.owned(req.user,'companyUserId','companyWallet')}).lean();if(!jd)throw new HttpError(404,'JD ngoài phạm vi');
 const filter={jdId:jd._id,...identity.owned(req.user,'companyUserId','companyWallet'),status:{$ne:'withdrawn'}},apps=await Application.find(filter).sort({_id:1}).limit(50).lean();
 const data=await nlp.request('/rank',{...opts,query:{id:String(jd._id),text:jdText(jd),skills:jd.requirements||[]},candidates:apps.map(a=>({id:String(a._id),text:cvText(a.cvSnapshot),skills:a.cvSnapshot.skills||[]}))});
 res.json({...data,catalog_total:await Application.countDocuments(filter),catalog_limit:50,scope:'owned-jd/consented-application-snapshots',items:data.results.map(r=>({...r,title:apps.find(a=>String(a._id)===r.id)?.studentName}))});
}));
router.post('/ai/reports/:id/analyze',requireRole('company','mentor','admin'),asyncHandler(async(req,res)=>{
 const opts=options(req.body),report=await Report.findById(v.id(req.params.id)).lean();if(!report)throw new HttpError(404,'Không có báo cáo');
 const placement=await policy.load(req.user,String(report.assignmentId));
 const [tasks,sessions,versions]=await Promise.all([Task.find({assignmentId:placement._id}).select('status dueDate').lean(),WorkSession.find({assignmentId:placement._id}).select('state minutes').lean(),Report.countDocuments({assignmentId:placement._id})]);
 const criteria=(placement.kpis||[]).map(k=>k.title+' '+(k.description||'')).join('\n').slice(0,20000);
 const result=await nlp.request('/report',{content:report.content.slice(0,50000),criteria,engine:opts.engine,total_tasks:tasks.length,done_tasks:tasks.filter(t=>t.status==='done').length,overdue_tasks:tasks.filter(t=>t.status!=='done'&&t.dueDate<new Date()).length,open_sessions:sessions.filter(s=>s.state==='open'||s.state==='needs_adjustment').length,approved_minutes:sessions.filter(s=>s.state==='approved').reduce((n,s)=>n+(s.minutes||0),0),report_versions:versions});
 res.json({...result,reportId:String(report._id),scope:'authorized-assignment',analyzedAt:new Date().toISOString()});
}));
module.exports=router;

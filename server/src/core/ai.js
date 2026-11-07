const identity=require('../services/businessIdentity');
const router=require('express').Router();
const {requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const {CV,Application,Report,WorkSession}=require('../models/BusinessModels');
const JD=require('../models/JD'),Task=require('../models/Task');
const policy=require('./placementPolicy'),v=require('./shared'),nlp=require('../services/nlpClient');
function options(body,extra=[]){v.keys(body,['engine','topK',...extra]);return{engine:v.choice(body.engine||'sbert',['sbert','tfidf'],'Engine'),top_k:v.integer(body.topK===undefined?5:body.topK,1,20,'Top K')};}
const cvText=cv=>[cv.title,cv.summary,cv.education,cv.experience,cv.extractedText].filter(Boolean).join('\n').slice(0,50000);
const jdText=jd=>[jd.title,jd.description,...jd.requirements||[]].filter(Boolean).join('\n').slice(0,50000);
router.post('/ai/reports/:id/practice-analyze',requireRole('mentor'),asyncHandler(async(req,res)=>{
 const opts=options(req.body,['content']);
 const practice=await require('./reportPractice').load(req.user,req.params.id);
 const content=v.text(req.body.content,'Nội dung bài tập',{required:true,max:50000});
 const result=await nlp.request('/report',{content,criteria:practice.criteria,...practice.observations,engine:opts.engine});
 res.json({...result,practice:true,synthetic:true,official:false,source_report_id:practice.source_report_id});
}));
router.get('/ai/status',asyncHandler(async(_req,res)=>res.json(await nlp.request('/status'))));
router.post('/ai/match',requireRole('student'),asyncHandler(async(req,res)=>{
 if(require('../config/env').schoolWorkflowEnabled)throw new HttpError(409,'Sử dụng gợi ý đề tài theo kỳ được cấp','PERIOD_MATCHING_REQUIRED');
 const opts=options(req.body),cv=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet')).lean();
 if(!cv||!(cvText(cv).trim()||cv.skills?.length))throw new HttpError(409,'Cần lưu CV có nội dung trước khi phân tích');
 const filter={status:'open',deadline:{$gt:new Date()}},jds=await JD.find(filter).sort({_id:1}).limit(50).lean();
 const data=await nlp.request('/rank',{...opts,query:{id:String(cv._id),text:cvText(cv),skills:cv.skills||[]},candidates:jds.map(j=>({id:String(j._id),text:jdText(j),skills:j.requirements||[]}))});
 res.json({...data,catalog_total:await JD.countDocuments(filter),catalog_limit:50,scope:'current-student-cv/open-jds',items:data.results.map(r=>({...r,title:jds.find(j=>String(j._id)===r.id)?.title}))});
}));
router.post('/ai/rank-applicants',requireRole('company'),(_req,res)=>res.status(403).json({message:'Chức năng gợi ý ứng viên đã ngừng cung cấp cho doanh nghiệp',code:'FEATURE_NOT_AVAILABLE'}));
router.post('/ai/reports/:id/analyze',requireRole('mentor','student'),asyncHandler(async(req,res)=>{
 const opts=options(req.body,['reportSource']),source=v.choice(req.body.reportSource??'submitted',['submitted','sample'],'Nội dung phân tích'),report=await Report.findById(v.id(req.params.id)).lean();if(!report)throw new HttpError(404,'Không có báo cáo');
 const placement=await policy.load(req.user,String(report.assignmentId));if(req.user.role==='student'&&!['submitted','reviewed'].includes(report.state))throw new HttpError(409,'Chỉ chạy đánh giá trên bài nộp hiện tại đang chờ xét');
 if(req.user.role==='student'&&source!=='submitted')throw new HttpError(403,'Sinh viên chỉ phân tích bài nộp của mình');
 const content=source==='sample'?require('./reportSamples').read(report).content:report.content;
 const [tasks,sessions,versions]=await Promise.all([Task.find({assignmentId:placement._id}).select('status dueDate').lean(),WorkSession.find({assignmentId:placement._id}).select('state minutes').lean(),Report.countDocuments({assignmentId:placement._id})]);
 const criteria=(placement.kpis||[]).map(k=>k.title+' '+(k.description||'')).join('\n').slice(0,20000);
 const getBase=()=>nlp.request('/report',{content:content.slice(0,50000),criteria,engine:opts.engine,total_tasks:tasks.length,done_tasks:tasks.filter(t=>t.status==='done').length,overdue_tasks:tasks.filter(t=>t.status!=='done'&&t.dueDate<new Date()).length,open_sessions:sessions.filter(s=>s.state==='open'||s.state==='needs_adjustment').length,approved_minutes:sessions.filter(s=>s.state==='approved').reduce((n,s)=>n+(s.minutes||0),0),report_versions:versions});
 const evaluated=source==='submitted'?await require('./reportEvaluation').analyze(req.user,report,placement,opts.engine,getBase):await getBase();
 res.json({...evaluated,reportId:String(report._id),document:{source,contentHash:require('./reportSampleContent').hash(content),characters:content.length,reportVersion:report.version,official:source!=='sample'},scope:'authorized-assignment',analyzedAt:new Date().toISOString()});
}));
module.exports=router;

const router=require('express').Router(),Task=require('../models/Task'),v=require('./shared'),{requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http'),{resource,scope}=require('./workPolicy'),service=require('./taskEvaluationService'),nlp=require('../services/nlpClient');
router.put('/tasks/:id/criteria',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','objective','workItems','requiredProducts','criteria','progressWeight']);const {doc}=await resource(Task,req.user,req.params.id,true);
 if(doc.submissionVersion||doc.submission?.submittedAt||doc.status==='done'||doc.criterionReviews?.length)throw new HttpError(409,'Tiêu chí đã có bài nộp/xác nhận; không được thay trọng số hoặc sửa lịch sử');
 res.json(await v.updateVersion(Task,doc,req.body.version,{...service.criteriaInput(req.body),criteriaVersion:(doc.criteriaVersion||0)+1,criteriaApprovedBy:req.user._id,criteriaApprovedAt:new Date(),confirmedProgress:0,progress:0},v.event(req.user,'task.criteria_approved')));
}));
router.put('/tasks/:id/draft',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','content','result','challenges','solution','link']);const {doc}=await resource(Task,req.user,req.params.id,true);if(['review','done'].includes(doc.status))throw new HttpError(409,'Bài đang duyệt hoặc đã hoàn tất');
 const draft={savedAt:new Date()};for(const key of ['content','result','challenges','solution'])draft[key]=v.text(req.body[key],key,{max:20000});if(service.submissionText(draft).length>50000)throw new HttpError(400,'Nội dung bản nháp vượt 50.000 ký tự');draft.link=v.text(req.body.link,'Liên kết',{max:2000});
 if(draft.link){const u=(()=>{try{return new URL(draft.link);}catch{throw new HttpError(400,'Liên kết không hợp lệ');}})();if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new HttpError(400,'Liên kết không hợp lệ');}
 res.json(await v.updateVersion(Task,doc,req.body.version,{draft},v.event(req.user,'task.draft_saved')));
}));
router.post('/tasks/:id/analyze',requireRole('student','company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version']);const {doc}=await resource(Task,req.user,req.params.id);service.requireCriteria(doc);if(!doc.submission?.submittedAt)throw new HttpError(409,'Chưa có bài nộp');if(doc.status==='done')throw new HttpError(409,'Kết quả đã xác nhận, không ghi đè phân tích');
 if(doc.__v!==req.body.version)throw new HttpError(409,'Công việc đã thay đổi','STALE_VERSION');
 const full=await Task.findById(doc._id).select('+submissionFileData');let attachments=[],attachmentError=null;
 try{attachments=await service.attachmentText(full);}catch{attachmentError='Chưa đọc được tệp đính kèm; cần mở và kiểm tra trực tiếp.';}
 const content=service.submissionText(doc.submission);if(!content.trim()&&!attachments.length)throw new HttpError(422,'Cần văn bản để phân tích; liên kết hoặc ảnh chưa chứng minh nội dung');
 const result=await nlp.request('/evidence',{content:content||'Tài liệu đính kèm của bài nộp',criteria:doc.acceptanceCriteria.map(c=>({id:c.id,text:[c.title,c.description,c.requiredProduct].join('\n').slice(0,2000)})),attachments,engine:'sbert'});
 const analysis={...result,id:require('crypto').randomUUID(),submissionVersion:doc.submissionVersion,criteriaVersion:doc.criteriaVersion,analyzedAt:new Date(),attachmentError,attachmentPresent:!!doc.submission?.fileName,linkPresent:!!doc.submission?.link,verified:false};
 res.json(await v.updateVersion(Task,doc,req.body.version,{evidenceAnalysis:analysis},v.event(req.user,'task.analyzed',{analysisId:analysis.id,submissionVersion:doc.submissionVersion})));
}));
router.post('/tasks/:id/criteria-review',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','submissionVersion','criteriaVersion','reviews','comment']);const {doc}=await resource(Task,req.user,req.params.id,true);service.requireCriteria(doc);
 if(doc.status!=='review'||doc.submissionVersion!==req.body.submissionVersion||doc.criteriaVersion!==req.body.criteriaVersion)throw new HttpError(409,'Bài nộp hoặc tiêu chí đã thay đổi');
 if(!Array.isArray(req.body.reviews)||req.body.reviews.length!==doc.acceptanceCriteria.length)throw new HttpError(400,'Cần nhận xét đủ từng tiêu chí');
 const seen=new Set(),reviews=req.body.reviews.map(r=>{v.keys(r,['criterionId','state','comment','evidence']);if(seen.has(r.criterionId)||!doc.acceptanceCriteria.some(c=>c.id===r.criterionId))throw new HttpError(400,'Tiêu chí không hợp lệ');seen.add(r.criterionId);return{criterionId:r.criterionId,state:v.choice(r.state,['met','not_met','need_revision'],'Trạng thái tiêu chí'),comment:v.text(r.comment,'Nhận xét tiêu chí',{required:true,max:2000}),evidence:v.text(r.evidence,'Căn cứ đã kiểm tra',{required:true,max:2000}),confirmedBy:String(req.user._id),confirmedAt:new Date(),submissionVersion:doc.submissionVersion,criteriaVersion:doc.criteriaVersion};});
 const progress=service.officialProgress(doc.acceptanceCriteria,reviews),comment=v.text(req.body.comment,'Nhận xét chung',{required:true,max:5000}),done=progress===100;
 res.json(await v.updateVersion(Task,doc,req.body.version,{criterionReviews:reviews,confirmedProgress:progress,progress,status:done?'done':'in_progress',completedAt:done?new Date():null,review:{decision:done?'approved':'need_revision',comment,reviewedAt:new Date(),reviewerUserId:req.user._id}},v.event(req.user,'task.criteria_reviewed',{progress,submissionVersion:doc.submissionVersion,reviews})));
}));
router.get('/tasks/progress/summary',asyncHandler(async(req,res)=>{
 const tasks=await Task.find({...await scope(req.user),...(req.query.assignmentId?{assignmentId:v.id(req.query.assignmentId)}:{})}).lean();
 const eligible=tasks.filter(t=>t.criteriaApprovedAt&&t.acceptanceCriteria?.length),weight=eligible.reduce((n,t)=>n+t.progressWeight,0);
 res.json({tasks:tasks.length,eligibleTasks:eligible.length,missingCriteria:tasks.length-eligible.length,confirmedProgress:weight?Math.round(100*eligible.reduce((n,t)=>n+(t.confirmedProgress||0)*t.progressWeight,0)/weight)/100:null,completeCoverage:eligible.length===tasks.length&&tasks.length>0});
}));
module.exports=router;

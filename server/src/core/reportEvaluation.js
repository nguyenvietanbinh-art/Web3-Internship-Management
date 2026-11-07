const v=require('./shared'),{HttpError}=require('../utils/http'),policy=require('./placementPolicy'),{Report,InternshipBatch}=require('../models/BusinessModels'),Task=require('../models/Task'),nlp=require('../services/nlpClient'),{hash}=require('./taskEvaluationService');
const defaults=require('../../../shared/report-rubric.json');
const clone=value=>JSON.parse(JSON.stringify(value));
const auto=require('./reportAutoScoring'),inflight=new Map(),failures=new Map();
function validateRubric(input){
 v.keys(input,['criteria','gradingPolicy']);if(!Array.isArray(input.criteria)||input.criteria.length!==7)throw new HttpError(400,'Rubric cần đủ 7 tiêu chí');
 const seen=new Set(),criteria=input.criteria.map(row=>{v.keys(row,['id','label','max','hint']);if(seen.has(row.id)||!defaults.criteria.some(c=>c.id===row.id))throw new HttpError(400,'Mã tiêu chí rubric không hợp lệ');seen.add(row.id);return{id:row.id,label:v.text(row.label,'Tên tiêu chí',{required:true,max:200}),max:v.integer(row.max,1,100,'Điểm tối đa'),hint:v.text(row.hint,'Yêu cầu tiêu chí',{required:true,max:1500})};});
 if(criteria.reduce((n,c)=>n+c.max,0)!==100)throw new HttpError(400,'Tổng rubric phải đúng 100 điểm');
 let gradingPolicy;
 if(input.gradingPolicy){v.keys(input.gradingPolicy,['method','mentorWeight','companyWeight']);const method=v.choice(input.gradingPolicy.method,['mentor','weighted'],'Quy định chốt điểm');gradingPolicy={method};if(method==='weighted'){gradingPolicy.mentorWeight=v.integer(input.gradingPolicy.mentorWeight,1,99,'Trọng số giảng viên');gradingPolicy.companyWeight=v.integer(input.gradingPolicy.companyWeight,1,99,'Trọng số doanh nghiệp');if(gradingPolicy.mentorWeight+gradingPolicy.companyWeight!==100)throw new HttpError(400,'Tổng trọng số điểm phải là 100');}}
 return{criteria,levels:clone(defaults.levels),...(gradingPolicy?{gradingPolicy}:{}),version:'rubric-'+hash({criteria,gradingPolicy}).slice(0,16)};
}
async function context(report,assignment){
 const batch=await InternshipBatch.findById(assignment.batchId).lean(),rubric=clone(batch?.reportRubric||defaults),tasks=await Task.find({assignmentId:assignment._id}).select('title objective requiredProducts workItems status submission acceptanceCriteria criteriaApprovedBy criteriaApprovedAt criteriaVersion confirmedProgress progressWeight criterionReviews submissionVersion submissionVersions.version submissionVersions.sha256 __v').sort({_id:1}).lean();
 const artifacts=await require('../models/Web3Models').PrivateReportArtifact.find({reportId:report._id,source:'attachment'}).select('plaintextHash state bytes mime keyId').sort({_id:1}).lean();
 const eligible=tasks.filter(t=>t.criteriaApprovedAt&&t.acceptanceCriteria?.length),weights=eligible.reduce((n,t)=>n+(t.progressWeight||0),0),progress=tasks.length&&eligible.length===tasks.length&&weights?eligible.reduce((n,t)=>n+(t.confirmedProgress||0)*t.progressWeight,0)/weights:null;
 return{rubric,tasks,artifacts,progress,inputHash:hash({content:report.content,selfAssessment:report.selfAssessment,taskIds:report.taskIds,version:report.version,rubric,tasks,artifacts,checks:report.evidenceChecks||[]})};
}
function proposal(report,ctx){
 const contentHash=hash(report.content),checks=(report.evidenceChecks||[]).filter(g=>g.contentHash===contentHash&&g.rubricVersion===ctx.rubric.version).at(-1)?.checks||[];
 const criteria=ctx.rubric.criteria.map(c=>{
  const check=checks.find(r=>r.id===c.id);let score=null,basis='Chưa đủ cơ sở đánh giá; cần kiểm tra nội dung và bằng chứng.';
  if(c.id==='progress'&&ctx.progress!==null){score=Math.round(c.max*ctx.progress)/100;basis='Từ tiến độ tiêu chí công việc đã được doanh nghiệp xác nhận: '+ctx.progress.toFixed(2)+'%.';}
  else if(c.id!=='progress'&&check){score=Math.round(c.max*check.level*25)/100;basis=check.comment;}
  return{...c,score,basis,verified:score!==null,quote:check?.quote||'',level:check?.level??null};
 });
 const complete=criteria.every(c=>c.score!==null);
 return{status:complete?'PROPOSED_NOT_APPROVED':'INSUFFICIENT_EVIDENCE',rubricVersion:ctx.rubric.version,rubric:ctx.rubric,criteria,total:complete?Math.round(criteria.reduce((n,c)=>n+c.score,0)*100)/100:null,partialTotal:Math.round(criteria.reduce((n,c)=>n+(c.score||0),0)*100)/100,summary:complete?'Điểm đề xuất theo rubric và căn cứ đã được kiểm tra.':'Chưa đủ cơ sở đánh giá toàn bộ báo cáo.',limitations:['Điểm chỉ được lưu chính thức theo quy trình giảng viên, doanh nghiệp và nhà trường.'],formula:'Điểm tiêu chí = điểm tối đa × mức rubric / 4; riêng tiến độ dùng tỷ lệ trọng số đã được xác nhận. Không sử dụng cosine làm điểm.'};
}
function response(record,report,cached=false){return {...record.base,proposed_grading:record.proposedGrading,criterion_evidence:record.semantic,analysisId:record.id,reportInternalVersion:report.__v,inputHash:record.inputHash,cached,scoringEngineVersion:record.scoringEngineVersion,selfGrading:report.selfGrading||null};}
async function analyze(user,report,assignment,engine,base){
 if(!['submitted','reviewed'].includes(report.state))throw new HttpError(409,'Bài đã chốt hoặc cần nộp phiên bản mới');await require('./reportVersions').assertCurrent(Report,report);
 const key=String(report._id),ctx=await context(report,assignment),cacheKey=hash({input:ctx.inputHash,engine,scoring:auto.VERSION});
 const cached=(report.evaluationHistory||[]).find(r=>r.idempotencyKey===cacheKey);if(cached)return response(cached,report,true);
 if(inflight.has(key)){const running=inflight.get(key);if(running.cacheKey!==cacheKey)throw new HttpError(409,'Đang đánh giá phiên bản này bằng phương pháp khác','AI_EVALUATION_RUNNING');return running.promise;}
 const work=async()=>{
  const evidence=await require('./reportEvidence').collect(report,assignment,ctx);
  const semantic=await nlp.request('/evidence',{content:report.content,attachments:evidence.documents,criteria:ctx.rubric.criteria.map(c=>({id:c.id,text:c.label+'\n'+c.hint})),engine});
  semantic.documentSources={reportEnd:report.content.length,selfAssessmentIncluded:false,attachmentsRead:evidence.documents.length,attachmentErrors:evidence.errors};
  const result=typeof base==='function'?await base():base||{};
  if((await context(report,assignment)).inputHash!==ctx.inputHash)throw new HttpError(409,'Nội dung, tiến độ hoặc rubric đã thay đổi; hãy phân tích lại');
  const grading=auto.score(report,ctx,semantic,evidence),record={id:require('crypto').randomUUID(),idempotencyKey:cacheKey,at:new Date(),actorUserId:String(user._id),reportId:String(report._id),rubricId:String(assignment.batchId),rubricVersion:ctx.rubric.version,reportVersion:report.version,contentHash:hash(report.content),inputHash:ctx.inputHash,rubric:ctx.rubric,modelName:semantic.model?.model_id||engine,modelVersion:semantic.model?.revision||null,scoringEngineVersion:auto.VERSION,criterionResults:grading.criteria,suggestedTotal:grading.total,evaluationStatus:grading.status,evaluatedAt:new Date(),evidenceReferences:evidence.references,semantic,proposedGrading:grading,base:result};
  if((report.evaluationHistory||[]).length>=20)throw new HttpError(409,'Đã đạt giới hạn lịch sử phân tích; liên hệ quản trị viên');
  const saved=await Report.findOneAndUpdate({_id:report._id,...v.versionMatch(report.__v||0),...require('./reportVersions').currentFilter(report),state:{$nin:['approved','need_revision']},'evaluationHistory.idempotencyKey':{$ne:cacheKey}},{$push:{evaluationHistory:record,history:v.event(user,'report.analysis_saved',{analysisId:record.id,reportVersion:report.version,scoringEngineVersion:auto.VERSION})},$inc:{__v:1}},{new:true,runValidators:true});
  if(!saved){const fresh=await Report.findById(report._id).lean(),existing=fresh?.evaluationHistory?.find(r=>r.idempotencyKey===cacheKey);if(existing&&(await context(fresh,assignment)).inputHash===ctx.inputHash)return response(existing,fresh,true);throw new HttpError(409,'Báo cáo đã thay đổi; tải lại','STALE_VERSION');}
  failures.delete(key);return response(record,saved);
 };
 const promise=work().catch(e=>{failures.set(key,{at:new Date(),inputHash:ctx.inputHash,code:e.code||'AI_UNAVAILABLE'});if(failures.size>100)failures.delete(failures.keys().next().value);throw e;}).finally(()=>{if(inflight.get(key)?.promise===promise)inflight.delete(key);});inflight.set(key,{cacheKey,promise});return promise;
}
async function evaluationView(user,report,assignment){
 const ctx=await context(report,assignment),latest=report.evaluationHistory?.at(-1),currentReport=await Report.findOne(require('./reportVersions').group(report)).sort({version:-1}).select('_id').lean(),fresh=String(currentReport?._id)===String(report._id)&&latest?.scoringEngineVersion===auto.VERSION&&latest.inputHash===ctx.inputHash;
 const status=inflight.has(String(report._id))?'RUNNING':fresh?'CURRENT':failures.get(String(report._id))?.inputHash===ctx.inputHash?'FAILED':latest?'STALE':'NOT_STARTED';
 const visible=['student','mentor'].includes(user.role)&&latest?.scoringEngineVersion===auto.VERSION;
 return{reportId:String(report._id),reportVersion:report.version,status,current:fresh,analysis:visible?{analysisId:latest.id,proposed_grading:latest.proposedGrading,criterion_evidence:latest.semantic,modelName:latest.modelName,modelVersion:latest.modelVersion,scoringEngineVersion:latest.scoringEngineVersion,evaluatedAt:latest.at}:null,selfGrading:['student','mentor'].includes(user.role)?report.selfGrading||null:null,mentorReviewed:report.reviews?.some(r=>r.role==='mentor')||false,officialScore:report.state==='approved'?report.finalScore:null};
}
async function gradingInput(report,assignment,body,user){
 if(body.grading===undefined)return undefined;v.keys(body.grading,['analysisId','scores','adjustmentReason']);
 if(user.role!=='mentor')throw new HttpError(403,'Chỉ giảng viên xác nhận rubric');
 const record=(report.evaluationHistory||[]).find(r=>r.id===body.grading.analysisId);if(!record)throw new HttpError(409,'Cần phân tích phiên bản báo cáo trước khi xác nhận điểm');
 const ctx=await context(report,assignment);if(record.inputHash!==ctx.inputHash)throw new HttpError(409,'Rubric hoặc tiến độ đã thay đổi; phân tích lại trước khi chấm');
 const rubric=record.rubric;if(!Array.isArray(body.grading.scores)||body.grading.scores.length!==rubric.criteria.length)throw new HttpError(400,'Cần đủ điểm theo rubric');
 const seen=new Set(),scores=body.grading.scores.map(row=>{v.keys(row,['id','score','comment']);const c=rubric.criteria.find(c=>c.id===row.id);if(!c||seen.has(row.id)||typeof row.score!=='number'||!Number.isFinite(row.score)||row.score<0||row.score>c.max||Math.abs(row.score*100-Math.round(row.score*100))>1e-8)throw new HttpError(400,'Điểm tiêu chí không hợp lệ');seen.add(row.id);return{id:row.id,score:row.score,comment:v.text(row.comment,'Căn cứ chấm',{required:true,max:1000})};});
 const total=Math.round(scores.reduce((n,c)=>n+c.score,0)*100)/100;if(total!==body.score)throw new HttpError(400,'Tổng điểm không khớp rubric');
 const difference=record.proposedGrading.total===null?null:Math.round((total-record.proposedGrading.total)*100)/100,adjustmentReason=v.text(body.grading.adjustmentReason,'Lý do xác nhận/điều chỉnh',{required:true,max:2000});
 return{analysisId:record.id,reportVersion:report.version,rubricVersion:rubric.version,rubric,proposed:record.proposedGrading,confirmedScores:scores,confirmedTotal:total,difference,adjustmentReason,confirmedBy:String(user._id),confirmedAt:new Date()};
}
const router=require('express').Router(),{requireRole}=require('../middleware/auth'),{asyncHandler}=require('../utils/http');
router.get('/reports/:id/ai-evaluation',asyncHandler(async(req,res)=>{const report=await Report.findById(v.id(req.params.id)).lean();if(!report)throw new HttpError(404,'Không có báo cáo');const assignment=await policy.load(req.user,String(report.assignmentId));res.json(await evaluationView(req.user,report,assignment));}));
router.put('/reports/:id/self-assessment',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','selfGrading']);const report=await Report.findById(v.id(req.params.id));if(!report)throw new HttpError(404,'Không có báo cáo');const assignment=await policy.load(req.user,String(report.assignmentId));await require('./reportVersions').assertCurrent(Report,report);
 if(report.state==='approved'||report.reviews.some(r=>r.role==='mentor'))throw new HttpError(409,'Bài đã được giảng viên đánh giá; không sửa điểm tự đánh giá');
 if((report.selfGradingHistory||[]).length>=10)throw new HttpError(409,'Đã đạt giới hạn phiên bản tự đánh giá');const selfGrading=await require('./reportSelfGrading').validate(req.body.selfGrading,assignment);
 res.json(await v.updateVersion(Report,report,req.body.version,{selfGrading,selfGradingHistory:[...(report.selfGradingHistory||[]),selfGrading]},v.event(req.user,'report.self_assessed',{rubricVersion:selfGrading.rubricVersion})));
}));
router.post('/reports/:id/request-revision',requireRole('mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','reason']);const report=await Report.findById(v.id(req.params.id));if(!report)throw new HttpError(404,'Không có báo cáo');await policy.load(req.user,String(report.assignmentId));await require('./reportVersions').assertCurrent(Report,report);
 if(!['submitted','reviewed'].includes(report.state))throw new HttpError(409,'Bài đã chốt hoặc đã yêu cầu bổ sung');if((report.revisionRequests||[]).length>=10)throw new HttpError(409,'Đã đạt giới hạn yêu cầu bổ sung');
 const request={actorUserId:String(req.user._id),at:new Date(),reason:v.text(req.body.reason,'Yêu cầu bổ sung',{required:true,max:2000}),reportVersion:report.version};res.json(await v.updateVersion(Report,report,req.body.version,{state:'need_revision',revisionRequests:[...(report.revisionRequests||[]),request]},v.event(req.user,'report.revision_requested',{reason:request.reason})));
}));
router.get('/report-rubrics',asyncHandler(async(req,res)=>{
 const Assignment=require('../models/Assignment'),ids=req.user.role==='admin'?null:await Assignment.find(policy.scope(req.user)).distinct('batchId');if(req.user.role==='student')ids.push(...await require('../workflow/models').Enrollment.find({studentUserId:req.user._id}).distinct('batchId'));
 const rows=await InternshipBatch.find(ids?{_id:{$in:ids}}:{}).select('name startDate endDate reportRubric').lean();res.json({items:rows.map(r=>({_id:r._id,name:r.name,startDate:r.startDate,endDate:r.endDate,rubricVersion:r.reportRubric?.version||defaults.version}))});
}));
router.put('/report-rubrics/:batchId',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','criteria','gradingPolicy','reason','proposalId']);const batch=await InternshipBatch.findById(v.id(req.params.batchId));if(!batch)throw new HttpError(404,'Không có kỳ thực tập');
 const rubric=validateRubric({criteria:req.body.criteria,gradingPolicy:req.body.gradingPolicy}),reason=v.text(req.body.reason,'Lý do đổi rubric',{required:true,max:2000});
 let proposals;if(req.body.proposalId){const selected=(batch.rubricProposals||[]).find(p=>p.id===req.body.proposalId&&p.state==='proposed');if(!selected)throw new HttpError(409,'Đề xuất không còn chờ duyệt');rubric.academicDeadline=selected.deadline;rubric.version='rubric-'+hash(rubric).slice(0,16);proposals=batch.rubricProposals.map(p=>p.id===req.body.proposalId?{...p,state:'approved',approvedBy:String(req.user._id),approvedAt:new Date(),approvedRubricVersion:rubric.version}:p);}
 res.json(await v.updateVersion(InternshipBatch,batch,req.body.version,{reportRubric:rubric,...(proposals?{rubricProposals:proposals}:{})},v.event(req.user,'report.rubric_changed',{previous:batch.reportRubric||defaults,rubric,reason,proposalId:req.body.proposalId})));
}));
router.post('/report-rubrics/:batchId/proposals',requireRole('mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','criteria','reason','deadline']);const id=v.id(req.params.batchId),Assignment=require('../models/Assignment');if(!await Assignment.exists({...policy.scope(req.user),batchId:id}))throw new HttpError(404,'Không có kỳ phụ trách');
 const batch=await InternshipBatch.findById(id);if(!batch)throw new HttpError(404,'Không có kỳ');if((batch.rubricProposals||[]).length>=20)throw new HttpError(409,'Đã đạt giới hạn đề xuất rubric');
 const rubric=validateRubric({criteria:req.body.criteria}),reason=v.text(req.body.reason,'Yêu cầu học thuật',{required:true,max:2000}),deadline=v.date(req.body.deadline,'Hạn đánh giá');if(deadline<batch.startDate||deadline>batch.endDate)throw new HttpError(400,'Hạn đánh giá ngoài kỳ');
 const proposal={id:require('crypto').randomUUID(),state:'proposed',rubric,reason,deadline,proposedBy:String(req.user._id),proposedAt:new Date()};
 res.json(await v.updateVersion(InternshipBatch,batch,req.body.version,{rubricProposals:[...(batch.rubricProposals||[]),proposal]},v.event(req.user,'report.rubric_proposed',{proposalId:proposal.id})));
}));
router.get('/report-rubrics/:batchId',asyncHandler(async(req,res)=>{
 const id=v.id(req.params.batchId),Assignment=require('../models/Assignment'),enrolled=req.user.role==='student'&&await require('../workflow/models').Enrollment.exists({studentUserId:req.user._id,batchId:id});if(req.user.role!=='admin'&&!enrolled&&!await Assignment.exists({...policy.scope(req.user),batchId:id}))throw new HttpError(404,'Không có rubric trong phạm vi');const batch=await InternshipBatch.findById(id).lean();if(!batch)throw new HttpError(404,'Không có kỳ');res.json({...batch.reportRubric||defaults,batchVersion:batch.__v||0,proposals:(batch.rubricProposals||[]).filter(p=>req.user.role==='admin'||p.proposedBy===String(req.user._id))});
}));
router.put('/reports/:id/review-draft',requireRole('mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','scores','comment']);const report=await Report.findById(v.id(req.params.id));if(!report)throw new HttpError(404,'Không có báo cáo');const assignment=await policy.load(req.user,String(report.assignmentId));await require('./reportVersions').assertCurrent(Report,report);if(!['submitted','reviewed'].includes(report.state)||report.reviews.some(r=>r.role==='mentor'))throw new HttpError(409,'Không thể lưu nháp trên bài đã chấm hoặc cần nộp lại');
 const ctx=await context(report,assignment);if(!Array.isArray(req.body.scores)||req.body.scores.length>7)throw new HttpError(400,'Điểm nháp không hợp lệ');const seen=new Set(),scores=req.body.scores.map(r=>{v.keys(r,['id','score','comment']);const c=ctx.rubric.criteria.find(c=>c.id===r.id);if(!c||seen.has(r.id)||typeof r.score!=='number'||!Number.isFinite(r.score)||r.score<0||r.score>c.max)throw new HttpError(400,'Điểm nháp ngoài rubric');seen.add(r.id);return{id:r.id,score:r.score,comment:v.text(r.comment,'Nhận xét nháp',{max:1000})};});
 if((report.reviewDrafts||[]).length>=20)throw new HttpError(409,'Đã đạt giới hạn bản nháp');const draft={actorUserId:String(req.user._id),reportVersion:report.version,rubricVersion:ctx.rubric.version,scores,comment:v.text(req.body.comment,'Nhận xét',{max:5000}),savedAt:new Date()};
 res.json(await v.updateVersion(Report,report,req.body.version,{reviewDrafts:[...(report.reviewDrafts||[]),draft]},v.event(req.user,'report.review_draft_saved')));
}));
router.post('/reports/:id/evidence-checks',requireRole('mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','checks']);const report=await Report.findById(v.id(req.params.id));if(!report)throw new HttpError(404,'Không có báo cáo');const assignment=await policy.load(req.user,String(report.assignmentId));await require('./reportVersions').assertCurrent(Report,report);if(!['submitted','reviewed'].includes(report.state))throw new HttpError(409,'Báo cáo không còn cho phép kiểm tra mới');
 const ctx=await context(report,assignment);if(!Array.isArray(req.body.checks)||!req.body.checks.length||req.body.checks.length>6)throw new HttpError(400,'Cần từ 1 đến 6 mục kiểm tra nội dung');
 const seen=new Set(),checks=req.body.checks.map(row=>{v.keys(row,['id','level','quote','comment','productChecked']);if(row.id==='progress'||seen.has(row.id)||!ctx.rubric.criteria.some(c=>c.id===row.id))throw new HttpError(400,'Tiêu chí kiểm tra không hợp lệ');seen.add(row.id);const level=v.integer(row.level,0,4,'Mức đạt'),quote=v.text(row.quote,'Trích đoạn',{required:level>0,max:3000});if(quote&&!report.content.includes(quote))throw new HttpError(400,'Trích đoạn không nằm trong báo cáo');if(level>0&&['results','evidence'].includes(row.id)&&row.productChecked!==true)throw new HttpError(400,'Cần xác nhận đã kiểm tra sản phẩm/bằng chứng');return{id:row.id,level,quote,productChecked:row.productChecked===true,comment:v.text(row.comment,'Căn cứ xác minh',{required:true,max:2000})};});
 if((report.evidenceChecks||[]).length>=20)throw new HttpError(409,'Đã đạt giới hạn lịch sử kiểm tra');
 const record={checks,contentHash:hash(report.content),rubricVersion:ctx.rubric.version,checkedBy:String(req.user._id),checkedAt:new Date()};
 res.json(await v.updateVersion(Report,report,req.body.version,{evidenceChecks:[...(report.evidenceChecks||[]),record]},v.event(req.user,'report.evidence_checked',{rubricVersion:ctx.rubric.version})));
}));
module.exports={router,defaults,validateRubric,context,proposal,analyze,gradingInput,evaluationView};

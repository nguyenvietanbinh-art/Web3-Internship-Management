const identity=require('../services/businessIdentity');
const router=require('express').Router();const {Report}=require('../models/BusinessModels');const Assignment=require('../models/Assignment');
const {requireRole}=require('../middleware/auth');const {asyncHandler,HttpError}=require('../utils/http');const v=require('./shared'),policy=require('./placementPolicy');
router.get('/reports',asyncHandler(async(req,res)=>{
 const filter={assignmentId:{$in:await Assignment.find(policy.scope(req.user)).distinct('_id')}};
 if(req.query.assignmentId){await policy.load(req.user,req.query.assignmentId);filter.assignmentId=req.query.assignmentId;}if(req.query.kind)filter.kind=v.choice(req.query.kind,['weekly','final'],'Loại báo cáo');res.json(await v.paged(Report,filter,req.query));
}));
router.post('/reports',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['assignmentId','kind','title','content']);const a=await policy.load(req.user,req.body.assignmentId,{active:true}),kind=v.choice(req.body.kind,['weekly','final'],'Loại báo cáo');
 const title=v.text(req.body.title,'Tiêu đề',{required:true,max:200}),content=v.text(req.body.content,'Nội dung',{required:true,max:50000});
 const last=await Report.findOne({assignmentId:a._id,kind}).sort({version:-1});if(kind==='final'&&await Report.exists({assignmentId:a._id,kind,state:'approved'}))throw new HttpError(409,'Báo cáo cuối kỳ đã chốt');
 if(last?.current){const superseded=await Report.findOneAndUpdate({_id:last._id,__v:last.__v,current:true,...(kind==='final'?{state:{$ne:'approved'}}:{})},{$set:{current:false},$inc:{__v:1},$push:{history:v.event(req.user,'report.superseded')}});if(!superseded)throw new HttpError(409,'Báo cáo vừa thay đổi; tải lại trước khi nộp','STALE_VERSION');}
 const doc=await Report.create({assignmentId:a._id,...identity.participants(a),kind,current:true,version:(last?.version||0)+1,title,content,history:[v.event(req.user,'report.submitted')]});res.status(201).json(doc);
}));
router.post('/reports/:id/reviews',requireRole('company','mentor'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['score','comment','decision','version']);const doc=await Report.findById(v.id(req.params.id));if(!doc)throw new HttpError(404,'Không có báo cáo');await policy.load(req.user,String(doc.assignmentId));
 if(doc.state==='approved'||doc.state==='need_revision')throw new HttpError(409,'Báo cáo đã chốt hoặc cần sinh viên nộp bản mới');
 if(doc.reviews.some(r=>r.role===req.user.role))throw new HttpError(409,'Vai trò này đã đánh giá phiên bản báo cáo');
 const latest=await Report.findOne({assignmentId:doc.assignmentId,kind:doc.kind}).sort({version:-1});if(String(latest._id)!==String(doc._id))throw new HttpError(409,'Cần đánh giá phiên bản báo cáo mới nhất');
 const score=req.body.score;if(typeof score!=='number'||!Number.isFinite(score)||score<0||score>100)throw new HttpError(400,'Điểm phải từ0 đến100');
 const review={role:req.user.role,actorUserId:req.user._id,actorWallet:req.user.walletAddress,score,comment:v.text(req.body.comment,'Nhận xét',{required:true,max:5000}),decision:v.choice(req.body.decision,['approved','need_revision'],'Kết quả'),at:new Date()};
 const state=review.decision==='need_revision'?'need_revision':doc.reviews.length===1?'reviewed':'submitted';v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
 const saved=await Report.findOneAndUpdate({_id:doc._id,__v:req.body.version,current:true,'reviews.role':{$ne:req.user.role}},{$set:{state},$push:{reviews:review,history:v.event(req.user,'report.reviewed',{score,decision:review.decision,comment:review.comment})},$inc:{__v:1}},{new:true,runValidators:true});if(!saved)throw new HttpError(409,'Báo cáo đã thay đổi','STALE_VERSION');res.json(saved);
}));
router.post('/reports/:id/approve',requireRole('admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','reason']);const doc=await Report.findById(v.id(req.params.id));if(!doc)throw new HttpError(404,'Không có báo cáo');await policy.load(req.user,String(doc.assignmentId));
 if(doc.state!=='reviewed'||doc.reviews.length!==2||doc.reviews.some(r=>r.decision!=='approved')||new Set(doc.reviews.map(r=>r.role)).size!==2)throw new HttpError(409,'Cần hai đánh giá đồng ý từ doanh nghiệp và giảng viên');
  const latest=await Report.findOne({assignmentId:doc.assignmentId,kind:doc.kind}).sort({version:-1});if(String(latest._id)!==String(doc._id))throw new HttpError(409,'Chỉ chốt phiên bản mới nhất');
  if(doc.kind==='final'){const assignment=await policy.load(req.user,String(doc.assignmentId));if(!assignment.kpis?.length||assignment.kpis.some(k=>k.status!=='approved'))throw new HttpError(409,'Cần duyệt đủ KPI trước khi chốt báo cáo cuối kỳ');}
 const reason=v.text(req.body.reason,'Lý do',{required:true,max:2000}),score=Math.round(doc.reviews.reduce((n,r)=>n+r.score,0)/2);
 res.json(await v.updateVersion(Report,doc,req.body.version,{state:'approved',finalScore:score,approvedBy:req.user.walletAddress||'',...(identity.enabled()?{approvedByUserId:req.user._id}:{}),approvedAt:new Date()},v.event(req.user,'report.approved',{score,reason}),{current:true}));
}));
module.exports=router;

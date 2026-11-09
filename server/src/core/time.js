const identity=require('../services/businessIdentity');
const router=require('express').Router();const {WorkSession}=require('../models/BusinessModels');const Assignment=require('../models/Assignment');
const {requireRole}=require('../middleware/auth');const {asyncHandler,HttpError}=require('../utils/http');const v=require('./shared'),policy=require('./placementPolicy'),time=require('../services/timeTracking');
async function scope(user,query={}){return require('./workPolicy').scope(user,{studentUserId:query.studentUserId,batchId:query.batchId});}
router.get('/time/sessions',asyncHandler(async(req,res)=>{
 const filter=await scope(req.user,req.query);if(req.query.assignmentId){await policy.load(req.user,req.query.assignmentId);filter.assignmentId=req.query.assignmentId;}if(req.query.state)filter.state=v.choice(req.query.state,['open','pending','needs_adjustment','approved','rejected'],'Trạng thái');
 const data=await v.paged(WorkSession,filter,req.query,{sort:{updatedAt:-1,checkInAt:-1,_id:-1}});data.items=data.items.map(d=>time.view(d));res.json(data);
}));
router.post('/time/check-in',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['assignmentId','requestKey']);const a=await policy.load(req.user,req.body.assignmentId,{active:true});
 const requestKey=v.text(req.body.requestKey,'Mã yêu cầu',{required:true,max:80});if(!/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey))throw new HttpError(400,'Mã yêu cầu không hợp lệ');
 const doc=await WorkSession.create({assignmentId:a._id,batchId:a.batchId,...identity.participants(a),day:new Date().toISOString().slice(0,10),activeStudent:a.studentWallet,...(identity.enabled()?{activeStudentUserId:a.studentUserId}:{}),requestKey,checkInAt:new Date(),proof:time.manualProof(),history:[v.event(req.user,'time.checked_in')]});res.status(201).json(time.view(doc));
}));
router.post('/time/:id/check-out',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version']);const doc=await WorkSession.findOne({_id:v.id(req.params.id),...identity.owned(req.user,'studentUserId','studentWallet'),...await scope(req.user,req.query)});if(!doc)throw new HttpError(404,'Không tìm thấy phiên');if(doc.state!=='open')throw new HttpError(409,'Phiên đã kết thúc');
 v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
 const now=new Date();let minutes=null,state='pending',reason='';try{if(now.toISOString().slice(0,10)!==doc.day)throw new Error('cross-day');minutes=time.duration(doc.checkInAt,now);}catch{state='needs_adjustment';reason='Khoảng giờ bất hợp lý hoặc qua ngày UTC; cần doanh nghiệp xử lý';}
 const updated=await WorkSession.findOneAndUpdate({_id:doc._id,__v:req.body.version,state:'open'},{$set:{checkOutAt:now,minutes,state,reason},$unset:{activeStudent:1,activeStudentUserId:1},$inc:{__v:1},$push:{history:v.event(req.user,'time.checked_out',{state,minutes})}},{new:true,runValidators:true});if(!updated)throw new HttpError(409,'Phiên đã thay đổi','STALE_VERSION');res.json(time.view(updated));
}));
router.patch('/time/:id/review',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['decision','reason','checkInAt','checkOutAt','version']);const doc=await WorkSession.findOne({_id:v.id(req.params.id),...identity.owned(req.user,'companyUserId','companyWallet'),...await scope(req.user,req.query)});if(!doc)throw new HttpError(404,'Không có phiên trong phạm vi doanh nghiệp');
 const decision=v.choice(req.body.decision,['approved','rejected','adjust'],'Thao tác'),reason=v.text(req.body.reason,'Lý do',{required:false,max:2000});let set;
 if(decision==='adjust'){
  const start=v.date(req.body.checkInAt,'Giờ vào'),end=v.date(req.body.checkOutAt,'Giờ ra');const a=await policy.load(req.user,String(doc.assignmentId));if(start<a.startDate||end>a.endDate||end>new Date()||start.toISOString().slice(0,10)!==doc.day||end.toISOString().slice(0,10)!==doc.day)throw new HttpError(400,'Điều chỉnh phải trong ngày UTC của phiên, thuộc phân công và không ở tương lai');
  if(await WorkSession.exists({_id:{$ne:doc._id},...(doc.studentUserId?{studentUserId:doc.studentUserId}:{studentWallet:doc.studentWallet}),state:{$ne:'rejected'},checkInAt:{$lt:end},$or:[{checkOutAt:{$gt:start}},{state:'open'}]}))throw new HttpError(409,'Khoảng giờ trùng phiên khác');
  set={checkInAt:start,checkOutAt:end,minutes:time.duration(start,end),state:'pending',reason};
 }else if(decision==='rejected'){
  if(doc.state==='rejected')throw new HttpError(409,'Phiên đã từ chối');set={state:'rejected',reason};
 }else{
  if(!['pending','approved','rejected'].includes(doc.state)||!doc.checkOutAt||doc.minutes===null)throw new HttpError(409,'Cần hoàn tất hoặc điều chỉnh phiên trước khi duyệt');
  if(doc.state===decision)throw new HttpError(409,'Trạng thái không đổi');set={state:decision,reason};
 }
 v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
 const updated=await WorkSession.findOneAndUpdate({_id:doc._id,__v:req.body.version},{$set:set,$unset:{activeStudent:1,activeStudentUserId:1},$inc:{__v:1},$push:{history:v.event(req.user,'time.reviewed',{decision,reason,before:{checkInAt:doc.checkInAt,checkOutAt:doc.checkOutAt,minutes:doc.minutes,state:doc.state},after:set})}},{new:true,runValidators:true});if(!updated)throw new HttpError(409,'Phiên đã thay đổi','STALE_VERSION');res.json(time.view(updated));
}));
router.get('/time/totals',asyncHandler(async(req,res)=>{
 const group=v.choice(req.query.group||'day',['day','week','month','batch'],'Kỳ tổng hợp');const filter={...await scope(req.user,req.query),state:'approved'};
 if(req.query.assignmentId){await policy.load(req.user,req.query.assignmentId);filter.assignmentId=req.query.assignmentId;}
 if(req.query.batchId)filter.batchId=v.id(req.query.batchId);
 let from,to;if(req.query.from)from=v.date(req.query.from,'Từ ngày');if(req.query.to){to=v.date(req.query.to,'Đến ngày');if(req.query.to.length===10)to.setUTCHours(23,59,59,999);}if(from&&to&&from>to)throw new HttpError(400,'Khoảng ngày đảo ngược');if(from||to)filter.checkInAt={...(from?{$gte:from}:{}),...(to?{$lte:to}:{})};
 v.pagination(req.query);const sessions=await WorkSession.find(filter).select('checkInAt batchId minutes').lean();const totals=new Map();for(const s of sessions){const key=group==='batch'?String(s.batchId):time.periodKey(s.checkInAt,group);totals.set(key,(totals.get(key)||0)+s.minutes);}
 const items=[...totals].sort(([a],[b])=>a.localeCompare(b)).map(([period,minutes])=>({period,minutes,hours:Number((minutes/60).toFixed(2))}));res.json({timezone:'UTC',approvedOnly:true,group,totalMinutes:sessions.reduce((n,s)=>n+s.minutes,0),items});
}));
module.exports=router;

const identity=require('../services/businessIdentity');
const express=require('express'),router=express.Router(),crypto=require('node:crypto');
const {CV,Application,NotificationReceipt}=require('../models/BusinessModels');
const JD=require('../models/JD');
const {requireRole}=require('../middleware/auth');const {asyncHandler,HttpError}=require('../utils/http');
const v=require('./shared'),{parseCv}=require('../services/cvParser');
const cvFields=['title','summary','skills','education','experience','university','gpa'];
function cvInput(body){
 const data={};for(const k of ['title','summary','education','experience','university'])data[k]=v.text(body[k],k,{required:k==='title',max:k==='title'||k==='university'?200:15000});
 data.skills=v.list(body.skills||[],'Kỹ năng');data.gpa=body.gpa===null||body.gpa===undefined?null:body.gpa;if(data.gpa!==null&&(typeof data.gpa!=='number'||!Number.isFinite(data.gpa)||data.gpa<0||data.gpa>4))throw new HttpError(400,'GPA phải từ0 đến4');return data;
}
router.get('/cv',requireRole('student'),asyncHandler(async(req,res)=>res.json(await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet')).lean())));
router.put('/cv',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,[...cvFields,'version']);const data=cvInput(req.body),doc=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet'));
 if(!doc){if(req.body.version!==null)throw new HttpError(409,'CV chưa có; cần phiên bản null');return res.status(201).json(await CV.create({...data,...identity.refs(req.user,'ownerUserId','ownerWallet'),history:[v.event(req.user,'cv.created')]}));}
 res.json(await v.updateVersion(CV,doc,req.body.version,data,v.event(req.user,'cv.updated',{fields:Object.keys(data)})));
}));
const fileTypes=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
router.post('/cv/file',requireRole('student'),(req,res,next)=>{
 if(!fileTypes.includes(req.get('Content-Type')?.split(';')[0].trim().toLowerCase()))return next(new HttpError(415,'Chỉ nhận byte PDF/DOCX trực tiếp với MIME đúng, không nhận multipart'));
 next();
},express.raw({type:()=>true,limit:2*1024*1024}),asyncHandler(async(req,res)=>{
 if(!Buffer.isBuffer(req.body)||!req.body.length)throw new HttpError(400,'Cần nội dung tệp');
 let originalname;try{originalname=decodeURIComponent(req.get('X-CV-Filename')||'');}catch{throw new HttpError(400,'Tên tệp không hợp lệ');}
 if(originalname.length>240)throw new HttpError(400,'Tên tệp quá dài');
 const file={originalname,mimetype:req.get('Content-Type').split(';')[0].trim().toLowerCase(),buffer:req.body};
 const name=file.originalname.normalize('NFKC').replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(-120);const extension=name.toLowerCase().split('.').pop();
 const expected={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 if(!expected[extension]||file.mimetype!==expected[extension])throw new HttpError(415,'Chỉ nhận PDF/DOCX với MIME đúng');
 const doc=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet'));if(!doc)throw new HttpError(409,'Lưu CV trước khi upload');
 const parsed=await parseCv(file.buffer,extension),sha256=crypto.createHash('sha256').update(file.buffer).digest('hex');
 const saved=await v.updateVersion(CV,doc,doc.__v,{fileData:file.buffer,fileName:name,mime:file.mimetype,sha256,extractedText:parsed.text,parser:parsed.parser},v.event(req.user,'cv.file_uploaded',{fileName:name,sha256,parser:parsed.parser}));
 const obj=saved.toObject();delete obj.fileData;res.json(obj);
}));
router.get('/cv/file',requireRole('student'),asyncHandler(async(req,res)=>{
 const doc=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet')).select('+fileData');if(!doc?.fileData)throw new HttpError(404,'Chưa có tệp CV');
 res.set({'Content-Type':doc.mime,'Content-Disposition':`attachment; filename="cv.${doc.mime==='application/pdf'?'pdf':'docx'}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).send(doc.fileData);
}));
const jdFields=['title','department','description','requirements','benefits','slots','location','salary','deadline','status'];
function jdInput(body,partial=false){
 const data={};for(const k of ['title','department','description','location','salary'])if(!partial||body[k]!==undefined)data[k]=v.text(body[k],k,{required:['title','description'].includes(k),max:k==='description'?20000:300});
 for(const k of ['requirements','benefits'])if(!partial||body[k]!==undefined)data[k]=v.list(body[k]||[],k);
 if(!partial||body.slots!==undefined)data.slots=v.integer(body.slots===undefined?1:body.slots,1,100,'Số vị trí');
 if(!partial||body.deadline!==undefined)data.deadline=v.date(body.deadline,'Hạn ứng tuyển');
 if(body.status!==undefined)data.status=v.choice(body.status,['open','closed'],'Trạng thái');
 return data;
}
router.get('/jds',asyncHandler(async(req,res)=>{
 const filter={};if(req.query.mine==='true'){if(req.user.role!=='company')throw new HttpError(403,'Chỉ doanh nghiệp xem JD của mình');Object.assign(filter,identity.owned(req.user,'companyUserId','companyWallet'));}else{filter.status='open';filter.deadline={$gt:new Date()};}
 if(req.query.status){if(req.query.mine!=='true')throw new HttpError(403,'Chỉ lọc trạng thái JD của mình');filter.status=v.choice(req.query.status,['open','closed'],'Trạng thái');}
 const q=v.search(req.query.q);if(q)filter.$or=[{title:q},{companyName:q},{location:q}];if(req.query.location)filter.location=v.search(req.query.location);
 res.json(await v.paged(JD,filter,req.query,{select:'-history'}));
}));
router.post('/jds',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,jdFields);const data=jdInput(req.body);if(data.deadline<=new Date())throw new HttpError(400,'Hạn ứng tuyển phải ở tương lai');
 res.status(201).json(await JD.create({...data,status:data.status||'closed',...identity.refs(req.user,'companyUserId','companyWallet'),companyName:req.user.companyName||req.user.name,history:[v.event(req.user,'jd.created')]}));
}));
router.patch('/jds/:id',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,[...jdFields,'version']);const doc=await JD.findOne({_id:v.id(req.params.id),...identity.owned(req.user,'companyUserId','companyWallet')});if(!doc)throw new HttpError(404,'Không có JD trong phạm vi của bạn');
 const data=jdInput(req.body,true);if((data.status||doc.status)==='open'&&(data.deadline||doc.deadline)<=new Date())throw new HttpError(400,'Cần hạn tuyển dụng còn hiệu lực');
 res.json(await v.updateVersion(JD,doc,req.body.version,data,v.event(req.user,'jd.updated',{fields:Object.keys(data),status:data.status||doc.status})));
}));
function appScope(user){if(user.role==='admin')return{};if(user.role==='student')return identity.owned(user,'studentUserId','studentWallet');if(user.role==='company')return identity.owned(user,'companyUserId','companyWallet');throw new HttpError(403,'Chỉ sinh viên/doanh nghiệp hoặc Admin xem ứng tuyển');}
router.get('/applications',asyncHandler(async(req,res)=>{
 const filter=appScope(req.user);if(req.query.status)filter.status=v.choice(req.query.status,['submitted','under_review','accepted','rejected','withdrawn'],'Trạng thái');if(req.query.jdId)filter.jdId=v.id(req.query.jdId);
 const q=v.search(req.query.q);if(q)filter.$or=[{jdTitle:q},{studentName:q},{companyName:q}];res.json(await v.paged(Application,filter,req.query));
}));
router.post('/applications',requireRole('student'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['jdId','message']);const jd=await JD.findById(v.id(req.body.jdId));if(!jd||jd.status!=='open'||jd.deadline<=new Date())throw new HttpError(409,'JD không còn nhận ứng tuyển');
 const cv=await CV.findOne(identity.owned(req.user,'ownerUserId','ownerWallet'));if(!cv)throw new HttpError(409,'Cần lưu CV trước khi ứng tuyển');if(!cv.skills.length&&!cv.extractedText.trim()&&!cv.summary.trim())throw new HttpError(400,'CV chưa có nội dung');
 const cvSnapshot=Object.fromEntries(['title','summary','skills','education','experience','university','gpa','extractedText','parser','sha256'].map(k=>[k,cv[k]]));cvSnapshot.cvVersion=cv.__v;
 const app=await Application.create({jdId:jd._id,cvId:cv._id,...identity.refs(req.user,'studentUserId','studentWallet'),companyUserId:jd.companyUserId,companyWallet:jd.companyWallet,studentName:req.user.name,jdTitle:jd.title,companyName:jd.companyName,cvSnapshot,message:v.text(req.body.message,'Lời nhắn',{max:3000}),history:[v.event(req.user,'application.submitted',{recipient:jd.companyWallet,recipientUserId:jd.companyUserId})]});
 res.status(201).json(app);
}));
router.patch('/applications/:id',asyncHandler(async(req,res)=>{
 v.keys(req.body,['status','reason','version']);const doc=await Application.findOne({_id:v.id(req.params.id),...appScope(req.user)});if(!doc)throw new HttpError(404,'Không tìm thấy ứng tuyển');
 const status=req.user.role==='student'?v.choice(req.body.status,['withdrawn'],'Trạng thái'):v.choice(req.body.status,['under_review','accepted','rejected'],'Trạng thái');
 if(req.user.role==='admin')throw new HttpError(403,'Xét duyệt thuộc doanh nghiệp sở hữu JD');
 if(!['submitted','under_review'].includes(doc.status)||status===doc.status)throw new HttpError(409,'Ứng tuyển đã kết thúc hoặc trạng thái không đổi');
 const reason=v.text(req.body.reason,'Lý do',{required:true,max:2000});
 res.json(await v.updateVersion(Application,doc,req.body.version,{status},v.event(req.user,'application.state',{before:doc.status,after:status,reason,recipient:req.user.role==='student'?doc.companyWallet:doc.studentWallet,recipientUserId:req.user.role==='student'?doc.companyUserId:doc.studentUserId})));
}));
async function notifications(user){
 const apps=await Application.find({$or:[identity.owned(user,'studentUserId','studentWallet'),identity.owned(user,'companyUserId','companyWallet')]}).select('history jdTitle');
 const receipts=await NotificationReceipt.find({userId:user._id}).lean();const read=new Set(receipts.map(r=>r.eventId));
 return apps.flatMap(app=>app.history.filter(e=>(e.data?.recipientUserId?String(e.data.recipientUserId)===String(user._id):identity.validWallet(user)&&e.data?.recipient===user.walletAddress)).map(e=>({id:String(e._id),applicationId:String(app._id),at:e.at,title:app.jdTitle,message:e.action==='application.submitted'?'Có hồ sơ ứng tuyển mới':`Ứng tuyển chuyển sang ${e.data.after}`,read:read.has(String(e._id))}))).sort((a,b)=>new Date(b.at)-new Date(a.at));
}
router.get('/notifications',asyncHandler(async(req,res)=>{v.pagination(req.query);const items=await notifications(req.user),{page,limit,skip}=v.pagination(req.query);res.json({items:items.slice(skip,skip+limit),total:items.length,unread:items.filter(x=>!x.read).length,page,limit,pages:Math.max(1,Math.ceil(items.length/limit))});}));
router.patch('/notifications/:id/read',asyncHandler(async(req,res)=>{
 v.keys(req.body,[]);v.id(req.params.id);if(!(await notifications(req.user)).some(e=>e.id===req.params.id))throw new HttpError(404,'Không có thông báo');
 await NotificationReceipt.updateOne({userId:req.user._id,eventId:req.params.id},{$setOnInsert:{readAt:new Date()}},{upsert:true});res.json({read:true});
}));
module.exports=router;

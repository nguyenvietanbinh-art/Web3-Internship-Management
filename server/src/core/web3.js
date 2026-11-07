const identity=require('../services/businessIdentity');
const express=require('express'),router=express.Router();
const {requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http');
const v=require('./shared'),policy=require('./placementPolicy'),chain=require('../services/localWeb3'),ipfs=require('../services/privateIpfs'),qr=require('../services/qrGps');
const {ChainOperation,PrivateReportArtifact}=require('../models/Web3Models'),{Report,WorkSession}=require('../models/BusinessModels');
const {parseCv}=require('../services/cvParser');
router.use('/web3',(req,res,next)=>{try{if(req.method!=='GET')chain.assertTest();next();}catch{next(new HttpError(503,'Web3 mutations chỉ bật trong TEST exact-allowlist','WEB3_TEST_ONLY'));}});
router.get('/web3/status',asyncHandler(async(_req,res)=>res.json({chain:await chain.status(),ipfs:{...ipfs.configured(),privacy:'AES-256-GCM ciphertext only; key never leaves server'},gps:{source:'client-claim',absoluteAntiSpoof:false},qrLibraries:'lazy/native-fallback'})));
router.post('/web3/qr/issue',requireRole('company'),asyncHandler(async(req,res)=>res.status(201).json(await qr.issue(req.user,req.body))));
router.post('/web3/qr/redeem',requireRole('student'),asyncHandler(async(req,res)=>res.json(await qr.redeem(req.user,req.body))));
async function reportScope(user,id){const report=await Report.findById(v.id(id));if(!report)throw new HttpError(404,'Không có báo cáo');const assignment=await policy.load(user,String(report.assignmentId));return{report,assignment};}
function artifactDto(a){return{id:a._id,reportId:a.reportId,source:a.source,cid:a.cid||null,state:a.state,plaintextHash:a.plaintextHash,ciphertextHash:a.ciphertextHash,mime:a.mime,bytes:a.bytes,verifiedAt:a.verifiedAt||null,errorCode:a.errorCode};}
router.get('/web3/reports/:id/artifacts',asyncHandler(async(req,res)=>{const {report}=await reportScope(req.user,req.params.id);res.json({items:(await PrivateReportArtifact.find({reportId:report._id}).sort({createdAt:-1})).map(artifactDto)});}));
router.get('/web3/artifacts/:id/file',asyncHandler(async(req,res)=>{
 const artifact=await PrivateReportArtifact.findById(v.id(req.params.id)).select('+envelope');if(!artifact)throw new HttpError(404,'Không có tệp báo cáo');
 await reportScope(req.user,String(artifact.reportId));
 const extensions={'application/pdf':'pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'},extension=extensions[artifact.mime];
 if(artifact.source!=='attachment'||artifact.state!=='verified'||!artifact.verifiedAt||!artifact.envelope||!extension)throw new HttpError(409,'Tệp chưa được tải lên và xác minh thành công');
 const bytes=ipfs.decrypt(artifact.envelope,artifact.reportId);if(bytes.length!==artifact.bytes||ipfs.sha(bytes)!==artifact.plaintextHash)throw new HttpError(409,'Tệp không khớp bằng chứng đã lưu');
 res.set({'Content-Type':artifact.mime,'Content-Disposition':`attachment; filename="bao-cao-${artifact.reportId}.${extension}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).send(bytes);
}));
async function uploadReport(req,res,attachment){
 const {report}=await reportScope(req.user,req.params.id);if(req.user.role!=='student'||!identity.belongs(report,req.user,'studentUserId','studentWallet'))throw new HttpError(403,'Chỉ chủ báo cáo upload');ipfs.assertConfigured();
 let bytes,mime,source;
 if(attachment){
  if(!Buffer.isBuffer(req.body)||!req.body.length)throw new HttpError(400,'Cần byte PDF/DOCX');mime=req.get('Content-Type')?.split(';')[0].toLowerCase();const extension=mime==='application/pdf'?'pdf':mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?'docx':null;if(!extension)throw new HttpError(415,'Chỉ PDF/DOCX');await parseCv(req.body,extension);bytes=req.body;source='attachment';
 }else{v.keys(req.body,['confirmEncryptedUpload']);if(req.body.confirmEncryptedUpload!==true)throw new HttpError(400,'Cần xác nhận upload ciphertext');bytes=Buffer.from(JSON.stringify({version:report.version,title:report.title,content:report.content}));mime='application/json';source='report-json';}
 const encrypted=ipfs.encrypt(bytes,report._id);let artifact;
 try{artifact=await PrivateReportArtifact.findOneAndUpdate({reportId:report._id,source,plaintextHash:encrypted.plaintextHash},{$setOnInsert:{reportId:report._id,source,plaintextHash:encrypted.plaintextHash,ciphertextHash:encrypted.ciphertextHash,keyId:encrypted.keyId,envelope:encrypted.envelope,ownerUserId:report.studentUserId,ownerWallet:report.studentWallet,mime,bytes:bytes.length,history:[v.event(req.user,'ipfs.encrypted')]}},{upsert:true,new:true,runValidators:true}).select('+envelope');}catch(e){if(e.code!==11000)throw e;artifact=await PrivateReportArtifact.findOne({reportId:report._id,source,plaintextHash:encrypted.plaintextHash}).select('+envelope');}
 if(artifact.state==='verified')return res.json(artifactDto(artifact));
 try{
  const client=ipfs.client();if(!artifact.cid){const cid=await client.upload(artifact.envelope);artifact=await PrivateReportArtifact.findByIdAndUpdate(artifact._id,{$set:{cid,state:'uploaded',errorCode:''},$push:{history:v.event(req.user,'ipfs.uploaded',{cid})}},{new:true}).select('+envelope');}
  const readback=await client.readback(artifact.cid,artifact.ciphertextHash);if(ipfs.sha(ipfs.decrypt(readback,report._id))!==artifact.plaintextHash)throw new HttpError(502,'Plaintext readback khác hash','IPFS_READBACK_MISMATCH');
  artifact=await PrivateReportArtifact.findByIdAndUpdate(artifact._id,{$set:{state:'verified',verifiedAt:new Date(),errorCode:''},$push:{history:v.event(req.user,'ipfs.readback_verified')}},{new:true});res.json(artifactDto(artifact));
 }catch(e){const code=e instanceof HttpError?e.code:'IPFS_FAILED';await PrivateReportArtifact.updateOne({_id:artifact._id},{$set:{state:artifact.cid?'uploaded':'failed',errorCode:code},$push:{history:v.event(req.user,'ipfs.not_verified',{code})}});res.status(e.status||502).json({error:'IPFS chưa readback/xác minh thành công',code,artifact:artifactDto({...artifact.toObject(),state:artifact.cid?'uploaded':'failed',errorCode:code})});}
}
router.post('/web3/reports/:id/ipfs',requireRole('student'),asyncHandler(async(req,res)=>uploadReport(req,res,false)));
router.post('/web3/reports/:id/ipfs/file',requireRole('student'),express.raw({type:()=>true,limit:2*1024*1024}),asyncHandler(async(req,res)=>uploadReport(req,res,true)));
router.post('/web3/reports/:id/anchor',asyncHandler(async(req,res)=>{
 v.keys(req.body,['artifactId']);const {report,assignment}=await reportScope(req.user,req.params.id);let digest='0x'+ipfs.sha(Buffer.from(report.content)),refURI='';
 if(report.kind!=='final'||!report.current||report.state!=='approved')throw new HttpError(409,'Chỉ anchor báo cáo cuối kỳ hiện hành đã được duyệt');
 if(req.body.artifactId){const artifact=await PrivateReportArtifact.findOne({_id:v.id(req.body.artifactId),reportId:report._id,state:'verified'});if(!artifact)throw new HttpError(409,'Cần artifact readback verified của đúng báo cáo');digest='0x'+artifact.plaintextHash;refURI='ipfs://'+artifact.cid;}
 const op=await chain.execute(req.user,{assignment,kind:'report',targetId:report._id,digest,refURI});res.json({...op,ipfsUploaded:!!refURI});
}));
function workDigest(session){return'0x'+ipfs.sha(Buffer.from(JSON.stringify({id:String(session._id),student:session.studentWallet,...(identity.enabled()&&session.studentUserId?{studentUserId:String(session.studentUserId)}:{}),checkIn:session.checkInAt,checkOut:session.checkOutAt,minutes:session.minutes,proof:session.proof,version:session.__v})));}
router.post('/web3/time/:id/anchor',requireRole('company','admin'),asyncHandler(async(req,res)=>{
 v.keys(req.body,[]);const session=await WorkSession.findById(v.id(req.params.id));if(!session)throw new HttpError(404,'Không có phiên');const assignment=await policy.load(req.user,String(session.assignmentId));if(session.state!=='approved'||!session.checkOutAt||!(session.minutes>0))throw new HttpError(409,'Chỉ ghi bằng chứng giờ làm đã duyệt và có phút dương');
 const digest=workDigest(session);res.json(await chain.execute(req.user,{assignment,kind:'attendance',targetId:session._id,digest}));
}));
async function completion(user,id){
 const assignment=await identity.chainAssignment(await policy.load(user,id));if(assignment.lifecycle!=='completed'||!assignment.kpis?.length||assignment.kpis.some(k=>k.status!=='approved')||assignment.kpiScore===null)throw new HttpError(409,'Phân công/KPI chưa hoàn tất');
 const report=await Report.findOne({assignmentId:assignment._id,kind:'final',current:true,state:'approved'});if(!report)throw new HttpError(409,'Cần báo cáo cuối kỳ đã duyệt');
 const sessions=await WorkSession.find({assignmentId:assignment._id}).sort({_id:1});if(sessions.some(s=>['open','pending','needs_adjustment'].includes(s.state))||sessions.filter(s=>s.state==='approved').reduce((n,s)=>n+(s.minutes||0),0)<=0)throw new HttpError(409,'Cần giờ làm dương đã duyệt, không còn phiên chờ');
 const m=chain.metadata(),reportOp=await ChainOperation.findOne({assignmentId:assignment._id,targetId:report._id,kind:'report',state:'confirmed',deploymentTx:m.deploymentTx,chainInstanceId:m.hardhatInstanceId}).sort({createdAt:-1}),attendanceOps=await ChainOperation.find({assignmentId:assignment._id,kind:'attendance',state:'confirmed',deploymentTx:m.deploymentTx,chainInstanceId:m.hardhatInstanceId});
 const attendance=attendanceOps.find(op=>sessions.some(s=>s.state==='approved'&&s.minutes>0&&String(s._id)===String(op.targetId)&&op.digest===workDigest(s)));if(!reportOp||!attendance)throw new HttpError(409,'Cần anchor báo cáo cuối kỳ và snapshot giờ đã duyệt hiện hành');
 const c=await chain.context();try{await chain.verify(c,reportOp,reportOp.txHash);await chain.verify(c,attendance,attendance.txHash);if(await c.contract.latestReportHash(reportOp.assignmentKey)!==reportOp.digest)throw new HttpError(409,'Latest report on-chain khác snapshot đã duyệt');}finally{c.provider.destroy();}
 const digest='0x'+ipfs.sha(Buffer.from(JSON.stringify({assignment:String(assignment._id),student:assignment.studentWallet,kpis:assignment.kpis.map(k=>({i:k.milestoneIndex,score:k.score,status:k.status})),kpiScore:assignment.kpiScore,report:String(report._id),reportVersion:report.version,reportScore:report.finalScore,reportDigest:reportOp.digest,hours:sessions.map(s=>({id:String(s._id),state:s.state,minutes:s.minutes,version:s.__v}))})));
 return{assignment,digest};
}
router.post('/web3/placements/:id/complete',requireRole('admin'),asyncHandler(async(req,res)=>{v.keys(req.body,[]);const {assignment,digest}=await completion(req.user,req.params.id);res.json(await chain.execute(req.user,{assignment,kind:'completion',targetId:assignment._id,digest}));}));
router.post('/web3/placements/:id/mint',requireRole('admin'),asyncHandler(async(req,res)=>{v.keys(req.body,[]);const {assignment,digest}=await completion(req.user,req.params.id);const m=chain.metadata();if(!await ChainOperation.exists({assignmentId:assignment._id,kind:'completion',digest,state:'confirmed',deploymentTx:m.deploymentTx,chainInstanceId:m.hardhatInstanceId}))throw new HttpError(409,'Cần bằng chứng phê duyệt hoàn tất đúng snapshot');res.json(await chain.execute(req.user,{assignment,kind:'mint',targetId:assignment._id,digest}));}));
router.get('/web3/placements/:id/certificate',asyncHandler(async(req,res)=>res.json(await chain.certificate(await policy.load(req.user,req.params.id)))));
router.get('/web3/placements/:id/operations',asyncHandler(async(req,res)=>{const a=await policy.load(req.user,req.params.id);res.json({items:(await ChainOperation.find({assignmentId:a._id}).sort({createdAt:-1})).map(chain.dto)});}));
router.post('/web3/operations/:id/reconcile',asyncHandler(async(req,res)=>{v.keys(req.body,[]);const op=await ChainOperation.findById(v.id(req.params.id));if(!op)throw new HttpError(404,'Không có operation');await policy.load(req.user,String(op.assignmentId));if(req.user.role!=='admin'&&!identity.belongs(op,req.user,'actorUserId','actorWallet'))throw new HttpError(403,'Chỉ người gửi hoặc Admin đối chiếu');res.json(await chain.reconcile(req.user,op));}));
module.exports=router;

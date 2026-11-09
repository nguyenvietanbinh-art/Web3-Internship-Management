'use strict';
const crypto=require('node:crypto'),{Types:{ObjectId}}=require('mongoose'),{HttpError}=require('../utils/http');
const {createPrincipal,isSystem}=require('./custodialPrincipal');
const err=code=>new HttpError(409,code,code),hash=o=>'0x'+crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
function snapshotOf(x){const {assignment:a,report:r,sessions}=x;return hash({assignment:String(a._id),student:String(a.studentUserId),recipient:a.studentWallet,kpis:a.kpis,kpiScore:a.kpiScore,report:String(r._id),version:r.version,score:r.finalScore,content:r.content,hours:sessions.map(s=>({id:String(s._id),minutes:s.minutes,start:s.checkInAt,end:s.checkOutAt,version:s.__v}))});}
function createQueue({db,recipients,adapter,env=process.env}){
 const jobs=db.collection('certificate_issuances'),principal=createPrincipal();
 async function eligible(id){
  const a=await db.collection('assignments').findOne({_id:new ObjectId(String(id))});
  if(!a||!a.studentUserId||!a.batchId||a.lifecycle!=='completed'||a.activePlacement!==true||!a.kpis?.length||a.kpis.some(k=>k.status!=='approved')||!Number.isFinite(a.kpiScore)||a.kpiScore<0||a.kpiScore>100)throw err('CERTIFICATE_NOT_ELIGIBLE');
  const reports=await db.collection('business_reports').find({assignmentId:a._id,kind:'final',current:true}).toArray(),r=reports[0];
  if(reports.length!==1||r.state!=='approved'||!Number.isFinite(r.finalScore)||r.finalScore<0||r.finalScore>100||!r.approvedAt||r.reviews?.length!==2||!['mentor','company'].every(role=>r.reviews.some(x=>x.role===role&&x.decision==='approved'&&String(x.actorUserId)===String(a[role+'UserId']))))throw err('CERTIFICATE_REPORT_NOT_APPROVED');
  const sessions=await db.collection('work_sessions').find({assignmentId:a._id}).sort({_id:1}).toArray();
  const valid=require('../core/timeEvidence').valid;
  if(!sessions.some(s=>s.state==='approved'&&s.minutes>0)||sessions.some(s=>['open','pending','needs_adjustment'].includes(s.state))||sessions.some(s=>s.state==='approved'&&!valid(s,a)))throw err('CERTIFICATE_HOURS_NOT_APPROVED');
  const binding=await recipients.read(String(a.studentUserId));if(!binding)throw err('CUSTODY_RECIPIENT_REQUIRED');
  return{assignment:{...a,studentWallet:binding.address},report:r,sessions:sessions.filter(s=>s.state==='approved'),binding};
 }
 async function initialize(){await recipients.guard(true);await jobs.createIndex({studentUserId:1,batchId:1},{unique:true});}
 async function enqueue(id){
  await recipients.guard(true);const a=await db.collection('assignments').findOne({_id:new ObjectId(String(id))});if(!a?.studentUserId||!a.batchId)throw err('CERTIFICATE_INVALID_ASSIGNMENT');
  const indexes=await jobs.indexes();if(!indexes.some(i=>i.unique&&i.key.studentUserId===1&&i.key.batchId===1))throw err('CERTIFICATE_INDEX_REQUIRED');
  const scope={studentUserId:a.studentUserId,batchId:a.batchId};
  try{await jobs.updateOne(scope,{$setOnInsert:{...scope,assignmentId:a._id,state:'queued',attempts:0,nextAttemptAt:new Date(),createdAt:new Date()}},{upsert:true});}catch(e){if(e.code!==11000)throw e;}
  const j=await jobs.findOne(scope);if(String(j.assignmentId)!==String(a._id))throw err('CERTIFICATE_PERIOD_CONFLICT');return j;
 }
 async function runOne(){
  await recipients.guard(true);if(env.CUSTODIAL_AUTO_ISSUE_ENABLED!=='true')throw err('CERTIFICATE_WORKER_DISABLED');
  const now=new Date(),leaseToken=crypto.randomUUID();
  // Serialize the issuer across processes as well as across jobs, not only a JS Promise queue.
  const issuerLeases=db.collection('custodial_worker_leases');let issuerLease;
  try{issuerLease=await issuerLeases.findOneAndUpdate({_id:'certificate-issuer',$or:[{leaseUntil:{$exists:false}},{leaseUntil:{$lt:now}}]},{$set:{leaseToken,leaseUntil:new Date(+now+120000)}},{upsert:true,returnDocument:'after'});}catch(e){if(e.code===11000)return null;throw e;}
  if(!issuerLease)return null;
  const issuerFilter={_id:'certificate-issuer',leaseToken},releaseIssuer=()=>issuerLeases.updateOne(issuerFilter,{$unset:{leaseToken:1,leaseUntil:1}});
  let j;try{j=await jobs.findOneAndUpdate({state:{$in:['queued','retry_wait','blocked','processing']},nextAttemptAt:{$lte:now},$or:[{leaseUntil:{$exists:false}},{leaseUntil:{$lt:now}}]},{$set:{state:'processing',leaseToken,leaseUntil:new Date(+now+120000)},$inc:{attempts:1}},{returnDocument:'after'});}catch(e){await releaseIssuer();throw e;}if(!j){await releaseIssuer();return null;}
  const filter={_id:j._id,leaseToken};
  const checkpoint=async fields=>{const issuer=await issuerLeases.updateOne(issuerFilter,{$set:{leaseUntil:new Date(Date.now()+120000)}});if(issuer.matchedCount!==1)throw err('CERTIFICATE_LEASE_LOST');const r=await jobs.updateOne(filter,{$set:{...fields,leaseUntil:new Date(Date.now()+120000)}});if(r.matchedCount!==1)throw err('CERTIFICATE_LEASE_LOST');};
  try{
   const x=await eligible(j.assignmentId),{assignment:a,report:r,sessions}=x;
   const snapshot=snapshotOf(x);
   if(j.snapshot&&j.snapshot!==snapshot)throw err('CERTIFICATE_SNAPSHOT_CHANGED');await checkpoint({snapshot,recipientAddress:a.studentWallet});
   // A separate authorized writer must not be able to trick us into minting twice.
   const existing=await adapter.certificateOrNull(a);if(existing){if(!existing.verified||existing.owner?.toLowerCase()!==a.studentWallet)throw err('CUSTODY_MAPPING_CONFLICT');await checkpoint({state:'issued',certificate:existing,issuedAt:new Date()});return{state:'issued',certificate:existing};}
   const execute=async args=>{if(!isSystem(principal))throw err('CERTIFICATE_SYSTEM_ONLY');const current=await eligible(a._id);if(snapshotOf(current)!==snapshot)throw err('CERTIFICATE_SNAPSHOT_CHANGED');await checkpoint({phase:'validating-'+args.kind});
    const proof=await adapter.execute(principal,{assignment:a,...args});await adapter.verify(proof);await checkpoint({phase:args.kind});return proof;};
   const digestForTime=require('../core/timeEvidence').workDigest;
   for(const s of sessions)await execute({kind:'attendance',targetId:s._id,digest:digestForTime(s)});
   await execute({kind:'report',targetId:r._id,digest:'0x'+crypto.createHash('sha256').update(r.content).digest('hex')});
   await execute({kind:'completion',targetId:a._id,digest:snapshot});
   // Full snapshot recheck immediately before mint. No arbitrary recipient in request.
   const last=await eligible(a._id);if(snapshotOf(last)!==snapshot)throw err('CERTIFICATE_SNAPSHOT_CHANGED');
   await execute({kind:'mint',targetId:a._id,digest:snapshot});const certificate=await adapter.certificateOrNull(a);if(!certificate?.verified)throw err('CERTIFICATE_UNVERIFIED');
   await checkpoint({state:'issued',certificate,issuedAt:new Date()});return{state:'issued',certificate};
  }catch(e){const code=e.code||'CERTIFICATE_TEMPORARY_FAILURE',blocked=/NOT_ELIGIBLE|NOT_APPROVED|RECIPIENT_REQUIRED/.test(code),fatal=/CONFLICT|MISMATCH|SNAPSHOT_CHANGED|WRITER_DENIED/.test(code)||(!blocked&&j.attempts>=5);const state=fatal?'manual_review':blocked?'blocked':'retry_wait';await checkpoint({state,lastErrorCode:code,nextAttemptAt:new Date(Date.now()+Math.min(300000,1000*2**Math.min(j.attempts,16)))});return{state,errorCode:code};
  }finally{await jobs.updateOne(filter,{$unset:{leaseToken:1,leaseUntil:1}});await releaseIssuer();}
 }
 async function pump(){await recipients.guard(true);const rows=await db.collection('business_reports').find({'certificateRequest.enabled':true,'certificateRequest.dispatchedAt':{$exists:false},state:'approved',kind:'final',current:true}).sort({_id:1}).project({assignmentId:1}).limit(20).toArray();for(const r of rows){await enqueue(r.assignmentId);await db.collection('business_reports').updateOne({_id:r._id,'certificateRequest.enabled':true},{$set:{'certificateRequest.dispatchedAt':new Date()}});}return runOne();}
 return{initialize,eligible,enqueue,runOne,pump};
}
module.exports={createQueue};

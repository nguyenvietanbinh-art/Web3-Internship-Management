const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const h = require('./helpers');
test.before(h.start); test.after(h.stop);

test('demo login is disabled by default and cannot be enabled on TEST/DEV by flag alone', async () => {
  assert.equal((await h.api('POST','/auth/demo-login',{body:{role:'company'}})).status,403);
  process.env.DEMO_MODE='true';
  try { assert.equal((await h.api('POST','/auth/demo-login',{body:{role:'company'}})).status,403); }
  finally { process.env.DEMO_MODE='false'; }
});
test('invalid signature cannot consume victim nonce; two valid concurrent logins consume once', async () => {
  const wallet=ethers.Wallet.createRandom(), other=ethers.Wallet.createRandom();
  const n=await h.api('POST','/auth/nonce',{body:{walletAddress:wallet.address}});
  const invalid=await other.signMessage(n.body.message);
  assert.equal((await h.api('POST','/auth/login-wallet',{body:{walletAddress:wallet.address,signature:invalid}})).status,401);
  const signature=await wallet.signMessage(n.body.message);
  const results=await Promise.all([1,2].map(()=>h.api('POST','/auth/login-wallet',{body:{walletAddress:wallet.address,signature}})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,401]);
});
test('public repeated/concurrent nonce requests cannot invalidate an unexpired wallet challenge',async()=>{
  const wallet=ethers.Wallet.createRandom();
  const results=await Promise.all([1,2,3].map(()=>h.api('POST','/auth/nonce',{body:{walletAddress:wallet.address}})));
  for(const r of results){assert.equal(r.status,200);assert.equal(r.body.message,results[0].body.message);assert.equal(r.body.expiresAt,results[0].body.expiresAt)}
  const signature=await wallet.signMessage(results[0].body.message);
  assert.equal((await h.api('POST','/auth/login-wallet',{body:{walletAddress:wallet.address,signature}})).status,200);
});
test('public profile excludes email and bio; CORS denies unlisted origins', async () => {
  const person=await h.loginAs('student','Privacy');
  await h.api('PUT','/auth/profile/'+person.address,{token:person.token,body:{email:'private@example.invalid',bio:'Private bio'}});
  const p=await h.api('GET','/auth/profile/'+person.address);
  assert.equal(p.status,200); assert.equal(p.body.email,undefined); assert.equal(p.body.bio,undefined);
  const {createApp}=require('../src/app');
  const server=await new Promise(resolve=>{const s=createApp().listen(0,'127.0.0.1',()=>resolve(s))});
  try {
    const r=await fetch(`http://127.0.0.1:${server.address().port}/api/health`,{headers:{Origin:'https://untrusted.invalid'}});
    assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);
  } finally {await new Promise(resolve=>server.close(resolve))}
});

let fixturePromise;
function fixture() {
  if(!fixturePromise) fixturePromise=(async()=>{
    const company=await h.loginAs('company','Owner'),other=await h.loginAs('company','Other'),student=await h.loginAs('student','Assigned'),stranger=await h.loginAs('student','Other student');
    const created=await h.api('POST','/topics',{token:company.token,body:{title:'Security regression',description:'Assignment fixture for authorization tests',kpis:h.kpis2()}});
    assert.equal(created.status,201);const topic=created.body.topic;
    assert.equal((await h.api('POST',`/topics/${topic._id}/assign`,{token:company.token,body:{studentWallet:student.address}})).status,200);
    return {company,other,student,stranger,topic};
  })();
  return fixturePromise;
}
test('all four GET lists are read-only, including repeat reads and foreign filters', async()=>{
  const {student}=await fixture();
  const mongoose=require('mongoose');const names=['job_descriptions','internship_tasks','work_logs','attendances'];
  const before=await Promise.all(names.map(n=>mongoose.connection.collection(n).countDocuments()));
  for(let i=0;i<2;i++)for(const p of ['/internship/jds','/internship/tasks','/internship/worklogs','/internship/attendance/history']){
    const r=await h.api('GET',p,{token:student.token});assert.equal(r.status,200);assert.deepEqual(r.body,[]);
  }
  assert.equal((await h.api('GET','/internship/attendance/history?studentWallet=0x0000000000000000000000000000000000000001',{token:student.token})).status,403);
  assert.deepEqual(await Promise.all(names.map(n=>mongoose.connection.collection(n).countDocuments())),before);
});
test('task status requires real company/student relationship and rejects IDOR',async()=>{
  const {company,other,student,stranger}=await fixture();
  const made=await h.api('POST','/internship/tasks',{token:company.token,body:{title:'Assigned task',assignedStudentWallet:student.address}});assert.equal(made.status,201);
  const id=made.body.task._id;
  for(const actor of [other,stranger])assert.equal((await h.api('PATCH',`/internship/tasks/${id}/status`,{token:actor.token,body:{status:'done'}})).status,403);
  assert.equal((await h.api('PATCH',`/internship/tasks/${id}/status`,{token:student.token,body:{status:'done'}})).status,200);
  assert.equal((await h.api('POST','/internship/tasks',{token:student.token,body:{title:'Not authorized'}})).status,403);
  assert.equal((await h.api('POST','/internship/tasks',{token:company.token,body:{title:'Missing student'}})).status,400);
});
test('worklog review is scoped, cannot self-approve and validates transitions',async()=>{
  const {company,other,student}=await fixture();
  const r=await h.api('POST','/internship/worklogs',{token:student.token,body:{title:'Work',tasksDone:'Tested access control',weekNumber:1}});assert.equal(r.status,201);
  assert.equal(r.body.workLog.companyWallet,company.address);
  const path='/internship/worklogs/'+r.body.workLog._id+'/review';
  for(const actor of [student,other])assert.equal((await h.api('PATCH',path,{token:actor.token,body:{status:'approved'}})).status,403);
  assert.equal((await h.api('PATCH',path,{token:company.token,body:{status:'not-an-enum'}})).status,400);
  assert.equal((await h.api('PATCH',path,{token:company.token,body:{status:'approved'}})).status,200);
});
test('normalized private data is authenticated and tenant-scoped; public topics redact reports',async()=>{
  const {company,other,student,stranger,topic}=await fixture();
  assert.equal((await h.api('GET','/data/students')).status,401);
  assert.equal((await h.api('GET','/data/students/'+student.address,{token:stranger.token})).status,403);
  const mine=await h.api('GET','/data/students',{token:company.token});assert.equal(mine.status,200);assert.equal(mine.body.items.length,1);
  const theirs=await h.api('GET','/data/students',{token:other.token});assert.equal(theirs.status,200);assert.equal(theirs.body.items.length,0);
  const Topic=require('../src/models/Topic');await Topic.updateOne({_id:topic._id},{$set:{'kpis.0.submissionContent':'PRIVATE-REPORT'}});
  const publicTopic=await h.api('GET','/topics/'+topic._id);assert.equal(publicTopic.body.kpis[0].submissionContent,'');assert.equal(publicTopic.body.assignedStudentWallet,null);
  const privateTopic=await h.api('GET','/topics/'+topic._id,{token:student.token});assert.equal(privateTopic.body.kpis[0].submissionContent,'PRIVATE-REPORT');
});
test('certificate and chain metadata are fail-closed, with no fake proof',async()=>{
  const {other,company,topic}=await fixture();
  assert.equal((await h.api('GET','/internship/certificate/not-a-certificate')).status,404);
  const existing=await h.api('GET','/internship/certificate/'+topic._id);assert.equal(existing.status,503);assert.notEqual(existing.body.verified,true);
  assert.equal((await h.api('POST','/internship/sync-events')).status,401);
  assert.equal((await h.api('POST',`/topics/${topic._id}/record-chain-tx`,{token:other.token,body:{txHash:'forged'}})).status,403);
  assert.equal((await h.api('POST',`/topics/${topic._id}/record-chain-tx`,{token:company.token,body:{txHash:'forged'}})).status,400);
  assert.equal((await h.api('POST',`/topics/${topic._id}/record-chain-tx`,{token:company.token,body:{txHash:'0x'+'1'.repeat(64)}})).status,503);
});

test('QR sessions reject invalid/expired/wrong student and consume once under concurrency',async()=>{
  const {company,other,student,stranger,topic}=await fixture();
  const Attendance=require('../src/models/Attendance'),Session=require('../src/models/AttendanceSession');
  const before=await Attendance.countDocuments();
  for(const hash of ['', 'QR-VERIFIED','web3_checkin_'+new Date().toISOString().slice(0,10)])assert.equal((await h.api('POST','/internship/attendance/check-in',{token:student.token,body:{qrCodeHash:hash}})).status,400);
  assert.equal((await h.api('GET','/internship/attendance/today-qr',{token:company.token})).status,404);
  assert.equal((await h.api('POST','/internship/attendance/sessions',{token:other.token,body:{studentWallet:student.address,topicId:topic._id}})).status,403);
  assert.equal((await h.api('POST','/internship/attendance/sessions',{token:student.token,body:{studentWallet:student.address,topicId:topic._id}})).status,403);
  const expired=await h.api('POST','/internship/attendance/sessions',{token:company.token,body:{studentWallet:student.address,topicId:topic._id,ttlSeconds:15}});assert.equal(expired.status,201);
  await Session.updateOne({_id:expired.body.session},{$set:{expiresAt:new Date(Date.now()-1000)}});
  assert.equal((await h.api('POST','/internship/attendance/check-in',{token:student.token,body:{qrCodeHash:expired.body.hash}})).status,400);
  const issued=await h.api('POST','/internship/attendance/sessions',{token:company.token,body:{studentWallet:student.address,topicId:topic._id}});assert.equal(issued.status,201);
  const count=await Session.countDocuments({_id:issued.body.session});const current=await h.api('GET','/internship/attendance/today-qr',{token:company.token});assert.equal(current.status,200);assert.equal(current.body.hash,issued.body.hash);assert.equal(await Session.countDocuments({_id:issued.body.session}),count);
  assert.equal((await h.api('POST','/internship/attendance/check-in',{token:stranger.token,body:{qrCodeHash:issued.body.hash}})).status,403);
  const results=await Promise.all([1,2].map(()=>h.api('POST','/internship/attendance/check-in',{token:student.token,body:{qrCodeHash:issued.body.hash}})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(await Attendance.countDocuments(),before+1);
  const ok=results.find(r=>r.status===200);assert.equal(ok.body.attendance.companyWallet,company.address);assert.equal(ok.body.locationVerified,false);assert.equal(ok.body.chainStatus,'not_recorded');
  assert.equal((await h.api('POST','/internship/attendance/check-in',{token:student.token,body:{qrCodeHash:issued.body.hash}})).status,409);
});

test('assigned mentor reads attendance and reviews worklog; unrelated mentor is denied',async()=>{
  const {company,student,topic}=await fixture();
  const User=require('../src/models/User'),Topic=require('../src/models/Topic');
  const {signToken}=require('../src/services/authService');
  const make=async()=>{const wallet=ethers.Wallet.createRandom().address.toLowerCase();const user=await User.create({walletAddress:wallet,role:'mentor',name:'Mentor TEST fixture'});return {wallet,token:signToken(user)}};
  const mentor=await make(),foreign=await make();
  assert.equal((await h.api('POST',`/topics/${topic._id}/mentor`,{token:company.token,body:{mentorWallet:mentor.wallet}})).status,200);
  const logs=await h.api('GET','/internship/worklogs',{token:mentor.token});assert.equal(logs.status,200);assert.ok(logs.body.length>0);
  const path='/internship/worklogs/'+logs.body[0]._id+'/review';
  assert.equal((await h.api('PATCH',path,{token:foreign.token,body:{status:'approved'}})).status,403);
  assert.equal((await h.api('PATCH',path,{token:mentor.token,body:{status:'approved'}})).status,200);
  const history=await h.api('GET','/internship/attendance/history',{token:mentor.token});assert.equal(history.status,200);assert.ok(history.body.some(x=>x.studentWallet===student.address));
  const none=await h.api('GET','/internship/attendance/history',{token:foreign.token});assert.deepEqual(none.body,[]);
  // Explicit malformed legacy fixture proves fail-closed behavior, not a migration.
  const WorkLog=require('../src/models/WorkLog');const legacy=await WorkLog.create({studentWallet:student.address,companyWallet:'0x0000000000000000000000000000000000000009',weekNumber:2,title:'Unbound legacy fixture',tasksDone:'TEST'});
  assert.equal((await h.api('PATCH',`/internship/worklogs/${legacy._id}/review`,{token:company.token,body:{status:'approved'}})).status,403);
  assert.equal(await Topic.countDocuments({_id:topic._id}),1);
});
test('admin read remains available; sync without enabled chain reports unavailable, never success',async()=>{
  const User=require('../src/models/User'),{signToken}=require('../src/services/authService');
  const admin=await User.create({walletAddress:ethers.Wallet.createRandom().address.toLowerCase(),role:'admin',name:'Admin TEST fixture'}),token=signToken(admin);
  assert.equal((await h.api('GET','/data/overview',{token})).status,200);
  assert.equal((await h.api('GET','/internship/chain-events',{token})).status,200);
  const result=await h.api('POST','/internship/sync-events',{token});assert.equal(result.status,503);assert.notEqual(result.body.success,true);
});
test('rate limiting and CORS allowlist/readiness retain explicit failure states',async()=>{
  const {createApp}=require('../src/app');const previous=process.env.AUTH_RATE_LIMIT;process.env.AUTH_RATE_LIMIT='2';
  const server=await new Promise(resolve=>{const s=createApp().listen(0,'127.0.0.1',()=>resolve(s))});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const allowed=await fetch(base+'/api/health',{headers:{Origin:'http://127.0.0.1:5175'}});assert.equal(allowed.status,200);assert.equal(allowed.headers.get('access-control-allow-origin'),'http://127.0.0.1:5175');
    assert.equal((await fetch(base+'/api/ready')).status,200);
    const calls=[];for(let i=0;i<3;i++)calls.push(await fetch(base+'/api/auth/nonce',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"walletAddress":"invalid"}'}));
    assert.deepEqual(calls.map(r=>r.status),[400,400,429]);assert.ok(calls[2].headers.get('retry-after'));
  }finally{await new Promise(resolve=>server.close(resolve));if(previous===undefined)delete process.env.AUTH_RATE_LIMIT;else process.env.AUTH_RATE_LIMIT=previous}
});
test('invalid and structured filters cannot silently broaden data queries',async()=>{
  const {company}=await fixture();
  for(const path of ['/data/assignments?topicId=bad-id','/data/topics?status[$ne]=completed','/topics?status[$ne]=open','/topics?companyWallet=bad-wallet'])assert.equal((await h.api('GET',path,{token:company.token})).status,400);
  assert.equal((await h.api('POST','/topics',{token:company.token,body:{title:123,description:'invalid title type',kpis:h.kpis2()}})).status,400);
});

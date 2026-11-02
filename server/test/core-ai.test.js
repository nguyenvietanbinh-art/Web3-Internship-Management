process.env.CORE_BUSINESS_ENABLED='true';
process.env.NLP_SERVICE_URL=process.env.NLP_SERVICE_URL_TEST||'http://127.0.0.1:8003';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {setup,placement,h}=require('./coreFixtures');
const {CV,Application,Report}=require('../src/models/BusinessModels');
const JD=require('../src/models/JD'),Task=require('../src/models/Task'),mongoose=require('mongoose'),crypto=require('node:crypto');
let f,p,jd,report;
const snapshot=async()=>{const out={};for(const c of await mongoose.connection.db.listCollections().toArray())if(c.name!=='auth_nonces')out[c.name]=crypto.createHash('sha256').update(JSON.stringify(await mongoose.connection.db.collection(c.name).find().sort({_id:1}).toArray())).digest('hex');return out;};
before(async()=>{f=await setup();p=(await placement(f)).doc;await CV.create({ownerWallet:f.student.address,title:'TEST React Solidity',summary:'React Solidity developer',skills:['React','Solidity']});jd=await JD.create({title:'TEST React Solidity developer',description:'React Solidity development',companyWallet:f.company.address,companyName:'TEST company',requirements:['React','Solidity'],deadline:new Date(Date.now()+864e5),status:'open'});report=await Report.create({assignmentId:p._id,studentWallet:f.student.address,companyWallet:f.company.address,mentorWallet:f.mentor.address,kind:'weekly',version:1,title:'TEST AI report',content:'Hoàn thành thiết kế và triển khai React Solidity.'});await Task.create({assignmentId:p._id,title:'TEST overdue real task',assignedStudentWallet:f.student.address,companyWallet:f.company.address,dueDate:new Date(Date.now()-3600e3),status:'todo'});});after(h.stop);
test('AI APIs require live auth, strict role/ownership and forbid client-supplied private CV',async()=>{
 assert.equal((await h.api('GET','/core/ai/status')).status,401);
 assert.equal((await h.api('POST','/core/ai/match',{token:f.company.token,body:{engine:'tfidf'}})).status,403);
 assert.equal((await h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'tfidf',cv:'foreign'}})).status,400);
 assert.equal((await h.api('POST','/core/ai/rank-applicants',{token:f.foreignCompany.token,body:{engine:'tfidf',jdId:String(jd._id)}})).status,404);
 assert.equal((await h.api('POST','/core/ai/reports/'+report._id+'/analyze',{token:f.foreignCompany.token,body:{engine:'tfidf'}})).status,404);
 assert.equal((await h.api('POST','/core/ai/reports/'+report._id+'/analyze',{token:f.student.token,body:{engine:'tfidf'}})).status,403);
});
test('real local TF-IDF matching uses own persisted CV, returns Top-K and zero database writes',async()=>{
 const before=await snapshot(),r=await h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'tfidf',topK:1}});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.engine,'tfidf');assert.equal(r.body.items[0].id,String(jd._id));assert.ok(r.body.items[0].cosine>0);assert.equal(r.body.confidence,null);assert.deepEqual(await snapshot(),before);
});
test('company ranking uses consented application snapshot only, never foreign CV collections',async()=>{
 await Application.create({jdId:jd._id,cvId:(await CV.findOne())._id,studentWallet:f.student.address,companyWallet:f.company.address,studentName:'TEST applicant',jdTitle:jd.title,companyName:'TEST company',cvSnapshot:{title:'React Solidity',summary:'React Solidity developer',skills:['React','Solidity']}});
 const before=await snapshot(),r=await h.api('POST','/core/ai/rank-applicants',{token:f.company.token,body:{engine:'tfidf',jdId:String(jd._id)}});assert.equal(r.status,200);assert.equal(r.body.items.length,1);assert.equal(r.body.scope,'owned-jd/consented-application-snapshots');assert.deepEqual(await snapshot(),before);
});
test('mentor report NLP uses actual task deadline/hours and clearly untrained classifier, read-only',async()=>{
 const before=await snapshot(),r=await h.api('POST','/core/ai/reports/'+report._id+'/analyze',{token:f.mentor.token,body:{engine:'tfidf'}});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.classifier.status,'NOT_TRAINED');assert.equal(r.body.classifier.confidence,null);assert.ok(r.body.rule_factors.some(x=>x.code==='OVERDUE_TASKS'&&x.observed===1));assert.equal(r.body.observations.report_versions,1);assert.deepEqual(await snapshot(),before);
});
test('SBERT response preserves real engine provenance or fails closed without baseline substitution',async()=>{
 const status=await h.api('GET','/core/ai/status',{token:f.student.token});assert.equal(status.status,200);
 const r=await h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'sbert'}});
 if(r.status===200){assert.equal(r.body.engine,'sbert');assert.equal(r.body.model.ready,true);assert.equal(r.body.confidence,null);}
 else{assert.equal(r.status,503);assert.ok(!r.body.items);}
});
test('real SBERT student matching returns pinned model cosine with zero database changes',{skip:process.env.NLP_INFERENCE_TESTS!=='true'},async()=>{
 const before=await snapshot(),r=await h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'sbert',topK:1}});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.engine,'sbert');assert.equal(r.body.model.revision,'e8f8c211226b894fcb81acc59f3b34ba3efd5f42');assert.equal(r.body.items[0].id,String(jd._id));assert.ok(Number.isFinite(r.body.items[0].cosine));assert.equal(r.body.confidence,null);assert.deepEqual(await snapshot(),before);
});
test('real SBERT company ranking uses application snapshot and writes nothing',{skip:process.env.NLP_INFERENCE_TESTS!=='true'},async()=>{
 const before=await snapshot(),r=await h.api('POST','/core/ai/rank-applicants',{token:f.company.token,body:{engine:'sbert',jdId:String(jd._id)}});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.engine,'sbert');assert.equal(r.body.model.ready,true);assert.equal(r.body.items.length,1);assert.deepEqual(await snapshot(),before);
});
test('real SBERT report semantic analysis remains distinct from untrained risk classifier',{skip:process.env.NLP_INFERENCE_TESTS!=='true'},async()=>{
 const before=await snapshot(),r=await h.api('POST','/core/ai/reports/'+report._id+'/analyze',{token:f.mentor.token,body:{engine:'sbert'}});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.semantic_relevance.engine,'sbert');assert.equal(r.body.semantic_relevance.model.ready,true);assert.equal(r.body.classifier.status,'NOT_TRAINED');assert.equal(r.body.classifier.confidence,null);assert.deepEqual(await snapshot(),before);
});
test('unavailable AI and non-loopback configuration do not block backend health or write data',async()=>{
 const old=process.env.NLP_SERVICE_URL,before=await snapshot();
 try{for(const value of ['http://127.0.0.1:1','https://example.com']){process.env.NLP_SERVICE_URL=value;assert.equal((await h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'tfidf'}})).status,503);assert.equal((await h.api('GET','/health')).status,200);}}
 finally{process.env.NLP_SERVICE_URL=old;}assert.deepEqual(await snapshot(),before);
});
test('real stalled local AI times out while Backend health stays responsive, no writes',{timeout:20000},async()=>{
 const http=require('node:http'),stall=http.createServer((_req,_res)=>{}),sockets=new Set();stall.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});
 await new Promise(resolve=>stall.listen(0,'127.0.0.1',resolve));const old=process.env.NLP_SERVICE_URL,before=await snapshot();
 try{
  process.env.NLP_SERVICE_URL='http://127.0.0.1:'+stall.address().port;const observed=new Promise(resolve=>stall.once('request',resolve)),start=Date.now();
  const pending=h.api('POST','/core/ai/match',{token:f.student.token,body:{engine:'tfidf'}});await observed;
  const healthyAt=Date.now();assert.equal((await h.api('GET','/health')).status,200);assert.ok(Date.now()-healthyAt<2000);
  assert.equal((await pending).status,503);assert.ok(Date.now()-start>=14000);assert.deepEqual(await snapshot(),before);
 }finally{process.env.NLP_SERVICE_URL=old;for(const s of sockets)s.destroy();await new Promise(resolve=>stall.close(resolve));}
});

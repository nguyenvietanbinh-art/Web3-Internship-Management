process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),jwt=require('jsonwebtoken');
const {h,setup,placement}=require('./coreFixtures'),mongoose=require('mongoose'),User=require('../src/models/User');
let f,a;
async function snapshot(){const out={};for(const {name} of await mongoose.connection.db.listCollections().toArray())out[name]=crypto.createHash('sha256').update(JSON.stringify(await mongoose.connection.db.collection(name).find().sort({_id:1}).toArray())).digest('hex');return out;}
before(async()=>{f=await setup();a=(await placement(f)).doc;});after(h.stop);
test('JWT absent/unsigned/expired/wrong-wallet/unknown-user fail without data changes',async()=>{
 const payload={sub:String(f.student.user._id),wallet:f.student.address,role:'admin'},sign=(p,options={})=>jwt.sign(p,process.env.JWT_SECRET,{expiresIn:'1m',...options});
 const tokens=[undefined,sign(payload,{expiresIn:-1}),sign({...payload,wallet:f.company.address}),sign({...payload,sub:String(new mongoose.Types.ObjectId())}),jwt.sign(payload,null,{algorithm:'none'}),'invalid.token.value'];const before=await snapshot();for(const token of tokens)assert.equal((await h.api('GET','/core/profile',{token})).status,401);assert.deepEqual(await snapshot(),before);
 // A forged role claim signed only with the isolated TEST key must not override DB RBAC.
 assert.equal((await h.api('GET','/core/accounts',{token:sign(payload)})).status,403);
});
test('IDOR matrix rejects foreign tenant resource reads/writes and protected administrative functions',async()=>{
 const before=await snapshot();for(const token of [f.foreignStudent.token,f.foreignCompany.token])for(const url of ['/core/placements/'+a._id,'/core/reports?assignmentId='+a._id,'/core/tasks?assignmentId='+a._id,'/core/time/totals?assignmentId='+a._id,'/core/web3/placements/'+a._id+'/operations'])assert.equal((await h.api('GET',url,{token})).status,404,url);
 for(const actor of [f.student,f.company,f.mentor]){assert.equal((await h.api('GET','/core/accounts',{token:actor.token})).status,403);assert.equal((await h.api('POST','/core/accounts',{token:actor.token,body:{role:'admin',walletAddress:actor.address,name:'Unauthorized'}})).status,403);}
 assert.equal((await h.api('PATCH','/core/placements/'+a._id,{token:f.foreignCompany.token,body:{lifecycle:'cancelled',reason:'IDOR',version:0}})).status,404);assert.deepEqual(await snapshot(),before);
});
test('Mongo/operator/prototype/regex inputs cannot broaden filters or escalate profile ownership',async()=>{
 const before=await snapshot();for(const url of ['/core/jds?q[$ne]=','/core/placements?batchId[$ne]=x','/core/tasks?assignmentId[$gt]=','/core/accounts?role[$ne]=student','/core/jds?page[$gt]=0'])assert.equal((await h.api('GET',url,{token:f.admin.token})).status,400,url);
 for(const body of [{role:'admin',version:0},{name:{$ne:null},version:0},{walletAddress:f.company.address,version:0},JSON.parse('{"__proto__":{"role":"admin"},"version":0}')])assert.equal((await h.api('PATCH','/core/profile',{token:f.student.token,body})).status,400);
 const q=await h.api('GET','/core/jds?q='+encodeURIComponent('.*(a+)+$'),{token:f.student.token});assert.equal(q.status,200);assert.equal(q.body.total,0);assert.deepEqual(await snapshot(),before);assert.equal({}.role,undefined);
});
test('CORS denied mutation and preflight do not write; allowed origin has exact headers',async()=>{
 const before=await snapshot();let r=await fetch(h.baseURL+'/core/profile',{method:'PATCH',headers:{Origin:'https://untrusted.invalid',Authorization:'Bearer '+f.student.token,'Content-Type':'application/json'},body:JSON.stringify({name:'CORS mutation',version:0})});assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);
 r=await fetch(h.baseURL+'/core/profile',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:5175','Access-Control-Request-Method':'PATCH','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),'http://127.0.0.1:5175');assert.deepEqual(await snapshot(),before);
});
test('invalid JSON, unsupported file and oversized body reject without partial CV writes',async()=>{
 const before=await snapshot();for(const [type,body,status] of [['application/json','{"broken":',400],['text/html','<script>alert(1)</script>',415],['application/pdf',Buffer.alloc(2*1024*1024+1),413]]){const r=await fetch(h.baseURL+'/core/cv/file',{method:'POST',headers:{Authorization:'Bearer '+f.student.token,'Content-Type':type,'X-CV-Filename':'test.pdf'},body});assert.equal(r.status,status,type);}assert.deepEqual(await snapshot(),before);
});
test('safe GET portfolio across four roles leaves every collection byte-equivalent',async()=>{
 const before=await snapshot();for(const actor of [f.student,f.company,f.mentor,f.admin])for(const url of ['/core/profile','/core/dashboard','/core/placements','/core/jds','/core/tasks','/core/worklogs','/core/reports','/core/time/sessions','/core/time/totals','/core/notifications','/core/web3/status'])assert.equal((await h.api('GET',url,{token:actor.token})).status,200,url);assert.deepEqual(await snapshot(),before);
});
test('old JWT sees DB role/disabled status immediately; no stale role privilege after a change',async()=>{
 const victim=f.foreignCompany;await User.updateOne({_id:victim.user._id},{$set:{disabled:true}});assert.equal((await h.api('GET','/core/profile',{token:victim.token})).status,401);await User.updateOne({_id:victim.user._id},{$set:{disabled:false,role:'student'}});assert.equal((await h.api('POST','/core/jds',{token:victim.token,body:{}})).status,403);
});
test('private IPFS artifact metadata is tenant-scoped and never exposes ciphertext envelope or encryption key',async()=>{
 const {Report}=require('../src/models/BusinessModels'),{PrivateReportArtifact}=require('../src/models/Web3Models'),ipfs=require('../src/services/privateIpfs');
 const original=process.env.REPORT_ENCRYPTION_KEY;process.env.REPORT_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');
 try{const report=await Report.create({assignmentId:a._id,studentWallet:f.student.address,companyWallet:f.company.address,mentorWallet:f.mentor.address,kind:'weekly',version:1,current:true,title:'TEST privacy artifact',content:'SYNTHETIC private report'}),encrypted=ipfs.encrypt(Buffer.from(report.content),report._id);
  await PrivateReportArtifact.create({reportId:report._id,ownerWallet:f.student.address,source:'report-json',...encrypted,mime:'application/json',bytes:Buffer.byteLength(report.content),state:'prepared'});
  const before=await snapshot(),url='/core/web3/reports/'+report._id+'/artifacts';for(const token of [f.foreignStudent.token,f.foreignCompany.token])assert.equal((await h.api('GET',url,{token})).status,404);
  const r=await h.api('GET',url,{token:f.student.token});assert.equal(r.status,200);assert.equal(r.body.items.length,1);assert.equal(r.body.items[0].state,'prepared');assert.equal(r.body.items[0].cid,null);assert.equal(r.body.items[0].envelope,undefined);assert.ok(!JSON.stringify(r.body).includes(process.env.REPORT_ENCRYPTION_KEY));assert.deepEqual(await snapshot(),before);
 }finally{if(original===undefined)delete process.env.REPORT_ENCRYPTION_KEY;else process.env.REPORT_ENCRYPTION_KEY=original;}
});

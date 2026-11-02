process.env.USER_ID_BUSINESS_ENABLED='true';process.env.EMAIL_AUTH_ENABLED='true';process.env.GOOGLE_AUTH_ENABLED='true';process.env.GOOGLE_CLIENT_ID='test-unified.apps.googleusercontent.com';process.env.CORE_BUSINESS_ENABLED='true';
process.env.WEB3_LOCAL_ENABLED='true';process.env.WEB3_LOCAL_DEPLOYMENT=process.env.WEB3_TEST_DEPLOYMENT;process.env.NLP_SERVICE_URL=process.env.NLP_SERVICE_URL_TEST||'http://127.0.0.1:8003';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),bcrypt=require('bcryptjs');
const h=require('./helpers'),User=require('../src/models/User'),Assignment=require('../src/models/Assignment'),JD=require('../src/models/JD'),{CV,Application,WorkSession,Report}=require('../src/models/BusinessModels'),{Wallet}=require('ethers'),mongoose=require('mongoose');
const {validateClaims}=require('../src/services/googleIdentity'),{signToken}=require('../src/services/authService');
const pass='TEST unified password 2026';let admin,student,other,company,foreignCompany,mentor,foreignMentor,cv,jd,application,placement,task,work,report,wallet;const cookies={};
before(async()=>{await h.start({googleVerifier:async(token,nonce)=>validateClaims(JSON.parse(token),nonce,process.env.GOOGLE_CLIENT_ID)});const u=await User.create({name:'TEST initial admin',loginEmail:'admin@example.invalid',email:'admin@example.invalid',passwordHash:await bcrypt.hash(pass,12),role:'admin'});admin={token:signToken(u,'password'),user:u};});after(h.stop);
async function request(path,body,actor){const r=await fetch(h.baseURL+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5175',Cookie:Object.entries(cookies).map(([k,v])=>k+'='+v).join('; '),...(actor?{Authorization:'Bearer '+actor.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const c=r.headers.get('set-cookie');if(c){const [key,val]=c.split(';')[0].split('=');cookies[key]=val;}return{status:r.status,body:await r.json()};}
async function register(email){const r=await request('/auth/email/register',{name:'TEST '+email,email,password:pass,confirmPassword:pass});assert.equal(r.status,201,JSON.stringify(r.body));return r.body;}
async function staff(role,email){const p=await request('/core/accounts/email',{name:'TEST '+role,email,password:pass,role,reason:'Explicit isolated TEST provisioning'},admin);assert.equal(p.status,201,JSON.stringify(p.body));const r=await request('/auth/email/login',{email,password:pass});assert.equal(r.status,200);return r.body;}
function check(r,status=200){assert.equal(r.status,status,JSON.stringify(r.body));return r.body;}
const patch=(url,body,a)=>h.api('PATCH',url,{body,token:a.token});
const get=(url,a)=>h.api('GET',url,{token:a.token});
test('one identity: public student registration; controlled company/mentor; all roles dashboard without wallet',async()=>{
 student=await register('student@example.invalid');other=await register('other@example.invalid');company=await staff('company','company@example.invalid');foreignCompany=await staff('company','foreign-company@example.invalid');mentor=await staff('mentor','mentor@example.invalid');foreignMentor=await staff('mentor','foreign-mentor@example.invalid');
 for(const a of [student,other,company,mentor,admin]){assert.equal(a.user.walletAddress||null,null);const d=check(await get('/core/dashboard',a));assert.equal(d.scope,a.user.role);assert.equal(d.totals.tasks,0);}
 assert.equal((await request('/core/accounts/email',{email:'bad@example.invalid',password:pass,name:'bad',role:'admin',reason:'attack'},student)).status,403);
 assert.equal((await request('/auth/email/register',{name:'TEST',email:'evil@example.invalid',password:pass,confirmPassword:pass,role:'admin'})).status,400);
});
test('walletless CV isolation, unique User ownership, invalid owner injection and legacy fallback fail closed',async()=>{
 cv=check(await h.api('PUT','/core/cv',{token:student.token,body:{title:'TEST React Solidity',summary:'React Solidity internship engineering',skills:['React','Solidity'],version:null}}),201);
 const second=check(await h.api('PUT','/core/cv',{token:other.token,body:{title:'TEST other private CV',summary:'Private',skills:['Python'],version:null}}),201);
 assert.equal(String(cv.ownerUserId),String(student.user._id));assert.equal(cv.ownerWallet,undefined);assert.equal(check(await get('/core/cv',other))._id,second._id);
 assert.equal((await h.api('PUT','/core/cv',{token:student.token,body:{ownerUserId:other.user._id,title:'steal',version:cv.__v}})).status,400);
 const legacy=await h.loginAs('student','TEST legacy');const doc=await CV.create({ownerWallet:legacy.address,title:'TEST legacy raw',skills:['React']});assert.equal(check(await h.api('GET','/core/cv',{token:legacy.token}))._id,String(doc._id));
 await assert.rejects(()=>CV.updateOne({_id:doc._id},{$set:{ownerUserId:other.user._id}}),e=>e.code===11000);
 await CV.updateOne({_id:doc._id},{$set:{ownerUserId:foreignCompany.user._id}});assert.equal(check(await h.api('GET','/core/cv',{token:legacy.token})),null);
});
test('walletless company JD ownership/search and real local TF-IDF/SBERT matching',async()=>{
 jd=check(await request('/core/jds',{title:'TEST React Solidity JD',description:'React Solidity blockchain internship',requirements:['React','Solidity'],deadline:new Date(Date.now()+10*864e5).toISOString(),status:'open',slots:2},company),201);
 assert.equal(String(jd.companyUserId),String(company.user._id));assert.equal(check(await get('/core/jds?mine=true&q=React',foreignCompany)).total,0);
 assert.equal((await patch('/core/jds/'+jd._id,{title:'steal',version:jd.__v},foreignCompany)).status,404);
 for(const engine of ['tfidf','sbert']){const r=check(await request('/core/ai/match',{engine,topK:5},student));assert.equal(r.engine,engine);assert.ok(r.items.some(x=>x.id===jd._id));}
});
test('apply, concurrent duplicate, consented ranking and notifications use User IDs before wallet',async()=>{
 application=check(await request('/core/applications',{jdId:jd._id,message:'TEST application'},student),201);
 assert.equal(String(application.studentUserId),String(student.user._id));assert.equal(String(application.companyUserId),String(company.user._id));
 assert.equal((await request('/core/applications',{jdId:jd._id},student)).status,409);
 assert.equal(check(await get('/core/applications?q=TEST',foreignCompany)).total,0);assert.equal((await patch('/core/applications/'+application._id,{status:'accepted',reason:'steal',version:0},foreignCompany)).status,404);
 assert.ok(check(await get('/core/notifications',company)).items.length);
 application=check(await patch('/core/applications/'+application._id,{status:'accepted',reason:'TEST accepted',version:application.__v},company));assert.ok(check(await get('/core/notifications',student)).items.length);
 const ranked=check(await request('/core/ai/rank-applicants',{jdId:jd._id,engine:'tfidf',topK:5},company));assert.equal(ranked.items[0].id,application._id);
});
test('User ID topic/rubric and accepted-student directory; reject unaccepted/foreign placement',async()=>{
 const topic=check(await request('/core/topics',{title:'TEST unified rubric',description:'TEST actual input',kpis:[{title:'Deliver React Solidity',description:'Implement and test',weightPercent:100,deadline:new Date(Date.now()+7*864e5).toISOString()}]},company),201);
 const batch=check(await request('/core/batches',{code:'TEST_UNIFIED',name:'TEST period',startDate:new Date(Date.now()-864e5).toISOString(),endDate:new Date(Date.now()+30*864e5).toISOString(),status:'open'},admin),201);
 const body={topicId:topic._id,batchId:batch._id,studentUserId:student.user._id,mentorUserId:mentor.user._id,startDate:new Date(Date.now()-600000).toISOString(),endDate:new Date(Date.now()+20*864e5).toISOString()};
 assert.ok(check(await get('/core/directory?role=student',company)).items.some(x=>x._id===student.user._id));
 assert.equal((await request('/core/placements',{...body,studentUserId:other.user._id},company)).status,403);
 assert.equal((await request('/core/placements',body,foreignCompany)).status,403);
 placement=check(await request('/core/placements',body,company),201);assert.equal(placement.studentWallet,undefined);assert.equal(placement.studentUserId,student.user._id);
 placement=check(await patch('/core/placements/'+placement._id,{lifecycle:'approved',reason:'TEST approved',version:placement.__v},admin));placement=check(await patch('/core/placements/'+placement._id,{lifecycle:'active',reason:'TEST started',version:placement.__v},company));
 assert.equal(check(await get('/core/placements',foreignMentor)).total,0);
});
test('walletless tasks/progress/logs/reviews enforce relationships and preserve audits by User ID',async()=>{
 task=check(await request('/core/tasks',{assignmentId:placement._id,title:'TEST task',priority:'high',dueDate:new Date(Date.now()+864e5).toISOString()},company),201);
 assert.equal((await patch('/core/tasks/'+task._id,{status:'done',progress:100,version:task.__v},other)).status,404);
 task=check(await patch('/core/tasks/'+task._id,{status:'done',progress:100,version:task.__v},student));assert.equal(String(task.history[0].actorUserId),company.user._id);
 const log=check(await request('/core/worklogs',{assignmentId:placement._id,weekNumber:1,title:'TEST log',tasksDone:'React Solidity',challenges:'None',nextPlan:'Tests'},student),201);
 assert.equal((await patch('/core/worklogs/'+log._id+'/review',{status:'approved',mentorFeedback:'steal',version:log.__v},foreignMentor)).status,404);
 check(await patch('/core/worklogs/'+log._id+'/review',{status:'approved',mentorFeedback:'TEST reviewed',version:log.__v},mentor));
});
test('walletless QR issue/redeem uses User ID, authentic nonce, GPS fixture and replay/expiry controls',async()=>{
 let app=check(await request('/core/applications',{jdId:jd._id,message:'TEST other QR student'},other),201);check(await patch('/core/applications/'+app._id,{status:'accepted',reason:'TEST QR applicant accepted',version:app.__v},company));
 let a=check(await request('/core/placements',{topicId:placement.topicId,batchId:placement.batchId,studentUserId:other.user._id,mentorUserId:mentor.user._id,startDate:new Date(Date.now()-600000).toISOString(),endDate:new Date(Date.now()+20*864e5).toISOString()},company),201);
 a=check(await patch('/core/placements/'+a._id,{lifecycle:'approved',reason:'TEST QR assignment',version:a.__v},admin));a=check(await patch('/core/placements/'+a._id,{lifecycle:'active',reason:'TEST QR active',version:a.__v},company));
 const body={assignmentId:a._id,action:'checkin',ttlSeconds:120,centerLat:10.8,centerLon:106.7,radiusMeters:100,maxAccuracyMeters:30},position={latitude:10.8,longitude:106.7,accuracy:10,timestamp:Date.now()};
 const qr=check(await request('/core/web3/qr/issue',body,company),201);
 assert.equal((await request('/core/web3/qr/redeem',{token:qr.token,position},student)).status,403);
 const redeemed=check(await request('/core/web3/qr/redeem',{token:qr.token,position},other));assert.equal(redeemed.workSession.studentUserId,other.user._id);assert.equal(redeemed.gpsIsClientClaim,true);assert.equal(redeemed.workSession.proof.verified,false);
 assert.equal((await request('/core/web3/qr/redeem',{token:qr.token,position},other)).status,409);
 const checkout=check(await request('/core/web3/qr/issue',{...body,action:'checkout'},company),201);const done=check(await request('/core/web3/qr/redeem',{token:checkout.token,position:{...position,timestamp:Date.now()}},other));assert.equal(done.workSession.minutes,0);
 check(await patch('/core/time/'+done.workSession._id+'/review',{decision:'rejected',reason:'TEST zero-minute QR fixture',version:done.workSession.__v},company));
});
test('walletless check-in/out and audited TEST adjustment/approval count hours; no automatic credits',async()=>{
 work=check(await request('/core/time/check-in',{assignmentId:placement._id,requestKey:crypto.randomBytes(16).toString('hex')},student),201);assert.equal(String(work.studentUserId),student.user._id);
 assert.equal((await request('/core/time/check-in',{assignmentId:placement._id,requestKey:crypto.randomBytes(16).toString('hex')},student)).status,409);
 work=check(await request('/core/time/'+work._id+'/check-out',{version:work.__v},student));assert.equal(work.minutes,0);
 // Explicit company correction in isolated TEST, not a claim of physically worked time.
 work=check(await patch('/core/time/'+work._id+'/review',{decision:'adjust',reason:'TEST synthetic two-minute correction; actual API audit',version:work.__v,checkInAt:new Date(Date.now()-120000).toISOString(),checkOutAt:new Date().toISOString()},company));
 work=check(await patch('/core/time/'+work._id+'/review',{decision:'approved',reason:'TEST approved correction',version:work.__v},company));assert.equal(check(await get('/core/time/totals',student)).totalMinutes,2);assert.equal(check(await get('/core/time/totals',other)).totalMinutes,0);
});
test('walletless KPI, report/reviews/approval, NLP and dashboard work without on-chain claims',async()=>{
 let a=check(await get('/core/placements/'+placement._id,student));a=check(await request('/core/placements/'+a._id+'/kpis/0/submit',{content:'TEST React Solidity delivery',version:a.__v},student));a=check(await request('/core/placements/'+a._id+'/kpis/0/evaluate',{status:'approved',score:88,feedback:'TEST criteria checked',version:a.__v},mentor));
 report=check(await request('/core/reports',{assignmentId:a._id,kind:'final',title:'TEST final',content:'Hoàn thành React Solidity, kiểm thử và báo cáo tiến độ.'},student),201);
 check(await request('/core/ai/reports/'+report._id+'/analyze',{engine:'sbert',topK:5},mentor));
 report=check(await request('/core/reports/'+report._id+'/reviews',{score:80,comment:'TEST company review',decision:'approved',version:report.__v},company));report=check(await request('/core/reports/'+report._id+'/reviews',{score:90,comment:'TEST mentor review',decision:'approved',version:report.__v},mentor));report=check(await request('/core/reports/'+report._id+'/approve',{reason:'TEST final approved',version:report.__v},admin));assert.equal(report.finalScore,85);
 const d=check(await get('/core/dashboard',student));assert.equal(d.totals.doneTasks,1);assert.equal(d.totals.approvedMinutes,2);assert.equal(d.totals.approvedFinalReports,1);
 placement=check(await get('/core/placements/'+placement._id,admin));placement=check(await patch('/core/placements/'+placement._id,{lifecycle:'completed',reason:'TEST completed',version:placement.__v},admin));
 assert.equal((await request('/core/web3/reports/'+report._id+'/anchor',{},student)).body.code,'WALLET_LINK_REQUIRED');
});
test('link actual TEST signature binds same User, does not rewrite/duplicate business records; email relogin preserves CV',async()=>{
 wallet=Wallet.createRandom();const before={users:await User.countDocuments(),cvs:await CV.countDocuments(),apps:await Application.countDocuments(),a:JSON.stringify(await Assignment.findById(placement._id).lean()),cv:JSON.stringify(await CV.findById(cv._id).lean())};
 const c=check(await request('/auth/email/wallet-challenge',{password:pass,walletAddress:wallet.address},student));
 assert.equal((await request('/auth/email/link-wallet',{password:pass,challengeId:c.challengeId,signature:await Wallet.createRandom().signMessage(c.message)},student)).status,401);
 const linked=check(await request('/auth/email/link-wallet',{password:pass,challengeId:c.challengeId,signature:await wallet.signMessage(c.message)},student));assert.equal(linked.user._id,student.user._id);student=linked;
 const user=await User.findById(student.user._id);assert.equal(user.walletVerified,true);assert.equal(await User.countDocuments(),before.users);assert.equal(await CV.countDocuments(),before.cvs);assert.equal(await Application.countDocuments(),before.apps);assert.equal(JSON.stringify(await Assignment.findById(placement._id).lean()),before.a);assert.equal(JSON.stringify(await CV.findById(cv._id).lean()),before.cv);
 student=check(await request('/auth/email/login',{email:'student@example.invalid',password:pass}));assert.equal(check(await get('/core/cv',student))._id,cv._id);assert.equal((await h.loginAs('student','TEST already linked',wallet)).user._id,student.user._id);
 const stolen=check(await request('/auth/email/wallet-challenge',{password:pass,walletAddress:wallet.address},other));assert.equal((await request('/auth/email/link-wallet',{password:pass,challengeId:stolen.challengeId,signature:await wallet.signMessage(stolen.message)},other)).status,409);
});
test('real local blockchain anchors and SBT mint/verify from same User-ID business records', {skip:process.env.WEB3_INTEGRATION_TESTS!=='true'},async()=>{
 check(await request('/core/web3/reports/'+report._id+'/anchor',{},student));check(await request('/core/web3/time/'+work._id+'/anchor',{},company));check(await request('/core/web3/placements/'+placement._id+'/complete',{},admin));const minted=check(await request('/core/web3/placements/'+placement._id+'/mint',{},admin));assert.match(minted.txHash,/^0x[a-f0-9]{64}$/);
 const cert=check(await get('/core/web3/placements/'+placement._id+'/certificate',student));assert.equal(cert.verified,true);assert.equal(cert.locked,true);assert.equal(cert.owner,wallet.address.toLowerCase());
 console.log('UNIFIED_CHAIN_PROOF '+JSON.stringify({chainId:cert.chainId,tokenId:cert.tokenId,txHash:cert.txHash,contractAddress:cert.contractAddress,owner:cert.owner,verified:cert.verified}));
 const again=check(await request('/core/web3/placements/'+placement._id+'/mint',{},admin));assert.equal(again.tokenId,cert.tokenId);
 const c=check(await request('/auth/wallet/unlink-challenge',{},student));assert.equal((await request('/auth/wallet/unlink',{challengeId:c.challengeId,signature:await wallet.signMessage(c.message)},student)).body.code,'WALLET_IN_USE');
});
test('wallet unlink without chain commitments preserves CV ownership and prevents last-provider/replay loss',async()=>{
 const w=Wallet.createRandom(),c=check(await request('/auth/email/wallet-challenge',{password:pass,walletAddress:w.address},other));other=check(await request('/auth/email/link-wallet',{password:pass,challengeId:c.challengeId,signature:await w.signMessage(c.message)},other));const id=check(await get('/core/cv',other))._id;
 const un=check(await request('/auth/wallet/unlink-challenge',{},other));other=check(await request('/auth/wallet/unlink',{challengeId:un.challengeId,signature:await w.signMessage(un.message)},other));assert.equal(check(await get('/core/cv',other))._id,id);
 assert.equal((await request('/auth/wallet/unlink',{challengeId:un.challengeId,signature:await w.signMessage(un.message)},other)).status,401);
});
test('Google linking before wallet requires password reauthentication and stable sub; no live Google claim',async()=>{
 const c=check(await request('/auth/google/challenge',{purpose:'link-google'},other)),now=Math.floor(Date.now()/1000),credential=JSON.stringify({iss:'https://accounts.google.com',aud:process.env.GOOGLE_CLIENT_ID,iat:now,exp:now+300,sub:'TEST_UNIFIED_GOOGLE',email:'other@example.invalid',email_verified:true,nonce:c.nonce});
 assert.equal((await request('/auth/google/link',{challengeId:c.challengeId,credential,password:'incorrect-password'},other)).status,401);
 check(await request('/auth/google/link',{challengeId:c.challengeId,credential,password:pass},other));assert.equal(await User.countDocuments({googleSubject:'TEST_UNIFIED_GOOGLE'}),1);
});
test('all GET dashboards/scopes preserve database fingerprints, foreign IDOR and privilege injection rejected',async()=>{
 async function snapshot(){const out={};for(const{name}of await mongoose.connection.db.listCollections().toArray())if(!['auth_nonces'].includes(name))out[name]=crypto.createHash('sha256').update(JSON.stringify(await mongoose.connection.db.collection(name).find().sort({_id:1}).toArray())).digest('hex');return out;}
 const before=await snapshot();for(const a of [student,company,mentor,admin])for(const p of ['/core/dashboard','/core/cv','/core/placements','/core/reports','/core/time/totals','/core/notifications'])await get(p,a);assert.deepEqual(await snapshot(),before);
 assert.equal((await get('/core/placements/'+placement._id,other)).status,404);assert.equal((await get('/core/accounts',student)).status,403);
});

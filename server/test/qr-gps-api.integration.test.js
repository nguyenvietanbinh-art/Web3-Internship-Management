// Opt-in real HTTP + existing, exact-allowlisted isolated QA replica set.
// Only new synthetic fixtures are written. No seed, index creation, reset or drop.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const enabled=process.env.QR_GPS_API_TESTS==='true';
const run=crypto.randomBytes(6).toString('hex');
const uri='mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_qa_20261106_a?replicaSet=internovaTestRs';
Object.assign(process.env,{APP_ENV:'',NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'false',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',WEB3_LOCAL_DEPLOYMENT:'',CHAIN_LISTENER_ENABLED:'false',DEMO_MODE:'false',IPFS_EXTERNAL_UPLOAD_ENABLED:'false',PINATA_JWT:'',AI_SERVICE_URL:'http://127.0.0.1:1',CORS_ORIGIN:'https://qr-test.example.invalid',SERVE_CLIENT:'false'});
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const User=require('../src/models/User'),Assignment=require('../src/models/Assignment');
const {WorkSession}=require('../src/models/BusinessModels'),{CoreQrSession,ChainOperation}=require('../src/models/Web3Models');
const {signToken}=require('../src/services/authService'),{createApp}=require('../src/app');
let server,base,company,foreign,mentor;
const live={skip:!enabled};
async function actor(role){const u=await User.create({name:'SYNTHETIC QR QA '+run+' '+role,role,passwordHash:await require('bcryptjs').hash(crypto.randomBytes(20).toString('hex'),4),email:crypto.randomUUID()+'@example.invalid'});return{user:u,token:signToken(u,'password')};}
async function fixture(patch={}){const student=await actor('student');const a=await Assignment.create({topicId:new mongoose.Types.ObjectId(),studentId:new mongoose.Types.ObjectId(),kpiAtAssign:0,batchId:new mongoose.Types.ObjectId(),workflow:true,activePlacement:true,studentUserId:student.user._id,companyUserId:company.user._id,mentorUserId:mentor.user._id,lifecycle:'active',startDate:new Date(Date.now()-86400000),endDate:new Date(Date.now()+86400000),...patch});return{student,a};}
const api=async(who,method,path,body)=>{const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(who?{Authorization:'Bearer '+who.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{status:res.status,body:await res.json()};};
const point=()=>({latitude:10.8,longitude:106.7,accuracy:10,timestamp:Date.now()});
const body=(a,action='checkin')=>({assignmentId:String(a._id),action,centerLat:10.8,centerLon:106.7,radiusMeters:100,maxAccuracyMeters:30,ttlSeconds:120});
const issue=async(a,action='checkin')=>{const r=await api(company,'POST','/web3/qr/issue',body(a,action));assert.equal(r.status,201,JSON.stringify(r.body));return r.body;};
const redeem=(student,token,position=point())=>api(student,'POST','/web3/qr/redeem',{token,position});
before(async()=>{if(!enabled)return;
 const expected=require('../src/config/workflowTestGuard').assertWorkflowTest();
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:5000});
 assert.equal(mongoose.connection.name,expected.database);assert.equal((await mongoose.connection.db.command({hello:1})).setName,expected.replicaSet);
 await require('../src/services/databaseSafety').verifyIndexes(true);
 assert.ok((await mongoose.connection.db.listCollections({name:'core_qr_sessions'}).toArray()).length,'Existing TEST QR collection required');
 console.log('QR_TEST_DB_VERIFIED '+expected.database+' / '+expected.replicaSet+'; synthetic run '+run);
 company=await actor('company');foreign=await actor('company');mentor=await actor('mentor');
 await new Promise(resolve=>{server=createApp().listen(0,'127.0.0.1',resolve)});base='http://127.0.0.1:'+server.address().port+'/api/core';
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();});
test('company/student role and official assignment scope are enforced without wallets',live,async()=>{
 const {student,a}=await fixture();assert.equal(student.user.walletAddress,undefined);
 assert.equal((await api(null,'POST','/web3/qr/issue',body(a))).status,401);
 assert.equal((await api(student,'POST','/web3/qr/issue',body(a))).status,403);
 assert.equal((await api(foreign,'POST','/web3/qr/issue',body(a))).status,404);
 assert.equal((await api(company,'POST','/web3/qr/redeem',{token:'x',position:point()})).status,403);
 for(const patch of [{lifecycle:'approved'},{activePlacement:false},{workflow:false},{startDate:new Date(Date.now()+86400000)},{endDate:new Date(Date.now()-86400000)},{startDate:undefined}]){
  const invalid=await fixture(patch);const r=await api(company,'POST','/web3/qr/issue',body(invalid.a));assert.ok([404,409].includes(r.status),JSON.stringify(r));
 }
 const issued=await issue(a);assert.equal((await CoreQrSession.findById(issued.sessionId)).usedAt,null);
});
test('signature, JWT/session expiry, wrong student, and GPS rejects do not consume valid nonce',live,async()=>{
 const {student,a}=await fixture(),other=await actor('student'),issued=await issue(a);
 assert.equal((await redeem(other,issued.token)).status,403);
 for(const p of [{...point(),latitude:11},{...point(),accuracy:31},{...point(),timestamp:Date.now()-31000},{...point(),timestamp:Date.now()+6000},{...point(),latitude:91},{...point(),longitude:-181},{...point(),accuracy:0},{...point(),verified:true}])assert.equal((await redeem(student,issued.token,p)).status,400);
 const parts=issued.token.split('.');parts[2]=(parts[2][0]==='a'?'b':'a')+parts[2].slice(1);assert.equal((await redeem(student,parts.join('.'))).status,400);
 const jwt=require('jsonwebtoken'),claims=jwt.decode(issued.token);const expired=jwt.sign({...claims,exp:Math.floor(Date.now()/1000)-5},process.env.JWT_SECRET,{algorithm:'HS256'});assert.equal((await redeem(student,expired)).body.code,'INVALID_QR');
 const stale=await issue(a);await CoreQrSession.updateOne({_id:stale.sessionId},{$set:{expiresAt:new Date(Date.now()-1)}});assert.equal((await redeem(student,stale.token)).body.code,'INVALID_QR');
 assert.equal((await CoreQrSession.findById(issued.sessionId)).usedAt,null);assert.equal(await WorkSession.countDocuments({assignmentId:a._id}),0);
});
test('same nonce under concurrent requests writes at most once; checkout is pending and totals unchanged',live,async()=>{
 const {student,a}=await fixture(),issued=await issue(a),results=await Promise.all([redeem(student,issued.token),redeem(student,issued.token)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(await WorkSession.countDocuments({assignmentId:a._id}),1);
 const success=results.find(r=>r.status===200).body;assert.equal(success.chainStatus,'not_recorded');assert.equal(success.workSession.proof.verified,false);assert.equal(success.workSession.proof.gps.spoofResistant,false);assert.equal(success.txHash,undefined);
 assert.equal((await redeem(student,issued.token)).status,409);
 const duplicate=await issue(a);assert.equal((await redeem(student,duplicate.token)).status,409);
 const checkout=await issue(a,'checkout'),closed=await redeem(student,checkout.token);assert.equal(closed.status,200,JSON.stringify(closed.body));assert.equal(closed.body.workSession.state,'pending');assert.equal(closed.body.workSession.minutes,0);
 assert.equal((await redeem(student,checkout.token)).status,409);const missing=await issue(a,'checkout');assert.equal((await redeem(student,missing.token)).status,409);
 const totals=await api(student,'GET','/time/totals?group=batch');assert.equal(totals.status,200);assert.equal(totals.body.totalMinutes,0);
});
test('distinct QR nonces racing for same student still obey verified unique work-session indexes',live,async()=>{
 const {student,a}=await fixture(),one=await issue(a),two=await issue(a),results=await Promise.all([redeem(student,one.token),redeem(student,two.token)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(await WorkSession.countDocuments({assignmentId:a._id}),1);
});
test('checkout without checkin and cancelled placement redeem are rejected',live,async()=>{
 const {student,a}=await fixture(),checkout=await issue(a,'checkout');assert.equal((await redeem(student,checkout.token)).status,409);
 const issued=await issue(a);await Assignment.updateOne({_id:a._id},{$set:{lifecycle:'cancelled'}});assert.equal((await redeem(student,issued.token)).status,409);assert.equal((await CoreQrSession.findById(issued.sessionId)).usedAt,null);
});
test('GET attendance/status has no writes and unavailable AI/IPFS/blockchain does not block QR',live,async()=>{
 const {student,a}=await fixture(),fingerprint=async()=>{const out={};for(const name of ['core_qr_sessions','work_sessions','assignments','chain_operations'])out[name]=crypto.createHash('sha256').update(JSON.stringify(await mongoose.connection.db.collection(name).find().sort({_id:1}).toArray())).digest('hex');return out;};
 const before=await fingerprint();const status=await api(student,'GET','/web3/status');assert.equal(status.status,200);assert.equal(status.body.chain.available,false);
 assert.equal((await api(student,'GET','/time/sessions')).status,200);assert.deepEqual(await fingerprint(),before);
 const issued=await issue(a);assert.equal((await redeem(student,issued.token)).status,200);assert.equal(await ChainOperation.countDocuments({assignmentId:a._id}),0);
});

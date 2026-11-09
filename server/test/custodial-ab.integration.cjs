// Explicit manual test only. One persisted wallet, no blockchain, no deletes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {MongoClient,ObjectId,BSON}=require('mongodb'),{computeAddress,hexlify}=require('ethers');
const {loadVault}=require('../src/services/custodialVault'),{createStore,DATABASE,URI,COLLECTION}=require('../src/services/custodialTestStore');
const out=path.resolve('contracts/node_modules/.cache/custodial-ab-20261109');
const evidence=path.resolve('audit-reports/CUSTODIAL_AB_20261109');fs.mkdirSync(evidence,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{let vault;const client=new MongoClient(URI,{maxPoolSize:3,serverSelectionTimeoutMS:5000}),result={status:'BLOCKED',checks:[],database:DATABASE,blockchainCalls:0};try{
 const backup=JSON.parse(fs.readFileSync(path.join(out,'preflight-result.json')));assert.equal(backup.verified,true);assert.ok(fs.existsSync(path.join(backup.directory,'manifest.json')));
 vault=loadVault();await client.connect();assert.equal((await client.db('admin').command({hello:1})).setName,'internovaTestRs');
 assert.ok(!(await client.db('admin').admin().listDatabases()).databases.some(d=>d.name===DATABASE),'Dedicated database already exists; inspect checkpoint, do not overwrite');
 const env={NODE_ENV:'test',CUSTODIAL_LOCAL_TEST_ENABLED:'true',CUSTODIAL_TEST_URI:URI,CUSTODIAL_TEST_URI_ALLOWLIST:URI},db=client.db(DATABASE);
 // Source dataset was backed up; this destination is proven absent before fixtures.
 fs.writeFileSync(path.join(out,'test-db-absent-baseline.json'),JSON.stringify({database:DATABASE,absent:true,at:new Date()}),{flag:'wx'});
 await db.collection('qa_safety_marker').insertOne({_id:'custodial-ab-v1',synthetic:true,scope:'custodial-ab-only'});
 const admin=new ObjectId(),user=new ObjectId(),student=new ObjectId();
 await db.collection('users').insertMany([{_id:admin,role:'admin',name:'Custodial TEST Operator',synthetic:true},{_id:user,role:'student',name:'Custodial TEST Student',synthetic:true}]);
 await db.collection('students').insertOne({_id:student,userId:user,fullName:'Custodial TEST Student',studentCode:'CUSTODY-TEST-ONLY',synthetic:true});
 const before=[];for(const name of ['qa_safety_marker','users','students']){const bytes=Buffer.concat((await db.collection(name).find().sort({_id:1}).toArray()).map(d=>BSON.serialize(d)));const file=path.join(out,'fixture-'+name+'.bson.gz');fs.writeFileSync(file,zlib.gzipSync(bytes),{flag:'wx'});assert.equal(sha(zlib.gunzipSync(fs.readFileSync(file))),sha(bytes));before.push({name,sha256:sha(bytes)});}
 result.checks.push('Dedicated DB absent verified; TEST fixtures BSON backup read/hash verified before wallet writes');
 const actor={role:'admin',userId:String(admin)},store=createStore({db,vault,env});await store.initialize(actor);
 for(const role of ['student','company','mentor'])await assert.rejects(()=>store.provision({role,userId:String(admin)},String(user)),{code:'CUSTODY_FORBIDDEN'});
 await assert.rejects(()=>store.provision({role:'admin',userId:String(new ObjectId())},String(user)),{code:'CUSTODY_FORBIDDEN'});
 const blocked=createStore({db,vault,env:{...env,NODE_ENV:'production'}});await assert.rejects(()=>blocked.provision(actor,String(user)),{code:'CUSTODY_TEST_ONLY'});
 result.checks.push('Student/Company/Mentor and nonexistent Admin rejected; production guard rejected');
 const all=await Promise.all(Array.from({length:12},()=>store.provision(actor,String(user))));assert.equal(new Set(all.map(r=>r.address)).size,1);assert.equal(await db.collection(COLLECTION).countDocuments({}),1);
 const again=await store.provision(actor,String(user));assert.equal(again.address,all[0].address);assert.equal(Object.hasOwn(again,'envelope'),false);assert.equal(Object.hasOwn(again,'privateKey'),false);
 result.checks.push('12 concurrent provisions + retry: one persisted recipient, one address; returned DTO contains no envelope/private key');
 const row=await db.collection(COLLECTION).findOne({userId:user}),binding={userId:String(user),studentId:String(student),chainId:31337};
 const packed=zlib.gzipSync(BSON.serialize(row));fs.writeFileSync(path.join(out,'recipient-encrypted.bson.gz'),packed,{flag:'wx'});const restored=BSON.deserialize(zlib.gunzipSync(fs.readFileSync(path.join(out,'recipient-encrypted.bson.gz'))));
 const bytes=vault.decrypt(restored.envelope,binding);try{assert.equal(computeAddress(hexlify(bytes)).toLowerCase(),row.address);}finally{bytes.fill(0);}
 vault.close();vault=loadVault();const recovered=vault.decrypt(restored.envelope,binding);try{assert.equal(computeAddress(hexlify(recovered)).toLowerCase(),row.address);}finally{recovered.fill(0);}
 result.checks.push('Encrypted BSON backup restored in memory and decrypted with reopened real TEST keyring; address matches, no plaintext logged');
 // Same-key rotation is a no-op, and does not create or change the recipient.
 assert.equal((await createStore({db,vault,env}).rotate(actor,String(user))).address,row.address);
 // Legacy record guard: fixture only; preserve the resulting fixture for inspection.
 await db.collection('assignments').insertOne({studentUserId:user,synthetic:true,reason:'legacy-guard-negative-test'});
 await assert.rejects(()=>store.provision(actor,String(user)),{code:'CUSTODY_LEGACY_REVIEW_REQUIRED'});
 assert.equal(await db.collection(COLLECTION).countDocuments({}),1);
 for(const b of before){const bytes=Buffer.concat((await db.collection(b.name).find().sort({_id:1}).toArray()).map(d=>BSON.serialize(d)));assert.equal(sha(bytes),b.sha256);}
 result.checks.push('Legacy assignment blocks provision; original TEST User/Student/marker fixtures unchanged; no-op rotation preserves recipient');
 result.fixtureCounts={users:2,students:1,assignments:1,recipients:1,marker:1};result.keyId=vault.activeKeyId;result.keyVersion=vault.activeVersion;result.status='PASS';
 }catch(e){result.error=e.code||e.message;process.exitCode=1;}finally{vault?.close();await client.close();fs.writeFileSync(path.join(evidence,'integration-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));require('../../scripts/demo/custodial-checkpoint.cjs')(4,result.status,`Isolated TEST ${DATABASE}: ${result.checks.join('; ')}. ${result.error||''} Blockchain calls=0. One persisted wallet maximum. Evidence audit-reports/CUSTODIAL_AB_20261109/integration-result.json.`,'STEP 5: preservation comparison, final A/B report; stop before C/D.');}})();

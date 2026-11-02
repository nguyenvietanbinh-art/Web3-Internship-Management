process.env.CORE_BUSINESS_ENABLED='true';process.env.WEB3_LOCAL_ENABLED='true';
process.env.WEB3_LOCAL_DEPLOYMENT=process.env.WEB3_TEST_DEPLOYMENT;
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,placement,h}=require('./coreFixtures'),{WorkSession,Report}=require('../src/models/BusinessModels'),Assignment=require('../src/models/Assignment');
const {CoreQrSession,ChainOperation,PrivateReportArtifact}=require('../src/models/Web3Models');const chain=require('../src/services/localWeb3'),mongoose=require('mongoose');
const live={skip:process.env.WEB3_INTEGRATION_TESTS!=='true'};
let f,a,token,work,report,reportOp,mintOp;
const position=()=>({latitude:10.8,longitude:106.7,accuracy:10,timestamp:Date.now()});
const qrBody=action=>({assignmentId:String(a._id),action,centerLat:10.8,centerLon:106.7,radiusMeters:100,maxAccuracyMeters:30,ttlSeconds:120});
async function issue(action){const r=await h.api('POST','/core/web3/qr/issue',{token:f.company.token,body:qrBody(action)});assert.equal(r.status,201,JSON.stringify(r.body));return r.body;}
async function snapshot(){const out={};for(const c of await mongoose.connection.db.listCollections().toArray())if(c.name!=='auth_nonces')out[c.name]=crypto.createHash('sha256').update(JSON.stringify(await mongoose.connection.db.collection(c.name).find().sort({_id:1}).toArray())).digest('hex');return out;}
before(async()=>{if(live.skip)return;assert.ok(process.env.WEB3_LOCAL_DEPLOYMENT);f=await setup();a=(await placement(f)).doc;});after(async()=>{if(!live.skip)await h.stop();});
test('Web3 status/readiness GET is read-only and QR/chain writes require role/scope',live,async()=>{
 const before=await snapshot(),r=await h.api('GET','/core/web3/status',{token:f.student.token});assert.equal(r.status,200);assert.equal(r.body.chain.available,true);assert.equal(r.body.chain.chainId,31337);assert.equal(r.body.ipfs.pinata,false);assert.deepEqual(await snapshot(),before);
 assert.equal((await h.api('POST','/core/web3/qr/issue',{token:f.student.token,body:qrBody('checkin')})).status,403);
 assert.equal((await h.api('POST','/core/web3/qr/issue',{token:f.foreignCompany.token,body:qrBody('checkin')})).status,404);
 assert.equal((await h.api('POST','/core/web3/placements/'+a._id+'/mint',{token:f.company.token,body:{}})).status,403);
 assert.equal((await h.api('POST','/core/web3/placements/'+a._id+'/mint',{token:f.admin.token,body:{}})).status,409);
});
test('QR scope/signature/expiry and GPS invalid/stale/accuracy do not consume valid session',live,async()=>{
 const issued=await issue('checkin');token=issued.token;
 assert.equal((await h.api('POST','/core/web3/qr/redeem',{token:f.foreignStudent.token,body:{token,position:position()}})).status,403);
 for(const p of [{...position(),latitude:11},{...position(),accuracy:31},{...position(),timestamp:Date.now()-40000}])assert.equal((await h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body:{token,position:p}})).status,400);
 assert.equal((await CoreQrSession.findById(issued.sessionId)).usedAt,null);assert.equal(await WorkSession.countDocuments(),0);
 const expired=await issue('checkin');await CoreQrSession.updateOne({_id:expired.sessionId},{$set:{expiresAt:new Date(Date.now()-1)}});
 assert.equal((await h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body:{token:expired.token,position:position()}})).status,400);
 const parts=token.split('.');parts[2]=(parts[2][0]==='a'?'b':'a')+parts[2].slice(1);assert.equal((await h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body:{token:parts.join('.'),position:position()}})).status,400);
});
test('actual QR check-in is one-use under concurrency and integrates canonical WorkSession',live,async()=>{
 const body={token,position:position()},results=await Promise.all([h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body}),h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 work=await WorkSession.findOne({studentWallet:f.student.address});assert.equal(await WorkSession.countDocuments(),1);assert.equal(work.proof.provider,'qr-gps-client');assert.equal(work.proof.verified,false);assert.equal(work.proof.gps.spoofResistant,false);assert.ok(work.proof.checks.qrSignature);
 assert.equal((await h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body})).status,409);
});
test('QR checkout preserves real zero-minute duration, company explicitly adjusts/approves TEST hours',live,async()=>{
 const checkout=await issue('checkout'),r=await h.api('POST','/core/web3/qr/redeem',{token:f.student.token,body:{token:checkout.token,position:position()}});assert.equal(r.status,200,JSON.stringify(r.body));work=await WorkSession.findById(work._id);assert.equal(work.minutes,0);assert.equal(work.state,'pending');assert.equal(work.proof.checkoutSessionId,String(checkout.sessionId));
 const end=new Date(),start=new Date(end-55*60000);let adjusted=await h.api('PATCH','/core/time/'+work._id+'/review',{token:f.company.token,body:{decision:'adjust',reason:'Explicit SYNTHETIC TEST human correction',checkInAt:start.toISOString(),checkOutAt:end.toISOString(),version:work.__v}});assert.equal(adjusted.status,200,JSON.stringify(adjusted.body));
 const approved=await h.api('PATCH','/core/time/'+work._id+'/review',{token:f.company.token,body:{decision:'approved',reason:'TEST approves corrected hours',version:adjusted.body.__v}});assert.equal(approved.status,200);work=await WorkSession.findById(work._id);assert.equal(work.minutes,55);assert.equal(work.state,'approved');
});
test('IPFS missing configuration blocks upload with no artifact or business write',live,async()=>{
 // Approved report/placement are explicit TEST fixtures here; browser suite exercises actual business approval UI.
 const kpis=a.kpis.map(k=>({...k,status:'approved',score:80}));a=await Assignment.findByIdAndUpdate(a._id,{$set:{lifecycle:'completed',kpis,kpiScore:80}},{new:true,runValidators:true});
 report=await Report.create({assignmentId:a._id,studentWallet:a.studentWallet,companyWallet:a.companyWallet,mentorWallet:a.mentorWallet,kind:'final',version:1,current:true,title:'SYNTHETIC approved report fixture',content:'SYNTHETIC TEST report. No real personal data.',state:'approved',finalScore:85});
 const before=await snapshot(),r=await h.api('POST','/core/web3/reports/'+report._id+'/ipfs',{token:f.student.token,body:{confirmEncryptedUpload:true}});assert.equal(r.status,503);assert.equal(await PrivateReportArtifact.countDocuments(),0);assert.deepEqual(await snapshot(),before);
});
test('real pending transaction retains actual hash and explicit reconcile confirms after mining',{...live,timeout:20000},async()=>{
 const c=await chain.context();try{
  await c.provider.send('evm_setAutomine',[false]);const r=await h.api('POST','/core/web3/reports/'+report._id+'/anchor',{token:f.student.token,body:{}});assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(r.body.code,'CHAIN_PENDING');
  reportOp=await ChainOperation.findOne({targetId:report._id,kind:'report'});assert.equal(reportOp.state,'submitted');assert.match(reportOp.txHash,/^0x[a-f0-9]{64}$/);assert.equal(await c.provider.getTransactionReceipt(reportOp.txHash),null);
  await c.provider.send('evm_mine',[]);const recovered=await h.api('POST','/core/web3/operations/'+reportOp._id+'/reconcile',{token:f.student.token,body:{}});assert.equal(recovered.status,200,JSON.stringify(recovered.body));assert.equal(recovered.body.state,'confirmed');reportOp=await ChainOperation.findById(reportOp._id);
 }finally{await c.provider.send('evm_setAutomine',[true]);c.provider.destroy();}
});
test('actual report/attendance receipts match calldata, events and state; repeat anchor sends no tx',live,async()=>{
 const c=await chain.context();try{const nonce=await c.provider.getTransactionCount(c.d.deployer);const repeat=await h.api('POST','/core/web3/reports/'+report._id+'/anchor',{token:f.student.token,body:{}});assert.equal(repeat.status,200);assert.equal(repeat.body.txHash,reportOp.txHash);assert.equal(await c.provider.getTransactionCount(c.d.deployer),nonce);
 const attendance=await h.api('POST','/core/web3/time/'+work._id+'/anchor',{token:f.company.token,body:{}});assert.equal(attendance.status,200,JSON.stringify(attendance.body));assert.equal(attendance.body.state,'confirmed');const receipt=await c.provider.getTransactionReceipt(attendance.body.txHash);assert.equal(receipt.status,1);assert.equal(receipt.to.toLowerCase(),c.d.address.toLowerCase());}finally{c.provider.destroy();}
});
test('school completion and mint produce a real ERC721/ERC5192 token with live verification',live,async()=>{
 const version=work.__v;await WorkSession.updateOne({_id:work._id},{$inc:{__v:1}});const stale=await h.api('POST','/core/web3/placements/'+a._id+'/complete',{token:f.admin.token,body:{}});assert.equal(stale.status,409);await WorkSession.updateOne({_id:work._id},{$set:{__v:version}});
 let r=await h.api('POST','/core/web3/placements/'+a._id+'/complete',{token:f.admin.token,body:{}});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.state,'confirmed');r=await h.api('POST','/core/web3/placements/'+a._id+'/mint',{token:f.admin.token,body:{}});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.kind,'mint');mintOp=await ChainOperation.findById(r.body.id);assert.ok(mintOp.tokenId);
 const before=await snapshot(),certificate=await h.api('GET','/core/web3/placements/'+a._id+'/certificate',{token:f.student.token});assert.equal(certificate.status,200,JSON.stringify(certificate.body));assert.equal(certificate.body.verified,true);assert.equal(certificate.body.locked,true);assert.equal(certificate.body.owner,f.student.address);assert.equal(certificate.body.txHash,mintOp.txHash);assert.deepEqual(await snapshot(),before);
});
test('duplicate mint is idempotent, no extra token/transaction; foreign and absent certificates denied',live,async()=>{
 const c=await chain.context();try{const nonce=await c.provider.getTransactionCount(c.d.deployer),r=await h.api('POST','/core/web3/placements/'+a._id+'/mint',{token:f.admin.token,body:{}});assert.equal(r.status,200);assert.equal(r.body.txHash,mintOp.txHash);assert.equal(await c.provider.getTransactionCount(c.d.deployer),nonce);assert.equal((await h.api('GET','/core/web3/placements/'+a._id+'/certificate',{token:f.foreignStudent.token})).status,404);assert.equal((await h.api('GET','/core/web3/placements/000000000000000000000001/certificate',{token:f.admin.token})).status,404);}finally{c.provider.destroy();}
});
test('lost DB confirmation/hash reconciles from actual event without duplicate mint',live,async()=>{
 const c=await chain.context();try{const nonce=await c.provider.getTransactionCount(c.d.deployer);await ChainOperation.updateOne({_id:mintOp._id},{$set:{state:'submitted'},$unset:{txHash:1,tokenId:1,blockHash:1,blockNumber:1}});const r=await h.api('POST','/core/web3/operations/'+mintOp._id+'/reconcile',{token:f.admin.token,body:{}});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.txHash,mintOp.txHash);assert.equal(r.body.tokenId,mintOp.tokenId);assert.equal(await c.provider.getTransactionCount(c.d.deployer),nonce);}finally{c.provider.destroy();}
});
test('DB commitment mismatch never returns VERIFIED and live state can be restored in TEST',live,async()=>{
 const original=mintOp.digest;try{await ChainOperation.updateOne({_id:mintOp._id},{$set:{digest:'0x'+'0'.repeat(64)}});const r=await h.api('GET','/core/web3/placements/'+a._id+'/certificate',{token:f.student.token});assert.equal(r.status,409);assert.ok(!r.body.verified);}finally{await ChainOperation.updateOne({_id:mintOp._id},{$set:{digest:original}});}
});
test('wrong chain/deployment/instance or missing RPC config fail closed, no certificate fallback',live,async()=>{
 const original=process.env.WEB3_LOCAL_DEPLOYMENT,d=JSON.parse(fs.readFileSync(original));try{for(const patch of [{chainId:1},{runtimeCodeHash:'0x'+'0'.repeat(64)},{hardhatInstanceId:'wrong-instance'}]){const file=path.join(path.dirname(original),'NEGATIVE_METADATA_'+crypto.randomBytes(4).toString('hex')+'.json');fs.writeFileSync(file,JSON.stringify({...d,...patch}),{flag:'wx'});process.env.WEB3_LOCAL_DEPLOYMENT=file;const r=await h.api('GET','/core/web3/placements/'+a._id+'/certificate',{token:f.student.token});assert.equal(r.status,503);assert.ok(!r.body.verified);}}finally{process.env.WEB3_LOCAL_DEPLOYMENT=original;}
});
test('all Web3 GET views preserve business collection fingerprints',live,async()=>{const before=await snapshot();for(const route of ['/core/web3/status','/core/web3/placements/'+a._id+'/operations','/core/web3/placements/'+a._id+'/certificate','/core/web3/reports/'+report._id+'/artifacts'])assert.equal((await h.api('GET',route,{token:f.student.token})).status,200);assert.deepEqual(await snapshot(),before);});

// Verifier is injected ONLY into an exact-allowlisted TEST app. These are NOT Google E2E tests.
process.env.GOOGLE_AUTH_ENABLED='true';
process.env.GOOGLE_CLIENT_ID='test-internal.apps.googleusercontent.com';
process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers'),User=require('../src/models/User'),Challenge=require('../src/models/IdentityChallenge');
const {Wallet}=require('ethers'),{validateClaims,verifyGoogle}=require('../src/services/googleIdentity');
const {signToken}=require('../src/services/authService'),jwt=require('jsonwebtoken'),config=require('../src/config/env');
const origin='http://127.0.0.1:5175';
let cookie='',student;
before(async()=>{await h.start({googleVerifier:async(credential,nonce)=>validateClaims(JSON.parse(credential),nonce,config.googleClientId)});});
after(h.stop);
async function api(path,body,token,options={}){
 const r=await fetch(h.baseURL+'/auth'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie,...(token?{Authorization:'Bearer '+token}:{}),...options.headers},body:body===undefined?undefined:JSON.stringify(body)});
 if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
 return{status:r.status,body:await r.json(),headers:r.headers};
}
async function challenge(purpose='login',token,walletAddress){const r=await api('/google/challenge',{purpose,...(walletAddress?{walletAddress}:{})},token);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
function claims(c,sub='TEST_student',overrides={}){const now=Math.floor(Date.now()/1000);return JSON.stringify({iss:'https://accounts.google.com',aud:config.googleClientId,iat:now,exp:now+300,sub,email:sub+'@example.invalid',email_verified:true,nonce:c.nonce,name:'TEST '+sub,...overrides});}
async function login(sub,extra={}){const c=await challenge();return api('/google/login',{challengeId:c.challengeId,credential:claims(c,sub),...extra});}
test('missing Google configuration reports BLOCKED without writes',async()=>{
 const count=await Challenge.countDocuments();process.env.GOOGLE_AUTH_ENABLED='false';
 assert.equal((await api('/google/status')).body.enabled,false);
 assert.equal((await api('/google/challenge',{})).status,503);assert.equal(await Challenge.countDocuments(),count);
 process.env.GOOGLE_AUTH_ENABLED='true';
});
test('legacy wallet index prevents Google writes until approved index preparation',async()=>{
 const original=User.collection.indexes,count=await Challenge.countDocuments();
 User.collection.indexes=async()=>[{key:{walletAddress:1},unique:true}];
 try{const r=await api('/google/challenge',{});assert.equal(r.status,503);assert.equal(r.body.code,'IDENTITY_INDEX_REVIEW_REQUIRED');assert.equal(await Challenge.countDocuments(),count);}finally{User.collection.indexes=original;}
});
test('first and repeated Google login: real Mongo/JWT, no wallet/password fabrication, no duplicate',async()=>{
 const r=await login('TEST_student');assert.equal(r.status,200);student=r.body;
 assert.equal(student.user.role,'student');assert.equal(student.user.walletAddress,null);assert.equal(student.user.googleLinked,true);
 assert.equal((await h.api('GET','/auth/me',{token:student.token})).status,200);
 const r2=await login('TEST_student');assert.equal(r2.body.user._id,student.user._id);assert.equal(await User.countDocuments({googleSubject:'TEST_student'}),1);
 const second=await login('TEST_second');assert.equal(second.status,200);assert.equal(second.body.user.walletAddress,null);
 const raw=await User.findById(student.user._id).select('+googleSubject +googleEmail +identityHistory').lean();assert.equal(raw.walletAddress,undefined);assert.equal(raw.password,undefined);assert.equal(raw.googleSubject,'TEST_student');assert.equal(raw.identityHistory.length,2);
});
test('claims rejection: issuer/audience/azp/expiry/future iat/subject/email verification/nonce',async()=>{
 for(const patch of [{iss:'https://evil.invalid'},{aud:'other'},{azp:'other'},{exp:1},{iat:Math.floor(Date.now()/1000)+600},{sub:''},{email_verified:false},{email_verified:'true'},{email:'bad'},{nonce:'wrong'}]){
  const c=await challenge(),count=await User.countDocuments();const r=await api('/google/login',{challengeId:c.challengeId,credential:claims(c,'TEST_negative',patch)});
  assert.equal(r.status,401,JSON.stringify(patch));assert.equal(await User.countDocuments(),count);assert.equal((await Challenge.findById(c.challengeId)).usedAt,undefined);
 }
});
test('Google email changes follow stable subject without overwriting profile or falsely verifying old email',async()=>{
 const before=await User.findOne({googleSubject:'TEST_second'}),c=await challenge();
 const r=await api('/google/login',{challengeId:c.challengeId,credential:claims(c,'TEST_second',{email:'changed-google@example.invalid'})});
 assert.equal(r.status,200);assert.equal(r.body.user._id,String(before._id));assert.equal(r.body.user.email,before.email);assert.equal(r.body.user.emailVerified,false);
 const saved=await User.findById(before._id).select('+googleEmail');assert.equal(saved.googleEmail,'changed-google@example.invalid');assert.equal(await User.countDocuments({googleSubject:'TEST_second'}),1);
});
test('production verifier refuses malformed unsigned input, never uses TEST injection',async()=>{
 await assert.rejects(()=>verifyGoogle('not.a.valid.token','nonce'),e=>e.status===401);
});
test('browser-bound challenge, Origin, expiration, purpose and replay protection',async()=>{
 const c=await challenge();const body={challengeId:c.challengeId,credential:claims(c,'TEST_csrf')};
 assert.equal((await api('/google/login',body,undefined,{headers:{Cookie:''}})).status,401);
 assert.equal((await api('/google/login',body,undefined,{headers:{Origin:'https://evil.invalid'}})).status,403);
 assert.equal((await api('/google/login',body,undefined,{headers:{Origin:''}})).status,403);
 assert.equal((await api('/google/login',body)).status,200);assert.equal((await api('/google/login',body)).status,401);
 const expired=await challenge();await Challenge.updateOne({_id:expired.challengeId},{$set:{expiresAt:new Date(1)}});
 assert.equal((await api('/google/login',{challengeId:expired.challengeId,credential:claims(expired,'TEST_expired')})).status,401);
});
test('concurrent nonce consumption permits one login and one User only',async()=>{
 const c=await challenge(),body={challengeId:c.challengeId,credential:claims(c,'TEST_concurrent')};
 const results=await Promise.all([api('/google/login',body),api('/google/login',body)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,401]);assert.equal(await User.countDocuments({googleSubject:'TEST_concurrent'}),1);
});
test('concurrent distinct challenges for one subject do not create duplicate accounts',async()=>{
 const a=await challenge(),b=await challenge();
 const results=await Promise.all([api('/google/login',{challengeId:a.challengeId,credential:claims(a,'TEST_distinct_race')}),api('/google/login',{challengeId:b.challengeId,credential:claims(b,'TEST_distinct_race')})]);
 assert.ok(results.every(r=>[200,409].includes(r.status)));assert.ok(results.some(r=>r.status===200));assert.equal(await User.countDocuments({googleSubject:'TEST_distinct_race'}),1);
});
test('public registration cannot grant company/mentor/admin; matching profile email never auto-links',async()=>{
 for(const role of ['company','mentor','admin'])assert.equal((await login('TEST_privilege_'+role,{role})).status,400);
 const wallet=await h.loginAs('student','TEST existing email');await User.updateOne({_id:wallet.user._id},{$set:{email:'test_collision@example.invalid'}});
 const r=await login('TEST_collision');assert.equal(r.status,409);assert.equal(r.body.code,'ACCOUNT_LINK_REQUIRED');assert.equal(await User.countDocuments({googleSubject:'TEST_collision'}),0);
});
test('Google-only session can edit own profile, cannot access wallet-scoped APIs or elevate role',async()=>{
 const profile=await h.api('GET','/core/profile',{token:student.token});assert.equal(profile.status,200);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{name:'TEST updated Google',version:profile.body.__v}})).status,200);
 for(const url of ['/core/dashboard','/core/cv','/topics','/core/accounts'])assert.equal((await h.api('GET',url,{token:student.token})).body.code,'WALLET_LINK_REQUIRED');
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{role:'admin',version:1}})).status,400);
 const expired=jwt.sign({sub:student.user._id,wallet:null,authProvider:'google'},config.jwtSecret,{expiresIn:-1});assert.equal((await h.api('GET','/auth/me',{token:expired})).status,401);
});
let linked;
test('link Google requires fresh wallet signature and Google proof; all provisioned roles preserved',async()=>{
 for(const role of ['student','company','mentor','admin']){
  const wallet=Wallet.createRandom();if(['mentor','admin'].includes(role))await User.create({walletAddress:wallet.address,name:'TEST '+role,role});
  const actor=await h.loginAs(role,'TEST '+role,wallet),c=await challenge('link-google',actor.token);
  const body={challengeId:c.challengeId,credential:claims(c,'TEST_role_'+role),signature:await Wallet.createRandom().signMessage(c.message)};
  assert.equal((await api('/google/link',body,actor.token)).status,401);
  body.signature=await wallet.signMessage(c.message);const r=await api('/google/link',body,actor.token);assert.equal(r.status,200);assert.equal(r.body.user.role,role);
  const g=await login('TEST_role_'+role,{role:'admin'});assert.equal(g.status,200);assert.equal(g.body.user.role,role);
  const accounts=await h.api('GET','/core/accounts',{token:g.body.token});assert.equal(accounts.status,role==='admin'?200:403);
  if(role==='student')linked={wallet,actor,google:g.body};
 }
});
test('Google sub cannot link to another wallet account; challenge bound to authenticated User',async()=>{
 const other=await h.loginAs('student','TEST other'),c=await challenge('link-google',other.token);
 const body={challengeId:c.challengeId,credential:claims(c,'TEST_role_student'),signature:await other.wallet.signMessage(c.message)};
 assert.equal((await api('/google/link',body,linked.actor.token)).status,401);
 assert.equal((await api('/google/link',body,other.token)).status,409);
 assert.equal(await User.countDocuments({googleSubject:'TEST_role_student'}),1);
});
test('last provider cannot unlink; wallet linking rejects theft and requires matching fresh Google identity',async()=>{
 let c=await challenge('unlink-google',student.token);assert.equal((await api('/google/unlink',{challengeId:c.challengeId,credential:claims(c)},student.token)).body.code,'LAST_AUTH_PROVIDER');
 c=await challenge('link-wallet',student.token,linked.wallet.address);const body={challengeId:c.challengeId,credential:claims(c),signature:await linked.wallet.signMessage(c.message)};
 assert.equal((await api('/wallet/link',body,student.token)).status,409);
 const wallet=Wallet.createRandom();c=await challenge('link-wallet',student.token,wallet.address);
 assert.equal((await api('/wallet/link',{challengeId:c.challengeId,credential:claims(c,'TEST_second'),signature:await wallet.signMessage(c.message)},student.token)).status,401);
 const r=await api('/wallet/link',{challengeId:c.challengeId,credential:claims(c),signature:await wallet.signMessage(c.message)},student.token);assert.equal(r.status,200);assert.equal(r.body.user.walletAddress,wallet.address.toLowerCase());
 assert.equal((await h.api('GET','/auth/me',{token:student.token})).status,401);student=r.body;
 assert.equal((await h.api('GET','/core/cv',{token:student.token})).status,200);
 assert.equal((await h.loginAs('student','TEST old wallet API',wallet)).res.status,200);
 assert.equal((await api('/google/challenge',{purpose:'link-wallet',walletAddress:Wallet.createRandom().address},student.token)).status,409);
});
test('unlink with both proofs retains wallet login and invalidates Google-issued session',async()=>{
 const c=await challenge('unlink-google',linked.google.token),body={challengeId:c.challengeId,credential:claims(c,'TEST_role_student'),signature:await linked.wallet.signMessage(c.message)};
 const r=await api('/google/unlink',body,linked.google.token);assert.equal(r.status,200);assert.equal(r.body.user.googleLinked,false);
 assert.equal((await h.api('GET','/auth/me',{token:linked.google.token})).status,401);assert.equal((await h.api('GET','/auth/me',{token:r.body.token})).status,200);
});
test('disabled accounts reject Google login and existing JWT, read endpoints do not write or expose identities',async()=>{
 await User.updateOne({_id:student.user._id},{$set:{disabled:true}});assert.equal((await login('TEST_student')).status,403);assert.equal((await h.api('GET','/auth/me',{token:student.token})).status,401);
 const actor=await h.loginAs('student','TEST read safety'),before=JSON.stringify(await User.find().select('+googleSubject +googleEmail +identityHistory +auditHistory').sort({_id:1}).lean());
 const me=await h.api('GET','/auth/me',{token:actor.token});assert.equal(me.body.user.googleSubject,undefined);assert.equal(me.body.user.identityHistory,undefined);
 await api('/identities',undefined,actor.token);await api('/google/status');
 assert.equal(JSON.stringify(await User.find().select('+googleSubject +googleEmail +identityHistory +auditHistory').sort({_id:1}).lean()),before);
 // Legacy JWT issued before this change has no authProvider and must still work.
 const legacy=jwt.sign({sub:actor.user._id,wallet:actor.address,role:'admin'},config.jwtSecret,{expiresIn:'5m'});assert.equal((await h.api('GET','/auth/me',{token:legacy})).body.user.role,'student');
});

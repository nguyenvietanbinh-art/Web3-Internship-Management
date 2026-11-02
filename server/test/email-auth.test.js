process.env.EMAIL_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),bcrypt=require('bcryptjs');
const h=require('./helpers'),User=require('../src/models/User'),Challenge=require('../src/models/IdentityChallenge'),{Wallet}=require('ethers');
const plain='TEST-only-password-2026',next='TEST-new-password-2026';let actor,second,cookie='';
before(h.start);after(h.stop);
async function api(path,body,token,headers={}){const r=await fetch(h.baseURL+'/auth/email/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5175',Cookie:cookie,...(token?{Authorization:'Bearer '+token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return{status:r.status,body:await r.json()};}
const registration=email=>({name:'TEST email student',email,password:plain,confirmPassword:plain});
test('register real email/password user, hash only, no Google/wallet fabrication',async()=>{
 const r=await api('register',registration('TEST.Email@Gmail.com'));assert.equal(r.status,201);actor=r.body;
 const u=await User.findById(actor.user._id).select('+passwordHash +loginEmail');assert.equal(u.loginEmail,'test.email@gmail.com');assert.ok(await bcrypt.compare(plain,u.passwordHash));assert.notEqual(u.passwordHash,plain);assert.equal(u.walletAddress,undefined);assert.equal(u.googleSubject,undefined);
 assert.equal(r.body.user.role,'student');assert.equal(r.body.user.emailVerified,false);assert.equal(r.body.user.passwordHash,undefined);
 const me=await h.api('GET','/auth/me',{token:actor.token});assert.equal(me.status,200);assert.equal(me.body.user.passwordEnabled,true);assert.equal(me.body.user.passwordHash,undefined);assert.equal(me.body.user.loginEmail,undefined);
 const other=await api('register',registration('second@example.invalid'));assert.equal(other.status,201);second=other.body;
});
test('duplicate/case collision and concurrent registration cannot create multiple accounts',async()=>{
 assert.equal((await api('register',registration('test.email@gmail.com'))).status,409);
 const results=await Promise.all([api('register',registration('race@example.invalid')),api('register',registration('race@example.invalid'))]);assert.deepEqual(results.map(x=>x.status).sort(),[201,409]);assert.equal(await User.countDocuments({loginEmail:'race@example.invalid'}),1);
});
test('reject privilege injection, malformed email, password mismatch and bcrypt truncation',async()=>{
 for(const body of [{...registration('role@example.invalid'),role:'admin'},{...registration('role@example.invalid'),role:'company'},{...registration('bad')},{...registration('short@example.invalid'),password:'123',confirmPassword:'123'},{...registration('mismatch@example.invalid'),confirmPassword:'different'},{...registration('long@example.invalid'),password:'x'.repeat(73),confirmPassword:'x'.repeat(73)},{...registration('unicode@example.invalid'),password:'ệ'.repeat(30),confirmPassword:'ệ'.repeat(30)}])assert.equal((await api('register',body)).status,400);
});
test('login normalized email, wrong/unknown password errors generic, no auto-merge existing wallet email',async()=>{
 assert.equal((await api('login',{email:' TEST.EMAIL@GMAIL.COM ',password:plain})).status,200);
 const a=await api('login',{email:'test.email@gmail.com',password:'incorrect-password'}),b=await api('login',{email:'unknown@example.invalid',password:'incorrect-password'});assert.equal(a.status,401);assert.deepEqual(a.body,b.body);
 const old=await h.loginAs('student','TEST wallet');await User.updateOne({_id:old.user._id},{$set:{email:'collision@example.invalid'}});assert.equal((await api('register',registration('collision@example.invalid'))).status,409);
});
test('password accounts cannot access wallet scope; profile email edits do not change login identifier',async()=>{
 assert.equal((await h.api('GET','/core/cv',{token:actor.token})).body.code,'WALLET_LINK_REQUIRED');
 const p=(await h.api('GET','/core/profile',{token:actor.token})).body;
 assert.equal(p.authentication,'password');
 assert.equal((await h.api('PATCH','/core/profile',{token:actor.token,body:{email:'edited@example.invalid',version:p.__v}})).status,200);
 assert.equal((await api('login',{email:'edited@example.invalid',password:plain})).status,401);assert.equal((await api('login',{email:'test.email@gmail.com',password:plain})).status,200);
});
test('password change verifies old password, revokes prior JWT and accepts only new password',async()=>{
 assert.equal((await api('change-password',{currentPassword:'incorrect-password',newPassword:next,confirmPassword:next},actor.token)).status,401);
 const r=await api('change-password',{currentPassword:plain,newPassword:next,confirmPassword:next},actor.token);assert.equal(r.status,200);
 assert.equal((await h.api('GET','/auth/me',{token:actor.token})).status,401);actor=r.body;
 assert.equal((await api('login',{email:'test.email@gmail.com',password:plain})).status,401);assert.equal((await api('login',{email:'test.email@gmail.com',password:next})).status,200);
});
test('password/wallet linking requires owner reauthentication, browser binding and signature; no replay/theft',async()=>{
 const wallet=Wallet.createRandom();let c=await api('wallet-challenge',{password:next,walletAddress:wallet.address},actor.token);assert.equal(c.status,200);
 const body={password:next,challengeId:c.body.challengeId,signature:await wallet.signMessage(c.body.message)};
 assert.equal((await api('link-wallet',body,second.token)).status,401);
 assert.equal((await api('link-wallet',body,actor.token,{Cookie:''})).status,401);
 assert.equal((await api('link-wallet',{...body,signature:await Wallet.createRandom().signMessage(c.body.message)},actor.token)).status,401);
 const r=await api('link-wallet',body,actor.token);assert.equal(r.status,200);assert.equal(r.body.user.walletAddress,wallet.address.toLowerCase());assert.equal((await h.api('GET','/auth/me',{token:actor.token})).status,401);actor=r.body;
 assert.equal((await api('link-wallet',body,actor.token)).status,401);assert.equal((await h.api('GET','/core/cv',{token:actor.token})).status,200);
 c=await api('wallet-challenge',{password:plain,walletAddress:wallet.address},second.token);assert.equal(c.status,200);
 assert.equal((await api('link-wallet',{password:plain,challengeId:c.body.challengeId,signature:await wallet.signMessage(c.body.message)},second.token)).status,409);
 assert.equal((await h.loginAs('student','TEST wallet re-login',wallet)).res.status,200);
});
test('expired challenge and disabled user cannot authenticate; GET and missing feature do not write',async()=>{
 const wallet=Wallet.createRandom(),c=await api('wallet-challenge',{password:plain,walletAddress:wallet.address},second.token);await Challenge.updateOne({_id:c.body.challengeId},{$set:{expiresAt:new Date(1)}});
 assert.equal((await api('link-wallet',{password:plain,challengeId:c.body.challengeId,signature:await wallet.signMessage(c.body.message)},second.token)).status,401);
 await User.updateOne({_id:second.user._id},{$set:{disabled:true}});assert.equal((await api('login',{email:'second@example.invalid',password:plain})).status,401);assert.equal((await h.api('GET','/auth/me',{token:second.token})).status,401);
 const before=JSON.stringify(await User.find().sort({_id:1}).select('+passwordHash +loginEmail +identityHistory').lean());await api('status');await h.api('GET','/auth/me',{token:actor.token});assert.equal(JSON.stringify(await User.find().sort({_id:1}).select('+passwordHash +loginEmail +identityHistory').lean()),before);
 process.env.EMAIL_AUTH_ENABLED='false';assert.equal((await api('register',registration('disabled-feature@example.invalid'))).status,503);process.env.EMAIL_AUTH_ENABLED='true';
});

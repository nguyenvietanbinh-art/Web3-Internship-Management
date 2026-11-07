process.env.EMAIL_AUTH_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{Wallet}=require('ethers');
const h=require('./helpers'),Challenge=require('../src/models/IdentityChallenge');
let owner,other,cookie='',challenge,wallet,reauth;
const password='TEST-only-wallet-modal-2026';
async function api(path,body,token,headers={}){const r=await fetch(h.baseURL+'/auth/email/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:5175',Cookie:cookie,...(token?{Authorization:'Bearer '+token}:{}),...headers},body:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return{status:r.status,body:await r.json()};}
before(async()=>{await h.start();for(const name of ['owner','other']){const r=await api('register',{name,email:name+'-wallet-modal@example.invalid',password,confirmPassword:password});assert.equal(r.status,201);if(name==='owner')owner=r.body;else other=r.body;}wallet=Wallet.createRandom();});after(h.stop);
test('password verification precedes wallet access; wrong password and missing origin rejected',async()=>{
 assert.equal((await api('wallet-reauth',{password:'incorrect-password'},owner.token)).status,401);
 assert.equal((await api('wallet-reauth',{password},owner.token,{Origin:''})).status,403);
 const r=await api('wallet-reauth',{password},owner.token);assert.equal(r.status,200);reauth=r.body;
 assert.equal(r.body.password,undefined);assert.equal(r.body.passwordHash,undefined);assert.equal(r.body.user,undefined);
});
test('reauth binds browser/user and single-use ticket before issuing chain-bound nonce',async()=>{
 const body={reauthId:reauth.reauthId,walletAddress:wallet.address,chainId:'0x7a69'};
 assert.equal((await api('wallet-challenge',body,other.token)).status,401);
 assert.equal((await api('wallet-challenge',body,owner.token,{Cookie:''})).status,401);
 const r=await api('wallet-challenge',body,owner.token);assert.equal(r.status,200);challenge=r.body;
 assert.equal(challenge.chainId,'31337');assert.ok(challenge.message.includes('Chain ID: 31337'));assert.ok(challenge.message.includes('Purpose: password-link-wallet'));
 assert.equal((await api('wallet-challenge',body,owner.token)).status,401);
});
test('wrong chain, signature, owner, origin and cookie cannot link a wallet',async()=>{
 const body={challengeId:challenge.challengeId,chainId:'31337',signature:await wallet.signMessage(challenge.message)};
 assert.equal((await api('link-wallet',{...body,chainId:'1'},owner.token)).status,401);
 assert.equal((await api('link-wallet',{...body,signature:await Wallet.createRandom().signMessage(challenge.message)},owner.token)).status,401);
 assert.equal((await api('link-wallet',body,other.token)).status,401);
 assert.equal((await api('link-wallet',body,owner.token,{Cookie:''})).status,401);
 assert.equal((await api('link-wallet',body,owner.token,{Origin:''})).status,403);
});
test('confirmed signature links exactly once and survives password re-login',async()=>{
 const body={challengeId:challenge.challengeId,chainId:'0x7a69',signature:await wallet.signMessage(challenge.message)};
 const r=await api('link-wallet',body,owner.token);assert.equal(r.status,200);assert.equal(r.body.user.walletAddress,wallet.address.toLowerCase());assert.equal(r.body.user.walletVerified,true);owner=r.body;
 assert.equal((await api('link-wallet',body,owner.token)).status,401);
 const login=await api('login',{email:'owner-wallet-modal@example.invalid',password});assert.equal(login.status,200);assert.equal(login.body.user.walletVerified,true);assert.equal(login.body.user.walletAddress,wallet.address.toLowerCase());
});
test('same wallet cannot belong to another account',async()=>{
 const proof=await api('wallet-reauth',{password},other.token);assert.equal(proof.status,200);
 const c=await api('wallet-challenge',{reauthId:proof.body.reauthId,walletAddress:wallet.address,chainId:'31337'},other.token);assert.equal(c.status,200);
 assert.equal((await api('link-wallet',{challengeId:c.body.challengeId,chainId:'31337',signature:await wallet.signMessage(c.body.message)},other.token)).status,409);
});
test('expired reauth and signature nonce are rejected',async()=>{
 const proof=await api('wallet-reauth',{password},other.token);await Challenge.updateOne({_id:proof.body.reauthId},{$set:{expiresAt:new Date(1)}});
 assert.equal((await api('wallet-challenge',{reauthId:proof.body.reauthId,walletAddress:wallet.address,chainId:'31337'},other.token)).status,401);
 const next=await api('wallet-reauth',{password},other.token),c=await api('wallet-challenge',{reauthId:next.body.reauthId,walletAddress:wallet.address,chainId:'31337'},other.token);
 await Challenge.updateOne({_id:c.body.challengeId},{$set:{expiresAt:new Date(1)}});
 assert.equal((await api('link-wallet',{challengeId:c.body.challengeId,chainId:'31337',signature:await wallet.signMessage(c.body.message)},other.token)).status,401);
});
test('reauth endpoint inherits auth brute-force rate limiting',async()=>{
 const old=process.env.AUTH_RATE_LIMIT;process.env.AUTH_RATE_LIMIT='1';try{assert.equal((await api('wallet-reauth',{password:'incorrect-password'},other.token)).status,429);}finally{if(old===undefined)delete process.env.AUTH_RATE_LIMIT;else process.env.AUTH_RATE_LIMIT=old;}
});

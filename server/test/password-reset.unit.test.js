const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),bcrypt=require('bcryptjs');
const User=require('../src/models/User'),service=require('../src/services/passwordReset');
const original=Object.fromEntries(['findById','findOne','findOneAndUpdate','updateOne'].map(k=>[k,User[k]]));
afterEach(()=>Object.assign(User,original));
const actor={_id:'111111111111111111111111',role:'admin'},id='222222222222222222222222';
const cfg=()=>({origin:'https://internova.example',key:'test-only',from:'Internova <test@example.invalid>'});
test('RBAC rejects non-admin before any database lookup',async()=>{User.findById=()=>{throw Error('must not query');};await assert.rejects(service.request({...actor,role:'student'},id),{status:403});});
test('verified recipient required, OAuth-only does not acquire a password',()=>{assert.throws(()=>service.recipient({loginEmail:'a@example.invalid'}),{code:'NO_INTERNAL_PASSWORD'});assert.throws(()=>service.recipient({passwordHash:'x',loginEmail:'a@example.invalid'}),{code:'RESET_EMAIL_NOT_VERIFIED'});assert.equal(service.recipient({passwordHash:'x',loginEmail:'a@example.invalid',passwordEmailVerifiedAt:new Date()}),'a@example.invalid');assert.throws(()=>service.recipient({passwordHash:'x',loginEmail:'a@example.invalid',googleSubject:'s',googleEmail:'b@example.invalid'}));});
test('another admin is protected even with internal password',async()=>{User.findById=()=>({select:async()=>({_id:id,role:'admin',passwordHash:'x'})});await assert.rejects(service.request(actor,id),{code:'PROTECTED_ADMIN'});});
test('missing email configuration fails closed',()=>{const saved=process.env.PASSWORD_RESET_PUBLIC_ORIGIN;delete process.env.PASSWORD_RESET_PUBLIC_ORIGIN;try{assert.throws(service.configuration,{code:'RESET_EMAIL_UNAVAILABLE'});}finally{if(saved!==undefined)process.env.PASSWORD_RESET_PUBLIC_ORIGIN=saved;}});
test('request stores only digest; email receives one-time link, response/audit have no token',async()=>{
 let update,link;User.findById=()=>({select:async()=>({_id:id,role:'student',passwordHash:'x',loginEmail:'a@example.invalid',passwordEmailVerifiedAt:new Date(),authVersion:2})});
 User.findOneAndUpdate=async(filter,changes)=>{assert.ok(filter.$or);update=changes;return {_id:id};};User.updateOne=async()=>({modifiedCount:1});
 const result=await service.request(actor,id,{config:cfg,delivery:async message=>{link=message.link;}}),token=link.split('#password-reset=')[1];
 assert.match(token,/^[a-f0-9]{64}$/);assert.equal(update.$set.passwordReset.digest,crypto.createHash('sha256').update(token).digest('hex'));assert.equal(update.$set.passwordReset.deliveryState,'pending');assert.ok(!JSON.stringify({update,result}).includes(token));
});
test('email delivery failure invalidates token, never reports success',async()=>{
 const writes=[];User.findById=()=>({select:async()=>({_id:id,role:'student',passwordHash:'x',loginEmail:'a@example.invalid',passwordEmailVerifiedAt:new Date(),authVersion:0})});User.findOneAndUpdate=async()=>({_id:id});User.updateOne=async(f,u)=>{writes.push(u);return{modifiedCount:1};};
 await assert.rejects(service.request(actor,id,{config:cfg,delivery:async()=>{throw Error('provider unavailable');}}),/provider unavailable/);assert.equal(writes.at(-1).$set['passwordReset.deliveryState'],'failed');assert.equal(writes.at(-1).$unset['passwordReset.digest'],1);
});
test('invalid, expired or consumed token rejected; query enforces expiry and sent state',async()=>{
 await assert.rejects(service.complete({token:'bad',newPassword:'Password123',confirmPassword:'Password123'}));User.findOne=f=>{assert.ok(f['passwordReset.expiresAt'].$gt instanceof Date);assert.equal(f['passwordReset.deliveryState'],'sent');return{select:async()=>null};};await assert.rejects(service.complete({token:'a'.repeat(64),newPassword:'Password123',confirmPassword:'Password123'}));
});
test('real bcrypt hash changes; atomic consume revokes sessions, replay fails',async()=>{
 const old=await bcrypt.hash('OldPassword123',4);let consumed=false,saved;
 User.findOne=()=>({select:async()=>consumed?null:{_id:id,passwordHash:old,authVersion:4,passwordReset:{authVersion:4}}});
 User.updateOne=async(filter,update)=>{assert.equal(filter.authVersion,4);assert.equal(filter.passwordHash,old);if(consumed)return{modifiedCount:0};consumed=true;saved=update;return{modifiedCount:1};};
 const body={token:'b'.repeat(64),newPassword:'NewPassword456',confirmPassword:'NewPassword456'};await service.complete(body);assert.ok(await bcrypt.compare(body.newPassword,saved.$set.passwordHash));assert.equal(await bcrypt.compare('OldPassword123',saved.$set.passwordHash),false);assert.equal(saved.$inc.authVersion,1);assert.equal(saved.$unset.passwordReset,1);await assert.rejects(service.complete(body));assert.ok(!JSON.stringify(saved).includes(body.token));
});

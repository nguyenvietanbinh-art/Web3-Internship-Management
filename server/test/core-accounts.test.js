process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const h=require('./helpers');
const {Wallet}=require('ethers');
const User=require('../src/models/User');
let admin,student,company;
before(async()=>{await h.start();const wallet=Wallet.createRandom();await User.create({walletAddress:wallet.address,name:'TEST provisioned admin',role:'admin'});admin=await h.loginAs('admin','TEST admin',wallet);student=await h.loginAs('student','TEST student');company=await h.loginAs('company','TEST company');});
after(h.stop);
test('core accounts require JWT and admin, profile cannot elevate role',async()=>{
 assert.equal((await h.api('GET','/core/profile')).status,401);
 assert.equal((await h.api('GET','/core/accounts',{token:student.token})).status,403);
 assert.equal((await h.api('POST','/core/accounts',{token:company.token,body:{}})).status,403);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{role:'admin',version:0}})).status,400);
 assert.equal((await User.findById(student.user._id)).role,'student');
});
test('profile persists allowed fields, audits atomically and rejects stale/invalid input',async()=>{
 const p=await h.api('GET','/core/profile',{token:student.token});
 const updated=await h.api('PATCH','/core/profile',{token:student.token,body:{name:'TEST edited name',skills:['React'],version:p.body.__v}});
 assert.equal(updated.status,200);assert.equal(updated.body.name,'TEST edited name');assert.equal(updated.body.auditHistory,undefined);
 assert.equal((await User.findById(student.user._id).select('+auditHistory')).auditHistory.length,1);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{name:'stale overwrite',version:p.body.__v}})).status,409);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{email:'bad',version:updated.body.__v}})).status,403);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{companyName:'spoof',version:updated.body.__v}})).status,403);
});
test('admin provisions mentor; public self-registration still cannot grant mentor',async()=>{
 const wallet=Wallet.createRandom();
 const made=await h.api('POST','/core/accounts',{token:admin.token,body:{walletAddress:wallet.address,name:'TEST mentor',role:'mentor'}});
 assert.equal(made.status,201);assert.equal(made.body.role,'mentor');
 const login=await h.loginAs('mentor','TEST mentor',wallet);assert.equal(login.res.status,200);assert.equal(login.user.role,'mentor');
 const invalid=await h.loginAs('mentor','not provisioned');assert.equal(invalid.res.status,400);
 assert.equal((await h.api('POST','/core/accounts',{token:admin.token,body:{walletAddress:wallet.address,name:'duplicate',role:'mentor'}})).status,409);
});
test('admin disable invalidates existing JWT, enable restores; reason optional and history retained',async()=>{
 let p=(await h.api('GET','/core/profile',{token:company.token})).body;
 let r=await h.api('PATCH','/core/accounts/'+p._id,{token:admin.token,body:{disabled:true,version:p.__v}});assert.equal(r.status,200);
 assert.equal((await h.api('GET','/topics',{token:company.token})).status,401);
 r=await h.api('PATCH','/core/accounts/'+p._id,{token:admin.token,body:{disabled:false,reason:'TEST reenable',version:r.body.__v}});assert.equal(r.status,200);
 assert.equal((await h.api('GET','/core/profile',{token:company.token})).status,200);
 const audit=await h.api('GET','/core/accounts/'+p._id+'/history',{token:admin.token});assert.equal(audit.body.length,2);assert.equal(audit.body[0].data.reason,'');
 assert.equal((await h.api('GET','/core/accounts/'+p._id+'/history',{token:student.token})).status,403);
});
test('admin self-modification blocked; pagination validated; GET has zero persistence writes',async()=>{
 assert.equal((await h.api('PATCH','/core/accounts/'+admin.user._id,{token:admin.token,body:{disabled:true,reason:'self',version:0}})).status,403);
 assert.equal((await h.api('GET','/core/accounts?page=0',{token:admin.token})).status,400);
 const before=JSON.stringify(await User.find().sort({_id:1}).select('+auditHistory').lean());
 for(let i=0;i<3;i++){const r=await h.api('GET','/core/accounts?limit=2&q=TEST',{token:admin.token});assert.equal(r.status,200);assert.ok(r.body.items.length<=2);await h.api('GET','/core/profile',{token:student.token});}
 assert.equal(JSON.stringify(await User.find().sort({_id:1}).select('+auditHistory').lean()),before);
});
test('legacy profile writes retain response shape while auditing and invalidating stale core versions',async()=>{
 const before=(await h.api('GET','/core/profile',{token:student.token})).body;
 const r=await h.api('PUT','/auth/profile/'+student.address,{token:student.token,body:{name:'TEST legacy edit',role:'admin'}});assert.equal(r.status,200);assert.equal(r.body.user.role,'student');assert.equal(r.body.success,true);
 assert.equal((await h.api('PATCH','/core/profile',{token:student.token,body:{name:'stale core edit',version:before.__v}})).status,409);
 const user=await User.findById(student.user._id).select('+auditHistory');assert.equal(user.auditHistory.at(-1).action,'profile.legacy_updated');
});
test('raw legacy users without __v can be edited explicitly, never backfilled by GET',async()=>{
 const wallet=Wallet.createRandom();await User.collection.insertOne({walletAddress:wallet.address.toLowerCase(),role:'student',name:'TEST raw legacy',skills:[]});
 const login=await h.loginAs('student','TEST raw legacy',wallet);assert.equal(login.res.status,200);const p=await h.api('GET','/core/profile',{token:login.token});assert.equal(p.body.__v,0);assert.equal((await User.collection.findOne({walletAddress:login.address})).__v,undefined);
 const r=await h.api('PATCH','/core/profile',{token:login.token,body:{name:'TEST explicit edit',version:0}});assert.equal(r.status,200);assert.equal(r.body.__v,1);
});

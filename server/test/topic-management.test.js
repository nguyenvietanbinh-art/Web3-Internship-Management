process.env.USER_ID_BUSINESS_ENABLED='true';
process.env.EMAIL_AUTH_ENABLED='true';
process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers'),Topic=require('../src/models/Topic'),Assignment=require('../src/models/Assignment');
let company,foreign,student,admin;
before(async()=>{await h.start();company=await h.loginAs('company','TEST owner');foreign=await h.loginAs('company','TEST other company');student=await h.loginAs('student','TEST student');const user=await require('../src/models/User').create({name:'TEST admin',role:'admin',walletAddress:require('ethers').Wallet.createRandom().address.toLowerCase()});admin={user,token:require('../src/services/authService').signToken(user)};});
after(h.stop);
const api=(method,path,body,actor=company)=>h.api(method,path,{body,token:actor.token});
const input=()=>({title:'TEST topic',description:'Original description',kpis:[{title:'Build',description:'Implement app',weightPercent:40,deadline:'2026-12-01T00:00:00Z'},{title:'Verify',description:'Validate app',weightPercent:60,deadline:'2026-12-02T00:00:00Z'}]});
async function create(){const r=await api('POST','/core/topics',input());assert.equal(r.status,201,JSON.stringify(r.body));return r.body;}
test('owner edits all KPI fields; list reflects saved data and rejects stale updates/deletes',async()=>{
 const t=await create(),body={...input(),title:'Updated topic',description:'Updated description',version:t.__v};body.kpis[0].title='Updated KPI';
 const updated=await api('PATCH','/core/topics/'+t._id,body);assert.equal(updated.status,200,JSON.stringify(updated.body));assert.equal(updated.body.__v,1);assert.equal(updated.body.kpis.length,2);assert.equal(updated.body.kpis[0].title,'Updated KPI');assert.equal(updated.body.kpis[1].weightPercent,60);
 assert.equal((await api('PATCH','/core/topics/'+t._id,body)).status,409);
 assert.equal((await api('DELETE','/core/topics/'+t._id,{version:t.__v})).status,409);
 const list=await api('GET','/core/topics');assert.equal(list.status,200);const saved=list.body.items.find(x=>x._id===t._id);assert.equal(saved.title,'Updated topic');assert.equal(saved.description,'Updated description');assert.equal(saved.hasAssignments,false);
});
test('other companies, students and admin cannot change owner topics',async()=>{
 const t=await create();
 for(const actor of [foreign,student,admin])for(const method of ['PATCH','DELETE']){
  const body=method==='PATCH'?{...input(),version:t.__v}:{version:t.__v};
  assert.equal((await api(method,'/core/topics/'+t._id,body,actor)).status,actor===foreign?404:403);
 }
 assert.equal((await Topic.findById(t._id)).title,t.title);
});
test('invalid KPI weights, dates and injected ownership are rejected without writing',async()=>{
 const t=await create();
 const invalidWeights=input();invalidWeights.kpis[0].weightPercent=30;
 const invalidDate=input();invalidDate.kpis[0].deadline='not-a-date';
 for(const data of [invalidWeights,invalidDate,{...input(),companyUserId:foreign.user._id}])assert.equal((await api('PATCH','/core/topics/'+t._id,{...data,version:t.__v})).status,400);
 assert.equal((await Topic.findById(t._id)).__v,t.__v);
});
test('assigned topics remain visible but cannot be edited or deleted',async()=>{
 const t=await create();await Assignment.collection.insertOne({topicId:new (require('mongoose').Types.ObjectId)(t._id)});
 for(const method of ['PATCH','DELETE']){
  const r=await api(method,'/core/topics/'+t._id,method==='PATCH'?{...input(),version:t.__v}:{version:t.__v});assert.equal(r.status,409);assert.equal(r.body.code,'TOPIC_IN_USE');
 }
 const list=await api('GET','/core/topics');assert.equal(list.body.items.find(x=>x._id===t._id).hasAssignments,true);assert.ok(await Topic.exists({_id:t._id}));
});
test('owner deletes an unused topic and it stays absent after reloading the list',async()=>{
 const t=await create(),r=await api('DELETE','/core/topics/'+t._id,{version:t.__v});assert.equal(r.status,200);assert.equal(r.body.deleted,true);assert.equal(await Topic.exists({_id:t._id}),null);
 const list=await api('GET','/core/topics');assert.ok(!list.body.items.some(x=>x._id===t._id));assert.equal((await api('DELETE','/core/topics/'+t._id,{version:t.__v})).status,404);
});

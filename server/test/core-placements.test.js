process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {h,setup,placement}=require('./coreFixtures');const Assignment=require('../src/models/Assignment');
let f,p;
before(async()=>{f=await setup();p=await placement(f,{activate:false});});after(h.stop);
test('only Admin manages batches; date/role/foreign placement validations',async()=>{
 assert.equal((await h.api('POST','/core/batches',{token:f.company.token,body:{}})).status,403);
 assert.equal((await h.api('POST','/core/batches',{token:f.admin.token,body:{code:'INVALID',name:'bad',startDate:h.futureDate(3),endDate:h.futureDate(1)}})).status,400);
 assert.equal((await h.api('POST','/core/placements',{token:f.foreignCompany.token,body:{batchId:p.batch._id,topicId:f.topic._id,studentWallet:f.student.address,mentorWallet:f.mentor.address,startDate:p.doc.startDate,endDate:p.doc.endDate}})).status,403);
 assert.equal((await h.api('GET','/core/placements',{token:f.foreignStudent.token})).body.total,0);
 assert.equal((await h.api('GET','/core/placements',{token:f.mentor.token})).body.total,1);
});
test('canonical placement lifecycle requires school approval and cannot complete without final review',async()=>{
 assert.equal((await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.company.token,body:{lifecycle:'approved',reason:'self approve',version:0}})).status,403);
 let r=await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.admin.token,body:{lifecycle:'approved',reason:'TEST school approval',version:0}});assert.equal(r.status,200);
 r=await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.company.token,body:{lifecycle:'active',reason:'TEST begin',version:r.body.__v}});assert.equal(r.status,200);p.doc=r.body;
 assert.equal((await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.admin.token,body:{lifecycle:'completed',reason:'premature',version:r.body.__v}})).status,409);
 assert.equal((await h.api('PATCH','/core/batches/'+p.batch._id,{token:f.admin.token,body:{status:'closed',version:0}})).status,409);
});
test('duplicate placement unique key; legacy assignment APIs never expose or mutate canonical records',async()=>{
 const duplicate=await h.api('POST','/core/placements',{token:f.company.token,body:{topicId:f.topic._id,batchId:p.batch._id,studentWallet:f.student.address,mentorWallet:f.mentor.address,startDate:p.doc.startDate,endDate:p.doc.endDate}});assert.equal(duplicate.status,409);
 const legacy=await h.api('GET','/data/assignments',{token:f.company.token});assert.equal(legacy.body.total,0);
 const before=JSON.stringify(await Assignment.find().sort({_id:1}).lean());for(let i=0;i<3;i++)await h.api('GET','/core/placements',{token:f.student.token});assert.equal(JSON.stringify(await Assignment.find().sort({_id:1}).lean()),before);
});

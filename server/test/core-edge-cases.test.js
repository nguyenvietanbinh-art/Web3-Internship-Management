process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {h,setup,placement}=require('./coreFixtures');const {Report,WorkSession}=require('../src/models/BusinessModels');const Assignment=require('../src/models/Assignment');const v=require('../src/core/shared');
let f,p;
before(async()=>{f=await setup();p=await placement(f,{activate:false});});after(h.stop);
test('calendar and search validation reject impossible dates and regex injection',()=>{
 assert.throws(()=>v.date('2026-02-30','Ngày'));assert.throws(()=>v.date('2026-02-30T10:00:00Z','Ngày'));assert.throws(()=>v.date('2026-10-31T10:00','Ngày'));assert.equal(v.date('2028-02-29','Ngày').toISOString().slice(0,10),'2028-02-29');assert.equal(v.search('.*').test('ordinary name'),false);assert.throws(()=>v.pagination({page:{$gt:0}}));assert.throws(()=>v.list([{}],'Kỹ năng'));
});
test('school can correct mentor/dates before active, no tenancy mutation; locked after start',async()=>{
 const body={mentorWallet:f.mentor.address,startDate:p.doc.startDate,endDate:new Date(Date.parse(p.doc.endDate)-864e5).toISOString(),reason:'TEST schedule correction',version:p.doc.__v};
 assert.equal((await h.api('PATCH','/core/placements/'+p.doc._id+'/details',{token:f.company.token,body})).status,403);
 assert.equal((await h.api('PATCH','/core/placements/'+p.doc._id+'/details',{token:f.admin.token,body:{...body,studentWallet:f.foreignStudent.address}})).status,400);
 let r=await h.api('PATCH','/core/placements/'+p.doc._id+'/details',{token:f.admin.token,body});assert.equal(r.status,200);p.doc=r.body;
 r=await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.admin.token,body:{lifecycle:'approved',reason:'TEST approval',version:p.doc.__v}});assert.equal(r.status,200);
 r=await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.company.token,body:{lifecycle:'active',reason:'TEST start',version:r.body.__v}});assert.equal(r.status,200);p.doc=r.body;
 assert.equal((await h.api('PATCH','/core/placements/'+p.doc._id+'/details',{token:f.admin.token,body:{...body,version:p.doc.__v}})).status,409);
});
test('report revisions keep previous content, only latest version is reviewable',async()=>{
 let r=await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'weekly',title:'TEST version1',content:'First real TEST version'}});assert.equal(r.status,201);const first=r.body;
 r=await h.api('POST','/core/reports/'+first._id+'/reviews',{token:f.mentor.token,body:{score:30,comment:'TEST revision needed',decision:'need_revision',version:0}});assert.equal(r.status,200);
 r=await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'weekly',title:'TEST version2',content:'Second real TEST version'}});assert.equal(r.status,201);assert.equal(r.body.version,2);
 const old=await Report.findById(first._id);assert.equal(old.current,false);assert.equal(old.content,'First real TEST version');
 assert.equal((await h.api('POST','/core/reports/'+first._id+'/reviews',{token:f.company.token,body:{score:100,comment:'old version',decision:'approved',version:old.__v}})).status,409);
 assert.equal(await Report.countDocuments({assignmentId:p.doc._id,kind:'weekly',current:true}),1);
});
test('final approval racing a new version cannot approve a superseded report or silently allow overwrite',async()=>{
 for(let i=0;i<p.doc.kpis.length;i++){
  let r=await h.api('POST',`/core/placements/${p.doc._id}/kpis/${i}/submit`,{token:f.student.token,body:{content:'TEST race rubric evidence '+i,version:p.doc.__v}});assert.equal(r.status,200);p.doc=r.body;
  r=await h.api('POST',`/core/placements/${p.doc._id}/kpis/${i}/evaluate`,{token:f.mentor.token,body:{status:'approved',score:100,feedback:'TEST rubric accepted',version:p.doc.__v}});assert.equal(r.status,200);p.doc=r.body;
 }
 let r=await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'final',title:'TEST race final',content:'Actual TEST final input'}});assert.equal(r.status,201);let report=r.body;
 for(const role of ['company','mentor']){r=await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f[role].token,body:{score:80,comment:'TEST review',decision:'approved',version:report.__v}});assert.equal(r.status,200);report=r.body;}
 const [approval,submission]=await Promise.all([
  h.api('POST','/core/reports/'+report._id+'/approve',{token:f.admin.token,body:{version:report.__v,reason:'TEST race approval'}}),
  h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'final',title:'TEST concurrent final',content:'Concurrent actual input'}}),
 ]);
 assert.ok([200,409].includes(approval.status),JSON.stringify(approval));assert.ok([201,409].includes(submission.status),JSON.stringify(submission));assert.ok(!(approval.status===200&&submission.status===201));
 assert.equal(await Report.countDocuments({assignmentId:p.doc._id,kind:'final',current:true}),1);assert.equal(await Report.countDocuments({assignmentId:p.doc._id,kind:'final',current:false,state:'approved'}),0);
});
test('stale/missing checkout never auto-closes or auto-counts; invalid long session can be rejected with audit',async()=>{
 const start=new Date(Date.now()-20*3600000);const fixture=await WorkSession.create({assignmentId:p.doc._id,batchId:p.batch._id,studentWallet:f.student.address,companyWallet:f.company.address,mentorWallet:f.mentor.address,day:start.toISOString().slice(0,10),activeStudent:f.student.address,requestKey:'TEST_CLOCK_STALE_SESSION',checkInAt:start,history:[v.event(f.student.user,'TEST.clock_fixture')]});
 const before=JSON.stringify(await WorkSession.findById(fixture._id).lean());let r=await h.api('GET','/core/time/sessions',{token:f.student.token});assert.equal(r.body.items[0].requiresAttention,true);assert.equal(r.body.items[0].missingCheckout,true);assert.equal(JSON.stringify(await WorkSession.findById(fixture._id).lean()),before);
 r=await h.api('POST','/core/time/'+fixture._id+'/check-out',{token:f.student.token,body:{version:fixture.__v}});assert.equal(r.status,200);assert.equal(r.body.state,'needs_adjustment');assert.equal(r.body.minutes,null);
 assert.equal((await h.api('PATCH','/core/time/'+fixture._id+'/review',{token:f.company.token,body:{decision:'approved',reason:'invalid approve',version:r.body.__v}})).status,409);
 r=await h.api('PATCH','/core/time/'+fixture._id+'/review',{token:f.company.token,body:{decision:'rejected',reason:'TEST missing checkout rejected',version:r.body.__v}});assert.equal(r.status,200);assert.equal(r.body.state,'rejected');assert.equal(r.body.history.length,3);
 assert.equal((await h.api('GET','/core/time/totals',{token:f.student.token})).body.totalMinutes,0);
});
test('foreign filters cannot expand canonical scopes or expose reports/CV',async()=>{
 const directory=await h.api('GET','/core/directory?role=student',{token:f.company.token});assert.equal(directory.status,200);assert.ok(!directory.body.items.some(u=>u.walletAddress===f.foreignStudent.address));assert.ok(directory.body.items.every(u=>u.email===undefined));
 for(const endpoint of ['/core/tasks?assignmentId='+p.doc._id,'/core/worklogs?assignmentId='+p.doc._id,'/core/reports?assignmentId='+p.doc._id,'/core/time/sessions?assignmentId='+p.doc._id,'/core/time/totals?assignmentId='+p.doc._id,'/core/placements/'+p.doc._id])assert.equal((await h.api('GET',endpoint,{token:f.foreignStudent.token})).status,404,endpoint);
 assert.equal((await h.api('GET','/core/jds?q[x]=injection',{token:f.student.token})).status,400);
 assert.equal((await Assignment.findById(p.doc._id)).studentWallet,f.student.address);
});
test('company and mentor can mark reports incorrect or needing revision, preserving distinct outcomes and requiring a new version',async()=>{
 for(const role of ['company','mentor'])for(const decision of ['need_revision','incorrect']){
  let r=await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'weekly',title:'TEST '+role+' '+decision,content:'TEST delivery for three-way assessment'}});assert.equal(r.status,201);const report=r.body;
  r=await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f[role].token,body:{score:0,comment:'TEST explain '+decision,decision,version:report.__v}});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.state,'need_revision');assert.equal(r.body.reviews[0].decision,decision);assert.equal(r.body.reviews[0].score,0);assert.equal(r.body.finalScore,null);
  assert.equal((await h.api('POST','/core/reports/'+report._id+'/approve',{token:f.admin.token,body:{version:r.body.__v,reason:'Cannot finalize failed/revision report'}})).status,409);
  assert.equal((await Report.findById(report._id)).reviews[0].decision,decision);
  const next=await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'weekly',title:'TEST corrected delivery',content:'TEST correction'}});assert.equal(next.status,201);assert.equal(next.body.version,report.version+1);assert.equal(next.body.reviews.length,0);assert.equal((await Report.findById(report._id)).current,false);
 }
});

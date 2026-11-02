process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {h,setup,placement}=require('./coreFixtures');const {WorkSession,Report}=require('../src/models/BusinessModels');const Task=require('../src/models/Task'),WorkLog=require('../src/models/WorkLog');
let f,p,task,log,session,report;
before(async()=>{f=await setup();p=await placement(f);});after(h.stop);
test('core task follows assignment ownership, deadlines and strict fields',async()=>{
 const body={assignmentId:p.doc._id,title:'TEST CORE task',priority:'high',dueDate:h.futureDate(5)};
 assert.equal((await h.api('POST','/core/tasks',{token:f.foreignCompany.token,body})).status,404);
 assert.equal((await h.api('POST','/core/tasks',{token:f.student.token,body})).status,403);
 assert.equal((await h.api('POST','/core/tasks',{token:f.company.token,body:{...body,dueDate:h.futureDate(90)}})).status,400);
 const r=await h.api('POST','/core/tasks',{token:f.company.token,body});assert.equal(r.status,201);task=r.body;assert.equal(task.assignedStudentWallet,f.student.address);
 assert.equal((await h.api('GET','/core/tasks',{token:f.foreignStudent.token})).body.total,0);
 assert.equal((await h.api('GET','/internship/tasks',{token:f.company.token})).body.length,0);
 assert.equal((await h.api('PATCH','/internship/tasks/'+task._id+'/status',{token:f.company.token,body:{status:'done'}})).status,409);
});
test('task status/progress and CAS preserve history, reject foreign/edit escalation',async()=>{
 assert.equal((await h.api('PATCH','/core/tasks/'+task._id,{token:f.foreignStudent.token,body:{status:'done',progress:100,version:0}})).status,404);
 assert.equal((await h.api('PATCH','/core/tasks/'+task._id,{token:f.student.token,body:{title:'spoof',version:0}})).status,400);
 assert.equal((await h.api('PATCH','/core/tasks/'+task._id,{token:f.student.token,body:{status:'done',progress:20,version:0}})).status,400);
 const rs=await Promise.all([1,2].map(()=>h.api('PATCH','/core/tasks/'+task._id,{token:f.student.token,body:{status:'done',progress:100,version:0}})));assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);task=rs.find(r=>r.status===200).body;
 assert.equal((await Task.findById(task._id)).history.length,2);
});
test('weekly log edit/review history and duplicate week; approved log immutable to student',async()=>{
 const body={assignmentId:p.doc._id,weekNumber:1,title:'TEST worklog',tasksDone:'Actual TEST work input',challenges:'',nextPlan:''};
 let r=await h.api('POST','/core/worklogs',{token:f.student.token,body});assert.equal(r.status,201);log=r.body;
 assert.equal((await h.api('POST','/core/worklogs',{token:f.student.token,body})).status,409);
 assert.equal((await h.api('PATCH','/core/worklogs/'+log._id+'/review',{token:f.foreignCompany.token,body:{status:'approved',mentorFeedback:'foreign',version:0}})).status,404);
 r=await h.api('PATCH','/core/worklogs/'+log._id+'/review',{token:f.mentor.token,body:{status:'need_revision',mentorFeedback:'TEST revise',version:0}});assert.equal(r.status,200);
 r=await h.api('PATCH','/core/worklogs/'+log._id,{token:f.student.token,body:{...{title:body.title,tasksDone:'Revised TEST text'},version:r.body.__v}});assert.equal(r.status,200);
 r=await h.api('PATCH','/core/worklogs/'+log._id+'/review',{token:f.company.token,body:{status:'approved',mentorFeedback:'TEST approved',version:r.body.__v}});assert.equal(r.status,200);
 assert.equal((await h.api('PATCH','/core/worklogs/'+log._id,{token:f.student.token,body:{title:'locked',tasksDone:'locked',version:r.body.__v}})).status,409);
 assert.equal((await WorkLog.findById(log._id)).history.length,4);
});
test('check-in is explicit, duplicate/open checks are atomic and GET never creates attendance',async()=>{
 const before=await WorkSession.countDocuments();for(let i=0;i<3;i++)await h.api('GET','/core/time/sessions',{token:f.student.token});assert.equal(await WorkSession.countDocuments(),before);
 const rs=await Promise.all([1,2].map(i=>h.api('POST','/core/time/check-in',{token:f.student.token,body:{assignmentId:p.doc._id,requestKey:'TEST_CORE_REQUEST_'+i}})));assert.deepEqual(rs.map(r=>r.status).sort(),[201,409]);session=rs.find(r=>r.status===201).body;assert.equal(session.proof.verified,false);
 assert.equal((await h.api('GET','/core/time/sessions',{token:f.foreignStudent.token})).body.total,0);assert.equal((await h.api('GET','/core/time/totals',{token:f.student.token})).body.totalMinutes,0);
});
test('checkout duration computed from persisted clock fixture; only company can approve with audit',async()=>{
 // Explicit TEST clock fixture represents elapsed work; HTTP body cannot forge timestamps.
 const now=new Date(),start=new Date(now.getTime()-120*60000);start.setUTCDate(now.getUTCDate());if(start>now)start.setUTCHours(0,0,0,0);
 await WorkSession.updateOne({_id:session._id},{$set:{checkInAt:start}});
 assert.equal((await h.api('POST','/core/time/'+session._id+'/check-out',{token:f.foreignStudent.token,body:{version:0}})).status,404);
 assert.equal((await h.api('POST','/core/time/'+session._id+'/check-out',{token:f.student.token,body:{version:0,checkOutAt:h.futureDate(1)}})).status,400);
 let r=await h.api('POST','/core/time/'+session._id+'/check-out',{token:f.student.token,body:{version:0}});assert.equal(r.status,200);session=r.body;assert.ok(session.minutes>=0);assert.equal(session.state,'pending');
 assert.equal((await h.api('GET','/core/time/totals',{token:f.student.token})).body.totalMinutes,0);
 assert.equal((await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.student.token,body:{decision:'approved',reason:'self',version:session.__v}})).status,403);
 assert.equal((await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.foreignCompany.token,body:{decision:'approved',reason:'foreign',version:session.__v}})).status,404);
 r=await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.company.token,body:{decision:'approved',reason:'TEST actual approval',version:session.__v}});assert.equal(r.status,200);session=r.body;
 for(const group of ['day','week','month','batch'])assert.equal((await h.api('GET','/core/time/totals?group='+group,{token:f.student.token})).body.totalMinutes,session.minutes);
 assert.equal((await WorkSession.findById(session._id)).history.length,3);
});
test('daily duplicate after checkout rejected; adjustment needs reason, valid range and audit',async()=>{
 assert.equal((await h.api('POST','/core/time/check-in',{token:f.student.token,body:{assignmentId:p.doc._id,requestKey:'TEST_CORE_SECOND_REQUEST'}})).status,409);
 assert.equal((await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.company.token,body:{decision:'adjust',reason:'',version:session.__v}})).status,400);
 assert.equal((await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.company.token,body:{decision:'adjust',reason:'bad future',checkInAt:h.futureDate(1),checkOutAt:h.futureDate(2),version:session.__v}})).status,400);
 const end=new Date(),start=new Date(end);start.setUTCMinutes(Math.max(0,end.getUTCMinutes()-10));start.setUTCSeconds(0,0);if(start>=end)start.setUTCSeconds(start.getUTCSeconds()-1);
 let r=await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.company.token,body:{decision:'adjust',reason:'TEST explicit correction',checkInAt:start.toISOString(),checkOutAt:end.toISOString(),version:session.__v}});assert.equal(r.status,200);assert.equal(r.body.state,'pending');assert.equal((await h.api('GET','/core/time/totals',{token:f.student.token})).body.totalMinutes,0);
 r=await h.api('PATCH','/core/time/'+session._id+'/review',{token:f.company.token,body:{decision:'approved',reason:'TEST correction approved',version:r.body.__v}});assert.equal(r.status,200);session=r.body;
});
test('reports versioned, foreign/private content denied, roles must independently review latest',async()=>{
 const body={assignmentId:p.doc._id,kind:'final',title:'TEST final report',content:'Real TEST report content, no IPFS/chain claim.'};
 assert.equal((await h.api('POST','/core/reports',{token:f.foreignStudent.token,body})).status,404);
 let r=await h.api('POST','/core/reports',{token:f.student.token,body});assert.equal(r.status,201);report=r.body;
 assert.equal((await h.api('GET','/core/reports',{token:f.foreignCompany.token})).body.total,0);
 assert.equal((await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f.student.token,body:{}})).status,403);
 assert.equal((await h.api('POST','/core/reports/'+report._id+'/approve',{token:f.admin.token,body:{version:0,reason:'premature'}})).status,409);
 r=await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f.company.token,body:{score:0,comment:'TEST zero valid',decision:'approved',version:0}});assert.equal(r.status,200);assert.equal(r.body.reviews[0].score,0);
 assert.equal((await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f.company.token,body:{score:90,comment:'duplicate',decision:'approved',version:r.body.__v}})).status,409);
 r=await h.api('POST','/core/reports/'+report._id+'/reviews',{token:f.mentor.token,body:{score:80,comment:'TEST mentor review',decision:'approved',version:r.body.__v}});assert.equal(r.status,200);report=r.body;assert.equal(report.state,'reviewed');
});
test('canonical KPIs are scoped, preserve zero score and compute weighted result',async()=>{
 assert.equal((await h.api('POST',`/core/placements/${p.doc._id}/kpis/0/submit`,{token:f.foreignStudent.token,body:{content:'spoof',version:p.doc.__v}})).status,404);
 for(let i=0;i<2;i++){
  let r=await h.api('POST',`/core/placements/${p.doc._id}/kpis/${i}/submit`,{token:f.student.token,body:{content:'TEST actual KPI content '+i,version:p.doc.__v}});assert.equal(r.status,200);p.doc=r.body;
  assert.equal((await h.api('POST',`/core/placements/${p.doc._id}/kpis/${i}/evaluate`,{token:f.foreignCompany.token,body:{status:'approved',score:100,feedback:'foreign',version:p.doc.__v}})).status,404);
  r=await h.api('POST',`/core/placements/${p.doc._id}/kpis/${i}/evaluate`,{token:f.company.token,body:{status:'approved',score:i===0?0:80,feedback:'TEST evaluation',version:p.doc.__v}});assert.equal(r.status,200);p.doc=r.body;
 }
 assert.equal(p.doc.kpiScore,48);assert.equal(p.doc.kpis[0].score,0);
 assert.equal((await h.api('POST',`/core/placements/${p.doc._id}/kpis/0/submit`,{token:f.student.token,body:{content:'overwrite approved',version:p.doc.__v}})).status,409);
 const topic=await require('../src/models/Topic').findById(f.topic._id);assert.equal(topic.kpis[0].status,'pending');
});
test('school approval computes real review mean, locks final report; completion does not mint',async()=>{
 let r=await h.api('POST','/core/reports/'+report._id+'/approve',{token:f.admin.token,body:{reason:'TEST school approved',version:report.__v}});assert.equal(r.status,200);assert.equal(r.body.finalScore,40);assert.equal(r.body.state,'approved');
 assert.equal((await h.api('POST','/core/reports',{token:f.student.token,body:{assignmentId:p.doc._id,kind:'final',title:'replace approved',content:'blocked'}})).status,409);
 r=await h.api('PATCH','/core/placements/'+p.doc._id,{token:f.admin.token,body:{lifecycle:'completed',reason:'TEST completed',version:p.doc.__v}});assert.equal(r.status,200);
 assert.equal(await require('../src/models/ChainEvent').countDocuments(),0);const topic=await require('../src/models/Topic').findById(f.topic._id);assert.equal(topic.certificateIpfsHash,'');
});
test('core dashboard reflects DB scope and reads are zero-write',async()=>{
 const models=[Task,WorkLog,WorkSession,Report];const snapshot=()=>Promise.all(models.map(m=>m.find().sort({_id:1}).lean()));const before=JSON.stringify(await snapshot());
 const own=await h.api('GET','/core/dashboard',{token:f.student.token});assert.equal(own.status,200);assert.equal(own.body.totals.placements,1);assert.equal(own.body.totals.doneTasks,1);assert.equal(own.body.totals.approvedMinutes,session.minutes);assert.equal(own.body.totals.averageKpiScore,48);assert.equal(own.body.totals.averageFinalScore,40);
 const foreign=await h.api('GET','/core/dashboard',{token:f.foreignStudent.token});assert.equal(foreign.body.totals.placements,0);assert.equal(foreign.body.totals.approvedMinutes,0);
 for(const role of ['company','mentor','admin'])assert.equal((await h.api('GET','/core/dashboard',{token:f[role].token})).status,200);
 assert.equal(JSON.stringify(await snapshot()),before);
});

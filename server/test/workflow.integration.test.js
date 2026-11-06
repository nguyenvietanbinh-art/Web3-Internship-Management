// Real HTTP + isolated replica set. One approved QA database; never a random per-file DB.
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',WEB3_LOCAL_ENABLED:'false',WORKFLOW_CLOCK_TESTS:'true',MONGODB_URI:'mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_qa_20261106_a?replicaSet=internovaTestRs',JWT_SECRET:require('crypto').randomBytes(32).toString('hex'),CORS_ORIGIN:'http://localhost:5188',PINATA_JWT:'',DEMO_MODE:'false'});
process.env.WORKFLOW_TEST_URI_ALLOWLIST=process.env.MONGODB_URI;
if(process.env.WORKFLOW_SBT_TESTS==='true'){process.env.WEB3_LOCAL_ENABLED='true';process.env.WEB3_LOCAL_DEPLOYMENT=require('path').resolve('contracts/node_modules/.cache/workflow-b-20261106-205837/sbt-deployment.json');}

const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),crypto=require('crypto'),mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const User=require('../src/models/User'),Topic=require('../src/models/Topic'),Assignment=require('../src/models/Assignment'),{CV,InternshipBatch:Batch}=require('../src/models/BusinessModels');
const {Enrollment,Opportunity,Application}=require('../src/workflow/models'),clock=require('../src/workflow/clock');
const {createApp}=require('../src/app'),{ensureProfile}=require('../src/services/accountProfiles'),{signToken}=require('../src/services/authService');
const run=Date.now().toString(36),password=crypto.randomBytes(20).toString('hex');let server,base,admin,company,foreign,mentor,s1,s2,s3,batch,opp,opps,hash;
async function actor(role,label){const u=await User.create({name:'SYNTHETIC QA '+label,role,email:`qa-${run}-${label}@example.invalid`,loginEmail:`qa-${run}-${label}@example.invalid`,passwordHash:hash});await ensureProfile(u);if(role==='student')await CV.create({ownerUserId:u._id,title:'SYNTHETIC QA CV',summary:'React Node MongoDB',skills:['React']});return {user:u,token:signToken(u,'password')};}
const api=async(who,method,path,body)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(who?{Authorization:'Bearer '+who.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
const ok=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r.body));return r.body;};
const future=d=>new Date(Date.now()+d*86400000).toISOString();
async function enroll(who,b=batch){return ok(await api(admin,'POST',`/core/admin/batches/${b._id}/enrollments`,{studentIds:[String(who.user._id)],reason:'SYNTHETIC QA eligibility'}),201).items[0];}
async function apply(who,e,o){await api(who,'POST',`/core/my/internships/${e._id}/register`,{});return ok(await api(who,'POST',`/core/my/internships/${e._id}/applications`,{opportunityId:String(o._id),message:'SYNTHETIC QA application'}),201).application;}
async function offer(who,a){if(a.state==='submitted')a=ok(await api(admin,'POST',`/core/admin/applications/${a._id}/dispatch`,{version:a.__v,reason:'SYNTHETIC QA restore grant'}));return ok(await api(who,'POST',`/core/company/applications/${a._id}/decision`,{state:'offered',version:a.__v,reason:'SYNTHETIC QA offer'}));}
before(async()=>{require('../src/config/workflowTestGuard').assertWorkflowTest();const ready=require('fs').readFileSync('contracts/node_modules/.cache/workflow-b-20261106-205837/qa-ready.json','utf8');assert.equal(JSON.parse(ready).uri,process.env.MONGODB_URI);await mongoose.connect(process.env.MONGODB_URI,{autoIndex:false,autoCreate:false});assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');hash=await require('bcryptjs').hash(password,12);admin=await actor('admin','admin');company=await actor('company','company');foreign=await actor('company','foreign');mentor=await actor('mentor','mentor');s1=await actor('student','student1');s2=await actor('student','student2');s3=await actor('student','student3');const app=createApp();await new Promise(r=>{server=app.listen(0,'127.0.0.1',r)});base=`http://127.0.0.1:${server.address().port}/api`;
batch=ok(await api(admin,'POST','/core/admin/batches',{code:'QA_'+run,name:'SYNTHETIC QA engineering',type:'engineer',startDate:future(-3),endDate:future(40),registrationOpensAt:future(-10),registrationClosesAt:future(30)}),201);
opps=[];for(let i=0;i<5;i++){const t=await Topic.create({companyUserId:company.user._id,companyName:'SYNTHETIC QA company',title:'SYNTHETIC QA topic '+run+' '+i,description:'Build and test',kpis:[{milestoneIndex:0,title:'Deliver',description:'Implement',weightPercent:100,deadline:future(20)}]});opps.push(await Opportunity.create({topicId:t._id,companyUserId:company.user._id,batchId:batch._id,title:t.title,companyName:t.companyName,description:t.description,capacity:i===0?1:5,kpis:t.kpis.map(k=>k.toObject()),schoolAllocationAllowed:true}));}opp=opps[0];});
after(async()=>{clock.setTestClock(null);if(server)await new Promise(r=>server.close(r));await mongoose.disconnect();});
test('school-managed identities block all public creation; login/password/SID remain real',async()=>{
 const before=await User.countDocuments();assert.equal((await api(null,'POST','/auth/email/register',{name:'bad',email:'bad@example.invalid',password,confirmPassword:password})).status,403);assert.equal(await User.countDocuments(),before);
 const l=ok(await api(null,'POST','/auth/email/login',{email:s1.user.email,password}));assert.ok(require('../src/services/authService').verifyToken(l.token).sid);s1.token=l.token;
 assert.equal((await api(s1,'GET','/core/admin/batches')).status,403);for(const u of [s1,company,mentor,admin])assert.equal((await api(u,'GET','/core/batches')).status,403);
 const change=ok(await api(s3,'POST','/auth/email/change-password',{currentPassword:password,newPassword:password+'A',confirmPassword:password+'A'}));assert.equal((await api(s3,'GET','/auth/me')).status,401);s3.token=change.token;
});
test('student application is sent directly to its company, stays visible to admin and remains private to other companies',async()=>{
 const e=await enroll(s1);assert.equal(e.registeredAt,null);const a=await apply(s1,e,opp);assert.equal((await Opportunity.findById(opp._id)).confirmedCount,0);
 assert.equal(ok(await api(company,'GET','/core/company/applications')).items.some(x=>x._id===a._id),true);assert.equal((await api(company,'GET','/core/company/applications/'+a._id)).status,200);assert.equal(ok(await api(admin,'GET','/core/admin/applications?q='+encodeURIComponent(s1.user.name))).items.some(x=>x._id===a._id),true);assert.equal((await api(foreign,'GET','/core/company/applications/'+a._id+'/cv-file')).status,404);
 const offered=a;assert.equal((await Opportunity.findById(opp._id)).confirmedCount,0);assert.equal((await api(foreign,'POST',`/core/company/applications/${a._id}/decision`,{state:'offered',reason:'attack',version:offered.__v})).status,404);
});
test('three concurrent distinct choices succeed, fourth and withdrawn/rejected retry do not restore lifetime allowance',async()=>{
 const e=await enroll(s2);ok(await api(s2,'POST',`/core/my/internships/${e._id}/register`,{}));const results=await Promise.all(opps.slice(1,5).map(o=>api(s2,'POST',`/core/my/internships/${e._id}/applications`,{opportunityId:String(o._id)})));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,201,201,409]);const fresh=await Enrollment.findById(e._id);assert.equal(fresh.usedOpportunities.length,3);const a=await Application.findOne({enrollmentId:e._id});ok(await api(s2,'POST',`/core/my/applications/${a._id}/withdraw`,{version:a.__v,reason:'SYNTHETIC QA withdraw'}));const unselected=opps.slice(1).find(o=>!fresh.usedOpportunities.some(x=>String(x)===String(o._id)));assert.equal((await api(s2,'POST',`/core/my/internships/${e._id}/applications`,{opportunityId:String(unselected._id)})).body.code,'APPLICATION_LIMIT');
 const choices=ok(await api(s2,'GET',`/core/my/internships/${e._id}/opportunities`));assert.ok(choices.items.every(o=>!fresh.usedOpportunities.some(id=>String(id)===o._id)));assert.equal(choices.applicationCount,3);
 const withdrawnNotice=ok(await api(company,'GET','/core/notifications?limit=100')).items.filter(n=>n.title===a.title&&n.message.includes(s2.user.name)&&n.message.includes('đã rút hồ sơ'));assert.equal(withdrawnNotice.length,1);assert.equal((await api(company,'GET',`/core/company/applications/${a._id}`)).status,404);
});
test('two students compete for the last seat; retry and mentor finalization never consume it again',async()=>{
 const e1=await Enrollment.findOne({studentUserId:s1.user._id,batchId:batch._id}),a1=await Application.findOne({enrollmentId:e1._id,opportunityId:opp._id});const e3=await enroll(s3),a3=await apply(s3,e3,opp);
 const results=await Promise.all([[s1,a1],[s3,a3]].map(([who,a])=>api(company,'POST',`/core/company/applications/${a._id}/decision`,{state:'offered',version:a.__v,reason:'SYNTHETIC QA first company acceptance'})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await Opportunity.findById(opp._id)).confirmedCount,1);
 const i=results.findIndex(r=>r.status===200),who=[s1,s3][i],a=[a1,a3][i];ok(await api(company,'POST',`/core/company/applications/${a._id}/decision`,{state:'offered',version:a.__v,reason:'SYNTHETIC QA first company acceptance'}));assert.equal((await Opportunity.findById(opp._id)).confirmedCount,1);
 const e=await Enrollment.findOne({studentUserId:who.user._id,batchId:batch._id});const assignment=ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/assignment`,{mentorUserId:String(mentor.user._id),startDate:batch.startDate,endDate:batch.endDate,reason:'SYNTHETIC QA official assignment',version:e.__v}),201);assert.equal((await Opportunity.findById(opp._id)).confirmedCount,1);
 assert.equal(ok(await api(company,'GET','/core/company/students')).items.some(x=>x._id===assignment._id),true);assert.equal(ok(await api(foreign,'GET','/core/company/students')).items.some(x=>x._id===assignment._id),false);assert.equal(ok(await api(mentor,'GET','/core/mentor/students')).items.some(x=>x._id===assignment._id),true);
 const cancelled=ok(await api(admin,'POST',`/core/admin/assignments/${assignment._id}/cancel`,{version:assignment.__v,reason:'SYNTHETIC QA cancellation'}));ok(await api(admin,'POST',`/core/admin/assignments/${assignment._id}/cancel`,{version:cancelled.__v,reason:'retry'}));assert.equal((await Opportunity.findById(opp._id)).confirmedCount,0);
});
test('summary and paged details count students, and seven-day clock has exact boundary',async()=>{
 const stats=ok(await api(admin,'GET',`/core/admin/batches/${batch._id}/students?status=all&limit=100`));assert.equal(stats.total,3);assert.equal(stats.summary.total,3);assert.equal(stats.summary.registered+stats.summary.unregistered,3);
 const b=await Batch.create({code:'QA_CLOCK_'+run,name:'SYNTHETIC QA clock',type:'bachelor',startDate:future(14),endDate:future(60),registrationOpensAt:future(-1),registrationClosesAt:future(15),status:'open'});await enroll(s1,b);
 const boundary=new Date(b.startDate.getTime()-7*86400000);clock.setTestClock(new Date(boundary.getTime()-1));assert.equal(ok(await api(admin,'GET',`/core/admin/assignment-reminders?batchId=${b._id}`)).items[0].summary.dueMissingTopic,0);
 const clockEnrollment=await Enrollment.findOne({studentUserId:s1.user._id,batchId:b._id}),clockOpportunity=await Opportunity.create({topicId:opps[4].topicId,companyUserId:company.user._id,batchId:b._id,title:'SYNTHETIC QA fallback',companyName:'SYNTHETIC QA company',capacity:1,schoolAllocationAllowed:true,kpis:[{title:'Deliver',description:'Test',weightPercent:100,deadline:new Date(b.startDate.getTime()+86400000)}]});
 const fallback={version:clockEnrollment.__v,opportunityId:String(clockOpportunity._id),mentorUserId:String(mentor.user._id),startDate:b.startDate.toISOString(),endDate:b.endDate.toISOString(),confirmParticipation:true,reason:'SYNTHETIC QA school fallback when no acceptance'};
 assert.equal((await api(admin,'POST',`/core/admin/enrollments/${clockEnrollment._id}/assignment`,fallback)).body.code,'NOT_DUE');
 clock.setTestClock(boundary);assert.equal(ok(await api(admin,'GET',`/core/admin/assignment-reminders?batchId=${b._id}`)).items[0].summary.dueMissingTopic,1);
 ok(await api(admin,'POST',`/core/admin/enrollments/${clockEnrollment._id}/assignment`,fallback),201);assert.equal((await Opportunity.findById(clockOpportunity._id)).confirmedCount,1);
 await enroll(s2,b);clock.setTestClock(new Date(b.startDate.getTime()+1));assert.equal(ok(await api(admin,'GET',`/core/admin/assignment-reminders?batchId=${b._id}`)).items[0].summary.dueMissingTopic,1);clock.setTestClock(null);
});
test('failed school finalization rolls back seat and admission; cancellation remains idempotent',async()=>{
 const student=await actor('student','rollback'),e=await enroll(student),o=opps[4],before=(await Opportunity.findById(o._id)).confirmedCount;
 const body={opportunityId:String(o._id),mentorUserId:String(foreign.user._id),startDate:batch.startDate,endDate:batch.endDate,reason:'SYNTHETIC QA invalid mentor',confirmParticipation:true,version:e.__v};
 assert.equal((await api(admin,'POST',`/core/admin/enrollments/${e._id}/assignment`,body)).status,409);
 const rolled=await Enrollment.findById(e._id);assert.equal(rolled.admission,null);assert.equal(rolled.registeredAt,null);assert.equal((await Opportunity.findById(o._id)).confirmedCount,before);
 const app=await offer(company,await apply(student,e,o));const admitted=ok(await api(student,'POST',`/core/my/applications/${app._id}/confirm`,{version:app.__v}));
 const cancelled=ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/cancel-admission`,{version:admitted.__v,reason:'SYNTHETIC QA cancel admission'}));
 ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/cancel-admission`,{version:cancelled.__v,reason:'retry'}));assert.equal((await Opportunity.findById(o._id)).confirmedCount,before);assert.equal((await Application.findById(app._id)).dispatch.revokedAt instanceof Date,true);assert.equal((await api(company,'GET',`/core/company/applications/${app._id}/cv-file`)).status,404);
});
test('official assignment supports task, diary, time and report workflow with foreign access denied',async()=>{
 const student=await actor('student','work'),otherMentor=await actor('mentor','othermentor'),e=await enroll(student),o=opps[4];
 let a=ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/assignment`,{opportunityId:String(o._id),mentorUserId:String(mentor.user._id),startDate:batch.startDate,endDate:batch.endDate,reason:'SYNTHETIC QA real workflow',confirmParticipation:true,version:e.__v}),201);
 a=ok(await api(company,'POST',`/core/school/assignments/${a._id}/state`,{version:a.__v,state:'active',reason:'SYNTHETIC QA start'}));
 const picker=ok(await api(student,'GET','/core/placements?limit=100'));assert.equal(picker.items.length,1);assert.equal(picker.items[0]._id,a._id);
 assert.equal((await api(student,'POST','/core/placements',{})).status,403);assert.equal((await api(company,'GET',`/core/admin/batches/${batch._id}/students`)).status,403);
 let task=ok(await api(company,'POST','/core/tasks',{assignmentId:a._id,title:'SYNTHETIC QA task',description:'Implement test',priority:'high',dueDate:future(2)}),201);
 for(const who of [foreign,otherMentor,s1])assert.equal((await api(who,'PATCH',`/core/tasks/${task._id}`,{version:task.__v,status:'in_progress',progress:20})).status,404);
 task=ok(await api(student,'POST',`/core/tasks/${task._id}/submit`,{version:task.__v,content:'SYNTHETIC QA finished result'}));assert.equal(task.status,'review');
 let log=ok(await api(company,'POST','/core/worklogs/assign',{assignmentId:a._id,weekNumber:1,title:'SYNTHETIC QA diary',requirement:'Summarize work',priority:'medium',dueDate:future(2)}),201);
 log=ok(await api(student,'PATCH',`/core/worklogs/${log._id}`,{version:log.__v,title:log.title,tasksDone:'SYNTHETIC QA work completed',challenges:'',nextPlan:'Testing',resultLink:''}));assert.equal(log.status,'submitted');
 const session=ok(await api(student,'POST','/core/time/check-in',{assignmentId:a._id,requestKey:crypto.randomUUID()}),201);
 assert.equal((await api(foreign,'PATCH',`/core/time/${session._id}/review`,{version:session.__v,decision:'rejected',reason:'attack'})).status,404);
 const ended=ok(await api(student,'POST',`/core/time/${session._id}/check-out`,{version:session.__v}));assert.equal(ended.minutes,0);assert.equal(ok(await api(student,'GET','/core/time/totals?group=batch')).totalMinutes,0);
 let report=ok(await api(student,'POST','/core/reports',{assignmentId:a._id,kind:'weekly',title:'SYNTHETIC QA report',content:'SYNTHETIC QA real submission'}),201);
 assert.equal((await api(foreign,'POST',`/core/reports/${report._id}/reviews`,{version:report.__v,score:90,comment:'attack',decision:'approved'})).status,404);
 report=ok(await api(company,'POST',`/core/reports/${report._id}/reviews`,{version:report.__v,score:80,comment:'SYNTHETIC QA company review',decision:'approved'}));
 report=ok(await api(mentor,'POST',`/core/reports/${report._id}/reviews`,{version:report.__v,score:90,comment:'SYNTHETIC QA mentor review',decision:'approved'}));
 report=ok(await api(admin,'POST',`/core/reports/${report._id}/approve`,{version:report.__v,reason:'SYNTHETIC QA school approval'}));assert.equal(report.finalScore,85);
 a=ok(await api(admin,'POST',`/core/admin/assignments/${a._id}/mentor`,{version:a.__v,mentorUserId:String(otherMentor.user._id),reason:'SYNTHETIC QA mentor transfer'}));
 assert.equal((await api(mentor,'GET',`/core/reports?assignmentId=${a._id}`)).status,404);assert.equal(ok(await api(otherMentor,'GET',`/core/reports?assignmentId=${a._id}`)).total,1);
});
test('first company acceptance immediately withdraws other applications and notifies only their companies',async()=>{
 const student=await actor('student','automatic-withdrawal'),third=await actor('company','third-company'),stranger=await actor('company','notification-stranger'),e=await enroll(student);
 await CV.updateOne({ownerUserId:student.user._id},{$set:{summary:'CV SECRET SENTINEL',fileData:Buffer.from('PRIVATE CV BYTES'),fileName:'private.txt',mime:'text/plain'}});
 const make=async(owner,label)=>{const t=await Topic.create({companyUserId:owner.user._id,companyName:owner.user.name,title:'SYNTHETIC QA '+run+' '+label,description:'Test',kpis:[{milestoneIndex:0,title:'Deliver',description:'Test',weightPercent:100,deadline:future(20)}]});return Opportunity.create({topicId:t._id,companyUserId:owner.user._id,batchId:batch._id,title:t.title,companyName:t.companyName,capacity:5,kpis:t.kpis.map(k=>k.toObject())});};
 const secondOpp=await make(foreign,'losing-company-B'),thirdOpp=await make(third,'losing-company-C');
 const winner=await apply(student,e,opps[3]),second=await apply(student,e,secondOpp),last=await apply(student,e,thirdOpp);
 const accepted=await offer(company,winner);assert.equal(accepted.state,'confirmed');
 const enrolled=await Enrollment.findById(e._id);assert.equal(String(enrolled.admission.applicationId),String(winner._id));assert.equal(enrolled.usedOpportunities.length,3);
 for(const [owner,app,o]of [[foreign,second,secondOpp],[third,last,thirdOpp]]){
  assert.equal((await Application.findById(app._id)).state,'closed_other_selected');assert.equal((await Opportunity.findById(o._id)).confirmedCount,0);
  assert.equal((await api(owner,'GET',`/core/company/applications/${app._id}`)).status,404);assert.equal((await api(owner,'GET',`/core/company/applications/${app._id}/cv-file`)).status,404);
  assert.equal((await api(owner,'POST',`/core/company/applications/${app._id}/decision`,{state:'offered',version:app.__v,reason:'late acceptance'})).status,404);
  const notice=ok(await api(owner,'GET','/core/notifications?limit=100')).items.filter(n=>n.title===o.title&&n.message.includes(student.user.name));assert.equal(notice.length,1);assert.equal(notice[0].read,false);assert.ok(notice[0].message.includes('tự động rút'));assert.equal(JSON.stringify(notice).includes('CV SECRET'),false);
  ok(await api(owner,'PATCH',`/core/notifications/${notice[0].id}/read`,{}));assert.equal((await api(stranger,'PATCH',`/core/notifications/${notice[0].id}/read`,{})).status,404);
 }
 const retry=await offer(company,winner);assert.equal(retry._id,accepted._id);assert.equal((await Opportunity.findById(opps[3]._id)).confirmedCount,1);
 assert.equal(ok(await api(stranger,'GET','/core/notifications')).items.length,0);
 assert.equal(ok(await api(foreign,'GET','/core/notifications?limit=100')).items.filter(n=>n.title===secondOpp.title&&n.message.includes(student.user.name)).length,1);
});
test('two companies accepting one student concurrently produce one winner and one withdrawal notice',async()=>{
 const student=await actor('student','company-race'),e=await enroll(student),t=await Topic.create({companyUserId:foreign.user._id,companyName:foreign.user.name,title:'SYNTHETIC QA race '+run,description:'Test',kpis:[{milestoneIndex:0,title:'Deliver',description:'Test',weightPercent:100,deadline:future(20)}]}),o=await Opportunity.create({topicId:t._id,companyUserId:foreign.user._id,batchId:batch._id,title:t.title,companyName:t.companyName,capacity:5,kpis:t.kpis.map(k=>k.toObject())});
 const first=await apply(student,e,opps[3]),second=await apply(student,e,o),before=(await Opportunity.findById(opps[3]._id)).confirmedCount;
 const results=await Promise.all([[company,first],[foreign,second]].map(([owner,a])=>api(owner,'POST',`/core/company/applications/${a._id}/decision`,{state:'offered',version:a.__v,reason:'SYNTHETIC QA concurrent company acceptance'})));
 assert.equal(results.filter(r=>r.status===200).length,1);assert.ok(results.every(r=>[200,404,409].includes(r.status)));
 assert.equal((await Opportunity.findById(opps[3]._id)).confirmedCount-before+(await Opportunity.findById(o._id)).confirmedCount,1);
 const rows=await Application.find({enrollmentId:e._id});assert.deepEqual(rows.map(a=>a.state).sort(),['closed_other_selected','confirmed']);
 const loserIndex=results.findIndex(r=>r.status!==200),owner=[company,foreign][loserIndex],lost=[first,second][loserIndex];assert.equal(ok(await api(owner,'GET','/core/notifications?limit=100')).items.filter(n=>n.title===lost.title&&n.message.includes(student.user.name)).length,1);
});
test('new periods inherit open company topics with separate quotas and safe repeat synchronization',async()=>{
 const student=await actor('student','catalog-student'),disabled=await actor('company','catalog-disabled');await User.updateOne({_id:disabled.user._id},{$set:{disabled:true}});
 const make=(owner,label,status='open',weight=100)=>Topic.create({companyUserId:owner.user._id,companyName:owner.user.name,title:'SYNTHETIC QA catalog '+run+' '+label,description:'Catalog test',maxSlots:4,status,kpis:[{milestoneIndex:0,title:'Deliver',description:'Test',weightPercent:weight,deadline:future(90)}]});
 const topic=await make(company,'open'),closed=await make(company,'closed','closed'),blocked=await make(disabled,'disabled'),invalid=await make(company,'invalid','open',50);
 const old=await Opportunity.create({topicId:topic._id,companyUserId:company.user._id,batchId:batch._id,title:topic.title,companyName:topic.companyName,capacity:4,kpis:[{title:'Deliver',description:'Test',weightPercent:100,deadline:future(20)}]});
 const oldEnrollment=await enroll(student);await offer(company,await apply(student,oldEnrollment,old));assert.equal((await Opportunity.findById(old._id)).confirmedCount,1);
 const created=ok(await api(admin,'POST','/core/admin/batches',{code:'QA_CATALOG_'+run,name:'SYNTHETIC QA new catalog',type:'bachelor',startDate:future(-2),endDate:future(30),registrationOpensAt:future(-10),registrationClosesAt:future(20)}),201);
 assert.ok(created.catalog.created>0);assert.ok(created.catalog.skipped.some(x=>x.topicId===String(invalid._id)));
 let inherited=await Opportunity.findOne({batchId:created._id,topicId:topic._id});assert.ok(inherited);assert.equal(inherited.capacity,4);assert.equal(inherited.confirmedCount,0);assert.equal(inherited.schoolAllocationAllowed,false);assert.equal(inherited.kpis[0].deadline.toISOString(),created.endDate);
 assert.equal((await Topic.findById(topic._id)).kpis[0].deadline.toISOString(),topic.kpis[0].deadline.toISOString());
 for(const excluded of [closed,blocked,invalid])assert.equal(await Opportunity.countDocuments({batchId:created._id,topicId:excluded._id}),0);
 const membership=await enroll(student,created);ok(await api(student,'POST',`/core/my/internships/${membership._id}/register`,{}));const before=await Opportunity.countDocuments({batchId:created._id});
 const catalog=ok(await api(student,'GET',`/core/my/internships/${membership._id}/opportunities?limit=100&companyUserId=${company.user._id}`));assert.ok(catalog.items.some(o=>o._id===String(inherited._id)));assert.equal(await Opportunity.countDocuments({batchId:created._id}),before);
 const app=await apply(student,membership,inherited);await offer(company,app);inherited=await Opportunity.findById(inherited._id);assert.equal(inherited.confirmedCount,1);assert.equal((await Opportunity.findById(old._id)).confirmedCount,1);
 const changed=ok(await api(company,'PATCH',`/core/school/opportunities/${inherited._id}`,{version:inherited.__v,status:'closed',capacity:5}));
 for(let i=0;i<2;i++){const synced=ok(await api(admin,'POST',`/core/admin/batches/${created._id}/sync-opportunities`,{}));assert.equal(synced.catalog.created,0);}
 const preserved=await Opportunity.findById(inherited._id);assert.equal(preserved.status,'closed');assert.equal(preserved.capacity,5);assert.equal(preserved.confirmedCount,1);assert.equal(preserved.__v,changed.__v);assert.equal(await Opportunity.countDocuments({batchId:created._id}),before);
 assert.equal((await api(student,'POST',`/core/admin/batches/${created._id}/sync-opportunities`,{})).status,403);
});
test('company work period choices and task/diary filters stay within the selected period and ownership',async()=>{
 const Task=require('../src/models/Task');
 const originalStudent=await User.findOne({email:`qa-${run}-work@example.invalid`}),original=await Assignment.findOne({studentUserId:originalStudent._id,batchId:batch._id,activePlacement:true});const originalTask=await Task.findOne({assignmentId:original._id});
 const second=await Batch.create({code:'QA_WORK_'+run,name:'SYNTHETIC QA work second period',type:'engineer',startDate:future(-1),endDate:future(20),registrationOpensAt:future(-5),registrationClosesAt:future(10),status:'open'});
 const student=await actor('student','period-work'),enrollment=await enroll(student,second),o=await Opportunity.create({topicId:opps[4].topicId,companyUserId:company.user._id,batchId:second._id,title:'SYNTHETIC QA period task',companyName:company.user.name,capacity:5,schoolAllocationAllowed:true,kpis:[{title:'Deliver',description:'Test',weightPercent:100,deadline:future(10)}]});
 let a=ok(await api(admin,'POST',`/core/admin/enrollments/${enrollment._id}/assignment`,{version:enrollment.__v,opportunityId:String(o._id),mentorUserId:String(mentor.user._id),startDate:second.startDate.toISOString(),endDate:second.endDate.toISOString(),reason:'SYNTHETIC QA period scope',confirmParticipation:true}),201);
 a=ok(await api(company,'POST',`/core/school/assignments/${a._id}/state`,{state:'active',version:a.__v,reason:'SYNTHETIC QA active period'}));
 const task=ok(await api(company,'POST','/core/tasks',{assignmentId:a._id,title:'SYNTHETIC QA second-period task',priority:'high',dueDate:future(5)}),201),log=ok(await api(company,'POST','/core/worklogs/assign',{assignmentId:a._id,weekNumber:1,title:'SYNTHETIC QA second-period diary',requirement:'Test period filter',priority:'medium',dueDate:future(5)}),201);
 const privatePeriod=await Batch.create({code:'QA_PRIVATE_'+run,name:'SYNTHETIC QA foreign-only period',type:'engineer',startDate:future(-1),endDate:future(20),registrationOpensAt:future(-5),registrationClosesAt:future(10),status:'open'});
 await Opportunity.create({topicId:opps[4].topicId,companyUserId:foreign.user._id,batchId:privatePeriod._id,title:'SYNTHETIC QA foreign period',companyName:foreign.user.name,capacity:5,kpis:[{title:'Deliver',weightPercent:100,deadline:future(10)}]});
 const choices=ok(await api(company,'GET','/core/work/batches?limit=100'));assert.ok(choices.items.some(b=>b._id===String(second._id)));assert.equal(choices.items.some(b=>b._id===String(privatePeriod._id)),false);
 assert.equal((await api(student,'GET','/core/work/batches')).status,403);
 assert.equal(ok(await api(company,'GET',`/core/placements?batchId=${second._id}`)).items[0]._id,a._id);
 const selected=ok(await api(company,'GET',`/core/tasks?batchId=${second._id}`));assert.deepEqual(selected.items.map(t=>t._id),[task._id]);assert.equal(ok(await api(company,'GET',`/core/tasks?batchId=${batch._id}`)).items.some(t=>t._id===task._id),false);
 assert.equal(ok(await api(company,'GET',`/core/tasks?batchId=${batch._id}`)).items.some(t=>t._id===String(originalTask._id)),true);
 assert.deepEqual(ok(await api(company,'GET',`/core/worklogs?batchId=${second._id}`)).items.map(t=>t._id),[log._id]);
 for(const resource of ['tasks','worklogs']){assert.equal(ok(await api(foreign,'GET',`/core/${resource}?batchId=${second._id}`)).total,0);assert.equal((await api(company,'GET',`/core/${resource}?batchId=${second._id}&assignmentId=${original._id}`)).status,400);}
});
test('work roster shows accepted students awaiting formal assignment without granting task rights',async()=>{
 const student=await actor('student','pending-work-student'),e=await enroll(student),accepted=await offer(company,await apply(student,e,opps[4]));
 let rows=ok(await api(company,'GET',`/core/work/students?batchId=${batch._id}&limit=100`)).items.filter(a=>a.studentUserId===String(student.user._id));assert.equal(rows.length,1);assert.equal(rows[0].pendingAssignment,true);assert.equal(rows[0].participantNames.student,student.user.name);
 assert.equal(ok(await api(foreign,'GET',`/core/work/students?batchId=${batch._id}&limit=100`)).items.some(a=>a.studentUserId===String(student.user._id)),false);
 assert.equal((await api(student,'GET',`/core/work/students?batchId=${batch._id}`)).status,403);
 assert.equal((await api(company,'POST','/core/tasks',{assignmentId:rows[0]._id,title:'not yet allowed',dueDate:future(5)})).status,400);
 const enrollment=await Enrollment.findById(e._id);let a=ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/assignment`,{version:enrollment.__v,mentorUserId:String(mentor.user._id),startDate:batch.startDate,endDate:batch.endDate,reason:'SYNTHETIC QA formalize accepted student'}),201);
 rows=ok(await api(company,'GET',`/core/work/students?batchId=${batch._id}&limit=100`)).items.filter(a=>a.studentUserId===String(student.user._id));assert.equal(rows.length,1);assert.equal(rows[0]._id,a._id);assert.equal(rows[0].pendingAssignment,false);
 assert.equal((await api(company,'POST','/core/tasks',{assignmentId:a._id,title:'not active yet',dueDate:future(5)})).status,409);
 a=ok(await api(company,'POST',`/core/school/assignments/${a._id}/state`,{version:a.__v,state:'active',reason:'SYNTHETIC QA start'}));
 ok(await api(company,'POST','/core/tasks',{assignmentId:a._id,title:'SYNTHETIC QA active student work',dueDate:future(5)}),201);assert.equal((await Application.findById(accepted._id)).state,'confirmed');
});
test('real NLP matching respects eligibility/dispatch scope and fails explicitly when unavailable',async()=>{
 const e=await Enrollment.findOne({studentUserId:s2.user._id,batchId:batch._id});
 const result=ok(await api(s2,'POST','/core/school/ai/match',{enrollmentId:String(e._id),engine:'tfidf',topK:5}));assert.equal(result.scope,'own-eligible-period/available-opportunities');assert.equal(result.engine,'tfidf');assert.equal(result.score_is_probability,false);
 const semantic=ok(await api(s2,'POST','/core/school/ai/match',{enrollmentId:String(e._id),engine:'sbert',topK:5}));assert.equal(semantic.engine,'sbert');assert.equal(semantic.model.ready,true);assert.equal(semantic.model.network_inference,false);
 assert.equal((await api(s1,'POST','/core/school/ai/match',{enrollmentId:String(e._id),engine:'tfidf',topK:5})).status,404);
 const ranked=ok(await api(company,'POST','/core/school/ai/rank-applicants',{opportunityId:String(opp._id),engine:'tfidf',topK:5}));assert.equal(ranked.scope,'school-dispatched-company-snapshots');
 assert.equal((await api(foreign,'POST','/core/school/ai/rank-applicants',{opportunityId:String(opp._id),engine:'tfidf',topK:5})).status,404);
 const prior=process.env.NLP_SERVICE_URL;try{process.env.NLP_SERVICE_URL='http://127.0.0.1:65534';const failed=await api(s2,'POST','/core/school/ai/match',{enrollmentId:String(e._id),engine:'tfidf',topK:5});assert.equal(failed.status,503);assert.equal(failed.body.items,undefined);}finally{if(prior)process.env.NLP_SERVICE_URL=prior;else delete process.env.NLP_SERVICE_URL;}
});
test('real local SBT verifies linked wallet, approved minute, report anchors and locked certificate',{skip:process.env.WORKFLOW_SBT_TESTS!=='true',timeout:180000},async()=>{
 const {ethers}=require('ethers'),student=await actor('student','chain'),e=await enroll(student),o=opps[4],wallet=ethers.Wallet.createRandom();
 const challengeResponse=await fetch(base+'/auth/email/wallet-challenge',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+student.token,Origin:'http://localhost:5188'},body:JSON.stringify({password,walletAddress:wallet.address})});assert.equal(challengeResponse.status,200);const challenge=await challengeResponse.json(),cookie=challengeResponse.headers.get('set-cookie').split(';')[0];
 const linkBody={password,challengeId:challenge.challengeId,signature:await wallet.signMessage(challenge.message)};
 const linkedResponse=await fetch(base+'/auth/email/link-wallet',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+student.token,Origin:'http://localhost:5188',Cookie:cookie},body:JSON.stringify(linkBody)});assert.equal(linkedResponse.status,200);student.token=(await linkedResponse.json()).token;
 assert.equal((await User.findById(student.user._id)).walletVerified,true);assert.equal((await User.findById(student.user._id)).walletLinkVersion,1);
 let a=ok(await api(admin,'POST',`/core/admin/enrollments/${e._id}/assignment`,{version:e.__v,opportunityId:String(o._id),mentorUserId:String(mentor.user._id),startDate:batch.startDate,endDate:batch.endDate,confirmParticipation:true,reason:'SYNTHETIC QA chain assignment'}),201);
 a=ok(await api(company,'POST',`/core/school/assignments/${a._id}/state`,{version:a.__v,state:'active',reason:'SYNTHETIC QA start'}));
 const work=ok(await api(student,'POST','/core/time/check-in',{assignmentId:a._id,requestKey:crypto.randomUUID()}),201);const started=Date.now();
 console.log('SBT QA: real clock check-in running for one minute; no invented working hours.');
 a=ok(await api(student,'POST',`/core/placements/${a._id}/kpis/0/submit`,{version:a.__v,content:'SYNTHETIC QA delivery'}));
 a=ok(await api(company,'POST',`/core/placements/${a._id}/kpis/0/evaluate`,{version:a.__v,status:'approved',score:90,feedback:'SYNTHETIC QA inspected'}));
 let report=ok(await api(student,'POST','/core/reports',{assignmentId:a._id,kind:'final',title:'SYNTHETIC QA final',content:'SYNTHETIC QA content for real chain verification'}),201);
 for(const who of [company,mentor])report=ok(await api(who,'POST',`/core/reports/${report._id}/reviews`,{version:report.__v,decision:'approved',score:90,comment:'SYNTHETIC QA approval'}));
 report=ok(await api(admin,'POST',`/core/reports/${report._id}/approve`,{version:report.__v,reason:'SYNTHETIC QA school approved'}));
 const reportProof=ok(await api(admin,'POST',`/core/web3/reports/${report._id}/anchor`,{}));assert.equal(reportProof.state,'confirmed');
 while(Date.now()-started<61000)await new Promise(resolve=>setTimeout(resolve,Math.min(1000,61000-(Date.now()-started))));
 let workEnded=ok(await api(student,'POST',`/core/time/${work._id}/check-out`,{version:work.__v}));assert.ok(workEnded.minutes>=1&&workEnded.minutes<=2);
 workEnded=ok(await api(company,'PATCH',`/core/time/${work._id}/review`,{version:workEnded.__v,decision:'approved',reason:'SYNTHETIC QA actual test interval, not labor evidence'}));
 const timeProof=ok(await api(company,'POST',`/core/web3/time/${work._id}/anchor`,{}));assert.equal(timeProof.state,'confirmed');
 a=ok(await api(admin,'POST',`/core/school/assignments/${a._id}/state`,{version:a.__v,state:'completed',reason:'SYNTHETIC QA completed workflow'}));
 const completion=ok(await api(admin,'POST',`/core/web3/placements/${a._id}/complete`,{})),mint=ok(await api(admin,'POST',`/core/web3/placements/${a._id}/mint`,{}));assert.equal(completion.state,'confirmed');assert.equal(mint.state,'confirmed');
 const retry=ok(await api(admin,'POST',`/core/web3/placements/${a._id}/mint`,{}));assert.equal(retry.txHash,mint.txHash);
 const proof=ok(await api(student,'GET',`/core/web3/placements/${a._id}/certificate`));assert.equal(proof.verified,true);assert.equal(proof.locked,true);assert.equal(proof.owner,wallet.address.toLowerCase());assert.equal((await api(foreign,'GET',`/core/web3/placements/${a._id}/certificate`)).status,404);
 const file='contracts/node_modules/.cache/workflow-b-20261106-205837/sbt-qa-result.json';require('fs').writeFileSync(file,JSON.stringify({at:new Date().toISOString(),testOnly:true,assignmentId:a._id,realElapsedMs:Date.now()-started,approvedTestMinutes:workEnded.minutes,reportProof,timeProof,completion,mint,certificate:proof},null,2));
});

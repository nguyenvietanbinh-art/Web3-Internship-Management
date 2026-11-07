// Writes only to the exact isolated replica-set QA database; never deletes data.
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',WEB3_LOCAL_ENABLED:'false',WORKFLOW_CLOCK_TESTS:'true',MONGODB_URI:'mongodb://127.0.0.1:27018/internova_role_qa_20261107?replicaSet=internovaTestRs',JWT_SECRET:require('crypto').randomBytes(32).toString('hex'),CORS_ORIGIN:'http://localhost:5189',DEMO_MODE:'false',PINATA_JWT:''});
process.env.WORKFLOW_TEST_URI_ALLOWLIST=process.env.MONGODB_URI;
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),mongoose=require('mongoose');
mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const {createApp}=require('../src/app'),User=require('../src/models/User'),Topic=require('../src/models/Topic'),{CV,Report,InternshipBatch:Batch}=require('../src/models/BusinessModels');
const {Enrollment,Opportunity,Application}=require('../src/workflow/models'),svc=require('../src/workflow/service'),q=require('../src/workflow/queries'),{quota}=require('../src/workflow/applicationQuota');
const {signToken}=require('../src/services/authService'),{ensureProfile}=require('../src/services/accountProfiles');
const run=Date.now().toString(36),id=x=>String(x._id),future=d=>new Date(Date.now()+d*86400000),iso=d=>future(d).toISOString();
let server,base,admin,company,mentor,foreign,batch,hash,password;const created={};
async function actor(role,label){const u=await User.create({name:'SYNTHETIC QA '+label,role,email:`${run}-${label}@example.invalid`,loginEmail:`${run}-${label}@example.invalid`,passwordHash:hash});await ensureProfile(u);if(role==='student')await CV.create({ownerUserId:u._id,title:'CV '+label,summary:'Develop accessible React web applications',skills:['React','JavaScript']});return u;}
async function enrollment(u,b=batch){return Enrollment.create({studentUserId:u._id,batchId:b._id,registeredAt:new Date()});}
async function opportunity(label,capacity=1,b=batch){const t=await Topic.create({companyUserId:company._id,companyName:company.name,title:'SYNTHETIC '+label+run,description:'Develop React application',requiredSkills:['React','JavaScript'],kpis:[{milestoneIndex:0,title:'Deliver',description:'Implement and test application',weightPercent:100,deadline:new Date((+b.startDate + +b.endDate)/2)}]});return Opportunity.create({topicId:t._id,companyUserId:company._id,batchId:b._id,title:t.title,description:t.description,companyName:company.name,capacity,schoolAllocationAllowed:true,kpis:t.kpis.map(k=>k.toObject())});}
async function apply(u,e,o){return (await svc.apply(u,id(e),{opportunityId:id(o)})).application;}
const accept=a=>svc.decision(company,id(a),{version:a.__v,state:'offered',reason:'SYNTHETIC QA acceptance'});
async function api(u,method,path,body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(u?{Authorization:'Bearer '+signToken(u,'password')}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
before(async()=>{
 const guard=require('../src/config/workflowTestGuard').assertWorkflowTest();assert.equal(guard.database,'internova_role_qa_20261107');
 await mongoose.connect(guard.uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:5000});assert.equal(mongoose.connection.name,guard.database);assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const db=mongoose.connection.db,collections=await db.listCollections().toArray(),marker=collections.length?await db.collection('qa_safety_marker').findOne({_id:'role-workflow'}):null;
 if(collections.length&&!marker)throw Error('Refusing non-empty unmarked database');
 if(!collections.length)await db.collection('qa_safety_marker').insertOne({_id:'role-workflow',purpose:'Isolated synthetic tests, no deletes',createdAt:new Date()});
 const app=createApp();for(const model of Object.values(mongoose.models)){await model.createCollection();await model.createIndexes();}
 password=require('crypto').randomBytes(24).toString('hex');hash=await require('bcryptjs').hash(password,12);
 admin=await actor('admin','admin');company=await actor('company','company');mentor=await actor('mentor','mentor');foreign=await actor('company','foreign');
 batch=await Batch.create({code:'ROLE_QA_'+run,name:'Thực tập cử nhân — kiểm thử cô lập '+run,type:'bachelor',status:'open',startDate:future(-2),endDate:future(40),registrationOpensAt:future(-10),registrationClosesAt:future(30)});
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve)});base=`http://127.0.0.1:${server.address().port}/api`;
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await mongoose.disconnect();});
test('last seat is atomic; pending histories refund once, retries preserve all counters',async()=>{
 const a=await actor('student','a'),b=await actor('student','b'),c=await actor('student','c'),ea=await enrollment(a),eb=await enrollment(b),ec=await enrollment(c),o=await opportunity('last-seat'),other=await opportunity('unrelated',5);
 const aa=await apply(a,ea,o),ab=await apply(b,eb,o),ac=await apply(c,ec,o),unrelated=await apply(c,ec,other);
 const withdrawnStudent=await actor('student','withdrawn-full'),rejectedStudent=await actor('student','rejected-full'),ew=await enrollment(withdrawnStudent),er=await enrollment(rejectedStudent),aw=await apply(withdrawnStudent,ew,o),ar=await apply(rejectedStudent,er,o);
 await svc.withdraw(withdrawnStudent,id(aw),{version:aw.__v,reason:'QA withdrawal'});await svc.decision(company,id(ar),{version:ar.__v,state:'rejected',reason:'QA rejection'});
 const anotherPeriod=await Batch.create({code:'SEPARATE_'+run,name:'Thực tập kỹ sư — kỳ khác',type:'engineer',status:'open',startDate:future(20),endDate:future(60),registrationOpensAt:future(-1),registrationClosesAt:future(13)});
 const otherPeriodOpportunity=await Opportunity.create({topicId:o.topicId,batchId:anotherPeriod._id,companyUserId:company._id,title:o.title,companyName:company.name,capacity:1,kpis:o.kpis});
 const attempts=await Promise.allSettled([accept(aa),accept(ab)]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
 const winning=attempts[0].status==='fulfilled'?aa:ab,winner=await accept(winning);assert.equal(winner.state,'confirmed');
 const full=await Opportunity.findById(o._id);assert.equal(full.confirmedCount,1);assert.equal(full.status,'closed');assert.equal(full.closureReason,'capacity_full');
 for(const app of [aa,ab,ac].filter(x=>id(x)!==id(winning))){const fresh=await Application.findById(app._id);assert.equal(fresh.state,'closed_full');assert.ok(fresh.quotaRefundedAt);assert.equal(fresh.closeReason,'Đề tài đã đủ chỉ tiêu');const e=await Enrollment.findById(fresh.enrollmentId);assert.equal(e.refundedOpportunities.length,1);assert.ok(e.usedOpportunities.some(x=>String(x)===id(o)));}
 assert.equal((await Application.findById(unrelated._id)).state,'dispatched');assert.equal(quota(await Enrollment.findById(ec._id)).applicationCount,1);
 assert.equal((await Application.findById(aw._id)).state,'withdrawn');assert.equal((await Application.findById(ar._id)).state,'rejected');assert.equal(quota(await Enrollment.findById(ew._id)).applicationCount,1);assert.equal(quota(await Enrollment.findById(er._id)).refundedCount,0);assert.equal((await Opportunity.findById(otherPeriodOpportunity._id)).status,'open');assert.equal((await Topic.findById(o.topicId)).status,'open');
 assert.equal((await q.mine(c)).items[0].refundedCount,1);assert.equal((await q.opportunities(c,id(ec),{})).items.some(x=>id(x)===id(o)),false);
 assert.equal((await api(c,'POST',`/core/my/internships/${id(ec)}/applications`,{opportunityId:id(o)})).status,409);
 const newO=await opportunity('refunded-use',5);await apply(c,ec,newO);assert.equal(quota(await Enrollment.findById(ec._id)).applicationCount,2);
 assert.equal((await api(company,'GET','/core/company/applications/'+id(ac))).status,404);
 const notices=await api(c,'GET','/core/notifications?limit=100');assert.ok(notices.body.items.some(n=>n.message.includes('hoàn 1 lượt')));
 created.full=full;created.winner=winning;
});
test('withdrawal and rejection do not refund; fourth concurrent request is denied',async()=>{
 const u=await actor('student','limit'),e=await enrollment(u),os=await Promise.all([0,1,2,3].map(n=>opportunity('limit'+n,5)));
 const attempts=await Promise.allSettled(os.map(o=>apply(u,e,o)));assert.equal(attempts.filter(x=>x.status==='fulfilled').length,3);
 const apps=await Application.find({enrollmentId:e._id});await svc.withdraw(u,id(apps[0]),{version:apps[0].__v,reason:'withdraw'});await svc.decision(company,id(apps[1]),{version:apps[1].__v,state:'rejected',reason:'not suitable'});
 const fresh=await Enrollment.findById(e._id);assert.equal(quota(fresh).applicationCount,3);assert.equal(quota(fresh).refundedCount,0);
});
test('failed school allocation rolls back last-seat closing and refunds',async()=>{
 const a=await actor('student','rollback-a'),b=await actor('student','rollback-b'),ea=await enrollment(a),eb=await enrollment(b),o=await opportunity('rollback');const ab=await apply(b,eb,o);
 await assert.rejects(svc.assign(admin,id(ea),{version:ea.__v,opportunityId:id(o),mentorUserId:id(foreign),startDate:iso(-2),endDate:iso(35),reason:'invalid mentor'}));
 const fresh=await Opportunity.findById(o._id);assert.equal(fresh.confirmedCount,0);assert.equal(fresh.status,'open');assert.equal((await Application.findById(ab._id)).state,'dispatched');assert.equal((await Enrollment.findById(eb._id)).refundedOpportunities.length,0);assert.equal((await Enrollment.findById(ea._id)).admission,null);
});
test('capacity updates never reopen automatically; explicit reopen requires reason, free seats and window',async()=>{
 let o=await Opportunity.findById(created.full._id);o=await svc.updateOpportunity(company,id(o),{version:o.__v,capacity:2});assert.equal(o.status,'closed');
 await assert.rejects(svc.updateOpportunity(company,id(o),{version:o.__v,status:'open'}));
 o=await svc.updateOpportunity(company,id(o),{version:o.__v,status:'open',reason:'Approved additional seat'});assert.equal(o.status,'open');assert.equal(o.closureReason,'');
 assert.equal((await Application.findById(created.winner._id)).state,'confirmed');
});
test('company AI endpoints are retired, role boundaries remain enforced',async()=>{
 for(const path of ['/core/school/ai/rank-applicants','/core/ai/rank-applicants'])for(const u of [company,mentor,admin])assert.equal((await api(u,'POST',path,{})).status,403);
 assert.equal((await api(company,'GET','/core/admin/batches')).status,403);assert.equal((await api(mentor,'GET','/core/company/applications')).status,403);
});
test('reports enforce ownership and staff scope; admin receives linked context and search',async()=>{
 const u=await actor('student','report-owner'),outsider=await actor('student','report-outsider'),foreignMentor=await actor('mentor','foreign-mentor'),e=await enrollment(u),o=await opportunity('reports',5);
 await accept(await apply(u,e,o));const fresh=await Enrollment.findById(e._id),a=await svc.assign(admin,id(e),{version:fresh.__v,mentorUserId:id(mentor),startDate:iso(-1),endDate:iso(35),reason:'QA report supervision'});
 await svc.transition(company,id(a),{version:a.__v,state:'active',reason:'QA start'});
 const Student=require('../src/models/Student');await Student.updateOne({userId:u._id},{$set:{studentCode:'2999'+String(Date.now()).slice(-6)}});
 const result=await api(u,'POST','/core/reports',{assignmentId:id(a),kind:'weekly',title:'Báo cáo tuần thử nghiệm',content:'Đã xây dựng giao diện React và kiểm tra biểu mẫu. Cần bổ sung kết quả kiểm thử và minh chứng.'});assert.equal(result.status,201,JSON.stringify(result.body));const report=result.body;
 for(const who of [outsider,foreign,foreignMentor]){assert.equal((await api(who,'GET','/core/reports?assignmentId='+id(a))).status,404);assert.equal((await api(who,'POST','/core/reports/'+report._id+'/reviews',{score:80,decision:'approved',comment:'bad',version:0})).status,who.role==='student'?403:404);}
 assert.equal((await api(outsider,'POST','/core/reports',{assignmentId:id(a),kind:'weekly',title:'attack',content:'attack'})).status,404);
 for(const who of [u,company,mentor,admin]){const r=await api(who,'GET','/core/reports?assignmentId='+id(a));assert.equal(r.status,200);assert.equal(r.body.items[0].context.studentName,u.name);assert.equal(r.body.items[0].context.companyName,company.name);assert.equal(r.body.items[0].context.mentorName,mentor.name);assert.ok(r.body.items[0].context.studentCode);assert.equal(r.body.items[0].context.batchName,batch.name);}
 const search=await api(admin,'GET','/core/reports?q='+encodeURIComponent(u.name));assert.ok(search.body.items.some(r=>r._id===report._id));
 const artifact=await require('../src/models/Web3Models').PrivateReportArtifact.create({reportId:report._id,ownerUserId:u._id,source:'attachment',plaintextHash:require('crypto').createHash('sha256').update('QA').digest('hex'),ciphertextHash:'unverified',mime:'application/pdf',bytes:2,keyId:'QA-NOT-VERIFIED',envelope:Buffer.from('Unverified QA fixture; never decrypt or expose'),state:'failed',errorCode:'QA_UPLOAD_NOT_PERFORMED'});
 for(const who of [outsider,foreign,foreignMentor]){assert.equal((await api(who,'GET','/core/web3/reports/'+report._id+'/artifacts')).status,404);assert.equal((await api(who,'GET','/core/web3/artifacts/'+id(artifact)+'/file')).status,404);}
 for(const who of [u,company,mentor,admin])assert.equal((await api(who,'GET','/core/web3/artifacts/'+id(artifact)+'/file')).status,409);
 const artifacts=await api(u,'GET','/core/web3/reports/'+report._id+'/artifacts');assert.equal(artifacts.status,200);assert.equal(artifacts.body.items[0].state,'failed');assert.equal(artifacts.body.items[0].envelope,undefined);
 created.report=report;created.reportOwner=u;created.reportAssignment=a;
});
test('report insertion failure preserves the previous current report in a transaction',async()=>{
 const before=await Report.findById(created.report._id).lean(),create=Report.create;let attempted=false;
 Report.create=async function(){attempted=true;throw Error('Injected insert failure (QA only)');};
 try{const r=await api(created.reportOwner,'POST','/core/reports',{assignmentId:id(created.reportAssignment),kind:'weekly',title:'Fault test',content:'This insert must fail without superseding the current report.'});assert.equal(r.status,500);assert.ok(attempted);}finally{Report.create=create;}
 assert.deepEqual(await Report.findById(created.report._id).lean(),before);
});
test('report reviews require explicit validation and confirmation; read-only analysis does not save points',async()=>{
 const r=created.report,path='/core/reports/'+r._id+'/reviews';assert.equal((await api(mentor,'POST',path,{score:101,comment:'bad',decision:'approved',version:r.__v})).status,400);
 const saved=await api(mentor,'POST',path,{score:67,comment:'Cần làm rõ kết quả, kiểm thử và sản phẩm. Đã đọc bài trước khi xác nhận.',decision:'approved',version:r.__v});assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.reviews[0].score,67);assert.equal(saved.body.finalScore,null);
 assert.equal((await api(mentor,'POST',path,{score:90,comment:'retry',decision:'approved',version:r.__v})).status,409);
});
test('student search covers company, content and requirements without crossing periods',async()=>{
 const u=await actor('student','search'),e=await enrollment(u),o=await opportunity('searchable',5);
 let r=await q.opportunities(u,id(e),{q:company.name,skill:'React',limit:'10'});assert.ok(r.total>0);assert.ok(r.items.every(x=>String(x.batchId)===id(batch)&&x.requiredSkills.includes('React')));
 assert.equal((await q.opportunities(u,id(e),{q:'no-such-topic-'+run})).total,0);
 assert.equal((await api(u,'GET',`/core/my/internships/${id(e)}/opportunities?q[$ne]=x`)).status,400);
 created.searchStudent=u;created.searchEnrollment=e;created.searchOpportunity=o;
});
test('synthetic CV cohort verifies exactly two full skill matches without manipulating similarity',async()=>{
 const b=await Batch.create({code:'SKILLS_'+run,name:'Thực tập kỹ sư — Học kỳ II, năm học 2026–2027',type:'engineer',status:'open',startDate:future(20),endDate:future(80),registrationOpensAt:future(-1),registrationClosesAt:future(13)});
 const profiles=[{name:'Nguyễn Hoàng Nam',skills:['Go','Gin','PostgreSQL'],gpa:3.1},{name:'Trần Ngọc Mai',skills:['Go'],gpa:2.8},{name:'Lê Minh Khoa',skills:['React','JavaScript','CSS','HTML','Git','Figma','Python','Pandas'],gpa:3.4},{name:'Phạm Gia Hân',skills:['Excel','PowerPoint'],gpa:2.6}];
 const students=[];for(const [i,p]of profiles.entries()){
  const code='28'+String(Date.now()).slice(-6)+String(i).padStart(2,'0'),u=await User.create({name:p.name,role:'student',email:code+'@gmail.com',loginEmail:code+'@gmail.com',passwordHash:await require('bcryptjs').hash(code,12),skills:p.skills,gpa:p.gpa});await ensureProfile(u);await require('../src/models/Student').updateOne({userId:u._id},{$set:{studentCode:code,skills:p.skills,gpa:p.gpa,major:'Công nghệ thông tin'}});
  await CV.create({ownerUserId:u._id,title:'CV thực tập của '+p.name,summary:i===0?'Đã thực hành viết API quản lý thư viện bằng Go, Gin và PostgreSQL trong học phần lập trình web; mong muốn cải thiện kiểm thử và làm việc nhóm.':i===1?'Mới học ngôn ngữ Go, chưa có kinh nghiệm làm API và cơ sở dữ liệu.':i===2?'Đã làm giao diện React và thực hành xử lý dữ liệu bằng Python trong bài tập nhóm.':'Đã thực hành bảng tính Excel, làm thuyết trình; chưa học phát triển phần mềm chuyên sâu.',skills:p.skills,gpa:p.gpa,education:'Sinh viên Công nghệ thông tin',experience:'Bài tập học phần; chưa có kinh nghiệm làm việc chính thức'});const e=await enrollment(u,b);students.push({u,e,code});
 }
 const requirements=[['Go','Gin'],['Go','PostgreSQL'],['Java','Spring'],['React','TypeScript'],['Python','PyTorch']];
 for(const [i,skills]of requirements.entries()){const t=await Topic.create({companyUserId:company._id,companyName:company.name,title:['API quản lý thư viện','Dịch vụ báo cáo dữ liệu','Hệ thống đặt lịch Java','Giao diện quản trị React','Nhận diện văn bản'][i],description:'Phân tích yêu cầu, xây dựng và kiểm thử ứng dụng với '+skills.join(', ')+'. Đây là tình huống tổng hợp cho kiểm thử.',requiredSkills:skills,kpis:[{milestoneIndex:0,title:'Bàn giao chức năng',description:'Viết chức năng, kiểm thử và báo cáo kết quả',weightPercent:100,deadline:future(60)}]});await Opportunity.create({topicId:t._id,batchId:b._id,companyUserId:company._id,title:t.title,companyName:company.name,description:t.description,capacity:3,kpis:t.kpis.map(k=>k.toObject()),schoolAllocationAllowed:true,history:[svc.event(admin,'synthetic_fixture_created',{source:'role-workflow.integration.test.js',expertLabel:false})]});}
 const catalog=await q.opportunities(students[0].u,id(students[0].e),{limit:'100'}),compare=require('../src/workflow/skillComparison').compare;
 const full=catalog.items.filter(o=>compare(profiles[0].skills,o.requiredSkills).missing_required_skills.length===0);assert.equal(full.length,2);
 for(const engine of ['tfidf','sbert']){const result=await api(students[0].u,'POST','/core/school/ai/match',{enrollmentId:id(students[0].e),engine,topK:5});assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.engine,engine);assert.equal(result.body.score_is_probability,false);assert.equal(result.body.items.length,5);assert.ok(result.body.items.some(r=>r.matched_skills?.length>0));}
 created.capabilityStudent=students[0];created.capabilityBatch=b;
});
test('closed-period report exercises preserve official grades and provide realistic full/partial/brief forms',async()=>{
 const Assignment=require('../src/models/Assignment'),Student=require('../src/models/Student'),b=await Batch.create({code:'CLOSED_'+run,name:'Thực tập cử nhân — Học kỳ II, năm học 2025–2026',type:'bachelor',status:'closed',startDate:future(-150),endDate:future(-60),registrationOpensAt:future(-180),registrationClosesAt:future(-157)});
 const examples=[];
 for(let i=0;i<3;i++){
  const u=await actor('student','completed-'+i),e=await enrollment(u,b),o=await opportunity('completed-'+i,3,b),st=await Student.findOne({userId:u._id});
  const a=await Assignment.create({topicId:o.topicId,studentId:st._id,workflow:true,activePlacement:true,studentBatchKey:id(b)+':'+id(u),enrollmentId:e._id,opportunityId:o._id,batchId:b._id,studentUserId:u._id,companyUserId:company._id,mentorUserId:mentor._id,topicSnapshot:{title:o.title,companyName:company.name},lifecycle:'completed',assignedAt:b.startDate,startDate:b.startDate,endDate:b.endDate,kpiAtAssign:100,kpiScore:70,kpis:[{milestoneIndex:0,title:'Bàn giao giao diện',description:'Hoàn thiện form React',weightPercent:100,deadline:future(-65),status:'approved',score:70}]});
  e.registeredAt=new Date(+b.registrationOpensAt+86400000);e.admission={opportunityId:o._id,companyUserId:company._id,state:'active',confirmedAt:b.startDate,allocationId:require('crypto').randomUUID(),title:o.title,companyName:company.name};e.assignmentId=a._id;await e.save();o.confirmedCount=1;await o.save();
  const sections=['1. Mục tiêu và phạm vi\nThực hiện giao diện đăng ký thực tập bằng React theo yêu cầu quản lý hồ sơ. Phạm vi là bài tập nội bộ tổng hợp, không phải hệ thống khách hàng.', '2. Phân tích và thiết kế\nPhân tích các trường thông tin, thiết kế biểu mẫu và luồng kiểm tra dữ liệu. Phương pháp thực hiện là chia component, xử lý lỗi nhập và kiểm thử từng trường.', '3. Kết quả và bàn giao\nĐã trình bày luồng nhập hồ sơ và thông báo lỗi. Chưa có liên kết sản phẩm để kiểm chứng; cần giảng viên xem mã nguồn và đối chiếu chức năng trước khi xác nhận chất lượng.', '4. Kiểm thử và minh chứng\nKịch bản cần kiểm tra: bỏ trống tên, email sai và nhập đúng. Chưa đính kèm ảnh hoặc biên bản kiểm thử nên không coi các kịch bản này là bằng chứng đã chạy.', '5. Nhật ký và tiến độ\nNội dung là bài tập đánh giá lại của một kỳ đã kết thúc. Chưa có giờ được doanh nghiệp xác nhận trong fixture này; không tạo số giờ giả để đạt yêu cầu.', '6. Khó khăn và bài học\nKhó khăn là quản lý trạng thái biểu mẫu. Giải pháp đề xuất là tách trạng thái theo trường và viết kiểm thử. Bài học: cần ghi lại kết quả thực tế. Kế hoạch cải tiến là bổ sung kiểm thử và hồ sơ bàn giao.', '7. Tài liệu tham khảo và kết luận\nNguồn: nội dung tổng hợp do công cụ tạo cho kiểm thử nghiệp vụ Internova; không sử dụng bài nộp hoặc nhãn chuyên gia. Kết luận: đây là tài liệu dùng thực hành đọc, phát hiện thiếu minh chứng và chấm lại.'];
  const content=(i===0?sections:i===1?sections.filter((_,n)=>![2,3].includes(n)):[sections[0],'Chưa trình bày kết quả, kiểm thử hoặc minh chứng. Cần bổ sung báo cáo.']).join('\n\n');
  const exampleScore=[70,45,25][i];
  const report=await Report.create({...require('../src/services/businessIdentity').participants(a),assignmentId:a._id,kind:'final',version:1,current:true,title:'[Tổng hợp] '+['Báo cáo đầy đủ cấu trúc','Báo cáo thiếu kết quả và minh chứng','Báo cáo sơ lược'][i],content,state:'approved',createdAt:b.endDate,updatedAt:b.endDate,approvedAt:b.endDate,approvedByUserId:admin._id,finalScore:exampleScore,reviews:[company,mentor].map(actor=>({role:actor.role,actorUserId:actor._id,score:exampleScore,decision:'approved',comment:'Điểm tình huống kiểm thử tổng hợp; không phải đánh giá của giảng viên hoặc doanh nghiệp thật.',at:b.endDate})),history:[{...svc.event(admin,'synthetic_fixture_created',{officialReview:false,expertLabel:false,source:'role-workflow.integration.test.js'})},{...svc.event(admin,'synthetic_fixture_created') ,action:'fixture.report_prepared'}]});
  const before=await Report.findById(report._id).lean();assert.equal((await api(mentor,'GET','/core/reports/'+id(report)+'/practice')).status,200);assert.deepEqual(await Report.findById(report._id).lean(),before);examples.push({reportId:id(report),student:id(u),variant:i});
 }
 created.completedExamples=examples;
});
test('publish local QA session metadata for reproducible browser checks',async()=>{
 const fs=require('fs'),path=require('path'),out=path.resolve('contracts/node_modules/.cache/role-workflow-qa-20261107');fs.mkdirSync(out,{recursive:true});
 const users={admin,company,mentor,student:created.reportOwner,searchStudent:created.searchStudent},accounts={};
 for(const [role,u]of Object.entries(users)){const login=await api(null,'POST','/auth/email/login',{email:u.email,password});assert.equal(login.status,200,JSON.stringify(login.body));accounts[role]={email:u.email,password,userId:id(u)};}
 const c=created.capabilityStudent;accounts.capabilityStudent={email:c.u.email,password:c.code,userId:id(c.u)};
 fs.writeFileSync(path.join(out,'accounts.json'),JSON.stringify({synthetic:true,database:'internova_role_qa_20261107',accounts,batchId:id(batch),reportId:created.report._id,assignmentId:id(created.reportAssignment),enrollmentId:id(created.searchEnrollment),capabilityEnrollmentId:id(c.e),capabilityBatchId:id(created.capabilityBatch),completedExamples:created.completedExamples},null,2));
 fs.writeFileSync(path.join(out,'manual-login-qa.txt'),'TAI KHOAN TEST TONG HOP — localhost:5189; khong phai tai khoan nguoi that. Khong commit file nay.\n\n'+Object.entries(accounts).map(([role,a])=>`${role}\nEmail: ${a.email}\nPassword: ${a.password}\n`).join('\n'));
});

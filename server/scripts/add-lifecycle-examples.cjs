// Additive, synthetic business examples. Not production data or evidence of E2E success.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
const resultFile=path.join(dir,'lifecycle-examples-result.json'),run='school-year-examples-20261107';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',CHAIN_LISTENER_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const User=require('../src/models/User'),Student=require('../src/models/Student'),Assignment=require('../src/models/Assignment'),Task=require('../src/models/Task'),Log=require('../src/models/WorkLog');
const {CV,InternshipBatch:Batch,Report,WorkSession}=require('../src/models/BusinessModels');
const {Enrollment,Opportunity,Application}=require('../src/workflow/models'),bcrypt=require('bcryptjs');
const id=()=>new mongoose.Types.ObjectId(),date=s=>new Date(s),history=(actor,action,data={})=>({actorUserId:actor._id,actorRole:actor.role,action:'fixture.'+action,at:new Date(),data:{synthetic:true,run,...data}});
const bson=require('mongodb').BSON,protectedModels=[User,Student,CV,Batch,Enrollment,Opportunity,Application,Assignment,Task,Log,Report,WorkSession];
async function snapshot(){const rows=[];for(const m of protectedModels)for await(const row of m.collection.find())rows.push({collection:m.collection.name,id:row._id,hash:crypto.createHash('sha256').update(bson.serialize(row)).digest('hex')});return rows;}
(async()=>{
 if(fs.existsSync(resultFile))throw Error('Completed fixture exists; refuse rerun');
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'demo-ready.json'),'utf8')).uri,uri);
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:8000});assert.equal(mongoose.connection.db.databaseName,database);assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 await require('../src/services/databaseSafety').verifyIndexes(true);
 const admin=await User.findOne({loginEmail:'school-1@example.invalid',role:'admin'});assert.ok(admin);
 const existingBatch=await Batch.findOne({code:'DEMO_CN_2026',status:'open'});assert.ok(existingBatch);
 assert.ok(new Date()<existingBatch.registrationClosesAt,'Recruitment fixture requires currently open registration');
 const codes=['CN_HK1_2026_2027_EXAMPLES','CN_HK2_2025_2026_EXAMPLES'];
 assert.equal(await Batch.countDocuments({code:{$in:codes}}),0,'Never recreate previously committed fixture');
 const families=['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương'];
 const names=['Minh Anh','Quốc Bảo','Ngọc Châu','Tuấn Duy','Hải Đăng','Thu Giang'];
 const stages=['eligible','registered','applied','accepted_needs_mentor','active','completed'];
 const specs=[];
 for(let c=1;c<=12;c++){
  const company=await User.findOne({loginEmail:`enterprise-${c}@example.invalid`,role:'company',disabled:{$ne:true}}).select('+loginEmail'),mentor=await User.findOne({loginEmail:`lecturer-${c}@example.invalid`,role:'mentor',disabled:{$ne:true}}).select('+loginEmail');assert.ok(company&&mentor);
  const topic=await require('../src/models/Topic').findOne({companyUserId:company._id}).sort({_id:1});assert.ok(topic);
  const recruiting=await Opportunity.findOne({companyUserId:company._id,batchId:existingBatch._id,status:'open',$expr:{$lt:['$confirmedCount','$capacity']}}).sort({_id:-1});assert.ok(recruiting);
  for(let n=0;n<6;n++){const studentCode='2311'+String((c-1)*6+n+1).padStart(6,'0');specs.push({company,mentor,topic,recruiting,n,stage:stages[n],studentCode,email:studentCode+'@gmail.com',name:families[c-1]+' '+names[n],passwordHash:await bcrypt.hash(studentCode,12)});}
 }
 assert.equal(await User.countDocuments({loginEmail:{$in:specs.map(s=>s.email)}}),0,'Account exists; no overwrites');
 const before=await snapshot();fs.writeFileSync(path.join(dir,'lifecycle-examples-before.json'),JSON.stringify(before,null,2));
 let rows=[],batchRows=[];
 await mongoose.connection.transaction(async session=>{
  rows=[];batchRows=[];
  async function create(Model,doc){const [saved]=await Model.create([doc],{session});return saved;}
  for(const [i,s]of [{code:codes[0],name:'Thực tập cử nhân — Học kỳ I, năm học 2026–2027',start:'2026-10-01T01:00:00Z',end:'2026-12-31T10:00:00Z',status:'open'},{code:codes[1],name:'Thực tập cử nhân — Học kỳ II, năm học 2025–2026',start:'2026-06-01T01:00:00Z',end:'2026-08-31T10:00:00Z',status:'closed'}].entries()){
   batchRows.push(await create(Batch,{...s,type:'bachelor',startDate:date(s.start),endDate:date(s.end),registrationOpensAt:date(i?'2026-05-01T00:00:00Z':'2026-09-01T00:00:00Z'),registrationClosesAt:date(s.start),history:[history(admin,'historical_period_prepared')]}));
  }
  for(const s of specs){
   const skills=s.n%2?['Java','Spring Boot','SQL']:['React','Node.js','MongoDB'];
   const user=await create(User,{name:s.name,role:'student',email:s.email,loginEmail:s.email,passwordHash:s.passwordHash,skills,bio:'Hồ sơ tổng hợp phục vụ kiểm thử đồ án; không phải danh tính người thật.',identityHistory:[{action:'synthetic.school.provisioned',at:new Date()}]});
   const student=await create(Student,{userId:user._id,fullName:s.name,studentCode:s.studentCode,university:'Đại học Internova (dữ liệu tổng hợp)',major:'Công nghệ thông tin',gpa:3.2});
   await create(CV,{ownerUserId:user._id,title:'CV thực tập — '+s.name,summary:`Sinh viên lập trình ${skills.join(', ')}. Đã thực hành xây dựng website, kiểm thử API và thiết kế cơ sở dữ liệu. Hồ sơ tổng hợp phục vụ đồ án.`,skills,education:'Sinh viên ngành Công nghệ thông tin',experience:'Đồ án nhóm: website quản lý bán hàng, phân quyền và báo cáo.',university:'Đại học Internova (dữ liệu tổng hợp)',gpa:3.2,history:[history(user,'cv_prepared')]});
   const b=s.n<4?existingBatch:batchRows[s.n===4?0:1];
   let o=s.recruiting;
   if(s.n>=4){const span=b.endDate-b.startDate;o=await create(Opportunity,{topicId:s.topic._id,companyUserId:s.company._id,batchId:b._id,title:s.topic.title,companyName:s.company.companyName||s.company.name,description:s.topic.description,capacity:6,confirmedCount:1,status:s.n===5?'closed':'open',schoolAllocationAllowed:true,kpis:[{title:'Phân tích và thiết kế',description:'Thiết kế dữ liệu, API và giao diện.',weightPercent:30,deadline:new Date(b.startDate.getTime()+span*.3)},{title:'Triển khai và kiểm thử',description:'Hoàn thành các chức năng và báo cáo kiểm thử.',weightPercent:70,deadline:new Date(b.startDate.getTime()+span*.85)}],history:[history(s.company,'opportunity_prepared')]});}
   const admitted=s.n>=3,assigned=s.n>=4;
   const e=await create(Enrollment,{studentUserId:user._id,batchId:b._id,registeredAt:s.n?new Date(b.registrationOpensAt.getTime()+86400000):null,usedOpportunities:s.n>=2?[o._id]:[],history:[history(admin,'enrollment_prepared',{stage:s.stage})]});
   let app=null;
   if(s.n>=2){app=await create(Application,{enrollmentId:e._id,studentUserId:user._id,companyUserId:s.company._id,batchId:b._id,opportunityId:o._id,studentName:user.name,title:o.title,companyName:o.companyName,state:admitted?'confirmed':'dispatched',dispatch:{by:user._id,at:new Date(b.registrationOpensAt.getTime()+2*86400000),revokedAt:null,version:1},cvSnapshot:{title:'CV '+user.name,summary:`Kinh nghiệm ${skills.join(', ')}; xây dựng website và cơ sở dữ liệu. Hồ sơ tổng hợp.`,skills,education:'Công nghệ thông tin',experience:'Website bán hàng, kiểm thử API.',cvVersion:0},message:'Nguyện vọng thực tập phát triển phần mềm. Dữ liệu tổng hợp để kiểm thử.',decisionReason:admitted?'Tiếp nhận trong kịch bản dữ liệu tổng hợp, không phải kết quả xét tuyển thực tế.':'',history:[history(user,'application_prepared',{stage:s.stage})]});}
   let assignment=null;
   if(admitted){e.admission={opportunityId:o._id,companyUserId:s.company._id,applicationId:app._id,state:'active',confirmedAt:new Date(b.registrationOpensAt.getTime()+3*86400000),allocationId:crypto.randomUUID(),title:o.title,companyName:o.companyName};if(s.n===3){const seat=await Opportunity.updateOne({_id:o._id,$expr:{$lt:['$confirmedCount','$capacity']}},{$inc:{confirmedCount:1,__v:1},$push:{history:history(s.company,'fixture_seat_reserved')}},{session});assert.equal(seat.modifiedCount,1);}}
   if(assigned){const finished=s.n===5;assignment=await create(Assignment,{workflow:true,activePlacement:true,enrollmentId:e._id,opportunityId:o._id,topicId:s.topic._id,topicSnapshot:{title:o.title,description:o.description,companyName:o.companyName},studentId:student._id,batchId:b._id,studentUserId:user._id,companyUserId:s.company._id,mentorUserId:s.mentor._id,startDate:b.startDate,endDate:b.endDate,lifecycle:finished?'completed':'active',status:finished?'evaluated':'assigned',studentBatchKey:`${b._id}:${user._id}`,kpiAtAssign:100,kpiScore:finished?85:null,kpis:o.kpis.map((k,i)=>({...k,milestoneIndex:i,status:finished?'approved':i===0?'submitted':'pending',content:finished?'Nội dung tổng hợp: đã bàn giao tài liệu và sản phẩm.':i===0?'Nội dung tổng hợp: đã thiết kế API và dữ liệu.':'',score:finished?85:null,feedback:finished?'Nhận xét mẫu để kiểm thử giao diện đánh giá.':''})),history:[history(admin,'assignment_prepared',{stage:s.stage})]});e.assignmentId=assignment._id;
    const owners={studentUserId:user._id,companyUserId:s.company._id,mentorUserId:s.mentor._id},start=b.startDate.getTime();
    for(let i=0;i<3;i++){const state=finished?'done':['todo','in_progress','review'][i];await create(Task,{assignmentId:assignment._id,topicId:s.topic._id,studentUserId:user._id,companyUserId:s.company._id,title:['Khảo sát yêu cầu và thiết kế dữ liệu','Xây dựng API và phân quyền','Kiểm thử và viết báo cáo'][i],description:'Công việc tổng hợp phục vụ kiểm thử đồ án.',status:state,priority:['medium','high','low'][i],dueDate:new Date(finished?start+(i+1)*15*86400000:Date.now()+(i+1)*3*86400000),progress:finished?100:i*40,...(state==='review'?{submission:{content:'Bài nộp tổng hợp để doanh nghiệp kiểm tra.',submittedAt:new Date()}}:{}),...(finished?{completedAt:new Date(start+(i+1)*14*86400000),review:{decision:'approved',comment:'Nhận xét mẫu: hoàn thành yêu cầu.',reviewedAt:new Date(start+(i+1)*15*86400000),reviewerUserId:s.company._id}}:{}),history:[history(s.company,'task_prepared')]});}
    for(let i=0;i<2;i++)await create(Log,{...owners,assignmentId:assignment._id,topicId:s.topic._id,studentName:user.name,weekNumber:i+1,title:'Nhật ký tuần '+(i+1),tasksDone:'Dữ liệu tổng hợp: thiết kế API, xây dựng chức năng và kiểm thử.',challenges:'Cần cải thiện xử lý lỗi và phân quyền.',nextPlan:'Hoàn thiện kiểm thử tích hợp và tài liệu.',status:finished?'approved':i?'need_revision':'submitted',mentorFeedback:finished?'Nhận xét mẫu: đáp ứng yêu cầu.':i?'Bổ sung bằng chứng kiểm thử.':'',history:[history(user,'worklog_prepared')]});
    for(let i=0;i<(finished?2:3);i++){const checkIn=new Date(finished?start+(i+8)*86400000:Date.now()-(i+1)*86400000);checkIn.setUTCHours(1,0,0,0);const checkOut=new Date(checkIn.getTime()+8*3600000);await create(WorkSession,{...owners,assignmentId:assignment._id,batchId:b._id,day:checkIn.toISOString().slice(0,10),requestKey:run+':'+user._id+':'+i,checkInAt:checkIn,checkOutAt:checkOut,minutes:480,state:finished?'approved':['approved','pending','needs_adjustment'][i],reason:'Phiên giờ làm tổng hợp phục vụ kiểm thử; không phải điểm danh thực tế.',proof:{provider:'manual',verified:false},history:[history(user,'work_session_prepared')]});}
    const reviews=()=>[{role:'company',actorUserId:s.company._id,score:84,comment:'Nhận xét tổng hợp: đáp ứng yêu cầu chuyên môn.',decision:'approved',at:new Date(start+50*86400000)},{role:'mentor',actorUserId:s.mentor._id,score:86,comment:'Nhận xét tổng hợp: trình bày rõ quy trình và kết quả.',decision:'approved',at:new Date(start+51*86400000)}];
    for(const kind of ['weekly','final']){const state=finished?'approved':kind==='weekly'?'submitted':['submitted','reviewed','need_revision'][(Number(s.company.loginEmail.match(/\d+/)[0])-1)%3];await create(Report,{...owners,assignmentId:assignment._id,kind,current:true,version:1,title:(kind==='weekly'?'Báo cáo tiến độ':'Báo cáo tổng kết')+' — '+user.name,content:'Báo cáo tổng hợp phục vụ kiểm thử đồ án.\nMục tiêu: xây dựng website quản lý bán hàng, phân quyền người dùng và báo cáo thống kê.\nĐã hoàn thành: phân tích yêu cầu, thiết kế MongoDB, triển khai API và giao diện React. Đã kiểm thử các trường hợp dữ liệu hợp lệ và không hợp lệ.\nKhó khăn: một số API chưa tối ưu; cần hỗ trợ kiểm tra quyền truy cập.\nKế hoạch: bổ sung kiểm thử tích hợp, tài liệu và hoàn thiện chức năng còn lại.\nĐây không phải báo cáo của sinh viên thật.',state,reviews:finished||state==='reviewed'?reviews():state==='need_revision'?[{...reviews()[0],decision:'need_revision',comment:'Nhận xét mẫu: cần bổ sung kết quả kiểm thử.'}]:[],...(finished?{finalScore:85,approvedByUserId:admin._id,approvedAt:new Date(b.endDate.getTime()-86400000)}:{}),history:[history(user,'report_prepared',{state})]});}
   }
   if(admitted)await e.save({session});
   rows.push({name:user.name,email:user.loginEmail,studentCode:s.studentCode,stage:s.stage,company:s.company.loginEmail,mentor:assigned?s.mentor.loginEmail:null,batch:b.name,studentUserId:String(user._id),enrollmentId:String(e._id),assignmentId:assignment?String(assignment._id):null});
  }
  // Rename only the two earlier generated periods; retain IDs, codes and every date.
  for(const [code,name]of [['DEMO_CN_2026','Thực tập cử nhân — Đợt tháng 11, năm học 2026–2027'],['DEMO_KS_2026','Thực tập kỹ sư — Đợt tháng 11, năm học 2026–2027']])await Batch.updateOne({code},{$set:{name},$push:{history:history(admin,'period_label_updated')}},{session});
 },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
 assert.equal(rows.length,72);
 let preserved=0;for(const row of before){if(row.collection===Batch.collection.name||row.collection===Opportunity.collection.name)continue;const after=await mongoose.connection.db.collection(row.collection).findOne({_id:new mongoose.Types.ObjectId(row.id)});assert.equal(crypto.createHash('sha256').update(bson.serialize(after)).digest('hex'),row.hash,'Existing business document changed');preserved++;}
 for(const o of await Opportunity.find({_id:{$in:await Enrollment.distinct('admission.opportunityId',{'admission.state':'active'})}})){assert.equal(o.confirmedCount,await Enrollment.countDocuments({'admission.opportunityId':o._id,'admission.state':'active'}),'Seat counter mismatch');}
 const summary={database,run,synthetic:true,existingDocumentsPreserved:preserved,studentsAdded:72,newPeriods:batchRows.map(b=>({id:String(b._id),name:b.name,status:b.status})),stages:Object.fromEntries(stages.map(s=>[s,rows.filter(r=>r.stage===s).length])),tasksAdded:72,logsAdded:48,sessionsAdded:60,reportsAdded:48,blockchainTransactionsAdded:0,ipfsCidsAdded:0,rows};
 fs.writeFileSync(resultFile,JSON.stringify(summary,null,2),{flag:'wx'});
 const lines=['INTERNOVA — ADDITIONAL SYNTHETIC STUDENT EXAMPLES','URL: http://localhost:5188/','Database: '+database,'TEST ONLY. Initial password equals student code. No emails are sent.',''];
 for(const r of rows)lines.push('Name: '+r.name,'Stage: '+r.stage,'Email: '+r.email,'Password: '+r.studentCode,'Company: '+r.company,'Mentor: '+(r.mentor||'-'),'Period: '+r.batch,'');
 const loginFile=path.join(dir,'manual-login-lifecycle.txt');fs.writeFileSync(loginFile,lines.join('\r\n'),{flag:'wx'});
 fs.appendFileSync(path.join(dir,'manual-login-combined.txt'),'\r\n'+lines.join('\r\n'));
 console.log(JSON.stringify({...summary,rows:undefined}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());

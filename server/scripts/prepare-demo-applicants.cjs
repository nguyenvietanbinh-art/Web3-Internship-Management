// Explicit, additive fixture for the approved local demo only. Never resets a DB.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const database='internova_demo_cunhan_kysu_20261107';
const uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107');
const marker=path.join(dir,'applicant-fixtures-started.json');
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',CHAIN_LISTENER_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
require('../src/app').createApp();
const User=require('../src/models/User'),Assignment=require('../src/models/Assignment');
const {InternshipBatch:Batch}=require('../src/models/BusinessModels');
const {Enrollment,Opportunity,Application}=require('../src/workflow/models'),svc=require('../src/workflow/service');
(async()=>{
 const resume=process.argv.includes('--resume');
 if(fs.existsSync(path.join(dir,'applicant-fixtures-result.json')))throw Error('Completed fixture exists; never reseed');
 if(fs.existsSync(marker)&&!resume)throw Error('Fixture already started; inspect checkpoint, never reseed automatically');
 if(resume){const checkpoint=JSON.parse(fs.readFileSync(marker,'utf8'));assert.equal(checkpoint.database,database);}
 const ready=JSON.parse(fs.readFileSync(path.join(dir,'demo-ready.json'),'utf8'));assert.equal(ready.uri,uri);assert.equal(ready.database,database);
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:8000});
 const db=mongoose.connection.db;assert.equal(db.databaseName,database);assert.equal((await db.command({hello:1})).setName,'internovaTestRs');
 const admin=await User.findOne({loginEmail:'school-1@example.invalid',role:'admin',disabled:{$ne:true}});assert.ok(admin);
 const plan=[];
 for(const [prefix,code]of [['2211','DEMO_CN_2026'],['2212','DEMO_KS_2026']]){
  const b=await Batch.findOne({code,status:'open'});assert.ok(b);assert.ok(new Date()<b.registrationClosesAt&&new Date()>=b.registrationOpensAt);
  for(let c=1;c<=3;c++){
   const company=await User.findOne({loginEmail:`enterprise-${c}@example.invalid`,role:'company',disabled:{$ne:true}}),mentor=await User.findOne({loginEmail:`lecturer-${c}@example.invalid`,role:'mentor',disabled:{$ne:true}});assert.ok(company&&mentor);
   const opportunity=await Opportunity.findOne({batchId:b._id,companyUserId:company._id,status:'open'}).sort({_id:1});assert.ok(opportunity);assert.ok(opportunity.capacity-opportunity.confirmedCount>=2);
   for(let n=0;n<4;n++){
    const email=prefix+String(21+(c-1)*4+n).padStart(6,'0')+'@gmail.com';
    const student=await User.findOne({loginEmail:email,role:'student',disabled:{$ne:true}});assert.ok(student);
    const e=await Enrollment.findOne({studentUserId:student._id,batchId:b._id,eligibility:'eligible',registeredAt:{$type:'date'}});assert.ok(e);
    const prior=await Application.find({enrollmentId:e._id});
    if(resume&&prior.length){assert.equal(prior.length,1);assert.equal(String(prior[0].opportunityId),String(opportunity._id));assert.ok(prior[0].message.startsWith('Hồ sơ tổng hợp dùng thử xét tuyển'));assert.equal(e.usedOpportunities.length,1);assert.ok(!e.admission||String(e.admission.applicationId)===String(prior[0]._id));if(e.assignmentId){const old=await Assignment.findById(e.assignmentId);assert.equal(String(old.mentorUserId),String(mentor._id));}}
    else{assert.equal(e.usedOpportunities.length,0,'Preserve any student already using the website');assert.ok(!e.assignmentId&&!e.admission);assert.equal(prior.length,0);}
    plan.push({student,company,mentor,b,opportunity,enrollment:e,accept:n<2,assign:n===0});
   }
  }
 }
 if(!resume)fs.writeFileSync(marker,JSON.stringify({database,startedAt:new Date(),students:plan.map(p=>p.student.loginEmail)},null,2),{flag:'wx'});
 const rows=[];
 for(const p of plan){
  let application=await Application.findOne({enrollmentId:p.enrollment._id,opportunityId:p.opportunity._id});
  if(!application)application=(await svc.apply(p.student,String(p.enrollment._id),{opportunityId:String(p.opportunity._id),message:'Hồ sơ tổng hợp dùng thử xét tuyển và phân tích độ phù hợp; không phải ứng tuyển của người thật.'})).application;
  if(p.accept)application=await svc.decision(p.company,String(application._id),{version:application.__v,state:'offered',reason:'Tiếp nhận trong kịch bản demo được phê duyệt; chưa thực hiện đánh giá AI.'});
  let placement=null;
  if(p.assign){const e=await Enrollment.findById(p.enrollment._id);placement=await svc.assign(admin,String(e._id),{version:e.__v,mentorUserId:String(p.mentor._id),startDate:p.b.startDate.toISOString(),endDate:p.b.endDate.toISOString(),reason:'Phân công giảng viên cho sinh viên đã được doanh nghiệp nhận trong kịch bản demo.'});}
  rows.push({student:p.student.loginEmail,name:p.student.name,batch:p.b.code,company:p.company.loginEmail,mentor:placement?p.mentor.loginEmail:null,topic:p.opportunity.title,opportunityId:String(p.opportunity._id),applicationId:String(application._id),assignmentId:placement?String(placement._id):null,state:placement?'assigned':p.accept?'accepted_needs_mentor':'awaiting_company'});
  fs.writeFileSync(path.join(dir,'applicant-fixtures-checkpoint.json'),JSON.stringify({database,rows},null,2));
 }
 for(const p of plan){const e=await Enrollment.findById(p.enrollment._id);assert.equal(e.usedOpportunities.length,1);assert.equal(svc.active(e),p.accept);assert.equal(Boolean(e.assignmentId),p.assign);if(p.assign)assert.ok(await Assignment.exists({_id:e.assignmentId,studentUserId:p.student._id,activePlacement:true}));}
 for(const id of new Set(plan.map(p=>String(p.opportunity._id)))){const o=await Opportunity.findById(id),count=await Enrollment.countDocuments({'admission.opportunityId':id,'admission.state':'active'});assert.equal(o.confirmedCount,count);}
 const result={database,createdApplications:rows.length,accepted:rows.filter(r=>r.state!=='awaiting_company').length,assigned:rows.filter(r=>r.state==='assigned').length,awaitingCompany:rows.filter(r=>r.state==='awaiting_company').length,acceptedNeedsMentor:rows.filter(r=>r.state==='accepted_needs_mentor').length,registeredUnplaced:await Enrollment.countDocuments({registeredAt:{$type:'date'},'admission.state':{$ne:'active'}}),unregistered:await Enrollment.countDocuments({registeredAt:null}),rows};
 fs.writeFileSync(path.join(dir,'applicant-fixtures-result.json'),JSON.stringify(result,null,2),{flag:'wx'});
 console.log(JSON.stringify({...result,rows:undefined}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());

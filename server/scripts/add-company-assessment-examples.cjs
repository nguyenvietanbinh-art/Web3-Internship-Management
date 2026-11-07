const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107'),uri='mongodb://127.0.0.1:27018/internova_demo_cunhan_kysu_20261107?replicaSet=internovaTestRs';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const User=require('../src/models/User'),{InternshipBatch:Batch}=require('../src/models/BusinessModels'),{Enrollment,Opportunity,Application}=require('../src/workflow/models'),svc=require('../src/workflow/service');
(async()=>{
 const output=path.join(dir,'company-assessment-examples.json');if(fs.existsSync(output))throw Error('Completed; do not reapply');
 await mongoose.connect(uri,{autoCreate:false,autoIndex:false});assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const company=await User.findOne({loginEmail:'enterprise-1@example.invalid',role:'company'}),batch=await Batch.findOne({code:'DEMO_CN_2026'}),o=await Opportunity.findOne({companyUserId:company._id,batchId:batch._id,status:'open',title:{$regex:/^Cổng tuyển dụng/}});assert.ok(o&&o.confirmedCount<o.capacity);
 const beforeConfirmed=o.confirmedCount,rows=[];
 for(const email of ['2211000002@gmail.com','2211000009@gmail.com','2211000017@gmail.com','2211000027@gmail.com']){
  const u=await User.findOne({loginEmail:email,role:'student','identityHistory.action':'synthetic.school.provisioned'});assert.ok(u);const e=await Enrollment.findOne({studentUserId:u._id,batchId:batch._id});assert.ok(e&&e.registeredAt&&!svc.active(e));
  if(await Application.exists({enrollmentId:e._id,opportunityId:o._id})){rows.push({email,skipped:'Existing application preserved'});continue;}
  const result=await svc.apply(u,String(e._id),{opportunityId:String(o._id),message:'Hồ sơ tổng hợp bổ sung để thử đối chiếu năng lực khai báo giữa các ứng viên; không phải ứng tuyển của người thật.'});
  rows.push({email,applicationId:String(result.application._id),skillCount:result.application.cvSnapshot.skills.length,gpa:result.application.cvSnapshot.gpa});
 }
 assert.equal((await Opportunity.findById(o._id)).confirmedCount,beforeConfirmed,'Applications do not consume seats');
 const result={opportunityId:String(o._id),title:o.title,companyEmail:'enterprise-1@example.invalid',rows,seatsUnchanged:true};fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());

// Read-only export of explicitly generated completed-internship practice reports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),target=path.join(root,'ai-service/datasets/completed-report-exercises-v1');
const uri='mongodb://127.0.0.1:27018/internova_demo_cunhan_kysu_20261107?replicaSet=internovaTestRs';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const {Report}=require('../src/models/BusinessModels'),Assignment=require('../src/models/Assignment'),User=require('../src/models/User'),practice=require('../src/core/reportPractice');
(async()=>{
 if(fs.existsSync(target))throw Error('Dataset exists; never overwrite annotations');
 await mongoose.connect(uri,{autoCreate:false,autoIndex:false});assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const rows=[];
 for(const source of await Report.find({kind:'final',state:'approved',current:true,'history.action':'fixture.report_prepared'})){
  const a=await Assignment.findById(source.assignmentId);if(a.lifecycle!=='completed')continue;
  const mentor=await User.findById(a.mentorUserId),data=await practice.load(mentor,String(source._id));
  for(const v of data.variants)rows.push({id:`completed-${rows.length+1}`,student_id:crypto.createHash('sha256').update(data.student_id).digest('hex').slice(0,16),source_report_id:data.source_report_id,synthetic:true,source:'generated-completed-internship-exercise',variant:v.id,report_text:v.content,features:data.observations,teacher_score:null,teacher_comment:null,label:null,label_source:'awaiting-human-review',training_eligible:false});
 }
 assert.ok(rows.length>=3&&rows.length%3===0);
 const payload=rows.map(r=>JSON.stringify(r)).join('\n')+'\n';
 fs.mkdirSync(target);fs.writeFileSync(path.join(target,'reports-to-review.jsonl'),payload,{flag:'wx'});
 fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify({synthetic:true,students:rows.length/3,reports:rows.length,contains_expert_labels:false,training_eligible:false,sha256:crypto.createHash('sha256').update(payload).digest('hex'),source:'Current generated completed placements; read-only export; not a dataset of real students'},null,2),{flag:'wx'});
 console.log(JSON.stringify({target,students:rows.length/3,reports:rows.length,databaseWrites:0,labelsFilled:0}));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());

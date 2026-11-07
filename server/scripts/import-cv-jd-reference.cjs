// Additive import of the approved 200-CV reference corpus into exact local databases.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),bcrypt=require('bcryptjs');
const root=path.resolve(__dirname,'../..'),dataset=path.join(root,'ai-service/datasets/cv-jd-reference-200-v1'),output=path.join(root,'contracts/node_modules/.cache/cv-jd-reference-web-20261107');
const mode=process.argv[2];if(!['test','main'].includes(mode))throw Error('Use test or main');
const database=mode==='test'?'internova_role_qa_20261107':'internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`,code='CVJD_REFERENCE_200_V1';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',CHAIN_LISTENER_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const User=require('../src/models/User'),Student=require('../src/models/Student'),Topic=require('../src/models/Topic'),{CV,InternshipBatch:Batch}=require('../src/models/BusinessModels'),{Enrollment,Opportunity}=require('../src/workflow/models');
const {BSON}=require('mongodb'),sha=data=>crypto.createHash('sha256').update(data).digest('hex'),scriptHash=sha(fs.readFileSync(__filename)),manifestHash=sha(fs.readFileSync(path.join(dataset,'manifest.json')));
const id=label=>new mongoose.Types.ObjectId(sha(Buffer.from(database+':'+code+':'+label)).slice(0,24));
async function preserved(db,before){
 const result=[];
 const collections=before||await db.listCollections().toArray();
 for(const col of collections){const ids=col.ids||await db.collection(col.name).find({},{projection:{_id:1}}).toArray().then(rows=>rows.map(r=>r._id));const hash=crypto.createHash('sha256');let count=0;
  for await(const doc of db.collection(col.name).find({_id:{$in:ids}}).sort({_id:1})){hash.update(BSON.serialize(doc));count++;}
  result.push({name:col.name,ids,count,hash:hash.digest('hex'),indexes:await db.collection(col.name).indexes()});
 }return result;
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const marker=path.join(output,mode+'-result.json');
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:8000});const db=mongoose.connection.db;assert.equal(db.databaseName,database);assert.equal((await db.command({hello:1})).setName,'internovaTestRs');
 if(mode==='test')assert.ok(await db.collection('qa_safety_marker').findOne({_id:'role-workflow'}));
 if(fs.existsSync(marker)){const done=JSON.parse(fs.readFileSync(marker,'utf8'));assert.equal(done.database,database);assert.equal(await Enrollment.countDocuments({batchId:id('batch')}),200);console.log('ALREADY_IMPORTED_NO_WRITES '+database);return;}
 if(mode==='main'){const proof=JSON.parse(fs.readFileSync(path.join(output,'test-result.json'),'utf8'));assert.equal(proof.status,'PASS');assert.equal(proof.scriptHash,scriptHash);assert.equal(proof.manifestHash,manifestHash);}
 const manifest=JSON.parse(fs.readFileSync(path.join(dataset,'manifest.json'),'utf8'));assert.equal(manifest.synthetic,true);assert.equal(manifest.expert_confirmed,false);
 for(const name of ['cvs.jsonl','jobs.jsonl'])assert.equal(sha(fs.readFileSync(path.join(dataset,name))),manifest.sha256[name]);
 const read=name=>fs.readFileSync(path.join(dataset,name),'utf8').trim().split('\n').map(JSON.parse),cvs=read('cvs.jsonl'),jobs=read('jobs.jsonl');assert.equal(cvs.length,200);assert.equal(jobs.length,20);
 assert.equal(await Batch.countDocuments({code}),0,'Import batch already exists; inspect instead of overwriting');
 assert.equal(await User.countDocuments({$or:[{loginEmail:{$in:cvs.map(c=>c.student_code+'@gmail.com')}},{_id:{$in:cvs.map(c=>id(c.id))}}]}),0,'Account collision: preserve existing credentials');
 const admin=await User.findOne({role:'admin',disabled:{$ne:true}});assert.ok(admin);
 const companies=mode==='main'?await User.find({role:'company',loginEmail:{$regex:/^enterprise-\d+@example\.invalid$/},disabled:{$ne:true}}).select('+loginEmail').sort({loginEmail:1}):[await User.findById(JSON.parse(fs.readFileSync(path.join(root,'contracts/node_modules/.cache/student-workflow-20261107/accounts.json'),'utf8')).accounts.company.userId)];assert.ok(companies.length>=1&&companies.every(Boolean));
 const now=new Date(),day=86400000,start=new Date(now.getTime()+21*day),end=new Date(start.getTime()+84*day),deadline=new Date(start.getTime()-7*day),batchId=id('batch');
 const event=(actor,action,data={})=>({actorUserId:actor._id,actorRole:actor.role,action,at:now,data:{synthetic:true,dataset:code,humanConfirmed:false,...data}});
 const batch=new Batch({_id:batchId,code,name:`Thực tập cử nhân CNTT — Đợt tháng ${start.getUTCMonth()+1}, năm học 2026–2027`,type:'bachelor',startDate:start,endDate:end,registrationOpensAt:new Date(now.getTime()-day),registrationClosesAt:deadline,status:'open',history:[event(admin,'fixture.reference200_imported')]});
 const students=[],profiles=[],cvDocs=[],enrollments=[],topics=[],opportunities=[];
 console.log('Preparing 200 distinct password hashes; no database writes yet.');
 for(let i=0;i<cvs.length;i++){
  const row=cvs[i],lines=row.text.split('\n'),gpa=Number(row.text.match(/GPA (\d+\.\d+)/)[1]),u=new User({_id:id(row.id),role:'student',name:row.name,email:row.student_code+'@gmail.com',loginEmail:row.student_code+'@gmail.com',passwordHash:await bcrypt.hash(row.student_code,12),skills:row.skills,identityHistory:[{action:'synthetic.school.provisioned',at:now},{action:'synthetic.reference200_imported',at:now}]});students.push(u);
  profiles.push(new Student({_id:id('profile:'+row.id),userId:u._id,studentCode:row.student_code,fullName:row.name,major:'Công nghệ thông tin',skills:row.skills,gpa}));
  cvDocs.push(new CV({_id:id('cv:'+row.id),ownerUserId:u._id,title:row.id+' — '+row.name,summary:lines.filter(s=>/^(Mục tiêu|Kỹ năng|Phối hợp|Thời gian):?/.test(s)).join('\n'),education:lines.find(s=>s.startsWith('Học vấn:')),experience:lines.find(s=>s.startsWith('Kinh nghiệm và bài tập:')),skills:row.skills,gpa,history:[event(u,'fixture.reference200_cv_imported',{sourceId:row.id,sourceSha256:sha(Buffer.from(row.text)),track:row.track})]}));
  enrollments.push(new Enrollment({_id:id('enrollment:'+row.id),studentUserId:u._id,batchId,registeredAt:now,history:[event(admin,'school.synthetic_enrollment_created'),event(u,'school.synthetic_registration_created')]}));
  if((i+1)%25===0)console.log('Prepared '+(i+1)+'/200');
 }
 for(const [i,row]of jobs.entries()){
  const company=companies[Math.floor(i/2)%companies.length],kpis=[{milestoneIndex:0,title:'Hoàn thành phần việc được giao',description:'Thực hiện theo yêu cầu, ghi cách kiểm tra và giới hạn kết quả; không xác nhận trước sản phẩm đã tồn tại.',weightPercent:100,deadline:new Date(end.getTime()-7*day)}];
  topics.push(new Topic({_id:id(row.id),companyUserId:company._id,companyName:company.companyName||company.name,title:row.id+' — '+row.text.split('. Nhiệm vụ:')[0],description:row.text,requiredSkills:row.required_skills,kpis,status:'open'}));
  opportunities.push(new Opportunity({_id:id('opportunity:'+row.id),topicId:id(row.id),companyUserId:company._id,batchId,title:topics.at(-1).title,companyName:company.companyName||company.name,description:row.text,capacity:10,confirmedCount:0,status:'open',schoolAllocationAllowed:true,kpis,topicVersion:0,history:[event(company,'fixture.reference200_opportunity_imported',{sourceId:row.id,track:row.track})]}));
 }
 const groups=[[User,students],[Student,profiles],[CV,cvDocs],[Batch,[batch]],[Enrollment,enrollments],[Topic,topics],[Opportunity,opportunities]];
 for(const [,rows]of groups)for(const row of rows)await row.validate();
 const before=await preserved(db);fs.writeFileSync(path.join(output,mode+'-preserved-before.ejson'),BSON.EJSON.stringify(before),{flag:'wx'});
 const session=await mongoose.startSession();try{
  if(mode==='test'){await assert.rejects(()=>session.withTransaction(async()=>{await Batch.insertMany([batch.toObject()],{session});throw Error('TEST_ROLLBACK');}),/TEST_ROLLBACK/);assert.equal(await Batch.countDocuments({code}),0);assert.deepEqual(await preserved(db,before),before);}
  await session.withTransaction(async()=>{for(const [model,rows]of groups)await model.insertMany(rows.map(r=>r.toObject()),{session});});
 }finally{await session.endSession();}
 assert.equal(await Enrollment.countDocuments({batchId}),200);assert.equal(await Opportunity.countDocuments({batchId}),20);assert.equal(await User.countDocuments({_id:{$in:students.map(s=>s._id)}}),200);
 for(const cv of cvDocs){const saved=await CV.findById(cv._id);assert.deepEqual(saved.skills,cv.skills);assert.equal(saved.experience,cv.experience);assert.ok(saved.summary);}
 const after=await preserved(db,before);assert.deepEqual(after,before,'Every pre-existing record and index must remain unchanged');
 const result={status:'PASS',database,scriptHash,manifestHash,sourceDataset:manifest.dataset,synthetic:true,expertLabels:false,batchId:String(batchId),batchName:batch.name,registrationClosesAt:deadline,startDate:start,endDate:end,inserted:{users:200,students:200,cvs:200,enrollments:200,topics:20,opportunities:20,batches:1},existingDataAndIndexesPreserved:true,firstStudent:'2699000001@gmail.com',fullSkillStudent:'2699000004@gmail.com',newBeginnerStudent:'2699000001@gmail.com',frontend:mode==='main'?'http://localhost:5188':'http://localhost:5189',topicCompanies:jobs.map((j,i)=>({jd:j.id,company:companies[Math.floor(i/2)%companies.length].name})),at:new Date().toISOString()};
 fs.writeFileSync(marker,JSON.stringify(result,null,2),{flag:'wx'});fs.writeFileSync(path.join(output,mode+'-manual-login.txt'),cvs.map(c=>`${c.id} | ${c.track} | ${c.name}\nEmail: ${c.student_code}@gmail.com\nInitial password: ${c.student_code}\n`).join('\n'),{flag:'wx'});console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>mongoose.disconnect());

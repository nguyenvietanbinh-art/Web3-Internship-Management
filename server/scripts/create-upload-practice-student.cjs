// Add only one school-provisioned local account. Refuse collisions; no existing data updates.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'contracts/node_modules/.cache/student-upload-20261107'),uri='mongodb://127.0.0.1:27018/internova_demo_cunhan_kysu_20261107?replicaSet=internovaTestRs';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri});
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const User=require('../src/models/User'),Student=require('../src/models/Student'),{CV,InternshipBatch}=require('../src/models/BusinessModels'),{Enrollment,Opportunity}=require('../src/workflow/models');
(async()=>{
 require('../src/config/workflowTestGuard').assertWorkflowTest();await mongoose.connect(uri,{autoIndex:false,autoCreate:false});const db=mongoose.connection.db;assert.equal(db.databaseName,'internova_demo_cunhan_kysu_20261107');assert.equal((await db.command({hello:1})).setName,'internovaTestRs');
 const code='2211990001',email=code+'@gmail.com',name='Nguyễn Minh Quân',marker=path.join(dir,'result.json');
 fs.mkdirSync(dir,{recursive:true});if(fs.existsSync(marker)){const done=JSON.parse(fs.readFileSync(marker,'utf8'));assert.ok(await User.findById(done.userId));console.log('Already created; no writes.');return;}
 assert.equal(await User.countDocuments({$or:[{loginEmail:email},{email}]}),0,'Account already exists; do not overwrite');assert.equal(await Student.countDocuments({studentCode:code}),0);
 const batch=await InternshipBatch.findOne({code:'CVJD_REFERENCE_200_V1',status:'open'});assert.ok(batch);const now=new Date();assert.ok(batch.registrationOpensAt<=now&&batch.registrationClosesAt>now,'Registration period must be open');
 const admin=await User.findOne({role:'admin',disabled:{$ne:true}});assert.ok(admin);
 const available=await Opportunity.countDocuments({batchId:batch._id,status:'open',$expr:{$lt:['$confirmedCount','$capacity']}});assert.ok(available>0);
 const userId=new mongoose.Types.ObjectId(),profileId=new mongoose.Types.ObjectId(),enrollmentId=new mongoose.Types.ObjectId();
 // Backup only the exact targets before insertion, with exclusive creation.
 const before={database:db.databaseName,createdAt:now,existingUsers:await db.collection('users').find({loginEmail:email}).toArray(),existingStudents:await db.collection('students').find({studentCode:code}).toArray(),existingEnrollments:await db.collection('batch_enrollments').find({studentUserId:userId}).toArray()};
 fs.writeFileSync(path.join(dir,'before.json'),JSON.stringify(before,null,2),{flag:'wx'});
 const password=code,passwordHash=await require('bcryptjs').hash(password,12),session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
 await User.create([{_id:userId,name,role:'student',email,loginEmail:email,passwordHash,identityHistory:[{action:'synthetic.school.provisioned',at:now}]}],{session});
 await Student.create([{_id:profileId,userId,studentCode:code,fullName:name,major:'Công nghệ thông tin'}],{session});
 await Enrollment.create([{_id:enrollmentId,studentUserId:userId,batchId:batch._id,registeredAt:now,history:[{actorUserId:admin._id,actorRole:'admin',action:'school.synthetic_enrollment_created',at:now,data:{synthetic:true,purpose:'CV upload practice'}}]}],{session});
 });}finally{await session.endSession();}
 assert.equal(await CV.countDocuments({ownerUserId:userId}),0);
 fs.writeFileSync(path.join(dir,'manual-login.txt'),`Website: http://localhost:5188\nHọ tên: ${name}\nMã sinh viên: ${code}\nEmail đăng nhập: ${email}\nMật khẩu: ${password}\nKỳ: ${batch.name}\nCV: docs/sample-cvs/09-nguyen-minh-quan.docx\nChưa tải CV; chưa ứng tuyển; chưa có đề tài.\n`,{flag:'wx'});
 const result={database:db.databaseName,userId:String(userId),profileId:String(profileId),enrollmentId:String(enrollmentId),batch:batch.name,email,availableOpportunities:available,inserted:{users:1,students:1,batch_enrollments:1},synthetic:true,existingRecordsModified:0};
 fs.writeFileSync(marker,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());

// Explicit isolated TEST fixture. Copies existing data read-only, never drops or resets it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'contracts/node_modules/.cache/workflow-combined-20261107');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
const sourceUri='mongodb://127.0.0.1:27017/web3_internship_test_phase1_import_f8d067c0';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',WEB3_LOCAL_ENABLED:'false',JWT_SECRET:crypto.randomBytes(32).toString('hex'),CHAIN_LISTENER_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const {MongoClient,BSON}=require('mongodb');
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
require('../src/app').createApp();require('../src/workflow/models');
const User=require('../src/models/User'),Student=require('../src/models/Student'),Company=require('../src/models/Company'),Topic=require('../src/models/Topic');
const {InternshipBatch:Batch,CV}=require('../src/models/BusinessModels'),{Enrollment,Opportunity}=require('../src/workflow/models');
const svc=require('../src/workflow/service'),bcrypt=require('bcryptjs'),{vault}=require('../../scripts/demo/common.cjs');
function specs(){
 const accounts=[];
 for(let i=1;i<=2;i++)accounts.push({role:'admin',name:['Nguyễn Minh Khôi','Lê Thu Hà'][i-1],email:`school-${i}@example.invalid`});
 const businesses=['An Lạc Digital','Minh Quang Software','Hải Đăng Solutions','Nam Việt Cloud','Bình Minh Data','Thiên Sơn Tech','Đông Phương Systems','Trường Phát AI','Tân Hưng Commerce','Vạn Phúc Networks','Hoàng Gia Web','Phú An Security'];
 const teachers=['Nguyễn Minh Hòa','Trần Thanh Tùng','Lê Ngọc Mai','Phạm Quốc Bảo','Hoàng Thu Trang','Vũ Anh Tuấn','Đặng Hải Yến','Bùi Đức Duy','Đỗ Minh Châu','Hồ Thanh Sơn','Ngô Phương Linh','Dương Gia Huy'];
 for(let i=0;i<12;i++){accounts.push({role:'company',name:`Công ty TNHH ${businesses[i]}`,email:`enterprise-${i+1}@example.invalid`});accounts.push({role:'mentor',name:teachers[i],email:`lecturer-${i+1}@example.invalid`});}
 const family=['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ'],given=['Minh Anh','Quốc Bảo','Ngọc Châu','Tuấn Duy','Hải Đăng','Thu Giang','Gia Hân','Đức Huy','Bảo Khánh','Phương Linh','Ngọc Mai','Hoài Nam','Thanh Phong','Minh Quân','Khánh Tâm','Bảo Thư','Anh Tuấn','Hà Uyên','Quang Vinh','Hải Yến'];
 for(const [b,type]of ['bachelor','engineer'].entries())for(let i=0;i<100;i++){const code=(b?'2212':'2211')+String(i+1).padStart(6,'0');accounts.push({role:'student',name:`${family[Math.floor(i/20)+b*5]} ${given[i%20]}`,email:code+'@gmail.com',studentCode:code,batchType:type,index:i});}
 return accounts;
}
async function fingerprint(db){const out=[];for(const c of(await db.listCollections().toArray()).sort((a,b)=>a.name.localeCompare(b.name))){const hash=crypto.createHash('sha256');let count=0;for await(const row of db.collection(c.name).find().sort({_id:1})){hash.update(BSON.serialize(row));count++;}out.push({name:c.name,count,sha256:hash.digest('hex'),indexes:await db.collection(c.name).indexes()});}return out;}
async function initialize(){const direct=new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true',{serverSelectionTimeoutMS:5000});await direct.connect();try{try{const status=await direct.db('admin').command({replSetGetStatus:1});if(status.set!=='internovaTestRs')throw Error('Unexpected replica set');}catch(e){if(e.code!==94)throw e;await direct.db('admin').command({replSetInitiate:{_id:'internovaTestRs',members:[{_id:0,host:'127.0.0.1:27018'}]}});}}finally{await direct.close();}}
(async()=>{
 if(fs.existsSync(path.join(dir,'combined-result.json')))throw Error('Completed dataset exists; never rerun seed');
 await initialize();
 const source=new MongoClient(sourceUri,{serverSelectionTimeoutMS:5000}),target=new MongoClient(uri,{serverSelectionTimeoutMS:15000});await source.connect();await target.connect();
 try{
  const names=(await target.db('admin').admin().listDatabases()).databases.map(d=>d.name),resume=process.argv.includes('--resume-copy');
  if(names.includes(database)&&!resume)throw Error('Target exists; preserve data and review checkpoint instead of reseeding');
  if(resume&&(!fs.existsSync(path.join(dir,'copy-checkpoint.json'))||fs.existsSync(path.join(dir,'accounts.dpapi'))))throw Error('Resume only verified copied data before account creation');
  const before=resume?JSON.parse(fs.readFileSync(path.join(dir,'source-before.json'))):await fingerprint(source.db());
  if(!resume)fs.writeFileSync(path.join(dir,'source-before.json'),JSON.stringify(before,null,2),{flag:'wx'});
  if(resume){const current=await fingerprint(target.db());for(const original of before){const row=current.find(c=>c.name===original.name);if(!row||row.count!==original.count||row.sha256!==original.sha256)throw Error('Copied data changed; refuse resume');}}
  const proposed=specs();if(proposed.length!==226||new Set(proposed.map(a=>a.email)).size!==226)throw Error('Invalid account fixture');
  const existing=new Set(await source.db().collection('users').distinct('loginEmail'));if(proposed.some(a=>existing.has(a.email)))throw Error('Account collision; no merging');
  if(!resume)for(const collection of await source.db().listCollections().toArray()){
   await target.db().createCollection(collection.name,collection.options||{});
   const rows=await source.db().collection(collection.name).find().toArray();if(rows.length)await target.db().collection(collection.name).insertMany(rows);
   for(const index of await source.db().collection(collection.name).indexes())if(index.name!=='_id_'){const {key,v,ns,...options}=index;await target.db().collection(collection.name).createIndex(key,options);}
  }
  if(!resume)fs.writeFileSync(path.join(dir,'copy-checkpoint.json'),JSON.stringify({source:source.db().databaseName,target:database,collections:before.length,documents:before.reduce((n,c)=>n+c.count,0)}),{flag:'wx'});
  await mongoose.connect(uri,{autoIndex:false,autoCreate:false});
  const repairs=[];
  for(const name of ['auth_nonces','attendance_sessions']){const col=target.db().collection(name),index=(await col.indexes()).find(i=>i.name==='expiresAt_1');if(index&&index.expireAfterSeconds===undefined){if(await col.countDocuments()!==0)throw Error('Refuse TTL change on nonempty copied collection');repairs.push({collection:name,previous:index,desired:{name:'expiresAt_1',expireAfterSeconds:0}});}}
  fs.writeFileSync(path.join(dir,'empty-ttl-index-repair.json'),JSON.stringify({database,repairs},null,2));
  for(const repair of repairs)await target.db().collection(repair.collection).dropIndex('expiresAt_1');
  for(const model of Object.values(mongoose.models)){await model.createCollection();await model.createIndexes();}
  const passwords={};for(const a of proposed)passwords[a.email]=a.studentCode||crypto.randomBytes(18).toString('base64url');
  fs.writeFileSync(path.join(dir,'accounts.dpapi'),vault('protect',JSON.stringify({database,passwords,accounts:proposed})),{flag:'wx'});
  const lines=['INTERNOVA SYNTHETIC TEST ACCOUNTS','URL http://localhost:5188/','Database: '+database,'Student Gmail-shaped addresses are fixtures, not real mailboxes. No emails are sent.','Student initial password equals the 10-digit student code. TEST ONLY.',''];
  for(const a of proposed)lines.push('Role: '+a.role,'Name: '+a.name,...(a.studentCode?['Student code: '+a.studentCode]:[]),'Email: '+a.email,'Password: '+passwords[a.email],'');
  fs.writeFileSync(path.join(dir,'manual-login-combined.txt'),lines.join('\r\n'),{flag:'wx',mode:0o600});
  const users=[];
  for(const [i,a]of proposed.entries()){
   const skills=a.role==='student'?(a.index%2?['Java','Spring Boot','SQL']:['React','Node.js','MongoDB']):[];
   const u=await User.create({name:a.name,role:a.role,email:a.email,loginEmail:a.email,passwordHash:await bcrypt.hash(passwords[a.email],12),skills,bio:'Thông tin giả lập phục vụ đồ án, không phải danh tính đã xác minh.',...(a.role==='company'?{companyName:a.name}:{}),identityHistory:[{action:'synthetic.school.provisioned',at:new Date()}]});
   await require('../src/services/accountProfiles').ensureProfile(u);
   if(a.role==='student')await Student.updateOne({userId:u._id},{$set:{studentCode:a.studentCode,university:'Trường Đại học Internova — giả lập',major:a.index%2?'Kỹ thuật phần mềm':'Công nghệ thông tin',gpa:Math.round((2.5+(a.index%15)/10)*100)/100}});
   if(a.role==='company')await Company.updateOne({userId:u._id},{$set:{description:'Doanh nghiệp giả lập cho thực tập phần mềm, không đại diện tổ chức thật.',industry:'Công nghệ thông tin',website:`https://enterprise-${i}.example.invalid`}});
   users.push({user:u,spec:a});if((i+1)%25===0)console.log('Prepared '+(i+1)+' synthetic accounts; credentials kept local.');
  }
  const admin=users.find(a=>a.spec.role==='admin').user,companies=users.filter(a=>a.spec.role==='company'),batches=[];
  for(const b of [{code:'DEMO_CN_2026',name:'Thực tập cử nhân 2026 — DEMO',type:'bachelor',start:'2026-11-24T01:00:00Z',end:'2027-01-24T10:00:00Z'},{code:'DEMO_KS_2026',name:'Thực tập kỹ sư 2026 — DEMO',type:'engineer',start:'2026-11-12T01:00:00Z',end:'2027-01-12T10:00:00Z'}])batches.push(await Batch.create({code:b.code,name:b.name,type:b.type,startDate:new Date(b.start),endDate:new Date(b.end),registrationOpensAt:new Date('2026-11-01T00:00:00Z'),registrationClosesAt:new Date(b.start),status:'open',history:[svc.event(admin,'synthetic_batch_created')]}));
  const topics=['Website thương mại điện tử','Hệ thống quản lý nhân sự','Ứng dụng theo dõi kho hàng','Dashboard phân tích doanh thu','Cổng tuyển dụng và quản lý hồ sơ'];
  let newTopics=0,newOpportunities=0;
  for(const {user:c}of companies)for(const [i,title]of topics.entries()){
   const topic=await Topic.create({companyUserId:c._id,companyName:c.name,title:title+' — '+c.companyName,description:'Đề tài giả lập: khảo sát, thiết kế, triển khai, kiểm thử và bàn giao sản phẩm.',maxSlots:5+i,kpis:[{milestoneIndex:0,title:'Sản phẩm và báo cáo',description:'Hoàn thành và kiểm thử sản phẩm mẫu.',weightPercent:100,deadline:new Date('2026-12-20T10:00:00Z')} ]});newTopics++;
   for(const b of batches){const span=b.endDate-b.startDate;await Opportunity.create({topicId:topic._id,companyUserId:c._id,batchId:b._id,title:topic.title,companyName:c.name,description:topic.description,capacity:topic.maxSlots,confirmedCount:0,status:'open',schoolAllocationAllowed:true,topicVersion:topic.__v,kpis:[{title:'Thiết kế',description:'Phân tích và thiết kế.',weightPercent:30,deadline:new Date(b.startDate.getTime()+span*.3)},{title:'Triển khai',description:'Lập trình chức năng.',weightPercent:50,deadline:new Date(b.startDate.getTime()+span*.65)},{title:'Bàn giao',description:'Kiểm thử và tài liệu.',weightPercent:20,deadline:new Date(b.startDate.getTime()+span*.95)}],history:[svc.event(c,'synthetic_opportunity_created')]});newOpportunities++;}
  }
  for(const {user:u,spec:a}of users.filter(a=>a.spec.role==='student')){
   const b=batches.find(b=>b.type===a.batchType);const e=await Enrollment.create({studentUserId:u._id,batchId:b._id,history:[svc.event(admin,'synthetic_eligibility_granted')]});if(a.index<50)await svc.register(u,String(e._id));
   await CV.create({ownerUserId:u._id,title:'CV '+u.name,summary:'CV giả lập phục vụ kiểm thử đồ án; kiến thức lập trình, kiểm thử và làm việc nhóm.',skills:u.skills,university:'Trường Đại học Internova — giả lập',education:'Sinh viên công nghệ thông tin; dữ liệu tổng hợp.'});
  }
  await require('../src/services/databaseSafety').verifyIndexes(true);
  const after=await fingerprint(source.db());fs.writeFileSync(path.join(dir,'source-after.json'),JSON.stringify(after,null,2),{flag:'wx'});if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Protected source changed; inspect snapshots');
  const result={database,uri,oldSource:source.db().databaseName,sourceUnchanged:true,newAccounts:proposed.length,newStudents:200,newCompanies:12,newMentors:12,newAdmins:2,newTopics,newOpportunities,newBatches:2,newRegistered:100,newUnregistered:100,totalUsers:await User.countDocuments(),totalTopics:await Topic.countDocuments(),totalBatches:await Batch.countDocuments(),legacyRows:'Preserved unchanged; no inferred workflow membership/admission.',fakeHours:0,fakeTransactions:0};
  fs.writeFileSync(path.join(dir,'combined-result.json'),JSON.stringify(result,null,2),{flag:'wx'});
  fs.writeFileSync(path.join(dir,'workflow-plan.json'),JSON.stringify({demoUri:uri,qaUri:null,sourceProtected:sourceUri,replicaSet:'internovaTestRs',expected:result}),{flag:'wx'});
  fs.writeFileSync(path.join(dir,'demo-ready.json'),JSON.stringify({uri,database}),{flag:'wx'});console.log(JSON.stringify(result));
 }finally{await mongoose.disconnect();await source.close();await target.close();}
})().catch(e=>{fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({code:e.code,message:e.message}));console.error(e.code||e.message);process.exitCode=1;});

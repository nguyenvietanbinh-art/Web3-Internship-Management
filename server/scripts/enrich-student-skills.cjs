// Add GPA and diverse skills only to untouched, explicitly synthetic accounts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'contracts/node_modules/.cache/workflow-combined-20261107');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const User=require('../src/models/User'),Student=require('../src/models/Student'),{CV}=require('../src/models/BusinessModels'),{Application}=require('../src/workflow/models');
const BSON=require('mongodb').BSON,hash=r=>crypto.createHash('sha256').update(BSON.serialize(r)).digest('hex');
const tracks=[
 {name:'Lập trình giao diện web',skills:['HTML','CSS','JavaScript','React','TypeScript','Tailwind CSS','Accessibility','Vitest','Git','REST API'],project:'Website bán hàng: tìm kiếm sản phẩm, giỏ hàng, biểu mẫu và giao diện thích ứng trên điện thoại.'},
 {name:'Lập trình máy chủ Node.js',skills:['JavaScript','Node.js','Express','MongoDB','REST API','JWT','Redis','Docker','Git','Jest'],project:'API cho cổng tuyển dụng: hồ sơ, tìm kiếm, phân quyền người dùng và kiểm thử dữ liệu đầu vào.'},
 {name:'Lập trình Java',skills:['Java','SQL','Spring Boot','MySQL','REST API','JUnit','Hibernate','Docker','Git','Linux'],project:'Hệ thống quản lý nhân sự: phòng ban, hợp đồng, phân quyền và báo cáo chấm công.'},
 {name:'Phân tích dữ liệu',skills:['Python','SQL','Pandas','Excel','Power BI','NumPy','Data Visualization','Statistics','Git','ETL'],project:'Dashboard doanh thu: tổng hợp số liệu, làm sạch dữ liệu, biểu đồ và bộ lọc báo cáo theo tháng.'},
 {name:'Kiểm thử phần mềm',skills:['Manual Testing','Test Cases','SQL','Postman','API Testing','Bug Reporting','Selenium','Playwright','Git','Jira'],project:'Kiểm thử ứng dụng quản lý kho: nhập xuất, tồn kho, dữ liệu sai, quyền truy cập và lịch sử thay đổi.'},
 {name:'Thiết kế trải nghiệm',skills:['Figma','Wireframing','Prototyping','UI Design','UX Research','HTML','CSS','Accessibility','Design System','Usability Testing'],project:'Thiết kế cổng ứng tuyển: luồng tìm đề tài, xem yêu cầu, nộp hồ sơ và theo dõi trạng thái.'},
 {name:'Ứng dụng di động',skills:['Dart','Flutter','REST API','Firebase','State Management','Android','Unit Testing','Git','SQLite','UI Design'],project:'Ứng dụng theo dõi công việc trên điện thoại: đăng nhập, danh sách nhiệm vụ, thông báo và đồng bộ dữ liệu.'},
 {name:'Vận hành hệ thống',skills:['Linux','Git','Docker','Networking','Nginx','CI/CD','Bash','Monitoring','PostgreSQL','Security Basics'],project:'Môi trường chạy ứng dụng: cấu hình máy chủ, đóng gói dịch vụ, nhật ký vận hành và hướng dẫn triển khai.'},
];
function fixture(index){
 const track=tracks[index%tracks.length],level=Math.floor(index/tracks.length)%4,count=[2,4,7,10][level];
 // GPA and skill count vary independently; no rule that GPA determines capability.
 const gpa=Number((2+(index*13%201)/100).toFixed(2));
 const skills=track.skills.slice(0,count),depth=['Đang làm quen','Đã thực hành cơ bản','Có kinh nghiệm đồ án','Đã thực hành nhiều phần'][level];
 return {gpa,skills,track:track.name,summary:`${depth} với ${track.name.toLowerCase()}. Kỹ năng: ${skills.join(', ')}. Hồ sơ tổng hợp phục vụ thử gợi ý đề tài, không phải thông tin người thật.`,experience:`Đồ án học tập tổng hợp: ${track.project} Mức thực hành: ${depth.toLowerCase()}; không khẳng định sản phẩm đã được doanh nghiệp xác minh.`};
}
const event=u=>({actorUserId:u._id,actorRole:'student',action:'fixture.skills_gpa_enriched',at:new Date(),data:{synthetic:true,run:'skills-gpa-20261107'}});
(async()=>{
 const output=path.join(dir,'student-skills-gpa-result.json');if(fs.existsSync(output))throw Error('Completed fixture exists; do not rerun');
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'demo-ready.json'),'utf8')).uri,uri);
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false});assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const users=await User.find({role:'student',loginEmail:{$regex:/^(221[12]|2311)\d{6}@gmail\.com$/},'identityHistory.action':'synthetic.school.provisioned'}).select('+loginEmail').sort({email:1});
 assert.ok(users.length>=200,'Expected original synthetic cohort');
 const plans=[],skipped=[];
 for(const [i,u]of users.entries()){
  const s=await Student.findOne({userId:u._id}),cv=await CV.findOne({ownerUserId:u._id});
  if(!s||!cv||u.__v!==0||s.__v!==0||cv.__v!==0||cv.fileName||cv.extractedText||!['React,Node.js,MongoDB','Java,Spring Boot,SQL'].includes(u.skills.join(','))){skipped.push({email:u.loginEmail,reason:'Missing profile or already changed: preserve user work'});continue;}
  plans.push({u,s,cv,data:fixture(i)});
 }
 assert.ok(plans.length>0);
 const apps=await Application.collection.find().toArray(),appHashes=apps.map(r=>({id:r._id,hash:hash(r)}));
 fs.writeFileSync(path.join(dir,'student-skills-gpa-before.json'),JSON.stringify(plans.map(p=>({userId:p.u._id,userSkills:p.u.skills,userVersion:p.u.__v,student:p.s.toObject(),cv:p.cv.toObject()})),null,2),{flag:'wx'});
 await mongoose.connection.transaction(async session=>{
  for(const {u,s,cv,data}of plans){
   const changed=await User.updateOne({_id:u._id,__v:0,skills:u.skills},{$set:{skills:data.skills},$inc:{__v:1},$push:{auditHistory:event(u)}},{session,runValidators:true});assert.equal(changed.modifiedCount,1);
   const student=await Student.updateOne({_id:s._id,__v:0},{$set:{gpa:data.gpa,skills:data.skills},$inc:{__v:1}},{session,runValidators:true});assert.equal(student.modifiedCount,1);
   const saved=await CV.updateOne({_id:cv._id,__v:0},{$set:{gpa:data.gpa,skills:data.skills,summary:data.summary,experience:data.experience},$inc:{__v:1},$push:{history:event(u)}},{session,runValidators:true});assert.equal(saved.modifiedCount,1);
  }
 });
 const rows=[];
 for(const {u,data}of plans){const s=await Student.findOne({userId:u._id}),cv=await CV.findOne({ownerUserId:u._id}),user=await User.findById(u._id);assert.equal(s.gpa,data.gpa);assert.equal(cv.gpa,data.gpa);assert.deepEqual(s.skills,data.skills);assert.deepEqual(cv.skills,data.skills);assert.deepEqual(user.skills,data.skills);rows.push({email:u.loginEmail,name:u.name,gpa:data.gpa,skillCount:data.skills.length,skills:data.skills,track:data.track});}
 for(const r of appHashes)assert.equal(hash(await Application.collection.findOne({_id:r.id})),r.hash,'Preserve submitted CV snapshot');
 const summary={database,updated:rows.length,skipped,submittedApplicationsPreserved:apps.length,gpaRange:[Math.min(...rows.map(r=>r.gpa)),Math.max(...rows.map(r=>r.gpa))],skillCounts:Object.fromEntries([2,4,7,10].map(n=>[n,rows.filter(r=>r.skillCount===n).length])),tracks:tracks.map(t=>t.name),gpaUsedInRanking:false,rows};
 fs.writeFileSync(output,JSON.stringify(summary,null,2),{flag:'wx'});
 console.log(JSON.stringify({...summary,rows:undefined,skipped:skipped.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());

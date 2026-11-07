// Only alters untouched, unreviewed synthetic weekly reports. Never clears grades.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107'),output=path.join(dir,'grading-report-examples');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`;
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const {Report}=require('../src/models/BusinessModels'),Assignment=require('../src/models/Assignment'),User=require('../src/models/User');
(async()=>{
 if(fs.existsSync(output))throw Error('Example directory already exists; do not rerun');
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false});assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const candidates=await Report.find({current:true,kind:'weekly',state:'submitted',__v:1,'history.action':'fixture.report_content_enriched','reviews.0':{$exists:false}}).lean();
 const plans=[];
 for(const report of candidates){const a=await Assignment.findById(report.assignmentId);if(a?.lifecycle!=='active')continue;const company=await User.findById(a.companyUserId).select('+loginEmail'),student=await User.findById(a.studentUserId);const c=Number(company.loginEmail?.match(/enterprise-(\d+)@/)?.[1]);if(!c||c%2===0)continue;
  const content=`BÁO CÁO TUẦN — BẢN CẦN BỔ SUNG\nDữ liệu tổng hợp dùng thử việc đọc, chấm trước và yêu cầu chỉnh sửa.\nSinh viên: ${student.name}\nĐề tài: ${a.topicSnapshot.title}\n\n1. MỤC TIÊU\nEm dự kiến xây dựng các chức năng cơ bản theo yêu cầu thực tập. Em chưa mô tả rõ phạm vi công việc tuần này.\n\n2. CÔNG VIỆC ĐÃ LÀM\nEm đã đọc tài liệu và thử giao diện. Phần kết nối dữ liệu chưa hoàn thành. Em chưa ghi rõ kết quả từng công việc, chưa có sản phẩm để bàn giao và chưa trình bày cách kiểm thử.\n\n3. KHÓ KHĂN\nEm còn lỗi khi kết nối dữ liệu. Em cần trao đổi với người hướng dẫn nhưng chưa nêu câu hỏi cụ thể.\n\n4. KẾ HOẠCH\nEm sẽ tiếp tục làm phần còn lại. Chưa xác định hạn hoàn thành và chưa bổ sung nhật ký đối chiếu.\n\nCác phần chưa có: phân tích và thiết kế, kết quả kiểm thử, bằng chứng sản phẩm, tài liệu tham khảo và bài học rút ra. Đây là ví dụ cố ý chưa đầy đủ, không phải nhận xét về sinh viên thật.`;
  plans.push({report,content,title:'Báo cáo tuần — '+student.name+' — Cần bổ sung',student:student.name,company:company.loginEmail});
 }
 assert.ok(plans.length>0,'No untouched synthetic candidates; preserve user work');
 fs.mkdirSync(output);fs.writeFileSync(path.join(output,'before.json'),JSON.stringify(plans.map(p=>p.report),null,2),{flag:'wx'});
 await mongoose.connection.transaction(async session=>{for(const p of plans){const r=await Report.updateOne({_id:p.report._id,__v:1,content:p.report.content,state:'submitted','reviews.0':{$exists:false}},{$set:{content:p.content,title:p.title},$inc:{__v:1},$push:{history:{actorRole:'student',actorUserId:p.report.studentUserId,action:'fixture.incomplete_report_prepared',at:new Date(),data:{synthetic:true,purpose:'teacher-review-demo-not-real-submission'}}}},{session,runValidators:true});assert.equal(r.modifiedCount,1);}});
 const rows=[];
 for(const report of await Report.find({'history.action':'fixture.report_content_enriched'}).lean()){
  const user=await User.findById(report.studentUserId).select('+loginEmail');
  const file=user.loginEmail.split('@')[0]+'-'+report.kind+'.md';fs.writeFileSync(path.join(output,file),report.content,{flag:'wx'});
  rows.push({id:String(report._id),student:user.name,email:user.loginEmail,kind:report.kind,state:report.state,incomplete:plans.some(p=>String(p.report._id)===String(report._id)),file});
 }
 fs.writeFileSync(path.join(output,'index.json'),JSON.stringify({database,incompletePrepared:plans.length,exported:rows.length,rows},null,2),{flag:'wx'});
 console.log(JSON.stringify({database,incompletePrepared:plans.length,exported:rows.length,existingGradesChanged:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());

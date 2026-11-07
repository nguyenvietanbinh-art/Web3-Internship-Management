// Enrich only untouched synthetic reports from the explicit lifecycle fixture.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/workflow-combined-20261107');
const database='internova_demo_cunhan_kysu_20261107',uri=`mongodb://127.0.0.1:27018/${database}?replicaSet=internovaTestRs`,run='report-content-examples-20261107';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',CHAIN_LISTENER_ENABLED:'false'});
require('../src/config/workflowTestGuard').assertWorkflowTest();
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const {Report,WorkSession,InternshipBatch:Batch}=require('../src/models/BusinessModels'),Assignment=require('../src/models/Assignment'),User=require('../src/models/User'),Task=require('../src/models/Task'),Log=require('../src/models/WorkLog');
const bson=require('mongodb').BSON,hash=row=>crypto.createHash('sha256').update(bson.serialize(row)).digest('hex');
const date=value=>new Date(value).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
function content({report,a,student,company,mentor,b,tasks,logs,sessions}){
 const done=tasks.filter(t=>t.status==='done'),approved=sessions.filter(s=>s.state==='approved'),minutes=approved.reduce((n,s)=>n+(s.minutes||0),0),finished=a.lifecycle==='completed';
 const level=finished?'Đã hoàn thành kỳ thực tập; bản tổng hợp để tra cứu.':report.state==='need_revision'?'Đang cần bổ sung nội dung theo nhận xét của người hướng dẫn.':report.state==='reviewed'?'Đã có nhận xét của hai bên; đang chờ nhà trường xử lý kết quả.':'Đang triển khai; cần người hướng dẫn kiểm tra nội dung và tiến độ.';
 return [
 'DỮ LIỆU TỔNG HỢP PHỤC VỤ KIỂM THỬ ĐỒ ÁN — KHÔNG PHẢI BÁO CÁO CỦA NGƯỜI THẬT',
 `${report.kind==='weekly'?'BÁO CÁO TIẾN ĐỘ THỰC TẬP':'BÁO CÁO TỔNG KẾT THỰC TẬP'}\nSinh viên: ${student.name}\nDoanh nghiệp: ${company.companyName||company.name}\nGiảng viên: ${mentor.name}\nKỳ: ${b.name}\nThời gian thực tập: ${date(a.startDate)} – ${date(a.endDate)}\nĐề tài: ${a.topicSnapshot.title}`,
 '1. BỐI CẢNH VÀ MỤC TIÊU\nKhảo sát quy trình nghiệp vụ của đề tài, xác định người sử dụng và các chức năng cần có. Mục tiêu chuyên môn là phân tích yêu cầu, thiết kế cơ sở dữ liệu, xây dựng API và giao diện; kiểm thử chức năng, phân quyền và xử lý lỗi. Mục tiêu kỹ năng là viết nhật ký, phối hợp với người hướng dẫn và trình bày kết quả có căn cứ.',
 `2. PHẠM VI VÀ PHƯƠNG PHÁP\n${a.topicSnapshot.description||'Triển khai ứng dụng web theo yêu cầu doanh nghiệp.'}\nPhân chia công việc thành thiết kế, triển khai và kiểm thử. Mỗi chức năng cần xác định dữ liệu đầu vào, kết quả dự kiến và trường hợp không hợp lệ. Công nghệ minh họa: React cho giao diện, Node.js cho API và MongoDB cho dữ liệu; không xem lựa chọn công nghệ này là bằng chứng hệ thống đã triển khai thành công.`,
 '3. CÔNG VIỆC VÀ TRẠNG THÁI HIỆN CÓ\n'+tasks.map((t,i)=>`${i+1}. ${t.title}: ${ {todo:'chưa bắt đầu',in_progress:'đang thực hiện',review:'đang chờ kiểm tra',done:'đã hoàn tất'}[t.status]}; tiến độ ghi nhận ${t.progress}%; hạn ${date(t.dueDate)}.`).join('\n'),
 `4. KẾT QUẢ VÀ SẢN PHẨM\n${finished?'Hồ sơ mẫu ghi nhận các task đã hoàn tất và các mốc KPI đã được duyệt.':'Hồ sơ mẫu hiện chưa ghi nhận tất cả task hoàn tất; không kết luận sản phẩm đã sẵn sàng bàn giao.'}\nSản phẩm cần đối chiếu gồm tài liệu yêu cầu, sơ đồ dữ liệu, mô tả API, giao diện và bảng kiểm thử. Không đính kèm URL repository, ảnh hoặc số liệu kiểm thử không tồn tại; người đánh giá cần yêu cầu bằng chứng thực tế trước khi nghiệm thu.`,
 '5. ĐỐI CHIẾU CÁC MỐC KPI\n'+a.kpis.map((k,i)=>`${i+1}. ${k.title} (${k.weightPercent}%), hạn ${date(k.deadline)}: ${{pending:'chưa nộp',submitted:'đã nộp, chờ đánh giá',approved:'đã duyệt',rejected:'cần thực hiện lại'}[k.status]}. ${k.description||''}`).join('\n'),
 `6. NHẬT KÝ VÀ THỜI GIAN\nCó ${logs.length} nhật ký gắn với phân công. Các trạng thái: ${logs.map(l=>`tuần ${l.weekNumber}: ${ {submitted:'đã nộp',approved:'đã duyệt',need_revision:'cần chỉnh sửa',pending_submission:'chưa nộp'}[l.status]}`).join('; ')}.\nCó ${sessions.length} phiên giờ làm mẫu, trong đó ${approved.length} phiên đã duyệt với ${minutes} phút (${(minutes/60).toFixed(2)} giờ). Chỉ tính giờ đã duyệt; phiên chờ hoặc cần điều chỉnh không được cộng vào tổng. Những giờ này là dữ liệu kiểm thử, không chứng minh sự hiện diện thực tế.`,
 '7. KHÓ KHĂN VÀ YẾU TỐ CẦN NGƯỜI HƯỚNG DẪN XEM XÉT\n'+(finished?'Cần kiểm tra việc bàn giao tài liệu và tính đầy đủ của bằng chứng kiểm thử. Kết quả trong database là ví dụ tổng hợp, không đủ để tự động kết luận chất lượng thực tập.':'Các task chưa hoàn tất cần được theo dõi đến hạn. Cần kiểm tra phân quyền, xử lý lỗi API và tính nhất quán dữ liệu. Những phiên giờ có sai lệch cần doanh nghiệp đối chiếu trước khi duyệt. Khó khăn được mô tả để người hướng dẫn hỗ trợ, không phải kết luận sinh viên vi phạm.'),
 '8. KẾ HOẠCH VÀ BIỆN PHÁP\n'+(finished?'Lưu trữ tài liệu, tiếp nhận phản hồi và ghi lại bài học kinh nghiệm. Không mở lại kỳ đã đóng hoặc phát hành chứng nhận blockchain khi chưa kiểm tra điều kiện.':'Ưu tiên hoàn thiện task đang làm, chuẩn bị bài nộp cho task chờ kiểm tra và bổ sung bằng chứng kiểm thử. Làm rõ nhật ký cần chỉnh sửa, đối chiếu giờ làm với doanh nghiệp và cập nhật tiến độ cùng giảng viên. Không tự đánh dấu KPI được duyệt.'),
 `9. TỰ ĐÁNH GIÁ\n${level}\nBài học: cần chia nhỏ yêu cầu, kiểm tra quyền sở hữu dữ liệu, ghi rõ kết quả thực hiện và phân biệt việc đã làm với việc dự kiến. Không tự gán điểm hoặc tạo xác suất rủi ro trong báo cáo.`,
 '10. GIỚI HẠN BẰNG CHỨNG\nNội dung được sinh phục vụ thử nghiệm phân tích báo cáo. Các con số trên lấy từ dữ liệu fixture liên quan tại thời điểm tạo nội dung, không phải kết quả quan sát người thật. Chưa có chứng cứ upload IPFS, giao dịch blockchain hoặc chứng nhận on-chain. Phân tích ngữ nghĩa chỉ hỗ trợ đối chiếu tiêu chí; cảnh báo theo quy tắc phải tách khỏi mô hình dự đoán chưa được huấn luyện.'
 ].join('\n\n');
}
(async()=>{
 const output=path.join(dir,'report-content-result.json');if(fs.existsSync(output))throw Error('Completed enrichment exists; do not overwrite');
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'demo-ready.json'),'utf8')).uri,uri);
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:8000});assert.equal(mongoose.connection.db.databaseName,database);assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');
 const all=await Report.collection.find().toArray(),target=all.filter(r=>r.history?.some(h=>h.action==='fixture.report_prepared'&&h.data?.run==='school-year-examples-20261107'));
 assert.equal(target.length,48,'Unexpected fixture report set');
 const plans=[],skipped=[];
 for(const r of target){
  if(r.__v!==0||!r.content.startsWith('Báo cáo tổng hợp phục vụ kiểm thử đồ án.\nMục tiêu:')||r.updatedAt.getTime()!==r.createdAt.getTime()){skipped.push({id:String(r._id),reason:'Modified after fixture creation; preserve user changes'});continue;}
  const a=await Assignment.findById(r.assignmentId).lean(),student=await User.findById(a.studentUserId),company=await User.findById(a.companyUserId),mentor=await User.findById(a.mentorUserId),b=await Batch.findById(a.batchId);
  const [tasks,logs,sessions]=await Promise.all([Task.find({assignmentId:a._id}).sort({_id:1}).lean(),Log.find({assignmentId:a._id}).sort({weekNumber:1}).lean(),WorkSession.find({assignmentId:a._id}).lean()]);
  const text=content({report:r,a,student,company,mentor,b,tasks,logs,sessions});assert.ok(text.length>3000&&text.length<50000);
  plans.push({id:r._id,prior:r.content,content:text,student:student.name,mentorUserId:String(mentor._id),kind:r.kind,state:r.state,assignmentId:String(a._id)});
 }
 fs.writeFileSync(path.join(dir,'report-content-before.json'),JSON.stringify(target,null,2),{flag:'wx'});
 await mongoose.connection.transaction(async session=>{
  for(const p of plans){const update=await Report.updateOne({_id:p.id,__v:0,content:p.prior},{$set:{content:p.content},$inc:{__v:1},$push:{history:{actorUserId:p.mentorUserId,actorRole:'mentor',action:'fixture.report_content_enriched',at:new Date(),data:{synthetic:true,run,note:'Offline fixture enrichment, not a student submission or human review'}}}},{session,runValidators:true});assert.equal(update.modifiedCount,1,'Report changed concurrently; rollback all enrichment');}
 });
 const ids=new Set(plans.map(p=>String(p.id)));let preserved=0;
 for(const r of all){const after=await Report.collection.findOne({_id:r._id});if(!ids.has(String(r._id))){assert.equal(hash(after),hash(r));preserved++;}else{for(const key of ['state','reviews','finalScore','approvedBy','approvedByUserId','approvedAt','version','current'])assert.deepEqual(after[key],r[key],'Preserve review/approval state');}}
 const result={database,updated:plans.length,skipped,preservedOtherReports:preserved,statesPreserved:true,sections:10,lengthRange:[Math.min(...plans.map(p=>p.content.length)),Math.max(...plans.map(p=>p.content.length))],reports:plans.map(({prior,content,...p})=>({...p,characters:content.length}))};
 fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});
 const sample=plans.find(p=>p.state==='submitted');if(sample)fs.writeFileSync(path.join(dir,'report-example.md'),sample.content,{flag:'wx'});
 console.log(JSON.stringify({...result,reports:undefined}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());

const {HttpError}=require('../utils/http'),policy=require('./placementPolicy');
const {Report,InternshipBatch:Batch,WorkSession}=require('../models/BusinessModels');
const User=require('../models/User'),Task=require('../models/Task');
function variants(context){
 const {student,company,batch,topic,start,end,done,total,approvedMinutes}=context;
 const header=`BÀI TẬP ĐÁNH GIÁ LẠI — KHÔNG THAY BÁO CÁO ĐÃ DUYỆT\nSinh viên: ${student}\nDoanh nghiệp: ${company}\nKỳ: ${batch}\nThời gian: ${start} – ${end}\nĐề tài: ${topic}`;
 const complete=[header,
 '1. Mục tiêu và phạm vi\nThực hành phát triển phần mềm theo yêu cầu doanh nghiệp, từ phân tích yêu cầu, thiết kế dữ liệu đến hoàn thiện chức năng trong đề tài. Phạm vi giới hạn ở các chức năng được giao, không nhận là đã triển khai toàn bộ hệ thống của doanh nghiệp.',
 '2. Cách thực hiện\nChia công việc thành từng phần, đọc tài liệu, phác thảo giao diện và dữ liệu trước khi lập trình. Kiểm tra đầu vào và phân quyền; ghi lại lỗi để sửa cùng người hướng dẫn.',
 `3. Kết quả\nHồ sơ hiện có ghi nhận ${done}/${total} công việc đã hoàn thành. Các sản phẩm cần đối chiếu là mã nguồn hoặc tài liệu, bản thiết kế và hướng dẫn chạy. Bài tập này không kèm sản phẩm đã được kiểm tra độc lập.`,
 '4. Kiểm thử và bằng chứng\nTrình bày các trường hợp dữ liệu hợp lệ, dữ liệu thiếu và truy cập sai quyền; đối chiếu kết quả mong đợi với kết quả thực hiện. Cần mở tài liệu hoặc sản phẩm thực tế trước khi xác nhận mức hoàn thành.',
 `5. Quá trình thực tập\nĐối chiếu nhật ký với các công việc đã giao. Tổng giờ làm được duyệt trong hồ sơ là ${approvedMinutes} phút. Đây là số liệu mẫu của đồ án, không chứng minh thời gian làm việc của người thật.`,
 '6. Khó khăn và bài học\nBan đầu chưa thống nhất dữ liệu giữa giao diện và API, cần trao đổi để làm rõ yêu cầu. Giải pháp là ghi ví dụ dữ liệu và kiểm tra từng bước. Bài học là chia nhỏ công việc và xin hỗ trợ sớm khi bị vướng.',
 '7. Kết luận và cải tiến\nĐối chiếu kết quả với mục tiêu, ghi rõ phần đã làm và giới hạn. Kế hoạch tiếp theo là bổ sung kiểm thử, rút gọn thao tác và hoàn thiện tài liệu. Nguồn tham khảo cần ghi tên và địa chỉ tài liệu thực sự đã sử dụng, không tạo liên kết minh chứng giả.'
 ].join('\n\n');
 const missing=[header,'1. Mục tiêu\nTìm hiểu yêu cầu và hoàn thiện các chức năng được giao trong đề tài.',
 '2. Công việc\nĐã đọc tài liệu, xây dựng giao diện và kết nối dữ liệu. Có thực hiện kiểm thử nhưng chưa trình bày trường hợp cụ thể hoặc kết quả đối chiếu.',
 `3. Quá trình\nHồ sơ ghi nhận ${done}/${total} công việc hoàn thành và ${approvedMinutes} phút đã duyệt. Bài viết chưa nêu được phần việc mình trực tiếp làm.`,
 '4. Khó khăn\nCó lỗi dữ liệu khi tích hợp. Chưa mô tả nguyên nhân, cách sửa và bài học. Chưa có sản phẩm đính kèm để người hướng dẫn kiểm tra. Đây là phiên bản bài tập cố ý còn thiếu, không sửa kết quả thực tập đã duyệt.'
 ].join('\n\n');
 const brief=[header,'Em đã tham gia thực tập theo phân công. Em đọc tài liệu và làm các công việc được giao. Trong quá trình thực hiện có một số khó khăn khi kết nối dữ liệu. Em cần bổ sung phần mô tả kết quả, bằng chứng và bài học. Bài tập này cố ý tóm tắt sơ lược để thử yêu cầu chỉnh sửa.'].join('\n\n');
 return [{id:'complete',label:'Trình bày tương đối đầy đủ',content:complete},{id:'missing_evidence',label:'Thiếu kết quả và minh chứng',content:missing},{id:'brief',label:'Tóm tắt sơ lược, cần bổ sung',content:brief}];
}
async function load(user,id){
 if(user.role!=='mentor')throw new HttpError(403,'Chỉ giảng viên phụ trách được dùng bài tập đánh giá lại');
 const report=await Report.findById(require('./shared').id(id)).lean();if(!report)throw new HttpError(404,'Không có báo cáo');
 const a=await policy.load(user,String(report.assignmentId));
 if(a.lifecycle!=='completed'||report.kind!=='final'||report.state!=='approved'||!report.history?.some(e=>e.action==='fixture.report_prepared'))throw new HttpError(409,'Chức năng này chỉ dành cho bài mẫu tổng kết của kỳ đã hoàn thành');
 const [student,company,batch,tasks,sessions]=await Promise.all([User.findById(a.studentUserId).select('name'),User.findById(a.companyUserId).select('name companyName'),Batch.findById(a.batchId),Task.find({assignmentId:a._id}).select('status dueDate').lean(),WorkSession.find({assignmentId:a._id}).select('state minutes').lean()]);
 const approvedMinutes=sessions.filter(s=>s.state==='approved').reduce((n,s)=>n+(s.minutes||0),0);
 const context={student:student.name,company:company.companyName||company.name,batch:batch.name,topic:a.topicSnapshot?.title||report.title,start:a.startDate.toISOString().slice(0,10),end:a.endDate.toISOString().slice(0,10),done:tasks.filter(t=>t.status==='done').length,total:tasks.length,approvedMinutes};
 return {source_report_id:String(report._id),student_id:String(a.studentUserId),assignment_id:String(a._id),synthetic:true,official:false,context,variants:variants(context),observations:{total_tasks:tasks.length,done_tasks:context.done,overdue_tasks:tasks.filter(t=>t.status!=='done'&&t.dueDate<new Date()).length,open_sessions:sessions.filter(s=>['open','needs_adjustment'].includes(s.state)).length,approved_minutes:approvedMinutes,report_versions:await Report.countDocuments({assignmentId:a._id})},criteria:(a.kpis||[]).map(k=>k.title+' '+(k.description||'')).join('\n')};
}
module.exports={variants,load};

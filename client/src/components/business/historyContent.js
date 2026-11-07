import {displayLabel} from './content';
const names={
 'task.created':'Giao công việc','task.updated':'Cập nhật công việc','task.submitted':'Nộp kết quả công việc','task.criteria_approved':'Xác nhận tiêu chí nghiệm thu','task.criteria_reviewed':'Xác nhận tiến độ công việc','task.draft_saved':'Lưu nháp công việc','task.analyzed':'Đối chiếu bài nộp',
 'report.revision_requested':'Giảng viên yêu cầu bổ sung','report.self_assessed':'Sinh viên tự đánh giá','report.submitted':'Nộp báo cáo','report.superseded':'Lưu phiên bản báo cáo mới','report.reviewed':'Đánh giá báo cáo','report.approved':'Công bố kết quả','report.analysis_saved':'Đối chiếu báo cáo','report.evidence_checked':'Kiểm tra bằng chứng','report.review_draft_saved':'Lưu nháp đánh giá','report.rubric_changed':'Cập nhật quy định đánh giá',
 'worklog.assigned':'Giao yêu cầu theo tuần','worklog.submitted':'Nộp nhật ký','worklog.revised':'Bổ sung nhật ký','worklog.reviewed':'Nhận xét nhật ký','time.checked_in':'Đã vào làm','time.checked_out':'Đã kết thúc ca','time.approved':'Duyệt giờ làm','cv.created':'Tạo CV','cv.updated':'Cập nhật CV','cv.file_uploaded':'Tải tệp CV','cv.file_removed':'Xóa tệp CV',
 'application.submitted':'Đã nộp hồ sơ','application.reviewed':'Đã xét hồ sơ','school.assignment_state':'Cập nhật trạng thái thực tập','school.official_assignment':'Phân công giảng viên',
};
export function historyContent(entry){
 const title=names[entry.action]||(entry.action?.startsWith('fixture.')?'Khởi tạo dữ liệu thực hành':'Cập nhật hồ sơ');
 const details=[entry.data?.comment,entry.data?.reason,entry.data?.feedback].filter(v=>typeof v==='string'&&v.trim()).map(v=>v.slice(0,2000));
 const decision=entry.data?.decision;if(['approved','need_revision','incorrect','accepted','rejected'].includes(decision))details.unshift(displayLabel(decision));
 return{title,details:[...new Set(details)]};
}

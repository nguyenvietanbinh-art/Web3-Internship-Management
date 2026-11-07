export function checkInReason(assignment,sessions=[],now=new Date()){
 if(!assignment)return 'Chọn thông tin thực tập của bạn. Nếu chưa có, nhà trường cần hoàn tất phân công và doanh nghiệp xác nhận bắt đầu.';
 if(assignment.lifecycle==='completed')return 'Đợt thực tập đã hoàn thành, không thể mở ca mới.';
 if(assignment.lifecycle!=='active')return 'Thực tập chưa hoạt động. Doanh nghiệp cần xác nhận bắt đầu trên phân công chính thức.';
 if(!Number.isFinite(Date.parse(assignment.startDate))||!Number.isFinite(Date.parse(assignment.endDate)))return 'Thông tin thời gian chưa hợp lệ; liên hệ nhà trường kiểm tra.';
 if(now<new Date(assignment.startDate))return 'Chưa đến ngày bắt đầu thực tập.';
 if(now>new Date(assignment.endDate))return 'Đã qua thời gian thực tập được phép chấm công.';
 if(sessions.some(s=>s.state==='open'))return 'Bạn đang có ca chưa kết thúc. Hãy kết thúc ca ở lịch sử giờ làm trước khi vào ca mới.';
 if(sessions.some(s=>new Date(s.checkInAt).toISOString().slice(0,10)===now.toISOString().slice(0,10)))return 'Bạn đã có phiên giờ làm trong ngày UTC này. Xem lịch sử hoặc nhờ doanh nghiệp xử lý; không tạo phiên trùng.';
 return '';
}

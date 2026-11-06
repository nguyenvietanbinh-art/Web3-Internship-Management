# Doanh nghiệp chọn kỳ để giao công việc

## Bổ sung: sinh viên đã nhận nhưng chưa phân công

Đã sửa trường hợp kỳ `abshd` có **SV kỹ sư 090** được doanh nghiệp 08 nhận vào đề tài `abs` nhưng dropdown không hiển thị vì chưa có Assignment chính thức.

Dropdown hiện lấy roster của doanh nghiệp trong kỳ, gồm phân công chính thức và sinh viên đã tiếp nhận đang chờ phân công. Sinh viên chờ được hiển thị/cho chọn với nhãn **Đã tiếp nhận · Chờ nhà trường phân công**, kèm ngày của kỳ và giải thích vì sao chưa giao việc được. Đổi sang kỳ khác vẫn reset lựa chọn. Không tự tạo phân công, gắn giảng viên hoặc bỏ kiểm tra thời gian.

GET `/api/core/work/students?batchId=...` chỉ trả sinh viên đã nhận/phân công của chính doanh nghiệp. Dòng chờ là dữ liệu hiển thị từ admission, không phải một Assignment giả. Khi trường phân công xong, dòng chờ được thay bằng phân công thật, không xuất hiện trùng. Chọn dòng chờ không gửi ID hiển thị đó vào API công việc/nhật ký.

Kiểm tra mới: 13 HTTP/DB/NLP tests PASS, 0 FAIL, 1 SBT SKIP; frontend lint/build PASS; Chrome xác nhận SV kỹ sư 090 xuất hiện và chọn được ở kỳ `abshd`, nút giao việc chưa bật khi thiếu phân công. Kiểm tra quyền doanh nghiệp khác, dòng chờ chuyển thành phân công thật, không được giao việc trước formalization/activation. Database nguồn không thay đổi.

Evidence local mới: `accepted-students-roster-browser-results.json`, ảnh `company08-work-student090-pending.png`. Nội dung ban đầu dưới đây được bổ sung bởi quy tắc hiển thị sinh viên đang chờ này.

Cập nhật 06/11/2026.

Trang **Công việc & nhật ký** của doanh nghiệp trong workflow mới có dropdown **Kỳ thực tập để giao công việc**, đặt trước dropdown sinh viên/phân công.

1. Chọn kỳ doanh nghiệp có đề tài hoặc phân công.
2. Chọn sinh viên/phân công chính thức thuộc kỳ đó.
3. Khi phân công đang thực tập và còn trong thời gian được giao, mở **Giao công việc** hoặc **Giao yêu cầu theo tuần** để nhập nội dung, ưu tiên và deadline.

Đổi kỳ sẽ xóa lựa chọn phân công, đóng form cũ và lọc lại danh sách công việc/nhật ký. Hai form giao việc cũng chỉ có các phân công trong kỳ đã chọn. Chưa chọn kỳ thì không tải bảng công việc mọi kỳ. Chưa chọn phân công active thì nút giao việc không bật.

Kỳ có đề tài nhưng chưa có phân công chính thức vẫn được hiển thị, cùng thông báo rõ chưa có sinh viên để giao việc. Việc doanh nghiệp nhận ứng viên không tự bỏ qua bước nhà trường phân công chính thức, gắn giảng viên hoặc điều kiện thời gian thực tập.

Backend GET `/api/core/work/batches` chỉ trả kỳ doanh nghiệp có liên quan. Các GET `/api/core/tasks` và `/api/core/worklogs` hỗ trợ `batchId`, luôn kết hợp scope chủ sở hữu. Gửi `assignmentId` không thuộc `batchId` bị từ chối. Không thêm collection, index, seed hoặc database mới.

Kiểm tra mới: 12 HTTP/DB/NLP tests PASS, 0 FAIL, 1 SKIP (SBT không chạy lại). Kịch bản bổ sung tạo công việc/nhật ký ở hai kỳ và kiểm tra lọc, chặn doanh nghiệp ngoài phạm vi và mismatch kỳ/phân công. Frontend lint/build PASS.

Chrome: 2/2 PASS. Doanh nghiệp 08 có dropdown kỳ và thông báo kỳ chưa có phân công; doanh nghiệp 01 có phân công active dùng được form công việc/nhật ký với danh sách sinh viên đúng kỳ. Đổi kỳ reset lựa chọn; giao diện 390px không tràn ngang. Không giao công việc tùy ý lên dữ liệu demo khi kiểm tra trình duyệt.

Đối chiếu 25 collection database gốc: nội dung và index không thay đổi. Evidence local trong cache workflow: `company-work-period-browser-results.json` và ảnh `company08-work-period-dropdown.png`, `company-task-selected-period.png`, `company-work-period-mobile.png`.

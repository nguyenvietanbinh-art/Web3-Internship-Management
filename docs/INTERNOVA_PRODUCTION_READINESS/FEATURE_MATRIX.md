# Ma trận chức năng V3

| Chức năng | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Sinh viên đối chiếu CV/ngữ nghĩa/từ khóa trong kỳ được cấp | PASS | ai-roles.json, matching-security.json; BERT thật |
| Nhà trường gợi ý phân công, không tự gán | PASS | ai-roles.json; vẫn chặn ngoài thời gian phân công |
| Doanh nghiệp không có xếp hạng/gợi ý ứng viên | PASS | API403 và menu ẩn |
| Giảng viên phân tích bài đã nộp đúng phạm vi | PASS | business-browser.json, ai-roles.json |
| Tiêu chí task, nháp, tệp/phiên bản và xác nhận trọng số | PASS | Integration15 + browser8; sinh viên không tự sửa % |
| Báo cáo tuần nhiều tuần/cùng task, không đếm tiến độ hai lần | PASS | integration + browser; UI chọn nhiều task đã bổ sung |
| Nhiều task trong một báo cáo tuần qua checkbox UI | PASS | weekly-rubric.json; hai task đã nộp được liên kết qua UI, không tự tăng tiến độ |
| Rubric kỳ, giảng viên đề xuất, nhà trường duyệt | PASS | API integration + weekly-rubric.json; UI đề xuất rồi trường phê duyệt tường minh |
| Nháp chấm điểm riêng tư, điểm theo tiêu chí, công bố có chính sách | PASS | Browser bốn vai trò; điểm chỉ công bố sau Admin xác nhận |
| Nhận chỗ cuối/đóng cơ hội/hoàn lượt chống lặp | PASS | role-workflow regression; giữ usedOpportunities làm lịch sử |
| QR/GPS/check-in/out/duyệt giờ | PASS | web3.json + integration; tọa độ kiểm thử, không phải GPS vật lý |
| Camera và GPS trên điện thoại thực | NOT TESTED | Chưa có kiểm thử thiết bị vật lý/quyền hệ điều hành |
| Địa điểm doanh nghiệp lưu/chọn tạo QR | PASS | integration + role-session.json |
| Google Maps tìm địa chỉ/pin ngay trong web | BLOCKED | Chưa có key/provider; hiện có link bản đồ ngoài và nhập/xác nhận tọa độ |
| Hash báo cáo/giờ làm, completion, SBT local | PASS | web3.json, 12 Solidity tests, receipt thật |
| Deadline/chống đăng ký trùng trong Registry | PASS | 3 Solidity tests, chưa deploy thay contract đang chạy |
| Deadline/chốt roster/lưu tiến độ tuần on-chain thống nhất UI/API | PARTIAL | Các module hiện tại chưa cung cấp đầy đủ luồng này |
| IPFS mã hóa/upload/readback thật | BLOCKED | Thiếu Pinata/key/upload consent config; adapter test không phải live upload |
| Chất lượng chấm điểm/rủi ro trên dữ liệu thật | BLOCKED | Không có nhãn độc lập/khảo sát; không tạo confidence giả |
| Portfolio hoàn chỉnh, vận hành production/backup/monitoring | PARTIAL | Chưa nghiệm thu production |

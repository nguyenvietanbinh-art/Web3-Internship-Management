# Kiểm tra kiến trúc trước triển khai — 07/11/2026

Đã đọc yêu cầu đính kèm, kiểm tra Git và các module hiện hành. Working tree có nhiều thay đổi từ các nhiệm vụ trước, được bảo toàn; không reset/clean/commit/push.

| Phần | Hiện trạng | Thay đổi cần thiết |
| --- | --- | --- |
| Công việc | `models/Task.js`, `core/tasks.js`, `core/workPolicy.js`; collection `internship_tasks`; có phân quyền assignment và optimistic version | Tiêu chí có trọng số/phiên bản, draft và phiên bản bài nộp, phân tích có bằng chứng, xác nhận theo tiêu chí |
| Tiến độ | PATCH cho sinh viên tự gửi progress; submit tự ghi 100; review cả bài ghi 100/99 | Chặn nhập phần trăm; chỉ tính trọng số tiêu chí đã được doanh nghiệp xác nhận |
| Hồ sơ và quyền | User/Student/Assignment có User ID, JWT và RBAC hiện hữu | Tái sử dụng policy; không tạo auth mới, không liên quan CV/JD |
| Báo cáo | `business_reports`, version/current, hai review company/mentor, admin approve sau KPI; điểm cuối trung bình hai bên | Giữ luồng phê duyệt; thêm snapshot rubric/đề xuất và điểm theo tiêu chí, lý do điều chỉnh |
| Chấm trước | `nlp/report_grading.py` chấm theo từ xuất hiện và thống kê | Đề xuất theo rubric + xác nhận bằng chứng; không coi từ khóa/độ tương đồng là điểm đạt |
| AI | Local ONNX int8 MiniLM revision pin; `/rank`, `/report`, timeout/guard/cache | Tái sử dụng encoder; bổ sung đối chiếu tiêu chí với trích đoạn có vị trí thật, không tự xác minh sản phẩm |
| Frontend | Work/TaskForms, AiPage/ReportAnalysisResult/ReviewForm; giao diện đang hoạt động | Bỏ nút sửa phần trăm của sinh viên, thêm draft/bằng chứng/phân tích/duyệt tiêu chí và điểm riêng |
| Tệp | Task upload multer 5 MiB, preview/download; report attachment mã hóa; IPFS/chain adapter có guard | Lưu lịch sử tệp bài nộp có giới hạn dung lượng, không truy cập URL bên ngoài khi phân tích; giữ adapter Web3 |
| Thông báo | NotificationReceipt và history được gom theo phạm vi | Bổ sung sự kiện task từ chính history, không tạo collection thông báo mới |

## Thiết kế dữ liệu và tương thích

Mở rộng tùy chọn model Task, InternshipBatch và Report, tái sử dụng collection hiện có. Không chạy migration/index/seed trên database gốc/demo. Công việc cũ chưa có tiêu chí vẫn giữ nguyên dữ liệu lịch sử; UI không coi phần trăm cũ là tiến độ đã xác nhận theo quy tắc mới. Muốn tính tiến độ mới cần doanh nghiệp bổ sung tiêu chí; không tự chuyển đổi bài đã hoàn tất.

Tất cả ghi mới dùng version để chặn stale/concurrent; rubric mới là phiên bản snapshot, điểm và phân tích gắn hash nội dung/phiên bản. Nộp bài và AI tách rời: AI lỗi không rollback bài đã nộp. AI không xác nhận tiêu chí hay tự chốt điểm. Tiến độ tổng hợp tính theo trọng số nhiệm vụ và chỉ tiêu chí đã xác nhận đạt; nhiệm vụ chưa có tiêu chí được báo thiếu, không tự tính đạt.

Draft và phiên bản bài nộp được nhúng trong Task, không collection trùng. Dung lượng tệp lịch sử bị giới hạn để tránh vượt giới hạn MongoDB; không xóa bản cũ để giải phóng chỗ. Rubric theo kỳ lưu trong InternshipBatch, snapshot vào từng kết quả. Báo cáo đã duyệt không bị phân tích ghi đè điểm.

Kiểm thử ghi trên `internova_role_qa_20261107` với URI/replica set/marker chính xác và fixture mới. Model được kiểm trước khi nạp, không train/download/install. Trước khi đưa code vào runtime chính sẽ chạy kiểm thử và công bố phần còn BLOCKED/NOT TESTED, không tuyên bố chất lượng chấm điểm như chuyên gia khi chưa có bộ điểm độc lập.

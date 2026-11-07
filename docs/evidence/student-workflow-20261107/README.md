# Bằng chứng chạy thật — luồng sinh viên 07/11/2026

Database TEST `internova_role_qa_20261107`, website localhost5189/API57419. Tài khoản và dữ liệu tổng hợp; ảnh chụp browser thật, không tạo ảnh bằng AI. Không có token/password trong các file công bố ở đây.

- `results.json`:11 browser checks PASS, requests chỉ method/path,0 exception.
- `actual-time.json`:63,144 giây chờ thực,1 phút đã duyệt trong TEST; không phải giờ làm người thật.
- `navigation-results.json`:5 checks PASS sau sửa harness; không ghi dữ liệu nghiệp vụ khi điều hướng/Back/Forward/form chưa lưu; logout và đổi tài khoản sạch trạng thái.
- `cv-upload-results.json`:16 tệp PDF/DOCX, số byte/ký tự và parser thực tế; trích metadata đã loại tài khoản/mật khẩu.
- `student-integration.log`:5 integration PASS và16 tệp upload. `manual-ready.json`:cohort bàn giao mới active,0 phiên/0 báo cáo; tách với cohort đã chạy browser, không xóa dữ liệu cũ.
- `workflow-regression.log`:13 PASS,1 SBT SKIP. `core-regression.log`:33 PASS. `search-regression.log`:3 browser PASS, gõ từng ký tự.
- Ảnh: `student-unified-overview.png`, `manual-check-in-open.png`, `cv-pdf-upload.png`, `weekly-report-under-work.png`, `final-report-submitted.png`, `rich-cv-topic-matching.png`, `student-mobile-dark.png`, `student-navigation-preserved.png`.

Ảnh thể hiện đúng thời điểm chụp. Dữ liệu TEST về sau có thể khác khi người dùng tiếp tục thao tác. Snapshot hash/index các database gốc/demo để ở cache local `workflow-combined-20261107/student-preserved-before.json` và `student-preserved-after.json`; so sánh thực tế PASS. Không xuất dữ liệu database hoặc file đăng nhập lên thư mục bằng chứng.

Xem [báo cáo thay đổi và hướng dẫn tự thử](../../STUDENT_WORKFLOW_UPDATE.md).

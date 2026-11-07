# Bằng chứng browser thực tế — 07/11/2026

Các ảnh được chụp trực tiếp bằng Edge headless trong môi trường TEST riêng tại localhost5189, API57419, MongoDB `internova_role_qa_20261107`; không dựng ảnh hoặc sửa nội dung kết quả. Tài khoản, tên và báo cáo trong bộ kiểm thử là tổng hợp, không đại diện người thật hoặc nhãn chuyên gia.

**Lần chạy cuối sau chỉnh state/phiên:** [final/results.json](final/results.json), 16/16 PASS; ảnh tương ứng trong thư mục `final/`. Các file tại thư mục cha là lần chạy PASS trước đó, được giữ nguyên.

- `results.json`: 16 nhóm kiểm tra PASS, danh sách method/path request và runtime exceptions; không có token, cookie, password hoặc request body.
- `student-real-semantic-matching.png`: gọi Sentence-BERT thật, CV Go/Gin/PostgreSQL và đối chiếu yêu cầu; hai đề tài đủ kỹ năng khai báo. Không chứng minh xác suất tuyển dụng.
- `student-search-restored.png`: khôi phục kỳ/từ khóa sau chuyển trang, Back/Forward và reload.
- `mentor-practice-proposed.png`: phiếu chấm trước trên bài tập riêng, giảng viên có thể kiểm tra/sửa; không tự ghi điểm đã chốt.
- `admin-real-local-sbt.png`: Admin không kết nối ví cá nhân, Backend đối chiếu receipt/token thật của Hardhat QA31337 và hiển thị token1 không chuyển nhượng. Không phải chứng nhận công khai hoặc chứng nhận cho sinh viên thật.

Đối chiếu đầy đủ và các phần chưa nghiệm thu: [ROLE_WORKFLOW_COMPLETION.md](../../ROLE_WORKFLOW_COMPLETION.md).

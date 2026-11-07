> **Đối chiếu kỹ năng và BERT đã nối đủ — 07/11/2026:** Sửa API workflow trước đây gửi kỹ năng đề tài rỗng; hiện dùng Topic.requiredSkills đã có. Bổ sung yêu cầu cụ thể cho 60 đề tài/144 cơ hội do script tạo, giữ 73 CV ứng tuyển. Giao diện hiện kỹ năng yêu cầu/đáp ứng/cần bổ sung và doanh nghiệp có ô nhập kỹ năng. Bốn nhóm CV × TF-IDF/SBERT đều HTTP 200, BERT inference thật; 8 unit/route/guard tests, lint/build PASS. Browser NOT TESTED; không coi toàn dự án đã production-ready. [Bằng chứng, tài khoản và giới hạn](SKILLS_MATCHING_IMPLEMENTATION.md).
# GPA và kỹ năng đa dạng cho sinh viên

Ngày bổ sung: 07/11/2026. Database hiện tại `internova_demo_cunhan_kysu_20261107`; website http://localhost:5188/.

## Đã bổ sung

- 271 sinh viên tổng hợp được cập nhật đồng bộ kỹ năng giữa tài khoản, hồ sơ sinh viên và CV hiện tại; GPA lưu cùng hồ sơ sinh viên và CV.
- Một sinh viên có thay đổi trước đó được bỏ qua để bảo toàn công việc người dùng.
- GPA 2,00–4,00, độc lập với số kỹ năng; không giả định điểm học tập cao đồng nghĩa nhiều kỹ năng.
- 71 sinh viên có 2 kỹ năng; 72 có 4; 64 có 7; 64 có 10.
- Tám hướng: giao diện web, máy chủ Node.js, Java, phân tích dữ liệu, kiểm thử, thiết kế trải nghiệm, di động và vận hành hệ thống.
- CV được bổ sung tóm tắt và mô tả đồ án học tập cùng hướng kỹ năng. Mọi thông tin vẫn là tổng hợp, không đại diện thành tích người thật.

GPA hiện chưa được dùng để tăng/giảm điểm gợi ý. Matching dùng nội dung CV và kỹ năng; không tự thêm một công thức xếp hạng theo GPA. Nội dung mô tả đề tài hiện còn khá khái quát nên kết quả chưa đủ để khẳng định chất lượng gợi ý nghề nghiệp.

## Tài khoản đã kiểm tra

Mật khẩu khởi tạo bằng MSSV trước `@gmail.com`, nếu người dùng chưa thay đổi.

| Email | GPA | Số kỹ năng | Hướng |
| --- | ---: | ---: | --- |
| 2211000002@gmail.com | 2,13 | 2 | Máy chủ Node.js |
| 2211000009@gmail.com | 3,04 | 4 | Giao diện web |
| 2211000017@gmail.com | 2,07 | 7 | Giao diện web |
| 2211000027@gmail.com | 3,37 | 10 | Java |

1. Đăng nhập một tài khoản trên, mở **CV của tôi** để xem GPA, kỹ năng và mô tả.
2. Mở **Gợi ý đề tài phù hợp**, chọn kỳ được cấp.
3. Hiện chọn **TF-IDF** để thử, vì BERT đang bị guard RAM chặn ở thời điểm kiểm tra.
4. Bấm **Tìm đề tài phù hợp**. Bốn nhóm trên đều trả HTTP 200 với năm gợi ý qua API thực tế.
5. Các hồ sơ ứng tuyển đã gửi dùng CV chụp tại thời điểm nộp, nên không tự thay đổi theo CV hiện tại. 73 hồ sơ đã gửi được đối chiếu BSON và giữ nguyên. Dùng CV hiện tại để thử gợi ý sinh viên hoặc ứng tuyển tiếp, không sửa snapshot lịch sử để làm đẹp xếp hạng doanh nghiệp.

## Kiểm tra và bảo toàn

- Script chỉ chọn tài khoản có dấu vết khởi tạo tổng hợp và định dạng MSSV đã biết, chưa thay đổi phiên bản tài khoản/hồ sơ/CV, chưa upload hoặc trích xuất tệp. Không bổ sung vào tài khoản thật/import.
- Transaction cập nhật 271 bộ tài khoản–sinh viên–CV, tăng phiên bản để tránh lưu nhầm từ trang cũ. Bản trước và kết quả được lưu trong cache đã ignore. Không chạy lại script sau khi có marker.
- Đọc lại toàn bộ 271 bộ hồ sơ: GPA và kỹ năng khớp nhau. Bốn tài khoản đăng nhập/CV/matching TF-IDF API PASS.
- BERT lần kiểm tra mới: HTTP 503; `/api/v1/nlp/status` báo `INSUFFICIENT_MEMORY_REQUIRE_1024_MIB`, RAM khả dụng khoảng 779 MiB. Không hạ guard hoặc tạo fallback thành công giả. Bằng chứng BERT chạy ở các lượt trước không được coi là kết quả lượt này.
- Helper kiểm tra lần đầu sai đường dẫn module MongoDB, đã sửa đường dẫn thư viện hiện có, không cài dependency. Sau đó tách BERT BLOCKED khỏi bốn phép thử TF-IDF PASS.
- Browser E2E: NOT TESTED. Không đổi API, schema, giao diện, điểm báo cáo, phân công hoặc database cũ trong đợt này; không cần build lại vì không sửa Frontend.

Script: `server/scripts/enrich-student-skills.cjs`. Kết quả và danh sách từng sinh viên: `contracts/node_modules/.cache/workflow-combined-20261107/student-skills-gpa-result.json`. Không có mật khẩu/token trong kết quả này.

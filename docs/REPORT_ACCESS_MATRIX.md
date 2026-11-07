# Quyền đọc và đánh giá báo cáo — 07/11/2026

Áp dụng cho quy trình theo kỳ (`SCHOOL_WORKFLOW_ENABLED=true`). Việc ẩn menu chỉ hỗ trợ giao diện; Backend kiểm tra JWT, vai trò và phân công chính thức trên từng request.

| Chức năng | Sinh viên | Doanh nghiệp | Giảng viên | Nhà trường |
|---|---|---|---|---|
| Danh sách/nội dung báo cáo | Của mình | Sinh viên có phân công chính thức tại doanh nghiệp | Sinh viên được giao hướng dẫn | Tất cả trong quy trình theo kỳ |
| Nộp báo cáo | Của mình, phân công đang hoạt động, trong thời gian | Không | Không | Không |
| Xem/tải tệp đính kèm | Cùng phạm vi báo cáo | Cùng phạm vi báo cáo | Cùng phạm vi báo cáo | Cùng phạm vi báo cáo |
| Đánh giá báo cáo hiện hành | Không | Điểm/nhận xét doanh nghiệp | Phiếu 7 tiêu chí và nhận xét | Chốt sau hai đánh giá đồng ý |
| Phân tích/chấm trước | Không | Không | Báo cáo được hướng dẫn | Không tự thêm công cụ phân tích báo cáo |
| Thử chấm lại bài tổng hợp đã chốt | Không | Không | Form riêng, không lưu vào điểm chính thức | Giữ nguyên kết quả đã chốt |

## API và file

- `GET /api/core/reports`: scope từ `placementPolicy.scope`; lọc `assignmentId`, `batchId`, `kind`, `state`, tìm `q` theo tiêu đề, sinh viên/MSSV, kỳ, đề tài, công ty, giảng viên; phân trang trên server.
- Mỗi dòng thêm `context`: `studentName`, `studentCode`, `batchName`, `topicTitle`, `companyName`, `mentorName`. Không có mật khẩu/token/email đăng nhập trong context.
- `POST /api/core/reports`: chỉ sinh viên; bản cũ và bản mới được xử lý trong một transaction trong workflow replica set. Lỗi insert phải giữ bản cũ hiện hành.
- `POST /api/core/reports/:id/reviews`: chỉ doanh nghiệp/giảng viên có phân công; kiểm tra phiên bản, bài hiện hành, chưa chốt và chưa đánh giá bởi vai trò đó.
- `POST /api/core/reports/:id/approve`: chỉ Admin, không thay quy trình chốt điểm hiện có.
- `GET /api/core/web3/reports/:id/artifacts`: kiểm quyền báo cáo trước khi liệt kê metadata; không trả envelope mã hóa.
- `GET /api/core/web3/artifacts/:id/file`: kiểm quyền qua báo cáo của artifact; chỉ tệp đính kèm PDF/DOCX `verified`, có thời điểm xác minh; giải mã bản lưu tại server và đối chiếu kích thước/hash. Trả attachment, `no-store`, `nosniff`. Đây là tải bản lưu đã xác minh, không phải readback IPFS mới mỗi lần tải.
- `GET /api/core/reports/:id/practice`, `POST /api/core/ai/reports/:id/practice-analyze`: chỉ giảng viên đúng phân công; chỉ bài tổng hợp cuối kỳ đã chốt trong phân công hoàn tất. Form bài tập không thay bài nộp hoặc điểm thật.

Triển khai: `server/src/core/reports.js`, `reportContext.js`, `reportPractice.js`, `placementPolicy.js`, `web3.js`; UI `Reports.jsx`, `reports/ReviewForm.jsx`, `CompletedReportPractice.jsx`, `ReportAttachments.jsx`.

## Bằng chứng và giới hạn

`server/test/role-workflow.integration.test.js` kiểm tra đọc chéo sinh viên, doanh nghiệp và giảng viên ngoài phạm vi trả 404; sai vai trò chấm trả 403; tệp chưa xác minh trả 409 kể cả đúng quyền; envelope không xuất hiện trong DTO. Regression nghiệp vụ/bảo mật kiểm tra phiên bản báo cáo, hai bên chấm và chốt kết quả. Browser QA bốn vai trò mở toàn văn mà không ghi điểm khi xem.

Chưa có credentials IPFS live trong môi trường này. Không tạo artifact `verified` hoặc CID giả để làm đầy dữ liệu. Kiểm thử tải thành công từ một tệp Pinata thật vẫn BLOCKED; mã hóa/readback/hash đã có adapter tests được ghi rõ là transport giả lập. Trường hợp không có tệp đã xác minh, giao diện không dựng nút tải thành công giả.

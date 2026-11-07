# Đối chiếu yêu cầu đồ án

## Nguồn và cách hiểu

Nguồn chính: `Thư mục mới/KLCN129_Trần-Việt-Hùng.docx`, mục 5–7 và thang điểm mục 9. Nguồn chi tiết: `Thư mục mới/Tuần-3_-sơ-đồ-123.docx`, UC-01–UC-07. Đọc văn bản XML của DOCX, chưa kiểm tra trực quan tất cả sơ đồ. `docs/PROGRESS.md` được dùng để hiểu lịch sử, không làm trạng thái hiện tại. Không tự thu hẹp đề tài thành KPI dashboard.

**Có source** không đồng nghĩa **đã kiểm thử** hoặc **đã đáp ứng**. Bảng này chỉ ghi nhận bằng chứng hiện có; chưa chấm điểm hay gán tỷ lệ hoàn thành.

| Yêu cầu | Hiện trạng/bằng chứng | Mức đáp ứng và còn thiếu | Phát hiện liên quan |
| --- | --- | --- | --- |
| MERN, API và giao diện | React/Vite, Express, Mongoose, schemas và REST đã có | Có triển khai trong source; chưa build/boot/E2E trong audit | A01, A24 |
| Đăng nhập/đăng xuất, xác thực và phân quyền | Nonce ký ví, JWT, owner/student/evaluator ở nhóm topics; token logout ở client | Một phần. Demo bypass và quyền nhóm internship chưa đủ; admin/khóa tài khoản chưa có | A08, A10, A25 |
| Đổi/quên mật khẩu, quản lý tài khoản Admin | Đề cương nhắc đổi mật khẩu; Word UC-06/07 mô tả email, bcrypt, reset và khóa | Chưa thấy model/API/UI tương ứng. Có dependency bcryptjs không chứng minh đã dùng; cần triển khai hoặc xác nhận thay đổi tài liệu sang wallet-only | A21 |
| CV/JD và GPA/hồ sơ sinh viên | Student có skills/GPA/cvCid; JD model/GET/POST, CV form | Một phần: form không lưu; chưa nhận/trích file CV; GPA không được dùng trong matching | A17 |
| Matching/Ranking CV–JD | FastAPI `/api/match`, Node adapter, `/internship/match-cv` sort score | TF-IDF thực chạy; chưa chứng minh BERT, chưa benchmark CV/JD thật; điểm giả trước matching cần bỏ | A18, A20 |
| Ứng tuyển, xét duyệt/phân bổ thực tập | API company assign topic đã có | Ứng tuyển JD chỉ toast; chưa có application, danh sách xét duyệt hoặc liên kết JD→assignment | A17, A19 |
| Precision@K, Recall@K, MAP, NDCG@K | Đề cương yêu cầu thước đo ranking | Chưa thấy dataset gán nhãn, evaluator, kết quả hoặc báo cáo so sánh | A20, A24 |
| Lưu tài liệu/portfolio IPFS, hash trên contract | Pinata helpers, submit KPI JSON/CID/SHA-256, Platform submitKPI/Registry submitEvidence | Một phần trong source; chưa upload/pin/readback thật, chưa file/portfolio flow, chưa chứng minh hash trên deployment đang chạy | A01, A04, A12, A17 |
| Nộp báo cáo tuần/cuối kỳ | KPI submit và WorkLog POST/GET | KPI có AI/IPFS, nhưng worklog tuần chỉ DB; chưa phân loại tuần/cuối kỳ trọn vẹn, chưa hàng đợi ngoại lệ như UC-04 | A08, A21 |
| BERT phân tích tiến độ/rủi ro, cảnh báo | Service phân tích tương đồng KPI + keyword, nhánh tùy chọn SBERT | Chưa có bộ phân loại rủi ro/notification đến công ty/trường, chưa pipeline nhật ký tuần | A18, A20, A21 |
| Accuracy/Precision/Recall/F1/Confusion Matrix | Đề cương yêu cầu đánh giá báo cáo các lớp tiến độ | Chưa có evaluator/gán nhãn/metrics. 12 smoke checks chỉ kiểm tra kỹ thuật, không thay metrics | A20, A24 |
| Task, số giờ làm và thống kê | Task status API, attendance check-in, dashboard và worklog | Một phần; không checkout/duration/timesheet; giao task UI sai người nhận; scope công ty hardcode | A08, A09, A21 |
| QR xác thực vị trí/thời gian → blockchain | Session QR API và nút check-in đã có | Chưa đạt: hình QR mô phỏng, không scan/validate hash/hạn/GPS; không ghi check-in on-chain | A06, A07 |
| Dashboard công ty/nhà trường/sinh viên | DashboardView, topics và roleStats | Một phần; chưa dashboard nhà trường/admin, số liệu fallback bịa và quyền UI lệch | A18, A21, A25 |
| Điểm đánh giá qua Smart Contract | Platform evaluate/complete và client ethers calls; API KPI evaluation | Có source; chưa E2E, quyền mentor và rounding lệch, có thể DB thành công/chain thất bại | A04, A14, A15 |
| Chứng nhận NFT/SBT on-chain không làm giả | Platform lưu cờ/CID/event; explorer UI | Chưa đạt NFT/SBT: không mint token, explorer có thể xác minh mẫu không tồn tại | A02, A03, A05 |
| Kiểm thử contract ổn định | Ba test thuận cho Platform; artifact/cache | Chưa chạy audit; thiếu negative cases và Registry; script npm test contract lỗi; Hardhat config cần xác minh | A13, A23 |
| Kiểm thử API/Postman, Lighthouse, UAT | Backend foundation tests có trong repo | Chưa chạy backend vì test ghi/xóa DB; chưa thấy collection Postman, Lighthouse report, phản hồi người dùng trong các thư mục được kiểm tra | A23, A24 |
| Deploy backend, Atlas, frontend, Sepolia | Netlify config, env mẫu, local Hardhat metadata | Chưa có bằng chứng môi trường hoạt động/testnet; chưa thể xác nhận triển khai chỉ từ các file cấu hình | A01, A15, A24 |
| Phân tích, sơ đồ, kế hoạch và báo cáo | DOCX, architecture, Mermaid ERD trong mongodb-setup | Có tài liệu; chưa thẩm định toàn bộ sơ đồ ảnh, tài liệu tiến độ/khả năng source cần đồng bộ | A24 |

## Các luồng chưa nối đầy đủ

1. CV file → trích text/GPA → hồ sơ đã lưu → matching có engine → ứng tuyển JD → xét duyệt → phân công.
2. QR thật → scanner/GPS → xác thực phiên theo công ty/assignment → tính giờ → ghi chain.
3. Nhật ký tuần → IPFS → AI BERT phân loại rủi ro → thông báo nhà trường/doanh nghiệp → lưu kết quả và retry.
4. Chấm điểm → receipt đã xác minh → mint NFT/SBT → event → normalized DB → tra cứu bằng token/tx trên đúng chain.

## Những điểm cần chốt khi lập kế hoạch sửa

- Chọn một contract canonical: Platform một sinh viên hay Registry nhiều assignment; hiện UI dùng Platform.
- Chọn NFT hay SBT và tiêu chuẩn xác minh; không dùng hai tên như đã triển khai khi chỉ có cờ boolean.
- Chốt đăng nhập ví có thay thế các yêu cầu tài khoản/mật khẩu trong đề cương hay không; chưa có tài liệu chấp thuận thay đổi phạm vi.
- Chốt rubric điểm/rounding, mentor và trường có đánh giá độc lập hay chung quyền công ty.
- Phạm vi demo rút gọn có thể chuẩn bị trước, nhưng không được xem các yêu cầu còn thiếu là đã đáp ứng.

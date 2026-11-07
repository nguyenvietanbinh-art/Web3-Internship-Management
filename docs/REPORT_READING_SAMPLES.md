# Bài báo cáo để giảng viên đọc và phân tích — 07/11/2026

## Cách dùng trên website đang mở

1. Mở **http://localhost:5188**, tải lại trang bằng Ctrl+F5 nếu chưa thấy nút mới; giữ tài khoản giảng viên đang dùng.
2. Vào **Phân tích báo cáo thực tập** → chọn báo cáo của sinh viên phụ trách.
3. Ở **Nội dung dùng để phân tích**, chọn:
   - **Bài báo cáo đã nộp:** đọc/phân tích đúng nội dung hiện lưu trong MongoDB.
   - **Bài mẫu chi tiết theo đề tài:** đọc/phân tích bài mẫu bổ sung, không thay bài đã nộp hoặc điểm đã chốt.
4. Bấm **Xem bài báo cáo** để đọc toàn văn ngay tại trang này, đóng cửa sổ đọc rồi bấm **Phân tích báo cáo**.
5. Kết quả ghi rõ đang dùng bài đã nộp hay bài mẫu và số ký tự. Điểm chấm trước của bài mẫu không được lưu vào điểm chính thức của sinh viên.

Có thể chọn Nguyễn Thu Giang — Báo cáo tổng kết (phân công hoàn tất) hoặc Nguyễn Hải Đăng — Báo cáo tuần cần bổ sung (phân công đang thực tập). Giảng viên phải thuộc đúng phân công; ngoài phạm vi trả404, không mở rộng quyền theo tên hiển thị.

## Dữ liệu đã chuẩn bị

Database đang dùng hiện có 49 báo cáo, trong đó 48 báo cáo thuộc bộ dữ liệu tổng hợp. Bốn bài của Giang/Đăng đã có nội dung nhưng còn chung chung, dài khoảng921–3.623 ký tự; trước thay đổi này trang phân tích không có nút đọc toàn văn.

Đã tạo **48 bài mẫu chi tiết** cho các báo cáo tổng hợp hiện hành đã nộp/đã hoàn tất, gắn đúng phân công và đề tài website thương mại điện tử của 12 doanh nghiệp. Có nội dung cụ thể về luồng tra cứu/đặt yêu cầu, dữ liệu, kiểm tra đầu vào, quyền truy cập, tránh gửi trùng, xử lý cập nhật đồng thời; tiến độ/task/nhật ký/tổng giờ lấy từ hồ sơ liên quan. Các tình huống kiểm thử được ghi là **kế hoạch cần chạy**, không tạo kết quả PASS, repository hoặc ảnh sản phẩm không tồn tại.

Có hai mức bài: đủ cấu trúc và còn thiếu kết quả/kiểm thử; không tự nâng điểm để tạo chênh lệch. Ví dụ:

- [Nguyễn Thu Giang — báo cáo tổng kết](report-samples/NGUYEN_THU_GIANG_BAO_CAO_TONG_KET.md): khoảng7.280 ký tự.
- [Nguyễn Hải Đăng — báo cáo cần bổ sung](report-samples/NGUYEN_HAI_DANG_BAO_CAO_CAN_BO_SUNG.md): khoảng6.453 ký tự.

Đây là **bài viết tổng hợp có nội dung đầy đủ để thử chức năng**, không phải bài nộp của người thật hoặc nhãn chuyên gia. Không coi việc mô tả giải pháp là bằng chứng sản phẩm đã chạy. Chưa có dữ liệu để khẳng định mô hình đánh giá đúng chất lượng báo cáo thực tế.

## Bảo toàn bài nộp và điểm

Không ghi database hiện hành để thay các bài đã duyệt. Các file bổ sung nằm ở:

`contracts/node_modules/.cache/report-reading-samples/internova_demo_cunhan_kysu_20261107/`

Mỗi bài có JSON cho ứng dụng, Markdown để mở đọc và hash nội dung. File chứa ID báo cáo, ID phân công, phiên bản và hash bài gốc; Backend kiểm các thông tin này trước khi trả bài hoặc phân tích. Bài gốc đổi nội dung thì mẫu cũ không tự thay thế bài mới; cần chuẩn bị mẫu tương ứng. Không tự tạo mẫu khi GET/render.

Ngoài ra có12 bài cho database TEST `internova_role_qa_20261107`, phục vụ kiểm thử trên localhost5189. Các thư mục cache, credential và browser profile không được đưa lên Git. Hai file Markdown trong tài liệu là bản tham khảo, sửa chúng không tự sửa database hoặc bài đang phân tích.

Script `server/scripts/prepare-report-reading-samples.cjs` chỉ đọc MongoDB, thêm file bằng chế độ không ghi đè. Chạy lại bảo toàn48/12 file; hash toàn bộ collection báo cáo (gồm bài và điểm) trước–sau giống nhau:

- Database đang dùng: `0985b48f57f095eb36b0267c606af845c1f3559d6252328ae43027b395b012e5`.
- Database TEST: `578ee71ebb7cf976e15330888fea78202da626b87b932023f592d28aef68839b`.

## API và source

- `GET /core/reports/:id/reading-sample`: giảng viên đúng scope, đọc file mẫu đã có, không ghi dữ liệu.
- `POST /core/ai/reports/:id/analyze`: tùy chọn `reportSource=submitted|sample`; bỏ trống giữ hành vi cũ, phân tích bài đã nộp. Không chấp nhận nội dung/path bất kỳ từ client qua tham số này.
- Response bổ sung `document.source`, `contentHash`, `characters`, `reportVersion`; các trường kết quả cũ giữ nguyên.
- `server/src/core/reportSampleContent.js`, `reportSamples.js`, `reports.js`, `ai.js`; UI `AiPage.jsx`, `ReportAnalysisResult.jsx`.

## Kiểm thử

- **3/3 unit PASS:** nội dung bài đầy đủ/thiếu; ràng buộc đúng database/báo cáo/phân công/hash/phiên bản, từ chối sửa nội dung không khớp.
- **API TEST PASS:** đúng giảng viên, từ chối vai trò khác và báo cáo ngoài scope; TF-IDF và Sentence-BERT thật cùng phân tích đúng hash của bài7.060 ký tự; nguồn mặc định vẫn là bài đã nộp; hash báo cáo/điểm trước–sau không đổi.
- **3/3 browser PASS:** mở bài đã nộp tại trang phân tích; đọc toàn văn mẫu; phân tích ngữ nghĩa thật, hiển thị đúng nguồn và không gọi API lưu điểm. Không có runtime exception.
- **10/10 regression AI PASS**, frontend lint0error/0warning và buildPASS.

Bằng chứng local: `.cache/role-workflow-qa-20261107/report-reading-api-result.json`, `report-reading-browser-1794017041862/results.json` và ảnh cùng thư mục. Kiểm thử ghi chỉ dùng TEST mới; không seed/migration, không thay schema, không cài dependency, không commit/push.

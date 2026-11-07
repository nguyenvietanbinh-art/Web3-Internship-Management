# CV mẫu để upload trực tiếp

Tám CV tổng hợp, mỗi CV có **PDF, DOCX, Markdown và HTML nguồn**. PDF được in bằng Edge đã cài; DOCX là gói OOXML thật, không đổi đuôi file. Không có người thật, ảnh, chứng chỉ, URL sản phẩm hoặc kinh nghiệm doanh nghiệp giả làm bằng chứng.

| File gốc | Hướng | Kỹ năng và tình huống phù hợp |
|---|---|---|
| `01-frontend` | Frontend | HTML/CSS/JavaScript/React/REST API; giao diện website thương mại điện tử |
| `02-backend` | Backend | Node.js/Express/MongoDB/REST API/Git; cổng tuyển dụng và quản lý hồ sơ |
| `03-fullstack` | Full-stack | React/Node.js/MongoDB; chức năng web từ UI đến API |
| `04-qa` | Kiểm thử | Manual Testing/Test Cases/Postman/API Testing/SQL; kiểm thử theo dõi kho |
| `05-data` | Dữ liệu | Python/SQL/Pandas/Excel/Power BI; dashboard doanh thu |
| `06-ai-nlp` | AI/NLP | Python/Pandas/SQL/NLP; tình huống phân tích nội dung ở TEST, mức giao nhau một phần với đề tài dữ liệu cũ |
| `07-blockchain` | Blockchain | Solidity/ethers.js/Node.js/Git; bài tập Hardhat local; TEST mới có yêu cầu tương ứng, không mặc định kỳ cũ có đề tài blockchain |
| `08-beginner` | Ít kinh nghiệm | HTML/CSS/Git; mới học web, thiếu React/API, dùng so sánh trường hợp chưa đáp ứng đủ |

GPA minh họa không được dùng để tự cộng điểm gợi ý. Nội dung gồm mục tiêu, học vấn, kỹ năng, dự án/vai trò, kinh nghiệm học tập, phối hợp/giải quyết khó khăn, lịch tham gia và định hướng. “Siêng năng”, “chủ động” là lời tự khai báo, chưa được xác minh.

## Upload

1. Mở website TEST **http://localhost:5189**, dùng file tài khoản local `contracts/node_modules/.cache/student-workflow-20261107/manual-login-student-workflow.txt`. Không ghi mật khẩu vào tài liệu/ảnh/Git.
2. Vào **CV của tôi** → **Chọn file từ máy** → chọn `.pdf` hoặc `.docx` trong thư mục này → **Tải CV từ máy lên**.
3. Mở **Xem nội dung đọc từ CV**, kiểm tên tiếng Việt, kỹ năng và nội dung. Thông báo lưu chỉ xuất hiện sau khi parser và API hoàn tất.
4. Kiểm tra/bổ sung **Thông tin CV**, nhất là danh sách kỹ năng có cấu trúc. Upload giữ thông tin đã nhập; không tự coi mọi từ tìm thấy trong file là kỹ năng đã xác minh.
5. Với sinh viên chưa có nơi tiếp nhận, vào **Gợi ý đề tài phù hợp**, chọn kỳ được cấp và TF-IDF/Sentence-BERT. Mô hình đọc cả nội dung tệp đã trích xuất; kỹ năng đáp ứng/còn thiếu được đối chiếu riêng từ danh sách khai báo.

Tìm kiếm/gợi ý chỉ trong kỳ được cấp và cơ hội còn tuyển. Không có cam kết các CV đều nhận điểm cao hoặc đều tìm được đề tài trong mọi kỳ. Nếu nội dung quá dài so với giới hạn mô hình, UI phải báo phần nội dung chưa được bao phủ; không coi là đã đối chiếu toàn CV. PDF dạng ảnh/OCR không thuộc bộ mẫu này.

## Bằng chứng

Integration `server/test/student-workflow.integration.test.js` upload đủ **16 tệp** qua API thật trên TEST; kiểm SHA-256, tên tiếng Việt, tiêu đề kỹ năng, parser và dữ liệu trích xuất. Snapshot CV đã ứng tuyển không đổi khi upload lại CV hiện tại. Browser còn kiểm thao tác chọn PDF từ máy, lưu thành công và mở phần văn bản đã đọc.

Nguồn: nội dung tự viết bởi công cụ cho mục đích thử nghiệm; `manifest.json` có `synthetic=true`, `expertLabel=false`. Không dùng bộ này làm nhãn chuyên gia hoặc công bố độ chính xác ngoài thực tế.

Script tái tạo: `scripts/demo/generate-sample-cvs.py`, `print-sample-cvs.cjs`. Chúng từ chối ghi đè file đã có; không chạy lại chỉ để mở CV. Không cài dependency khi tạo file.

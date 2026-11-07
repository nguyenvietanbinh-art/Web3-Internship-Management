# Báo cáo Nguyễn Hoàng Phúc

Reuse đúng tài khoản/bài nộp TEST đã có, không tạo học sinh mới để ép PASS. Mã báo cáo vàhash trong evidence/trial-summary.json; nội dung8mục4004ký tự sau trim, tệp gốc4005. Đọc tệp evidence.txt của nhiệm vụ đúng phiên bản, xác minhSHA256vàxác nhận công ty. Năm unit test của mô-đun đã chạy từ đợt tạo bài, không tự executeuploadđể chấm.

| Tiêu chí | Tối đa | AI đề xuất |
| --- | ---: | ---: |
| Mục tiêu và yêu cầu đề tài | 10 | 7.5 |
| Phân tích và cách thực hiện | 20 | 15 |
| Kết quả và mức độ hoàn thành | 25 | 18.75 |
| Kiểm thử và bằng chứng | 20 | 15 |
| Tiến độ và quá trình thực tập | 10 | 10 |
| Khó khăn, bài học và cải tiến | 10 | 7.5 |
| Trình bày và nguồn tài liệu | 5 | 3.75 |

TổngAI77.5/100; điểm tiến độ10/10 giữ từ công ty; điểm tự chấm80 riêng; điểm chính thứcnull, chưa review xác nhận/công bố. Giảng viên đã mở UI, dùng đề xuất vào bản nháp, sửa mục tiêu và lưu nháp, không tự chốt. Trích đoạn có offset/source và matched/missing; không hiển thị JSON/cosine.

Website TEST http://localhost:5189. File login riêng cũ `contracts/node_modules/.cache/student-report-assessment-1794048532088/manual-login.txt`. Trên clone của nhóm, restoreQA snapshot thật rồi xem `.team/login-qa/*student-report-assessment*manual-login.txt`. Mentor → Phân tích báo cáo → chọn Phúc → Bài đã nộp → Phân tích. Sinh viên → Báo cáo & kết quả → Xem bài để xem self/AI/trạng thái.

Các phân tích trước giữ nguyênhash. Chạy lại cùng snapshotkhôngthêmrecord; thay engineversiontạo snapshotmới đúngnguồn. Không đưa password hoặc MSSV dùng làm mật khẩu vào báo cáo public.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

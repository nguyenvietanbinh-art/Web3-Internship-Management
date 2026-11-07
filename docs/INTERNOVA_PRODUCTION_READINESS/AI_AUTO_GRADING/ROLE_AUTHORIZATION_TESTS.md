# Phân quyền

Student: chỉ CV/report/enrollment/assignmentown; được POST phân tích bài mình, GET kết quả và tự chấm đúng rubric; không sửaAI, reviews hoặcofficial. Mentor: chỉ sinh viên được giao, được phân tích/nháp/xác nhận/bổ sung. Company: duyệt task/tiêu chí đơn vị, không API chấm học thuật AI hoặc giả mentor. Admin: cấu hình rubric/công bố, không dùng AI chưa xác nhận làm điểm official; không rawAItrongtrangcôngbố.

Test thực tế: login4roleđúng; studentPOSTreviews403; company/adminPOSTreportanalyze403; foreignstudent/mentorGET/POSTreport404; forgedselfGradingfield400; Adminapprove chỉAInoreview409. Studentchưađượcxemnháp hoặcđiểmgiảngviênchưacôngbố, nhưng đượcxemAIriêng có ghi sơbộ. Self80 không làm đổiAI77.5; mentor draft không đổi officialnull.

Các file test: report-analysis-role.unit.test.js, report-auto-grading.integration.test.js, progress-evaluation.integration.test.js, run-auto-grading-trial.cjs, auto-grading-student-browser.cjs và progress-report-v3-browser.cjs. Phạm viownershipđược kiểm tại Backend bằngplacementPolicy, không chỉ ẩnmenu.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

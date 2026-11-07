> **Cập nhật tiếp theo:** bộ chấm sơ bộ đã triển khai, Phúc cóAI77.5/100,self80,officialchưa xác nhận. Đọc [nghiệm thu mới](INTERNOVA_PRODUCTION_READINESS/AI_AUTO_GRADING/FINAL_AI_GRADING_REPORT.md). Báo cáo bên dưới giữ kết quả thử nghiệm trước khi sửa.

# Thử nghiệm một sinh viên nộp báo cáo và AI đánh giá — 07/11/2026

## Kết luận thực tế

**BERT đọc bài và đối chiếu tiêu chí: PASS. AI tự chấm đủ thang100: CHƯA ĐẠT.** Backend hiện chỉ tính điểm từ căn cứ đã được kiểm tra; BERT tìm trích đoạn, chưa phải mô hình chấm điểm tự động đã kiểm định. Không điền số để làm kết quả trông hoàn chỉnh.

Website: http://localhost:5189. Database: `internova_role_qa_20261107`, Mongo27018/replicaSetinternovaTestRs, có exact allowlist và marker trước ghi. Không tạo tài khoản/bài nộp vào website5188/database gốc.

## Sinh viên và bài nộp đã tạo

- Nguyễn Hoàng Phúc, ngành Công nghệ thông tin, Trường Đại học Internova, GPA3.25/4.
- Hồ sơ có định hướng thực tập, lịch4ngày/tuần, kỹ năng React/JavaScript/Node.js/MongoDB/Git/RESTAPI; CV có học vấn, kinh nghiệm học phần và giới hạn.
- Một kỳ học năm2026–2027, đề tài lọc cơ hội thực tập, doanh nghiệp và giảng viên riêng; có phân công active.
- Một nhiệm vụ với tiêu chí chức năng60/kiểm thử40. Bài nộp có mã nguồn thật, năm unit test chạy thật và log đính kèm. Doanh nghiệp TEST xác nhận đúng phạm vi mô-đun sau khi chạy test, không xác nhận UI/API chưa làm. Không tạo chấm công hoặc số giờ giả.
- Báo cáo cuối kỳ v1 gồm8mục, 4.005ký tự: mục tiêu, phân tích/thiết kế, cách thực hiện, kết quả, kiểm thử/bằng chứng, tiến độ, khó khăn/kế hoạch, tự đánh giá/nguồn tài liệu.
- Dữ liệu là tình huống tổng hợp phục vụ kiểm thử, không phải thành tích của người thật.

## Kết quả theo thang hiện hành

| Tiêu chí | Tối đa | Điểm hệ thống trả về |
| --- | ---: | --- |
| Mục tiêu và yêu cầu đề tài | 10 | Chưa đủ căn cứ |
| Phân tích và cách thực hiện | 20 | Chưa đủ căn cứ |
| Kết quả và mức độ hoàn thành | 25 | Chưa đủ căn cứ |
| Kiểm thử và bằng chứng | 20 | Chưa đủ căn cứ |
| Tiến độ và quá trình thực tập | 10 | 10 |
| Khó khăn, bài học và cải tiến | 10 | Chưa đủ căn cứ |
| Trình bày và nguồn tài liệu | 5 | Chưa đủ căn cứ |

Tổng đề xuất=`null`; phần đã tính=10điểm tiến độ; điểm chính thức=`null`; chưa có review giảng viên hoặc công bố. Không được hiểu là bài chỉ đạt10/100: sáu mục còn lại chưa được chấm.

BERT thực sự dùng Sentence-BERT multilingual MiniLM, ONNX CPU int8, engine sbert. Đối chiếu bài đã nộp (`document.source=submitted`) và hash nội dung sau chuẩn hóa trim của Backend đã khớp. Có trích đoạn thật theo tiêu chí. Không dùng bài mẫu khác, không chuyển cosine thành điểm.

Browser thật PASS: giảng viên mở bài của sinh viên này, thấy đúng nội dung/MSSV, bấm Phân tích báo cáo, thấy bảng7tiêu chí,10/10tiến độ và thông báo chưa đủ cơ sở; không có tổng điểm bị dựng lên. Không xác nhận evidence-checks bằng tài khoản mentor để ép ra tổng điểm.

## Cách bạn kiểm tra

1. Mở http://localhost:5189. File riêng `contracts/node_modules/.cache/student-report-assessment-1794048532088/manual-login.txt` chứa student/company/mentor/admin của đúng tình huống. Không commit file này.
2. Dùng student: Hồ sơ/CV để xem thông tin, Báo cáo & kết quả → Xem bài báo cáo.
3. Đăng xuất, dùng mentor trong cùng file: Phân tích báo cáo thực tập → chọn “Báo cáo kết quả — Nguyễn Hoàng Phúc — Bộ lọc đề tài” → nội dung “Bài báo cáo đã nộp” → Xem bài báo cáo → Phân tích báo cáo.
4. Mở Trích đoạn theo tiêu chí để đối chiếu căn cứ. Nếu chuyển sang Chấm điểm/nhận xét, đó là hành động giảng viên, không phải AI tự cho điểm.
5. Tệp nội dung `bao-cao-nguyen-hoang-phuc.md`, `evidence.txt`, `topic-filter.cjs`, `topic-filter.test.cjs`, `test-results.txt`, `result.json`, hai ảnh PNG và `browser-result.json` nằm trong cùng thư mục riêng phía trên.

## Phạm vi và việc còn thiếu

Chỉ thêm fixture mới:4User (sinh viên và3vai trò hỗ trợ),1Student/1CV/1Batch/1Topic/1Opportunity/1Enrollment/1Assignment/1Task/1Report; không chỉnh tài khoản đã có. Script `scripts/demo/create-student-report-assessment.cjs` kiểm target và có resume để giữ đúng một tình huống. Hai lỗi harness đầu tiên (API tạo assignment trả201 và hash phải trim nội dung như Backend) đã sửa và tiếp tục trên cùng sinh viên/bài nộp, không tạo lại trùng.

Muốn AI tự đề xuất đủ7mục cần bổ sung bộ chấm nháp có căn cứ theo từng tiêu chí và đánh giá bằng bộ bài/điểm tham chiếu độc lập; giữ điểm đề xuất riêng và giảng viên xác nhận. Hiện code `server/src/core/reportEvaluation.js:proposal()` đọc evidenceChecks do giảng viên xác nhận, chưa suy ra sáu mức rubric tự động từ BERT. Đây là giới hạn chức năng được kiểm thử phát hiện, không phải lỗi model không chạy. Chưa cài/train/đổi thuật toán hoặc bỏ kiểm tra để che giới hạn.

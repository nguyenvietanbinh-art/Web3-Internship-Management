# Dữ liệu bổ sung V3

Script: `server/scripts/prepare-v3-dataset.cjs`. Dry-run mặc định, chỉ `--apply` mới ghi đúng QA có marker. SeedBatchId `internova-v3-20261107`, ID xác định trước, transaction cho dữ liệu nền, checkpoint và Idempotency-Key cho API. Chạy lại sau COMPLETE trả NO_WRITES. Hai lần đầu đã dừng vì đường dẫn module trong script; đã sửa và resume, không tạo trùng.

Bổ sung 7 tài khoản: 4 sinh viên với CV/kỹ năng khác nhau, 1 doanh nghiệp, 1 giảng viên, 1 nhà trường; 2 kỳ theo năm học; 4 đề tài/cơ hội; 4 enrollment; 2 phân công thực tập; 2 task; 2 báo cáo tuần và 2 báo cáo cuối kỳ; 1 hồ sơ ứng tuyển. Các task gồm nháp và đã nộp/chờ kiểm tra. Không gán sẵn xác nhận sản phẩm hoặc điểm giả.

| Collection | Trước seed | Sau seed |
| --- | ---: | ---: |
| users | 477 | 484 |
| students | 376 | 380 |
| cvs | 368 | 372 |
| internship_batches | 47 | 49 |
| topics | 195 | 199 |
| topic_opportunities | 817 | 821 |
| batch_enrollments | 371 | 375 |
| assignments | 46 | 48 |
| internship_tasks | 15 | 17 |
| business_reports | 42 | 46 |

Đây là số tại lần seed, không phải tổng sau toàn bộ test. Các lần test tiếp theo thêm fixture riêng, không xóa.

Nguồn CV/JD: bộ tổng hợp `ai-service/datasets/cv-jd-reference-200-v1` (200 CV/20 JD); provenance giữ nguyên. Tình huống hợp lý về cấu trúc không biến thành dữ liệu người thật hoặc nhãn chuyên gia. Tài khoản/mật khẩu chỉ trong cache ignored `contracts/node_modules/.cache/internova-v3-20261107/manual-login-v3.txt`; không xuất vào Git hoặc báo cáo công khai.

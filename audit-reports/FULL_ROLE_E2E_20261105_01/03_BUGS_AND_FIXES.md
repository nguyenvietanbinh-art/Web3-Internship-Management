# Lỗi và xử lý

## ROLE-HIGH-01 — Thay phiên bản báo cáo không atomic — FAIL / CHƯA SỬA

- File: `server/src/core/reports.js:12–13`; model `server/src/models/BusinessModels.js` (Report).
- Trước tiên supersede bằng update current=false, sau đó Report.create cho bản mới. Hai thao tác không cùng transaction.
- Repro: phân công TEST active → POST weekly report201 → chủ động cho model insert kế tiếp throw → POST bản thay thế500 → query report cũ current=false, currentCount=0.
- MongoDB thật và API thật. Chỉ lỗi insert thứ hai là fault injection được khai báo; không giả success, không gây lỗi storage trên database cũ.
- Tác động: lỗi lưu bản mới làm luồng hiện hành/review của báo cáo trước bị ảnh hưởng; rủi ro khi lỗi DB hoặc cạnh tranh submit. Không kết luận mất nội dung vật lý: bản cũ vẫn còn nhưng không current.
- Test mới: `scripts/demo/full-role-report-fault.cjs`, exit1 có chủ đích để không che lỗi; [JSON](evidence/report-insert-fault.json).
- Cách sửa đề xuất: xem `07_REPORT_ATOMICITY_PLAN.md`; cần review transaction/replica set/concurrency/index và rollout/rollback riêng. Chưa đổi API/schema/topology hoặc chạy migration. Đã gửi câu hỏi xin chọn hướng xử lý; chưa có phê duyệt áp dụng.

## ENV-01 — MongoDB ngừng hoạt động — ĐÃ PHỤC HỒI

Xác nhận27017 trống, đúng thư mục WiredTiger cũ; người dùng phê duyệt restart. Mongod đã chạy lại, Backend manual health connected. Không sửa source, không tạo instance trống thay dữ liệu cũ. Chưa xác định nguyên nhân mongod cũ dừng; không gán lỗi này cho code ứng dụng.

## Không có bản vá source nghiệp vụ trong lượt này

165 regression và21 browser groups PASS không phát hiện thêm lỗi chức năng thông thường tái hiện được. Không sửa code tùy tiện để làm đẹp số lượng fixes. Bổ sung3 script harness/diagnostic; guard output mới, exact TEST và exit code FAIL; node --check PASS. Không dependency/package-lock/.env/schema/migration thay đổi.

Các vấn đề lịch sử như toolchain advisories, email verification/reset, production TLS/CSP/backup, scalability chưa tự trở thành FIXED; xem FULL_PROJECT_AUDIT và checklist production. Không chạy npm audit mới nên không khẳng định số advisory hiện tại.

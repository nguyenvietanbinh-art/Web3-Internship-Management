# CHECKLIST TRƯỚC DEMO

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Đã kiểm tra trong audit

- [x] Xác minh branch/HEAD và chụp hash baseline tracked/untracked.
- [x] Đọc14 báo cáo cũ, README/docs và XML2 DOCX yêu cầu.
- [x] Xác minh tiến trình/ports thực tế, safe HTTP, Mongo ping và14 collections/36indexes; đầu0document, cuối3JD thay đổi đồng thời.
- [x] Lint/build mới, node --check31 file, compile2 Solidity trong staging ignored riêng.
- [x] Kiểm thử thuần auth/AI/ABI và router mock có chặn kết nối/ghi DB thật.
- [x] Kiểm kê48 Express APIs +3 AI APIs,14 models,2contracts, toàn bộ tab.
- [x] Phân biệt source review, HTTP rỗng, unit/mock và E2E chưa chạy.
- [x] Không chạy seed/migration/dropDatabase/test destructive, không dùng ví thật/tx/deploy, không tạo .env hoặc sửa source.

## P0 bắt buộc trước mở nghiệp vụ trên DB cần giữ

- [ ] GET jds/tasks/history/worklogs không write; mount/remount/StrictMode không tạo dữ liệu.
- [ ] Web3 mount chỉ GET, sync có quyền và không false success.
- [ ] Demo-login không cấp JWT quyền thật trong cấu hình production/local DB cần bảo toàn.
- [ ] Task/review/check-in/record-chain-tx có auth + role + owner + tenant/assignment.
- [ ] Certificate unknown404/verifiedfalse, không fake tx/CID/SBT/mint.
- [ ] Score/cards/dashboard không dùng số bịa; matching/report fallback có provenance.
- [ ] Giao dịch thất bại không hiển thị hoàn tất on-chain; chainId/signer/receipt được kiểm.
- [ ] Test DB/EVM độc lập được xác minh; live DB hash không đổi sau test.

## Nghiệp vụ và tích hợp còn phải nghiệm thu

- [ ] CV lưu được, parser/upload an toàn; JD edit/close; ứng tuyển và xét duyệt thật.
- [ ] Company/student/mentor/trường/admin có luồng đúng yêu cầu được chốt.
- [ ] Assignment/KPI canonical, multi-slot/concurrency, score/rubric/state thống nhất.
- [ ] Task đúng assignee; weekly logs/review/giờ làm/checkout đầy đủ.
- [ ] AI runtime và full-stack flow, SBERT/risk nếu yêu cầu, dataset/metrics thực.
- [ ] QR scan/TTL/company/location validation và blockchain check-in theo đề cương.
- [ ] Pinata upload/readback/hash; mint/verify NFT/SBT đúng chain/token, không sample certificate.
- [ ] Listener payload/retry/reorg/checkpoint và normalized DB đồng bộ.
- [ ] Browser E2E/console/mobile/a11y/Lighthouse/UAT/triển khai staging có bằng chứng.

## Điểm dừng và phê duyệt

Chỉ các báo cáo và output generated ignored được thêm. Các tiến trình Mongo/Backend/Frontend hiện có được giữ chạy; không bật AI/RPC hoặc mở trình duyệt nghiệp vụ. Cần phê duyệt P0 trước sửa source; cài dependency/model, đổi .env, schema/index/migration, tạo fixture DB test, deploy và giao dịch cần phạm vi được duyệt. Chưa đánh dấu đồ án sẵn sàng demo đầy đủ.


## Đối chiếu cuối: có thay đổi database đồng thời — không được bỏ qua

Snapshot đầu **23:11:09 ngày30/10/2026 (+07:00)** có14 collections/36indexes/0documents. Snapshot sau23:28:50 và lần cuối vẫn có14 collections/36indexes, nhưng **3 documents trong job_descriptions**,13collections còn lại0. Cả3 có createdAt khoảng **23:18:21.925–926 (+07:00)**, tiêu đề trùng3 JD mẫu trong `server/src/routes/internship.routes.js:99`. So sánh bảo toàn toàn DB: **FAIL / không giống snapshot đầu**. Không được báo database giữ nguyên0document suốt kiểm định.

Chỉ chứng minh có ghi đồng thời và nội dung phù hợp nhánh seed; **chưa xác định nguồn request/process gây ghi** vì Backend không có access/audit log đủ để quy thuộc. Frontend/Backend/Mongo vốn đang chạy. Không khẳng định người dùng đã mở tab hay có bên nào cụ thể thực hiện. Các lệnh audit live chỉ GET đã kiểm tra read-only và Mongo read commands; không gọi /jds hoặc API ghi trên Backend hiện tại. Router mutation tests dùng model fake, connect/driver write bị chặn và readyState0, không dùng MongoDB thật. Không vì kết quả source/mock mà quy nguồn3document cho một request chưa quan sát.

Không xóa3JD, không khôi phục snapshot bằng ghi, không dừng tiến trình đang chạy ngoài phạm vi cho phép. Đã dừng thêm thử nghiệm runtime; chỉ đọc collection/timestamps và hoàn thiện báo cáo. Cần xử lý auto-write P0 và cô lập client/database trước E2E. Evidence ở ignored staging: runtime-before.json, runtime-after.json, runtime-final.json, concurrent-change.json. Timestamp trong JSON là UTC; báo cáo đổi sang Asia/Bangkok. Việc live environment có writer đồng thời giới hạn kết luận bảo toàn DB, không làm vô hiệu các assertion thuần/mock đã cô lập.

# Chẩn đoán bằng chứng giờ làm Sepolia — 2026-11-09

## Kết luận và giới hạn
Lỗi source xác định tại core/timeEvidence.js: catch của chainAssignment gom CLOUD_CUSTODY_DISABLED, CLOUD_STUDENT_MAPPING, CLOUD_RECIPIENT_DECRYPT_REJECTED, lỗi môi trường và WALLET_LINK_REQUIRED thành cùng thông báo danh tính. readOnly từng hardcode true. Không thể suy ra 20 phiên thiếu recipient từ thông báo cũ.
Render https://web3-internship-management.onrender.com kiểm đọc: /api/health 200 (DB connected, IPFS false), /api/ready 200; /api/core/web3/status 401 NO_TOKEN. Chưa xác minh commit live, flags, manifest, signer, recipient hay namespace Atlas vì endpoint yêu cầu đăng nhập. Không sử dụng tài khoản local để đoán thông tin đăng nhập Cloud. Nguyên nhân live cụ thể còn BLOCKED.

## Thay đổi chưa commit/push
- server/src/services/timeEvidenceReadiness.js: phân loại cấu hình, READ_ONLY, custody disabled, thiếu recipient, sai mapping/legacy và lỗi giải mã; không trả chi tiết lỗi/secret.
- server/src/core/timeEvidence.js: kiểm gate trước resolver, giữ Cloud custody v2 hiện có và điều kiện giờ làm, trả readiness cho UI; không provision recipient trên GET.
- client/src/components/business/AdminCertificatePage.jsx: hiện readiness ở đầu bảng; checkbox vẫn dùng eligible Backend và chainReady.
- server/test/time-evidence-readiness.test.js: regression phân loại nguyên nhân.
API GET /api/core/web3/placements/:id/time-evidence; POST anchor vẫn Admin-only và kiểm lại thời gian/phân công, certificate, execute/recipient và write guard/gateway. Không thay quyền hoặc dữ liệu QR/GPS.

## Kết quả
PASS: 22 unit/regression (readiness, Cloud preparation, QR route guards); Backend syntax; Frontend lint/build VITE_API_URL=/api.
Các gateway test dùng provider kiểm soát, không chứng minh Sepolia thật. Mongo custody/queue/journal giữ bằng chứng PASS trước; không chạy lại fixture issued. Lượt tích hợp Mongo mới/recipient mới/RBAC HTTP trên DB TEST: NOT TESTED. Không tạo ví, không ghi Mongo hay EVM.
Live flags/commit/manifest/RPC/writer/mapping và UI đăng nhập: BLOCKED, cần người vận hành cung cấp trạng thái đã lọc bí mật hoặc phiên kiểm thử được cấp quyền. Không đổi 20 phiên để ép đủ điều kiện.

## Nghiệm thu cần làm trước giao dịch thật
1. Xác minh commit Render và GET Web3 status với tài khoản Admin được cấp quyền; đối chiếu APP_ENV, flags, chain11155111, manifest/deployment identity.
2. Xác minh contract bytecode/deployment/owner/writer qua RPC chỉ đọc; signer secret ngoài repo và backup hợp lệ.
3. Backup Atlas + verify restore; duyệt schema/index journal/custody/queue. Không chạy migration trong lượt này.
4. Một recipient TEST cloud v2 đúng userId/studentId/chain; keyring Cloud portable restore PASS; không chuyển mapping Windows/legacy.
5. Kiểm thử TEST DB riêng: readiness READY, sai ID/chain/recipient bị chặn, API RBAC/IDOR, journal retry/idempotency/crash. Chưa thực hiện mới trong lượt này.
6. Xin duyệt riêng tối đa một bằng chứng TEST; receipt status1, đủ confirmations, event/digest/recipient đúng, readback contract, txHash Mongo/UI và retry không trùng. Không mint hoặc chạy backlog.

## Deploy/rollback
Chưa push/deploy bản sửa này. Sau review và duyệt: selective commit, push branch deploy, Render deploy READ_ONLY, kiểm thông báo không còn sai nguyên nhân. Không bật write chỉ để làm số Hợp lệ tăng. Rollback redeploy commit497e40a, giữ Atlas/secret/journal và lịch sử; không reset chain hay sửa dữ liệu.

## Phát hành readiness — 2026-11-09
Regression phát hành:24 PASS (22 cũ + nhãn status ổn định + HTTP RBAC/scope với DB stub); toàn Backend syntax và Frontend lint/build PASS. Không nhận là kiểm thử Atlas/Sepolia thật.
readiness.status: READ_ONLY / CLOUD_NOT_CONFIGURED / RECIPIENT_MISSING / READY; code chi tiết giữ nguyên. API quyền và placement scope được tái sử dụng, không thay validation ghi.
Render Manual Deploy: chọn branch deploy/internova-cloud-20261108 và commit readiness mới sau push; giữ nguyên mọi secret/JWT/URI, WEB3_LOCAL_READ_ONLY=true, Cloud write/custody-write/autoIssue=false. Kiểm /api/health, /api/ready, đăng nhập Admin, bảng20 phiên và thông báo readiness đúng cấu hình; không gửi anchor hay chạy worker. Số phiên/giờ phải giữ nguyên; Hợp lệ0 trong chế độ chặn ghi là đúng.
Rollback: redeploy497e40a, không restore/drop DB, không thay khóa, không reset blockchain. Commit/push không đồng nghĩa Render đã deploy; cần phê duyệt deploy riêng. Không bật write để ép phiên hợp lệ.

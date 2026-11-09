# Custody và tự động cấp SBT Cloud — 09/11/2026


| Module | Đã nối |
|---|---|
| cloudWeb3Runtime | localWeb3 metadata/context/send và API Web3 guard chọn Sepolia khi opt-in; xác minh manifest/deployment/confirmations/writer |
| cloudJournalStore/cloudTransactionGateway | Mongo majority, unique operation/nonce, lease/fencing; raw bền vững trước gửi; runtime dùng signer secret file riêng |
| cloudCustodialVault/cloudCustodialRuntime | Envelope v2 portable; mapping Sepolia riêng; kiểm địa chỉ bằng giải mã, không sửa envelope/mapping Windows |
| custodialRuntime/businessIdentity | Chọn Cloud service khi cấu hình đúng; không quay về yêu cầu MetaMask |
| certificateQueue qua Cloud wrapper | Collection Cloud riêng, enqueue chỉ outbox mới đúng policy và activation timestamp; không chạy pump lịch sử |
| reports approval | Outbox chỉ tạo khi đủ opt-in/write/custody/autoIssue và sự kiện chốt mới |
| cloud-sbt-once.cjs | One-shot explicit approval, không được server startup gọi; dispatch tối đa10outbox mới, xử lý1job |
| API operations / BlockchainHistory | Projection trạng thái journal/hash/block, không trả raw/privatekey; pending/confirmed/failed/recovery-required |


| Kiểm thử | Kết quả |
|---|---|
| 40 unit/regression chọn lọc | PASS, gồm policy Cloud/QR/local vault/binding và14test Cloud preparation |
| 17 test tập trung sau chỉnh cuối | PASS; giao nhau với nhóm40, không cộng thành57test độc lập |
| Journal integration MongoDB thật | PASS trên internova_full_role_test_20261109, replica set hiện hữu; backup trước, index/lease/unique nonce/majority/crash-retry/readback; EVM provider kiểm soát, không gọi mạng |
| 7 HTTP/RBAC/IDOR thực + MongoDB TEST | PASS; snapshot không đổi, Admin READ_ONLY503, Student/Company/Mentor anchor403 |
| Portable AES restore trong bộ nhớ | PASS trong unit test: clone keyring JSON, IV riêng, sai key/user/chain bị từ chối; không phải DR nghiệm thu Cloud |
| Syntax toàn bộ Backend | PASS |
| Frontend lint + production build /api | PASS |
| Sepolia RPC/deployment/event/SBT thật | NOT TESTED/BLOCKED thiếu cấu hình và phê duyệt |
| Atlas production / full restart-redeploy worker Cloud | NOT TESTED; không gọi production |
| Queue Cloud và recipient Cloud E2E trên DB | NOT TESTED; chưa provision schema Cloud; không lấy nghiệm thu queue local làm Cloud PASS |


Biến cần chuẩn bị, chưa nhập vào Render:

- Giữ APP_ENV=CLOUD_DEMO/NODE_ENV=production và cấu hình Atlas/marker/JWT hiện hữu.
- CLOUD_WEB3_ENABLED=false, CLOUD_WEB3_WRITE_ENABLED=false, WEB3_LOCAL_READ_ONLY=true; chỉ thay sau phê duyệt.
- CLOUD_WEB3_NETWORK=sepolia, CLOUD_WEB3_CHAIN_ID=11155111, CLOUD_WEB3_RPC_URL=<HTTPS RPC>, CLOUD_WEB3_RPC_HOST=<đúng hostname>, CLOUD_WEB3_CONFIRMATIONS=12 hoặc cao hơn.
- CLOUD_WEB3_MANIFEST_FILE=<file manifest đã xác minh>, CLOUD_WEB3_SIGNER_ADDRESS=<writer public>, CLOUD_WEB3_SIGNER_FILE=<secret file ngoài repo>.
- CLOUD_CUSTODY_ENABLED=false, CLOUD_CUSTODY_WRITE_ENABLED=false, CLOUD_CUSTODY_KEYRING_FILE=<portable keyring v2 ngoài repo>.
- CLOUD_SBT_AUTO_ISSUE_ENABLED=false, CLOUD_SBT_ACTIVATED_AT=<ISO thời điểm kích hoạt đã duyệt>.
- CLOUD_WORKER_ONCE_APPROVED không đặt mặc định; chỉ dùng khi operator đã phê duyệt chạy worker.
- WEB3_LOCAL_ENABLED=false, CUSTODIAL_LOCAL_TEST_ENABLED=false, CUSTODIAL_AUTO_ISSUE_ENABLED=false giữ nguyên trên Cloud.

Cần lập kế hoạch tạo trước các collection/index, không có auto-migration: blockchain_transaction_journal (unique issuer+operationId, issuer+nonce); blockchain_issuer_leases; cloud_custodial_wallets_v2 (unique chainId+userId, chainId+address); cloud_certificate_issuances_v1 (unique studentUserId+batchId); cloud_certificate_worker_leases_v1. Không tạo index trên Atlas trong lượt này.

Xem [bảng nghiệm thu và việc còn thiếu](CLOUD_WEB3_ACCEPTANCE.md). Không kích hoạt, deploy, gửi giao dịch hoặc thay secret trong lượt này.

## Tiến độ kiểm thử mới

Custody/queue và fencing đã kiểm thử MongoDB TEST thật; một recipient, encryptedbackup restore trong process mới, tranh lease, retry và bảo toàn bản ghi cũ PASS. EVM vẫn mô phỏng, không mint thật. Migration CLI chỉ in plan; không applyAtlas. Xem phần cập nhật mới trong [CLOUD_WEB3_ACCEPTANCE.md](CLOUD_WEB3_ACCEPTANCE.md) để biết phạm vi, bằng chứng và gate vận hành.

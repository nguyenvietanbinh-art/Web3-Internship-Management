# Transaction gateway & journal — 09/11/2026

**Trạng thái: triển khai Backend và14unit/crash tests PASS; nghiệm thu ghi/recovery toàn hệ thống BLOCKED. Không bật ghi website chính.**

## File thay đổi trong lượt này

- `server/src/services/transactionJournal.js`: gateway ký trước, hash payload, nonce và raw signed transaction; exclusive lock một issuer/directory, journal JSONL hash-chain, append+fsync trước broadcast, các trạng thái PREPARED/BROADCAST/CONFIRMED/FAILED/RECOVERY_REQUIRED.
- `server/src/services/transactionGatewayRuntime.js`: cấu hình opt-in, khóa ký ngoài repo, verify chain/deployment/code/instance/writer; ABI calldata bằng contract hiện có; delegate kiểm receipt/event cho localWeb3.verify. Không trả raw transaction/khóa qua API.
- `server/src/services/localWeb3.js`: thay send qua JsonRpcSigner/contract.write bằng gateway; giữ guard READ_ONLY, policy/custodial, lease Mongo, idempotent operationID và toàn bộ proof verification. Không hoàn tác thay đổi trước lượt này.
- `server/test/transaction-journal.test.js`:14test có provider kiểm soát và chữ ký EVM thật bằng khóa ngẫu nhiên trong bộ nhớ, không lưu khóa.
- Hai báo cáo này và đủ5checkpoint, evidence `audit-reports/TRANSACTION_JOURNAL_20261109/result.json`.

Không sửa schema/database, không tạo secret hoặc master key, không cài dependency, không restart/nạp lại Backend chính, không commit/push.

## Đường gửi và giới hạn phạm vi

Source Backend được quét các mẫu JsonRpcSigner, getSigner, broadcastTransaction, sendTransaction, recordEvidence, mintCertificate. Đường gửi nghiệp vụ Web3 runtime qua localWeb3.execute (report/attendance/completion/mint) hiện đều dùng gateway. Reconcile chỉ tìm/verify rồi cập nhật trạng thái, không phát giao dịch. Chain listener chỉ đọc. Không đưa key sinh viên vào gateway mint.

**Không tuyên bố mọi mutation EVM toàn máy đã được chặn.** Script deploy/recovery (`scripts/demo/recovery-chain.cjs`) và API Web3 frontend legacy có đường riêng; chưa bị ép qua gateway. Node Hardhat loopback vẫn có unlocked TEST accounts: chương trình local khác có thể gọi RPC trực tiếp. Phải loại/khóa các đường ghi ngoài gateway trong cấu hình vận hành trước khi cam kết journal bao phủ toàn chain. Giao diện không liên kết ví vẫn giữ nguyên.

## Các đảm bảo đã kiểm thử

1. Ký và lưu PREPARED trước broadcast, dùng lại raw/hash/nonce khi retry, không ký transaction mới cho cùng operation.
2. File lock chống writer đồng thời; không tự xóa stale lock sau crash. Phải kiểm tra process, receipt, nonce trước khi người vận hành gỡ lock.
3. Không gửi khi fsync lỗi, file torn/corrupt, chain/destination sai, signer sai, pending ngoài gateway hoặc nonce drift sau giao dịch journal trước.
4. Operation ID cùng payload trả cùng giao dịch; payload khác bị chặn. Operation chưa giải quyết chặn operation tiếp theo của issuer.
5. Timeout/crash sau broadcast kiểm receipt trước, không resend nếu đã mined; receipt sai hoặc biến mất fail closed, không báo CONFIRMED giả.
6. Runtime READ_ONLY/thiếu opt-in từ chối trước đọc key/gửi RPC. Private/master key không nằm trong journal hoặc test output. Raw signed transaction có khả năng broadcast nên file phải được kiểm soát quyền, không chia sẻ công khai.

Hash-chain phát hiện corruption vô ý; **không phải chống sửa bởi người có quyền viết toàn bộ journal** (họ có thể tính lại hash). Quyền file/backup độc lập vẫn cần thiết. fsync là cam kết flush của OS/filesystem, chưa có thử nghiệm mất điện vật lý/ổ đĩa hoặc backup ngoài máy. Gateway không tự nhận là kho lưu trữ production.

## Cấu hình cần khi được xét bật ở TEST cô lập

`WEB3_JOURNAL_ENABLED=true`, `WEB3_JOURNAL_DIRECTORY=<thư mục bền vững riêng đã tạo>`, `WEB3_JOURNAL_SIGNER_FILE=<file khóa signer ngoài repository có ACL riêng>`.

Chưa đặt các biến này cho main, chưa tạo file khóa. Main vẫn `WEB3_LOCAL_READ_ONLY=true`, custody/autoIssue=false. Không lấy master key custody làm khóa signer. Không gửi khóa/signed raw qua frontend. Mỗi issuer/deployment chỉ dùng một directory, không cho process trỏ sang nhiều directory để tránh lock.

## Kết quả

-14/14test PASS; syntax checks PASS.
- RBAC Student/Company/Mentor403 và contract non-writer staticCall PASS ở lượt write-gate trước; middleware và router không thay đổi trong lượt này. Không nhận đó là test ghi Admin hoặc IDOR end-to-end mới.
- Runtime/gateway provider integration là kiểm thử kiểm soát trong test, **chưa PASS live node write**.
- D: BLOCKED, không giao dịch mới, không TxHash mới, block31339/18548 vẫn2. Không mượn hash giao dịch recovery cũ làm kết quả lượt này.

## Gate còn thiếu

RPC18548 phục vụ main nên không đủ cô lập theo yêu cầu. Cần xác nhận RPC/deployment/DB TEST riêng, backup/restore TEST và khóa signer, baseline gồm deploy/raw cũ, journal mọi mutation, replay toàn node và quy trình phê duyệt hardhatInstanceId mới. Chỉ sau đó thử tối đa1bằng chứng; không mint, không backlog. Main giữ READ_ONLY và chờ phê duyệt riêng.

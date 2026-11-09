# Kiểm thử phục hồi transaction journal — 09/11/2026

**14 PASS /0 FAIL; giao dịch EVM thật mới và full-node recovery: BLOCKED/NOT TESTED.**

Lệnh đã chạy:
```powershell
node --test --test-concurrency=1 server/test/transaction-journal.test.js
```

| Ca kiểm thử | Kết quả |
|---|---|
| PREPARED đã flush trước broadcast, retry cùnghash, không cóprivatekey trongfile | PASS |
| Crash sau PREPARED, phục hồi raw/nonce cũ | PASS |
| Crash sau broadcast, lấy receipt thay vì gửi lần hai | PASS |
| Operation ID cùng mã nhưng khác nội dung | PASS — từ chối |
| Lock issuer đang tồn tại | PASS — từ chối, không tự xóa |
| Sai chain hoặc contract đích | PASS — từ chối |
| Journal bị ghi dở/torn | PASS — dừng, không cắt bỏ chứng cứ |
| fsync lỗi | PASS —0broadcast |
| CONFIRMED nhưng receipt mất | PASS — RECOVERY_REQUIRED, không resend |
| Receipt thất bại | PASS — FAILED, retry không gửi lại |
| Timeout và chặn operation khác khi chưa giải quyết | PASS |
| Copy backup journal sang thư mục mới, tiếp tục đúng signedhash | PASS |
| Proof/event verifier từ chối receipt | PASS — không CONFIRMED |
| Runtime READ_ONLY hoặc thiếu opt-in | PASS — không nạp key |

Các ca dùng chữ ký ethers thật, filesystem tạm thật, provider có kiểm soát; không mô tả là giao dịch Hardhat thật. Khóa sinh trong bộ nhớ dùng riêng unit test, không phải ví sinh viên và không lưu ra disk.

## Phục hồi Backend khác phục hồi Hardhat

Backend crash: khi lock tồn tại không tự xóa. Đọc journal, xác nhận process cũ không còn, so nonce/receipt trên đúng chain rồi mới cho retry operation cũ; phải có người vận hành kiểm tra lock. Chỉ xử lý operation được chỉ định; không scan backlog. Raw không được thay/ghi đè.

Hardhat mất toàn bộ RAM: journal mới chỉ lưu transaction Backend, **chưa đủ tự khôi phục node** nếu thiếu deploy/baseline, block rỗng, timestamp hoặc RPC đặc biệt. Chưa tích hợp journal mới với2transaction của recovery journal cũ. hardhatInstanceId mới sau restart cũng bị identity check từ chối; chưa có giao thức phê duyệt/chuyển instance. Không tự sửa metadata để vượt kiểm tra.

Không reset chain hiện tại để thử phục hồi. Block trước/sau vẫn2, nextTokenId1, không mint. Nghiệm thu2transaction recovery cũ trên node tạm trước đây được bảo toàn nhưng không chứng minh toàn bộ gateway mới đã phục hồi node thành công.

## Việc cần làm trước lượt ghi thật

1. Chuẩn bị RPC TEST riêng, không phục vụ main; xác nhận chain/address/identity và toàn bộ baseline.
2. Backup/restore TEST, cấu hình signer riêng an toàn; chưa tạo bất kỳ khóa nào trong lượt này.
3. Hoàn thiện replay toàn bộ mutation/state và quy trình thay instance có phê duyệt; kiểm thử trên node shadow, không reset chain nguồn.
4. Kiểm thử API Admin/IDOR và crash end-to-end cùng Mongo ChainOperation trước/sau; hiện chưa thực hiện mới.
5. Nếu PASS mới gửi tối đa1bằng chứng TEST và kiểm event/state/receipt/retry. Không mint/backlog. Main vẫn không được bật ghi.

Báo cáo triển khai: [BLOCKCHAIN_TRANSACTION_JOURNAL_RESULT.md](BLOCKCHAIN_TRANSACTION_JOURNAL_RESULT.md).

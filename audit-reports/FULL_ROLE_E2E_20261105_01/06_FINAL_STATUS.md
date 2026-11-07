# Kết luận kiểm thử — 05/11/2026

**Chưa nghiệm thu toàn bộ: 223 PASS /1 FAIL /5 BLOCKED /4 NOT TESTED; SKIP0.** Lint/build PASS riêng. Có thể demo nghiệp vụ local; chưa production-ready và không đạt100% KLCN129.

Các nghiệp vụ thông thường email-first từ CV/JD/ứng tuyển đến phân công/task/log/time/report/review/dashboard đã chạy API thật, DB thật và browser như phạm vi mô tả. Không cần ví cho nghiệp vụ thường; ví chỉ cho Web3. Báo cáo thay phiên bản khi insert lỗi là HIGH chưa sửa.

| Nhóm KLCN129 | Kết luận lần này |
| --- | --- |
| BERT matching/ranking | PARTIAL: SBERT API/UI thật PASS; quality metrics chưa có nhãn độc lập |
| IPFS báo cáo +hash contract | BLOCKED live: adapter/hash local PASS, chưa Pinata upload/CID/readback thật |
| NLP báo cáo/rủi ro | PARTIAL: semantic +rules chạy thật, classifier NOT_TRAINED |
| Task/chấm công/tổng giờ | COMPLETE trong local software cases đã kiểm; hardware/production ngoài phạm vi nghiệm thu |
| QR/GPS/time/blockchain | PARTIAL: API/QR encoder/decoder/chain PASS; hardware NOT TESTED |
| Dashboard theo role | COMPLETE trong local scoped cases/viewport đã kiểm; chưa load/soak production |
| Đánh giá và NFT/SBT | PARTIAL: SBT thật local PASS, điểm chủ yếu off-chain/commitments và issuance chủ động; atomic replacement lỗi |

## Blockchain xác minh thật

- Chain31337, contract `0x5FbDB2315678afecb367f032d93F642f64180aa3`; dùng deployment đã có, không deploy lại.
- Token `34`, ERC721/ERC5192, locked=true.
- Mint TX `0xa217becc66d892d22064a9866ba0993bf0fe2446791f56b21ff324cfb5e959b0`, block137; RPC độc lập xác nhận status0x1,3logs.
- Recipient là ví TEST ngẫu nhiên, bridge ký EIP191 thật; không extension MetaMask thật.
- Không công khai chain, không ví/tiền thật; report anchor không CID KHÔNG được tính là IPFS upload.
- Bằng chứng [result](evidence/unified-business-browser-browser-0/result.json), [receipt readonly](evidence/runtime-final-readonly.json).

## Dữ liệu và tiến trình

Gốc/hai demo/TEST manual giữ nguyên hash/count/index sau regression. Snapshot4DB baseline sau Mongo recovery; không có bằng chứng pre-recovery. 21 DB TEST mới được ghi nhận, giữ nguyên để kiểm tra; danh sách trong database-safety.json. Không seed/migration/drop/delete/commit/push. Log Mongo mới chứa hoạt động nội bộ, không phải dữ liệu seed.

MongoDB27644 và các service manual cũ được giữ chạy (Frontend5182, Backend57407, AI8003, RPC18545). Không restart Backend manual: runtime đó vẫn giữ code đã nạp trước lượt này, không tuyên bố nó đã được reload. E2E khởi tạo app mới từ source hiện tại trên các cổng TEST riêng đã đóng sau test.

## Bạn tự kiểm tra lại

1. Mở http://localhost:5182/ và health http://localhost:57407/api/health; Ctrl+F5.
2. Sinh viên: tự đăng ký email/mật khẩu riêng cho ứng dụng; đăng nhập → Hồ sơ → Lưu → Tổng quan → CV/ứng tuyển. Không dùng mật khẩu Gmail thật.
3. Staff: đọc file local ignored hiện có `contracts/node_modules/.cache/unified-20261102/manual-login.txt` trên máy mình. Không đưa file/mật khẩu vào Git hoặc ảnh. Đăng xuất rồi nhập role Admin/company/mentor. Không dùng tài khoản hardcode của test runner: chúng chỉ tồn tại DB TEST của suite đã đóng.
4. Company tạo JD → student CV/apply → company duyệt → Admin tạo kỳ → company phân công → Admin duyệt → company kích hoạt → task/log/giờ/report/reviews.
5. Không dùng chức năng thay báo cáo đang có để demo tình huống mất kết nối cho đến khi sửa ROLE-HIGH-01. Không chạy diagnostic trên database manual.
6. Web3 dùng ví TEST và chain đã chạy; thiếu Pinata hiển thị blocked là đúng. Không giả metrics/classifier hoặc tự nới điều kiện mint.
7. Chi tiết [hướng dẫn](../../docs/FULL_WEBSITE_TEST_GUIDE.md), [checklist từng case](02_ROLE_TEST_RESULTS.md).

Ưu tiên tiếp theo: duyệt phương án atomic report → implement/retest fault+race trong TEST → Pinata ciphertext live → UAT hardware/MetaMask → dữ liệu nhãn và đánh giá AI → dependency/production hardening theo kế hoạch riêng. Chưa có phê duyệt triển khai transaction/schema/topology.

## File thay đổi và Git cuối lượt

Source nghiệp vụ không thay đổi. Bổ sung `scripts/demo/full-role-preflight.cjs`, `full-role-regression.cjs`, `full-role-report-fault.cjs`; cập nhật4tài liệu docs; tạo8báo cáo và60ảnh chạy thật. Guard output/exit-code cuối chỉ kiểm cú pháp, không coi là một lượt nghiệp vụ chạy lại.

```text
 M docs/FEATURE_ACCEPTANCE_MATRIX.md
 M docs/FULL_WEBSITE_TEST_GUIDE.md
 M docs/IMPLEMENTATION_PROGRESS.md
 M docs/TEST_RESULTS.md
?? audit-reports/
?? scripts/demo/full-role-preflight.cjs
?? scripts/demo/full-role-regression.cjs
?? scripts/demo/full-role-report-fault.cjs
```

`git diff --check` PASS. Không commit/push/merge. `audit-reports/` đã untracked từ đầu và được giữ nguyên. Kết quả secret pattern scan: 0 hit; không full DLP/OCR.

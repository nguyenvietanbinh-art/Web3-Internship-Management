# PHASE 6 — Kết quả ba bản vá dependency và retest

Ngày 31/10/2026 (+07). Người dùng đã phê duyệt **“ba bản vá và retest”**. Đã cài đúng phạm vi và kiểm thử lại. **Audit production của server/client PASS (0 advisory); chưa kết luận toàn hệ thống an toàn hoặc chuyển PHASE 7**, vì advisory dev/toolchain và các tích hợp chưa được xác minh vẫn còn.

## Thay đổi chính xác

| Workspace | Package | Trước → sau |
| --- | --- | --- |
| server |body-parser|1.20.8 → **1.20.9** |
| server |follow-redirects|1.16.1 → **1.16.2** |
| server |qs|6.16.0 → **6.16.1** |
| client |follow-redirects|1.16.1 → **1.16.2** |

Chỉ server/package-lock.json và client/package-lock.json đổi các trường version/resolved/integrity của bốn entry trên. Không thêm/xóa package, đổi dependency gián tiếp khác hoặc manifest. Metadata registry xác nhận dependency ranges không đổi và không có preinstall/install/postinstall. Hash tarball được lấy từ registry; npm ci kiểm integrity. Package/lock/node_modules của contracts không được nâng cấp hoặc cài lại. Bản lưu manifest/lock trước vá và patch-verification.json ở ignored `contracts/node_modules/.cache/phase6-patch-20261031/`.

Đã dừng đúng hai tiến trình review TEST trước npm ci để tránh module đang chạy dùng lẫn phiên bản. Cài **server trước, thành công rồi mới client**:

```powershell
# Chạy trong server, sau đó client; không chạy trong contracts.
npm.cmd ci --include=dev --include=optional --engine-strict --ignore-scripts --no-audit --no-fund
```

Server: **175 packages**; client: **94 packages**, exit0. Không npm audit fix hoặc nâng Node/framework. Lifecycle bị tắt; không chạy seed/migration/test phá DB. Warning server: multer1.4.5-lts.2 deprecated và khuyến nghị của maintainer về dòng2.x, đã có từ dependency cũ; không tự nâng ngoài phạm vi. Không có lỗi native module trong lint/build/QR/Hardhat đã chạy. Các wrapper PowerShell có thể ghi NativeCommandError cho dòng warning stderr; exit của npm ci vẫn0 và test/build thực tế PASS.

## Retest thực tế sau cài

| Bộ kiểm | Kết quả | Evidence trong phase6-patch-20261031/ |
| --- | --- | --- |
| Kiểm riêng ba bản vá |**3/3 PASS**|patch-regression.log |
| Backend đầy đủ |**122/122 PASS**, fail0/skip0|backend-final.log,57,65giây |
| Core browser PHASE3–6 |**70/70 PASS**|browser-results.json/browser-final.log |
| Legacy browser |**39/39 PASS**|compat/browser-results.json |
| QR browser |**7/7 PASS**|qr/qr-browser-results.json |
| QR unit |**2/2 PASS**,40random payloads|qr-unit.log |
| Solidity / legacy |**9/9 +3/3 PASS**|solidity.log/solidity-legacy.log |
| Python unit |**16/16 PASS**|python-unit.log |
| Frontend lint/build |**PASS**,0error/0warning|lint.log/build.log; client/dist/phase6-patch-accepted |
| Audit server production |**PASS**,0advisory|audit-server.log |
| Audit client production và all |**PASS**,0advisory|audit-client.log/audit-all-client.log |
| Audit server gồm dev |**FAIL**,2MODERATE|audit-all-server.log; nodemon/minimatch |

Ba kiểm tra mới không giả success:

1. Gzip/JSON chạy trong child process riêng, chỉ bind loopback, không Mongo hoặc business API: gzip hợp lệ200, gzip lỗi400, trailing bytes400, health sau đó200. Giới hạn2giây/request và8giây/child; không tấn công backend gốc/demo hoặc gửi payload lớn.
2. follow-redirects thực sự redirect giữa hai HTTP server loopback khác origin; sensitiveHeaders array được tạo ở Node vm realm khác. Header nhạy cảm TEST bị bỏ, header public vẫn đến đích. Chỉ dùng chuỗi SYNTHETIC, không credentials thật.
3. qs.stringify comma array với own toString không callable không còn throw; query output và prototype guard được kiểm. Tất cả dùng package vừa cài, không stub kết quả.

E2E đi qua UI/API/TEST Mongo/TF-IDF/SBERT/RPC thật. Scanner kiểm ảnh PNG/ZXing/Canvas MediaStream và GPS CDP; không biến thành bằng chứng phần cứng. Sáu test Python nạp model lạnh chưa rerun do giới hạn RAM đã báo; giữ model hot, không hạ guard hoặc tự đóng ứng dụng cá nhân.

## Blockchain được xác minh sau patch

Giữ Hardhat18545/chain31337, contract `0x5FbDB2315678afecb367f032d93F642f64180aa3` và instance PHASE5. Không deploy/reset. Luồng UI mới mint **token #9**; không lấy token trước vá làm bằng chứng mới.

|Operation|Block|TX thật|
| --- | --- | --- |
|report|34|`0x47f37964ac5dc7ded16ea974ff8eed313d9733db3c4fa118e65d8539e0cf9181`|
|attendance|35|`0xd6977cdfdb989e8a50a05454c4ac783d070ed2092a82c4c2929518b511fd52f2`|
|completion|36|`0xd2342f81e2737ed9466cc05fd089b00266b038b6bc105a111912377a557a8457`|
|mint|37|`0x3e174575af9c15abd32e52f24bace48275f6c2453d82c0851fb65ce2518d9ca1`|

Receipt/event/calldata/state/owner/locked khớp RPC. Tổng9SBT từ các lượt TEST được giữ lại trên node; bảng trên chỉ là một luồng UI sau patch. Attestor là tài khoản local Hardhat, không ví/private key thật. Không gọi GET để đồng bộ ghi dữ liệu ngầm.

## Dữ liệu, runtime và Git

Snapshot trước`2026-10-31T16:16:43.513Z`, sau`2026-10-31T16:29:58.210Z`: SHA256 từng collection và danh sách index của ba DB gốc/demo bằng nhau: gốc14/36/3, demo14/36/223, foundation14/36/66 (collections/indexes/documents). Không dropDatabase, xóa, seed, migration hoặc index rollout vào dữ liệu thật. DB TEST cũ được giữ, mỗi đợt có DB riêng.

Runtime review sau vá: **http://127.0.0.1:5175/** → **http://127.0.0.1:57404/api**, database `web3_internship_test_phase1_d48a71b3_d4749f1b9265`. Backend PID8008, Vite PID22252; Mongo27017/PID11868, NLP8003/PID5092 và Hardhat18545/PID7944 giữ nguyên. Đã đóng Edge headless và helper compatibility sau kiểm; không dừng ứng dụng cá nhân/Windows service. PID là snapshot, có thể đổi sau reboot. Các server gốc/demo vẫn không được bật.

Git branch_1/HEADd11a1852c5f03963bbe260425a246b0e65fe1091 không đổi; không stage/commit/push/merge/reset/clean hoặc xóa untracked. integrity-final.json phân biệt bản vá này với PHASE1–6 đã có; chỉ đổi hai lock, thêm hai test và cập nhật docs. Không sửa API/schema/cơ chế xác thực hoặc.env. Source production khác không đổi.

## Còn lại và cổng nghiệm thu

- **P6-SEC-01/02/03: FIXED và retest PASS** trong server/client được phê duyệt.
- **P6-SEC-04: OPEN/HIGH toolchain contracts**. Lock không đổi; snapshot audit PHASE6 còn18HIGH+16MODERATE+14LOW package affected/effect chains, không phải48CVE độc lập. Không áp Hardhat3/toolbox7 hoặc audit fix --force. Ba patch nhỏ không xử lý toolchain này.
- **P6-SEC-05: OPEN/MODERATE dev server**, nodemon/minimatch, cần kế hoạch tương thích riêng.
- **BLOCKED:** Pinata upload/readback live, nhãn/quality metrics AI, sáu model cold-load tests do RAM. **NOT TESTED:** camera/GPS/extension ví/thiết bị thật, production load và accessibility đầy đủ.

Không đồng nhất audit0production với an toàn tuyệt đối. Các cảnh báo/toolchain/credentials chưa có không được ẩn để kết luận toàn hệ thống hoàn chỉnh. **Dừng tại PHASE6, chờ nghiệm thu trước PHASE7.**


## File thay đổi so với trước phê duyệt bản vá

- `client/package-lock.json` — sửa
- `docs/ARCHITECTURE_UPDATED.md` — sửa
- `docs/DEPENDENCY_PATCH_PROPOSAL.md` — sửa
- `docs/DEPENDENCY_PATCH_RESULT.md` — thêm
- `docs/FEATURE_ACCEPTANCE_MATRIX.md` — sửa
- `docs/FINAL_INTEGRATION_TEST_REPORT.md` — sửa
- `docs/IMPLEMENTATION_PROGRESS.md` — sửa
- `docs/PERFORMANCE_REPORT.md` — sửa
- `docs/REMAINING_ISSUES.md` — sửa
- `docs/SECURITY_RETEST.md` — sửa
- `docs/TEST_RESULTS.md` — sửa
- `server/package-lock.json` — sửa
- `server/test/dependency-patches.test.js` — thêm
- `server/test/fixtures/compressed-body-probe.cjs` — thêm

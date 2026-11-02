# Production readiness — nghiệm thu 02/11/2026

**Kết luận: CHƯA SẴN SÀNG PRODUCTION.** Có thể tiếp tục nghiệm thu nghiệp vụ local với dữ liệu TEST.23 findings,7fixed,16open/blocked/review;9High/10Medium/4Low. Không chuyển tỷ lệ test sang tỷ lệ hoàn thiện sản phẩm.

## Baseline và sau sửa

| Kiểm tra | Baseline | Sau sửa / bằng chứng |
| --- | --- | --- |
| Backend/API/RBAC/security/identity | 164/164 PASS | 165/165 PASS,0fail/skip; [log](evidence/production-20261102/final/backend.txt) |
| Unified dev E2E | 8/8 PASS | 9/9 PASS, thêm expired-session; [result](evidence/production-20261102/dev-browser/result.json) |
| Email regression | 6/6 PASS | 6/6 PASS |
| Google/wallet UI regression | 7/7 PASS | Lần đầu6/7 vì nhãn cũ; retest7/7,0exception/blocked. Không Google OAuth live |
| Client unit | Chưa có suite mới | 7/7 PASS session race/API reauth/network privacy/async form; [log](evidence/production-20261102/client-unit.txt) |
| Frontend lint | Tham chiếu handoff trước, không chạy audit-baseline riêng | PASS0error/0warning sau sửa |
| Production build | Tham chiếu handoff trước | PASS với NODE_ENV=production, RAYON_NUM_THREADS=1; [build](evidence/production-20261102/shell-retest/build.txt) |
| Production shell browser | Chưa có | 5/5 PASS bốn role email/menu/profile, mobile/tablet1440/768/375, theme, debug-hidden và no-auto-write;0exception. [result](evidence/production-20261102/shell-retest/result.json) |
| Deep production E2E9 nhóm | Chưa có | **FAIL / chưa nghiệm thu trọn vẹn**: bản đầu8/9 do harness NODE_ENV=test giữ DEV; sau sửa3/9 với lỗi screenshot/CDP và cascading fixture failures. Không thay bằng shell PASS |
| AI pure/API/TF-IDF/metrics/guards | Không chạy Python riêng ở baseline | 16/16 PASS; [retest](evidence/production-20261102/ai-unit-retest.json) |
| AI full unit/inference native | API SBERT đã chạy trong E2E | **FAIL native process** exit3221226505, allocation17MiB; retest cần bộ nhớ. Không bỏ guard, không gán PASS cho test_model_inference.py |
| Solidity local tests | Không chạy standalone ở baseline | 9/9 PASS, in-process Hardhat; [log](evidence/production-20261102/solidity-local.txt) |
| Solidity legacy / demo safety | Không chạy standalone ở baseline | Legacy3/3 và demo guard3/3 PASS; [legacy](evidence/production-20261102/solidity-legacy.txt), [guards](evidence/production-20261102/demo-guards.txt) |
| Local commitments/SBT | Receipts thật trong baseline | PASS trong dev E2E, actual token30/block121/receipt; không public chain |
| Database gốc/demo | Snapshot trước | Hash/count/index của3database không đổi; [proof](evidence/production-20261102/readiness-and-safety.json) |
| Secrets scan | Không full DLP baseline |418 tệp candidate: không hit password demo/URI chứa password/JWT/private-key theo mẫu; không full security certification |

Giữ mọi log FAIL: [baseline](evidence/production-20261102/baseline/result.json), [final suite ban đầu](evidence/production-20261102/final/result.json), [production đầu](evidence/production-20261102/production-first/result.json), [production retest](evidence/production-20261102/production-retest/result.json), [shell đầu](evidence/production-20261102/shell-first/result.json). Shell đầu fail4case do helpers reset CORS về5175; sửa harness exact5186 rồi5/5PASS, không nới CORS sản phẩm. Không coi lỗi harness là lỗ hổng production đã chứng minh.

## Trạng thái chức năng

| Chức năng | Trạng thái và giới hạn |
| --- | --- |
| Email/register/login/logout/change password/profile | PASS TEST/API/UI; reset/verify email còn thiếu |
| Bốn role, scope/IDOR, User-ID ownership | PASS regression; không tự nâng quyền |
| CV/PDF/DOCX/JD/apply/placement/tasks/log/hours/reports/reviews | PASS luồng TEST hiện có; P08 atomic report failure chưa fault-injection/fix |
| Dashboard | PASS real TEST totals; chưa load test quy mô production |
| TF-IDF/SBERT matching | PASS service inference thật; quality metrics BLOCKED thiếu nhãn độc lập |
| Risk NLP | Rules/semantic similarity có; classifier NOT_TRAINED, không confidence giả |
| Wallet link/replay/conflict | PASS API/signature thật bằng ephemeral TEST wallet; popup MetaMask thật NOT TESTED |
| QR/GPS | API replay/expiry/geometry PASS trong Backend; camera/GPS phần cứng, spoof-resistance NOT TESTED |
| IPFS encrypted adapter | PASS adapter tests; Pinata upload/readback live BLOCKED credentials/key/flag |
| Local chain/SBT | PASS dev E2E + Solidity; testnet/mainnet/production BLOCKED, không deploy |
| Google live | BLOCKED Client ID; unavailable UI PASS |
| Atlas/shared DB | BLOCKED chưa cấu hình/phê duyệt; không chuyển database |
| Accessibility | Labels/focus/keyboard skeleton/dialog giữ; chưa screenreader/contrast audit mọi màn hình |

## Hiệu năng có đo

Build production entry303.21kB raw/90.45kB gzip; CoreBusiness53.66kB, Web3Page13.04kB, CSS29.47kB; QR scanner và ethers vẫn lazy. So handoff entry303.86/90.71, đây là số bundle chứ không Lighthouse score. Build warning outDir ngoài client được giữ nguyên vì thư mục cache mới không cần bị empty; không dùng --emptyOutDir để xóa.

5sample tuần tự ở máy hiện tại: health mean12.98ms, capabilities4.80ms, NLP status4.67ms. Chỉ readiness, không AI inference benchmark/load test. Dashboard assignment IDs, first50ranking, picker100 và GETstatus lặp còn cần benchmark thiết kế trước tối ưu. Không thêm cache/index chỉ để tăng điểm.

Máy đo702MiB physical free/1711MiB virtual free; trước đó591MiB. Native allocation failure và renderer/CDP failure xảy ra trong điều kiện này; nguyên nhân renderer chưa được cô lập hoàn toàn. Không tự đóng ứng dụng cá nhân. Unit AI thuần và shell nhẹ PASS không thay thế deep production/model-native suites.

## An toàn, thay đổi và rollback

Không tạo/sửa real.env, không dependency install/update, không migrate/reset/dropDatabase/seed, không thay quyền thật, không xóa file, không commit/push/merge. Test dùng child database local exact allowlist và ephemeral wallets; local RPC đang chạy được giữ nguyên, không reset chain. Các giờ TEST điều chỉnh có audit không chứng minh giờ lao động thực tế.

Sửa HTTP400 validation message nhưng giữ code/shape; không đổi schema/API/auth protocol. JWT/UI expiry vẫn giữ Backend authVersion/RBAC. Việc vô hiệu hóa session đang lỗi không làm response401 cũ xóa session mới, và sai mật khẩu reauth không tự logout phiên hợp lệ. Rollback chọn từng file từ baseline, không reset working tree/database.

Git branch_1 HEAD vẫn8f4e5ac267f5fc86e15c1b106d9bc1f555056227, không staged. Các thay đổi nằm local để review. Backend thủ công57407 đã chạy trước sửa nên cần restart có kiểm soát để nạp errorHandler mới; các test tạo app/process riêng đã kiểm code mới. Frontend dev nhận HMR. Không tự restart Backend người dùng chỉ để áp thay đổi message.

Production-shell thêm kiểm tra port5186/9232 trống sau lượt5/5 để không gắn nhầm browser có sẵn; phần guard mới được node --check, chưa chạy lại cả5case chỉ cho thay đổi preflight này. Code ứng dụng không đổi sau smoke5/5. Không xóa hoặc sửa các log FAIL trước đó.

### File thay đổi

- `client/src/App.jsx`
- `client/src/api/client.js`
- `client/src/api/formAction.js`
- `client/src/api/session.js`
- `client/src/components/AppShell.jsx`
- `client/src/components/AuthModal.jsx`
- `client/src/components/CvJdView.jsx`
- `client/src/components/DashboardView.jsx`
- `client/src/components/EmailIdentity.jsx`
- `client/src/components/GoogleIdentity.jsx`
- `client/src/components/business/Accounts.jsx`
- `client/src/components/business/AiPage.jsx`
- `client/src/components/business/CoreBusinessView.jsx`
- `client/src/components/business/CoreOverview.jsx`
- `client/src/components/business/ProfileCv.jsx`
- `client/src/components/business/Recruitment.jsx`
- `client/src/components/business/Shared.jsx`
- `client/src/components/business/Web3Page.jsx`
- `client/src/components/identity.css`
- `client/src/components/ui.jsx`
- `client/test/google-auth.e2e.cjs`
- `client/test/production-safety.test.mjs`
- `client/test/production-shell.e2e.cjs`
- `client/test/unified.e2e.cjs`
- `docs/DEAD_CODE_REVIEW.md`
- `docs/FULL_PROJECT_AUDIT.md`
- `docs/IMPLEMENTATION_PROGRESS.md`
- `docs/PRODUCTION_READINESS_CHECKLIST.md`
- `docs/PRODUCTION_UI_CLEANUP.md`
- `docs/TEST_RESULTS.md`
- `server/src/middleware/errorHandler.js`
- `server/test/error-safety.test.js`

Evidence mới dưới docs/evidence/production-20261102; cache helper/fixtures giữ Git ignore, không secrets. audit-reports untracked trước nhiệm vụ vẫn giữ.

## Các bước cần phê duyệt/cấu hình tiếp

1. Giải phóng RAM/commit headroom, retest model-native và deep production E2E9 nhóm; giữ logs lỗi gốc.
2. Duyệt transaction báo cáo/unique-current + rollback trên replica-set TEST; không chạy migration gốc.
3. Duyệt dependency patches tương thích cho toolchain18High và server2Moderate; không tự audit fix.
4. Thiết kế deployment TLS/headers/CSP/rate-limit/backup/secret rotation và kiểm tải.
5. Cung cấp Google/Pinata/Atlas qua cấu hình riêng được bảo vệ; không gửi secrets trong chat/Git.
6. Dữ liệu chuyên gia có nhãn và consent để nghiệm thu AI. Kiểm MetaMask/camera/GPS thiết bị thật.

Chỉ sau các điều kiện phù hợp scope sản phẩm mới xét production acceptance. [Audit chi tiết](FULL_PROJECT_AUDIT.md), [UI](PRODUCTION_UI_CLEANUP.md), [dead code](DEAD_CODE_REVIEW.md).

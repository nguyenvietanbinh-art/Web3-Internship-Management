# Custodial Wallet — nghiệm thu C/D và chuẩn bị E

Ngày 09/11/2026 (Asia/Bangkok). **C/D PASS cho phạm vi Backend/API/blockchain TEST và kiểm thử UI thành phần đã nêu. E: dry-run PASS, chưa apply database mục tiêu.**

## 1. Khôi phục đúng trạng thái

Đã đọc năm checkpoint và báo cáo A/B, giữ thay đổi chưa commit. C STEP 1 (backup master key) không làm lại. C STEP 2 ban đầu có các service mới nhưng chưa nối resolver/API hoặc được nghiệm thu. Đã sửa digest báo cáo cho khớp hash byte nội dung, tái kiểm tra snapshot giữa các pha, tách system principal, bổ sung runtime/API và quyền mint. Không tạo master key mới hoặc sửa keyring hiện có.

### Master key và backup

- Key ID `internova-local-test-v1`, version1, file ngoài repo `%LOCALAPPDATA%\Internova\secrets\custodial-test\keyring-v1.json`.
- Backup ngoài repo `%LOCALAPPDATA%\Internova\secure-backups\custodial-test-20261109\keyring-v1.dpapi`, ACL riêng, Windows DPAPI CurrentUser.
- Phục hồi trong bộ nhớ đã giải mã được ví A/B hiện có, địa chỉ trùng. Không tạo file master đã giải mã tạm thời; không in khóa, không dùng khóa ví sinh viên để mint.
- Giới hạn: backup DPAPI cần cùng danh tính và dữ liệu DPAPI Windows. **Chưa là backup khôi phục thảm họa sang máy khác**; không dùng thiết kế LOCAL/TEST này để tuyên bố custody production/cloud.

## 2. Phần Backend đã tích hợp

| Thành phần | Thay đổi |
|---|---|
| `custodialRecipients.js` | Exact TEST URI/replicaSet/marker, mapping user/student/address, unique indexes, AES envelope/AAD qua vault, preserve legacy, conflict fail-closed, chặn address trùng legacy. Ghi chỉ cho DB C/D cô lập; database mục tiêu hiện chỉ đọc |
| `custodialRuntime.js` | Nạp vault khi bật rõ ràng, recipient service/queue/adapter; không init index, provision hoặc chạy worker khi import/startup |
| `businessIdentity.js:chainAssignment` | Khi bật custodial, resolve address hệ thống/legacy; không yêu cầu người dùng liên kết MetaMask hoặc set walletVerified cho địa chỉ mới |
| `custodialPrincipal.js` | Principal hệ thống trong process qua WeakSet; role='system' trong JSON không tự thành principal được phép |
| `certificateQueue.js` | Hàng đợi MongoDB bền vững, unique sinh viên+kỳ, lease job và lease issuer chung giữa worker; retry/backoff, snapshot, kiểm từng proof/receipt, không coi timeout là đã cấp |
| `localWeb3.js`, `Web3Models.js` | Tách actor và signer, thêm studentUserId; mint ở custodial mode chỉ system principal. Giữ operation ID/receipt/calldata/event/deployment/owner/locked verification, không sửa operation lịch sử |
| `BusinessModels.js`, `core/reports.js` | Outbox marker `certificateRequest` được lưu cùng cập nhật phê duyệt cuối có version, **chỉ nếu** CUSTODIAL_AUTO_ISSUE_ENABLED=true. Không đánh dấu các bài đã chốt trước đó |
| `core/custodial.js` | Student đọc recipient chính mình; Admin provision ở TEST được phép; Admin yêu cầu đưa lại job đúng hồ sơ đã kích hoạt, không tự mint và không nhận recipient/digest tùy ý |
| `core/web3.js`, `timeEvidence.js` | API anchor chỉ Admin, service batch chặn Company; lỗi thiếu mapping không còn yêu cầu liên kết ví cá nhân; riêng mint thủ công bị chặn ở đầu route khi bật custodial |
| `custodialFreeze.js` | Chặn API sửa snapshot đang xử lý/đã cấp trong phạm vi actor; giữ kiểm tra quyền trước thông tin khóa hồ sơ. Kiểm tra snapshot lại trước mỗi giao dịch |
| `app.js` | Khi bật custodial, các endpoint link/unlink/challenge ví cá nhân trả410. Không xóa OAuth/password hoặc dữ liệu phương thức đăng nhập cũ |
| `ReportEvidence.jsx` | Chỉ Admin có nút ghi bằng chứng báo cáo; Student/Company/Mentor không bị thông báo walletVerified cá nhân. Upload IPFS của Student vẫn riêng, không thay nộp bài |
| `workflowTestGuard.js` | Bổ sung đúng tên DB C/D TEST; giữ nguyên exact URI, local host/port, replica set và các guard cũ |

Không thêm dependency. Không sửa Solidity hoặc deployment hiện có. Cấu hình custodial và auto-issue **không bật cho Backend PID8916**; không restart dịch vụ thật hoặc worker thường trực.

### Luồng tự cấp trong code

Phê duyệt báo cáo cuối mới khi feature được bật → marker bền vững trên report → worker được vận hành chủ động gọi `pump()` → unique issuance theo sinh viên/kỳ → recipient → giờ đã duyệt → report hash → completion commitment → mint → verify → trạng thái issued.

`pump()` chỉ lấy report đã có marker kích hoạt; không quét 50 bài chốt cũ hoặc tự xử lý 9 báo cáo. Sau enqueue có dispatchedAt, tránh lặp 20 bản đầu làm đói các bản sau. Worker không được khởi động tự động trong lượt này; chỉ test runner cô lập gọi pump/runOne tường minh. Không có HTTP endpoint chạy worker/mint bằng role giả.

Không đủ completed/KPI/report/hours/mapping thì blocked, không gửi giao dịch. Hai reviewer phải đúng company/mentor của assignment. Mọi phiên approved trong snapshot phải có thời gian hợp lệ và được xử lý evidence trước complete/mint. Queue giữ tx/operation idempotent và đối chiếu receipt; JSON DB hoặc điểm AI không thay cho kết quả học vụ được duyệt.

## 3. Dữ liệu TEST và chain

- Database ghi kiểm thử: **internova_custodial_test_cd_20261109**, marker `custodial-cd-v1`, replicaSet `internovaTestRs`.
- Lô thử **3 sinh viên, 3 ví thật CSPRNG mã hóa**, địa chỉ khác nhau. 8 lần provision đồng thời cho cùng sinh viên không tạo thêm mapping.
- Các User, Student, Batch, Assignment, báo cáo và giờ trong DB này là fixture TEST; không nhập vào database 500 sinh viên. User fixture không có thông tin đăng nhập công khai; JWT dùng trong bộ test chỉ tồn tại trong bộ nhớ.
- Đã thử 2 worker cạnh tranh: chỉ một job được claim/attempt, issuer lease được giải phóng. Job này chưa đủ điều kiện nên không gọi chain, không tạo ví mới.
- Giao dịch C/D diễn ra trên **Hardhat in-process mới, network=hardhat**, không phải network localhost/chain18546. Hai SBT TEST đã mint ở hai kỳ của cùng sinh viên, owner là recipient riêng của sinh viên, không phải issuer.
- Sau khi runner kết thúc, EVM in-process không còn để tra cứu lại. Receipt/event/block được xác minh lúc chạy; JSON bằng chứng không phải RPC đang hoạt động hoặc chứng nhận đã đưa lên website nguồn.
- Hai SBT nguồn token4/token5 vẫn xác minh thật qua chain18546; block nguồn vẫn **0x51 (81)**. Không gửi transaction vào chain này.

## 4. Kiểm thử thực tế và lỗi đã sửa

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| Unit crypto/store + regression SBT cũ | **25/25 PASS**, `node --test --test-concurrency=1 server/test/custodial-vault.unit.test.js server/test/custodial-store.unit.test.js server/test/sbt-binding.unit.test.js` |
| API/JWT bốn vai trò | PASS: Student/Company/Mentor bị chặn provision/anchor/mint; Student đọc recipient mình không có ciphertext/private key; Admin provision idempotent |
| Chưa phê duyệt | PASS: queue blocked, chưa tạo operation blockchain |
| Duyệt đủ và cấp thật | PASS: API Admin chốt report → marker; pump ghi attendance/report/completion/mint thật; đúng tokenId/owner/receipt; Student API thấy verified; IDOR Student khác bị404 |
| Chống cấp trùng | PASS: enqueue/pump lại không tăng block, không thêm token; contract từ chối mint trùng |
| Không chuyển nhượng | PASS: locked=true, contract từ chối transfer |
| RPC lỗi | PASS: retry_wait, không có token mới; phục hồi RPC và chạy lại cấp đúng một lần |
| Timeout/pending | PASS: chờ thực tế 5giây khi tắt automine của EVM riêng, lưu submitted/txHash; mine rồi retry dùng đúng tx cũ, không tăng block do gửi lại |
| Receipt thất bại | PASS: giao dịch mint thiếu completion đã mine với status0, không có token |
| Chống giả binding | PASS: receipt thật nhưng đổi recipient → verified=false |
| Issuer lease nhiều worker | PASS: hai worker, một attempt; không gọi chain |
| Không liên kết ví | PASS: sáu endpoint/biến thể ví bị410 trong custodial mode, không gọi DB |
| Browser bốn vai trò | PASS cho **component ReportEvidence thật**, dùng report/User TEST thật qua API; chỉ Admin có nút anchor, không banner link ví, 0request ghi. Không phải kiểm thử lại toàn bộ menu/site |
| Frontend | lint PASS không warning sau sửa; build PASS, output trong cache ignored |
| Nguồn MongoDB | PASS: **27 collection / 15.398 document**, hash và count không đổi; source custody records=0 |
| SBT nguồn | PASS: token4/token5 verified, block18546 không đổi |

Lần chạy D đầu dừng ở assertion quyền mint thủ công: endpoint Admin kiểm tra đã-cấp trước khi chặn system-only. Đã sửa guard đầu route và chạy retest riêng HTTP403/CERTIFICATE_SYSTEM_ONLY. Các bước đã PASS trước đó không chạy lại toàn bộ. File run gốc giữ status BLOCKED để bảo toàn lịch sử; kết quả tổng hợp dựa thêm retest, không sửa JSON cũ thành PASS.

Bằng chứng:

- `audit-reports/CUSTODIAL_CD_20261109/c83074d6c2.json`: test gốc và tx thật, kèm điểm dừng cuối.
- `targeted-route-retest.json`, `recovery-result.json`, `issuer-lease-result.json`, `no-personal-wallet-result.json`.
- `role-ui-result.json`, `report-evidence-student.png`, `report-evidence-company.png`, `report-evidence-mentor.png`, `report-evidence-admin.png`.
- `source-sbt-readonly.json`, `final-source-preservation.json`.

## 5. Backup dữ liệu

Nguồn và fixture đã backup trước write tại `contracts/node_modules/.cache/custodial-cd-20261109/c83074d6c2/`: `source-backup`, `source-baseline.json`, `fixtures-before-custody`. Đã giải nén BSON, deserialize, đối chiếu hash/count và kiểm tra nguồn ổn định trước/sau. Không restore đè database nguồn.

Backup thử lease riêng: `.cache/custodial-cd-20261109/lease-test-before/`. Backup key ngoài repo như mục1, không lưu master trong MongoDB. Backup DB nguồn chứa dữ liệu nhạy cảm, nằm ignored cache, không push.

## 6. E — kiểm kê và kế hoạch cần xác nhận

Database mục tiêu đã kiểm tra chỉ đọc: **internova_large_test_20261108**.

| Kết quả thực tế | Số lượng |
|---|---:|
| Student documents / User student | 500 / 500 |
| Hợp lệ theo User↔Student, role, disabled và mapping hiện có | 500 |
| Có recipient custodial trong collection mới | 0 |
| Giữ địa chỉ legacy có căn cứ sẵn có | 4 |
| Dự kiến cần tạo ví mới | **496** |
| Bị chặn trong inventory | 0 |
| Ví mới đã tạo trên mục tiêu | **0** |

Manifest `audit-reports/CUSTODIAL_BULK_PLAN_20261109/dry-run.json` chứa IDs, hành động dự kiến, snapshot và digest:

`f9e0bf1f0948e3f1fe3b3c9969ed2fce4b0d2a7026fc0a559ef1260ecc626baf`

Đã thử lô3 ở DB TEST và retry/concurrency trước khi trình kế hoạch này. **Chưa apply 496 ví.** Script `custodial-bulk-dryrun.cjs` chỉ đọc, không có apply mode. Recipient service hiện chặn ghi mục tiêu bằng CUSTODY_TARGET_WRITE_NOT_APPROVED; không thể vô tình provision500 bằng API đã thử.

Sau xác nhận riêng cần: kiểm kê lại nếu có thay đổi, backup mục tiêu mới và kiểm chứng phục hồi trong TEST, manifest/fingerprint khớp, bổ sung gate apply đúng mục tiêu và migration index đã xét, chạy lô nhỏ có journal/IDs, dừng mọi xung đột, decrypt-check từng ví và so hash dữ liệu ngoài phạm vi. Không bật worker/mint/backfill khi chạy bulk. Các mapping legacy phải được giữ riêng, không đặt lại private key hoặc chuyển owner cũ.

**Quan trọng:** 4 ví legacy không đồng nghĩa đã có private key mã hóa bằng keyring mới. Không có quyền suy ra/tạo lại private key cho address cũ. Kết quả sau apply dự kiến là 496 ví lưu ký mới + 4 mapping legacy được bảo toàn, không tuyên bố đã tái mã hóa 500 khóa.

## 7. File thay đổi của C/D/E

Mới: `custodialRecipients.js`, `custodialPrincipal.js`, `custodialRuntime.js`, `certificateQueue.js`, `core/custodial.js`, `middleware/custodialFreeze.js`; hai test C/D; scripts `backup-custodial-key.ps1`, `custodial-data-tools.cjs`, `custodial-bulk-dryrun.cjs`, `custodial-role-ui.cjs`; tài liệu và bằng chứng.

Sửa thêm, bảo toàn nội dung đã có: `custodialVault.js` (đọc backup DPAPI), `businessIdentity.js`, `localWeb3.js`, `Web3Models.js`, `BusinessModels.js`, `core/index.js`, `core/reports.js`, `core/web3.js`, `core/timeEvidence.js`, `config/workflowTestGuard.js`, `app.js`, `ReportEvidence.jsx`, helper checkpoint và đủ năm file `docs/codex-progress/`.

Không sửa package/lockfile, không cài dependency, không deploy/reset contract. Backend nguồn chưa reload; kết quả tích hợp chạy ở process/API/EVM TEST riêng.

## 8. Giới hạn và điểm dừng

- Không nghiệm thu lại toàn bộ 32/37 menu hoặc toàn bộ browser workflow; browser lần này là kiểm tra thành phần có thay đổi. API cấp và tra cứu SBT đã chạy thật.
- Mutex/lease và snapshot recheck giảm rủi ro concurrency; cần vận hành một issuer được quản lý và kiểm soát các đường sửa học vụ. MongoDB và blockchain không có transaction chung. Thay đổi ngoài API hoặc sửa kết quả sau mint cần manual review, không giả định rollback được SBT.
- Nonce/transport recovery được thử trên Hardhat TEST; chưa nghiệm thu RPC công khai, fee replacement/reorg nhiều block, signer cloud hoặc nhiều node production. Giữ fail-closed, không mở mainnet.
- Original app chưa có ví cho496 người nên không tuyên bố vấn đề 20 phiên đã được sửa trên website nguồn. C/D chứng minh cùng điều kiện ở TEST trở thành eligible khi có recipient hệ thống và RPC đúng. Áp dụng nguồn cần bước E và cấu hình/reload có kiểm soát được duyệt.
- 9 báo cáo TEST, 50 bài đã chốt, điểm, giờ, CV, phân công và SBT nguồn không đổi. Không xử lý lại hoặc tự nhận nghiệm thu 9 bài đã BLOCKED trước đó.

**DỪNG CHỜ XÁC NHẬN RIÊNG** trước khi tạo496 ví trên database mục tiêu. Không commit/push và không chạy worker/backlog nguồn.

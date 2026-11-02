# Trạng thái đồ án cuối PHASE 7

Ngày 01/11/2026, Asia/Bangkok. **Đã hoàn tất hồ sơ PHASE 7 và môi trường để bạn tự kiểm tra; chưa đủ căn cứ tuyên bố đạt 100% đề cương hoặc sẵn sàng production.** Không commit, push hoặc merge.

## Tổng số chức năng

Đếm đúng 7 nhóm tại mục 9 KLCN129, không lấy số test hoặc API làm tỷ lệ hoàn thành:

| Tổng | PASS | PARTIAL | FAIL | BLOCKED |
| --- | --- | --- | --- | --- |
| **7** | **2** | **4** | **0** | **1** |

| Mã | Chức năng | Trạng thái tổng | Lý do |
| --- | --- | --- | --- |
| K01 | BERT CV/JD matching/ranking | **PARTIAL** | SBERT thật, TF-IDF baseline, ranking/API/UI đã kiểm; chưa nhãn độc lập và Precision@K/Recall@K/MAP/NDCG. |
| K02 | IPFS báo cáo + hash contract | **BLOCKED** | Encryption/adapter và hash on-chain chạy; chưa Pinata upload/CID/readback thật. Hash không CID không chứng minh lưu IPFS. |
| K03 | BERT báo cáo/cảnh báo rủi ro | **PARTIAL** | Semantic relevance thật + rules từ task/giờ; classifier NOT_TRAINED, chưa Accuracy/Precision/Recall/F1/Confusion Matrix. |
| K04 | Task, chấm công, tổng giờ | **PASS local** | UI/API/DB, ownership, check-in/out, tổng giờ, approval/audit và negative tests chạy thực. |
| K05 | QR/GPS/thời gian/blockchain | **PARTIAL** | QR thật/nonce/expiry/GPS policy/WorkSession/hash proof kiểm bằng fixture; chưa UAT camera/GPS thật, GPS chỉ là client claim. |
| K06 | Dashboard theo vai trò | **PASS local** | Bốn vai trò, số liệu theo scope DB thật, empty state, responsive, không auto-write. |
| K07 | Đánh giá qua contract và NFT/SBT | **PARTIAL** | Mint/verify/locked SBT thật; điểm còn ở MongoDB, chain giữ commitment. Phát hành cần Admin bấm chủ động; chưa đạt nguyên văn quản lý điểm/auto-issuance nếu chưa được giảng viên chấp thuận thiết kế này. |

Hai nhóm PASS là K04/K06 trong local TEST. Thành phần mint/verify của K07 PASS, nhưng toàn nhóm quản lý điểm và tự động cấp chứng nhận còn PARTIAL: điểm ở MongoDB, chain giữ hash cam kết và Admin phát hành có chủ đích. Đây là đối chiếu nghiêm với đề cương, không phủ nhận receipt thật đã kiểm ở PHASE 5–6. Gate bảo mật còn FAIL/OPEN và các mục NOT TESTED được ghi riêng, không cộng ngầm vào bảy nhóm. [Tiêu chí và bằng chứng chi tiết](FINAL_KLCN129_ACCEPTANCE.md).

## Đã đáp ứng có bằng chứng

- Wallet signature, JWT, RBAC và quyền sở hữu; CV PDF/DOCX, JD, ứng tuyển và xét duyệt.
- Kỳ thực tập, phân công, task, nhật ký, check-in/out, tổng giờ, báo cáo, đánh giá và dashboard bốn vai trò.
- SBERT CPU inference/ranking và semantic report thật, giữ TF-IDF làm baseline.
- QR có nonce/hạn dùng, decoder ảnh/video thật và GPS policy trong TEST; không auto-write khi chuyển tab.
- Receipt, bằng chứng hash, mint SBT khóa chuyển nhượng và verify RPC local thật; retry/reconciliation có kiểm thử.
- Ba DB gốc/demo nguyên vẹn; audit production server/client 0 advisory sau ba bản vá đã duyệt. Sáu tài liệu và 11 ảnh chạy thật có nguồn/hash đã có.

## Còn thiếu so với đề cương

Pinata upload/CID/readback thật và quản lý khóa; tập nhãn độc lập, ranking metrics và classifier rủi ro đã huấn luyện; UAT camera/GPS/thiết bị/ví thật; điểm số quản lý trực tiếp trên contract và tự phát hành, hoặc xác nhận của giảng viên cho thiết kế hash/explicit mint. Chưa có đổi mật khẩu trong hệ thống wallet-only. Dev/toolchain còn advisory, sáu cold-model tests chưa chạy lại do RAM; cloud deployment, production load, accessibility đầy đủ, quyển báo cáo và slide đúng mẫu trường cũng chưa được nghiệm thu.

## Bạn bắt đầu kiểm tra ở đâu?

**Mở [DEMO_SCRIPT.md](DEMO_SCRIPT.md), làm mục 1 rồi thực hiện bảng 24 bước và điền phiếu tự đánh giá.**

- Trang demo thủ công: **http://127.0.0.1:5177/**; Backend: **57405**.
- DB riêng: `web3_internship_test_phase1_b2ef07c2_e26d4df50ec6`. Có bốn tài khoản TEST và một đề tài; bạn tự tạo CV/JD/application/task/report/giờ làm qua UI.
- Các vai trò: `student`, `company`, `mentor`, `admin`. Session helper ký nonce qua API thật bằng ví TEST mã hóa DPAPI, không dùng backdoor hoặc ví thật.
- Phải mở Edge profile TEST với debug port 9227 rồi chạy lệnh chọn vai trong DEMO_SCRIPT. Mở URL trong profile khác có thể vẫn là Guest; không có mật khẩu mẫu.
- Trang 5175/57404 là dataset inspection cũ, không trộn với bài tự kiểm này. Lưu form trước khi chuyển vai và chỉ dùng tab mới nhất.

Có thể demo phần lớn nghiệp vụ và local blockchain; **không demo IPFS thành công hoặc classifier rủi ro đã huấn luyện**. Nếu camera/GPS không hoạt động, ghi rõ lỗi/NOT TESTED và dùng nhánh manual hours; không gọi đó là QR/GPS đã đạt. Thời lượng khoảng 25–40 phút, gồm thời gian làm việc thực tối thiểu để kiểm phút dương.

## Kết quả kiểm tra cuối

| Kiểm tra | Kết quả / thời điểm | Bằng chứng |
| --- | --- | --- |
| Backend đầy đủ |122/122 PASS chạy lại PHASE 7, fail 0/skip 0|evidence/phase7-20261101/backend-final.txt |
| Frontend lint/build |PASS, lint 0 error/0 warning; build 1,15 giây/cache hiện có|lint.txt/build.txt |
| Smart contracts |9/9 mới +3/3 legacy PASS; compile cache hit|solidity.txt/solidity-legacy.txt |
| QR unit |2/2 PASS,40 random payloads và blank rejection|qr-unit.txt |
| Python NLP unit |16/16 PASS chạy lại|python-unit.txt |
| Python 6 cold-model inference |BLOCKED RAM; không nạp thêm model/hạ guard|memory-final.json ở cache; hot API inference trong Backend vẫn thật |
| E2E core |70/70 PASS của PHASE 6 sau patch; không gọi là rerun PHASE 7|prior-core-e2e-summary.json, source/hash kèm theo |
| E2E legacy / QR |39/39 và 7/7 PASS của cùng bản vá|prior-legacy-e2e-summary.json / prior-qr-e2e-summary.json |
| Demo helper |3/3 PASS native Windows; sandbox DPAPI lần đầu FAIL, chạy đúng user đã PASS|demo-tools-test-accepted.txt |
| Bốn tài khoản demo |4/4 đăng nhập chữ ký + UI đúng vai trò, không console error/outbound request|manual/login-*.json, ảnh 01-*.png |
| Dependency audit |server/client production 0; contracts full vẫn 48 affected packages, không phải 48 CVE|audit-*.log cachePHASE 7; không sửa dependency |
| SBT đọc lại |token 9 từ E2E cũ verify RPC thành công trong PHASE 7|live-certificate-readback.json |
| DB safety / Git |đối chiếu SHA/index gốc/demo; branch_1/HEAD giữ, không stage/commit/push/merge|integrity-final.json/protected-before/after.json |

Không sửa source nghiệp vụ hoặc lockfile trong PHASE 7. Chỉ thêm helper TEST, tài liệu và ảnh/evidence. Đã kiểm đăng nhập UI cả bốn vai trò; chưa khẳng định bạn đã tự UAT 24 bước. [Ảnh cần chụp](SCREENSHOT_CHECKLIST.md), [cài đặt/restart](INSTALLATION_GUIDE.md), [kiến trúc/ERD/API/Mermaid](TECHNICAL_DOCUMENTATION.md).

## Rủi ro và các bước trước khi nộp

1. Chốt với giảng viên phạm vi điểm on-chain, hash cam kết, phát hành chủ động và wallet-only; không tự coi chúng tương đương nguyên văn đề cương.
2. Sau phê duyệt credentials và bảo vệ/backup khóa, kiểm Pinata bằng ciphertext TEST: upload, readback, đối chiếu hash, CID và receipt thật. Không đưa PII plaintext hoặc secrets lên Git/chat.
3. Bổ sung CV/JD/báo cáo có nhãn độc lập, đo ranking/classifier trên heldout và hiệu chuẩn. Dữ liệu demo tổng hợp không thay quality benchmark.
4. UAT camera/GPS/thiết bị và ví TEST thực, chụp ảnh/quay video đúng nguồn. Kế hoạch HTTPS/mạng cho điện thoại cần được duyệt riêng.
5. Xử lý advisory dev/toolchain theo kế hoạch tương thích được duyệt; không audit fix --force hoặc tự nâng Hardhat major. Production audit 0 không phải bảo mật toàn hệ thống.
6. Có RAM phù hợp hoặc máy kiểm thử được duyệt để chạy lại sáu model tests lạnh, giữ guard. Bổ sung tải, cloud và accessibility nếu phạm vi nộp yêu cầu.
7. Tự chạy kịch bản, lưu lỗi và ảnh/TX thật. Backup cache chứa model/vault/compiler/evidence trước mọi contracts npm ci; không xóa dữ liệu hoặc reset chain để che FAIL.
8. Hoàn thiện quyển báo cáo, slide, trích dẫn/license và manifest ảnh; rà Git/secrets. Commit/push chỉ khi bạn chủ động duyệt ở lượt khác.

**Dừng sau PHASE 7. Hoàn tất hồ sơ không có nghĩa hội đồng đã nghiệm thu hoặc hệ thống đã đạt mọi yêu cầu KLCN129.**

## Phạm vi file PHASE 7

So với baseline trước PHASE7; source nghiệp vụ và dependency không đổi. Evidence là ảnh/test logs thật được lưu thêm, không sao chép vault.

- `README.md`
- `docs/DEMO_SCRIPT.md`
- `docs/FEATURE_ACCEPTANCE_MATRIX.md`
- `docs/FINAL_KLCN129_ACCEPTANCE.md`
- `docs/FINAL_PROJECT_STATUS.md`
- `docs/IMPLEMENTATION_MASTER_PLAN.md`
- `docs/IMPLEMENTATION_PROGRESS.md`
- `docs/INSTALLATION_GUIDE.md`
- `docs/SCREENSHOT_CHECKLIST.md`
- `docs/TECHNICAL_DOCUMENTATION.md`
- `docs/TEST_RESULTS.md`
- `docs/evidence/phase7-20261101/01-admin-login.png`
- `docs/evidence/phase7-20261101/01-company-login.png`
- `docs/evidence/phase7-20261101/01-mentor-login.png`
- `docs/evidence/phase7-20261101/01-student-login.png`
- `docs/evidence/phase7-20261101/02-cv-parser.png`
- `docs/evidence/phase7-20261101/03-sbert-ranking.png`
- `docs/evidence/phase7-20261101/04-report-nlp.png`
- `docs/evidence/phase7-20261101/05-time-mobile.png`
- `docs/evidence/phase7-20261101/06-completed-placement.png`
- `docs/evidence/phase7-20261101/07-verified-sbt.png`
- `docs/evidence/phase7-20261101/08-web3-dark.png`
- `docs/evidence/phase7-20261101/backend-final.txt`
- `docs/evidence/phase7-20261101/build.txt`
- `docs/evidence/phase7-20261101/demo-tools-test-accepted.txt`
- `docs/evidence/phase7-20261101/dependency-patch-verification.json`
- `docs/evidence/phase7-20261101/evidence-index.json`
- `docs/evidence/phase7-20261101/final-checks.json`
- `docs/evidence/phase7-20261101/historical-e2e-source-match.json`
- `docs/evidence/phase7-20261101/lint.txt`
- `docs/evidence/phase7-20261101/live-certificate-readback.json`
- `docs/evidence/phase7-20261101/prior-core-e2e-summary.json`
- `docs/evidence/phase7-20261101/prior-legacy-e2e-summary.json`
- `docs/evidence/phase7-20261101/prior-qr-e2e-summary.json`
- `docs/evidence/phase7-20261101/python-unit.txt`
- `docs/evidence/phase7-20261101/qr-unit.txt`
- `docs/evidence/phase7-20261101/solidity-legacy.txt`
- `docs/evidence/phase7-20261101/solidity.txt`
- `scripts/demo/common.cjs`
- `scripts/demo/demo.test.cjs`
- `scripts/demo/prepare.cjs`
- `scripts/demo/session.cjs`
- `scripts/demo/start.cjs`

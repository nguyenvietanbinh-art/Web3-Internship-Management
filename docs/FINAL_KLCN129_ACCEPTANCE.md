# Nghiệm thu cuối theo KLCN129 — PHASE 7

Ngày 01/11/2026, Asia/Bangkok. Nguồn chính: [đề cương DOCX](<../Thư mục mới/KLCN129_Trần-Việt-Hùng.docx>), mục 7/9/10; SHA256 `7e1eb833c56cdf247171ca7cb39577ad39594cae882b66de5dc132f1e7568b52`. Đã đọc lại văn bản gốc, đối chiếu source và evidence sau bản vá PHASE 6. Tài liệu kiểm định cũ là lịch sử, không dùng trạng thái cũ thay tình trạng mới.

**Phạm vi chấm:** đúng 7 nhóm ở mục 9 đề cương, mỗi nhóm chỉ nhận một trạng thái. PASS là đủ luồng phần mềm trong môi trường local TEST đã kiểm, không phải chứng nhận production. PARTIAL là có phần hữu ích chạy thật nhưng còn yêu cầu/kiểm chứng thiết yếu thiếu. BLOCKED là thiếu điều kiện ngoài code để nghiệm thu luồng bắt buộc. FAIL dành cho lỗi tái hiện chưa khắc phục làm nhóm không đạt. NOT TESTED được dùng ở các tiêu chí con. Số test PASS không phải tỷ lệ hoàn thành đồ án.

## Tổng hợp

**7 chức năng: PASS 2, PARTIAL 4, FAIL 0, BLOCKED 1.** Không đổi con số này thành “đạt 100%” hoặc điểm tốt nghiệp. Cổng security/toolchain, triển khai thực tế và UAT được đánh giá riêng; FAIL 0 ở bảy nhóm không có nghĩa mọi gate đều PASS. Quyết định nghiệm thu học phần thuộc giảng viên/hội đồng.

| Mã | Chức năng | Trạng thái tổng | Lý do |
| --- | --- | --- | --- |
| K01 | BERT CV/JD matching/ranking | **PARTIAL** | SBERT thật, TF-IDF baseline, ranking/API/UI đã kiểm; chưa nhãn độc lập và Precision@K/Recall@K/MAP/NDCG. |
| K02 | IPFS báo cáo + hash contract | **BLOCKED** | Encryption/adapter và hash on-chain chạy; chưa Pinata upload/CID/readback thật. Hash không CID không chứng minh lưu IPFS. |
| K03 | BERT báo cáo/cảnh báo rủi ro | **PARTIAL** | Semantic relevance thật + rules từ task/giờ; classifier NOT_TRAINED, chưa Accuracy/Precision/Recall/F1/Confusion Matrix. |
| K04 | Task, chấm công, tổng giờ | **PASS local** | UI/API/DB, ownership, check-in/out, tổng giờ, approval/audit và negative tests chạy thực. |
| K05 | QR/GPS/thời gian/blockchain | **PARTIAL** | QR thật/nonce/expiry/GPS policy/WorkSession/hash proof kiểm bằng fixture; chưa UAT camera/GPS thật, GPS chỉ là client claim. |
| K06 | Dashboard theo vai trò | **PASS local** | Bốn vai trò, số liệu theo scope DB thật, empty state, responsive, không auto-write. |
| K07 | Đánh giá qua contract và NFT/SBT | **PARTIAL** | Mint/verify/locked SBT thật; điểm còn ở MongoDB, chain giữ commitment. Phát hành cần Admin bấm chủ động; chưa đạt nguyên văn quản lý điểm/auto-issuance nếu chưa được giảng viên chấp thuận thiết kế này. |

## Chi tiết đối chiếu

### K01 — CV/JD matching và ranking

- Đề cương yêu cầu BERT/Sentence-Transformers, gợi ý/ranking theo năng lực và bốn ranking metrics.
- UI: CV đã lưu, Quản lý JD/Cơ hội ứng tuyển, AI matching & phân tích. Source `client/src/components/business/ProfileCv.jsx`, `Recruitment.jsx`, `AiPage.jsx`.
- API: `server/src/core/recruitment.js`, `ai.js`; `/api/core/cv`, `/jds`, `/ai/match`, `/ai/rank-applicants`. DB: cvs/job_descriptions/applications; company chỉ phân tích CV snapshot đã ứng tuyển cho JD sở hữu, không đọc mọi CV.
- AI: `ai-service/nlp/engine.py`, `schemas.py`, `metrics.py`; multilingual MiniLM Sentence-BERT ONNX int8 CPU thật,384 chiều; model/revision/hash pin. TF-IDF giữ baseline. Chunk/candidate/TopK/cache/timeout có giới hạn; không coi cosine là xác suất tuyển dụng.
- Test: backend core-ai, Pythonunit, model inference ở PHASE 4, E2E 70 và ảnh 03. Chưa nhãn độc lập, chưa benchmark chất lượng hoặc fine-tune. GPA lưu trong CV nhưng không có luật ưu tiên GPA số riêng trong embedding.
- **PARTIAL**: inference kỹ thuật PASS; quality acceptance chưa đủ.

### K02 — Báo cáo IPFS và hash on-chain

- Đề cương yêu cầu tài liệu báo cáo thực sự lưu phi tập trung và hash contract để xác thực.
- UI Web3 theo kỳ; `Web3Page.jsx`; API `server/src/core/web3.js` upload report JSON/file, artifacts và anchor. DB private_report_artifacts/chain_operations, Report ở business_reports.
- `privateIpfs.js`: validate PDF/DOCX tối đa 2 MiB, SHA256, AES 256 GCM/HKDF, upload ciphertext Pinata, CID validation, bounded readback/hash/decrypt. Key không đưa frontend/Git. Legacy plaintext upload bị privacy gate chặn.
- Chain `InternshipEvidenceSBT.sol` lưu digest/refURI. Anchor nội dung không CID đã có TX thật; **không xem đó là IPFS đã upload**. Adapter test dùng transport fixture được ghi rõ, không cloud success giả.
- Test private-ipfs/error-safety/full-system-security/web3-integration và E2E hiển thị BLOCKED. Chưa credentials/key/enable flag, chưa upload/readback thật, chưa quy trình backup/rotation khóa production.
- **BLOCKED** ở nghiệm thu kết hợp bắt buộc, dù code adapter/hash có phần PASS.

### K03 — Phân tích báo cáo và rủi ro

- Đề cương yêu cầu đánh giá tiến độ/cảnh báo bằng BERT và classifier metrics, gợi ý các lớp báo cáo.
- UI AiPage; `/api/core/ai/reports/:id/analyze` kiểm Assignment scope; core/ai.js lấy task, deadline, approved minutes và phiên mở. `ai-service/nlp/risk.py` tách semantic relevance, rule observations và classifier.
- Model SBERT thật đo liên quan ngữ nghĩa, không tự cho điểm báo cáo hoặc kỷ luật. Không lưu AIAnalysis ngầm khi mở tab/phân tích. DB nguồn: business_reports/internship_tasks/work_sessions/assignments, không bảng predictions giả.
- Test core-ai/Pythonunit/E2E report thật, ảnh 04. Classifier NOT_TRAINED, risk_prediction/confidence null, chưa nhãn/heldout/calibration/confusion matrix.
- **PARTIAL**, không gọi rule cảnh báo là BERT risk prediction.

### K04 — Công việc, điểm danh và tổng giờ

- Source UI Work.jsx/Time.jsx/Reports.jsx; API core/work.js/time.js/kpis.js/reports.js; services/timeTracking.js. DB assignments, internship_tasks, work_logs, work_sessions, business_reports.
- Company/mentor giao task theo Assignment; student cập nhật deadline/progress, nhật ký; check-in/out, tổng ngày/tuần/tháng/kỳ, company review/adjust có lý do và audit. Negative cases: duplicate, foreign scope, stale version, phiên mở, quá 16 giờ, missing checkout.
- Test core-work-time-reports/core-edge-cases/timeTracking/security/browser; ảnh 05. Zero phút là kết quả hợp lệ khi checkout quá sớm, không ép thành giờ làm giả. Ví dụ 55 phút trong E2E là **điều chỉnh TEST có chủ đích**, không giờ làm thực tế của người thật.
- **PASS local**. Hạn chế: một phiên/sinh viên/ngày UTC, chưa nhiều ca hoặc tải production.

### K05 — QR/GPS/thời gian và blockchain

- UI QrCode/NativeQrScanner/qrDecoder/Web3 Page; `qrGps.js`, core/web3.js. CoreQrSession có TTL/nonce/student/action/company, consumed bằng CAS; WorkSession lưu proof/client claim. GPS kiểm freshness/accuracy và distance+accuracy trong radius.
- Quét chỉ điền token; bấm GPS/redeem mới ghi check-in/out. Camera/định vị chỉ hỏi sau thao tác. Source localWeb3.js/contract ghi hash giờ đã duyệt, kiểm receipt/event/state; không coi proof.verified=false thành xác minh GPS tuyệt đối.
- Unit 40 payloads, camera-denied/cancel/late-stream cleanup, GPS/replay/expiry native tests và E2E 7. Video Canvas và vị trí CDP là fixture, không phần cứng thật. Native integration đã anchor hash WorkSession từ QR; ảnhSBT cũ dùng luồng giờ manual được ghi rõ.
- **PARTIAL**: thiếu hardware UAT, quy trình mạng/HTTPS cho điện thoại; GPS client có thể bị giả mạo. Không tự điểm danh on render, không tự gửi blockchain khi GET.

### K06 — Dashboard theo vai trò

- `DashboardView.jsx`, AppShell, UI business pages; core/dashboard.js và placementPolicy.js; `/api/core/dashboard`.
- Student/company/mentor/admin thấy số đếm, task, báo cáo, phút đã duyệt, điểm trung bình từ Mongo trong scope; null/empty khi chưa có. Student thao tác nhật ký/báo cáo ở trang tương ứng, không ép mọi thứ vào dashboard.
- Test core dashboard/security/E2E 4 roles, responsive 320/768/1440, dark/light; không số liệu xu hướng/KPI hardcode, đọc tab không viết DB.
- **PASS local**; chưa production load hoặc WCAG/screen-reader audit đầy đủ.

### K07 — Điểm đánh giá và chứng nhận

- `Reports.jsx`, Web3 Page; core/reports.js/kpis.js/web3.js, services/localWeb3.js; Report.reviews/finalScore và Assignment.kpiScore trong Mongo; chain_operations lưu trạng thái/receipt/tokenId.
- Contract `InternshipEvidenceSBT.sol`: writer authority, report/attendance/completion hashes, replay guard, mint ERC721/ERC5192 locked, generic non-PII metadata. Admin phải bấm complete/mint sau điều kiện; không auto-mint lúc render/duyệt GET.
- Native/EVM/E2E mint thật, duplicate idempotent, unknown 404/foreign 404/RPCmismatch không VERIFIED. Token 9 của E2E trước đã đọc lại thật ở PHASE 7, ảnh 07; chưa mint chứng nhận cho tài khoản manual mới.
- **PARTIAL theo nguyên văn đề cương**: chain chỉ giữ commitment của điểm/snapshot; không có các điểm số đọc trực tiếp on-chain, không tự phát hành ngay sau chấm điểm. Contract không độc lập đọc Mongo/đánh giá chất lượng học thuật. Cần giảng viên chấp nhận thiết kế attestor/hash + phát hành có chủ đích, hoặc phê duyệt bổ sung nghiệp vụ trước khi gọi toàn nhóm PASS. Thành phần mint/verify local tự nó PASS.

## Yêu cầu ngoài bảy nhóm

Wallet login/logout/RBAC thực có test; **đổi mật khẩu chưa triển khai** vì wallet-only, không tự coi tương đương yêu cầu mật khẩu nguyên văn. Chưa triển khai Render/Vercel/Atlas, Postman/Lighthouse/UAT người dùng thật, quyển báo cáo theo template trường hoặc slide bảo vệ. Các mục này không bị giấu trong tổng 7. Chưa mở mạng/mainnet, không ví thật/dịch vụ trả phí.

## Bằng chứng kiểm thử và ranh giới

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

Ảnh trong [evidence index](evidence/phase7-20261101/evidence-index.json) là ảnh chạy thật, không sửa nội dung. Dữ liệu đều TEST tổng hợp. Mốc chụp PHASE 6 và PHASE 7 được giữ riêng; ảnh cũ không đổi nhãn thành ảnh mới. E2E 70/39/7 được dùng lại vì source nghiệp vụ và lockfile không đổi; smoke đăng nhập/helper và các bộ unit/backend/build đã chạy lại trong PHASE 7. Không phải mọi test đều rerun PHASE 7, không full production acceptance.

Đã đối chiếu SHA256 của **116 file nghiệp vụ/browser harness** với bản E2E đã kiểm, đồng thời tái dựng và đối chiếu chính xác lockfile sau ba patch được duyệt: [source-match record](evidence/phase7-20261101/historical-e2e-source-match.json). Đây là căn cứ dùng lại evidence, không phải tuyên bố đã chạy lại 70 E2E ở lượt này.

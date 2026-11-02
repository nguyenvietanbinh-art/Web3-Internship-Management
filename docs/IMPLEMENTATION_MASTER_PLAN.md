# Cập nhật cuối — PHASE 7, 01/11/2026

Đã đối chiếu nguyên văn KLCN129 và chuẩn bị demo riêng. **7 nhóm: PASS2, PARTIAL4, FAIL0, BLOCKED1** (PASSlocalK04/K06; PARTIALK01/K03/K05/K07; BLOCKEDK02). SBTmint/verifythật nhưng K07cònđiểmoff-chain/hash vàexplicitissuance, khôngtựcoilàđạtnguyênvăn. Backend122/122/build/lint/contracts9+3/QRunit2/Python16rerun; E2E70/39/7làevidenceP6saupatchcùngbusinesssource/locks, khônggọilàrerunP7. Demohelper3/3, loginUI4/4. Server/clientproductionaudit0; contractsdev/toolchaincònOPEN, modelcold/hardware/IPFSlivechưađủ.

**Bắt đầu tự kiểm: [DEMO_SCRIPT.md](DEMO_SCRIPT.md), URL5177/API57405, accountsTEST/vaultDPAPIriêng.** [Kết luận](FINAL_PROJECT_STATUS.md), [matrixchi tiết](FINAL_KLCN129_ACCEPTANCE.md), [cài đặt](INSTALLATION_GUIDE.md), [kiến trúc](TECHNICAL_DOCUMENTATION.md), [ảnhthật](SCREENSHOT_CHECKLIST.md). Không sửa source nghiệp vụ/dependency, khôngseed/rootdemo/reset/commit/push/merge. Các phần dưới là lịch sử.

---

# Cập nhật hiện tại — PHASE 5 Web3 local

Ngày31/10/2026. Đã triển khai/test Web3 local theo phê duyệt; chưa đánh dấu toàn bộ PHASE5 nghiệm thu khi Pinata live và camera/GPS phần cứng còn thiếu. Không chuyển PHASE6. [Báo cáo đầy đủ, TX thật, file và giới hạn](WEB3_INTEGRATION_RESULT.md).

Cổng hiện tại: người dùng đã phê duyệt PHASE5 sau PHASE4. Web3 local có bằng chứng EVM/API/UI thực; Pinata live và hardware UAT chưa được nghiệm thu. Không tự chuyển PHASE6 hoặc mainnet, không đổi database gốc/demo. Giới hạn dữ liệu gán nhãn AI không thay đổi. Các dòng “dừng trước PHASE5” bên dưới thuộc lịch sử.

---

# Cập nhật cổng nghiệm thu — 31/10/2026

PHASE1–3 đã được người dùng nghiệmthu. PHASE4 runtime/modelđãduyệt, SBERTlocal/API/UI thựcchạy và regressionPASS; chấtlượngranking vàtrainedriskclassifier vẫn chờnhãnđộc lập (người dùng xácnhận chưacó). Dừng trướcPHASE5, không tự mở rộngWeb3/IPFS/deploy. [Kết quảhiện tại](AI_RUNTIME_INFERENCE_RESULT.md). Kế hoạch/baselinePHASE0 và các trạngthái cũ phía sau là lịch sử, không phải cổng hiện tại.

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# Kế hoạch triển khai tổng thể — KLCN129

Ngày lập: 31/10/2026 (Asia/Bangkok). Trạng thái cập nhật: **PHASE 0 hoàn tất; PHASE 1 đã được phê duyệt và hoàn tất phạm vi code/test; PHASE 2–7 chưa triển khai**.

## 1. Phạm vi và nguyên tắc

Nguồn nghiệp vụ chính là `Thư mục mới/KLCN129_Trần-Việt-Hùng.docx`, mục 5–7 và 9; nguồn chỉ đạo triển khai là MASTER IMPLEMENTATION PROMPT do người dùng cung cấp. Tái sử dụng React/Vite, Express/Mongoose, FastAPI và Solidity/Hardhat hiện có; không viết lại repository, thay framework hoặc xóa chức năng của thành viên khác.

Đã đọc 41 báo cáo Markdown trong audit-reports, README, docs hiện có và 51 file source/config trực tiếp thuộc client, server, ai-service, contracts, database (không coi venv/vendor/generated là nghiệp vụ). Đối chiếu cụ thể: [đề cương](../audit-reports/DOI_CHIEU_DE_CUONG_KLCN129.md), [kiểm định đầy đủ](../audit-reports/FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md), [demo gần nhất](../audit-reports/DEMO_REASSESSMENT_20261030_2340/00_EXECUTIVE_SUMMARY.md).

Chỉ PHASE 0 được thực hiện ở lượt này. Không cài dependency, sửa source, thay .env, chạy seed/migration hoặc restart ứng dụng. Theo mục XIII của yêu cầu, phải dừng để người dùng xác nhận trước PHASE 1.

## 2. Baseline đã xác minh

| Hạng mục | Trạng thái |
| --- | --- |
| Git | branch_1, HEAD d11a1852c5f03963bbe260425a246b0e65fe1091; không tracked/staged diff trước triển khai |
| File cần bảo toàn | 8.336 tracked và 53 untracked tại đầu PHASE 0; có DOCX/ZIP, audit-reports và docs/PROGRESS.md |
| Runtime | Windows x64, Node 22.23.4, npm 10.9.9, Python 3.13.5; dependency ba module Node đã có |
| Hệ thống gốc | Frontend 127.0.0.1:5173 và Backend5000 trả HTTP200; Mongo connected, Pinata chưa cấu hình; Backend nghe :::5000 |
| Demo riêng | Frontend5174, Backend5001, AI8001 trả HTTP200; đều bind loopback, AI là TF-IDF, không BERT |
| Database gốc | web3_internship:14 collections,36 indexes,3 documents |
| Database demo | web3_internship_demo_20261030_2340:14 collections,36 indexes,223 documents |
| Database foundation cũ | web3_internship_demo_20261030_2340_foundation:14 collections,36 indexes,66 documents tại snapshot PHASE 0 |
| Blockchain | Không thấy listener8000/8545/18545;8000 là cổng AI mặc định chưa dùng, AI demo thực ở8001; chưa có RPC local hoạt động |
| Test lịch sử gần nhất | API37/50 PASS; browser12/16 PASS; foundation bản sao an toàn21/21 PASS; tổng70/87 PASS,17 FAIL |

Các số document là snapshot, có thể thay đổi bởi người dùng hoặc TTL; không phải cam kết bất biến. Không gọi API ghi hoặc các GET đã biết tự tạo mẫu trong PHASE 0. Snapshot read-only mới lúc **03:55:33 ngày31/10/2026 (+07:00)** được giữ trong ignored staging.

## 3. Mâu thuẫn tài liệu và quyết định thiết kế dự kiến

| Mâu thuẫn | Phương án bám đề cương |
| --- | --- |
| README nói thiếu Pinata trả local-CID; helper hiện trả503 | Giữ nguyên nguyên tắc không tạo CID giả; cập nhật README sau khi được phép sửa phase liên quan |
| README nói chưa gửi tx, nhưng App đã có ethers calls và nuốt lỗi | Giữ chức năng, tách trạng thái lưu DB/upload/chain; không gọi thành công on-chain khi tx thất bại |
| TF-IDF bị UI gắn nhãn BERT | TF-IDF là baseline; BERT/Sentence-BERT phải có runtime/model và kết quả đánh giá thực |
| Platform một student/topic; Registry nhiều assignment | Chọn mô hình nghiệp vụ canonical nhiều Assignment, giữ adapter tương thích Platform trong giai đoạn chuyển tiếp; quyết định contract cuối ở PHASE 5, không tự bỏ contract cũ |
| API cho mentor chấm, Platform chỉ cho company | Thống nhất chính sách evaluator và contract trước triển khai Web3; không cho UI bỏ qua lỗi quyền chain |
| Đề cương nhắc đổi mật khẩu; ứng dụng wallet-only | Không tự gắn mật khẩu vào tài khoản ví. Giữ wallet auth; ghi rõ khoảng thiếu và cần xác nhận nghiệp vụ với giảng viên hoặc thiết kế luồng mật khẩu riêng trước triển khai |
| Enum mentor/admin chưa tương đương giảng viên/nhà trường | Dùng mentor cho giao diện giảng viên có quan hệ phụ trách rõ ràng; admin có chức năng quản trị riêng, không chỉ đổi nhãn menu |
| Source có sample/mock, đề cương cho dữ liệu giả lập để nghiên cứu | Fixture chỉ ở môi trường thử, công khai nguồn; không dùng kết quả/receipt/chứng nhận giả làm bằng chứng triển khai thật |

## 4. Trình tự và cổng nghiệm thu

| Phase | Đầu ra chính | Phụ thuộc | Điều kiện kết thúc |
| --- | --- | --- | --- |
| 0 — Baseline | Git/runtime/source/test baseline;6 tài liệu này | Không | Xác minh trạng thái, kế hoạch file, rủi ro và điểm cần duyệt; không sửa ứng dụng |
| 1 — Security & data correctness | Permission policy; GET-only; kết quả trung thực; QR nền tảng; test guard/regression | Người dùng duyệt PHASE 1 | Các lỗ hổng P0 có regression; kiểm soát persistence test; không ảnh hưởng DB hiện tại |
| 2 — UI/UX | Tokens, AppShell/sidebar/topbar, theme, reusable components, role navigation, responsive | Phase1 API/permission contracts | Thao tác thật, không mất chức năng; a11y/keyboard/empty/error; mobile không tràn; build/lint đạt |
| 3 — Core business | Profile/CV/JD/Application; task/log/hours; batch, teacher/admin; notification/audit | Phase1; triển khai tăng dần cùng UI phase2 | Luồng theo vai trò và quyền có API/UI/persistence/tests; dữ liệu cũ có kế hoạch tương thích |
| 4 — AI | Parser, SBERT matching/ranking; report risk; dataset/evaluator/metrics | Core models; duyệt dependency/model; dữ liệu có nhãn | Phân biệt model/rules/fallback; benchmark tái lập và metrics thực, không bịa số |
| 5 — IPFS & blockchain | Adapter upload/readback/hash; QR proof; contract/token; receipt/sync | Core, permission và quy trình đánh giá; credentials/network được duyệt | Local EVM/testnet theo phạm vi được phép; mint/verify thật; failure/retry/reconcile có test |
| 6 — Full integration | E2E theo vai trò; security regression; responsive/performance/error recovery | Các đường tích hợp sẵn sàng | Tách test mocked với external integration; không còn critical flow giả; bảo toàn DEV |
| 7 — Acceptance | Đối chiếu7 chức năng, evidence, demo checklist, báo cáo còn thiếu | Phase6 và yêu cầu đề cương | Chỉ đánh dấu DONE khi đạt toàn bộ UI/API/DB/auth/error/test và AI/Web3 thực tương ứng |

Không tự chuyển sang phase rủi ro cao hoặc tự cài cloud/model/deploy công khai. Phần bị BLOCKED được ghi rõ; tiếp tục các phần độc lập đã được duyệt. Các phase sau hiện là kế hoạch, không phải quyền triển khai ngay.

## 5. Kế hoạch file PHASE 1 cần phê duyệt

Đây là danh sách dự kiến trước chỉnh sửa. “Mới” chỉ là đề xuất, chưa tạo file source/test. Không thay manifest/lockfile trong PHASE 1 trừ khi có lý do được duyệt riêng.

| Đợt | File dự kiến | Thay đổi và mục đích | Kiểm chứng cần chạy |
| --- | --- | --- | --- |
| 1.1 | server/test/helpers.js; server/test/foundation.test.js | URI TEST bắt buộc/allowlist; DB riêng theo run; bỏ dropDatabase; giữ assertion hữu ích và ghi rõ stubIPFS | Guard từ chối DEV/PROD/missing URI trước connect; foundation giữ PASS trên DB mới; không cleanup phá dữ liệu |
| 1.1 | server/test/runtime-safety.test.js (mới); server/test/security-regression.test.js (mới) | Baseline negative cases và zero-mutation assertions | GET lặp/remount không gọi write; mock và integration được tách |
| 1.2 | server/src/config/env.js; server/src/index.js; server/src/app.js | Demo mode mặc định tắt; local binding/allowlist; readiness; listener write phải opt-in; cấu hình kiểm thử | CORS allow/deny; startup config; health/readiness; không tự kết nối RPC/ghi chain khi chưa bật |
| 1.2 | server/src/routes/auth.routes.js; server/src/services/authService.js; server/src/middleware/auth.js | Chặn demo bypass ngoài demo được xác minh; nonce verify rồi consume atomic; chuẩn hóa kiểm quyền | Sig đúng/sai/expired/replay; chữ ký sai không vô hiệu hóa nonce hợp lệ của người khác; user role không tự nâng |
| 1.3 | server/src/middleware/permissions.js (mới); server/src/routes/internship.routes.js | Scope theo JWT+assignment/company/evaluator; bỏ JD/task/attendance/worklog seeding khi GET; chặn self-review/IDOR | Company/student/mentor/admin; cross-tenant; request body giả danh; GET zero writes; enum/date validation |
| 1.3 | server/src/routes/data.routes.js; server/src/routes/topic.routes.js | Bảo vệ dữ liệu nội bộ; DTO public tối thiểu; record-chain-tx phải kiểm owner và receipt, không tin body | Public projection không lộ báo cáo/email; foreign IDs403/404; tx sai/chain sai/not-ready không ghi |
| 1.4 | server/src/models/AttendanceSession.js (mới); server/src/services/attendanceService.js (mới) | Phiên QR ngẫu nhiên, hạn ngắn, company/assignment scope; kiểm session, nonce/replay và state | Invalid/expired/wrong company/reused không tạo Attendance; concurrency trên DB test; timestamp theo timezone đã chốt |
| 1.4 | server/src/routes/internship.routes.js | POST tạo phiên có quyền; GET chỉ đọc phiên đã có; check-in không nhận QR-VERIFIED/fallback hardcode | Chưa có phiên/policy trả unavailable/validation error rõ ràng; không tự tạo khi mở trang |
| 1.5 | server/src/services/chainVerificationService.js (mới); server/src/services/chainListener.js | Adapter xác minh receipt/event/address/chain; sync thiếu RPC phải báo unavailable, có quyền mới gọi; không cấp verified từ DB status | Pure receipt fixtures công khai là mock; absent certificate404; RPC unavailable không success; không giao dịch thật |
| 1.5 | client/src/components/Web3CertificateView.jsx; client/src/api/web3Client.js; client/src/App.jsx | Mount chỉ GET; pending/failed/confirmed; bỏ minted/verified khi không có bằng chứng; không default onChainId1 | Browser network zero-auto-POST; tx rejected không toast mint/complete; signer/network mismatch được chặn |
| 1.6 | client/src/components/DashboardView.jsx; client/src/components/CvJdView.jsx; client/src/components/AttendanceView.jsx; client/src/components/AuthModal.jsx; client/src/api/client.js | Bỏ số liệu/matching mặc định, toast ứng tuyển giả; error/empty/permission states; demo opt-in; giữ chức năng thật | Empty DB hiển thị không dữ liệu; apply chưa có API báo chưa khả dụng, không báo đã gửi;401/403 không fallback giả |
| 1.6 | server/src/services/aiClient.js; ai-service/main.py | Provenance model/fallback; không điểm sàn gây hiểu nhầm cho đầu vào trống/không liên quan; không gọi TF-IDF là BERT | Unit empty/unrelated/timeout; adapter field compatibility; chưa đánh dấu BERT/risk classifier đã có |
| 1.7 | docs/IMPLEMENTATION_PROGRESS.md; docs/FEATURE_ACCEPTANCE_MATRIX.md; docs/TEST_RESULTS.md; docs/ARCHITECTURE_UPDATED.md | Ghi từng file đã sửa, test và evidence; cập nhật trạng thái thực | Diff và baseline; đầy đủ PASS/FAIL/BLOCKED/NOT TESTED; không che test fail |

### Giới hạn PHASE 1

- Không redesign toàn bộ UI, thêm Application/giờ làm, triển khai BERT hoặc mint token trong PHASE 1. Chỉ chỉnh UI tối thiểu để không báo sai và tương thích quyền mới.
- AttendanceSession là thiết kế **bổ sung**, không sửa/xóa record lịch sử hoặc đổi unique index Attendance hiện có. Chỉ tạo collection/index của model mới trong DB TEST được allowlist; không restart Backend DEV/demo hiện tại để áp schema trong lúc sửa/test.
- QR nền tảng không đồng nghĩa GPS chống gian lận hoặc camera hoàn tất. Scanner/geofence/policy GPS và attendance proof đầy đủ được nghiệm thu ở phase sau; thiếu cấu hình phải báo rõ, không dựng tọa độ mẫu.
- Certificate chưa có chain/token thật phải fail closed: unknown404; thiếu verifier/RPC trả unavailable hoặc trạng thái chưa xác minh, tuyệt đối không verified=true. Các test receipt giả lập không là bằng chứng blockchain runtime.
- Không sửa schema cũ có thể phá dữ liệu, chạy seed/migration, drop index, thay .env hoặc deploy contract. Nếu phát hiện cần migration, ghi kế hoạch backup/dry-run/rollback rồi tách phê duyệt.

## 6. Công cụ, thư viện, dữ liệu và credentials

| Có thể tái sử dụng | Còn thiếu/đề xuất | Phase và điều kiện |
| --- | --- | --- |
| Node/npm và các dependency client/server/contracts đã cài; Lucide, ethers, JWT, crypto, Mongoose | Không cần npm install cho kế hoạch bảo mật đầu tiên; framework UI giữ React/CSS hiện có | Phase1 dùng dependency hiện có; thêm gói cần đánh giá và duyệt trước |
| FastAPI, sklearn, NumPy, Pydantic, Python3.13.5 | sentence-transformers, torch, transformers chưa cài; model weights/cache chưa xác minh; môi trường Python tương thích cần khóa phiên bản | Phase4, đánh giá CPU/GPU/RAM/dung lượng/license trước tải; không dùng venv tracked của máy cũ |
| Chưa có parser được xác minh | pypdf/python-docx hoặc adapter phù hợp; giới hạn file/MIME/content/zip bomb, quét an toàn | Phase3–4; cần duyệt dependencies; không công khai CV trên IPFS |
| Browser native camera/geolocation, Edge có sẵn | QR encoder/scanner library và fallback cần lựa chọn; quyền camera/GPS và chính sách sai số | Phase2/5; không tự xin quyền camera khi mount |
| CSS tokens, SVG/CSS chart đơn giản có thể không cần package mới | Tailwind/shadcn/chart library là tùy chọn, không bắt buộc | Phase2 chỉ thêm nếu có lợi và tương thích; không đổi framework để làm UI |
| Hardhat2.29.1, Solidity0.8.24, ethers6.17 | RPC local chưa chạy; token standard/contract canonical; bộ test EVM/metadata network | Phase5; local EVM phải cô lập; public/testnet deploy cần phê duyệt riêng |
| Pinata adapter hiện có | PINATA_JWT hoặc adapter credentials tương đương; tài khoản/pinning quota | Phase5, không tạo giả; không yêu cầu gửi secret trong chat, dùng biến môi trường cục bộ khi được duyệt |
| Ví JWT nonce hiện có | Chain IDs, contract addresses thật, confirmation policy, RPC URL, tài khoản ví test không tiền thật | Phase5; không dùng private key thật trong source/log |
| Seed có thể làm fixture nghiệp vụ | Dataset CV/JD và báo cáo có nhãn, train/validation/test split; đánh giá độc lập | Phase4; synthetic được công bố là synthetic, không dùng để bịa độ chính xác thực tế |
| Local demo đã chạy | Render/Atlas/Vercel/Netlify/Sepolia/UAT accounts và quyền triển khai chưa xác minh | Phase6–7, không tự dùng cloud trả phí hoặc public deploy |

## 7. An toàn dữ liệu, Git và rollback

1. Bảo toàn ba DB hiện có; mỗi đợt integration dùng tên mới có prefix TEST và run ID. Parser URI phải kiểm protocol, host, dbName, NODE_ENV và exact allowlist trước connect; không chỉ dựa vào chữ “test” chứa trong URI.
2. Không dùng DB demo đã có223 documents làm DB disposable. Không dropDatabase/dropCollection/dropIndex/deleteMany để reset. Fixture riêng có provenance; nếu cần dọn test data phải có phạm vi và phê duyệt riêng.
3. Trước thay đổi schema/index: export/backup được người dùng duyệt, dry-run trên bản sao riêng, bảng mapping và rollback; không xóa duplicate để ép index build PASS. Standalone Mongo hiện tại không bảo đảm multi-document transaction; cần chốt replica set riêng hoặc outbox/compensation.
4. Mỗi patch nhỏ ghi file/lý do và kiểm tra Git. Không reset/clean/stash/merge/commit/push, không xóa hoặc ghi đè file untracked của nhóm. Rollback code bằng bản lưu/patch đã xác minh, không Git reset; rollback dữ liệu không tự thực hiện.
5. Vite hiện đang chạy nên sửa client sẽ HMR; Backend npm start không tự reload. Khi được duyệt sửa cần cô lập browser và frontend/backend phiên bản tương ứng, không để UI mới gọi backend cũ rồi hiểu nhầm kết quả. Khởi động lại/đổi service phải được kiểm soát, không đụng tiến trình ngoài phạm vi.
6. Các báo cáo lịch sử, DOCX, ZIP và venv tracked giữ nguyên. Generated build/compile/test outputs ở đường dẫn ignored mới; không compile đè artifact/cache tracked.

## 8. Điểm dừng

Phê duyệt cần tiếp theo: **PHASE 1 theo bảng file/giới hạn ở mục5**, bao gồm sửa helper test và model QR bổ sung chỉ áp dụng trên DB TEST. Chưa xin/nhận quyền sửa PHASE 2–7, cài model/dependency, thay .env, migration hoặc public deploy. Danh sách DONE của sản phẩm chỉ cập nhật sau evidence thật; hoàn tất PHASE 0 không phải hoàn tất đồ án.


## Cập nhật sau PHASE 1

Đã thực hiện PHASE1 theo xác nhận người dùng; xem IMPLEMENTATION_PROGRESS.md và TEST_RESULTS.md cho43Backend/5AI/16browser và các file thực tế. Bổ sung trong phạm vi an toàn: testEnvironment.js để dùng chung guard, error-safety.test.js và redaction ipfsService/errorHandler. Không đổi scope PHASE2–7, schema/index cũ, manifest/lock/.env hoặc dữ liệu gốc/demo. Điểm dừng mục8 phía trên là lịch sử kế hoạch PHASE0; điểm dừng hiện tại là chờ người dùng kiểm tra PHASE1, chưa tự chuyểnPHASE2.

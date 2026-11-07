## Nghiệm thu đối chiếu CV/JD — 07/11/2026

| Phạm vi | Trạng thái | Bằng chứng |
| --- | --- | --- |
| TF-IDF/BERT thật, raw cosine và xếp hạng | PASS | 400 truy vấn; API và browser |
| So sánh cùng đầu vào, hai thứ hạng, chênh lệch hạng | PASS | Fingerprint chung; 20 và 50 JD; browser hai cách sắp |
| Kỹ năng chính xác/tương đương/liên quan/thiếu | PASS | Danh mục kiểm soát; không tính liên quan thành đáp ứng |
| Card, chi tiết và mobile | PASS | 4 browser tests, build/lint |
| Chất lượng gợi ý ngoài tập tổng hợp | PARTIAL | Chưa có nhãn chuyên gia độc lập; không có độ tin cậy hiệu chuẩn |

[Báo cáo, metrics và bảo toàn dữ liệu](SEMANTIC_MATCHING_REVIEW.md). K01 không được nâng thành PASS toàn diện chỉ từ metrics tổng hợp.

## Luồng sinh viên — 07/11/2026

**Bộ200 CV trên website:** PASS import thêm mới, bảo toàn bản ghi cũ, thử đăng nhập CV-004 và BERT/TF-IDF đủ20 cơ hội qua API/browser ở cả5188/5189. Không train hoặc đổi nhãn chất lượng; PARTIAL về đánh giá năng lực thực tế như bộ tổng hợp nguồn. [Hướng dẫn](REFERENCE200_WEB_IMPORT.md).

**Liên kết ví modal:** PASS41 kiểm thử API/Google-regression/browser trên TEST; xác thực mật khẩu trước MetaMask, nonce gắn chain/user/wallet/purpose/expiry, chống replay/ví trùng/CSRF/rate-limit, không đổi RBAC hoặc CV/JD. MetaMask extension và Google OAuth live NOT TESTED trong đợt này. [Kết quả và ảnh](WALLET_LINK_MODAL_RESULT.md).

**Bổ sung nghiệm thu AI matching200 CV:** PASS thực thi và tính nhất quán bộ200 CV/20 JD/4.000 cặp;400 inference TF-IDF/SBERT thật. PARTIAL chất lượng theo nhãn tham chiếu tổng hợp; BLOCKED đối với tuyên bố đánh giá chuyên gia độc lập vì chưa có xác nhận người chấm. Không dùng MAP cao trên tập tổng hợp để nâng K01 thành PASS toàn diện. [Chi tiết](CV_JD_EVALUATION_200.md).

| Yêu cầu | Trạng thái và bằng chứng |
|---|---|
| Một Tổng quan, không công cụ phân công quản trị |PASS, browser/dashboard API|
| Công việc được giao + báo cáo tuần5 mục gửi doanh nghiệp |PASS, API/version và browser; nhật ký cũ giữ nguyên|
| Báo cáo kết quả chỉ cuối kỳ, chỉ nộp lại khi yêu cầu bổ sung |PASS, backend409, browser và scope/phiên bản|
| Chấm công hợp lệ không cần ví, lý do khóa, giờ đã duyệt |PASS manual/API và browser1 phút thực; NOT TESTED phần cứng camera/GPS|
|8 CV PDF/DOCX đầy đủ, parser thật, giữ CV snapshot |PASS,16 upload và browser chọn file|
| CV/yêu cầu phong phú, kỹ năng riêng và TF-IDF/SBERT thật |PASS tích hợp TEST8 cơ hội; PARTIAL chất lượng xếp hạng thực tế chưa có nhãn độc lập|
| Giữ trạng thái, gõ liên tục, Back/Forward, draft guard, logout |PASS browser5+3; không lưu draft nhạy cảm vào storage|
| Quyền vai trò và bảo toàn dữ liệu cũ |PASS hồi quy và hash/index4 database|
| IPFS live / độ tin cậy AI trên người thật |BLOCKED/chưa được nghiệm thu; không có xác nhận thành công giả|

[Báo cáo chi tiết, file và giới hạn](STUDENT_WORKFLOW_UPDATE.md). Các số liệu/kết luận phía dưới thuộc các đợt trước; không dùng để phủ nhận thay đổi đã kiểm thử ở trên.

## Bổ sung nội dung báo cáo — 07/11/2026

PASS:48 bài mẫu chi tiết gắn đúng báo cáo/phân công, nút xem toàn văn tại trang phân tích, chọn rõ bài đã nộp/bài mẫu, hash nguồn phân tích khớp bài đọc, không thay điểm đã chốt; API/Browser/RBAC/lint/build đã kiểm. PARTIAL: đây là bài tổng hợp, không phải bài nộp của sinh viên thật hoặc nhãn chuyên gia; chưa chứng minh chất lượng chấm tự động trên dữ liệu thực tế. [Chi tiết](REPORT_READING_SAMPLES.md).

# Cập nhật nghiệm thu theo vai trò — 07/11/2026

| Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|
| Chỗ cuối atomic, đóng tuyển, hoàn lượt idempotent, bảo toàn lịch sử/kỳ khác | PASS | Integration mới + workflow regression |
| Tìm cơ hội theo kỳ, công ty, nội dung, kỹ năng; phân trang | PASS | API + browser search/Back/Forward/reload |
| CV/requirements và gợi ý TF-IDF/SBERT thật; hồ sơ đáp ứng đúng hai đề tài | PASS về chức năng | API hai engine + browser BERT; không coi là benchmark chất lượng |
| Doanh nghiệp không có AI ranking | PASS | Menu/direct view + hai endpoint403, không gọi NLP |
| Báo cáo/file theo scope, context Admin, chấm trước/giảng viên xác nhận | PASS về workflow; PARTIAL về đánh giá chất lượng tự động | IDOR, fault-injection transaction, rubric, browser |
| Giảng viên/Admin không có ví cá nhân | PASS | Browser profile; Admin verify SBT không nối ví |
| State theo user/role, không autosave/replay, cảnh báo draft | PASS | Browser và request logs |
| Local SBT và bằng chứng báo cáo/giờ làm | PASS trên Hardhat QA | Receipt/token/locked/idempotency, API + browser Admin |
| Pinata live/readback/tệp thật | BLOCKED | Thiếu cấu hình; chỉ adapter tests, không CID giả |
| Chất lượng mô hình ngoài thực tế/nhãn chuyên gia | BLOCKED nghiệm thu chất lượng | Dữ liệu tổng hợp, không expert labels; không confidence giả |
| Camera/GPS/MetaMask thao tác tay; chuyển tiền hỗ trợ toàn luồng | NOT TESTED trong đợt này | Không suy từ unit/API/SBT thành PASS |

Chi tiết: [ROLE_WORKFLOW_COMPLETION.md](ROLE_WORKFLOW_COMPLETION.md). Bảng lịch sử bên dưới được giữ lại; trạng thái mới chỉ áp dụng cho phạm vi vừa retest, không tuyên bố toàn bộ đồ án đạt 100%.

> **Bài báo cáo ngắn cho kỳ đã hoàn thành — 07/11/2026:** Có 36 bài/12 sinh viên tổng hợp, ba mức nội dung. Giảng viên xem/sửa bài trên form, chấm trước và hoàn tất phiếu thử riêng, xuất JSON; giữ nguyên báo cáo/điểm đã chốt. API scope tests PASS; 2 browser tests PASS gồm sửa form và tải file, không gọi API ghi điểm chính thức. Unit/rubric tests, lint/build PASS. Dataset chờ nhãn tại ai-service/datasets/completed-report-exercises-v1, chưa tự huấn luyện lại. [Hướng dẫn và bằng chứng](COMPLETED_REPORT_EXERCISES.md).
> **Đối chiếu kỹ năng và BERT đã nối đủ — 07/11/2026:** Sửa API workflow trước đây gửi kỹ năng đề tài rỗng; hiện dùng Topic.requiredSkills đã có. Bổ sung yêu cầu cụ thể cho 60 đề tài/144 cơ hội do script tạo, giữ 73 CV ứng tuyển. Giao diện hiện kỹ năng yêu cầu/đáp ứng/cần bổ sung và doanh nghiệp có ô nhập kỹ năng. Bốn nhóm CV × TF-IDF/SBERT đều HTTP 200, BERT inference thật; 8 unit/route/guard tests, lint/build PASS. Browser NOT TESTED; không coi toàn dự án đã production-ready. [Bằng chứng, tài khoản và giới hạn](SKILLS_MATCHING_IMPLEMENTATION.md).
> **Luồng mới: chấm trước, giảng viên kiểm tra — 07/11/2026:** Kết quả phân tích có điểm đề xuất 7 tiêu chí (official:false); giảng viên mở phiếu đã điền sẵn để sửa/xác nhận. Không tự lưu điểm; bài đầy đủ 82,33 và bài thiếu 32,84 trong lần thử API, báo cáo trước/sau không đổi. Chuẩn bị 6 bài mẫu thiếu và xuất 48 file đọc thử; thêm nút Xem bài báo cáo. 5 test chấm trước + 16 NLP + 5 phiếu chấm, lint/build PASS; browser NOT TESTED. [Hướng dẫn và giới hạn cách chấm](PROPOSED_REPORT_GRADING.md).
> **Phiếu chấm giảng viên — 07/11/2026:** Thêm 7 tiêu chí tổng 100 điểm, căn cứ và nhận xét do giảng viên nhập; lưu chi tiết vào nhận xét theo API hiện có. Gợi ý phân tích dùng lời dễ hiểu, không biến điểm tương đồng thành điểm chấm. Lint/build và 5 unit tests PASS; chưa ghi điểm/test lưu bằng trình duyệt. [Hướng dẫn, phạm vi và giới hạn](TEACHER_REPORT_GRADING.md).
> **Classifier tổng hợp đã tích hợp local — 07/11/2026:** TF-IDF + Logistic Regression fit trên 600/1.000 báo cáo synthetic; AI 8003 bật opt-in và kiểm SHA-256. API trả EXPERIMENTAL_SYNTHETIC, confidence null, không sửa điểm/dữ liệu. BERT vẫn dùng để đối chiếu ngữ nghĩa, không được fine-tune. 26 test Python, lint/build PASS; 4 lần phân tích qua Backend HTTP 200. Chất lượng trên dữ liệu thật chưa nghiệm thu; browser NOT TESTED. [Chi tiết và giới hạn đã quan sát](SYNTHETIC_CLASSIFIER_INTEGRATION.md).
> **Bổ sung dữ liệu theo công đoạn — 07/11/2026:** Giữ nguyên database hiện tại, thêm 72 sinh viên (6 nhóm × 12 doanh nghiệp), 2 kỳ theo năm học (đang thực tập/đã đóng), 72 task, 48 nhật ký, 60 phiên giờ và 48 báo cáo tổng hợp. Không coi giờ/điểm mẫu là hoạt động người thật. Lint/build và 3 unit/route tests PASS; API đọc dữ liệu theo 5 tình huống đăng nhập PASS, truy cập chéo sinh viên 404; phân tích báo cáo TF-IDF HTTP 200, classifier NOT_TRAINED. Browser E2E NOT TESTED, IPFS/blockchain BLOCKED. [Tài khoản, từng bước thử và bằng chứng](LIFECYCLE_EXAMPLES_20261107.md).
# Combined demo - 07/11/2026

[Runtime/data/login](COMBINED_DEMO_20261107.md): source8aa463b; new DB on27018; 43legacy documents preserved,226new synthetic accounts,200students (100registered/100unregistered),2new periods. Health/ready and4role login/dashboard API PASS; guard unit2/2PASS. Browser CDP timeout FAIL, not full E2E acceptance. No fake transactions/hours, no source DB changes, no commit/push.

---

> **2026-11-06 ? catalog for new periods:** Creating a period now automatically publishes open company topic templates with independent period quotas. The two existing empty periods were repaired with 41 opportunities each. See [rules and current verification](NEW_BATCH_TOPIC_CATALOG_RESULT.md). GET requests never populate data, and synchronization never reopens or overwrites an existing opportunity.

> **2026-11-06 ? first company acceptance:** The owner explicitly chose immediate acceptance by the first company, with automatic withdrawal of the student's other open applications and notifications to their companies. This supersedes the earlier offer/student-confirmation rule (D03). See [implementation, current bachelor-001 result and tests](FIRST_COMPANY_ACCEPTANCE_RESULT.md).

> **2026-11-06 ? direct applications:** The owner clarified that students apply directly to the selected company. This supersedes the earlier school-dispatch gate (D01). Admin intervention is the fallback from seven days before the period starts when no placement has been secured. See [updated policy, data fix and verification](DIRECT_APPLICATION_ROUTING_FIX.md).

> **Workflow Phase B ? 2026-11-06:** School-managed workflow is running in isolated TEST at `http://localhost:5188` (Mongo replica set `27018`, Hardhat `18546`). New evidence: 9/9 real HTTP/DB/NLP/SBT tests and 5/5 browser scenarios; frontend lint/build pass. See [current implementation and test report](WORKFLOW_PHASE_B_RESULT.md). The original database is unchanged. ERC20 support payments remain unimplemented pending the explicit pinned dependency approval in D06; source migration and full Phase B acceptance are not complete. Historical results below do not prove the new workflow or payments. Credentials are local ignored files only.

# Identity thống nhất — cập nhật 02/11/2026

**Hiện hành:** http://localhost:5182/, Backend57407, User ID ownership. Email → Dashboard theo role → nghiệp vụ không ví → liên kết ví sau, cùng URL/database. Các mục cũ bên dưới là lịch sử.

| Hạng mục | Kết quả |
| --- | --- |
| Email/bốn role/CV/JD/AI/application/task/log/time/report/dashboard không ví | PASS TEST, RBAC/ownership/persistence |
| Link/unlink/replay/conflict | PASS API/chữ ký TEST; popup MetaMask thật NOT TESTED |
| Hardhat local/SBT | PASS receipt/mint/verify thật |
| Backend | 164/164 PASS,0fail,0skip |
| Browser | 8/8 unified +6/6 email +7/7 Google/wallet |
| Lint/build | PASS,0error/0warning lint |
| Google/Pinata live | BLOCKED cấu hình |
| Risk/metrics chất lượng AI | NOT_TRAINED risk, chưa có nhãn độc lập |
| An toàn | Gốc/demo hash/index không đổi;4records User/profile TEST cũ SHA giữ nguyên |

Không dependency mới/public deploy/commit/push/merge. Flag mặc địnhfalse, chưa chuyển dữ liệu gốc/demo. [Báo cáo/file thay đổi](UNIFIED_IDENTITY_RESULT.md), [hướng dẫn](FULL_WEBSITE_TEST_GUIDE.md), [bằng chứng](evidence/unified-20261102/INDEX.md).

---

# Cập nhật — Lưu hồ sơ và chuyển trang

Ngày 02/11/2026 (+07). PATCH thành công → refresh User hiện tại → chuyển Tổng quan tài khoản; không cần ví cho trang tài khoản, không bỏ guard nghiệp vụ. Đã kiểm persist/reload/redirect bằng browser: email6/6 + Google/ví7/7 PASS; lint0error/0warning/buildPASS. Không sửa Backend hoặc dữ liệu gốc/demo. [Báo cáo và giới hạn](PROFILE_SAVE_NAVIGATION_RESULT.md).

---

# Cập nhật — Màn hình trước đăng nhập

Ngày 02/11/2026 (+07). Chưa đăng nhập: chỉ trang chào và nút Đăng nhập/Đăng ký, không sidebar/menu nghiệp vụ/thông báo/blockchain. Không tải topics cho khách, chờ session trước workspace; logout ẩn menu ngay. Email browser5/5 và Google/ví/bốn-role regression7/7 PASS trên TEST riêng; lint0error/0warning/buildPASS. Không sửa Backend hoặc dữ liệu cũ. [Báo cáo và phạm vi kiểm thử](GUEST_AUTH_UI_RESULT.md).

---

# Ma trận bổ sung mới — Email/password

Ngày 02/11/2026 (+07). [Hướng dẫn và báo cáo email/password](EMAIL_AUTH_DEMO.md). Email dạng Gmail nhưng mật khẩu riêng của Internova, không Google OAuth/Client ID.

| Chức năng | Trạng thái | Phạm vi |
| --- | --- | --- |
| Student register/login bằng email | PASS TEST | API+UI+Mongo+bcrypt+JWT thật; không Google. |
| Đổi mật khẩu, revoke JWT cũ | PASS TEST | Cần current password; nhận token mới, không plaintext. |
| Link ví từ password account | PASS TEST | Password reauthentication + owner signature + challenge browser-bound; không chiếm ví. |
| Email verification/reset mail | NOT IMPLEMENTED | UI không giả verified/reset thành công. |
| Nghiệp vụ không cần ví | PARTIAL | Profile/settings không cần ví; CV/JD/thực tập/Web3 vẫn cần liên kết ví theo kiến trúc cũ. |
| Wallet/Google regression | PASS nội bộ | Giữ API cũ; Google live vẫn BLOCKED riêng, không chặn email demo. |
| Production schema/index rollout | NOT EXECUTED | Chỉ TEST riêng; không thay data/index gốc/demo. |

Counts 7 chức năng KLCN129 trước đây không tự tăng thành 100% do bổ sung authentication.

---

# Ma trận bổ sung — Google authentication

Ngày 01/11/2026 (+07). [Kết quả và file thay đổi](GOOGLE_AUTH_RESULT.md), [cấu hình Google Cloud/localhost](GOOGLE_AUTH_SETUP.md). Google thật **BLOCKED thiếu Client ID**; không gọi TEST verifier hoặc User/JWT fixture là Google login thật.

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| Wallet/JWT/RBAC cũ | PASS regression | Bốn role API/browser, JWT legacy vẫn dùng được. |
| Google verification và registration/login | PASS nội bộ / BLOCKED live | Official verifier + claims tests; chưa có Client ID/token Google thật. |
| Google-only account/profile | PASS TEST | Không có ví/mật khẩu giả; nghiệp vụ bị chặn trước scope query đến khi link ví. |
| Link Google/wallet, unlink Google | PASS TEST / BLOCKED live | Hai proof, nonce/User binding, unique indexes, không email merge; chưa popup thật. |
| Login/Register UI | PARTIAL | Google/wallet chooser, trạng thái rõ; email/password/reset chưa triển khai. |
| Schema/index rollout production | NOT EXECUTED | Chỉ TEST mới; cần phê duyệt migration riêng cho dữ liệu cũ. |

Không thay counts nghiệm thu 7 chức năng KLCN129 bằng số testcase auth. Các bảng dưới là lịch sử các PHASE.

---

# Cập nhật cuối — PHASE 7, 01/11/2026

Đã đối chiếu nguyên văn KLCN129 và chuẩn bị demo riêng. **7 nhóm: PASS2, PARTIAL4, FAIL0, BLOCKED1** (PASSlocalK04/K06; PARTIALK01/K03/K05/K07; BLOCKEDK02). SBTmint/verifythật nhưng K07cònđiểmoff-chain/hash vàexplicitissuance, khôngtựcoilàđạtnguyênvăn. Backend122/122/build/lint/contracts9+3/QRunit2/Python16rerun; E2E70/39/7làevidenceP6saupatchcùngbusinesssource/locks, khônggọilàrerunP7. Demohelper3/3, loginUI4/4. Server/clientproductionaudit0; contractsdev/toolchaincònOPEN, modelcold/hardware/IPFSlivechưađủ.

**Bắt đầu tự kiểm: [DEMO_SCRIPT.md](DEMO_SCRIPT.md), URL5177/API57405, accountsTEST/vaultDPAPIriêng.** [Kết luận](FINAL_PROJECT_STATUS.md), [matrixchi tiết](FINAL_KLCN129_ACCEPTANCE.md), [cài đặt](INSTALLATION_GUIDE.md), [kiến trúc](TECHNICAL_DOCUMENTATION.md), [ảnhthật](SCREENSHOT_CHECKLIST.md). Không sửa source nghiệp vụ/dependency, khôngseed/rootdemo/reset/commit/push/merge. Các phần dưới là lịch sử.

---

# Cập nhật sau phê duyệt — Ba dependency đã vá và retest

Ngày 31/10/2026 (+07). Đã vá server body-parser1.20.9, qs6.16.1 và server/client follow-redirects1.16.2; chỉ bốn lock entries, không đổi package khác hoặc manifest. **Audit production server/client:0 advisory.** Backend122/122, corebrowser70/70, legacy39/39, QRbrowser7/7, Solidity9+3, QRunit2/2, Pythonunit16/16; lint0error/0warning/buildPASS.

Server dev còn2MODERATE (nodemon/minimatch); toolchain contracts chưa đổi, snapshot audit PHASE6 còn18HIGH+16MODERATE+14LOW affected packages. IPFS live/modelcoldtests vẫnBLOCKED, hardwareNOTTESTED. Không toàn bộ security/release PASS, chưa PHASE7. Ba DB gốc/demo hash/index nguyên vẹn, không commit/push. [Kết quả bản vá, TX thật, file và evidence](DEPENDENCY_PATCH_RESULT.md).

## Lịch sử trước bản vá — giữ để đối chiếu

# Cập nhật hiện tại — PHASE6 Integration & QA

Ngày31/10/2026 (+07). Đã kiểm/test các luồng local và sửa3tenantindexes Assignment trongTEST. **Chưa fullacceptance: dependencyaudit cònHIGH, PinataliveBLOCKED, modelcoldtestsBLOCKEDRAM/hardwareNOTTESTED.** KhôngPHASE7. [Báo cáo tổng](FINAL_INTEGRATION_TEST_REPORT.md), [security](SECURITY_RETEST.md), [hiệu năng](PERFORMANCE_REPORT.md), [issues](REMAINING_ISSUES.md).

Backend119/119; corebrowser70/70; legacy39/39; QRbrowser7/7; Solidity9+3; QRunit2/2/40randompayloads; Pythonunit16/16; lint0error/0warning/buildPASS. SBERTAPI/UI thật; khônggọi6modelcoldtests làPASS. npm auditproductionserver2HIGH+1MODERATE/client1HIGH; fullcontracts18HIGH+16MODERATE+14LOW(packageaffectedchains). Chưanângdependency/chờduyệt3patch; toolchainmajorcầnplanriêng. BaDBgốc/demoSHA/indexkhôngđổi, Gitbranch/HEADgiữ, nocommit/push.

Cácmụcphíasau làlịchsử, khôngphảitrạngtháimớinhất.

---

# Cập nhật hiện tại — PHASE 5 Web3 local

Ngày31/10/2026. Đã triển khai/test Web3 local theo phê duyệt; chưa đánh dấu toàn bộ PHASE5 nghiệm thu khi Pinata live và camera/GPS phần cứng còn thiếu. Không chuyển PHASE6. [Báo cáo đầy đủ, TX thật, file và giới hạn](WEB3_INTEGRATION_RESULT.md).

| Hạng mục đề cương / PHASE5 | Trạng thái hiện tại | Giới hạn nghiệm thu |
| --- | --- | --- |
| K02 lưu bằng chứng/hash blockchain |PASS local trong TEST |Không production/testnet; issuer attests học thuật |
| IPFS báo cáo |PARTIAL/BLOCKED live |Encryption/adapter/error tests PASS; chưa Pinata upload/CID/readback thật |
| K05 QR+GPS+giờ làm |PASS kỹ thuật trong TEST |Chữ ký/nonce/expiry/scope/GPS/API/UI; camera canvas/GPS CDP, chưa hardware |
| K07 chứng nhận NFT/SBT |PASS local |Token#4 mint thật, ERC721/5192 locked, receipt/event/state verify; chưa rollout/revocation |
| Pending/retry/reconciliation |PASS các case kiểm |Local single-attestor, chưa queue phân tán production |
| Wallet login/network |GIỮ + regression PASS |Nonce signatures TEST thật; TX tính năng mới do local attestor, chưa extension/ví phần cứng |
| K01/K03 AI |GIỮ PHASE4 |SBERT thật; quality labels/metrics và trainedriskclassifier vẫn thiếu |
| Bảo toàn dữ liệu/auto-write |PASS trong case kiểm |Gốc/demo hash+index không đổi; GET/mount không mutation; chỉ TEST |

Không đồng nhất “local PASS” với đạt toàn bộ yêu cầu production/đề cương. Chờ nghiệm thu PHASE5 trước PHASE6. Các ma trận bên dưới là lịch sử.

---

# Ma trận hiện tại — SBERT đã được kiểm thực tế

Ngày31/10/2026. PHASE1–3 đã nghiệmthu; PHASE4 inference/API/UI local đã PASS kỹthuật. **Chưa fullnghiệmthu hai chức năng AI theo đềcương khi chưa cóqualitylabels/trainedriskclassifier.**

| Hạng mục | Trạng thái mới | Bằng chứng/giới hạn |
| --- | --- | --- |
| ONNXint8/modelhash/runtime | DONE | Modelđãduyệt/pinrevision, nativeCPU thựcchạy |
| SBERTCV/JDranking/TopK | DONE kỹthuật trongTEST | StudentownCV/companyconsentedapplication, vector/cosine thật, validation/scope/UI |
| Longtext/batch/cache/error | DONE trongcaseskiểm |50candidate,8chunk/1008tokens, fulltokencount/truncation, boundedcache/timeout/noautowrite |
| ReportNLPsemanticrelevance | DONE kỹthuật | SBERT thật/company–mentor–admin scope; không tựchấmđiểm |
| Rules deadline/hours/report | DONE trongpolicy | Source=rule/observed riêng, không classifier hoặc disciplinarydecision |
| RankingqualityP@K/R@K/MAP/NDCG | BLOCKEDnhãn |0nhãnđộc lập, metricsnull; formulas/evaluator đãtest không thaybenchmark |
| Trainedriskclassifier/calibration | NOTTRAINED/NOTACCEPTED | Riskprediction/confidence null; cầnnhãn/huấn luyện/heldout/hiệu chuẩn |
| Regression/UI/data safety | PASS |22Python/92Backend/51Corebrowser/39P2browser,build/lint, root/demo unchanged |

K01 vẫnPARTIAL toànđềcương vìchưa qualitybenchmark, dù BERTmatching/ranking đã thựcchạy. K03 PARTIALsemantic/rules, trainedriskmodel chưa đápứng. K02/K05/K07Web3/IPFS/GPS/NFT không thay trạngthái; khôngphase5. [Báo cáo](AI_RUNTIME_INFERENCE_RESULT.md).

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# Cập nhật nghiệm thu — runtime/model đã sẵn trên disk

Người dùng đã duyệt ONNXint8 cô lập và xác nhận chưa dữliệu nhãn. Runtime nativeimport và download/hash model **PASS**; không còn BLOCKEDvìphêduyệttải/cài. **BERTinference vẫn BLOCKEDvìRAM:** APIthật503 khi chỉ~737MiBavailable<1GiBloadguard. Pipeline cócode+artifacts khôngđồngnghĩa modelđãchạy.

K01BERTmatching/ranking và K03trainedriskclassifier vẫnPARTIAL/NOTTRAINED, chưa fullPHASE4DONE. QualityP@K/R@K/MAP/NDCG/BERTvsTF-IDF vẫnnullvìchưanhãnđộc lập. Chỉ thay trạngthái runtime/modeldownload; các bằngchứngregressionPHASE1–3 giữ nguyên. [Chi tiết](AI_RUNTIME_INSTALL_RESULT.md). Dừng trướcPHASE5.

---

## Lịch sử trước phê duyệt/cài ONNX — giữ để đối chiếu

# Ma trận hiện tại — PHASE 4 AI/NLP

Ngày31/10/2026. PHASE3 đã được người dùng nghiệm thu. **PHASE4 PARTIAL / chưa đủ nghiệm thu hai chức năng BERT. Dừng trướcPHASE5.**

| Hạng mục PHASE4 | Trạng thái | Bằng chứng / khoảng thiếu |
| --- | --- | --- |
| Chuẩn hóaCV/JD, parser tái sử dụng | DONE trong flow đã kiểm | Lấy CVDB/parserPHASE3, Unicode/skills; own/consented scope |
| TF-IDFbaseline/ranking/TopK | DONE kỹ thuật | RealAPI/UI/scikit-learn, zero/unrelated/negative; chưa chất lượng benchmark |
| ChọnmodeltiếngViệt/đa ngữ và tài nguyên | DONEpreflight | MultilingualMiniLML12, commit/hash pin, CPU/RAM/disk kiểm; RAM còn hạn chế |
| ONNX SBERTpipeline/cache/batch | IMPLEMENTED / NOT INFERENCE TESTED | Source có localencoder/pooling/hash/CPU/RAM/timebounds; runtime/model chưa được duyệt tải/cài |
| BERTembedding/cosine/TopKthật | BLOCKED | Chưa weights/runtime, không modelsmoke, không gắn TF-IDF làBERT |
| P@K/R@K/MAP/NDCG evaluator | DONE công thức/validation | Unit tính tay và leakageguards; không thay dataquality/modelbenchmark |
| Dataset nhãn/benchmarkBERTvsTF-IDF | BLOCKED | Nhãnđộclập0; tất cảqualitymetrics null, chưa humanjudgments/consent |
| Báo cáo semanticrelevance | DONEbaseline / BERTBLOCKED | TF-IDFthật, rubric scope; SBERT chưa chạy; không tựchấmđiểm |
| Riskrules từtask/hours/report | DONE trong rulepolicy | Deadline/openhours/approvedminutes/versioncounts, source=rule, chỉ cần người hướng dẫn xem xét |
| NLP/BERT riskclassifier | NOTTRAINED / NOTACCEPTED | Không dataset/labeledtest/calibration; risk_prediction/confidence null, không kỷluật |
| AIservice/API/UI/permissions | DONE cho baseline/unavailable | Loopback8003, JWTscope, timeout15s, 4MiB, concurrency2, explicitactions, nooutboundPII/noautowrite |
| RegressionPHASE1–3 | PASS |89Backend,16Python,46browserCore+AI,39browserPHASE2,build/lintPASS |

## Đề cương KLCN129 sau đợt này

K01 CV/JD BERTmatching/ranking vẫn **PARTIAL**: CoreCV/JD/ứngtuyển vàTF-IDFintegration có thật; BERTinference/qualitymetrics chưa đạt. K03 BERTreport/risk vẫn **PARTIAL nền tảng / classifier NOTIMPLEMENTED**: ruleobservations vàsemanticbaseline không được coi là trainedriskclassifier. K02/K05/K07 IPFS/QR/GPS/chain/NFT vẫn trạng tháiPHASE3, không tự nâng DONE; K04Corebusiness vàK06dashboard không bị phá trong regression.

Không báo “PHASE4 hoàn tất” chỉ vì nhiều testcasePASS. Cần phê duyệt runtime/modelcôlập và đủRAM để thựcchạy, sau đó có bộnhãnđộc lập đượcphép dùng đểbenchmark; riskclassifier cần chuyên gia gánnhãn/huấn luyện/heldout/calibration riêng. [AIreport](AI_IMPLEMENTATION.md), [testevidence](TEST_RESULTS.md).

---

## Lịch sử PHASE 0–3 — không phải trạng thái PHASE 4

# Ma trận nghiệm thu hiện tại — PHASE 3

Ngày31/10/2026. **PHASE3 PASS kỹ thuật trong TEST, chờ người dùng nghiệm thu; DỪNG trước PHASE4.** DONE dưới đây chỉ trong chính sách/phạm vi mô tả, có UI/API/DB/validation/permission/test thực tế. Ma trận PHASE2 bên dưới là lịch sử; các khoảng thiếu cũ đã được xử lý phải đọc theo bảng mới.

| Nhóm CORE BUSINESS | Trạng thái | Bằng chứng / phạm vi còn lại |
| --- | --- | --- |
| Đăng ký/login/logout wallet, RBAC/ownership | DONE trong auth wallet hiện tại | Nonce/chữ ký/JWT thật; self elevate/foreign/disabled từ chối; regression auth và browser session race |
| Hồ sơ/account admin | DONE có policy bảo vệ | UI cấp tài khoản, role/status/history, profile; admin/self role/status protected, không xóa/cascade. Đổi mật khẩu N/A vì không password account; đề cương email/password còn thiếu |
| CV/PDF/DOCX | DONE với text-based file policy | CRUD mộtCV/student, private owner download, actual extraction; bounded/negative file tests; scan/encrypted/active rejected, không OCR/AV/CDR |
| JD/opportunities/applications | DONE trong luồng đã kiểm | Owner create/edit/open/close, server search/filter/page, duplicate chống race, review/withdraw/snapshot/status notification. Không booking/quota reservation cho slots |
| Kỳ/phân công | DONE off-chain | Batch và Assignment canonical có mentor/dates/lifecycle, school approve, private scope; update details trước active. Không rewrite lịch sử Topic/chain |
| Task/log/KPI | DONE off-chain | UI/API/history/CAS/deadline/progress, weeklylog review, weightedKPI từng Assignment; completion gates |
| Chấm công/tổng giờ | DONE theo policy1phiên/ngàyUTC | Check-in/out, missingcheckout/abnormal/duplicate, audit adjust/approval, day/week/month/batch. Nhiều ca/overnight và QR/GPS/chain chưa triển khai |
| Báo cáo/đánh giá | DONE cho text DB/versioned workflow | Company+mentor review, school approve, average report score, current version/CAS; chưa IPFS/hash on-chain/file report attachments |
| Dashboard4vai trò | DONE cho nghiệp vụ Core | Real scoped data, reportmean khác weightedKPI, empty0/null, responsive Light/Dark; không AI risk alerts hoặc xu hướng giả |
| No auto-write / regression | DONE trong test đã chạy | Backend82/82, Core browser36/36, Phase2 browser39/39; fingerprints tài liệu khi navigation, gốc/demo unchanged |

## Đối chiếu bảy chức năng KLCN129 sau PHASE3

| ID | Yêu cầu đề cương | Trạng thái hiện tại | Khoảng thiếu đúng phase |
| --- | --- | --- | --- |
| K01 | CV/JD BERT matching/ranking | PARTIAL | Đã CV parser/save/ứng tuyển/JD; hiện matching TF-IDF. SBERT/ranking/dataset/metrics thuộcPHASE4 |
| K02 | Báo cáo IPFS/hash on-chain | PARTIAL, tích hợp Web3 BLOCKED | Đã nghiệp vụ report/review/version DB; chưa upload/readback/hash/receipt IPFS/chain |
| K03 | BERT tiến độ/rủi ro | NOT IMPLEMENTED | Chỉ task/log/KPI thật cung cấp dữ liệu đầu vào; chưa classifier/risk/dataset/metrics/AI alerts |
| K04 | Task/log/check-in/out/hours | DONE phần core theo policy đã nêu | Không đồng nghĩa QR/GPS/overnight/multi-shift đã DONE |
| K05 | QR/GPS/time/blockchain | PARTIAL | Giữ QR security PHASE1; giờ làm manual tách interface; scanner/camera/GPS/chain proof chưa có |
| K06 | Dashboard4vai trò | DONE cho nghiệp vụ hiện có; PARTIAL toàn yêu cầu thông minh | Real scopes/account/batch/work/reports/hours, notifications ứng tuyển; chưa AI risk/time-series analytics nâng cao |
| K07 | Điểm/contract/NFT-SBT | PARTIAL; phát hành/verifier BLOCKED | Đã weighted KPI và reportapproval off-chain; chưa canonical contract adapter/mint/token verifier thật |

Không tạo tỷ lệ hoàn thành luận văn từ số testcase. Không coi đề cương email/password đã đáp ứng bởi wallet-only. Không nâng nhóm AI/blockchain thành DONE vì UI đã hiển thị.

## Điều kiện triển khai tiếp

Người dùng nghiệm thu PHASE3. PHASE4 cần policy dữ liệu/consent, dataset TEST, tiêu chí metric và model được duyệt; dùng extractedText/CV snapshot/Assignment scope hiện có. Production rollout schema/index/backup/rollback phải duyệt riêng; không dùng migration để xóa duplicate hoặc dữ liệu lịch sử. Xem TEST_RESULTS và ARCHITECTURE_UPDATED cho giới hạn atomicity và API.

---

## Lịch sử trước PHASE 3 — giữ để đối chiếu

# Ma trận nghiệm thu — sau PHASE 2

Ngày31/10/2026. PHASE1 và PHASE2 hoàn thành phạm vi được duyệt. **DỪNG trước PHASE3.** DONE cho UI/control không thay cho DONE toàn bộ chức năng sản phẩm. [Kết quả thực tế](TEST_RESULTS.md), [file/tác động](IMPLEMENTATION_PROGRESS.md), [design system](UI_DESIGN_SYSTEM.md).

## Bảy chức năng theo đề cương

| ID | Chức năng | Trạng thái sản phẩm | Đã có sau PHASE2 | Còn thiếu |
| --- | --- | --- | --- | --- |
| K01 | CV/JD BERT matching/ranking | PARTIAL | JD form/search/cards, CV đối chiếu tạm, live TF-IDF có provenance | CV save/parser, Application, SBERT, ranking/dataset/metrics |
| K02 | Báo cáo IPFS/hash on-chain | BLOCKED | Luồng báo cáo/hiển thị lỗi giữ nguyên, không CID/receipt giả | Upload/readback/hash/receipt thật và file policy |
| K03 | BERT tiến độ/rủi ro | NOT IMPLEMENTED | Mục cảnh báo ghi chưa triển khai; không gắn nhãn BERT cho TF-IDF | Model/classifier/rules, data/metrics, notifications |
| K04 | Task/log/check-in/out/hours | PARTIAL | UI responsive, task/log/check-in giữ API và persistence TEST, permission regressions | Checkout/hours/approval/edit history/canonical assignment |
| K05 | QR/GPS/time/blockchain | PARTIAL | Session có hạn/scope/chống replay, form nhập thực, không QR/GPS/chain giả | Encoder/scanner/camera/GPS/policy/attendance proof |
| K06 | Dashboard bốn vai trò | PARTIAL | UI scope hiện có DONE: Light/Dark, shell/menu, chart/KPI/table/search/filter/pagination, responsive/error/keyboard | Nghiệp vụ school/admin/teacher/student management đầy đủ, notifications và cảnh báo |
| K07 | Điểm/contract/NFT-SBT | BLOCKED | KPI/đánh giá và Web3 UI, receipt guards và error không mất; unknown404/known503, không VERIFIED giả | Canonical contract/token/mint/verifier và local EVM/live integration |

Không nhóm nào đủ bằng chứng DONE toàn bộ. Kết quả tests không chuyển thành tỷ lệ hoàn thành luận văn hoặc số tính năng đã làm.

## Nghiệm thu PHASE 2 trong phạm vi UI hiện có

| Kiểm soát | Trạng thái | Evidence |
| --- | --- | --- |
| Semantic Light/Dark, local fonts | DONE | Theme persistence bốn vai trò;22 cặp contrast>=4,63:1; không Google Fonts |
| Sidebar/Header/AppShell theo vai trò | DONE | Collapse, drawer, account/wallet, menu chưa triển khai, keyboard/focus |
| Dashboard từ API, không KPI/chart giả | DONE | API counts match, số0/null, chart scoped topics có text alternative |
| Trang/form/modal hiện có | DONE trong luồng đã kiểm | JD/task/log/QR persistence; topic keyboard/KPI labels; certificate errors |
| Table/search/filter/pagination | DONE phía client | Dữ liệu API đã tải; không tuyên bố server/global pagination |
| Empty/loading/error/retry | DONE trong case kiểm | Empty/auth absent, delayed real request, failed network rồi retry |
| Responsive320–1440 và themes | DONE trong viewport đã kiểm |100 lượt role×page×width +50 lượt page×width×theme; không page overflow |
| Không auto-write hoặc mất quyền PHASE1 | DONE trong regression |43Backend,39browser+4polish; method tracking và business counts |
| Splitting/build/lint | DONE | Entry290,53kB, ethers379,90kB deferred;0warning/0error lint; build PASS |
| WCAG toàn diện/UAT/Lighthouse | NOT TESTED | Token contrast/keyboard/labels không thay kiểm định đầy đủ |

## Chưa có Backend hoàn chỉnh / tích hợp bị chặn

| Mục giao diện | Trạng thái | Hành vi hiện tại |
| --- | --- | --- |
| Ứng tuyển/ứng viên | NOT IMPLEMENTED | Menu thông báo rõ; Apply disabled, không gửi hồ sơ giả |
| CV save/upload/parser | NOT IMPLEMENTED | Form đối chiếu tạm, không báo đã lưu |
| Accounts/permission lifecycle/company/student/batch | NOT IMPLEMENTED đầy đủ | Admin/mentor có trang trạng thái; không giả tạo người dùng hoặc nâng quyền |
| Notification center/risk alerts/audit | NOT IMPLEMENTED | Không unread count mẫu hoặc mark-read tự động |
| Hours/check-out/GPS/camera | NOT IMPLEMENTED | Chỉ session check-in nền tảng |
| Pinata/RPC/NFT/SBT/BERT thật | BLOCKED | Không kết quả giả, không tự cài/deploy/tx |

Kiểm soát PHASE1 vẫn giữ: guard TEST, nonce/demo/CORS/rate, tenant/IDOR, GET-only, truthful AI/chain/cert, session QR. Backend regression43/43 chạy lại nguyên nguồn PHASE1. Không thay API, auth, schema, index hoặc package/lock/.env trong PHASE2.

Git branch_1/HEADd11a1852c5f03963bbe260425a246b0e65fe1091; không staged/commit/push/merge. Dữ liệu gốc/demo/hash/index không đổi; review chỉ5175→57403→TEST riêng, chưa rollout vào gốc/demo. PHASE3 chỉ bắt đầu sau phê duyệt tiếp theo.


## V3 — cập nhật thực tế 07/11/2026

BERT local ready; task theo tiêu chí/phiên bản, báo cáo tuần và rubric/chấm riêng tư đã kiểm thực tế trên TEST. Backend integration23/23, unit42/42, security32/32, workflow17/17, client10/10, Python3/3, Solidity12/12; browser8/8 +5/5 +7/7; AI role API6/6; QA Web3 ký/QR/hash/mint/verify5/5. Không cộng thành số test duy nhất vì có lần chạy lặp. Main31collection/index/hash không đổi khi reload/health. IPFS/Maps/nhãn độc lập BLOCKED; deadline/roster/tuần on-chain còn PARTIAL. Không tuyên bố hoàn thành V3. Xem [báo cáo](INTERNOVA_PRODUCTION_READINESS/FINAL_READINESS_REPORT.md), [test](INTERNOVA_PRODUCTION_READINESS/E2E_TEST_RESULTS.md), [hướng dẫn](RUN_V3_FULL_WORKFLOW.md).

E2E bổ sung báo cáo liên kết hai task và giảng viên đề xuất/nhà trường duyệt rubric:3/3PASS; xem `docs/evidence/v3-20261107/weekly-rubric.json`.


## AI auto grading — 07/11/2026

Đã thay giới hạn6mụcnull bằngBERTtruyxuất+report-rules-v1.1. Phúc77.5/100,self80,officialnull. Backend28/28,browser8/8+4/4,frontendunit10/10,lint/buildPASS. Chấm sơ bộ theo luậtcôngkhai, không phải mô hình đã fine-tune/hiệu chuẩn bằng điểm giảng viên; hint tùy chỉnh ngoài luậtcầnreview. [Báo cáo](INTERNOVA_PRODUCTION_READINESS/AI_AUTO_GRADING/FINAL_AI_GRADING_REPORT.md). User yêu cầu tiếp chia sẻ source vàdatabase thật quaGit; snapshotsAESmãhóa đã restoreTEST/đốichiếuhash/indexes,khóariêngkhôngGit.

# Global UI content cleanup — 02/11/2026

1179 vị trí frontend AST trước sửa:143 được xử lý (REMOVE7/SHORTEN30/REWRITE72/RELOCATE24/CONDITIONAL10),1036KEEP.48 file sau sửa,422 Backend message candidates chỉ review, không sửa Backend. Login gọn/email-first, Google conditional, ví/role/demo cũ chỉ DEV opt-in; không đổi auth protocol/permissions/data/AI/chain.

Production menu4role6/6, email6/6, Google-wallet7/7, client unit10/10 PASS. Backend auth40PASS/0FAIL/1SKIP on-chain, không tuyên bố41PASS. Lint/build PASS. DB gốc/demo giữ hash/index; không commit/push/merge. [Báo cáo đầy đủ](UI_CONTENT_AUDIT.md), [bằng chứng](evidence/ui-content-20261102/INDEX.md). Các mục phía dưới là lịch sử, không tổng kiểm thử riêng của đợt text cleanup này.

---

# Kết quả full-project audit — 02/11/2026

Source/UI/functional audit mới: [FULL_PROJECT_AUDIT.md](FULL_PROJECT_AUDIT.md), [cleanup UI](PRODUCTION_UI_CLEANUP.md), [dead code](DEAD_CODE_REVIEW.md), [production checklist](PRODUCTION_READINESS_CHECKLIST.md).23 findings,7fixed,16open/blocked/review. Không commit/push/merge, không xóa file/migration/dependency upgrade.

Baseline Backend164/164; sau sửa165/165. Dev unified9/9 + email6/6 + Google retest7/7; client unit7/7; AI pure unit16/16; Solidity local9/9; production shell retest5/5. Google selector cũ từng fail1, production browser/AI native có lỗi tài nguyên được giữ log và phân biệt ở checklist; không ghi toàn bộ production PASS. SBERT API/model thật qua E2E không thay quality metrics. Risk NOT_TRAINED, Google/Pinata/Atlas live BLOCKED.

Gốc/demo hashes/counts/indexes không đổi; chỉ TEST allowlist và chain local đã ghi. Framework bảo mật/production deployment, labels AI, fault-tolerant report submission và dependency toolchain cần làm tiếp. Các phần dưới là lịch sử phase, không kết luận nghiệm thu mới.

---

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

# Cập nhật mới — Đăng ký/đăng nhập email và mật khẩu

Ngày 02/11/2026 (+07). [Hướng dẫn và báo cáo email/password](EMAIL_AUTH_DEMO.md). Email dạng Gmail nhưng mật khẩu riêng của Internova, không Google OAuth/Client ID.

Đã triển khai register/login student, bcrypt12, unique loginEmail tách email hồ sơ, đổi mật khẩu/JWT revocation và liên kết ví bằng mật khẩu + chữ ký. Giữ wallet/Google cũ, không tự gộp email hoặc tự cấp quyền cao. Email chưa xác minh; chưa reset password qua mail. Chưa chuyển nghiệp vụ wallet sang User ID.

Backend147/147 PASS; email browser5/5 PASS; Google/ví browser7/7 PASS; lint0error/0warning/buildPASS. Ba DB gốc/demo full hashes+indexes không đổi. Runtime localhost:5182 →57407 trên TEST riêng, không seed tài khoản mẫu. Không dependency mới, migration dữ liệu cũ, deploy hoặc commit/push.

---

# Cập nhật mới — Google authentication

Ngày 01/11/2026 (+07). [Kết quả và file thay đổi](GOOGLE_AUTH_RESULT.md), [cấu hình Google Cloud/localhost](GOOGLE_AUTH_SETUP.md). Google thật **BLOCKED thiếu Client ID**; không gọi TEST verifier hoặc User/JWT fixture là Google login thật.

Đã triển khai GIS ID-token verification chính thức, challenge browser-bound/chống replay, Google student registration/login, Google/wallet linking và unlink Google có reauthentication. Giữ wallet JWT/RBAC cũ. Google-only dùng hồ sơ/cài đặt; nghiệp vụ yêu cầu liên kết ví thật. Không tự gộp email, không ví/mật khẩu giả.

Backend 139/139 PASS; browser7/7 PASS; lint0error/0warning/buildPASS. Ba database gốc/demo hashes+indexes không đổi trong acceptance. Production server audit0. Nghiệm thu Google live và migration môi trường cũ chưa thực hiện. Runtime auth TEST localhost:5178 → localhost:57406, không thay demo5177. Dừng chờ nghiệm thu.

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

Contract evidence/SBT local chain31337 đã deploy/mint/verify thật, UI có Web3 theo kỳ và QR encoder/scanner được duyệt. Backend111/111; Solidity9/9+legacy3/3; browsercore64/64, legacy39/39, QR7/7; QRunit2/2 với40 random payloads; Pythonunit16/16; lint0error/0warning/buildPASS. IPFS adapter mã hóa/testtransport PASS, **Pinata upload/readback thật BLOCKED**. Ba DB gốc/demo hashes+indexes không đổi; chỉ TEST writes. Giữ runtime5175→57404, Mongo27017, NLP8003 và Hardhat18545; không commit/push. Danh sách file chính xác và provenance ở báo cáo + ignored integrity-final.json. Các phần sau là lịch sử.

---

# Tiến độ hiện tại — PHASE4: SBERT đã chạy thật

Ngày31/10/2026. Đã tiếp tục đúng bướcdangdở: sửa tokenizer, nạp ONNXmodel đã duyệt và kiểm inference/API/UI thật. **SBERTlocal kỹthuật PASS; qualitymetrics và riskclassifier vẫn chưa nghiệmthu vì người dùng xác nhận chưa có nhãn độc lập.** Dừng trướcPHASE5.

Python22/22 (6modelthật), Backend92/92, browserPHASE3–451/51, browserPHASE239/39; tất cảfail0/skip0. Build/lintcuốiPASS. Embedding3×384, batch50 vàlongtext cócoverage thực. Tách classifierNOTTRAINED/confidencenull khỏi semanticrelevance vàrules. BaDBgốc/demo giữ nguyên hashes/indexes; TESTonlywrites. Không extra dependency/modeldownload/Windowsservicechanges ởđợtnày.

Runtime5175→57404→exactTEST, Mongo27017, NLP8003ready; giữmộtNLPmodel, đóngcompat/headless. Các servergốc/demo cũ không được bật lại. [Báo cáo đầy đủ, file, số đo và evidence](AI_RUNTIME_INFERENCE_RESULT.md). Các dòng “chưa chạy model/chờRAM” bên dưới là lịch sử, không phải trạng thái hiện tại.

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# Tiến độ mới nhất — sau phê duyệt ONNX int8 cô lập

Người dùng đã phê duyệt runtime/model và xác nhận chưa có dataset nhãn. Đã cài4wheel hash-locked vào ignoredpython-deps; ONNX1.31.1/tokenizers0.23.3 nativeimportPASS. Đã tải đúng2artifactmodel tổng121,59MiB và xác minhSHA256; không globalinstall/venvchange/.env. [Kết quả đầy đủ](AI_RUNTIME_INSTALL_RESULT.md).

SBERT request thật bị guard chặn503 vì chỉ~737MiBavailable<1024MiB; configured=true/ready=false. Chưa embedding/cosineSBERT, chưa modelqualitymetrics/classifier. Không xin lại quyền model; đang chờ người dùng tự đóng bớt app và báo để đoRAM lại. TF-IDF/API/UI vẫn chạy; không tự đóng app hoặc hạguard.

Python16/16PASS saucài, dữ liệu3DBgốc/demo hash/index khôngđổi ởsnapshot07:00:35UTC. Backend89/browser46+39/build/lint là regressionđợttrước, không dùng thay inferenceBERT. [Lockfile tái lập](../ai-service/requirements-nlp-lock.txt). **PHASE4 chưa nghiệmthu toàn bộ; dừng trướcPHASE5.**

---

## Lịch sử trước phê duyệt/cài ONNX — giữ để đối chiếu

# Tiến độ hiện tại — PHASE 4 AI/NLP

Ngày31/10/2026. Người dùng đã nghiệm thu PHASE3 và phê duyệt PHASE4. **PHASE4 mới hoàn tất pipeline/API/UI/baseline và kiểm thử các phần có thể chạy; CHƯA nghiệm thu BERT/risk classifier/metrics.** Không đánh dấu fullPHASE4 DONE; dừng trướcPHASE5. [Báo cáo AI đầy đủ](AI_IMPLEMENTATION.md), [kế hoạch trước sửa](PHASE4_IMPLEMENTATION_PLAN.md).

## Đã triển khai và kiểm thực tế

- Giữ TF-IDF baseline/legacy APIs; ranking mới fit chungquery+candidates, actualcosine/TopK/skilloverlap, empty/unrelated/error states; không floor score giả.
- Pipeline BERT local-only ONNX đã viết: pinmodel/revision/hash, normalizeCV/JD, boundedchunks/meanpooling/L2/cosine, cachehashTTL, limitCPU/RAM/time, noimplicitdownload. **Chưa cài runtime hoặc chạy model thật.**
- Student dùng ownCV; companyranking chỉ Application.cvSnapshot do người dùng đã chủ động ứng tuyển vào JD của mình. BackendJWT/liveRole/AssignmentScope; không arbitraryCV/bodyidentity hoặc externalendpoint.
- Report semanticrelevance và quy tắc đọc task/dueDate/approvedhours/open sessions/reportversion; classifier NOT_TRAINED, risk_prediction/confidence null, không tự chấm/kỷ luật.
- API/service loopback8003 mới, Express timeout15s/concurrency2/no redirects/loopbackonly; lỗi AI không blockhealth. UI bốn vai trò, explicitengine/button, busy/error/unavailable, không autowrite/render.
- Metrics evaluator P@K/R@K/AP→MAP/NDCG đã có, split/label/provenance/consent guards; unit sốtínhtay không được gọi modelbenchmark. Không tự gán nhãn nghiệm thu.

## Kết quả kiểm thử

Backend **89/89PASS** (82regressionPHASE1–3+7AI), Python **16/16PASS** (normalization/ranking/metrics/API/negative/resource/downloadguards, không modelinference), browser **46/46PASS** (36PHASE3+10PHASE4), browserPHASE2 **39/39PASS** nguyênassertions/CoreOFF. BuildPASS/lint0error0warning, syntaxNode75file/Python11file. [Logs và giới hạn](TEST_RESULTS.md).

Browser gọi parser/TF-IDF/API thật trên TEST; nofakeBERT/classifier/metrics. Mount/navigate so sánh requestmethod và SHA256document nghiệp vụ, không autowrite. Test timeout dùng localserver thật cố tình imlặng15s, health vẫn200. Mọi fixtureghi ở TEST đượcguardexactURI, không drop/cleanup.

## Mô hình và đánh giá còn chờ

Mô hình **được chọn, chưa sử dụng**: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 ONNXint8, commit e8f8c211226b894fcb81acc59f3b34ba3efd5f42;2artifactpublic tổng121,59MiB. RuntimeONNX1.31.1/tokenizers0.23.3 chưa cài, không pip/npm install. Người dùng đang được hỏi phê duyệt isolatedruntime/model; phê duyệt pypdfPHASE3 không thay quyền cài AI mới.

Máy RAM7,39GiB, Ryzen5800H/AMDnonCUDA; đầu kiểm khoảng330MiBfree, cuối status khoảng824MiBfree, thấp hơn ngưỡng1024MiB để loadmodel. Không tự đóng app người dùng. Cần phê duyệt và đủ RAM rồi mới modelsmoke/latency/peakRSS.

Chưa có dataset nhãn độc lập được cung cấp; labeledqueries0. **Precision@K/Recall@K/MAP/NDCG và so sánh BERT/TF-IDF quality đều null**, riskclassifier NOTTRAINED. Không dùng test fixture điểm nhập tay/sốCASEPASS làm qualitymetrics. Cần dữ liệu consent/chuyêngia gánnhãn/splitkhóa và adjudication.

## Database, runtime và Git

Không thay schema/index/database ở PHASE4. BaDB gốc/demo giữ nguyên toàn bộ hashes/index từ06:31:47 đến06:47:33UTC31/10: root3docs, demo223docs, foundation66docs; mỗiDB14collections/36indexes. [Trước](../contracts/node_modules/.cache/phase4-20261031/protected-before.json), [sau](../contracts/node_modules/.cache/phase4-20261031/protected-after.json), [integrity](../contracts/node_modules/.cache/phase4-20261031/integrity-final.json).

Giữ TEST **http://127.0.0.1:5175/** → **57404** → `web3_internship_test_phase1_a598af3c_234674e21f8d`, NLP8003 và baselineAI8002. Metadata BackendPID15092; /health/ready200, Mongo connected, demologinfalse. Chỉ thay Backend TEST cũ đã xác minh, không restart5000/5001/8001; giữ DBTESTPHASE3 và fixture cũ. Compatibility5176/57403 và Edgeheadless9225/9226 đã đóng sautests.

Branchbranch_1/HEAD`d11a1852c5f03963bbe260425a246b0e65fe1091` không đổi; không staged/commit/push/merge/reset/clean, không xóa filebaseline/untracked. Không đổi .env/npmmanifest/lock/venv/contract/seed. README chỉ sửa đoạn AI lỗi thời. Danh sách file PHASE4 ở [kế hoạch](PHASE4_IMPLEMENTATION_PLAN.md); toàn bộ Gitdiff còn chứa cácphasecũ. [Gitstatus](../contracts/node_modules/.cache/phase4-20261031/git-final.txt).

**Điểm dừng:** chờ phê duyệt isolatedruntime/model và nguồn nhãn; chưa được tuyên bố hoàn tất hai chức năng BERT theo đề cương. Không chuyểnPHASE5.

---

## Lịch sử PHASE 0–3 — không phải trạng thái PHASE 4

# Tiến độ hiện tại — PHASE 3 CORE BUSINESS

Ngày31/10/2026 (+07). **PHASE3 đã triển khai và kiểm thử trong TEST, chờ người dùng nghiệm thu. DỪNG trước PHASE4.** Các đoạn PHASE0–2 bên dưới là lịch sử, không phải trạng thái hiện tại. Kết quả này không đồng nghĩa đã hoàn thành mọi yêu cầu KLCN129 hoặc được phép rollout vào database gốc/demo.

## Điều kiện trước triển khai

Đã đọc README, toàn bộ docs/audit-reports và đề cương KLCN129 DOCX; inventory/text trích xuất ở ignored staging. Kiểm chứng evidence PHASE2 thực tế: Backend43/43, browser39/39, polish4/4, build/lint PASS; chạy lại build/lint baseline trước sửa. Có bản lưu/hash8411file trước PHASE3, không mặc định PHASE2 PASS. [Kế hoạch nhóm/file/tác động đã lập trước sửa](PHASE3_IMPLEMENTATION_PLAN.md).

## Nhóm đã hoàn thiện và lỗi đã sửa

| Nhóm | UI/API/persistence được kiểm | Kiểm soát chính |
| --- | --- | --- |
| Tài khoản | Hồ sơ cá nhân; Admin cấp ví/đổi quyền/khóa, lịch sử; đăng nhập/đăng xuất nonce+chữ ký/JWT giữ nguyên | Cấm tự nâng quyền; kiểm role/disabled từ DB; admin/self không bị sửa quyền/khóa qua luồng thường; late auth/me không hồi sinh phiên sau accountsChanged |
| CV/JD/ứng tuyển | Lưu/sửa CV; upload/download PDF/DOCX riêng tư; parser thật; JD draft/open/close; opportunities; ứng tuyển/xét duyệt/rút; notification trạng thái và mark-read | Unique JD/student chống đua ứng tuyển; snapshot CV bất biến; search/filter/page server; upload2MiB; owner/scope |
| Kỳ thực tập | Batch, company đề xuất, nhà trường duyệt, bắt đầu/hoàn tất/hủy; mentor và ngày trước hoạt động | Assignment canonical theo batch; chỉ người trong phạm vi truy cập; không đổi singleton Topic/contract cũ |
| Công việc | Task/deadline/priority/status/progress; nhật ký tuần; review và lịch sử; KPI theo từng Assignment | Validation, compare-and-swap version, approved immutable; legacy API không sửa lách core records |
| Giờ làm | Check-in/out, missing checkout, phát hiện >16h/qua UTCday, công ty điều chỉnh/duyệt có audit; tổng ngày/tuần/tháng/kỳ | Một phiên/student/ngàyUTC; unique open/requestKey; chỉ approved minutes; không phút tối thiểu giả; GET không tự đóng/duyệt |
| Báo cáo | Weekly/final version; company và mentor review riêng; nhà trường chốt, lịch sử | Bản hiện hành partial unique; CAS chống approve/supersede đua; duyệt đủ KPI và xử lý giờ trước hoàn tất; không IPFS/NFT giả |
| Dashboard | Bốn vai trò, dữ liệu thật theo scope, trạng thái rỗng; thông báo ứng tuyển | Điểm report mean và weighted KPI tách riêng; menu/GET không auto-write |

Sửa thêm rủi ro runtime: non-TEST startup tắt autoCreate/autoIndex trước khi import model; xác minh unique indexes quan trọng chỉ đọc trước listen và fail-closed khi thiếu. Exact TEST URI guard được dùng cả entrypoint thật. Legacy profile cập nhật audit/version để không bỏ qua optimistic locking; thiếu __v cũ được coi0 cho CAS, không GET-backfill.

## Kết quả nghiệm thu kỹ thuật

- Backend **82/82 PASS**, gồm43regression cũ và39case mới; không skip. Có unit/API integration/authorization/validation/negative/concurrency và entrypoint thật.
- Browser PHASE3 **36/36 PASS**; bốn vai trò, CV PDF/parser thật, luồng ứng tuyển→phân công→task/log/giờ/KPI→báo cáo→hoàn tất; responsive320/768/1440, Light/Dark, session race và GET fingerprint zero-write.
- Browser PHASE2 chạy lại **39/39 PASS** với source cuối/Core OFF, chỉ đổi cổng frontend sang5176; giữ nguyên39assertion. Bộ polish4/4 trước đây là evidence lịch sử PHASE2, không tính thành chạy lại lần này.
- Frontend build PASS; lint0error/0warning; entry292,64kB/gzip88,71kB, core lazy44,41kB/gzip10,83kB; ethers379,90kB lazy. Không cảnh báo chunk>500kB. Build cuối đặt VITE_API_URL=http://127.0.0.1:57404/api và VITE_ENABLE_DEMO=false trong process, không tạo .env.
- Node syntax PASS cho71file; git diff --check PASS. Bundle scan không thấy PEM private/JWT literal/VITE secret binding trong14asset; không thay kiểm định bảo mật toàn diện.

Xem [TEST_RESULTS](TEST_RESULTS.md), [ma trận](FEATURE_ACCEPTANCE_MATRIX.md), [kiến trúc và API](ARCHITECTURE_UPDATED.md). Logs của lần thất bại trung gian vẫn được giữ; không ghi đè thành PASS giả.

## Database và dependency

Chỉ tạo schema/index và fixture trên DB TEST exact-allowlist. Bộ review cuối: `web3_internship_test_phase1_9cb2ac1e_c184db1f8cf5`,21collections/62indexes ở snapshot; dữ liệu synthetic TEST được giữ, không drop/cleanup. Thêm6collection nghiệp vụ; sửa optional fields/indexes trên User/Assignment/JD/Task/WorkLog chỉ có hiệu lực DB TEST khi chạy. **Không migration/backfill/index change trên gốc/demo.**

Ba DB gốc/demo đều giữ nguyên SHA-256 nội dung từng collection và toàn bộ danh sách index từ03:28:04 đến04:58:46UTC31/10: `web3_internship`14collections/36indexes/3docs; demo2340:14/36/223; foundation:14/36/66. [Snapshot trước](../contracts/node_modules/.cache/phase3-20261031/protected-before.json), [sau](../contracts/node_modules/.cache/phase3-20261031/protected-after.json), [integrity](../contracts/node_modules/.cache/phase3-20261031/integrity-final.json).

Người dùng đã phê duyệt **pypdf cô lập**: cài `pypdf==6.21.4 --no-deps` vào ignored `contracts/node_modules/.cache/phase3-20261031/python-deps`; requirements pin trong server/parsers. Không đổi Python global/AI venv, npm dependency/lock hoặc .env. Runtime cần Python và process env CV_PARSER_MODULE_PATH trỏ isolated target; không chứa secret.

## Runtime đang giữ để kiểm tra

- Frontend **http://127.0.0.1:5175/** → Backend TEST **http://127.0.0.1:57404/api**, PID29492, core enabled, demo login disabled, DB connected.
- Health/ready/capabilities và AI TEST8002 health đều200. Không dùng ví/private key thật; tài khoản E2E là ví ngẫu nhiên TEST ký nonce thật, không backdoor login.
- Bộ compatibility5176/57403 và hai Edge headless đã đóng sau test; DB/evidence giữ nguyên. Backend gốc5000/demo5001 và AI8001 không restart; FE5173/5174 vẫn dừng. Không coi source mới đã rollout vào gốc/demo.

## Phạm vi file và Git

Chỉ sửa/thêm client,server,docs so với snapshot PHASE3; danh sách đầy đủ ở cuối [kế hoạch](PHASE3_IMPLEMENTATION_PLAN.md). Giữ mọi file baseline/untracked, cả ZIP/DOCX/audit. File AI/main.py xuất hiện modified trong git status từ PHASE1, hash không đổi trong PHASE3; contracts/source, database/seed, package manifests/locks và .env không đổi.

Branch `branch_1`, HEAD`d11a1852c5f03963bbe260425a246b0e65fe1091` không đổi; không staged/commit/push/merge/reset/clean. Git diff hiện chứa cả PHASE1–2, không gán toàn bộ cho PHASE3. [Git status](../contracts/node_modules/.cache/phase3-20261031/git-final.txt).

## Tồn tại và điều kiện trước PHASE4

- Auth wallet-only; không có tài khoản password nên đổi mật khẩu N/A. Câu chữ email/password trong đề cương chưa được đáp ứng; cần quyết định riêng nếu bổ sung auth password. Không đổi cơ chế auth ngoài phạm vi.
- Chuẩn giờ một phiên/ngày UTC; chưa multi-shift/overnight. Chưa QR/GPS/chain proof. Notification mới cho ứng tuyển, chưa email/push/AI alerts. Slots JD là thông tin tuyển, chưa cơ chế giữ chỗ quota nhiều tài nguyên.
- Mongo standalone không transaction nhiều document: mutation core một resource atomic+CAS; legacy User–Student/Company sync và các điều kiện liên tài nguyên không được tuyên bố serializable. Báo cáo insert lỗi sau supersede giữ lịch sử và cho retry, không xóa/rollback ngầm.
- Đổi mentor/ngày sau active bị chặn; admin-target/self role/status protected. Không CRUD xóa tài khoản/cascade. Đây là policy bảo toàn lịch sử.
- Parser giới hạn/kiểm cấu trúc, không antivirus/CDR/OS sandbox; PDF scan không text/encrypted/active bị từ chối, không OCR. Chưa tải lớn/penetration test/UAT/thiết bị ví thật/đánh giá WCAG đầy đủ.
- Production rollout còn BLOCKED cho đến khi duyệt backup, duplicate scan chỉ đọc, dry-run schema/index trên bản sao và migration/rollback riêng. Không tự restart Backend gốc/demo với model mới.
- PHASE4 có thể dùng CV.extractedText/skills/university/gpa, Application snapshot và Assignment/Task/WorkLog scoped qua service có quyền. Cần người dùng nghiệm thu PHASE3 và phê duyệt dataset/consent/model/metrics trước triển khai AI. Không gắn nhãn BERT cho TF-IDF hiện tại.

---

## Lịch sử trước PHASE 3 — giữ để đối chiếu

# Tiến độ triển khai — PHASE 1–2

**Trạng thái hiện tại: PHASE2 hoàn thành phạm vi Frontend/test; dừng chờ review trước PHASE3.** Xem phần PHASE2 ở cuối tài liệu.

## Hồ sơ PHASE1 — lịch sử tại thời điểm đóng phase


Cập nhật ngày31/10/2026 (Asia/Bangkok). **PHASE1 đã hoàn tất phạm vi code và kiểm thử được phê duyệt; dừng chờ người dùng kiểm tra. PHASE2 chưa bắt đầu.**

## 1. Phạm vi và kết quả

Người dùng đã phê duyệt PHASE1 theo [IMPLEMENTATION_MASTER_PLAN.md](IMPLEMENTATION_MASTER_PLAN.md). Thứ tự thực hiện: harness → auth/permissions → loại auto-write/kết quả giả → QR nền tảng → regression và tài liệu. Không viết lại dự án, thay framework hoặc thêm chức năng PHASE2–7.

- GETjds/tasks/history/worklogs không còn seed; mount không POST sync; dữ liệu đọc theo JWT/tenant.
- Task/WorkLog/recordtx và dữ liệu normalized có kiểm quyền; valid owner/student/mentor/admin paths có test.
- Demo mặc định tắt; chỉ bật với môi trường demo local riêng. Nonce đang hợp lệ không bị request nonce khác phá; chữ ký sai không consume; consume atomic chống replay.
- QR phiên có hạn và scope thật; student phải cung cấp mã được công ty cấp; concurrency chỉ một Attendance. Không QR CSS/QR-VERIFIED. GPS/camera/chain chưa được tuyên bố đã có.
- Unknown certificate404, missing token verifier503; không verified=true từ DB/CID/tx string. Receipt adapter opt-in kiểm chain/address/signer/event; không real transaction.
- UI bỏ số mẫu, điểm80/85/88/90/5/3/7, fake apply toast, fallback ID1; số0 được giữ, unavailable/error/transaction failure nói đúng dữ liệu đã lưu.
- AI không gọi TF-IDF là BERT; fallback có nguồn, không semantic score giả; empty/unrelated report không còn sàn50. Lỗi Pinata/log không echo credential downstream.

## 2. Các nhóm thay đổi và kiểm tra

| Nhóm | Kết quả thực tế | Evidence |
| --- | --- | --- |
| 1.1 — Harness | Guard2/2 và foundation21/21; build0 | group1-foundation.log,group1-build.log |
| 1.2 — Auth/config | 26/26; build0 | group2-auth.log,group2-build.log |
| 1.3 — Scope/GET-only | 31/31 sau sửa lỗi tên DB harness; build0 | group3-permissions-recheck.log,group3-build.log |
| 1.4 — QR session | 32/32; build0 | group4-qr.log,group4-build.log |
| 1.5–1.6 — Receipt/UI/AI | 35/35 rồi38/38; AI5/5; browser sau sửa selector16/16 | group5-proofs.log,full-regression.log,ai-results.json,browser-results-acceptance.json |
| 1.7 — Acceptance | 43/43 Backend; build0,lint0/29warnings,syntax41/41,diff-check0 | acceptance-regression.log,release-build.log,final-lint.log,integrity-final.json |


43 Backend test (gồm21 foundation giữ nguyên assertion hữu ích),5 AI TestClient và16 browser case cuối đều PASS: **64 phép kiểm, không phải64 chức năng độc lập**. Không cộng các lượt chạy lặp vào tổng. Fullflow foundation có IPFS stub; receipt/wallet-failure fixtures được ghi rõ, không tính là liveIPFS/NFT/MetaMask thật.

Hai lỗi công cụ đã được giữ evidence và sửa đúng: tên DB TEST đầu tiên vượt63ký tự, selector browser dùng“Hoàn thành”trong khi nút là“Xong”. Không sửa assertion nghiệp vụ để ép PASS. Một lỗi encoding thông báo do shell pipeline đã được sửa bằng file UTF-8; API/status không bị nới.

## 3. File ứng dụng/test đã sửa hoặc bổ sung

| File | Thay đổi/lý do |
| --- | --- |
| ai-service/main.py | Bỏ sàn điểm50 cho báo cáo trống/không liên quan; nhãn engine/fallback thực, không triển khai BERT giả. |
| client/src/App.jsx | Owner/student/evaluator controls; trạng thái transaction; lỗi chain không bị nuốt thành mint thành công; giữ số0 và bỏ nhãn BERT giả. |
| client/src/api/client.js | Demo UI chỉ opt-in; API/JWT cơ bản giữ nguyên. |
| client/src/api/web3Client.js | Kiểm chain/signer/JWT; bỏ ID/address fallback giả và không bỏ qua lỗi thêm KPI. |
| client/src/components/AttendanceView.jsx | Bỏ QR CSS; thao tác tạo/nhập mã phiên thực có chủ đích; chọn assignee thật; error/role states. |
| client/src/components/AuthModal.jsx | Ẩn preset demo theo cờ opt-in; giữ luồng ký ví. |
| client/src/components/CvJdView.jsx | Không80% mặc định hoặc toast ứng tuyển giả; nguồn AI rõ; không prefill CV/benefit/điểm/salary mẫu. |
| client/src/components/DashboardView.jsx | Số liệu từ API, tôn trọng0/null, bảng theo scope; không số5/3/7/90 thay thế. |
| client/src/components/Web3CertificateView.jsx | Mount GET-only; sync thủ công chỉ admin; clear stale certificate; không badge khi chưa token proof. |
| server/src/app.js | CORS allowlist, rate limit auth, readiness, payload/error handling; không ghi trong health. |
| server/src/config/env.js | Host loopback, demo scope/default-off, listener opt-in và config rate-limit. |
| server/src/index.js | Bind HOST, chain listener chỉ chạy khi bật rõ ràng. |
| server/src/middleware/auth.js | Optional auth để public DTO vẫn dùng được, giữ owner/evaluator/student guards. |
| server/src/middleware/errorHandler.js | 413 cho payload quá lớn, không log nguyên object lỗi có thể chứa secret. |
| server/src/routes/auth.routes.js | Demo chỉ DB demo local có opt-in, không role fallback; public profile tối thiểu. |
| server/src/routes/data.routes.js | JWT/tenant/resource scopes, chống filter ngoài scope hoặc filter cấu trúc không hợp lệ. |
| server/src/routes/internship.routes.js | Giữ endpoint cũ, bỏ fixture trong GET, chặn IDOR/review sai, QR/session thật, certificate/sync fail closed. |
| server/src/routes/topic.routes.js | Public DTO che báo cáo, validate input; recordtx phải receipt thật/scope hợp lệ; không lưu hash do client tự nhận. |
| server/src/services/aiClient.js | Input validation, engine/fallback provenance, không semantic score giả hoặc floor20/empty70. |
| server/src/services/authService.js | Giữ nonce đang hợp lệ, verify trước consume atomic; chống phá challenge/replay/concurrent login. |
| server/src/services/ipfsService.js | Giữ upload thật/503 khi thiếu config; không echo chi tiết lỗi downstream. |
| server/test/helpers.js | Exact allowlist trước connect, DB mới/rỗng, random test secret, không drop/reset, không credentials cloud. |
| server/src/middleware/permissions.js | Policy theo identity và quan hệ Topic/company/student/mentor; legacy không rõ quan hệ fail closed. |
| server/src/models/AttendanceSession.js | Model mới bổ sung, TTL, nonce private, scope và usedAt; chỉ khởi tạo trong TEST ở lượt này. |
| server/src/services/attendanceService.js | Chữ ký/audience/issuer/expiry/nonce/assignment/atomic consume; không tuyên bố GPS hoặc chain. |
| server/src/services/chainVerificationService.js | Read-only receipt verifier opt-in, binding event/chain/contract/signer/resource; không mint hoặc gửi tx. |
| server/test/ai-fallback.test.js | Fallback/input/provenance với downstream giả lỗi có chủ đích, không kết quả giả. |
| server/test/chain-adapter.test.js | Receipt fixtures công khai là mock, không bằng chứng live chain; reject wrong chain/owner/events. |
| server/test/error-safety.test.js | Downstream/log redaction và oversized413; không credential/network thật. |
| server/test/runtime-safety.test.js | Regression môi trường sai/DEV/demo/production/URI tricks. |
| server/test/security-regression.test.js | API thật cho GET/read, IDOR, nonce, QR, tenant, mentor/admin, rate-limit và input. |
| server/test/testEnvironment.js | Guard URI/ENV và tên DB per-run giới hạn63ký tự. |


Tài liệu cập nhật: IMPLEMENTATION_PROGRESS, TEST_RESULTS, FEATURE_ACCEPTANCE_MATRIX; trạng thái MASTER_PLAN và phần kiến trúc đã triển khai trong ARCHITECTURE_UPDATED cũng được cập nhật. UI_DESIGN_SYSTEM, docs/PROGRESS, README, package/lock/.env, contract source/ABI/artifact/cache và các audit/DOCX/ZIP cũ được giữ nguyên.

## 4. Bảo toàn dữ liệu và Git

| Database bảo toàn | Collections | Indexes | Documents | Đối chiếu trước/sau |
| --- | --- | --- | --- | --- |
| web3_internship | 14 | 36 | 3 | SHA-256 nội dung + index list giống nhau |
| web3_internship_demo_20261030_2340 | 14 | 36 | 223 | SHA-256 nội dung + index list giống nhau |
| web3_internship_demo_20261030_2340_foundation | 14 | 36 | 66 | SHA-256 nội dung + index list giống nhau |


Snapshot đầu04:18:25 và cuối05:15:26 ngày31/10/2026 (+07:00). Không missing file baseline; thay đổi chỉ trong source/test/docs đã nêu. HEAD vẫn `d11a1852c5f03963bbe260425a246b0e65fe1091`, branch_1; không commit/push/merge/reset/clean hoặc staged changes. Không tạo .env, cài dependency, seed/migration, deploy hoặc dùng ví/private key thật.

PHASE0 đã chụp8.336 tracked và53 untracked; đầu PHASE1 có59 untracked sau6docs PHASE0. Các file có sẵn ngoài tài liệu/source được phép phải khớp hash trong integrity-final.json. Source cũ có bản lưu tại ignored staging, không dùng Git reset làm rollback.

## 5. Runtime để kiểm tra


Frontend TEST review: **http://127.0.0.1:5175/** → API **http://127.0.0.1:57402/api**, AI TEST8002. Database review hiện tại: `web3_internship_test_phase1_bfd57eb7_bf91a33947e0`; nguồn được nạp lại sau bản vá cuối, health/login/nonce ổn định/413 live smoke đã đạt. Review DB mới, không seed mẫu để giả lập dữ liệu thật. Các DB TEST trước được giữ nguyên, không cleanup.

Frontend cũ5173/5174 đã tạm dừng để HMR không ghép UI mới với Backend cũ. MongoDB, Backend gốc5000/demo5001 và AI cũ8001 không restart; các Backend cũ **chưa nạp bản vá**, không dùng chúng làm bằng chứng PHASE1 đã rollout. Không nạp model/index mới vào gốc/demo. Edge headless/debug9224 đã đóng; các service TEST review còn chạy để kiểm tra, demo auth mặc định tắt.


## 6. Còn thiếu và quyết định chuyển phase


- Chưa thực hiện PHASE2: giao diện vẫn dùng thiết kế cũ; mobile overflow, design system, Light/Dark, accessibility và bundle splitting chưa hoàn thiện.
- Chưa có Application/CV file parser, đa-slot đúng nghĩa, check-out/giờ làm, admin/school/batch lifecycle, audit/notification đầy đủ (PHASE3).
- AI vẫn là TF-IDF/keyword với provenance, không BERT/risk classifier; chưa dataset/metrics phù hợp hoặc benchmark (PHASE4).
- Pinata thật và RPC/token verifier chưa cấu hình. Chứng nhận không tồn tại404; Topic có sẵn nhưng chưa verifier token trả503. Đây là fail closed đúng, không phải chức năng NFT/SBT đã hoàn thành (PHASE5).
- Chain listener còn các vấn đề payload ethers, processed/checkpoint/reorg và đồng bộ normalized records; đã mặc định tắt, không tự chạy khi mount. Receipt binding được kiểm bằng ABI fixture; live receipt chưa kiểm vì không deploy/tx/RPC.
- Cạnh tranh đa-collection/onChainId vẫn cần canonical model, unique/index/transaction hoặc outbox và kế hoạch migration riêng; không tự sửa dữ liệu hoặc index cũ.
- JWT còn ở localStorage; chưa có SIWE domain binding/CSP/kiểm thử xâm nhập đầy đủ. Không tuyên bố production-ready hoặc không còn lỗ hổng.
- Script seed gốc vẫn có thao tác dropIndex/dedupe hoặc DB hardcode; không chạy hoặc sửa seed ở PHASE1. Không dùng README seed trực tiếp lên dữ liệu cần giữ.


Sẵn sàng để người dùng review PHASE1 và quyết định cho phép PHASE2. Điều đó không đồng nghĩa sẵn sàng production hoặc đáp ứng đủ7 chức năng KLCN129. Không bắt đầu redesign, cài model/cloud, migration hoặc public deploy. Rollout vào database gốc/demo là thao tác riêng cần xem xét vì có model/session/index bổ sung.

## PHASE 2 — đã hoàn thành phạm vi Frontend được phê duyệt

Ngày31/10/2026 (+07:00). **DỪNG để người dùng review; PHASE3 chưa bắt đầu.** Thiết kế Premium Web3 SaaS Dashboard mang tên Internova, Light mặc định và Dark tùy chọn; React/Vite/Lucide/CSS hiện có, không dependency mới.

### Trình tự và tác động

| Nhóm | File liên quan | Kết quả |
| --- | --- | --- |
| Shell/tokens | App.jsx, main.jsx, index.css, design-system.css, AppShell/ui/navigation | Sidebar theo JWT role, collapse/drawer, header ví/theme/notification chưa có; không đổi API/auth |
| Dashboard/pages | DashboardView, CvJdView, AttendanceView, Web3CertificateView | KPI/chart/table từ dữ liệu scoped; CV/JD, task/log/check-in, Web3 dùng API hiện có |
| Form/modal/states | AuthModal, ui/Dialog, ViewBoundary, App.jsx và các view | Label, validation native, error/empty/skeleton, Escape/focus trap/restore, keyboard topic |
| Splitting/lint | App.jsx, api/client.js, api/web3Client.js, index.html | Lazy màn hình/ethers, bỏ font ngoài và nhãn BERT trong meta; lint0error/0warning |
| Acceptance | client/test/phase2-browser.cjs, TEST harness PHASE1 không sửa |43/43 Backend +39/39 browser +4/4 polish PASS; build PASS; dữ liệu gốc/demo không đổi |

### Trang đã thiết kế lại và phạm vi vai trò

- Tổng quan: cả bốn vai trò qua cùng component/API, dữ liệu theo JWT; company/mentor có số sinh viên phân công; student có nhật ký/điểm danh/điểm; admin có tổng sự kiện đã lưu. Không coi event DB là chứng nhận token.
- Đề tài & KPI: master/detail, tìm kiếm, chọn bằng keyboard, tạo/phân công/nộp báo cáo/đánh giá/tổng kết giữ handler và quyền PHASE1; báo lỗi chain vẫn độc lập với DB saved.
- CV & JD: hồ sơ đối chiếu tạm, AI matching có provenance, JD form/search/cards; Apply chưa có Backend nên khóa.
- Công việc & điểm danh: ba subtab điểm danh, nhiệm vụ, nhật ký; form thực, empty/error/skeleton, mobile labels. Không thêm camera/GPS/check-out.
- Chứng nhận Web3: tra cứu, unavailable/error rõ, ledger đọc và sync thủ công chỉ Admin; không gọi POST khi mount.
- Đăng nhập, modal nghiệp vụ và menu chức năng tương lai: thiết kế thống nhất. Student có mục ứng tuyển; company có ứng viên; mentor có sinh viên/cảnh báo; admin có tài khoản/doanh nghiệp/sinh viên — nội dung thiếu Backend ghi NOT IMPLEMENTED.

### File sửa/thêm so với đầu PHASE 2

**11 file có sẵn +6 file mới**, chỉ Frontend/test. Bốn docs cập nhật riêng bên dưới. Source Backend/AI/contracts/database, package/lock/.env, README, các tài liệu/audit/DOCX/ZIP cũ đều không đổi trong PHASE2.

| File PHASE 2 | Thay đổi và tác động |
| --- | --- |
| client/index.html | Brand Internova, description đúng nguồn AI; bỏ Google Fonts/preconnect bên ngoài. |
| client/src/App.jsx | Tích hợp AppShell, default dashboard, lazy views + ViewBoundary; giữ handler/API/owner/evaluator/student guards; topic keyboard và labels KPI. |
| client/src/api/client.js | Chỉ chuyển BrowserProvider sang dynamic import; nonce/signature/JWT và demo guard giữ nguyên. |
| client/src/api/web3Client.js | Chỉ chuyển ethers sang dynamic import trong async functions; giữ chain/signer/receipt constraints PHASE1. |
| client/src/components/AppShell.jsx | AppShell chứa Sidebar/Topbar, role menus, collapse/mobile drawer, theme, wallet/account, notifications NOT IMPLEMENTED; không mutation. |
| client/src/components/AttendanceView.jsx | Theme/responsive, loading/error/empty, Dialog, label và aria-pressed cho subtab; bỏ giờ mẫu khi thiếu timestamp; giữ session/task/log API. |
| client/src/components/AuthModal.jsx | Dialog keyboard/focus, label nút đóng, semantic colors; giữ ví thật và demo opt-in. |
| client/src/components/CvJdView.jsx | Theme/grid responsive, JD search, loading/error/empty, Dialog/validation; trường đại học nhập đúng, nguồn AI thật, Apply vẫn disabled. |
| client/src/components/DashboardView.jsx | Thiết kế presentation mới từ cùng API: KPI/role summary, chart có text alternative, bảng search/filter/pagination scoped; giữ callback chi tiết. |
| client/src/components/ViewBoundary.jsx | Bắt lỗi render/lazy chunk và cung cấp reload có chủ đích; không dữ liệu thay thế. |
| client/src/components/Web3CertificateView.jsx | Semantic theme/responsive, loading/error/BLOCKED; ledger GET chỉ Admin và sync thủ công; giữ verifier fail-closed. |
| client/src/components/navigation.js | Nhãn bốn vai trò dùng chung, không thêm quyền hoặc cơ chế xác thực. |
| client/src/components/ui.jsx | EmptyState, LoadingSkeleton, PageHeader, StatCard, Dialog, DataTable, UnavailableView. |
| client/src/design-system.css | Semantic tokens Light/Dark, typography, spacing, components, responsive 320–1440, focus/reduced motion. |
| client/src/index.css | Bỏ @import font ngoài; stylesheet cũ giữ làm compatibility base. |
| client/src/main.jsx | Nạp semantic design-system.css sau CSS hiện có. |
| client/test/phase2-browser.cjs | CDP browser regression có exact TEST guard; fixture TEST công khai, signature login thật; không cleanup/drop/real tx. |


Component mới: AppShell (Sidebar/Topbar tích hợp), ViewBoundary và7 primitive trong ui.jsx. navigation.js chia sẻ nhãn; CSS dùng semantic tokens, không thêm thư viện biểu đồ/QR/UI.

### Kiểm thử và dữ liệu

Build cuối `npm.cmd --prefix client run build -- --outDir dist/phase2-accepted`: PASS; lint: **0error/0warning**. Entry JS290,53kB/gzip88,08kB; ethers379,90kB tải theo thao tác,4 view tách chunk. Không còn cảnh báo chunk>500kB. So với PHASE1 entry576,37kB; con số entry không phải tổng dung lượng toàn ứng dụng.

Backend43/43 vẫn PASS. Browser39/39 gồm100 lượt role×page×width; polish4/4 thêm50 lượt page×width×theme và label/modal. Đây là nhóm phép kiểm, không phải86 chức năng sản phẩm. [Chi tiết](TEST_RESULTS.md), [design system](UI_DESIGN_SYSTEM.md), [matrix](FEATURE_ACCEPTANCE_MATRIX.md).

| Database bảo toàn | Collections | Indexes | Documents | Đối chiếu |
| --- | --- | --- | --- | --- |
| web3_internship | 14 | 36 | 3 | Nội dung SHA-256 và danh sách index không đổi |
| web3_internship_demo_20261030_2340 | 14 | 36 | 223 | Nội dung SHA-256 và danh sách index không đổi |
| web3_internship_demo_20261030_2340_foundation | 14 | 36 | 66 | Nội dung SHA-256 và danh sách index không đổi |


Snapshot trước22:51:12 UTC và sau23:09:53 UTC ngày30/10 (=05:51–06:09 ngày31/10 +07). So sánh đầy đủ nội dung từng collection + indexes, không chỉ đếm document. Các DB TEST run cũ được giữ, không drop/reset/cleanup.

### Runtime và Git

Runtime review: **http://127.0.0.1:5175/** → **http://127.0.0.1:57403/api** → `web3_internship_test_phase1_246664a9_397a9ca835d5`; AI TEST8002. Frontend/Backend TEST trả HTTP200, Mongo connected. Backend TEST PID2316; chỉ bộ TEST này nạp source đã kiểm. Khách xem công khai; demo auth tắt, không có tài khoản mẫu/backdoor đăng nhập. Các tài khoản browser là ví ngẫu nhiên TEST, không ví hoặc tiền thật.

Backend gốc5000/demo5001 và AI cũ8001 không restart. FE5173/5174 vẫn dừng. Không dùng Backend cũ làm bằng chứng bản vá đã rollout; không mở UI mới với API5000/5001 để thử nghiệp vụ. Backend review PHASE1 cũ57402 được giữ, không phải API của PHASE2. Edge headless riêng/debug9225 đã đóng sau test; các service review cần thiết vẫn chạy.

Git `branch_1`, HEAD`d11a1852c5f03963bbe260425a246b0e65fe1091` không đổi, không staged changes. Working tree gồm cả PHASE1 đã có trước và PHASE2; không diễn giải toàn bộ git diff là thay đổi PHASE2. Không xóa file baseline/untracked, không commit/push/merge/reset/clean. Bản lưu trước PHASE2 và evidence ở ignored `contracts/node_modules/.cache/phase2-20261031/`; `integrity-final.json` xác minh phạm vi file.

### Còn thiếu / điểm dừng

- Chưa có Backend hoàn chỉnh cho Application/ứng viên, lưu/upload/parser CV, quản lý tài khoản/phân quyền/doanh nghiệp/sinh viên, batch, notification/audit, cảnh báo rủi ro và giờ làm/check-out. Các mục liên quan hiển thị NOT IMPLEMENTED hoặc hành động bị khóa; không toast thành công giả.
- AI vẫn là TF-IDF/fallback có nguồn; không BERT hoặc bộ phân loại rủi ro. Matching browser gọi AI TEST thật, không phải benchmark mô hình.
- Pinata/RPC/token verifier thật chưa được cấu hình; chứng nhận unknown404/known503, không badge VERIFIED. QR vẫn nhập token phiên, chưa encoder/camera/GPS hoặc attendance proof blockchain.
- Không có EVM/deploy/MetaMask hardware/cloud integration/UAT/Lighthouse hoặc kiểm định WCAG đầy đủ ở PHASE2. Contrast chỉ đo các cặp semantic tokens được liệt kê; chưa kiểm mọi nội dung tự do/trạng thái hệ điều hành.
- Auth/nonce/JWT policy giữ nguyên PHASE1; localStorage JWT và SIWE domain/CSP hardening vẫn là khoảng thiếu đã ghi. Menu theo vai trò không thay kiểm quyền Backend.
- Search/filter/pagination của bảng và JD chạy trên dữ liệu API đã tải, chưa server pagination/global search. Biểu đồ chỉ phản ánh các đề tài đã tải, không tạo chuỗi thời gian hoặc xu hướng giả.
- ethers chunk vẫn khoảng380kB khi người dùng thao tác ví/RPC; đã tách tải, không phải giảm tổng dung lượng thư viện. Không cài dependency hoặc đổi framework.
- Seed cũ vẫn nguy hiểm/hardcode và không chạy. Không áp schema/migration/model mới vào DB gốc/demo; rollout vào đó là công việc riêng.

**PHASE2 hoàn thành phạm vi UI hiện có; sẵn sàng để người dùng đánh giá trước PHASE3.** Chưa đáp ứng toàn bộ bảy yêu cầu đề cương, chưa production-ready, chưa triển khai nghiệp vụ PHASE3.

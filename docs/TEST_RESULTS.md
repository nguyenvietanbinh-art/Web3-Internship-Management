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

# Kết quả mới — Email/password thật trên TEST

Ngày 02/11/2026 (+07). [Hướng dẫn và báo cáo email/password](EMAIL_AUTH_DEMO.md). Email dạng Gmail nhưng mật khẩu riêng của Internova, không Google OAuth/Client ID.

147/147 Backend PASS, fail0/skip0; 8 nhóm email mới. Email browser5/5 PASS: mở form không ghi, register thật, reload/session, mobile375/theme, logout, sai/đúng password, đổi password. Google/ví regression7/7 PASS; không giả Google live. Lint0error/0warning/buildPASS. [Evidence](evidence/email-auth-20261102/result.json).

Bcrypt hash, email duplicate/race, role injection, password mismatch/UTF-8 limit, collision không merge, profile/email login tách biệt, JWT revocation/disabled, password+signature linking scope/cookie/replay/expiry/theft đều đã kiểm. Ba database gốc/demo full collection SHA/index giống trước/sau. Không email delivery/verification/reset thực tế, không production security acceptance.

---

# Kết quả mới — Google authentication

Ngày 01/11/2026 (+07). [Kết quả và file thay đổi](GOOGLE_AUTH_RESULT.md), [cấu hình Google Cloud/localhost](GOOGLE_AUTH_SETUP.md). Google thật **BLOCKED thiếu Client ID**; không gọi TEST verifier hoặc User/JWT fixture là Google login thật.

- Backend139/139 PASS, fail0/skip0:122 regression cũ +16 Google integration groups +1 official-library RSA fixture.
- Browser7/7 PASS, exceptions0/outbound-blocked0:chooser/register/config BLOCKED/profile persist/mobile/theme/logout/bốn role wallet nonce/signature. Google-only UI dùng tài khoản/JWT TEST fixture được khai báo.
- Google integration dùng verifier claims được inject chỉ trong exact-allowlisted TEST app. Crypto fixture dùng RSA thật với cert TEST trong bộ nhớ và thư viện chính thức, không Google credential thật.
- Google popup/Gmail/live token/callback và hủy Google popup thật:BLOCKED. Hủy dialog ứng dụng đã kiểm, không đánh đồng.
- Lint0error/0warning; buildPASS ignored output. Audit server omit=dev0; không suy rộng sang toolchain contracts.
- Ba DB bảo toàn so full collection SHA256+index trước/sau. Không migration/seed/drop/delete.

[Logs và số liệu](evidence/google-auth-20261101/result.json). Bộ kết quả các PHASE dưới đây là lịch sử.

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

| Bộ kiểm PHASE5 | Kết quả |
| --- | --- |
| Backend regression + real local chain/NLP |111/111 PASS, fail0/skip0 |
| Solidity mới / legacy |9/9 và3/3 PASS |
| Core browser PHASE3–5 |64/64 PASS trước bước QR dependency |
| Legacy browser |39/39 PASS |
| QR browser sau sửa cuối |7/7 PASS; PNG+canvas MediaStream thật, GPS CDP fixture |
| QR unit |2/2 PASS,40 random long payloads/8 masks và blank rejection |
| Python unit |16/16 PASS; không nạp model thứ hai |
| Lint/build |0error/0warning, build PASS |
| Pinata live readback |BLOCKED credentials/key/enable flag |
| Camera/GPS phần cứng |NOT TESTED |

TX report/attendance/completion/mint từ UI ở block14–17, token#4 được verify RPC; không mock success. Pending real tx và reconcile từ event có test. IPFS transport mock không thay bằng chứng cloud; unknown certificate/RPC mismatch không VERIFIED. Ba DB bảo toàn so SHA/index đầy đủ bằng nhau. Lịch sử FAIL vẫn giữ, chi tiết logs và cách tái lập trong [báo cáo](WEB3_INTEGRATION_RESULT.md). Không lấy Python22/22 của PHASE4 làm lần chạy mới. Các phần sau là lịch sử.

---

# Kết quả mới nhất — inference và tích hợp SBERT thật

Ngày31/10/2026: **22/22Python**, **92/92Backend**, **51/51browserPHASE3–4**, **39/39browserPHASE2**, fail0/skip0. Lần này có6modeltestthật và3BackendpositiveSBERT cùng UIstudent/company/mentor/admin, không chỉ guard/modelunavailable. Build/lintcuốiPASS; warningtimingsbuildsong song đượcgiữ và ghi rõ trong báo cáo.

LỗiUNEXPECTED_TOKENIZER đầu tiên giữFAILlog; sửa specialtemplate<s>/</s> và implicit128token truncation, chạy lại model/batch/longtext/realrank. Embedding3×384thật, load1,42s, encode3câu27,59ms ởsmokeCLI; NLPprocesspeak~634,64MiB. Các số là inference/performance smoke synthetic, **không phải qualitymetrics**. P@K/R@K/MAP/NDCG/riskclassifiermetrics vẫnnull vì0nhãnđộc lập.

MọiAPI/UIanalysis kiểmSHA256businesscollectionzero-write, gốc/demo cảhash/indexkhôngđổi; khôngdrop/seed/migration/publicchain/realwallet. Các negativefixtures/mockmemory/transportfault được công khai và không dùngfakeembeddings. [Kết quả và links log/screenshot](AI_RUNTIME_INFERENCE_RESULT.md). Các test/blockedstate ở phần sau là lịch sử.

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# Kết quả bổ sung — cài runtime/model đã phê duyệt

Ngày31/10/2026: isolatedruntimeinstallPASS (ONNX1.31.1,tokenizers0.23.3,flatbuffers25.12.19,protobuf7.36.2); nativeimportPASS; model2artifact121,59MiB size/SHA256PASS. Python16/16PASS saucài; Python global khôngcó ONNX/tokenizers/flatbuffers, baseversionsgiữ nguyên.

**Model inference CHƯA PASS:** requestSBERT thật quaAPI8003 trả503/INSUFFICIENT_MEMORY_REQUIRE_1024_MIB; ~736,84MiBfree. Đây là guardnegativecase thànhcông, không embedding/modelinference. Dataset nhãn0 (người dùng xácnhận), qualitymetrics/confidenceclassifier vẫnnull.

Không chạylại Backend89/browser46+39/build/lint trong đợtcài; giữ bằngchứng lịch sử hợp lệ, không cộngdồn. Snapshot07:00:35UTC xácminh3DB gốc/demo hash/index khôngđổi. [Evidence/command/result](AI_RUNTIME_INSTALL_RESULT.md).

---

## Lịch sử trước phê duyệt/cài ONNX — giữ để đối chiếu

# Kiểm thử mới nhất — PHASE 4 AI/NLP

Ngày31/10/2026. **PASS dưới đây không bao gồm inference/quality SBERT hoặc riskclassifier chưa được huấn luyện. PHASE4 chưa đủ nghiệm thu toàn bộ.**

| Nhóm | Kết quả chạy thật | Evidence |
| --- | --- | --- |
| Backend final | **89/89PASS**, fail0/skip0,45,19s | [Log](../contracts/node_modules/.cache/phase4-20261031/backend-regression-final.log) |
| Python unit/API | **16/16PASS**, không modelweights | [Log](../contracts/node_modules/.cache/phase4-20261031/python-tests-final.log) |
| BrowserPHASE3+4 | **46/46PASS** =36regression+10NLP | [JSON](../contracts/node_modules/.cache/phase4-20261031/browser-results.json), [log](../contracts/node_modules/.cache/phase4-20261031/browser.log) |
| BrowserPHASE2 | **39/39PASS**, assertions gốc/CoreOFF | [Log](../contracts/node_modules/.cache/phase4-20261031/compat/browser.log), compatibility riêng |
| Frontendbuild/lint | PASS, lint0error0warning | [Build](../contracts/node_modules/.cache/phase4-20261031/build.log), [lint](../contracts/node_modules/.cache/phase4-20261031/lint.log) |
| Syntax/whitespace | Node75/Python11file PASS; gitdiff--checkPASS | [Integrity](../contracts/node_modules/.cache/phase4-20261031/integrity-final.json) |
| Gốc/demo | Từng nội dungSHA256+indexes3DB không đổi | [Trước](../contracts/node_modules/.cache/phase4-20261031/protected-before.json), [sau](../contracts/node_modules/.cache/phase4-20261031/protected-after.json) |
| SBERTmodelinference | **NOT RUN** | Runtime/model chưa cài/tải, không embeddingstubPASS |
| Rankingquality/riskclassifier | **NOT EVALUATED / NOT TRAINED** | Nhãn độc lập0, metricsnull |

## Phép kiểm cụ thể

- Giữ82BackendPHASE1–3, thêm7AI: auth/liveRole/ownCV/foreignJD/foreignReport/strictfields; TF-IDF matching thật; rankingconsentedApplicationSnapshot; reporttaskdueDate thật và NOTTRAINED; absentmodel503 khôngbaselinegiả; nonloopback/unavailable không ghiDB; localserver imlặng15s timeout nhưng /health vẫn200. Không gọi Internet với privateCV.
- Python16: Unicode/skillaliases; realTF-IDF identical/unrelated; empty/duplicates/badtypes; tính P@K/R@K/AP/NDCG bằng ví dụ nhỏ tính tay; invalidunjudged/NaN/booleanlabels; rejectfakeprovenance/leakage; reportcounts/rules khácclassifier; API422/4MiB413; noimplicitdownload; lowRAMguard trướcimport (negative test mockRAM, không mockmodel); downloadrequiresapproval/isolatedpath. Các ví dụ nhãnUNIT-ONLY không benchmark sản phẩm.
- Browser36PHASE3 giữ toàn bộ luồng UI/API/persistence/parser, bốnrole/responsive/themes và fingerprintzero-write; thêm10NLP: bốnroleAIpageGETonly320/768/1440, studentmatch/companyrankTF-IDF thật, company/mentor/adminreportanalysis thật, absentSBERTerror rồi chủ động chọnbaselinephụchồi. Không gửi tx, không fakeclassifier/confidence.
- BrowserPHASE2 chạy source cuối trên database mới/CoreOFF, chỉ đổi frontend5176/rootlocation;39assertions giữ nguyên, không ghi đè evidencePHASE2/3. Bộpolish4PHASE2 vẫn evidence lịch sử, không tính chạy lại.

Screenshots [studentranking](../contracts/node_modules/.cache/phase4-20261031/student-nlp-ranking.png), [companyranking](../contracts/node_modules/.cache/phase4-20261031/company-nlp-ranking.png), [mentorreport](../contracts/node_modules/.cache/phase4-20261031/mentor-nlp-report.png), [adminreport](../contracts/node_modules/.cache/phase4-20261031/admin-nlp-report.png). JSON chỉ requestmethod/path/results test, không JWT/privatekey/rawpersonalCV. Nội dung syntheticTEST công khai nguồn trongfixture; không dữ liệu production.

## Tài nguyên và hiệu năng thực đo

NLP8003 TF-IDF5request với2candidate synthetic: meanwall5.35ms, maxwall7.23ms, meanNLP1.52ms. Đây là **smoke nhỏ**, không p95/throughput/loadtest. [Runtime/performance](../contracts/node_modules/.cache/phase4-20261031/runtime-final.json), [tài nguyên](../contracts/node_modules/.cache/phase4-20261031/resource-final.json). Không suy hiệu năngSBERT từ TF-IDF; SBERTlatency/peakmemory null. API timeout15s đã được test localstalled thật.

RAM7,39GiB, initialfree~330MiB, snapshotfinal~824MiB, không CUDA. Chưa tảiONNX121,59MiB hoặc càiONNXRuntime/tokenizers; chỉ đọc metadataHF/PyPI. Model smoke script sẽ fail/notwriteevidence nếu không inference thật.

## Lệnh đã chạy và an toàn

`npm.cmd test` trongserver với NODE_ENV=test, MONGODB_URI_TEST=allowlist riêng có prefixweb3_internship_test_phase1; helperderivechildDBngẫu nhiên+verifyactualDB, khôngreusenonempty. NLP_SERVICE_URL_TEST=http://127.0.0.1:8003, AI_SERVICE_URL_TEST8002, CVparserisolatedPHASE3. Backendunit89 giữmọiTESTDB, khôngdrop/seed/migration/delete.

Python: `python -B -m unittest discover -s tests -v` từai-service, sau đó TextTestRunner ghiUTF8thẳnglog để tránh PowerShell5.1 diễn giải stderr unittest thành NativeCommandError. Log đầu ghi12testsOK nhưng wrapper báoexit1 do stderr-redirection; giữnguyên, không gọi đó là modelFAIL/PASS. Logaccepted/final16testsOK và process exit0.

Browser: `node client/test/phase3-browser.cjs` với PHASE4_BROWSER=true, PHASE3_TEST_META trỏmetadataPHASE4, exactallowlistderivedDB. Extensionphase4-browser.cjs chỉ bật tronglầnPHASE4, testPHASE3 mặc địnhgiữ36assertions. ModelunconfiguredfixtuređúngreasonLOCAL_MODEL_NOT_CONFIGURED, không conditional modelsmoke được tínhPASS.

Build: `npm.cmd --prefix client run build -- --outDir dist/phase4-review`; VITE_API_URL=http://127.0.0.1:57404/api vàVITE_ENABLE_DEMO=false chỉprocessenv. Lint`npm.cmd --prefix client run lint`. KhôngTypeScript/typecheckscript; syntaxAST không thaytypechecking. Khôngpip/npm install/auditfix/.env.

## Chưa nghiệm thu / thiếu bằng chứng

SBERTembedding/cosine/ranking thật và artifactcompatibilityRyzen chưa chạy. P@K/R@K/MAP/NDCG/so sánhBERT-TFIDF chưa cónhãn, đểnull. Riskclassifier/training/test/calibration chưa có, không AI riskprediction. Chưa realuserUAT/production/pen-test/OSsandbox/large-load/modelRSS. Không dùng BERT API trảphí, không privateCV outbound, không publiccloud/modeltraining hoặcchain. Phải có phê duyệt runtime/model, đủRAM và labeledconsenteddata để hoàn tất PHASE4.

---

## Lịch sử PHASE 0–3 — không phải trạng thái PHASE 4

# Kết quả kiểm thử mới nhất — PHASE 3

Ngày31/10/2026. Các kết quả bên dưới được chạy thật trong TEST cô lập, không phải chỉ đọc source. Phần PHASE0–2 sau dấu phân cách là lịch sử. **DỪNG trước PHASE4.**

| Kiểm tra | Kết quả thực tế | Bằng chứng |
| --- | --- | --- |
| Backend toàn bộ | **82/82 PASS**, fail0/skip0;27,33giây | [Log cuối](../contracts/node_modules/.cache/phase3-20261031/core-regression-final.log) |
| Browser PHASE3 | **36/36 PASS**, uncaught0, blocked external0 | [JSON đầy đủ](../contracts/node_modules/.cache/phase3-20261031/browser-results.json), [log](../contracts/node_modules/.cache/phase3-20261031/browser-final.log) |
| Browser regression PHASE2 | **39/39 PASS**, source mới/Core OFF | [Log](../contracts/node_modules/.cache/phase3-20261031/compat/browser.log), results JSON trong compat;39assertion gốc không đổi |
| Frontend lint | PASS,0error/0warning | [Log](../contracts/node_modules/.cache/phase3-20261031/final-lint.log) |
| Frontend build | PASS, output ignored client/dist/phase3-accepted | [Log](../contracts/node_modules/.cache/phase3-20261031/final-build.log) |
| Node syntax | PASS,71file server/src,test và client/test | [Integrity](../contracts/node_modules/.cache/phase3-20261031/integrity-final.json) |
| Git whitespace | git diff --check PASS | Kiểm thực terminal |
| Gốc/demo | Hash nội dung và indexes3DB không đổi | [Trước](../contracts/node_modules/.cache/phase3-20261031/protected-before.json), [sau](../contracts/node_modules/.cache/phase3-20261031/protected-after.json) |
| Runtime TEST |5175, health/ready/capabilities57404, AI8002 đều200 | [Runtime/schema](../contracts/node_modules/.cache/phase3-20261031/runtime-final.json) |

## Nội dung Backend đã kiểm

Giữ43case PHASE1: auth/RBAC/ownership/QR/non-replay, AI không success giả, chain adapter và safe error/zero-write. Thêm39case trong core-accounts(7), core-recruitment(8), core-placements(3), core-work-time-reports(10), core-edge-cases(6), timeTracking(2), database-safety(2), startup-entry(1).

- Profile/admin: không tự nâng quyền, disabled token/login từ chối, protected admin/self, CAS conflict; legacy profile audit và record thiếu __v vẫn update có kiểm soát.
- CV: private binary owner-only, PDF và DOCX trích text thật; MIME/extension/magic/size, macro/external-relations/DDE/zip-bomb/traversal/DTD/active-PDF/decompression-bomb/encrypted/scan không text bị từ chối; không lưu CV khi parser thất bại.
- JD/applications: own scope; search/filter/page; deadline; CV snapshot; duplicate unique concurrent; trạng thái hợp lệ và receipt explicit. Không mock thành công AI hoặc parser.
- Assignment: batch range, role/tenant, school approve, date/mentor edit trước active, lifecycle; legacy singleton không bị ghi. KPI riêng có weighted score, không dùng KPI singleton Topic.
- Task/log: ownership, assignment deadlines, progress/status consistency, history và version conflict; duplicate week/approved immutability.
- Hours: actual clock whole minutes, zero short session hợp lệ; duplicate check-in/requestKey/day; missingcheckout read-only, >16h và impossible dates, adjustments bounded/with audit; day/week/month/batch totals approved only.
- Reports: versions/current partial unique, need_revision, independent company/mentor review, school approval và weightedKPI/reportmean riêng; approve-versus-replace race không cả hai thắng, completion không mint.
- Runtime: nonTEST autoIndex/autoCreate off; TEST URI exact guard trước connect; index readiness chỉ đọc. **src/index.js child process thật** khởi động trên freshTEST, /health/ready/capabilities200, dừng đúng child và giữDB.

## Browser đã kiểm thực tế

Chrome DevTools Protocol điều khiển Edge headless, không Playwright giả lập assertion. Tài khoản synthetic/ví ngẫu nhiên, nonce+ethers signature/JWT thật. Chỉ fixture Admin/project khởi tạo explicit trong exactTEST; hành động nghiệp vụ qua form/click và API thật; không sử dụng ví/token production, không giao dịch.

36nhóm kiểm: guest zero-write; Admin provision mentor/filter/protected admin; Student profile; delayed real auth/me + event-only wallet accountsChanged fixture không hồi sinh user; PDF upload/text/private storage; JD publish; apply+duplicate; company review; notifications GET và explicit mark-read; batch/propose/approve/start; task/log/mentor review; check-in/out; explicit TEST human correction55phút và approve; KPI submit/review70; report final company80+mentor90→school85; completion; bốn dashboard real scoped; foreign identities; bốn vai trò responsive320/768/1440 Light/Dark; no uncaught/external/chain write.

Case55phút là **điều chỉnh chủ đích một phiên TEST** qua form có audit, không thời gian người dùng đã làm thực tế và không seed vào database demo. Sau check-in/out ngắn, phút thực ban đầu là0, không thêm phút giả. KPI70/report85 là điểm do người kiểm thử nhập công khai cho fixture TEST, dashboard đọc từ DB, không hardcode sản phẩm.

Đọc/navigate tất cả core menu: đối chiếu request methods và SHA-256 toàn bộ nội dung collection nghiệp vụ trước/sau; phát hiện được cả update không tăng count. Không đưa nội dung CV/JWT/private key vào JSON evidence. AuthNonce TTL không thuộc fingerprint nghiệp vụ vì nonce được tạo/tiêu thụ do login có chủ đích.

Screenshots: [CV](../contracts/node_modules/.cache/phase3-20261031/student-cv.png), [school completed](../contracts/node_modules/.cache/phase3-20261031/school-completed-placement.png), [student dashboard](../contracts/node_modules/.cache/phase3-20261031/student-core-dashboard.png), [company dashboard](../contracts/node_modules/.cache/phase3-20261031/company-core-dashboard.png), [mentor](../contracts/node_modules/.cache/phase3-20261031/mentor-core-dashboard.png), [admin](../contracts/node_modules/.cache/phase3-20261031/admin-core-dashboard.png); mỗi role có time-mobile/core-dark trong cùng thư mục.

Regression PHASE2 dùng bản copy harness chỉ đổi root location và frontend5175→5176; API57403 và39assertion giữ nguyên, Core OFF. Kết quả gốc PHASE2 không ghi đè. Bộ PHASE3 browser lần đầu35/35 và các backend69/70/76PASS là intermediate, không cộng dồn thành số cuối. Log group2/3 đầu29/31 có2lỗi Multer parts rejecting validfile; giữ FAIL và sửa upload mới sang bounded raw binary. Final82/36PASS kiểm bản raw upload. Không tạo mock success để che lỗi.

## Lệnh và bảo vệ dữ liệu

Chạy server `npm.cmd test` với NODE_ENV=test, MONGODB_URI_TEST và MONGODB_URI_TEST_ALLOWLIST bằng nhau, base riêng `web3_internship_test_phase1_phase3_final`. Helper tạo child DB ngẫu nhiên và xác minh DB thực tế, từ chối reuse cócollection. Test guard chống DB gốc/demo/URI sai. `AI_SERVICE_URL_TEST=http://127.0.0.1:8002`; CV_PARSER_MODULE_PATH trỏ isolated pypdf. `node client/test/phase3-browser.cjs` yêu cầu PHASE3_TEST_META và allowlist đúng URI trong metadata. Không in secret.

Build: `npm.cmd --prefix client run build -- --outDir dist/phase3-accepted` với process env VITE_API_URL=http://127.0.0.1:57404/api, VITE_ENABLE_DEMO=false; lint: `npm.cmd --prefix client run lint`. Cả hai được kiểm exit code0. Không TypeScript/type-check script trong project; syntax check không thay type checking. Pypdf6.21.4 chỉ cài isolated theo phê duyệt, không npm install/auditfix.

Không chạy seed/migration/dropDatabase/delete/cleanup; không xóa fixture sau test. Không API nghiệp vụ trên gốc/demo. Evidence snapshot03:28:04–04:58:46UTC31/10, baDB documents3/223/66 và36indexes/DB giữ nguyên từng hash/index.

## Chưa kiểm / giới hạn

Không có password account nên không test password change. Chưa kiểm production/Atlas/replica-set transaction, performance/load/AV/CDR/fuzz/OS sandbox, manualUAT/realMetaMask hardware/cloud/SIWE domain/CSP đầy đủ. Không AI BERT/OCR/metrics hoặc chain/EVM/deploy/IPFS/NFT/GPS/camera thật trong PHASE3. Responsive là viewport đã kiểm, không bao phủ mọi thiết bị. Bundle pattern scan chỉ loại PEM/JWT literal/VITE secret bindings, không chứng nhận không thể lộ secret trong mọi cấu hình.

Mongo nonTEST rollout cần duyệt riêng vì startup không tự tạo schema/index; thiếu index critical sẽ fail-closed. Chưa restart Backend5000/5001. Không tuyên bố toàn bộ đề cương đã đạt từ các số test PASS.

---

## Lịch sử trước PHASE 3 — giữ để đối chiếu

# Kết quả kiểm thử — PHASE 1–2

**Hiện tại: PHASE2 Backend43/43, browser39/39 + polish4/4, build/lint PASS.** Phần PHASE1 dưới đây giữ lịch sử; phần PHASE2 ở cuối ghi evidence mới.

## Hồ sơ PHASE1 — lịch sử


Ngày31/10/2026. **Source PHASE1:43/43 Backend,5/5 AI,16/16 browser PASS**. Tổng64 case ở phạm vi dưới đây; không thay cho nghiệm thu7 chức năng hoặc kiểm chứng dịch vụ cloud/chain thật. Evidence ở `contracts/node_modules/.cache/phase1-20261031/`.

## 1. An toàn harness

NODE_ENV=test và MONGODB_URI_TEST phải khớp chính xác MONGODB_URI_TEST_ALLOWLIST, chỉ loopback27017 với prefix TEST được kiểm. Tên DB worker được suy từ hash+random, không quá63ký tự; listCollections phải rỗng trước Mongoose connect/init. Không default sang DEV/demo, không dropDatabase/dropCollection/dropIndex/deleteMany reset. Mỗi run tạo DB mới, dữ liệu test được giữ.

PINATA_JWT trong worker rỗng để dotenv không lấy credential thật; AI chỉ URL loopback đã kiểm; chain verifier/listener và demo auth mặc định false. JWT secret ngẫu nhiên chỉ trong process. Auth nonce consume/TTL là kỹ thuật test auth trên TEST, không xóa dữ liệu nghiệp vụ ở gốc/demo.

## 2. Backend43test cuối

| STT | Test | Kết quả |
| --- | --- | --- |
| 1 | unavailable AI matching exposes provenance, no invented semantic score or minimum match | PASS |
| 2 | malformed AI adapter input is validation error, not a fabricated fallback result | PASS |
| 3 | receipt adapter rejects wrong chain/signer/contract/status and unbound topic events | PASS |
| 4 | disabled verifier is unavailable rather than writing or fabricating receipt | PASS |
| 5 | Pinata failures never echo downstream details/credentials and retain502 code | PASS |
| 6 | oversized/unknown errors do not leak payloads in client response or logs | PASS |
| 7 | health trả về trạng thái DB và IPFS | PASS |
| 8 | endpoint không tồn tại trả 404 JSON | PASS |
| 9 | nonce: từ chối ví không hợp lệ | PASS |
| 10 | login: không có chữ ký bị từ chối | PASS |
| 11 | login: chữ ký của ví khác bị từ chối (401) | PASS |
| 12 | login: không có nonce thì từ chối | PASS |
| 13 | login: nonce chỉ dùng được một lần (chống replay) | PASS |
| 14 | login: không cho tự đăng ký role mentor/admin | PASS |
| 15 | login: user cũ giữ nguyên role dù gửi role khác | PASS |
| 16 | /me cần token hợp lệ | PASS |
| 17 | profile: chỉ chủ tài khoản được sửa | PASS |
| 18 | PUT /data/students / companies cần xác thực và đúng chủ | PASS |
| 19 | tạo đề tài: cần đăng nhập, đúng role company | PASS |
| 20 | tạo đề tài: tổng trọng số KPI phải = 100% | PASS |
| 21 | tạo đề tài: danh tính công ty lấy từ token, bỏ qua companyWallet trong body | PASS |
| 22 | công ty khác không được sửa/phân công/hoàn thành đề tài | PASS |
| 23 | phân công: sinh viên phải là tài khoản student đã đăng ký | PASS |
| 24 | luồng đầy đủ: assign → nộp → đánh giá → hoàn thành, kiểm tra phân quyền từng bước | PASS |
| 25 | mentor được chỉ định có quyền chấm, mentor lạ thì không | PASS |
| 26 | nộp báo cáo khi chưa cấu hình PINATA_JWT trả 503, không tạo CID giả | PASS |
| 27 | ID đề tài sai định dạng trả 400, không tồn tại trả 404 | PASS |
| 28 | test guard accepts only exact local allowlist with NODE_ENV=test | PASS |
| 29 | test guard rejects DEV/demo/production, missing configuration and URI tricks before connect | PASS |
| 30 | demo login is disabled by default and cannot be enabled on TEST/DEV by flag alone | PASS |
| 31 | invalid signature cannot consume victim nonce; two valid concurrent logins consume once | PASS |
| 32 | public repeated/concurrent nonce requests cannot invalidate an unexpired wallet challenge | PASS |
| 33 | public profile excludes email and bio; CORS denies unlisted origins | PASS |
| 34 | all four GET lists are read-only, including repeat reads and foreign filters | PASS |
| 35 | task status requires real company/student relationship and rejects IDOR | PASS |
| 36 | worklog review is scoped, cannot self-approve and validates transitions | PASS |
| 37 | normalized private data is authenticated and tenant-scoped; public topics redact reports | PASS |
| 38 | certificate and chain metadata are fail-closed, with no fake proof | PASS |
| 39 | QR sessions reject invalid/expired/wrong student and consume once under concurrency | PASS |
| 40 | assigned mentor reads attendance and reviews worklog; unrelated mentor is denied | PASS |
| 41 | admin read remains available; sync without enabled chain reports unavailable, never success | PASS |
| 42 | rate limiting and CORS allowlist/readiness retain explicit failure states | PASS |
| 43 | invalid and structured filters cannot silently broaden data queries | PASS |


Lệnh đã chạy trongserver (base URI TEST và allowlist được đặt rõ trước khi chạy):

```powershell
$env:NODE_ENV='test'
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/web3_internship_test_phase1_final_20261031'
$env:MONGODB_URI_TEST_ALLOWLIST=$env:MONGODB_URI_TEST
$env:AI_SERVICE_URL_TEST='http://127.0.0.1:8002'
node --test --test-concurrency=1 test/*.test.js
```

Exit0:tests43,pass43,fail0; logacceptance-regression.log. Foundation21 test chạy source thật+Mongo thật trên TEST; hai fullflow tests dùng IPFS stub như trước, không phải CID pinned thật. Receipt validation test dùng ABI fixture; fake tx là input phải bị từ chối, không lưu làm proof. Error-safety dùng credential marker không thật và axios mock lỗi, không gọi Pinata.

## 3. AI5test

| Case | Kết quả |
| --- | --- |
| AI health labels TF-IDF, never BERT | PASS |
| empty/unrelated report zero: '' | PASS |
| empty/unrelated report zero: 'cooking bread oranges' | PASS |
| empty matching is zero with provenance | PASS |
| invalid AI request rejected422 | PASS |


`python -B .../test_ai.py` dùng FastAPI TestClient với source mới, AI_ENGINE=tfidf, không model download/network/pycache. Matching live của bộ TEST8002 được đối chiếu thêm qua browser và access log. AI cũ8001 không restart, không gán kết quả sửa cho process cũ. Không có benchmark BERT/quality dataset; các tiêu chí zero-score là policy conservative đã nêu, không tuyên bố metric khoa học hoặc tự động duyệt báo cáo.

## 4. Browser16case cuối

| Case | Kết quả | Chi tiết |
| --- | --- | --- |
| guest UI hides demo presets by default and does not mutate on initial mount | PASS | Đạt assertion qua browser/API/persistence |
| all five company tabs mount with no POST/PUT/PATCH/DELETE | PASS | Đạt assertion qua browser/API/persistence |
| dashboard uses real empty scoring rather than 85/88 fallback | PASS | Đạt assertion qua browser/API/persistence |
| JD form creates a real record; uncomputed matching has no fabricated80% | PASS | Đạt assertion qua browser/API/persistence |
| application button is explicitly disabled, never fake success | PASS | Đạt assertion qua browser/API/persistence |
| matching reaches actual TEST AI with explicit engine | PASS | Đạt assertion qua browser/API/persistence |
| task form preserves valid company-to-student assignment | PASS | Đạt assertion qua browser/API/persistence |
| company explicitly issues scoped QR session, with no simulated scanner | PASS | Đạt assertion qua browser/API/persistence |
| student dashboard retains zero counts, no90score and only own topic rows | PASS | Đạt assertion qua browser/API/persistence |
| student submits signed QR from UI; persistence has correct company and no GPS/chain claim | PASS | Đạt assertion qua browser/API/persistence |
| student can update assigned task through existing UI | PASS | Đạt assertion qua browser/API/persistence |
| student creates real worklog through existing UI | PASS | Đạt assertion qua browser/API/persistence |
| unknown certificate has no VERIFIED/ERC5192 badge and Web3 mount does not sync | PASS | Đạt assertion qua browser/API/persistence |
| known Topic without verifier stays unavailable, never verified | PASS | Đạt assertion qua browser/API/persistence |
| wallet-provider rejection leaves DB saved but chain failed, never minted/confirmed | PASS | Đạt assertion qua browser/API/persistence |
| new UI has no uncaught JavaScript exceptions | PASS | Đạt assertion qua browser/API/persistence |


Edge headless profile riêng; chỉ request5175/TEST API/8002, chặn font ngoài và RPC8545. Ví đăng nhập là Wallet ngẫu nhiên ký nonce off-chain; không ví thật, private key thật hoặc funds. Ca tx rejected dùng EIP-1193 provider giả lỗi có chủ đích: DB được lưu thật nhưng không gửi giao dịch, không tạo receipt hay hash giả. Không dùng ca này làm bằng chứng MetaMask/chain live.

Browser thực sự nhập form và xác minh persistence JD/task/worklog/QR trên TEST. Qua đủ5tab, mount không POST/PUT/PATCH/DELETE; GET không tăng record; số0/điểm chưa có đúng; unknown/known-without-verifier không badge; không uncaught JS exception. Không tuyên bố mobile đã sửa: redesign/responsive/a11y thuộc PHASE2.

Logs:browser-results-acceptance.json; ảnh local `transaction-failure-truthful.png`, `certificate-unknown.png`. QR test token trong artifact chỉ là phiên TEST ngắn hạn đã dùng; không đưa artifact chứa token vào source hoặc báo cáo công khai.

## 5. Build/lint/syntax và live smoke

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Build sau nhóm1,2,3,4,5 và release | PASS exit0 | Output mới trongclient/dist/phase1-* đượcignore |
| Lint cuối | PASS exit0,29warnings | Chưa xử lý toàn bộ warnings; không --fix |
| node --check server/src,test,scripts | PASS41/41 | Chỉ parse scripts seed, không thực thi chúng |
| git diff --check | PASS | Không staged/commit operation |
| Accepted-source live smoke | PASS | Health200, nonce stable, signaturelogin200, oversized413; chỉ TEST mới |
| Protected DB snapshot/hash/index | PASS | Ba DB cũ giống snapshot đầu; không thêm AttendanceSession vào gốc/demo |
| Solidity/EVM | NOT TESTED lại | Contract source/toolchain không đổi; compile2contract đã PASS ở audit trước; không deploy/tx |

Build JS khoảng576.37kB (gzip185.40kB), vẫn warning>500kB. PowerShell có thể ghi stderr chunk warning dưới NativeCommandError nhưng exit process0, không phải build failed.

```text
> client@0.0.0 build
> vite build --outDir dist/phase1-release

vite v8.3.4 building client environment for production...
transforming...
✓ 2062 modules transformed.
rendering chunks...
computing gzip size...
dist/phase1-release/index.html                   1.22 kB │ gzip:   0.71 kB
dist/phase1-release/assets/index-CvD4t5L8.css    4.55 kB │ gzip:   1.83 kB
dist/phase1-release/assets/index-D8v59hVF.js   576.37 kB │ gzip: 185.40 kB

npm.cmd : [plugin builtin:vite-reporter]
At line:2 char:284
+ ... MO='false'; npm.cmd run build -- --outDir dist/phase1-release *> ../c ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([plugin builtin:vite-reporter] :String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking:
https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 712ms
```

## 6. Warning và giới hạn còn lại

```text
> client@0.0.0 lint
> oxlint

src/components/DashboardView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'BrainCircuit' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:7:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'ExternalLink' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:21:10: warning eslint(no-unused-vars): Variable 'matchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:21:27: warning eslint(no-unused-vars): Variable 'setMatchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:55:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/Web3CertificateView.jsx:4:3: warning eslint(no-unused-vars): Identifier 'Award' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'ExternalLink' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:7:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:9:3: warning eslint(no-unused-vars): Identifier 'Cpu' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'FileCheck2' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:39:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/AttendanceView.jsx:4:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'Calendar' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'Sparkles' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'UserCheck' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:54:21: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/App.jsx:12:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/App.jsx:19:3: warning eslint(no-unused-vars): Identifier 'Filter' is imported but never used. help: Consider removing this import.
src/App.jsx:194:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/App.jsx:194:5: warning react-hooks(exhaustive-deps): React Hook useEffect has a missing dependency: 'fetchTopics' help: Either include it or remove the dependency array.
```


- Chưa thực hiện PHASE2: giao diện vẫn dùng thiết kế cũ; mobile overflow, design system, Light/Dark, accessibility và bundle splitting chưa hoàn thiện.
- Chưa có Application/CV file parser, đa-slot đúng nghĩa, check-out/giờ làm, admin/school/batch lifecycle, audit/notification đầy đủ (PHASE3).
- AI vẫn là TF-IDF/keyword với provenance, không BERT/risk classifier; chưa dataset/metrics phù hợp hoặc benchmark (PHASE4).
- Pinata thật và RPC/token verifier chưa cấu hình. Chứng nhận không tồn tại404; Topic có sẵn nhưng chưa verifier token trả503. Đây là fail closed đúng, không phải chức năng NFT/SBT đã hoàn thành (PHASE5).
- Chain listener còn các vấn đề payload ethers, processed/checkpoint/reorg và đồng bộ normalized records; đã mặc định tắt, không tự chạy khi mount. Receipt binding được kiểm bằng ABI fixture; live receipt chưa kiểm vì không deploy/tx/RPC.
- Cạnh tranh đa-collection/onChainId vẫn cần canonical model, unique/index/transaction hoặc outbox và kế hoạch migration riêng; không tự sửa dữ liệu hoặc index cũ.
- JWT còn ở localStorage; chưa có SIWE domain binding/CSP/kiểm thử xâm nhập đầy đủ. Không tuyên bố production-ready hoặc không còn lỗ hổng.
- Script seed gốc vẫn có thao tác dropIndex/dedupe hoặc DB hardcode; không chạy hoặc sửa seed ở PHASE1. Không dùng README seed trực tiếp lên dữ liệu cần giữ.


BLOCKED không được đổi thành PASS: Pinata upload/readback thật, live receipt/RPC, minted NFT/SBT, BERT/model evaluation. NOT TESTED: hardware/browser MetaMask thật, load/fuzz/reorg/production/UAT/Lighthouse. Không cộng các mock/unit vào bằng chứng external integration.

## 7. Bảo toàn và môi trường review

| Database bảo toàn | Collections | Indexes | Documents | Đối chiếu trước/sau |
| --- | --- | --- | --- | --- |
| web3_internship | 14 | 36 | 3 | SHA-256 nội dung + index list giống nhau |
| web3_internship_demo_20261030_2340 | 14 | 36 | 223 | SHA-256 nội dung + index list giống nhau |
| web3_internship_demo_20261030_2340_foundation | 14 | 36 | 66 | SHA-256 nội dung + index list giống nhau |



Frontend TEST review: **http://127.0.0.1:5175/** → API **http://127.0.0.1:57402/api**, AI TEST8002. Database review hiện tại: `web3_internship_test_phase1_bfd57eb7_bf91a33947e0`; nguồn được nạp lại sau bản vá cuối, health/login/nonce ổn định/413 live smoke đã đạt. Review DB mới, không seed mẫu để giả lập dữ liệu thật. Các DB TEST trước được giữ nguyên, không cleanup.

Frontend cũ5173/5174 đã tạm dừng để HMR không ghép UI mới với Backend cũ. MongoDB, Backend gốc5000/demo5001 và AI cũ8001 không restart; các Backend cũ **chưa nạp bản vá**, không dùng chúng làm bằng chứng PHASE1 đã rollout. Không nạp model/index mới vào gốc/demo. Edge headless/debug9224 đã đóng; các service TEST review còn chạy để kiểm tra, demo auth mặc định tắt.


Các lỗi trung gian giữ trong log:group3-permissions.log là lỗi hook do tên DB dài, bản recheck31PASS; browser-results.json có13PASS/1FAIL selector công cụ, các bản cuối16/16PASS. Không xóa dữ liệu để sửa test, không nới assertion business để thành PASS.

## PHASE 2 — kết quả kiểm thử thực tế

Ngày31/10/2026. **43/43 Backend +39/39 browser acceptance +4/4 browser polish PASS; build/lint PASS**. Không cộng lại5 AI test PHASE1 vào lượt này; chỉ matching qua AI TEST8002 được kiểm ở browser. PHASE1 trong phần trước là lịch sử riêng.

### Môi trường và guard

Không sửa server/test/helpers.js hoặc testEnvironment.js trong phase này. Guard vẫn bắt NODE_ENV=test, exact URI allowlist, localhost27017, prefix `web3_internship_test_phase1_...`, derived DB ngẫu nhiên/rỗng trước startup. Tên prefix PHASE1 là ràng buộc an toàn tái sử dụng; không đổi guard chỉ để đổi tên phase.

Browser test có guard riêng trước connect và yêu cầu topics rỗng trước tạo fixture. Review accepted DB `web3_internship_test_phase1_246664a9_397a9ca835d5`. Company/student đăng nhập bằng random ethers Wallet ký nonce thật; mentor/admin chỉ tạo fixture identity trong đúng DB TEST rồi xác thực chữ ký thật. Đây không phải self-register mentor/admin hoặc backdoor auth. Fixtures đề tài/JD/task/log/QR là dữ liệu TEST công khai, không kết quả AI/chain giả.

Browser không lưu token/private key trong result JSON, chỉ ghi method/path/status/assertion. Profile headless riêng, chặn request ngoài loopback TEST; không kết nối ví thật, gửi tx, seed hoặc drop/reset. Các database TEST cũ được giữ nguyên. Mock wallet reject được công bố là EIP-1193 failure fixture; không tính là tích hợp EVM thành công.

### Lệnh đã chạy

```powershell
# Backend regression: guard tạo DB worker riêng mới, không dùng DB gốc/demo
$env:NODE_ENV='test'
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/web3_internship_test_phase1_phase2_regression'
$env:MONGODB_URI_TEST_ALLOWLIST=$env:MONGODB_URI_TEST
$env:AI_SERVICE_URL_TEST='http://127.0.0.1:8002'
node.exe --test --test-concurrency=1 server/test/*.test.js

# Chỉ build vào output ignored mới, API được khóa vào TEST cho bản build này
$env:VITE_API_URL='http://127.0.0.1:57403/api'
$env:VITE_ENABLE_DEMO='false'
npm.cmd --prefix client run build -- --outDir dist/phase2-accepted
npm.cmd --prefix client run lint
```

Browser: `node.exe client/test/phase2-browser.cjs`, với NODE_ENV=test, PHASE2_TEST_META trỏ metadata của **Backend TEST run mới**, MONGODB_URI_TEST_ALLOWLIST khớp URI trong metadata và Edge headless9225/profile riêng. **Không chạy lại harness ghi trên review DB đã có fixture**: guard sẽ từ chối; cần bootstrap bằng helper trên run mới. Polish chỉ đọc dùng cùng TEST DB accepted; không reset để ép test PASS. Không tự thêm script package hoặc dependency.

### Kết quả từng nhóm

| Browser acceptance PHASE2 | Kết quả |
| --- | --- |
| Guest: Light mặc định, demo ẩn, không mutation khi mở trang | PASS |
| Guest: Auth dialog Escape và trả focus | PASS |
| company: dashboard đúng số liệu API, không KPI giả | PASS |
| company: menu vai trò và mục chưa có Backend trung thực | PASS |
| company: 5 màn hình, 320/375/768/1024/1440px, không tràn trang/auto-write | PASS |
| company: Light/Dark và preference sau reload | PASS |
| student: dashboard đúng số liệu API, không KPI giả | PASS |
| student: menu vai trò và mục chưa có Backend trung thực | PASS |
| student: 5 màn hình, 320/375/768/1024/1440px, không tràn trang/auto-write | PASS |
| student: Light/Dark và preference sau reload | PASS |
| mentor: dashboard đúng số liệu API, không KPI giả | PASS |
| mentor: menu vai trò và mục chưa có Backend trung thực | PASS |
| mentor: 5 màn hình, 320/375/768/1024/1440px, không tràn trang/auto-write | PASS |
| mentor: Light/Dark và preference sau reload | PASS |
| admin: dashboard đúng số liệu API, không KPI giả | PASS |
| admin: menu vai trò và mục chưa có Backend trung thực | PASS |
| admin: 5 màn hình, 320/375/768/1024/1440px, không tràn trang/auto-write | PASS |
| admin: Light/Dark và preference sau reload | PASS |
| Sidebar thu gọn/mở rộng giữ điều hướng và keyboard | PASS |
| Bảng: tìm/lọc/phân trang hoạt động trên API scoped | PASS |
| Modal JD: validation, Escape, focus trap; không ghi khi mở/hủy | PASS |
| JD: form hiện có ghi đúng TEST, tìm kiếm và Apply disabled | PASS |
| AI matching gọi service thật, hiển thị engine và không lưu CV giả | PASS |
| Company task form: dữ liệu thật và assignee giữ nguyên | PASS |
| Company tạo QR có chủ đích trên TEST | PASS |
| Student không có quyền tạo đề tài/JD/task | PASS |
| Student cập nhật task thật qua UI | PASS |
| Student nhật ký qua UI lưu đúng TEST | PASS |
| Student check-in thật; không claim GPS/chain | PASS |
| Web3 unknown404 và known503: không verified hoặc tự sync | PASS |
| Thông báo chưa có Backend: không unread giả/auto-write | PASS |
| Keyboard mobile drawer: Escape, focus restore, chuyển trang đóng drawer | PASS |
| Tên truy cập cho input/select/textarea và button trong các trang | PASS |
| Dữ liệu đã ghi: responsive cho JD/task/nhật ký/lịch sử trên mobile | PASS |
| Loading skeleton dùng request thật chờ phản hồi; không số liệu mẫu | PASS |
| Lỗi mạng dashboard hiển thị error; retry tải API thật | PASS |
| Contrast semantic tokens >=4.5:1 trong cả Light/Dark | PASS |
| Wallet reject vẫn giữ DB saved/chain failed; không mint giả sau code splitting | PASS |
| Không uncaught JavaScript exception hoặc request ngoài loopback TEST | PASS |
| Ba subtab có aria-pressed và nền primary đủ contrast | PASS |
| Polish: năm màn hình nonempty, hai theme, mobile/tablet/desktop không overflow | PASS |
| Modal KPI mobile: labels, không overflow hoặc ghi khi mở/hủy | PASS |
| Polish không mutation, không tăng business records, không JS exception | PASS |


100 lượt role×page×width cho student/company/mentor/admin và dashboard/topics/cv-jd/attendance/web3 tại320/375/768/1024/1440px: không page overflow, không POST/PUT/PATCH/DELETE hoặc tăng business records khi điều hướng. Polish50 lượt page×width×theme trên dữ liệu có sẵn cũng đạt. Bảng rộng có vùng cuộn riêng; không dùng overflow-x:hidden để che lỗi trang.

Form JD/task/log/check-in lưu thật qua UI và đối chiếu Mongo TEST. Bảng dashboard search/filter/pagination thực; modal Escape/focus trap/restore; sidebar keyboard Enter/collapse; mobile drawer đóng và focus main; labels inputs được kiểm. Skeleton giữ request thật tạm chờ rồi nhận phản hồi thật; error/retry dùng network failure có chủ đích, không response200 giả.

### Contrast semantic tokens

| Theme | Foreground | Background | Ratio |
| --- | --- | --- | --- |
| light | text-main | bg-card | 15.97 |
| light | text-muted | bg-card | 6.36 |
| light | text-dim | bg-card | 4.92 |
| light | text-main | bg-dark | 15.05 |
| light | text-muted | bg-dark | 5.99 |
| light | text-dim | bg-dark | 4.63 |
| light | primary-light | primary-soft | 5.45 |
| light | accent-emerald | success-bg | 5.21 |
| light | accent-amber | warning-bg | 6.84 |
| light | accent-rose | danger-bg | 5.91 |
| light | button-white | primary | 6.29 |
| dark | text-main | bg-card | 15.24 |
| dark | text-muted | bg-card | 10.12 |
| dark | text-dim | bg-card | 7.86 |
| dark | text-main | bg-dark | 16.67 |
| dark | text-muted | bg-dark | 11.07 |
| dark | text-dim | bg-dark | 8.6 |
| dark | primary-light | primary-soft | 7.29 |
| dark | accent-emerald | success-bg | 7.91 |
| dark | accent-amber | warning-bg | 10.43 |
| dark | accent-rose | danger-bg | 7.57 |
| dark | button-white | primary | 6.29 |


Tối thiểu4,63:1 trong22 cặp đo. Sau đó nền subtab thống nhất primary và chữ trắng được kiểm thêm từ computed style; aria-pressed thể hiện lựa chọn. Không đồng nghĩa chứng nhận WCAG toàn bộ sản phẩm; chưa screen reader thủ công/Lighthouse/axe, mọi nội dung tự do hoặc mọi tổ hợp trạng thái.

### Build / lint / secret scan

```text
> client@0.0.0 build
> vite build --outDir dist/phase2-accepted

vite v8.3.4 building client environment for production...
transforming...
✓ 2068 modules transformed.
rendering chunks...
computing gzip size...
dist/phase2-accepted/index.html                                0.92 kB │ gzip:   0.59 kB
dist/phase2-accepted/assets/index-DJg5Hvkk.css                24.42 kB │ gzip:   6.04 kB
dist/phase2-accepted/assets/book-open-B2SZzdAt.js              0.31 kB │ gzip:   0.24 kB
dist/phase2-accepted/assets/rolldown-runtime-hePW80VL.js       0.71 kB │ gzip:   0.42 kB
dist/phase2-accepted/assets/DashboardView-BMNdwd_K.js          7.92 kB │ gzip:   2.95 kB
dist/phase2-accepted/assets/Web3CertificateView-gOyj_64p.js   10.51 kB │ gzip:   3.59 kB
dist/phase2-accepted/assets/CvJdView-JVDnWCJ2.js              14.14 kB │ gzip:   4.26 kB
dist/phase2-accepted/assets/AttendanceView-DWJvjo17.js        16.48 kB │ gzip:   4.57 kB
dist/phase2-accepted/assets/index-Bwjc2KAW.js                290.53 kB │ gzip:  88.08 kB
dist/phase2-accepted/assets/lib.esm-DXGi7BZN.js              379.90 kB │ gzip: 142.14 kB

✓ built in 293ms
```

Lint exit0, không warning/error; node --check browser harness PASS; git diff --check PASS. Build đầu lỗi cú pháp escape do script chuyển inline style, đã sửa trước acceptance, log group1-build.log được giữ. Không sửa API hoặc nới assertion nghiệp vụ để PASS.

Browser run1:30/34 PASS; run2:36/39 PASS. Nguyên nhân: click chương trình chưa focus trigger; CDP Enter thiếu text nên chưa phát sinh click; reload chờ nhầm document cũ; bộ đo màu chưa mở rộng #fff. Đã xác minh bằng event trace rồi sửa harness: focus giống click thật, Enter có text/native key code, reload đợi performance.timeOrigin mới, chuẩn hóa hex3. Acceptance39/39 giữ đủ assertion, thêm5case loading/error/contrast/wallet rejection/nonempty responsive; polish4/4 kiểm bản nguồn sau chỉnh aria/labels cuối. Tất cả logs FAIL và JSON run1/run2 còn nguyên.

Đã bỏ remote fonts/preconnect và nhãn BERT sai trong HTML. Quét source không có binding JWT_SECRET/Pinata/private key; kiểm10file HTML/CSS/JS build không thấy literal JWT hoặc PRIVATE KEY PEM, target TEST57403, không font ngoài. So khớp trực tiếp với secret Windows chưa thực hiện (`knownJwtSecretCompared=false`); đây là kiểm tra source/pattern, không DLP/pentest hoặc bảo đảm mọi secret có thể có. Không ghi/in giá trị secret.

### Evidence và bảo toàn

Evidence ignored `contracts/node_modules/.cache/phase2-20261031/`: backend-regression.log, browser-acceptance.log, browser-results.json, browser-polish-accepted.log/browser-polish.json, build-accepted.log, lint-final.log, release-check.json, protected-before/after.json, integrity-final.json và ảnh15 màn hình/trạng thái. Script browser có trong client/test để tái lập; không xem ảnh/fixture là bằng chứng dịch vụ blockchain thật.

| Database bảo toàn | Collections | Indexes | Documents | Đối chiếu |
| --- | --- | --- | --- | --- |
| web3_internship | 14 | 36 | 3 | Nội dung SHA-256 và danh sách index không đổi |
| web3_internship_demo_20261030_2340 | 14 | 36 | 223 | Nội dung SHA-256 và danh sách index không đổi |
| web3_internship_demo_20261030_2340_foundation | 14 | 36 | 66 | Nội dung SHA-256 và danh sách index không đổi |


Runtime review: **http://127.0.0.1:5175/** → **http://127.0.0.1:57403/api** → `web3_internship_test_phase1_246664a9_397a9ca835d5`; AI TEST8002. Frontend/Backend TEST trả HTTP200, Mongo connected. Backend TEST PID2316; chỉ bộ TEST này nạp source đã kiểm. Khách xem công khai; demo auth tắt, không có tài khoản mẫu/backdoor đăng nhập. Các tài khoản browser là ví ngẫu nhiên TEST, không ví hoặc tiền thật.

Backend gốc5000/demo5001 và AI cũ8001 không restart. FE5173/5174 vẫn dừng. Không dùng Backend cũ làm bằng chứng bản vá đã rollout; không mở UI mới với API5000/5001 để thử nghiệp vụ. Backend review PHASE1 cũ57402 được giữ, không phải API của PHASE2. Edge headless riêng/debug9225 đã đóng sau test; các service review cần thiết vẫn chạy.

### BLOCKED / NOT TESTED và lỗi còn lại

- Chưa có Backend hoàn chỉnh cho Application/ứng viên, lưu/upload/parser CV, quản lý tài khoản/phân quyền/doanh nghiệp/sinh viên, batch, notification/audit, cảnh báo rủi ro và giờ làm/check-out. Các mục liên quan hiển thị NOT IMPLEMENTED hoặc hành động bị khóa; không toast thành công giả.
- AI vẫn là TF-IDF/fallback có nguồn; không BERT hoặc bộ phân loại rủi ro. Matching browser gọi AI TEST thật, không phải benchmark mô hình.
- Pinata/RPC/token verifier thật chưa được cấu hình; chứng nhận unknown404/known503, không badge VERIFIED. QR vẫn nhập token phiên, chưa encoder/camera/GPS hoặc attendance proof blockchain.
- Không có EVM/deploy/MetaMask hardware/cloud integration/UAT/Lighthouse hoặc kiểm định WCAG đầy đủ ở PHASE2. Contrast chỉ đo các cặp semantic tokens được liệt kê; chưa kiểm mọi nội dung tự do/trạng thái hệ điều hành.
- Auth/nonce/JWT policy giữ nguyên PHASE1; localStorage JWT và SIWE domain/CSP hardening vẫn là khoảng thiếu đã ghi. Menu theo vai trò không thay kiểm quyền Backend.
- Search/filter/pagination của bảng và JD chạy trên dữ liệu API đã tải, chưa server pagination/global search. Biểu đồ chỉ phản ánh các đề tài đã tải, không tạo chuỗi thời gian hoặc xu hướng giả.
- ethers chunk vẫn khoảng380kB khi người dùng thao tác ví/RPC; đã tách tải, không phải giảm tổng dung lượng thư viện. Không cài dependency hoặc đổi framework.
- Seed cũ vẫn nguy hiểm/hardcode và không chạy. Không áp schema/migration/model mới vào DB gốc/demo; rollout vào đó là công việc riêng.

Dừng sau PHASE2; không tự triển khai PHASE3.

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

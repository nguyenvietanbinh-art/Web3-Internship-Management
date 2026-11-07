# Kết quả hoàn thiện luồng theo vai trò — 07/11/2026

## Phạm vi và khôi phục tiến độ

Tiếp tục yêu cầu A–K trong attachment `6d8e117d-2226-4da5-be02-8a230eeee2f0`, mục L xử lý hết chỉ tiêu, mục M chủ động chuẩn bị dữ liệu, và yêu cầu khôi phục sau gián đoạn. Branch `branch_1`, HEAD `8aa463b` giữ nguyên. Không commit/push/merge/reset/clean, không cài hoặc nâng dependency, không tạo `.env`.

Bốn file cuối trước gián đoạn được đối chiếu lại: `docs/QUOTA_REFUND_DESIGN.md`, `server/src/workflow/models.js`, `applicationQuota.js`, `service.js`. Lúc tiếp tục, đây mới là phần xử lý transaction ban đầu, chưa nối cách đếm lượt/UI và chưa kiểm thử. Các thay đổi báo cáo, kỹ năng, classifier, rubric và dữ liệu đã có được giữ lại, không viết lại dự án hoặc chạy lại script bổ sung dữ liệu vào database hiện hành.

Đã kiểm kê toàn bộ working tree, tracked diff và untracked; không coi toàn bộ thay đổi chưa commit là của lượt tiếp tục này. Các báo cáo lịch sử chứa kết quả theo thời điểm và cổng khác nhau; kết quả hiện hành ở tài liệu này và hướng dẫn `RUN_FULL_WORKFLOW.md`.

## Kết quả theo vai trò

| Vai trò | Đã hoàn thiện/giữ lại | Kiểm chứng hiện tại |
|---|---|---|
| Sinh viên | Tài khoản nhà trường cấp; CV/kỹ năng/GPA; kỳ được cấp; tìm đề tài theo tên/nội dung/công ty, lọc kỹ năng/doanh nghiệp, phân trang/xóa lọc; gợi ý theo CV và yêu cầu; trạng thái đã có đề tài; lịch sử và hạn mức sau hoàn lượt; báo cáo của mình | API + browser; TF-IDF/SBERT thật; IDOR; không tự nộp/điểm danh khi xem |
| Doanh nghiệp | Đề tài/yêu cầu/chỉ tiêu theo kỳ; ứng viên và CV snapshot; xét nhận; sinh viên chính thức; công việc/nhật ký/chấm công/đánh giá. Không còn menu hoặc API xếp hạng AI | API nghiệp vụ + browser; hai endpoint ranking trả 403 kể cả có CV hợp lệ |
| Giảng viên | Sinh viên hướng dẫn; đọc toàn văn báo cáo; phiếu 7 tiêu chí; chấm trước có căn cứ/giới hạn; sửa rồi xác nhận; bài tập chấm lại độc lập cho mẫu đã hoàn tất; không có khu vực liên kết/kiểm tra mạng ví cá nhân | API scope, rubric/Python tests, browser đọc/chấm trước; không POST điểm chính thức chỉ vì xem hoặc thử chấm |
| Nhà trường | Kỳ/quyền tham gia/phân công và nhắc việc hiện có; giữ gợi ý phân bổ đúng điều kiện; báo cáo đầy đủ liên kết sinh viên/MSSV–kỳ–đề tài–công ty–giảng viên, tìm/lọc/phân trang; không yêu cầu ví cá nhân | API/regression bảy ngày; browser thông tin báo cáo; Admin xác minh SBT thật không kết nối ví cá nhân |

Sinh viên/doanh nghiệp vẫn có phần ví cho nghiệp vụ Web3. Phân quyền không phụ thuộc ẩn menu. Người ngoài phạm vi không được lấy báo cáo, artifact hoặc CV snapshot bằng cách đổi ID.

## Lỗi đã sửa

1. **Lượt đã nộp bị dùng đồng thời làm lịch sử và hạn mức:** giữ nguyên `usedOpportunities`, thêm danh sách hoàn lượt; giới hạn ba tính trên lịch sử trừ các lượt đã hoàn. Unique application vẫn chặn nộp lại cùng cơ hội.
2. **Chỗ cuối chưa kết thúc hồ sơ chờ:** nhận sinh viên, tăng counter một lần, đóng opportunity, kết thúc hồ sơ `closed_full`, thu hồi quyền xem CV và hoàn lượt nằm cùng transaction. Có lý do/thời điểm/lịch sử, retry không hoàn lần hai. Hồ sơ rút/từ chối/đã có nơi nhận, đề tài khác và kỳ khác không bị hoàn nhầm.
3. **Có thể mở lại đề tài thiếu điều kiện:** sửa opportunity trong transaction; tăng capacity/hủy tiếp nhận không tự mở; mở lại cần đúng doanh nghiệp, phiên bản, còn chỗ, trong cửa sổ ứng tuyển và lý do. GET không sửa dữ liệu cũ đã hết chỗ.
4. **Công cụ AI doanh nghiệp còn hiện:** gỡ menu và chặn màn hình trực tiếp; hai API cũ trả `FEATURE_NOT_AVAILABLE`/403. Matching legacy của sinh viên cũng bị chặn khi workflow theo kỳ bật để không lấy JD ngoài kỳ qua đường cũ.
5. **Tìm cơ hội chỉ tìm tiêu đề và tải một trang lớn:** thêm tìm nội dung/công ty, lọc kỹ năng và phân trang server. Không mở rộng phạm vi kỳ được cấp.
6. **Báo cáo Admin thiếu ngữ cảnh:** thêm context theo quan hệ thật trong DB, tìm/lọc/phân trang; nút xem toàn văn và tải attachment hợp lệ có kiểm scope.
7. **Nộp báo cáo mới có thể làm mất bản hiện hành nếu insert lỗi:** workflow replica set dùng transaction cho supersede + insert; test fault-injection xác nhận bản cũ không thay đổi. Luồng legacy không dùng replica set giữ hành vi cũ, không tuyên bố đã có atomic replacement ở chế độ đó.
8. **Đổi chức năng mất lựa chọn/bộ lọc/vùng mở:** state theo phiên tách tài khoản/vai trò; URL Back/Forward; picker kiểm lại scope; kết quả phân tích chỉ giữ trong RAM; draft nhạy cảm không vào storage, hỏi trước khi bỏ; không replay mutation/modal.

## File và API

### Bổ sung/sửa trong lượt tiếp tục

- Backend workflow: `models.js`, `applicationQuota.js`, `service.js`, `queries.js`, `routes.js`, `notifications.js`, `ai.js`; guard `config/workflowTestGuard.js` chỉ thêm chính xác database QA.
- Báo cáo: `core/reports.js`, mới `core/reportContext.js`, `core/web3.js` (DTO source và download attachment có quyền); `core/ai.js` ngừng ranking doanh nghiệp và chặn matching legacy trong workflow.
- Frontend: `App.jsx`, `AppShell.jsx`, mới `components/viewState.jsx`, `viewStateStore.js`; `business/CoreBusinessView.jsx`, `AiPage.jsx`, `Shared.jsx`, `Reports.jsx`, `Time.jsx`, `Work.jsx`, mới `reports/ReportAttachments.jsx`; workflow `AdminPage.jsx`, `ApplicationInbox.jsx`, `CompanyPages.jsx`, `Dashboard.jsx`, `MyInternship.jsx`, `TopicTemplates.jsx`, `constants.js`.
- Test/runtime: mới `server/test/application-quota.unit.test.js`, `role-workflow.integration.test.js`, `client/test/role-workflow-browser.cjs`, `server/scripts/start-role-qa.cjs`; bổ sung `process.chdir(root)` vào launcher đã có `contracts/scripts/workflow-hardhat.cjs` để chạy từ root. Giữ cấu hình đã có `hardhat.workflow.cjs` và các đường dẫn cache/artifacts riêng. Cập nhật `server/test/workflow.integration.test.js`, `core-ai.test.js` cho chính sách mới và TEST database mới.
- Tài liệu mới: `ROLE_WORKFLOW_COMPLETION.md`, `REPORT_ACCESS_MATRIX.md`, `UI_STATE_PERSISTENCE.md`, `RUN_FULL_WORKFLOW.md`; cập nhật README, tiến độ, test results, ma trận nghiệm thu và hướng dẫn kiểm thử đầy đủ.

Các file đã có trước lượt tiếp tục như `reportPractice.js`, `skillComparison.js`, `allocationSuggestions.js`, `ReportAnalysisResult.jsx`, `ReviewForm.jsx`, `CompletedReportPractice.jsx`, module Python chấm trước/classifier, datasets và scripts dữ liệu được giữ nguyên hoặc chỉ nối thêm vào luồng hiện tại. Xem Git status để kiểm kê đầy đủ, không chỉ `git diff --stat` vì file mới chưa tracked không xuất hiện ở stat.

API chính thay đổi: GET `core/my/internships`, `.../:id/opportunities` thêm quota/refund/search; PATCH `core/school/opportunities/:id` thêm lý do mở lại; GET `core/reports` thêm context/filter; GET `core/web3/artifacts/:id/file` mới; hai POST `core[/school]/ai/rank-applicants` ngừng cấp chức năng. Các trường cũ được giữ, trạng thái `closed_full` là bổ sung; client cũ cần cập nhật nhãn trạng thái.

## Dữ liệu và bảo toàn

**Mọi test ghi trong đợt tiếp tục dùng database TEST riêng. Không bổ sung hoặc sửa bản ghi nghiệp vụ ở database hiện hành.**

- QA workflow: `internova_role_qa_20261107`, Mongo local 27018/replica set `internovaTestRs`, URI exact allowlist. Chỉ khởi tạo collection/index sau khi xác minh DB mới rỗng; lần sau cần marker `qa_safety_marker`. Không dùng wildcard để cho phép tên database tùy ý.
- Regression legacy: harness tạo database mới `web3_internship_test_phase1_f06ef8ef_<run>` trên 27017 từ allowlist riêng, từ chối DB đã có dữ liệu. Giữ nguyên các database TEST này sau test, không drop/cleanup.
- QA workflow sau các lần thử và retest: **1.379 document**, gồm 177 users, 120 students/CVs, 126 topics, 461 opportunities, 124 enrollments, 105 applications, 32 assignments, 21 business reports, 9 tasks, 6 work logs, 4 work sessions và 4 chain operations; các collection còn lại là account/fixture/notification/metadata. Đây là tổng của nhiều run ID, không phải số chức năng hoặc bộ nhãn chuyên gia. File đếm: `.cache/role-workflow-qa-20261107/data-summary.json`.
- Đợt fixture đang xuất tài khoản có bốn hồ sơ kỹ năng khác nhau, trong đó Nguyễn Hoàng Nam có Go/Gin/PostgreSQL, được kiểm chứng đáp ứng đủ đúng hai trong năm đề tài của kỳ riêng; nhóm chỉ Go, nhóm nhiều kỹ năng khác ngành và nhóm công cụ văn phòng không được ép điểm cao.
- Ba bài `[Tổng hợp]` kỳ cũ: đủ cấu trúc, thiếu kết quả/minh chứng, sơ lược; nội dung tự tạo, không có link sản phẩm hoặc giờ làm giả. Các review/điểm của fixture chốt là tình huống giả định được ghi nguồn, **không phải giảng viên thật đã xác nhận**, không được xuất làm nhãn chuyên gia. Form practice không sửa các bản ghi này.
- Một artifact TEST ở trạng thái `failed` để thử quyền đọc/tải. Không tạo CID hoặc trạng thái IPFS verified giả.
- Lịch sử CV ứng tuyển được giữ theo snapshot, không cập nhật theo CV mới.

Đã đối chiếu **nội dung BSON theo hash và toàn bộ indexes**, trước/sau regression + restart:

| Database được bảo toàn | Documents | Kết quả |
|---|---:|---|
| `web3_internship` | 3 | Không đổi |
| `web3_internship_demo_20261030_2340` | 223 | Không đổi |
| `web3_internship_demo_20261030_2340_foundation` | 66 | Không đổi |
| `internova_demo_cunhan_kysu_20261107` | 1.712 | Không đổi |

Snapshot local: `contracts/node_modules/.cache/workflow-combined-20261107/role-preserved-before.json` và `role-preserved-after.json`. Không chạy migration/schema/index backfill trên các DB này. Các trường refund mặc định rỗng khi đọc bản ghi cũ; không cập nhật ngầm bằng GET.

Phương án phục hồi: dữ liệu bảo toàn không cần restore vì không đổi. QA có run ID/marker/history và credential file local; không tự xóa để làm lại. Không chạy code cũ tính toàn bộ lịch sử là hạn mức sau khi có refund; cần dừng ghi và đối chiếu dấu hoàn/lịch sử trước khi rollback phiên bản. Không xóa trường để che kết quả.

## Kiểm thử thực tế

| Nhóm | Kết quả cuối | Phạm vi |
|---|---|---|
| Lint/build Frontend | PASS, lint 0 error/0 warning | Vite 8.3.4; output `client/dist` được ignore; không cài thêm |
| Integration mới | **12/12 PASS** | Last-seat race/refund/retry/rollback, kỳ khác, withdrawn/rejected, scope báo cáo/file, insert failure, search, cohort hai full matches, closed practice |
| Workflow regression + SBT thật | **14/14 PASS** | Tài khoản/roles, ứng tuyển/nhận/phân công, bảy ngày, task/log/time/report, NLP, wallet signature, local SBT |
| Unit Backend liên quan | **18/18 PASS** | Skills, allocation, report role/practice, guards, receipt adapter, quota/schema |
| Legacy nghiệp vụ/bảo mật | **51/51 PASS** | 8 test files accounts/placements/work-time-reports/edge cases/security/CV download/private-IPFS/GPS |
| AI API regression | **10/10 PASS** | BERT/TF-IDF thật, report, doanh nghiệp bị chặn, zero-write snapshots, timeout 15s không chặn health |
| Unit Frontend | **20/20 PASS** | Rubric, form promise, session race, file/error handling, report tasks/content |
| Python | **34 PASS, 1 SKIP** | NLP/training/calibration/classifier/chấm trước; bài inference opt-in được kiểm riêng qua API thật |
| Smart contract | **9/9 PASS** | EVM local thật, quyền ghi, replay, mint uniqueness, ERC5192 không chuyển nhượng |
| Browser bốn vai trò | **16/16 PASS** | Desktop/mobile, theme, role menu, báo cáo/scoped read, search/Back/Forward/reload, logout isolation, BERT thật, giữ kết quả/vùng mở, practice, unsaved guard, Admin verify SBT, 0 uncaught exceptions |

Các con số là test case/nhóm kiểm tra, không phải số chức năng sản phẩm. Không cộng những lần retest thành nhiều bằng chứng độc lập. Không chạy `npm test` mù trên database gốc.

Bằng chứng browser cuối: `contracts/node_modules/.cache/role-workflow-qa-20261107/browser-1794008546763/results.json` và ảnh cùng thư mục. Bản có thể xem cùng source tại `docs/evidence/role-workflow-20261107/final/`. Các thư mục browser trước giữ lại kết quả FAIL ban đầu; lỗi harness CDP trả DOM object, hoặc chọn option trước khi danh sách tải xong đã được sửa rồi retest, không sửa Backend để né test.

Bản bằng chứng đã kiểm tra không chứa credentials, có thể xem cùng source: [docs/evidence/role-workflow-20261107](evidence/role-workflow-20261107/README.md). Kiểm kê Git đầy đủ tại file local `contracts/node_modules/.cache/role-workflow-qa-20261107/git-status-final.txt`.

Integration log: `.../role-workflow-qa-20261107/integration-final.log`; workflow/SBT log `workflow-sbt-final.log`; receipt/token evidence `sbt-qa-result.json`. Fault-injection tạo HTTP500 có chủ đích, sau đó xác minh report cũ không đổi; không phải lỗi 500 ngoài ý muốn được che đi. Retest race cũ đổi kỳ vọng từ 409 sang 404 vì hồ sơ thua đã đóng và thu hồi quyền; đồng thời bắt buộc kiểm `closed_full` và dấu hoàn lượt.

## Blockchain thực sự đã kiểm chứng

QA RPC `http://127.0.0.1:18546`, chain ID **31337**, contract `0x5FbDB2315678afecb367f032d93F642f64180aa3`. Hardhat 18545 cũ giữ nguyên. Không deploy public/testnet/mainnet, không dùng tài sản/private key thật.

| Bước | Transaction hash |
|---|---|
| Deploy | `0x51813c7c0b001b10e3d2bebef69f9dc5baff8b93297e959725cf6c8ec02a22f8` |
| Báo cáo | `0xccd5f8686b59f06ba643ed173c24edaf9b7bbce8fd4cf9f5623ef624a06ff6d5` |
| Giờ làm | `0xc459a61cfdde6aeeb64d94705f759b3b211a02ee845431b1deb54e7ac84b4491` |
| Hoàn tất | `0x9275b5f27e5c6d8df237bf19c3bcdfd0bf1a7025841dcfd793d014fcf12a09d0` |
| Mint | `0x4921b0953cf1a92fe8a44c8086c70d60f8435b856aef54b0dedb9770674b8f31` |

Đo thực **62.214 ms**, duyệt 1 phút TEST; đây là thời gian kiểm thử, không phải bằng chứng lao động của người thật. Certificate token ID **1**, `verified=true`, `locked=true`; mint retry trả đúng giao dịch đã có. Browser Admin xem badge xác minh sau khi Backend đối chiếu chain, không yêu cầu ví cá nhân.

Chain local không bền qua reboot. Chain reset làm metadata/receipt cũ không khớp; hệ thống phải trả chưa xác minh, không giữ badge xanh bằng dữ liệu MongoDB cũ.

## Runtime, Git và nghiệm thu

- Website dữ liệu hiện có: **http://localhost:5188**, Backend57418 đã nạp source mới, health200. Dữ liệu 1.712 document giữ nguyên.
- Website TEST để tự thử: **http://localhost:5189**, Backend57419, QA DB riêng, AI8003, RPC18546; health/trang tĩnh HTTP200. Giữ service cần thiết chạy, không auto-start Windows.
- QA login local: `contracts/node_modules/.cache/role-workflow-qa-20261107/manual-login-qa.txt`; file này và `accounts.json` đã xác minh bị Git ignore. Không đưa mật khẩu vào báo cáo.
- Branch/HEAD không đổi; working tree có cả thay đổi trước và sau gián đoạn, chưa commit/stage. Không phục hồi stash, không xóa untracked; `git diff --check` đạt (có thông báo CRLF của Git).

## Còn BLOCKED / PARTIAL / NOT TESTED

- **BLOCKED:** Pinata live/upload/readback và tải tệp thật đã xác minh từ Pinata thiếu credentials/khóa/cấp phép external upload; adapter tests không thay live integration. Không yêu cầu người dùng cung cấp secrets qua chat.
- **PARTIAL:** chấm trước là độ đầy đủ nội dung và dữ liệu tiến độ, chưa xác minh sản phẩm/chất lượng thật. Cảnh báo TF-IDF + Logistic Regression chỉ thử trên dữ liệu tổng hợp; chưa có nhãn giảng viên độc lập, chưa công bố độ tin cậy ngoài thực tế hoặc fine-tuned BERT classifier.
- **NOT TESTED:** camera/GPS/MetaMask thao tác tay trên thiết bị thật; browser headless không chứng minh quyền phần cứng hay an toàn ví thật. Algorithm/signature/replay đã có test riêng.
- **NOT TESTED:** chuyển tiền hỗ trợ qua toàn bộ UI/API; SBT PASS không chứng minh tính năng trả hỗ trợ. Không dùng tiền thật.
- **PARTIAL:** context báo cáo hiện tra toàn bộ phân công trong scope rồi mới phân trang report; đúng phạm vi nhưng có thể cần aggregation/index tối ưu khi dữ liệu rất lớn. Không tự thêm index vào DB gốc để tối ưu thử.
- **Giới hạn:** requirements lấy từ Topic hiện tại; chưa có snapshot kỹ năng theo từng phiên bản opportunity. Đã giữ CV snapshot, không viết lại dữ liệu cũ. Cần thiết kế riêng trước khi đổi cách version yêu cầu.
- **NOT TESTED:** tải/hiệu năng sản xuất, audit toàn bộ dependency mới nhất, deploy cloud, khôi phục sau sự cố thật. Không tuyên bố production-ready hoặc đạt 100% đề cương.

Hướng dẫn tự chạy và kiểm tra theo thứ tự: [RUN_FULL_WORKFLOW.md](RUN_FULL_WORKFLOW.md). Quyền báo cáo: [REPORT_ACCESS_MATRIX.md](REPORT_ACCESS_MATRIX.md). State và bảo mật: [UI_STATE_PERSISTENCE.md](UI_STATE_PERSISTENCE.md).

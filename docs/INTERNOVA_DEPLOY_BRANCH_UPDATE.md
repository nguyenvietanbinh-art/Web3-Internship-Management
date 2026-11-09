# Cập nhật branch deploy Internova — 09/11/2026

Target: `deploy/internova-cloud-20261108`. Worktree tích hợp riêng dựa trên remote `7960173`; workspace `branch_1` và các thay đổi chưa commit của người dùng giữ nguyên. Không thao tác Cloud hoặc database.

## Phạm vi

Tích hợp UI theo vai trò, hồ sơ ở Tổng quan, CV upload từ máy, hiển thị thứ hạng đối chiếu, tìm sinh viên, báo cáo/bổ sung/chấm điểm, chấm công, chứng nhận theo tài khoản và module custody/journal. Giữ nguyên Dockerfile, API cùng origin `/api`, Atlas policy, CORS Render, PORT, static SPA và bản sửa QR/GPS của nhóm.

Xung đột được xử lý theo chức năng ở Web3Page và core/web3: giữ secure-context camera/GPS, chống gửi trùng/đổi sinh viên, giữ QR và encrypted upload dùng business environment guard, blockchain dùng guard riêng và Admin-only. Không đưa yêu cầu liên kết ví trở lại. AdminCertificatePage nâng cấp từ commit local6e29330 được tích hợp sau khi xác nhận remote file giống merge-base. Không chép đè script exportdatabase hoặc dữ liệu của commit đó.

## Kiểm tra trước push

| Kiểm tra | Kết quả |
|---|---|
| Frontend lint | PASS, không warning cuối |
| Frontend production build VITE_API_URL=/api | PASS |
| Syntax toàn bộ server/src | PASS |
| Cloud/QR/journal/search/email/binding tests |69 PASS |
| Custody crypto/store và password-reset tests |28 PASS |
| Package/lock client+server | PASS, không thay dependency |
| DB/RPC Cloud thực, browser bốn vai trò Cloud | NOT TESTED, không truy cập hoặc restart Cloud |
| Docker image build trên máy này | NOT TESTED; Dockerfile nhóm được giữ nguyên |
| AI model inference/cloud metrics | NOT TESTED; không đặt model nặng lên RenderFree |
| Blockchain ghi/mint và fullnode recovery | BLOCKED; không bật trên Cloud |
| GitHub workflow/checks | Không có file workflow trong worktree; kết quả checks phíaGitHub chưa xác minh |

Unit router/policy tests dùng mocks có công bố, không thay bằng chứng tích hợp thật.97test không chứng minh mọi nghiệp vụ Cloud đã nghiệm thu.

Không stage `.env`, `.team`, khóa, DBdump, audit private, runtime/cache, raw transaction journal, tài khoản/mật khẩu hoặc artifacts build. Quét nội dung staged trước commit/push; kết quả và commit hash được bàn giao ở chat và bản local báo cáo sau push.

## Môi trường Cloud

Giữ giá trị hiện tại trên Render, không sao chép env local:

- `APP_ENV=CLOUD_DEMO`, `NODE_ENV=production`, `HOST=0.0.0.0`, `SERVE_CLIENT=true`, Render cung cấp `PORT`.
- `SCHOOL_WORKFLOW_ENABLED=true`, `CORE_BUSINESS_ENABLED=true`, `USER_ID_BUSINESS_ENABLED=true`, `EMAIL_AUTH_ENABLED=true`.
- `MONGODB_URI=<URI Atlas hiện hữu>`, `CLOUD_DEMO_DB_NAME=internova_cloud_demo`, `CLOUD_DEMO_CLUSTER_HOST=<cluster hiện hữu>`, `CLOUD_DEMO_REPLICA_SET=<replica set hiện hữu>`, `CLOUD_DEMO_INSTANCE_ID=<marker hiện hữu>`, `JWT_SECRET=<giữsecret hiện hữu>`.
- `GOOGLE_AUTH_ENABLED=false`, `DEMO_MODE=false`, `WEB3_LOCAL_ENABLED=false`, `CHAIN_LISTENER_ENABLED=false`, `WEB3_LOCAL_READ_ONLY=true`, `WEB3_JOURNAL_ENABLED=false`, `CUSTODIAL_LOCAL_TEST_ENABLED=false`, `CUSTODIAL_AUTO_ISSUE_ENABLED=false`, `IPFS_EXTERNAL_UPLOAD_ENABLED=false`.
- Không đặt WORKFLOW_TEST_URI_ALLOWLIST trên Cloud. Không đổi marker hoặc bỏ Atlas guard để qua startup.
- Gateway signer/keyring/journal local không được copy lên Cloud. Journal đã có source nhưng chưa nghiệm thu fullnode recovery/cloud và chưa có signer cloud. Không bật bằng việc chỉ đặt ENABLED=true.

READ_ONLY chỉ chặn gửi/reconcile blockchain, không chặn MongoDB CRUD/QR/GPS độc lập. QuyềnAdmin vàlive identity guard vẫn bắt buộc. QR/camera/GPS trên điện thoại cần HTTPS (hoặc localhost); website HTTP không an toàn không thể bảo đảm camera/GPS, phải dùng HTTPS endpoint hiện có thay vì bypass browser guard.

## Cập nhật server nhóm

Hạ tầng đã kiểm kê trong branch deploy là **Render Docker kết hợp Frontend/Backend**, không phải một VPS đã xác minh. Auto-Deploy đang tắt theo render.yaml. Không tạo service/cluster/chain mới.

1. Thành viên nhóm kiểm tra `git status`; lưu thay đổi riêng trước khi cập nhật.
2. Fetch và fast-forward đúng branch:
```sh
git fetch origin
git switch deploy/internova-cloud-20261108
git pull --ff-only origin deploy/internova-cloud-20261108
```
Nếu không fast-forward, dừng và đối chiếu; không force/reset.
3. Render → service hiện có → kiểm tra branch, env và disk/storage hiện có → Manual Deploy → Deploy latest commit. Không dùng thao tác xóa/tạo service hoặc database. Không đổi DockerCommand.
4. Dockerfile build `npm ci --prefix client`, `VITE_API_URL=/api`, `npm --prefix client run build`; server `npm ci --prefix server --omit=dev`; khởi động `node src/index.js` từ `/app/server`. Shared được COPY cả frontend/backend.
5. Kiểm `/api/ready`, `/api/health`, `/api/core/capabilities`, `/login` và refresh route con; kiểm đăng nhập4vai trò, Admin thao tác Mongo hợp lệ, QR/GPS HTTPS, scope dữ liệu và báo cáo.
6. Không gọi seed/migrate/initialize/index tự động. Nếu startup báo thiếu index hoặc sai marker, dừng và lập kế hoạch DB riêng. Không sửa điểm/giờ/SBT để ép hợp lệ.

## Dữ liệu và rollback

Không cần migration phá hủy hoặc importdatabase cho commit này. Các schema/service bổ sung không được tự tạo custody indexes/wallets hoặc scanbacklog khi flags tắt. Cloud dataset hiện hữu không có quyền tự đổi nội dung theo datasetlocal. Runtime muốn kích hoạt thêm collection/index phải kiểm kê và phê duyệt riêng.

Không cần deploy lại Smart Contract để dùng chức năng MongoDB/UI. Không trỏ Cloud tới127.0.0.1:18548 của máy cá nhân. Blockchain write vẫn BLOCKED/READ_ONLY.

RenderFree filesystem tạm: không dùng filesystem ephemeral làm nơi giữ journal/khóa hoặc file lâu dài. Source giữ cơ chế lưu hiện tại; khả năng storage production và email thật chưa được kiểm thử ở lượt này.

Rollback bằng Render → Deploys → redeploy image/commit trước đã hoạt động (7960173 hoặc deploy đang được nhóm xác nhận). Giữ URI/JWT/marker/database/disk, không restore/drop database hoặc reset blockchain. Ghi lại deployID và lỗi trước khirollback. Nếu nhánh được nhóm cập nhật trong lúc push, dừng thay vì ghi đè.

## Danh sách file trong bản tích hợp

Quét staged ban đầu132file: không phát hiện private key block, URI Mongo kèmcredentials, JWT/GitHub/AWS token hoặc đường dẫn cấm. Không kiểm toán toàn lịch sửGitHub.

- `.gitignore`
- `client/src/App.jsx`
- `client/src/business.css`
- `client/src/components/AppShell.jsx`
- `client/src/components/AuthModal.jsx`
- `client/src/components/GoogleIdentity.jsx`
- `client/src/components/ResetPassword.jsx`
- `client/src/components/business/Accounts.jsx`
- `client/src/components/business/AdminCertificatePage.jsx`
- `client/src/components/business/AdminSupervision.jsx`
- `client/src/components/business/AiPage.jsx`
- `client/src/components/business/AssignmentContext.jsx`
- `client/src/components/business/CompanyLocations.jsx`
- `client/src/components/business/CoreBusinessView.jsx`
- `client/src/components/business/ExpandableText.jsx`
- `client/src/components/business/MyCertificates.jsx`
- `client/src/components/business/Notifications.jsx`
- `client/src/components/business/ProfileCv.jsx`
- `client/src/components/business/RecommendationResults.jsx`
- `client/src/components/business/Recruitment.jsx`
- `client/src/components/business/Reports.jsx`
- `client/src/components/business/Shared.jsx`
- `client/src/components/business/SupervisionStudentFinder.jsx`
- `client/src/components/business/Time.jsx`
- `client/src/components/business/Web3Page.jsx`
- `client/src/components/business/WeekFilter.jsx`
- `client/src/components/business/Work.jsx`
- `client/src/components/business/assignmentChoice.mjs`
- `client/src/components/business/cv/CvFile.jsx`
- `client/src/components/business/hooks.js`
- `client/src/components/business/placements/PlacementForms.jsx`
- `client/src/components/business/placements/Registrations.jsx`
- `client/src/components/business/placements/Topics.jsx`
- `client/src/components/business/reports/ReportEvidence.jsx`
- `client/src/components/business/reports/ReportForm.jsx`
- `client/src/components/business/reports/ReportRubricSettings.jsx`
- `client/src/components/business/reports/ReportSearch.jsx`
- `client/src/components/business/reports/ReviewForm.jsx`
- `client/src/components/business/work/AssignmentNotice.jsx`
- `client/src/components/business/work/WorkLogForms.jsx`
- `client/src/components/business/workflow/AdminPage.jsx`
- `client/src/components/business/workflow/ApplicationInbox.jsx`
- `client/src/components/business/workflow/CompanyPages.jsx`
- `client/src/components/business/workflow/Dashboard.jsx`
- `client/src/components/business/workflow/MyInternship.jsx`
- `client/src/components/business/workflow/StudentOverview.jsx`
- `client/src/components/business/workflow/TopicTemplates.jsx`
- `client/src/components/business/workflow/common.jsx`
- `client/src/components/business/workflow/constants.js`
- `client/src/main.jsx`
- `client/test/assignment-choice.test.mjs`
- `docs/BLOCKCHAIN_RECOVERY_TEST_RESULT.md`
- `docs/BLOCKCHAIN_TRANSACTION_JOURNAL_RESULT.md`
- `docs/CUSTODIAL_CD_E_RESULT_20261109.md`
- `docs/INTERNOVA_DEPLOY_BRANCH_UPDATE.md`
- `docs/codex-progress/CHANGE_LOG.md`
- `docs/codex-progress/CURRENT_STATUS.md`
- `docs/codex-progress/RESUME_PROMPT.md`
- `docs/codex-progress/TASK_CHECKLIST.md`
- `docs/codex-progress/TEST_RESULTS.md`
- `render.yaml`
- `server/src/app.js`
- `server/src/config/workflowTestGuard.js`
- `server/src/core/accounts.js`
- `server/src/core/batchRegistrations.js`
- `server/src/core/custodial.js`
- `server/src/core/dashboard.js`
- `server/src/core/index.js`
- `server/src/core/placements.js`
- `server/src/core/recruitment.js`
- `server/src/core/reportContext.js`
- `server/src/core/reportEvaluation.js`
- `server/src/core/reports.js`
- `server/src/core/shared.js`
- `server/src/core/supervision.js`
- `server/src/core/taskEvaluation.js`
- `server/src/core/tasks.js`
- `server/src/core/time.js`
- `server/src/core/timeEvidence.js`
- `server/src/core/unifiedPlacements.js`
- `server/src/core/web3.js`
- `server/src/core/worklogs.js`
- `server/src/middleware/custodialFreeze.js`
- `server/src/models/BusinessModels.js`
- `server/src/models/User.js`
- `server/src/models/Web3Models.js`
- `server/src/routes/email.routes.js`
- `server/src/services/businessIdentity.js`
- `server/src/services/certificateQueue.js`
- `server/src/services/custodialPrincipal.js`
- `server/src/services/custodialRecipients.js`
- `server/src/services/custodialRuntime.js`
- `server/src/services/custodialTestStore.js`
- `server/src/services/custodialVault.js`
- `server/src/services/localWeb3.js`
- `server/src/services/passwordReset.js`
- `server/src/services/personSearch.js`
- `server/src/services/placementService.js`
- `server/src/services/profileService.js`
- `server/src/services/studentCertificates.js`
- `server/src/services/studentSearch.js`
- `server/src/services/transactionGatewayRuntime.js`
- `server/src/services/transactionJournal.js`
- `server/src/workflow/dashboardMetrics.js`
- `server/src/workflow/notifications.js`
- `server/src/workflow/queries.js`
- `server/src/workflow/routes.js`
- `server/src/workflow/service.js`
- `server/test/admin-direct-reset.browser.cjs`
- `server/test/admin-direct-reset.integration.cjs`
- `server/test/admin-supervision-write.integration.test.js`
- `server/test/auto-assignment.browser.cjs`
- `server/test/core-accounts.test.js`
- `server/test/core-work-time-reports.test.js`
- `server/test/custodial-ab.integration.cjs`
- `server/test/custodial-cd.integration.cjs`
- `server/test/custodial-chain-recovery.cjs`
- `server/test/custodial-store.unit.test.js`
- `server/test/custodial-vault.unit.test.js`
- `server/test/email-auth.test.js`
- `server/test/password-reset.unit.test.js`
- `server/test/person-search-readonly.integration.cjs`
- `server/test/person-search.unit.test.js`
- `server/test/profile-email-readonly.unit.test.js`
- `server/test/report-week-filter.unit.test.js`
- `server/test/sbt-binding.unit.test.js`
- `server/test/supplement-reset.browser.cjs`
- `server/test/supplement-reset.integration.cjs`
- `server/test/transaction-journal.test.js`
- `server/test/weekly-role-workflow.browser.cjs`
- `server/test/weekly-role-workflow.integration.cjs`
- `server/test/workflow.integration.test.js`

Rủi ro kế thừa: luồng Admin đặt mật khẩu theo quy ước doanh nghiệp dùng mật khẩu yếu đã được yêu cầu trước đây; cần Admin chọn mật khẩu riêng mạnh khi vận hành Cloud. Không thay đổi quy trình ngầm trong lượt tích hợp.

# PHASE 3 — kế hoạch triển khai và thay đổi dữ liệu

Người dùng phê duyệt31/10/2026. Tài liệu lập trước sửa source PHASE3; trạng thái nghiệm thu cuối ở IMPLEMENTATION_PROGRESS/TEST_RESULTS. Không triển khai AI PHASE4 hoặc blockchain PHASE5.

## Nhóm nhỏ / file dự kiến

| Nhóm | File dự kiến | Tác động / kiểm thử |
| --- | --- | --- |
| Baseline | ignored phase3 staging, tài liệu này | Hash file, đọc docs/audit/đề cương DOCX; snapshot chỉ đọc ba DB gốc/demo; xác minh evidence PHASE2 |
| Tài khoản/profile | models/User.js, middleware/auth.js, routes/core/accounts.js, core validation/history; client CoreBusinessView | Profile, admin provision/edit role/disable; không tự nâng quyền, không sửa nonce/signature/token format; account disabled bị từ chối; regression auth |
| CV/JD/Application | models/BusinessModels.js, models/JD.js, routes/core/recruitment.js, services/cvParser.js, parsers/cv_extract.py; CV/JD UI | CV riêng tư, upload bounded; parser subprocess không shell; application unique và lịch sử/notification thật; JD owner edit/publish/close; negative file/ownership/duplicate tests |
| Kỳ và phân công | models/Assignment.js, BusinessModels InternshipBatch, core/placements.js | Tái sử dụng Assignment + Student/Topic; bổ sung batch/mentor/date/lifecycle. Không đổi enum/status cũ; nhiều placement off-chain, không ghi singleton của Topic cũ |
| Task/log | models/Task.js, WorkLog.js, core/work.js, legacy permissions/routes | Assignment-linked records chỉ xử lý qua core scoped API để lịch sử không bị bỏ qua; luồng legacy giữ nguyên với records không assignmentId; validate/version/concurrency/history tests |
| Giờ làm | BusinessModels WorkSession, services/timeTracking.js, core/time.js | Manual check-in/out, một phiên mở/student, request key chống gửi trùng, >16h cần điều chỉnh, company approve/adjust kèm audit cùng document; tổng giờ approved theo UTC |
| Báo cáo/đánh giá | BusinessModels Report, core/reports.js | Version báo cáo, review company+mentor, admin phê duyệt; không phụ thuộc Pinata và không mint NFT/SBT; report content riêng tư |
| Dashboard/UI/integration | app.js, config/env.js, core/index.js, core/dashboard.js, App/AppShell/Dashboard/CvJd, CoreBusinessView, test helpers và core tests | API bổ sung, guard cũ giữ; header notifications GET, mark-read chủ đích; dashboard số thật; build/lint/API/browser bốn vai trò và GET zero writes |
| Tài liệu | IMPLEMENTATION_PROGRESS, TEST_RESULTS, FEATURE_ACCEPTANCE_MATRIX, ARCHITECTURE_UPDATED | Chỉ DONE khi có UI/API/validation/permission/persistence/test; ghi rõ NOT TESTED/BLOCKED |

## Schema/index và tính tương thích

- User: thêm optional disabled + audit history ẩn mặc định; giữ wallet/role/nonce/JWT. Admin không tự demote/disable và không thay trạng thái Admin qua endpoint chỉnh thường. Hiện không tài khoản password; không giả đổi mật khẩu cho ví.
- Assignment: thêm optional batchId, company/student/mentor wallets, start/end, lifecycle và history. Status assigned/submitted/evaluated cũ giữ nguyên. Index unique partial chỉ với batchId ObjectId: topicId/studentId/batchId. Student/Company/Topic cũ giữ vai trò identity/project; không backfill tự động.
- Task/WorkLog: optional assignmentId/history/progress; core permission theo Assignment, legacy API không nhận ghi core record. Không sửa dữ liệu lịch sử hoặc xóa duplicate để tạo index.
- JD: history và optimistic version nếu cần; trạng thái open/closed giữ, closed có thể làm bản nháp trước công bố.
- Collection mới: CV (một hồ sơ/student, file private tối đa2MiB), Application (unique JD/student), InternshipBatch, WorkSession (unique open student và student/requestKey), Report (unique assignment/type/version), NotificationReceipt (unique user/event). Tên/index chính xác được ghi sau triển khai.
- Mọi mutation mới có validation/scope và lịch sử nhúng trong cùng document; compare-and-swap version khi chỉnh sửa. Notification ứng tuyển được suy từ lịch sử Application đã lưu, mark-read có receipt riêng. Không tuyên bố Mongo standalone hỗ trợ transaction nhiều document.
- Không gọi syncIndexes/dropIndex, seed, migration hoặc dropDatabase. Test helper phải init model/index trên DB TEST rỗng trước chạy; không chạm gốc/demo.

## Rollback / rollout

1. Lưu hash/bản nguồn trước PHASE3 trong ignored staging. Core route bật bằng CORE_BUSINESS_ENABLED trong process TEST; mặc định tắt ở runtime chưa cấu hình.
2. Backend gốc5000/demo5001 không restart. Frontend TEST chỉ trỏ Backend TEST cùng phiên bản; dừng Vite TEST cũ trước thay đổi để tránh HMR gọi server chưa có API.
3. Chưa chạy bất kỳ migration nào trên DB gốc/demo. Khi rollout thật phải được review riêng: backup đã duyệt, scan duplicate/legacy fields chỉ đọc, dry-run bản sao, kiểm indexes và quyền, rồi mới bật core. Không tự thực hiện các bước này.
4. Rollback code bằng bản lưu/patch đã xác minh, không reset/clean Git. Tắt core flag và quay UI cũ trước nếu cần; giữ nguyên collection/field/index bổ sung, không xóa dữ liệu làm rollback. Records mới không thể được coi là đã chuyển vào singleton Topic/contract cũ; cần adapter PHASE5 được duyệt.

## Upload và parser

PDF parser chưa có trong máy; đã hỏi phê duyệt pypdf cô lập, chưa cài. Không cài model/dependency lớn. DOCX dùng zip/XML chuẩn với giới hạn entry/size/ratio, từ chối external relations/macros/DTD/embedded content. File chỉ lưu khi parser thành công; không public IPFS hoặc trả binary trong danh sách CV. PDF scan không có text phải báo unsupported/OCR cần phase sau, không tạo text giả.

Thời gian chấm công dùng UTC, approved minutes là đơn vị chuẩn; không hồi tố áp giờ từ QR Attendance cũ vì thiếu checkout. Missing checkout hiển thị phiên mở, quá16h cần company điều chỉnh có lý do; GET không tự đóng/duyệt phiên.

Chính sách chấm công PHASE3: một phiên nghiệp vụ/student/ngày UTC, phù hợp Attendance daily hiện có; index unique studentWallet/day chỉ ở work_sessions mới. Điều chỉnh phải nằm trong đúng ngày này và tối đa16giờ; không cộng phiên giao nhau hoặc tự thêm phút tối thiểu. Nhiều ca/ngày và ca qua nửa đêm là mở rộng policy riêng, không được âm thầm suy thành giờ hợp lệ.

Báo cáo có current flag và partial unique assignment/kind/current để chỉ một bản hiện hành. Supersede và approve dùng CAS trên cùng document, không cho approval bản cũ đua với submit bản mới. Không xóa bản cũ; khi lỗi insert sau supersede, giữ lịch sử và cho phép gửi lại có kiểm tra unique thay vì tự sửa dữ liệu.

KPI canonical: optional Assignment.kpis là snapshot rubric từng phân công, kpiScore là điểm trọng số sau khi duyệt đủ; không dùng trạng thái KPI singleton trên Topic cho nhiều sinh viên. Routes core/kpis.js và panel UI báo cáo dùng CAS/history. Ngày KPI phải trong phân công khi đề xuất; bản đã duyệt không sửa. Report.finalScore là trung bình nhận xét báo cáo; Assignment.kpiScore là điểm KPI có trọng số, hai số không được gộp hoặc gọi on-chain.

Startup guard: server/src/index.js + services/databaseSafety.js. Ngoài TEST autoIndex/autoCreate=false; unique indexes quan trọng được xác minh chỉ đọc trước listen. TEST entrypoint cũng phải exact-allowlist trước connect. Không thêm script tự tạo index cho DB gốc/demo; rollout cần dry-run/migration đã duyệt. Legacy profile routes được bổ sung audit/version để không bỏ qua CAS của Core; field __v thiếu được coi0 cho đọc/CAS đầu tiên, không backfill khi GET. Đồng bộ User–Student/Company cũ vẫn nhiều document trên standalone, không được tuyên bố transaction atomic.

Upload contract chốt trước nghiệm thu: POST/core/cv/file nhận binary PDF/DOCX trực tiếp, Content-Type chính xác và X-CV-Filename URI-encoded, tối đa2MiB. Không phụ thuộc Multer/multipart và không nâng Node dependency. API này là bổ sung PHASE3, không đổi định dạng endpoint PHASE1–2. Parser process không nhận JWT/Pinata env, tối đa2 process, timeout5giây, stream giải nén tối đa8MiB, output/text có giới hạn; đây không phải OS sandbox hay antivirus/CDR.


## Kết quả cuối và danh sách file PHASE3

Đã triển khai/kiểm thử TEST:82Backend,36browserCore,39browserPhase2 regression,build/lintPASS. Pypdf6.21.4 đã được người dùng phê duyệt cài isolated, thay cho trạng thái pending trong kế hoạch ban đầu. API upload cuối dùng raw binary như mô tả bổ sung; không Multer/multipart. Không áp migration/index vào gốc/demo. Xem4tài liệu nghiệm thu hiện tại; dừng trướcPHASE4.

Các file thay đổi so với snapshot trướcPHASE3 (không đồng nhất với toàn bộ gitdiff từ HEAD):

- [client/src/App.jsx](../client/src/App.jsx)
- [client/src/api/client.js](../client/src/api/client.js)
- [client/src/business.css](../client/src/business.css)
- [client/src/components/AppShell.jsx](../client/src/components/AppShell.jsx)
- [client/src/components/CvJdView.jsx](../client/src/components/CvJdView.jsx)
- [client/src/components/DashboardView.jsx](../client/src/components/DashboardView.jsx)
- [client/src/components/business/Accounts.jsx](../client/src/components/business/Accounts.jsx)
- [client/src/components/business/CoreBusinessView.jsx](../client/src/components/business/CoreBusinessView.jsx)
- [client/src/components/business/CoreOverview.jsx](../client/src/components/business/CoreOverview.jsx)
- [client/src/components/business/Kpis.jsx](../client/src/components/business/Kpis.jsx)
- [client/src/components/business/Notifications.jsx](../client/src/components/business/Notifications.jsx)
- [client/src/components/business/Placements.jsx](../client/src/components/business/Placements.jsx)
- [client/src/components/business/ProfileCv.jsx](../client/src/components/business/ProfileCv.jsx)
- [client/src/components/business/Recruitment.jsx](../client/src/components/business/Recruitment.jsx)
- [client/src/components/business/Reports.jsx](../client/src/components/business/Reports.jsx)
- [client/src/components/business/Shared.jsx](../client/src/components/business/Shared.jsx)
- [client/src/components/business/Time.jsx](../client/src/components/business/Time.jsx)
- [client/src/components/business/Work.jsx](../client/src/components/business/Work.jsx)
- [client/src/components/business/hooks.js](../client/src/components/business/hooks.js)
- [client/src/main.jsx](../client/src/main.jsx)
- [client/test/browserHarness.cjs](../client/test/browserHarness.cjs)
- [client/test/phase3-browser.cjs](../client/test/phase3-browser.cjs)
- [client/test/phase3-fixtures.cjs](../client/test/phase3-fixtures.cjs)
- [docs/ARCHITECTURE_UPDATED.md](../docs/ARCHITECTURE_UPDATED.md)
- [docs/FEATURE_ACCEPTANCE_MATRIX.md](../docs/FEATURE_ACCEPTANCE_MATRIX.md)
- [docs/IMPLEMENTATION_PROGRESS.md](../docs/IMPLEMENTATION_PROGRESS.md)
- [docs/PHASE3_IMPLEMENTATION_PLAN.md](../docs/PHASE3_IMPLEMENTATION_PLAN.md)
- [docs/TEST_RESULTS.md](../docs/TEST_RESULTS.md)
- [server/parsers/cv_extract.py](../server/parsers/cv_extract.py)
- [server/parsers/requirements.txt](../server/parsers/requirements.txt)
- [server/src/app.js](../server/src/app.js)
- [server/src/config/env.js](../server/src/config/env.js)
- [server/src/config/testDatabaseGuard.js](../server/src/config/testDatabaseGuard.js)
- [server/src/core/accounts.js](../server/src/core/accounts.js)
- [server/src/core/dashboard.js](../server/src/core/dashboard.js)
- [server/src/core/index.js](../server/src/core/index.js)
- [server/src/core/kpis.js](../server/src/core/kpis.js)
- [server/src/core/placementPolicy.js](../server/src/core/placementPolicy.js)
- [server/src/core/placements.js](../server/src/core/placements.js)
- [server/src/core/recruitment.js](../server/src/core/recruitment.js)
- [server/src/core/reports.js](../server/src/core/reports.js)
- [server/src/core/shared.js](../server/src/core/shared.js)
- [server/src/core/time.js](../server/src/core/time.js)
- [server/src/core/work.js](../server/src/core/work.js)
- [server/src/index.js](../server/src/index.js)
- [server/src/middleware/auth.js](../server/src/middleware/auth.js)
- [server/src/middleware/permissions.js](../server/src/middleware/permissions.js)
- [server/src/models/Assignment.js](../server/src/models/Assignment.js)
- [server/src/models/BusinessModels.js](../server/src/models/BusinessModels.js)
- [server/src/models/JD.js](../server/src/models/JD.js)
- [server/src/models/Task.js](../server/src/models/Task.js)
- [server/src/models/User.js](../server/src/models/User.js)
- [server/src/models/WorkLog.js](../server/src/models/WorkLog.js)
- [server/src/routes/auth.routes.js](../server/src/routes/auth.routes.js)
- [server/src/routes/data.routes.js](../server/src/routes/data.routes.js)
- [server/src/routes/internship.routes.js](../server/src/routes/internship.routes.js)
- [server/src/routes/topic.routes.js](../server/src/routes/topic.routes.js)
- [server/src/services/cvParser.js](../server/src/services/cvParser.js)
- [server/src/services/databaseSafety.js](../server/src/services/databaseSafety.js)
- [server/src/services/profileService.js](../server/src/services/profileService.js)
- [server/src/services/timeTracking.js](../server/src/services/timeTracking.js)
- [server/test/core-accounts.test.js](../server/test/core-accounts.test.js)
- [server/test/core-edge-cases.test.js](../server/test/core-edge-cases.test.js)
- [server/test/core-placements.test.js](../server/test/core-placements.test.js)
- [server/test/core-recruitment.test.js](../server/test/core-recruitment.test.js)
- [server/test/core-work-time-reports.test.js](../server/test/core-work-time-reports.test.js)
- [server/test/coreFixtures.js](../server/test/coreFixtures.js)
- [server/test/cvDocuments.js](../server/test/cvDocuments.js)
- [server/test/database-safety.test.js](../server/test/database-safety.test.js)
- [server/test/helpers.js](../server/test/helpers.js)
- [server/test/startup-entry.test.js](../server/test/startup-entry.test.js)
- [server/test/testEnvironment.js](../server/test/testEnvironment.js)
- [server/test/timeTracking.test.js](../server/test/timeTracking.test.js)

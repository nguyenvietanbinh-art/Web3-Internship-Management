# So sánh bản cập nhật và bản local — 06/11/2026

## Phạm vi

- Bản trước: commit `e14adeb`, cộng các thay đổi UI local chưa commit (nhãn theo role, lịch sử ứng tuyển dễ đọc, ví cá nhân chỉ cho sinh viên).
- Bản bạn trong nhóm: commit `ae71d4b` trên origin/branch_1.
- Working tree hiện tại: `ae71d4b` cộng phần UI local đã phục hồi/giải quyết4file xung đột. Không phải bản remote nguyên trạng.
-65file thay đổi,6968dòng thêm/602dòng bỏ; có nhiều định dạng lại code nên không coi số dòng là số chức năng hoặc chất lượng.

## Nghiệp vụ

| Mục | Bản trước | Bản mới | Đánh giá |
| --- | --- | --- | --- |
| Đăng ký kỳ/chọn đề tài | Sinh viên chủ yếu ứng tuyển JD, staff phân công | BatchRegistration, xem cơ hội theo kỳ, đăng ký đề tài hoặc yêu cầu hỗ trợ, Admin xử lý/phân công | Tiến bộ đáng kể, gần luồng thực tế nhà trường hơn;26API cases mới gồm nhóm này đã PASS |
| Phân công | Thông báo lỗi kỳ/ngày/rubric gộp chung | placementService phân biệt kỳ đóng, đảo ngày, ngoài kỳ, hạn KPI; kiểm phân công trùng; Admin có approveImmediately với lý do | Giải quyết trực tiếp khó khăn người dùng trước đó; test validation/race/cancel-replace PASS trong TEST |
| Quản lý đề tài | Tạo đề tài/KPI cơ bản | Sửa KPI/nội dung, xóa đề tài chưa dùng, khóa chỉnh sửa/xóa khi đã phân công | Có API/UI và test ownership/validation; chỉ xóa fixture trong TEST khi kiểm thử |
| Nộp công việc | Chủ yếu cập nhật trạng thái/tiến độ | Nộp nội dung/link/file, review, yêu cầu chỉnh sửa, nộp lại, thời gian nộp/trễ và lịch sử | Hoàn thiện nghiệp vụ hơn; task submission API cases PASS |
| CV | Nhập form và upload sau khi lưu CV | Tách module, upload có thể khởi tạo CV; thêm download/import qua link HTTPS và kiểm DNS/IP/redirect/size | Tốt hơn về cấu trúc; cv-download tests dùng transport fixture, chưa xác minh mọi URL Internet thật |
| Báo cáo | Nhập nội dung | Hỗ trợ lấy nội dung công việc thực vào form, review có thêm quyết định incorrect | Tiện hơn; report-tasks unit đã PASS; chưa toàn bộ E2E mới |
| Giao diện theo role | Local đã sửa nhãn/lịch sử/ẩn ví staff | Remote không chứa đầy đủ các chỉnh sửa local này | Giữ phần UI local trên code mới thay vì bỏ một bên |
| AI/IPFS/QR/contract/SBT | Các giới hạn đã ghi nhận | Không thay source ai-service/contracts trong commit này | Chưa có bằng chứng nâng chất lượng AI, live Pinata hoặc hardware UAT |

File trọng tâm: server/core batchRegistrations, unifiedPlacements, tasks, cv; services placementService/cvDownload; frontend business/placements, work, reports, cv.

## Rủi ro

1. **HIGH còn nguyên — report replacement không atomic:** `server/src/core/reports.js` vẫn supersede bản cũ trước Report.create. Lỗi đã fault-test FAIL ở bản trước; lần này xác nhận source vẫn có trình tự đó, chưa fault-test lại trên bản mới. Không tuyên bố đã sửa.
2. **Collection/index mới:** BatchRegistration + unique batchId/studentUserId; Assignment thêm studentBatchKey unique partial. `databaseSafety.js` kiểm các model/index này. DB manual/demo cũ cần inventory/plan trước khi chạy code mới; chưa tự tạo index/migrate hoặc restart Backend.
3. **Nhiều bước ghi chưa cùng transaction:** placementService tạo Assignment rồi cập nhật Registration. Có rollback khi Assignment.create lỗi, nhưng nếu update Registration phía sau lỗi thì có thể không đồng bộ. Đây là rủi ro source review, chưa fault-injection xác nhận ở lượt này; cần reconciliation/fault test riêng.
4. **Runtime đang khác source:** Backend manual chưa restart nên website hiện tại có thể gọi API cũ trong khi Frontend đã nhận source mới. Build PASS không chứng minh runtime đang dùng toàn bộ phiên bản mới.
5. **Coverage chưa đủ:** chưa chạy lại toàn bộ Backend regression, browser E2E mới, AI/Solidity integration; không chuyển các kết quả165Backend/21browser của bản trước thành PASS cho bản mới.
6. Một số lịch sử raw JSON ngoài ứng tuyển vẫn còn. Việc sửa nhãn/ẩn ví staff là UI local, không thay quyền API hoặc xóa ví đã liên kết.

## Bằng chứng kiểm thực tế

- Lint/build sau ghép source PASS; client unit18/18 PASS (session/file handling/report task helpers/UI role policies).
- API mới26/26 PASS, fail0/skip0: `batch-registrations.test.js`, `task-submissions.test.js`, `topic-management.test.js`, `cv-download.test.js`.
- Lệnh Node test concurrency1; NODE_ENV=test, exact MONGODB_URI_TEST_ALLOWLIST, child database ngẫu nhiên; không dùng DB manual/gốc/demo. Không cài dependency hoặc thay package-lock.
- Log: [backend-new-tests](../audit-reports/COMPARE_ae71d4b_20261106/backend-new-tests.txt). Có fixture transport download và dữ liệu synthetic được khai báo trong test, không gọi là upload/download Internet live.

## Kết luận

**Bản mới tốt hơn về core business; nên dùng làm nền và giữ các chỉnh sửa UI local.** Chưa đủ bằng chứng nói nó ổn định hơn toàn hệ thống hoặc đã production-ready. Không chấm điểm/đưa tỷ lệ hoàn thiện dựa vào số test hay số dòng.

Ưu tiên: inventory và plan index cho môi trường chạy → dựng runtime TEST mới để kiểm API/UI đồng bộ → full regression/browser mới → fix atomic report theo phương án đã duyệt → fault-test consistency đăng ký/phân công → các phần AI/IPFS/hardware còn thiếu. Không ghi schema/index của dữ liệu hiện có khi chưa được phê duyệt riêng.

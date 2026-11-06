# Đề tài doanh nghiệp trong kỳ thực tập mới

Cập nhật 06/11/2026 theo yêu cầu của chủ dự án. Kỳ mới không còn trống chỉ vì doanh nghiệp chưa công bố lại từng đề tài theo kỳ.

## Quy tắc hiện tại

- Khi admin tạo kỳ, hệ thống tự tạo cơ hội ứng tuyển trong kỳ từ các đề tài gốc đang mở của doanh nghiệp còn hoạt động.
- Mỗi cơ hội gắn một đề tài và một kỳ, có chỉ tiêu riêng theo `maxSlots` của đề tài gốc, bắt đầu với số tiếp nhận bằng 0. Không mang hồ sơ, người đã nhận hay số chỗ đã dùng từ kỳ khác sang.
- Giữ nội dung và trọng số KPI của đề tài. Hạn KPI đã nằm trong kỳ được giữ nguyên; hạn nằm ngoài kỳ được đặt vào ngày kết thúc kỳ mới. Chỉ điều chỉnh snapshot của kỳ, không sửa nội dung/hạn KPI gốc. Không sao chép điểm, bài nộp, kết quả AI hoặc bằng chứng của đề tài gốc.
- Không đưa vào danh sách đề tài đã đóng, doanh nghiệp bị khóa, thiếu chủ sở hữu hợp lệ hoặc KPI/chỉ tiêu không hợp lệ. Các trường hợp không hợp lệ có kết quả skipped để admin kiểm tra.
- Không tự cấp membership hoặc đăng ký kỳ cho sinh viên. Sinh viên phải được trường cấp quyền, đăng ký kỳ, rồi có thể ứng tuyển trực tiếp như quy trình đã thống nhất.
- Việc xuất hiện trong catalog cho phép sinh viên ứng tuyển; quyền nhà trường phân bổ trực tiếp vẫn do doanh nghiệp bật riêng cho cơ hội của kỳ, không tự sao chép sự đồng ý từ kỳ khác.

Tạo kỳ và khởi tạo catalog chạy chung transaction. Không tạo cơ hội hoặc thay đổi dữ liệu khi sinh viên chỉ mở trang/GET danh sách.

Admin có thêm nút **Bổ sung đề tài đang mở vào kỳ** để bổ sung những đề tài còn thiếu sau khi kỳ đã tồn tại. Đồng bộ lại không tạo trùng theo unique index `(batchId, topicId)`, không sửa chỉ tiêu, hạn KPI, số người nhận hoặc trạng thái của cơ hội đã có; không mở lại cơ hội doanh nghiệp đã đóng.

## Hai kỳ mới trong ảnh

Database workflow demo có hai kỳ mới `abc` và `abshd` (tên `ahsbdasjfc`), trước sửa đều chưa có cơ hội tuyển. Đã chạy plan rồi apply để bổ sung **41 cơ hội vào mỗi kỳ**, 0 skipped. Mỗi kỳ có một hạn KPI ngoài thời gian kỳ cần chuẩn hóa vào ngày kết thúc kỳ.

Giữ nguyên dữ liệu các kỳ khác; database gốc cổng 27017 không thay đổi. Không tạo database TEST mới. Evidence local: `batch-catalog-repair-plan.json`, `batch-catalog-repair-result.json` trong cache workflow.

## Kiểm thử mới

- HTTP/replica set/NLP: 11 PASS, 0 FAIL, 1 SKIP (SBT không chạy lại cho thay đổi này).
- Kịch bản mới xác minh tạo kỳ có sẵn đề tài, đăng ký/ứng tuyển được, quota độc lập giữa hai kỳ, giữ nguyên hạn KPI gốc, loại đề tài đóng/công ty khóa/KPI sai, GET không tự ghi, đồng bộ hai lần không trùng và không mở lại cơ hội đã đóng.
- Chrome trên tài khoản `engineer-090@example.invalid`, kỳ `abshd`: thấy đủ **41 đề tài**, cả 41 nút ứng tuyển được bật, 0/3 lượt đã dùng. Kiểm tra ở desktop và chiều rộng 390px không tràn ngang. Không nộp hồ sơ thay sinh viên trong kiểm tra trình duyệt.
- Frontend lint/build PASS; đối chiếu 25 collection nguồn gồm nội dung và index vẫn không thay đổi.

Backend: `server/src/workflow/batchCatalog.js`, POST `/api/core/admin/batches`, POST `/api/core/admin/batches/:id/sync-opportunities`. Sửa dữ liệu kỳ trống đã có bằng script exact-allowlist `server/scripts/workflow-sync-empty-batches.cjs`, không tự động chạy khi khởi động.

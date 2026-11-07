# Bài báo cáo ngắn cho sinh viên đã hoàn thành thực tập

Ngày triển khai: 07/11/2026. Website: http://localhost:5188/.

## Đã chuẩn bị

12 sinh viên mẫu đã hoàn thành kỳ cử nhân Học kỳ II 2025–2026, mỗi sinh viên có ba bài ngắn: trình bày tương đối đầy đủ; thiếu kết quả/minh chứng; tóm tắt sơ lược. Tổng cộng 36 bài.

Thông tin sinh viên, doanh nghiệp, kỳ, đề tài, số task hoàn thành và tổng phút đã duyệt lấy từ đúng phân công hiện tại. Nội dung được tạo làm bài tập, không được coi là báo cáo mới do sinh viên thật nộp. Không bịa sản phẩm, liên kết hay kết quả kiểm thử đã xác minh.

Những báo cáo cuối kỳ đã chốt và điểm cũ giữ nguyên. "Chấm lại" ở đây là **phiếu đánh giá thử riêng**, không mở lại kỳ đã đóng hoặc thay đổi quy trình phúc khảo/điểm chính thức.

## Cách dùng trên giao diện

1. Ctrl+F5 và đăng nhập `lecturer-1@example.invalid` bằng mật khẩu file login local.
2. Mở **Báo cáo & kết quả**. Tìm **Báo cáo tổng kết — Nguyễn Thu Giang**, sinh viên `2311000006@gmail.com`, đã hoàn thành thực tập.
3. Bấm **Xem bài báo cáo** để đọc bài đã duyệt, hoặc **Đánh giá lại bài mẫu** để mở form riêng.
4. Chọn một trong ba mức bài viết. Form có nội dung ngắn, bạn có thể chỉnh sửa ngay trên form; chưa lưu thay đổi vào báo cáo gốc.
5. Bấm **Chấm trước bài này**. Hệ thống trả bảy tiêu chí và điểm đề xuất.
6. Bấm **Kiểm tra và chấm lại bài tập**, sửa điểm/nhận xét khi cần, đánh dấu đã kiểm tra, rồi bấm **Hoàn tất phiếu chấm thử**.
7. Bấm **Xuất bài và phiếu chấm thử** để tải JSON gồm nội dung đã sửa, dữ liệu tiến độ và điểm/nhận xét của lần thử. Không có request sửa điểm chính thức.

Mỗi giảng viên chỉ thấy bài của sinh viên mình phụ trách. Không cấp cho giảng viên quyền xem bài người khác để tiện chạy thử.

Phiếu thử tồn tại trong bộ nhớ của cửa sổ đang mở; tải file trước khi đóng nếu muốn giữ. Không tự lưu bài sinh viên trong localStorage hoặc dùng API đánh giá chính thức cho chức năng này.

## Dữ liệu phục vụ chuẩn bị huấn luyện

File: `ai-service/datasets/completed-report-exercises-v1/reports-to-review.jsonl`.

- 36 dòng, 12 nhóm sinh viên; mỗi nhóm có ba biến thể.
- `teacher_score`, `teacher_comment`, `label` để null, `label_source:awaiting-human-review`, `training_eligible:false`.
- Chưa chạy huấn luyện lại từ file này. Không lấy điểm chấm trước làm đáp án chuyên gia để mô hình học lại chính quy tắc của mình.
- File giảng viên tải về có điểm người thao tác nhập/xác nhận nhưng vẫn `expert_label_verified:false`: tài khoản thử không tự chứng minh người đó là chuyên gia độc lập.
- Huấn luyện chấm điểm báo cáo là bài toán khác với phân loại cần hỗ trợ trong bộ synthetic 1.000 bài. Không đổi điểm /100 thành nhãn rủi ro tùy tiện.
- Muốn dùng để huấn luyện/đánh giá, cần giảng viên thực sự kiểm tra và xác nhận nhãn, quy tắc gán nhãn rõ ràng, tách theo sinh viên và giữ mọi biến thể của cùng người trong một tập. Bộ này vẫn là tổng hợp dù được người thật nhận xét.

## Kiểm thử thực tế

- Endpoint đọc bài tập và phân tích kiểm quyền mentor, kiểm phạm vi phân công và yêu cầu phân công completed/báo cáo final approved có nguồn fixture. Không áp dụng cho hồ sơ thật hoặc bài chưa chốt.
- Giảng viên 1 đọc ba bài thành công; điểm chấm trước qua Backend: đầy đủ 83,75; thiếu minh chứng 41,34; sơ lược 38,83. Không dùng các điểm này làm bằng chứng mô hình chấm giống giảng viên thật.
- Giảng viên 2 gọi bài giảng viên 1: HTTP 404. Doanh nghiệp: HTTP 403.
- Danh sách báo cáo của giảng viên trước/sau các lần phân tích bằng nhau, không sửa điểm hoặc nội dung gốc.
- 2 browser tests thực tế PASS bằng Edge headless riêng: mở bài đã duyệt; mở bài tập, sửa nội dung, chấm trước, xác nhận phiếu thử và tải JSON. File tải về được kiểm có nội dung đã sửa, `synthetic:true`, `training_eligible:false`, `grading.official:false`.
- Browser không gọi POST `/reviews` hoặc `/approve`; không có runtime exception trong lượt thử. Browser cá nhân không được sử dụng hoặc đóng.
- 2 unit tests bài tập + 1 route phân quyền và 5 unit tests phiếu chấm PASS. Frontend lint/build PASS (`client/dist/completed-report-practice`).
- Dataset export chỉ đọc DB, không seed hoặc đổi hồ sơ/điểm. Không thêm schema/index/dependency, không commit/push/merge.

## File triển khai

`server/src/core/reportPractice.js`, `reports.js`, `ai.js`; `CompletedReportPractice.jsx`, `ReviewForm.jsx`, `Reports.jsx`; `server/scripts/export-completed-report-exercises.cjs`; `server/test/report-practice.unit.test.js`.

Ảnh, browser/API results và file JSON xuất thử nằm trong cache local `contracts/node_modules/.cache/workflow-combined-20261107/completed-practice-browser/`, không phải dữ liệu được push lên Git.

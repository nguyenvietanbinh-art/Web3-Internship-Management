> **2026-11-06 ? first company acceptance:** The owner explicitly chose immediate acceptance by the first company, with automatic withdrawal of the student's other open applications and notifications to their companies. This supersedes the earlier offer/student-confirmation rule (D03). See [implementation, current bachelor-001 result and tests](FIRST_COMPANY_ACCEPTANCE_RESULT.md).

# Gửi ứng tuyển trực tiếp đến doanh nghiệp

Cập nhật 06/11/2026 theo yêu cầu làm rõ của chủ dự án. Nội dung này **thay thế D01 chờ nhà trường chuyển hồ sơ** trong kế hoạch giai đoạn A và các mô tả tương ứng ở báo cáo giai đoạn B.

Luồng hiện tại:

1. Sinh viên thuộc diện được cấp quyền đăng ký kỳ, lưu CV và ứng tuyển tối đa ba đề tài trong kỳ.
2. Khi ứng tuyển thành công, hồ sơ và CV snapshot được gửi ngay đến đúng doanh nghiệp của đề tài. Không cần admin chuyển hồ sơ. Doanh nghiệp khác không được xem.
3. Doanh nghiệp xét hồ sơ và gửi đề nghị tiếp nhận; sinh viên xác nhận một đề tài còn chỗ. Nộp hồ sơ/offer không chiếm chỉ tiêu; xác nhận nhận đề tài mới chiếm một chỗ.
4. Nhà trường theo dõi tất cả hồ sơ trong mục **Hồ sơ ứng tuyển**, và bổ sung giảng viên/phân công chính thức.
5. Từ đúng thời điểm bắt đầu kỳ trừ bảy ngày, nếu sinh viên chưa có nơi tiếp nhận hợp lệ, nhà trường phải xử lý phân công vào cơ hội phù hợp còn chỗ. Sau ngày bắt đầu kỳ vẫn tiếp tục nhắc các trường hợp chưa xử lý. Không tự phân công khi GET hoặc mở Dashboard, không thay đề tài sinh viên đã nhận.

Tại database demo hiện tại, cử nhân 001 đã gửi ba hồ sơ cho doanh nghiệp 08. Đã cập nhật đủ ba hồ sơ này sang gửi trực tiếp; đồng thời xử lý 30 hồ sơ seed chưa từng được chuyển theo cùng chính sách mới. Không mở lại hồ sơ đã rút/từ chối/đóng, không khôi phục quyền đã bị thu hồi; không thay đổi quota, số chỗ hoặc tạo phân công tự động.

Admin có mục riêng **Hồ sơ ứng tuyển**, mặc định tất cả kỳ/trạng thái, tìm theo sinh viên/doanh nghiệp/đề tài và tải lại. Danh sách hồ sơ của kỳ cũng được đặt trước bảng sinh viên. Doanh nghiệp có **Hồ sơ ứng tuyển** và nút **Tải lại hồ sơ**.

Kỳ cử nhân bắt đầu 20/11/2026 lúc 08:00 giờ Việt Nam; mốc phải xử lý sinh viên chưa có nơi tiếp nhận là **13/11/2026 lúc 08:00**.

Kiểm tra mới:

- API/DB/NLP: 8 PASS, 0 FAIL; SBT test không chạy trong lần kiểm tra thay đổi này (1 SKIP), không dùng kết quả SBT cũ để chứng minh luồng ứng tuyển mới.
- Có kiểm tra gửi trực tiếp, admin tìm thấy hồ sơ, doanh nghiệp khác bị chặn, giới hạn ba lượt, tranh chỗ cuối, hủy/rollback, phân công bị chặn trước mốc bảy ngày và được phép tại mốc, tiếp tục nhắc sau khi kỳ bắt đầu.
- Chrome: admin tìm thấy đúng ba hồ sơ cử nhân 001; doanh nghiệp 08 thấy đủ ba hồ sơ mà không có bước admin chuyển; doanh nghiệp 07 không được xem. Không thay đổi quyết định xét tuyển của ba hồ sơ khi kiểm tra.
- Frontend lint/build PASS.

Script cập nhật dữ liệu có plan trước apply, transaction và exact TEST allowlist: `server/scripts/workflow-direct-routing.cjs`. Evidence local: `direct-routing-plan.json`, `direct-routing-result.json`, `direct-routing-browser-results.json` trong thư mục cache của workflow. Database gốc cổng 27017 không được cập nhật.

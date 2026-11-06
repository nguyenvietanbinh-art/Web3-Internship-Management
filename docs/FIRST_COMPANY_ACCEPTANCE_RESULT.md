# Doanh nghiệp nhận đầu tiên và thông báo rút hồ sơ

Cập nhật 06/11/2026 theo xác nhận của chủ dự án: **tự rút hồ sơ khác ngay khi doanh nghiệp đầu tiên bấm nhận sinh viên**. Quy tắc này thay thế bước offer rồi chờ sinh viên xác nhận trong D03 và các tài liệu trước đó.

## Hành vi đã áp dụng

- Lệnh doanh nghiệp nhận sinh viên chạy trong transaction: kiểm tra scope, eligibility, chỗ trống; chốt admission và chiếm một chỗ; chuyển hồ sơ thắng sang `confirmed`.
- Các hồ sơ đang mở khác của sinh viên trong cùng kỳ chuyển sang `closed_other_selected`, hiển thị **Đã tự động rút do đã nhận vị trí khác**. Giữ nguyên lịch sử và lượt ứng tuyển đã dùng.
- Tạo event rút hồ sơ cho từng hồ sơ đóng. Doanh nghiệp đã nhận hồ sơ đó vẫn xem được thông báo tối thiểu trong **chuông Thông báo**, dù quyền truy cập CV và xét tiếp hồ sơ đã thu hồi. Không tiết lộ CV hoặc doanh nghiệp thắng cho doanh nghiệp thua.
- Tách scope thông báo khỏi scope xem CV. Hồ sơ rút thủ công cũng có thông báo; công ty không liên quan không xem/đánh dấu đọc được.
- Retry nhận không chiếm thêm chỗ hoặc tạo thông báo trùng. Hai doanh nghiệp nhận đồng thời chỉ một bên thành công.
- Sinh viên không cần bấm xác nhận thêm. Endpoint xác nhận cũ chỉ trả lại admission đã có; không cho sinh viên tự chốt các offer cũ.
- Phân công chính thức/giảng viên vẫn do nhà trường hoàn tất; mốc nhà trường xử lý sinh viên chưa có nơi thực tập vẫn là trước ngày bắt đầu kỳ bảy ngày.

## Trường hợp cử nhân 001

Trước thay đổi, doanh nghiệp 08 đã bấm nhận đề tài **Quản lý kho và đặt hàng — đơn vị TEST 8**, nhưng record còn ở `offered` theo luồng cũ, chưa có admission. Đã hoàn tất chính quyết định tiếp nhận có sẵn này theo quy tắc mới, không chọn thêm doanh nghiệp hoặc tạo ứng tuyển mới.

Kết quả:

- Quản lý kho và đặt hàng: `confirmed`, doanh nghiệp 08 tiếp nhận.
- Cổng tuyển dụng và hồ sơ ứng viên: tự động rút.
- Chatbot tra cứu tài liệu: tự động rút.
- Hai thông báo rút hồ sơ xuất hiện bên doanh nghiệp 08. Ba hồ sơ của 001 hiện đều thuộc doanh nghiệp 08; kịch bản có nhiều doanh nghiệp khác nhau đã kiểm tra riêng trong QA.

Không chuyển hàng loạt các offer seed khác thành tiếp nhận thật. Các offer cũ còn lại cần doanh nghiệp bấm nhận chính thức trên giao diện mới. Database gốc cổng 27017 không được sửa.

## Kiểm tra mới

`node --test --test-concurrency=1 server/test/workflow.integration.test.js`: 10 PASS, 0 FAIL, 1 SKIP (SBT không chạy lại trong lần này).

Hai kịch bản bổ sung kiểm tra: ba hồ sơ ở ba doanh nghiệp, một bên nhận và hai bên nhận thông báo; hai doanh nghiệp nhận cùng một sinh viên đồng thời. Kiểm tra thêm không lộ CV, không tăng số chỗ khi retry, không thông báo trùng, quyền đánh dấu đọc và rút thủ công.

Chrome: 3/3 PASS trên dữ liệu 001 hiện tại — admin thấy cả ba hồ sơ/lịch sử, doanh nghiệp chỉ thấy hồ sơ tiếp nhận còn quyền truy cập, chuông hiện hai thông báo rút và sinh viên không có bước xác nhận thừa. Kiểm tra HTTP cũng xác nhận doanh nghiệp 07 không nhìn thấy hồ sơ 001.

Frontend lint/build PASS. Evidence local: `first-acceptance-001-result.json`, `first-acceptance-browser-results.json` và ảnh tương ứng trong thư mục workflow cache. Không có commit/push hay database TEST mới.

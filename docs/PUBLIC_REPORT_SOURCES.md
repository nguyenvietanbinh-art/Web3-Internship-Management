# Báo cáo công khai để tham khảo và thông báo đã có đề tài

Kiểm tra ngày 07/11/2026.

## Báo cáo thật có nguồn

Trong trang **Báo cáo & kết quả** của giảng viên có mục **Báo cáo mẫu có nguồn công khai**, mở PDF gốc trong thẻ mới:

1. [Xây dựng website MediaWiki cơ bản, Vũ Minh Nguyên, 2023](https://upload.wikimedia.org/wikipedia/commons/7/71/X%C3%A2y_d%E1%BB%B1ng_trang_web_MediaWiki_c%C6%A1_b%E1%BA%A3n_-_2023.pdf): 35 trang. Trang giấy phép của tài liệu ghi CC BY-SA 4.0. Tác giả được giữ nguyên; chưa sao chép hoặc sửa bản PDF.
2. [Báo cáo thực tập nhận thức về LCD, Nguyễn Anh Đức, 2012](https://thuvienso.hcmute.edu.vn/tailieu/2012/20121126/rklonely/baocao_ttnt_65.pdf): 10 trang, thông tin Đại học Bách khoa Đà Nẵng trên bìa, bản công khai tại Thư viện số HCMUTE. Chưa xác minh quyền phân phối lại nên chỉ dẫn liên kết, không lưu bản sao hoặc đưa vào dataset.

Hai PDF được truy cập và đọc metadata/nội dung trước khi đưa link. Không khẳng định nội dung đạt chất lượng chấm nào, không gán tác giả thành tài khoản sinh viên của hệ thống. Có thể mở để xem bố cục, cách trình bày và so sánh các tiêu chí; chưa có luồng tự chấm/import những PDF bên ngoài này. Luồng chấm trước vẫn áp dụng cho bài nộp đúng phạm vi trong hệ thống.

Không vượt đăng nhập/tường phí, không lấy nội dung từ Scribd/Studocu, không sao chép PDF vào Git hoặc upload IPFS.

## Sinh viên đã có đề tài

Khi chọn kỳ đã được doanh nghiệp nhận, giao diện hiện **Bạn đã có đề tài trong kỳ này**, tên đề tài/doanh nghiệp và hướng dẫn xem Kỳ thực tập của tôi. Nút tìm đề tài không cho gửi yêu cầu mới khi trạng thái hiện tại đã được nạp.

API vẫn tự bảo vệ khi dữ liệu giao diện cũ: phản hồi `reason:ALREADY_ADMITTED`, `inference_performed:false`, không gọi AI. Trường hợp không có cơ hội còn tuyển trả lý do riêng `NO_AVAILABLE_OPPORTUNITIES`, không kết luận CV không phù hợp hoặc giả đã chạy AI.

- Kiểm tra đọc database: tài khoản `2211000001@gmail.com` đã được Phú An Security nhận đề tài cổng tuyển dụng, không hủy admission để thử gợi ý.
- Kiểm tra API sau restart đúng Backend demo: sinh viên đã nhận `2211000021@gmail.com` trả đúng lý do, không inference; sinh viên chưa có đề tài `2211000002@gmail.com` đăng nhập được và TF-IDF trả năm gợi ý.
- Tài khoản thử: Nguyễn Quốc Bảo, email `2211000002@gmail.com`, mật khẩu khởi tạo bằng MSSV. GPA 2,13, hai kỹ năng. Chọn kỳ cử nhân đợt tháng 11.
- BERT đang có thể bị guard RAM chặn; TF-IDF đã kiểm HTTP 200. Không đổi database, không tăng quyền hoặc sửa kết quả tiếp nhận.
- Lint/build PASS trước bổ sung liên kết tham khảo; kiểm tra lại sau bổ sung ghi theo log hiện hành. Browser E2E: NOT TESTED.

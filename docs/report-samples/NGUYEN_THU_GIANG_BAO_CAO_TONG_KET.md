BÁO CÁO TỔNG KẾT THỰC TẬP
Sinh viên: Nguyễn Thu Giang
Mã số: 2311000006
Đơn vị: Công ty TNHH An Lạc Digital
Giảng viên hướng dẫn: Nguyễn Minh Hòa
Kỳ: Thực tập cử nhân — Học kỳ II, năm học 2025–2026
Thời gian: 2026-06-01 – 2026-08-31
Đề tài: Website thương mại điện tử — Công ty TNHH An Lạc Digital

BÀI MẪU TỔNG HỢP: tình huống viết báo cáo để thực hành đọc và phân tích, không thay bài nộp đã chốt, không phải bài của người thật. Những thiết kế và ví dụ dưới đây là nội dung bài mẫu; không phải xác nhận một sản phẩm đã được triển khai.

1. Bối cảnh, mục tiêu và phạm vi
Đề tài tập trung vào quản lý danh mục, tìm kiếm và xử lý hồ sơ đặt hàng. Qua khảo sát tình huống, việc ghi thông tin bằng bảng tính gây khó khăn khi nhiều người cùng cập nhật: thiếu trường bắt buộc, không rõ ai thay đổi trạng thái và khó tìm lại hồ sơ. Mục tiêu của bài thực hành là mô tả một luồng có thể kiểm tra từ lúc nhập thông tin đến lúc người có quyền xác nhận.
Phạm vi gồm giao diện tra cứu, biểu mẫu tạo hồ sơ, kiểm tra dữ liệu và trang quản trị theo vai trò. Không đưa thanh toán thật, dữ liệu khách hàng thật hoặc triển khai vận hành vào phạm vi báo cáo. Yêu cầu chất lượng là không làm mất dữ liệu khi có lỗi, không cho tài khoản đọc hồ sơ ngoài quyền và có thông báo giúp người dùng sửa dữ liệu nhập sai.

2. Yêu cầu nghiệp vụ và phân tích
Người xem tìm sản phẩm theo tên và danh mục, đọc thông tin rồi lập yêu cầu đặt hàng. Người quản lý kiểm tra yêu cầu, xác nhận số lượng và cập nhật trạng thái. Cần phân biệt giỏ hàng tạm với đơn đã xác nhận; việc mở trang không được tạo đơn.
Ba tình huống được dùng làm tiêu chí: dữ liệu hợp lệ được tiếp nhận sau khi người dùng xác nhận; dữ liệu thiếu phải chỉ rõ trường cần sửa; người không có quyền phải bị từ chối ngay tại API. Với yêu cầu gửi lặp do mạng chậm, hệ thống cần nhận biết cùng một yêu cầu và tránh tạo hai hồ sơ. Đây là yêu cầu thiết kế, chưa phải kết luận các tình huống đã được kiểm thử thành công.

3. Thiết kế giải pháp
Giao diện được chia thành vùng tìm kiếm, danh sách kết quả và biểu mẫu chi tiết. Từ khóa, bộ lọc và trang hiện tại được đưa vào tham số truy vấn; đổi bộ lọc phải quay về trang đầu. Phần kiểm tra đầu vào trên giao diện giúp người dùng sửa nhanh, còn Backend vẫn kiểm tra lại để không thể vượt bằng cách gọi API trực tiếp.
Mô hình dữ liệu đề xuất gồm User, Category, Item, Request và RequestHistory. Request chứa người tạo, danh sách mục được chọn, trạng thái và phiên bản; RequestHistory lưu người thao tác, thời điểm và lý do thay đổi. Dùng mã định danh để liên kết thay vì ghép theo tên hiển thị. Khi cập nhật hồ sơ, API so phiên bản hiện tại với phiên bản người dùng đã tải để phát hiện chỉnh sửa đồng thời.
Ví dụ dữ liệu đầu vào dùng tên “Sản phẩm thực hành A”, số lượng 2 và mã tham chiếu tự sinh của lần gửi. Nếu số lượng âm hoặc đối tượng tham chiếu không tồn tại thì trả lỗi; không tự sửa thành một đơn hợp lệ. Các ví dụ không chứa địa chỉ, số điện thoại hoặc thông tin khách hàng thật.

4. Cách thực hiện
Bước đầu lập danh sách trường dữ liệu và trạng thái được phép chuyển. Tiếp theo phác thảo giao diện, xác định hợp đồng API rồi mới xây dựng các thành phần xử lý. Một yêu cầu tạo dữ liệu có các bước kiểm đăng nhập, kiểm quyền sở hữu, kiểm tra nội dung, ghi dữ liệu và trả về bản ghi đã lưu. Việc trả thông báo thành công phải xảy ra sau khi lưu xong.
Các API trong thiết kế gồm GET /items để tra cứu; GET /requests/:id để đọc hồ sơ đã có quyền; POST /requests để chủ động gửi; PATCH /requests/:id để sửa với phiên bản và lý do. Khi một thao tác cần cập nhật nhiều bản ghi, cần transaction hoặc cơ chế nhất quán có kiểm tra lại.
Trong giao diện, trạng thái đang xử lý khóa nút gửi để giảm nhấn lặp. Nếu máy chủ không phản hồi, biểu mẫu giữ nội dung đang nhập và hiện lỗi; không tự đổi trạng thái hồ sơ thành đã duyệt. Khi đổi tài khoản phải tải lại dữ liệu theo quyền của tài khoản mới.

5. Công việc và tiến độ trong hồ sơ thực tập
1. Khảo sát yêu cầu và thiết kế dữ liệu: done; tiến độ đã ghi nhận 100%; hạn 2026-06-16.
2. Xây dựng API và phân quyền: done; tiến độ đã ghi nhận 100%; hạn 2026-07-01.
3. Kiểm thử và viết báo cáo: done; tiến độ đã ghi nhận 100%; hạn 2026-07-16.
Có 2 nhật ký và 2 phiên giờ làm; tổng giờ đã duyệt 960 phút. Những số liệu này lấy từ hồ sơ tổng hợp gắn đúng phân công, không phải bằng chứng hiện diện của người thật. Phân công hiện được đánh dấu đã hoàn thành; báo cáo mẫu không mở lại kỳ hoặc thay kết quả đã chốt.

6. Đối chiếu kết quả và yêu cầu
Báo cáo mô tả được đường đi của một hồ sơ từ nhập liệu đến kiểm tra và xử lý. Yêu cầu tra cứu được đối chiếu với tham số từ khóa/danh mục/trang; yêu cầu toàn vẹn dữ liệu được đối chiếu với kiểm tra mã tham chiếu và phiên bản; yêu cầu bảo mật được đối chiếu với kiểm quyền tại từng API.
Phần chưa thể nghiệm thu chỉ bằng nội dung bài là chất lượng mã nguồn, khả năng chịu tải, tính đúng đắn của transaction và trải nghiệm trên thiết bị thật. Cần mở sản phẩm, chạy kịch bản và ghi kết quả trước khi kết luận đạt. Bài mẫu không tạo liên kết repository hoặc ảnh chụp không tồn tại.
7. Kế hoạch kiểm thử và cách ghi bằng chứng
Bảng kiểm tra phải có mã ca, dữ liệu đầu vào, thao tác, kết quả mong đợi, kết quả thực nhận và người xác nhận. Các ca đề xuất gồm:
TC01 — bỏ trống tên: báo trường bắt buộc, không tạo bản ghi.
TC02 — số lượng -1: từ chối dữ liệu; danh sách trước và sau không đổi.
TC03 — tài khoản B đọc hồ sơ của A: từ chối, không trả nội dung riêng tư.
TC04 — gửi lại cùng mã yêu cầu: chỉ có một hồ sơ.
TC05 — cập nhật từ trang đã cũ: báo dữ liệu thay đổi, không ghi đè bản mới.
TC06 — chuyển bộ lọc và quay lại: giữ lựa chọn phù hợp, không tự gửi biểu mẫu.
Đây là các ca cần chạy, chưa phải bảng kết quả PASS. Bằng chứng cần bổ sung là ảnh giao diện, log đã bỏ thông tin nhạy cảm và phiên bản mã nguồn tương ứng.

8. Khó khăn, cách xử lý và bài học
Khó khăn thường gặp trong tình huống là hiểu khác nhau về một trạng thái và thay đổi cấu trúc dữ liệu giữa giao diện với API. Cách xử lý là ghi ví dụ yêu cầu/phản hồi cho từng thao tác và thảo luận trước khi sửa. Một vấn đề khác là gửi lại yêu cầu khi kết nối chậm; cần kiểm soát tại máy chủ thay vì chỉ khóa nút trên giao diện.
Bài học là chia nhỏ yêu cầu thành các tiêu chí có thể kiểm tra, ghi rõ công việc đang làm và việc đã có bằng chứng. Không dùng số lượng dòng mã, độ dài báo cáo hoặc điểm tương đồng nội dung thay cho đánh giá kết quả. Kế hoạch cải tiến là bổ sung kiểm thử quyền truy cập, trình bày sơ đồ dữ liệu, lưu lại lỗi đã tái hiện và xác nhận bàn giao với người hướng dẫn.

9. Tài liệu và phụ lục cần bàn giao
Danh sách cần đối chiếu: tài liệu yêu cầu, sơ đồ dữ liệu, mô tả API, hướng dẫn chạy, bảng kiểm thử và nhật ký. Bài mẫu không đính kèm sản phẩm đã được xác nhận. Phụ lục A là ví dụ dữ liệu nêu tại mục 3; phụ lục B là danh sách kịch bản ở mục 7. Nguồn nội dung: bài viết tổng hợp do công cụ tạo cho Internova dựa trên đề tài và dữ liệu phân công đang lưu, không sao chép một báo cáo của người khác và chưa có nhãn chuyên gia.

10. Kết luận
Bài trình bày được yêu cầu, phương án thực hiện và cách đối chiếu kết quả; việc chấp nhận sản phẩm vẫn phụ thuộc kiểm tra thực tế của giảng viên và doanh nghiệp.
Điểm phân tích/chấm trước nếu có chỉ là đề xuất. Bài mẫu này không tự thay đổi báo cáo, điểm, trạng thái thực tập hoặc phát hành chứng nhận.

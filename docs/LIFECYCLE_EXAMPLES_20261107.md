# Dữ liệu thử theo công đoạn thực tập — 07/11/2026

## Phạm vi

Bổ sung trực tiếp vào `internova_demo_cunhan_kysu_20261107` tại MongoDB replica set local cổng 27018. Website giữ nguyên http://localhost:5188/. Không tạo database mới, không xóa dữ liệu hoặc reset tài khoản cũ.

Đây là fixture tổng hợp được tạo qua Mongoose trong một transaction. Các trạng thái chấm điểm, giờ làm và hoàn thành là ví dụ nghiệp vụ, không phải bằng chứng đã chạy E2E hay hoạt động của người thật. Lịch sử ghi `fixture.*` cùng `synthetic: true`. Không tạo CID, transaction hash hoặc chứng nhận giả.

## Dữ liệu bổ sung

| Hạng mục | Số mới |
| --- | ---: |
| Sinh viên, hồ sơ và CV | 72 |
| Membership sinh viên–kỳ | 72 |
| Hồ sơ ứng tuyển | 48 |
| Cơ hội đề tài ở hai kỳ mới | 24 |
| Phân công (đang thực tập/hoàn thành) | 24 |
| Task | 72 |
| Nhật ký | 48 |
| Phiên giờ làm | 60 |
| Báo cáo tuần/cuối kỳ | 48 |

Mỗi doanh nghiệp có sáu sinh viên mới, mỗi sinh viên một công đoạn: chưa đăng ký kỳ; đã đăng ký, chưa ứng tuyển; chờ xét tuyển; đã được nhận, chờ giảng viên; đang thực tập; hoàn thành. Không thay thế 24 hồ sơ ứng tuyển mẫu đã tạo trước đó.

## Kỳ thực tập

- **Thực tập cử nhân — Học kỳ I, năm học 2026–2027**: 01/10–31/12/2026, đang diễn ra; 12 sinh viên đang thực tập. Có thể nộp báo cáo và thao tác nghiệp vụ hợp lệ.
- **Thực tập cử nhân — Học kỳ II, năm học 2025–2026**: 01/06–31/08/2026, đã đóng; 12 sinh viên hoàn thành. Có báo cáo đã được hai bên nhận xét và nhà trường chốt, KPI đã duyệt, giờ làm đã duyệt. Dùng tra cứu lịch sử, không nộp mới vào kỳ đã kết thúc.
- Hai kỳ sinh tự động trước đây được đổi **tên hiển thị** thành **Thực tập cử nhân — Đợt tháng 11, năm học 2026–2027** và **Thực tập kỹ sư — Đợt tháng 11, năm học 2026–2027**. Giữ nguyên ID, code, ngày, trạng thái và liên kết. Code cũ chứa `DEMO_` được giữ để tránh phá script/liên kết.
- Các kỳ lịch sử nhập từ nguồn ban đầu được giữ nguyên.

## Tài khoản nên thử đầu tiên

Tài khoản nhân sự và mật khẩu của chúng vẫn nằm trong file login local. Sinh viên mới có mật khẩu khởi tạo bằng MSSV, chỉ dùng cho thử nghiệm. Email có dạng Gmail nhưng không gửi email hoặc khẳng định quyền sở hữu hộp thư.

| Email sinh viên | Công đoạn | Thao tác nên thử |
| --- | --- | --- |
| 2311000001@gmail.com | Được cấp kỳ, chưa đăng ký | Đăng ký tham gia kỳ |
| 2311000002@gmail.com | Đã đăng ký, chưa ứng tuyển | Xem đề tài, gợi ý phù hợp, ứng tuyển |
| 2311000003@gmail.com | Chờ doanh nghiệp 1 xét | Xem lịch sử ứng tuyển; doanh nghiệp xét nhận |
| 2311000004@gmail.com | Được doanh nghiệp 1 nhận, chưa có giảng viên | Admin phân công giảng viên |
| 2311000005@gmail.com | Đang thực tập tại doanh nghiệp 1 | Task, nhật ký, vào/ra ca, nộp báo cáo, KPI |
| 2311000006@gmail.com | Hoàn thành tại doanh nghiệp 1 | Tra cứu báo cáo đã chốt, điểm và tổng giờ |

Mật khẩu của sinh viên đầu tiên là `2311000001`, các sinh viên còn lại tương tự MSSV của mình.

- Doanh nghiệp thử: `enterprise-1@example.invalid`.
- Giảng viên thử: `lecturer-1@example.invalid`.
- Nhà trường thử: `school-1@example.invalid`.
- Mật khẩu nhân sự: lấy trong file login local hiện có, không ghi lên Git.
- Doanh nghiệp 2 tương ứng sinh viên 7–12; doanh nghiệp 3: 13–18; tiếp tục như vậy đến doanh nghiệp 12: 67–72. Giảng viên có số thứ tự tương ứng.
- Danh sách chi tiết đã được thêm cuối **manual-login-combined.txt**. Bản riêng là **manual-login-lifecycle.txt**, cùng thư mục cache. Hai file đều nằm ngoài Git do `node_modules` được ignore.

## Trình tự thử

1. Ctrl+F5 website. Dùng mỗi tài khoản trong cửa sổ riêng hoặc đăng xuất trước khi đổi vai trò.
2. Sinh viên 5: vào báo cáo, chọn phân công thuộc Học kỳ I 2026–2027; xem báo cáo tuần và cuối kỳ, nộp bản mới nếu cần. Có ba task, hai nhật ký, ba phiên giờ làm (đã duyệt/chờ duyệt/cần điều chỉnh). Tổng giờ đã duyệt ban đầu: 480 phút = 8 giờ.
3. Doanh nghiệp 1: xét sinh viên 3; kiểm tra sinh viên 5, task chờ kiểm tra, nhật ký, phiên giờ cần xử lý và báo cáo chờ đánh giá.
4. Giảng viên 1: xem báo cáo sinh viên 5 và 6; chấm báo cáo đang chờ nhận xét; phân tích báo cáo. Cảnh báo quy tắc và độ tương đồng không được xem là classifier đã huấn luyện.
5. Admin: phân công giảng viên cho sinh viên 4. Với báo cáo được cả hai bên chấp thuận, duyệt đủ KPI trước khi chốt cuối kỳ.
6. Sinh viên 6: xem kỳ đã kết thúc, hai báo cáo được duyệt, điểm 85 và 960 phút = 16 giờ mẫu. Nút nộp mới bị khóa theo quy tắc thời gian.
7. Sinh viên 1/2: thử quy trình đăng ký/ứng tuyển từ đầu. Sau khi được doanh nghiệp nhận vẫn cần trường phân công chính thức trước khi mở các nghiệp vụ thực tập.

Các doanh nghiệp luân phiên có báo cáo cuối kỳ đang nộp, đã đủ hai nhận xét hoặc cần chỉnh sửa để thử các tình huống. Kỳ đã đóng được giữ trong phạm vi xem báo cáo bằng phân công completed còn hiệu lực lưu trữ (`activePlacement:true`), không phải quyền ghi mới.

## Kiểm thử thực tế

- Guard xác minh đúng URI/database/replica set và unique indexes trước ghi. Lần kiểm tra đầu dừng vì script chưa bật cờ email/Google giống Backend; chưa ghi dữ liệu. Đã bổ sung đúng cờ, không sửa index.
- 72 sinh viên và toàn bộ fixture được ghi trong một transaction; không drop database/collection hoặc reset.
- 878 document cũ ngoài collections kỳ/cơ hội được đối chiếu hash BSON và giữ nguyên. Collections kỳ/cơ hội có các cập nhật dự kiến: hai tên kỳ, lịch sử và số chỗ tương ứng 12 admission mới. Chỉ số chỗ được kiểm tra với admission thực tế. Không sửa database gốc hoặc demo cũ.
- Đăng nhập API: Admin, doanh nghiệp 1, giảng viên 1, sinh viên đang thực tập và hoàn thành đều HTTP 200.
- Admin nhìn thấy 48 báo cáo, 72 task, 48 nhật ký, 60 phiên mới. Doanh nghiệp/giảng viên 1 thấy 4 báo cáo, 6 task, 4 nhật ký, 5 phiên.
- Sinh viên đang thực tập nhìn thấy đúng 2 báo cáo, 3 task, 2 nhật ký, 3 phiên và 480 phút duyệt. Sinh viên hoàn thành: 2 báo cáo, 3 task, 2 nhật ký, 2 phiên và 960 phút.
- Sinh viên truy vấn báo cáo phân công của sinh viên khác: HTTP 404.
- Phân tích báo cáo bằng TF-IDF qua giảng viên: HTTP 200; classifier `NOT_TRAINED`, không tạo confidence giả.
- Browser E2E và các thao tác nộp/chấm/duyệt sau fixture: NOT TESTED ở lần bổ sung này. Các phép kiểm API ở đây là đọc/đăng nhập/phân tích; không được coi là đã kiểm thử toàn bộ luồng ghi nghiệp vụ.
- IPFS, giao dịch blockchain, chứng nhận on-chain: BLOCKED theo cấu hình runtime hiện tại; không seed trạng thái thành công.

## Giao diện liên quan

- Trang báo cáo dùng tiêu đề theo vai trò: **Báo cáo thực tập của tôi**, **Báo cáo sinh viên phụ trách**, **Quản lý kết quả báo cáo thực tập**.
- Bộ chọn hồ sơ trong báo cáo/chấm công dùng nhãn theo vai trò.
- Khi báo cáo không còn thao tác hợp lệ, ẩn nút chấm/chốt và giữ lý do để biết đang chờ bước nào.
- Giảng viên/Admin không có cột Thao tác giờ làm; sinh viên không có dòng `Chỉ xem` cho phiên đã đóng.
- Không thay API, schema hoặc phân quyền Backend.

Script bổ sung: `server/scripts/add-lifecycle-examples.cjs`. **Đã chạy; không chạy lại.** Marker trong cache và kiểm tra trùng code/email ngăn tạo trùng. Tài liệu này không chứa mật khẩu nhân sự, private key hoặc token.

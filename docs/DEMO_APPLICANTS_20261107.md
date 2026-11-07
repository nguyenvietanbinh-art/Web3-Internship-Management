# Thử ứng tuyển, phân công và phân tích độ phù hợp

## Môi trường

- Website: http://localhost:5188/
- Backend: http://127.0.0.1:57418/api
- Database duy nhất được bổ sung: `internova_demo_cunhan_kysu_20261107`, replica set `internovaTestRs`, cổng 27018.
- Tài khoản/mật khẩu nhân sự: file local đã được Git ignore `contracts/node_modules/.cache/workflow-combined-20261107/manual-login-combined.txt`. Không đưa file này lên Git.
- Sinh viên mẫu dưới đây đăng nhập email `<MSSV>@gmail.com`, mật khẩu khởi tạo là MSSV. Đây là dữ liệu tổng hợp, không gửi email đến các địa chỉ này.

## Phân quyền đã sửa

- Giảng viên (`mentor`): phân tích báo cáo thuộc phân công mình phụ trách; giữ nguyên kiểm tra phạm vi sở hữu báo cáo.
- Doanh nghiệp: xếp hạng ứng viên đã ứng tuyển đề tài của mình, không có công cụ phân tích báo cáo.
- Sinh viên: đối chiếu CV với cơ hội trong kỳ được cấp.
- Nhà trường: quản lý kỳ, sinh viên và phân công; không có công cụ phân tích báo cáo.
- Giao diện chỉ tải danh sách báo cáo cho giảng viên. API phân tích báo cáo chỉ cho `mentor`, các vai trò khác bị chặn 403.

## Các nhóm dữ liệu mới

Thực hiện qua service ứng tuyển, tiếp nhận và phân công hiện có, không chèn trạng thái thành công giả hoặc bỏ qua điều kiện nghiệp vụ:

| Nhóm | Số lượng mới |
| --- | ---: |
| Đã ứng tuyển, chờ doanh nghiệp xét | 12 |
| Doanh nghiệp đã nhận, chưa phân công giảng viên | 6 |
| Đã nhận và phân công giảng viên đầy đủ | 6 |
| Tổng hồ sơ ứng tuyển mới | 24 |

Trải đều trên hai kỳ `DEMO_CN_2026`, `DEMO_KS_2026`, ba doanh nghiệp và ba giảng viên đầu tiên. Mỗi doanh nghiệp có một đề tài được bổ sung bốn ứng viên trong mỗi kỳ. Mỗi sinh viên chỉ dùng một lượt ứng tuyển.

| Doanh nghiệp | Giảng viên | Hậu tố MSSV: đã phân công | Đã nhận, chờ giảng viên | Chờ xét tuyển |
| --- | --- | --- | --- | --- |
| enterprise-1@example.invalid | lecturer-1@example.invalid | 000021 | 000022 | 000023, 000024 |
| enterprise-2@example.invalid | lecturer-2@example.invalid | 000025 | 000026 | 000027, 000028 |
| enterprise-3@example.invalid | lecturer-3@example.invalid | 000029 | 000030 | 000031, 000032 |

Ghép tiền tố `2211` cho cử nhân, `2212` cho kỹ sư. Ví dụ:

- `2211000021@gmail.com`: cử nhân, đã phân công doanh nghiệp 1 và giảng viên 1.
- `2211000022@gmail.com`: doanh nghiệp 1 đã nhận, nhà trường có thể phân công giảng viên.
- `2211000023@gmail.com`: chờ doanh nghiệp 1 xét tuyển.
- `2211000040@gmail.com`: sinh viên đã đăng ký kỳ, chưa được tạo ứng tuyển bởi script này.
- `2211000060@gmail.com`: sinh viên chưa đăng ký kỳ, được giữ để thử đăng ký.
- Thay `2211` bằng `2212` để thử nhóm kỹ sư tương ứng.

Tại thời điểm kiểm tra: toàn database có 87 sinh viên đã đăng ký nhưng chưa được nhận đề tài và 100 sinh viên chưa đăng ký kỳ. Số liệu bao gồm dữ liệu bạn đã thao tác trước đó; không được xem là hằng số sau khi tiếp tục thử nghiệm.

## Các bước thử

### Nhãn giao diện theo vai trò

- Doanh nghiệp: menu/tiêu đề **Đánh giá độ phù hợp**; form **Xếp hạng ứng viên theo đề tài**, trường **Đề tài tuyển thực tập**, **Số ứng viên hiển thị**, nút **Xếp hạng ứng viên**.
- Sinh viên: menu **Gợi ý đề tài phù hợp**; trường **Kỳ thực tập của tôi**, **Số đề tài gợi ý**, nút **Tìm đề tài phù hợp**. Kết quả rỗng dùng thông báo về đề tài, không gọi là ứng viên.
- Giảng viên: menu **Phân tích báo cáo thực tập**, trường **Báo cáo của sinh viên phụ trách**, nút **Phân tích báo cáo**. Phần giới hạn kết quả giải thích cảnh báo báo cáo thay vì xác suất tuyển dụng.
- Nhà trường: ẩn menu phân tích vì hiện không có thao tác phân tích dành cho vai trò này.
- Nhãn menu, tooltip, breadcrumb, tiêu đề trang và tiêu đề tab trình duyệt dùng chung nhãn theo vai trò.
- Xác minh sau đổi nhãn: lint PASS, build PASS (`client/dist/role-analysis-labels`), `git diff --check` PASS. Chưa chạy browser E2E cho thay đổi nhãn. Không đổi API, phân quyền Backend hoặc dữ liệu.

1. Mở website, Ctrl+F5 và đăng nhập `enterprise-1@example.invalid` bằng mật khẩu trong file local.
2. Mở phần AI/xếp hạng ứng viên. Chọn đề tài có hồ sơ mẫu. Có thể thử TF-IDF trước, sau đó Sentence-BERT và bấm **Phân tích độ phù hợp**.
3. Đề tài đã kiểm tra có bốn ứng viên. Nếu chọn đề tài khác chưa có ứng tuyển, danh sách rỗng là kết quả hợp lệ. Tên đề tài và ID chính xác được ghi ở file local `applicant-fixtures-result.json` cùng thư mục file login.
4. Mở hồ sơ ứng tuyển, xem CV chụp tại lúc ứng tuyển của các sinh viên 23/24; thử nhận một người nếu muốn thay đổi trạng thái demo. Số chỗ chỉ giảm khi tiếp nhận thành công.
5. Đăng xuất, đăng nhập `school-1@example.invalid`. Chọn kỳ cử nhân, tìm sinh viên 22 hoặc 26: đã được doanh nghiệp nhận nhưng còn thiếu giảng viên. Phân công giảng viên và chọn ngày bao trùm toàn bộ hạn KPI trong kỳ.
6. Đăng nhập `lecturer-1@example.invalid`: có sẵn phân công của sinh viên 21 ở cả hai kỳ. Phân tích báo cáo chỉ có nội dung sau khi sinh viên nộp báo cáo hợp lệ; script này không tạo báo cáo giả.
7. Đăng nhập từng sinh viên ví dụ ở trên để đối chiếu các trạng thái. Nhóm đã phân công có lifecycle `approved`, không được tự coi là đã bắt đầu làm việc: ngày bắt đầu các kỳ vẫn ở tương lai.

## Bằng chứng kiểm thử 2026-11-07

- JavaScript syntax check: PASS.
- Frontend lint: PASS.
- Frontend build: PASS; output Git ignored `client/dist/student-evidence-label`. Có thông báo hiệu năng callback từ bundler và thông báo phiên bản npm mới; không nâng npm.
- Unit/route tests: 3/3 PASS, gồm hai test guard database và một test route phân tích báo cáo theo vai trò. Test route dùng identity do harness cung cấp, không thay thế test xác thực JWT.
- Backend demo được khởi động lại với cấu hình cũ, MongoDB/Frontend giữ chạy. Health: HTTP 200.
- Đăng nhập API bằng tài khoản demo cho cả bốn vai trò: PASS. Dùng sinh viên 21; sinh viên đầu tiên trong file login trả 401 với mật khẩu khởi tạo nên không reset hoặc sửa tài khoản đó.
- API phân tích báo cáo: company/admin/student 403; mentor 400 khi gửi ID cố ý không hợp lệ, chứng minh qua cổng phân quyền nhưng chưa kiểm thử inference báo cáo thật.
- API doanh nghiệp 1 trả đủ tám hồ sơ mẫu trên hai kỳ; giảng viên 1 thấy hai phân công mẫu.
- TF-IDF: HTTP 200, bốn ứng viên/bốn kết quả thật.
- Sentence-BERT: HTTP 200, bốn ứng viên/bốn kết quả thật.
- Kiểm tra database: mỗi sinh viên fixture một lượt ứng tuyển, admission/assignment đúng nhóm, `confirmedCount` của sáu cơ hội khớp số admission thực tế.
- Browser E2E sau thay đổi này: NOT TESTED.
- Chưa đánh giá chất lượng AI trên nhãn chuyên gia; dữ liệu CV tổng hợp còn đơn giản.

## Phạm vi và xử lý lỗi

- Không thay schema, không seed lại toàn database, không xóa dữ liệu hay sửa database gốc/import/demo cũ. Không deploy hoặc tạo giao dịch blockchain.
- Script bổ sung: `server/scripts/prepare-demo-applicants.cjs`; đã chạy xong, không chạy lại. Có guard chặn fixture đã hoàn tất và checkpoint local.
- Lần đầu script dừng tại phân công do truyền đối tượng Date thay vì chuỗi ISO; đã sửa script và tiếp tục có kiểm tra chống trùng bằng `--resume`. Không rollback bằng thao tác xóa; trạng thái cuối được xác minh.
- File local `applicant-fixtures-result.json`, `applicant-fixtures-checkpoint.json`, `applicant-runtime-checks.json` lưu các ID và bằng chứng; không chứa token hay mật khẩu trong kết quả kiểm thử.
- Không commit/push/merge.

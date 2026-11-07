# Nhận dữ liệu mới — 06/11/2026

## Đã kiểm tra và sắp xếp

- File nhận được: `database.gz`, 12.814 byte; là gzip của mongodump archive, không phải tệp để thay trực tiếp vào source.
- Đã chuyển nguyên file sang `database/local-imports/database-20261106.gz`, thêm thư mục này vào Git ignore. Không sửa nội dung archive.
- SHA256: `34d4e64153160de13c7dbf12b6ca8d4fdcdb9e0afb60b239a30b63173adea2c5`.
- Metadata archive chứa25collection của database `web3_internship_test_phase1_khoa_20261106`.
- Chưa restore, chưa thay kết nối ứng dụng hoặc dừng Backend. Công cụ mongorestore chưa có trong PATH và các vị trí local đã kiểm tra.

## Quy trình dự kiến sau phê duyệt công cụ

1. Tải Database Tools portable từ MongoDB chính thức; xác minh bản/nguồn/checksum khi có. Không cài service hoặc đổi PATH hệ thống.
2. Kiểm tra MongoDB đang chạy, chọn database đích TEST mới có hậu tố riêng, exact allowlist và xác minh chưa tồn tại. Không restore vào tên database đang demo hoặc tên database nguồn nếu đã có dữ liệu.
3. Dùng mongorestore với `--archive`, `--gzip`, `--nsInclude` và mapping `--nsFrom`/`--nsTo` để đổi namespace sang database mới. Không `--drop`, không import users/roles quản trị MongoDB, không ghi đè database cũ. Nếu restore lỗi, giữ log và DB đích để kiểm tra, không tự xóa.
4. Đối chiếu collection/count/index/schema thực tế với source ae71d4b; không tự đổi quyền/password hoặc chỉnh các record không tương thích. Lập kế hoạch cụ thể nếu cần thay index.
5. Kiểm tra tài khoản trong DB mới ở mức cấu trúc và vai trò; file login cũ thuộc database cũ, không tự coi là mật khẩu hợp lệ cho dữ liệu mới. Không trích hash/JWT/secrets ra tài liệu.
6. Chỉ khi readiness đạt, dừng đúng Backend cũ đã xác minh PID/command/start time, chạy start-unified với URI TEST mới và thư mục runtime output mới. Không seed staff. Frontend tiếp tục localhost5182 → Backend57407; cần đăng nhập lại.
7. Health/readiness và API đọc; không tự gửi giao dịch/mint hoặc sửa chain references từ máy khác. Bằng chứng blockchain trong dump không đồng nghĩa có thể verify trên Hardhat hiện tại.

Giữ nguyên database gốc/demo/TEST manual cũ, file login cũ và chain hiện tại. Không commit/push file dữ liệu hoặc mật khẩu. Việc tải công cụ đang chờ người dùng phê duyệt riêng theo quy tắc không tự cài dependency/công cụ.

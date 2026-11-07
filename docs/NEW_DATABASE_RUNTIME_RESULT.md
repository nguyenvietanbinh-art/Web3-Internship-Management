# Chạy code mới với dữ liệu mới — 06/11/2026

Đã restore `database/local-imports/database-20261106.gz` vào database mới `web3_internship_test_phase1_import_f8d067c0` trên MongoDB local127.0.0.1:27017. Không ghi đè database nguồn hoặc database manual cũ.

- MongoDB Database Tools100.20.1 portable tải từ [trang MongoDB chính thức](https://www.mongodb.com/try/download/database-tools/releases/archive), giải nén trong contracts/node_modules/.cache/mongodb-tools-100.20.1. Không cài service/PATH. SHA256 ZIP local: `5a1a8aa2c87ca0685ffdcad403601b110d495d44afe579473b8f75ec46621c80`; không tìm được sidecar checksum ở URL đã thử; binary không có Authenticode signature. Không tuyên bố có đối chiếu hash với checksum nhà phát hành.
- Restore bằng namespace mapping theo [mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/), không --drop;25collection,40document thành công,0lỗi. Có6User:1Admin,1company,1mentor,3student;8JD,8đề tài,2kỳ,4phân công.
- Hash/count/index protected DB gốc, hai demo và manual cũ không đổi trước/sau restore. Không seed/reset password/migration hoặc sửa các record imported. Index được restore từ dump đã đáp ứng verifyIndexes; không cần apply kế hoạch4index trên DB manual cũ.
- Code mới đã qua provisional readiness trên cổng tạm. Sau đó dừng đúng Backend cũ PID27252 đã kiểm command/port/starttime, khởi động code mới PID21580 trên57407 với URI mới, autoIndex/autoCreate=false, không --test-staff.
- Health/ready HTTP200, Frontend http://localhost:5182/ HTTP200. Không restart MongoDB/RPC hoặc deploy blockchain.

Runtime mới: `contracts/node_modules/.cache/import-khoa-20261106-f8d067c0/runtime/runtime.json`. Restore log, snapshot, readiness, summary và backend-switch.json nằm trong thư mục cha. Metadata/runtime/file login cũ được bảo toàn nhưng helper dùng PID cũ không còn dùng được cho phiên hiện tại.

Đăng xuất hoặc Ctrl+F5 rồi đăng nhập lại bằng tài khoản/mật khẩu của dữ liệu mới do nhóm cung cấp. `manual-login.txt` cũ thuộc database cũ; chưa xác minh mật khẩu đó với tài khoản imported, không coi là thông tin đăng nhập mới. Không tự reset mật khẩu hoặc chép tài khoản từ DB cũ sang.

Chưa kiểm toàn bộ browser E2E/AI/IPFS/blockchain trên dữ liệu imported. Không coi reference blockchain từ máy khác là bằng chứng hợp lệ trên Hardhat local hiện tại. Lỗi atomic report trước đây chưa được sửa.

MongoDB server executable: `C:\Users\PC\AppData\Local\Programs\MongoDB\8.0.34\mongodb-win32-x86_64-windows-8.0.34\bin\mongod.exe`. Storage cũ được giữ tại `C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\data`. Không chỉnh trực tiếp các file WiredTiger/journal. Chưa tìm thấy Compass trong các vị trí cài đặt thông dụng đã kiểm.

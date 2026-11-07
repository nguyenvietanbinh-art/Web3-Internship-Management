# Khởi động MongoDB local an toàn

Ngày kiểm tra: **30/10/2026**, Asia/Bangkok. Branch `branch_1`.

## Kết quả

**MongoDB Community 8.0.34 đã khởi động thành công và đang chạy ở thời điểm kiểm tra.** Chưa khởi động Backend.

| Thông tin | Giá trị |
| --- | --- |
| PID tại thời điểm kiểm tra | 15528 |
| Bind address | 127.0.0.1 |
| Port | 27017 |
| Data directory | `C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\data` |
| Log | `C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\logs\mongod-20261030-152849-d98fd3a6.log` |
| Executable | `C:\Users\PC\AppData\Local\Programs\MongoDB\8.0.34\mongodb-win32-x86_64-windows-8.0.34\bin\mongod.exe` |
| Readiness | Log có `Waiting for connections` và `mongod startup complete` |
| Driver ping | `admin.command({ ping: 1 })` trả **ok: 1**, exit 0; đã đóng kết nối client |
| Windows Service/autostart | Không cài/đăng ký service hoặc startup task |

## Kiểm tra trước khi khởi động

- Terminal kiểm tra gọi được mongod 8.0.34 và Node 22.23.4 bằng đường cài người dùng; PATH chỉ được bổ sung trong process để tránh terminal cũ chưa nhận PATH mới.
- Đọc JWT_SECRET từ biến môi trường **User** vào process kiểm tra. Getter config backend xác nhận giá trị tồn tại và đạt độ dài bắt buộc; **không in giá trị bí mật** hoặc tạo file chứa secret.
- Đọc `server/src/config/env.js`: URI thực tế vẫn là **`mongodb://127.0.0.1:27017/web3_internship`**, không có override MONGODB_URI trong môi trường được kiểm tra. Không tự đổi URI.
- Không thấy tiến trình mongod, listener 27017 hoặc MongoDB service trong kiểm tra hệ thống.
- Kiểm tra bổ sung bằng TcpListener với ExclusiveAddressUse đã bind thử được 127.0.0.1:27017 rồi giải phóng, xác nhận cổng có thể dùng ngay trước startup.
- Data directory chưa tồn tại. Đường dẫn nằm ngoài repository, kiểm tra các ancestor không có reparse point; sau đó mới tạo thư mục mới. Nếu phát hiện dữ liệu cũ hoặc port/process đang dùng, thao tác đã được thiết kế để dừng, không ghi đè hoặc dùng lại.

## Cách đã khởi động và kiểm tra

Mongod được mở bằng Start-Process với WindowStyle Hidden, không phải Windows Service, với các tham số:

```text
--bind_ip 127.0.0.1
--port 27017
--dbpath C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\data
--logpath C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\logs\mongod-20261030-152849-d98fd3a6.log
```

Log được tạo tên mới, không ghi đè log có sẵn. Sau startup, hệ thống xác nhận listener **127.0.0.1:27017 thuộc PID 15528**. Không bind 0.0.0.0 hoặc mở cổng LAN.

Ping dùng MongoDB Node driver đã cài trong server, kết nối trực tiếp localhost với timeout hữu hạn; chỉ thực hiện:

```javascript
await client.connect();
await client.db('admin').command({ ping: 1 });
await client.close();
```

Không import Backend entrypoint, Mongoose model, seed hay test helper. Không insert/update/delete, createIndex, createCollection, migration, dropDatabase hoặc lệnh quản trị thay đổi cấu hình. Việc mongod khởi động tự tạo file storage/WiredTiger/journal và dữ liệu nội bộ cần thiết; **không có dữ liệu nghiệp vụ được ghi bởi bước kiểm tra này**. Không chủ động tạo database `web3_internship`.

## Warning được ghi nhận

Startup log không có error/fatal trong các entry đã kiểm tra. Có các warning:

- Access control chưa bật: các process truy cập được MongoDB có thể đọc/ghi mà không cần tài khoản DB. Hiện chỉ bind loopback; không phù hợp để mở ra mạng hoặc dùng cho production khi chưa cấu hình authentication.
- Mongod điều chỉnh max connections theo `capMemoryConsumptionForPreAuthBuffers`.
- Có warning tên server parameter deprecated và `sslMode` nên chuyển sang `tlsMode`. Không tự thêm/đổi parameter để xử lý warning; dòng lệnh startup ở trên không cấp các parameter này.

Các warning không ngăn readiness hoặc ping. Không thay đổi database để tạo tài khoản/xử lý auth trong đợt này.

## Backend cần cấu hình gì tiếp theo?

1. **MongoDB URI:** source default đã trỏ đúng instance này. Không bắt buộc sửa source hay tạo .env. Khi được phép mở Backend có thể đặt MONGODB_URI trong process để ghi rõ đích, vẫn dùng `mongodb://127.0.0.1:27017/web3_internship`.
2. **JWT_SECRET:** đã lưu ở Windows User environment và được xác minh hợp lệ; terminal chạy Backend phải nhận biến mới. Nếu terminal/app cũ không nhận, nạp biến User vào process mà không echo giá trị. Không thay secret hoặc ghi secret vào báo cáo/Git.
3. **AI_SERVICE_URL:** mặc định `http://localhost:8000`; AI chưa được khởi động trong nhiệm vụ này. Chưa xác minh Node→AI bằng request phân tích thật.
4. **PINATA_JWT:** vẫn cần người dùng cấp qua cơ chế bí mật khi muốn submit/complete có IPFS thật; chưa cấp thì các thao tác này sẽ trả 503 theo source.
5. **CORS_ORIGIN/VITE_API_URL:** thống nhất origin/port frontend và base API có `/api` trước demo; không tự sửa cấu hình trong nhiệm vụ này.
6. **BLOCKCHAIN_RPC_URL:** mặc định `http://127.0.0.1:8545`; chưa chạy node/deploy. MongoDB ping thành công không chứng minh tích hợp blockchain hoạt động.

## Rủi ro trước khi cho phép Backend chạy

- `server/src/index.js` kết nối Mongoose, có thể tự tạo collection/index theo models; đây là ghi database dù chưa click chức năng.
- Sau DB connect, chain listener được gọi và có thể backfill/update ChainEvent/Topic nếu RPC đang hoạt động. Cần xác nhận phạm vi DB demo và chain trước.
- Một số GET trong `internship.routes.js` tự tạo sample; mở frontend có thể ghi dữ liệu ngay. Không coi UI/read-only GET là không có tác động.
- Test helper vẫn có dropDatabase; không chạy `npm test`, seed hoặc migration hiện tại.
- Instance là standalone local, chưa thiết lập replica set; không mặc định mọi transaction flow về sau sẽ được hỗ trợ.
- Không bật service/autostart: tiến trình cần quản lý thủ công, có thể không tiếp tục sau đăng xuất/reboot. Lần khởi động sau thư mục đã có storage, phải xác nhận quyền tái sử dụng thay vì chạy lại điều kiện “thư mục mới/rỗng”; không xóa thư mục để vượt kiểm tra.
- Các lỗi nghiệp vụ/verified giả/phân quyền trong audit vẫn tồn tại; việc MongoDB sẵn sàng không xác nhận đồ án đã demo đầy đủ.

## Bảo toàn và điểm dừng

Không khởi động Backend/AI/frontend, không tạo .env, không sửa source/config/lockfile, không xóa dữ liệu/untracked, không commit/push/merge. `git diff --exit-code` đạt, các untracked trước đó được giữ nguyên. Chỉ thêm báo cáo này trong repository; file storage/log MongoDB nằm ngoài repo.

**Dừng sau MongoDB ping thành công, giữ mongod đang chạy và chờ người dùng xác nhận trước khi mở Backend.**

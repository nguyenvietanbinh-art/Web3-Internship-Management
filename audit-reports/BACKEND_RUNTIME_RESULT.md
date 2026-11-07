# Kết quả khởi động Backend có kiểm soát

Ngày kiểm tra: **30/10/2026**, Asia/Bangkok. Branch **branch_1**, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`.

## 1. Kết luận

**Backend đã khởi động thành công, kết nối MongoDB và đang chạy ở thời điểm kiểm tra.** Chỉ gọi một HTTP endpoint: **GET `/api/health`**. Không mở Frontend hoặc gọi API nghiệp vụ.

- Script hiện có: **`npm.cmd start` → `node src/index.js`**, working directory `D:\Web3-Internship-Management\server`.
- Cổng: **5000**; PID node lắng nghe: **14084**. Launcher cmd/npm: **2536**.
- MongoDB: **`mongodb://127.0.0.1:27017/web3_internship`**, mongod PID **15528**.
- Trước khởi động: database `web3_internship` **chưa tồn tại, 0 collection**.
- Sau khởi động: **14 collection, 36 index tổng cộng, 0 document**. Kiểm tra đọc lại sau quan sát vẫn **14 collection, 0 document**.
- Không có lỗi runtime nghiêm trọng trong log đã kiểm tra; stderr **0 byte**.
- Pinata chưa cấu hình; AI và RPC local chưa chạy. Các tích hợp này không chặn boot nhưng chưa đủ cho demo nghiệp vụ.
- HTTP listener thực tế bind **`::`**, không riêng loopback; đây là hành vi `app.listen(config.port)` hiện tại, cần xử lý/giới hạn trước khi mở phạm vi tích hợp rộng hơn.

## 2. Giai đoạn A — Kiểm tra trước khi chạy

Đã đối chiếu các báo cáo audit/runtime/install và đọc entrypoint, app, middleware, routes, model, services và listener hiện tại. Các báo cáo cũ mô tả thiếu Node/dependency/MongoDB là lịch sử, không thay thế kiểm tra thực tế lần này.

### Luồng khởi động đã đọc

1. `server/src/index.js` nạp config, Mongoose, createApp và chainListener.
2. Đọc getter JWT_SECRET; thiếu hoặc dưới 16 ký tự sẽ throw trước listen.
3. `createApp()` đăng ký CORS/JSON parser, auth/topics/data/internship routes; các require nạp **14 model**. Đăng ký route không tự chạy handler.
4. `mongoose.connect(config.mongoUri)` tại `src/index.js:12` mở kết nối; Mongoose thực có defaults **autoCreate=true, autoIndex=true**.
5. Khi kết nối thành công, `startChainListener()` được gọi tại `src/index.js:15`.
6. `app.listen(config.port)` tại `src/index.js:22` mở HTTP trước khi promise MongoDB hoàn tất; vì vậy log “Server running” chưa đủ để kết luận DB sẵn sàng.

Middleware auth chỉ đọc token/user/topic trong các request được bảo vệ; role/ownership middleware không phải seed. Hook validate KPI và các default trong schema không tự tạo document nghiệp vụ khi chỉ import model. Không thấy seed, migration, scheduler ứng dụng khác được gọi ở top-level startup ngoài chain listener.

Đã kiểm kê model/index bằng cách tạo app trong một process **không gọi mongoose.connect/listen**; xác nhận Mongoose vẫn disconnected. Không dùng cách này để kết nối DB hoặc thực thi route.

### Các kiểm tra chặn khởi động

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| JWT_SECRET | Nạp từ Windows User environment vào process; getter config chấp nhận. Không hiển thị giá trị |
| URI DB | Khớp tuyệt đối local target được duyệt, không trỏ Atlas/DB khác |
| MongoDB | admin ping `ok:1`, mongod PID 15528 đang chạy |
| DB mới | admin listDatabases filter `web3_internship` không có kết quả; listCollections trả `[]` |
| Port backend | 5000 ECONNREFUSED, không có listener; kiểm tra lại ngay trước launch |
| RPC | 8545 ECONNREFUSED; target đúng `http://127.0.0.1:8545`, kiểm tra lại chưa có listener trước launch |
| AI | 8000 ECONNREFUSED; chưa start |
| .env | Không có .env root/server bất ngờ; không tạo hoặc sửa file |
| npm startup | package.json chỉ có start=`node src/index.js`; không có prestart/poststart |

Các thao tác xác nhận DB mới dùng MongoDB driver trực tiếp với listDatabases/listCollections/ping, chỉ đọc. Không import test helper hoặc chạy seed để chuẩn bị dữ liệu.

## 3. Mọi ghi database có thể xảy ra trong startup

### Mongoose: tạo cấu trúc theo model

Khi các model được nạp và kết nối mở, Mongoose có thể **createCollection** và **createIndexes**. Không dùng syncIndexes/dropIndexes trong entrypoint. Các collection ban đầu chưa tồn tại nên đây là tạo mới metadata trên DB demo, không ghi đè dữ liệu cũ.

| Model / Collection | Loại tác động khi khởi động | Index tổng đã quan sát | Document |
| --- | --- | --- | --- |
| User / users | Tạo collection; unique walletAddress | 2 | 0 |
| Student / students | Tạo collection; unique userId; unique sparse studentCode | 3 | 0 |
| Company / companies | Tạo collection; unique userId | 2 | 0 |
| AuthNonce / auth_nonces | Tạo collection; unique walletAddress; TTL expiresAt, expireAfterSeconds=0 | 3 | 0 |
| Topic / topics | Tạo collection; onChainId; companyId; companyId+status | 4 | 0 |
| Assignment / assignments | Tạo collection; studentId+status; topicId | 3 | 0 |
| Submission / submissions | Tạo collection; unique assignmentId+milestoneIndex+version | 2 | 0 |
| KPIEvaluation / kpi_evaluations | Tạo collection; assignmentId; unique assignmentId+milestoneIndex | 3 | 0 |
| AIAnalysis / ai_analyses | Tạo collection; unique submissionId | 2 | 0 |
| ChainEvent / chain_events | Tạo collection; processed; unique txHash+logIndex | 3 | 0 |
| JD / job_descriptions | Tạo collection, chỉ index mặc định | 1 | 0 |
| Task / internship_tasks | Tạo collection, chỉ index mặc định | 1 | 0 |
| Attendance / attendances | Tạo collection; studentWallet; companyWallet; unique studentWallet+date | 4 | 0 |
| WorkLog / work_logs | Tạo collection; studentWallet; companyWallet | 3 | 0 |

Mỗi dòng đã bao gồm `_id_` index mặc định. Tổng **14 `_id_` + 22 index khai báo = 36 index**. Không tạo hoặc xóa index bằng lệnh thủ công để đạt con số này; chỉ quan sát kết quả startup.

TTL index trên auth_nonces có thể làm MongoDB tự xóa nonce hết hạn **khi có document về sau**. Lần này DB mới và toàn bộ collection rỗng, không có nonce cũ bị tác động. Không chạy thao tác xóa dữ liệu trong kiểm tra.

### Chain listener: ghi nghiệp vụ có điều kiện

`server/src/services/chainListener.js` có thể:

- Đọc metadata contract, kết nối RPC và backfill `getLogs` từ block 0.
- Upsert `chain_events` qua findOneAndUpdate/$setOnInsert.
- Update `topics` và KPI embedded theo TopicCreated/TopicAssigned/KPISubmitted/KPIEvaluated/InternshipCompleted.
- Đăng ký event listener thời gian thực và tiếp tục ghi khi nhận event.

Đây là tác động ghi tiềm năng phải kiểm tra trước boot. Trong lần này RPC local đang tắt; `getNetwork()` không thành công nên hàm return trước backfill/đăng ký contract events. Log xác nhận RPC chưa phản hồi; `chain_events` và `topics` vẫn 0 document. Không dùng private key, không gửi giao dịch hoặc deploy.

Không khởi động RPC/node trong nhiệm vụ này. Không tự giả định dòng log “sẽ thử lại khi có yêu cầu” là có cơ chế retry hoàn chỉnh; listener hiện cần được đánh giá riêng trước Web3 integration.

MongoDB vẫn ghi storage/journal/metadata nội bộ khi tạo cấu trúc. Báo cáo 0 document là **0 document trong 14 collection ứng dụng**, không tuyên bố server database hoàn toàn không có bất kỳ file ghi hoặc hoạt động nội bộ nào.

## 4. API GET có tác dụng ghi dữ liệu — không gọi

| API | File | Ghi có thể xảy ra |
| --- | --- | --- |
| GET /api/internship/jds | internship.routes.js:95 | JD.create bộ JD mẫu khi rỗng → job_descriptions |
| GET /api/internship/tasks | internship.routes.js:197 | Task.create dữ liệu mẫu khi rỗng và không có filter ví → internship_tasks |
| GET /api/internship/attendance/history | internship.routes.js:313 | Attendance.insertMany các ngày mẫu khi không có kết quả → attendances |
| GET /api/internship/worklogs | internship.routes.js:341 | WorkLog.create nhật ký mẫu khi không có kết quả → work_logs |

Các route này không được dùng để “kiểm tra đọc” và chưa mở UI vì các view có thể tự gọi chúng. Các API POST/PUT/PATCH nghiệp vụ và POST sync-events cũng không được gọi.

GET certificate không ghi DB trong source nhưng có fallback chứng nhận mẫu gắn verified; không gọi hoặc dùng nó làm bằng chứng on-chain. GET topics theo student có thể gọi AI bên ngoài dù không ghi DB; cũng không dùng cho đợt chỉ kiểm tra health này.

`GET /api/health` trong `server/src/app.js` chỉ đọc connection.readyState, config.pinataJwt và thời gian; không query/upsert collection. Đây là HTTP endpoint duy nhất đã gọi.

## 5. Giai đoạn C — Lệnh khởi động, log và health

Đã chạy script nguyên bản `npm.cmd start` trong server. Process cha dùng cmd/npm được mở với Start-Process, WindowStyle Hidden, redirect stdout/stderr ra log riêng ngoài repo. Các biến môi trường chỉ được nạp vào process; không tạo .env, không sửa registry hoặc source cho lần startup này.

| Mục | Đường dẫn |
| --- | --- |
| stdout | `C:\Users\PC\AppData\Local\Web3-Internship-Management\Backend\logs\backend-20261030-153621-3523f9c7.stdout.log` |
| stderr | `C:\Users\PC\AppData\Local\Web3-Internship-Management\Backend\logs\backend-20261030-153621-3523f9c7.stderr.log` |

Log quan sát:

```text
> web3-internship-server@1.0.0 start
> node src/index.js

Backend Server running on port 5000
Connected to MongoDB successfully!
[ChainListener] Node RPC (http://127.0.0.1:8545) chưa phản hồi. Listener sẽ thử lại khi có yêu cầu.
```

Health thực tế:

```http
GET http://127.0.0.1:5000/api/health
HTTP 200
```

```json
{
  "status": "online",
  "dbState": "connected",
  "ipfsConfigured": false,
  "timestamp": "2026-10-30T15:36:57.106Z"
}
```

Timestamp trên là UTC của response, tương ứng **22:36:57 ngày 30/10/2026, Asia/Bangkok**. Không chứa token hoặc secret.

Sau health, chỉ dùng driver đọc listCollections/countDocuments/listIndexes để đối chiếu tác động. Có guard dừng đúng cây tiến trình backend vừa tạo nếu phát hiện collection ngoài danh sách hoặc document nghiệp vụ. Guard không bị kích hoạt: đúng 14 collection, không có document. Kiểm tra đọc lại sau quan sát vẫn đạt; PID 14084 còn sống, listener 5000 thuộc đúng PID. Không có lý do nghiêm trọng phải dừng Backend trong lần này.

## 6. Lỗi, warning và cấu hình còn thiếu

| Hạng mục | Trạng thái | Ảnh hưởng |
| --- | --- | --- |
| Lỗi boot/runtime nghiêm trọng | Không ghi nhận trong log đã kiểm tra; stderr 0 byte | Backend đạt health + MongoDB connection, chưa chứng minh nghiệp vụ |
| JWT_SECRET | Được getter chấp nhận từ User environment | Chưa kiểm thử đăng nhập/chữ ký/JWT API vì các flow có ghi DB |
| MONGODB_URI | Đúng DB local đã kiểm tra mới | DB đã được khởi tạo cấu trúc; lần sau không còn là DB chưa tồn tại |
| PINATA_JWT | Chưa cấu hình, health ipfsConfigured=false | Không chặn boot; submit/complete trả 503 khi cần upload |
| AI_SERVICE_URL | Dùng default localhost:8000, port chưa có service | Không chặn boot; matching/report có thể fallback; chưa kiểm thử AI integration |
| BLOCKCHAIN_RPC_URL | Dùng default 127.0.0.1:8545, port không lắng nghe | Listener chưa hoạt động; không thể coi dữ liệu là on-chain |
| CORS_ORIGIN | Runtime default rộng, chưa khóa origin frontend | Cần chốt origin localhost/127.0.0.1 và port trước tích hợp |
| HTTP bind | Quan sát listener `::`:5000 | Có thể nhận kết nối ngoài loopback tùy mạng/firewall; không mở port/router hoặc đổi firewall trong đợt này |

Pinata/AI/RPC chỉ bắt buộc theo chức năng liên quan, **không bắt buộc để boot app hiện tại**. MongoDB và JWT hợp lệ là điều kiện bắt buộc cho startup này. Các warning deprecated dependency đã nêu trong báo cáo cài đặt vẫn chưa được sửa, không phải error boot mới.

## 7. Cần sửa/chốt trước tích hợp Frontend

1. **Bỏ auto-seed trong GET** hoặc chốt rõ phạm vi dữ liệu demo sẽ bị ghi khi mở view. Chưa tự sửa vì yêu cầu không sửa source.
2. **Giới hạn HTTP về loopback khi demo local** hoặc xác nhận cách cô lập truy cập; app hiện không có HOST config. Không tự vá listen hoặc thêm firewall rule.
3. Chốt CORS_ORIGIN và VITE_API_URL có `/api`, đồng nhất localhost/127.0.0.1. Không tạo .env để làm việc này trong đợt kiểm tra.
4. Chọn có bật AI và cấu hình Pinata thật cho demo báo cáo hay chỉ ghi nhận phần chưa sẵn sàng. Không giả CID/engine.
5. Khi tích hợp Web3, rà soát listener, receipt validation và DB–chain state trước khi cho RPC hoạt động; không tự start/deploy chain trong giai đoạn này.
6. Các lỗi demo-login, task/worklog ownership và chứng nhận mẫu giả verified trong audit chưa được giải quyết. Health thành công không phải kiểm định quyền hoặc độ đúng nghiệp vụ.
7. Không chạy server npm test hiện tại vì dropDatabase; dùng bộ kiểm thử an toàn riêng khi được duyệt.

Không tích hợp hoặc mở Frontend trong nhiệm vụ này. Database không có tài khoản mẫu/đề tài mẫu vì không chạy seed và không gọi demo-login.

## 8. Git và điểm dừng

`git diff --exit-code` đạt, không có thay đổi tracked. `git status -sb` trước xuất báo cáo:

```text
## branch_1...origin/branch_1
?? <thư mục tài liệu gốc và ZIP tương ứng>
?? audit-reports/
?? docs/PROGRESS.md
```

Các untracked cũ được giữ nguyên; báo cáo mới nằm trong audit-reports/. Không fetch/commit/push/merge. Không sửa source, package/lockfile hoặc tạo .env. Không seed/migration/dropDatabase/xóa dữ liệu, dùng private key, deploy hoặc gửi giao dịch.

**Giữ MongoDB và Backend đang chạy ở thời điểm bàn giao. Dừng công việc tại đây và chờ xác nhận trước khi tích hợp Frontend hoặc cho phép các request nghiệp vụ có ghi dữ liệu.**

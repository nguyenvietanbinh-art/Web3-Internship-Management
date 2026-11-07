# Kết quả khởi động Frontend và kiểm tra HTTP/API

Ngày: **30/10/2026**, Asia/Bangkok. Branch **branch_1**.

## 1. Kết luận và giới hạn kiểm thử

**Vite đã khởi động thành công tại `http://127.0.0.1:5173/`, chỉ bind loopback.** HTML, Vite client, các module JS/JSX và tài nguyên được kiểm tra đều trả HTTP 200. API health tại base URL thực tế của frontend trả HTTP 200, MongoDB connected; CORS preflight trả 204 và phản hồi đúng Origin frontend.

**Không mở giao diện bằng trình duyệt, không thực thi React hoặc các useEffect của app.** Đã phát hiện request tự động có thể ghi DB trong các tab CV/JD, attendance và Web3. Tuân thủ yêu cầu dừng trước khi mở browser; tiếp tục chỉ phần HTTP/tài nguyên/health không ghi dữ liệu được cho phép.

Kiểm tra kết nối health dùng HTTP client từ Node với Origin frontend và URL đọc từ module frontend đã được Vite phục vụ. Đây là **kiểm tra URL/HTTP/header CORS**, không phải bằng chứng browser đã render hoặc JavaScript của app đã gọi API thành công. Node không tự thực thi chính sách CORS như browser; các header đã được đối chiếu tường minh.

Database trước/sau vẫn **14 collection, 36 index, 0 document**. Không gọi API nghiệp vụ, đăng nhập, tạo tài khoản, seed/migration hoặc giao dịch.

## 2. Cấu hình Vite và API

Đã đối chiếu BACKEND_RUNTIME_RESULT.md cùng các báo cáo audit/build và source hiện tại.

| Mục | Giá trị thực tế/source |
| --- | --- |
| Script | client/package.json: dev=`vite` |
| Vite | 8.3.4; config chỉ có @vitejs/plugin-react |
| Proxy | **Không có server.proxy** trong client/vite.config.js |
| API base | client/src/api/client.js:8: `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'` |
| VITE_* bắt buộc | Không có biến bắt buộc để chạy local với default hiện tại |
| VITE_API_URL | Biến tùy chọn; hiện unset, fallback `http://localhost:5000/api` |
| Env thực tế | Không thấy VITE_* trong process hoặc Windows User environment đã kiểm tra; không thấy frontend .env* |
| HTTP frontend | 127.0.0.1:5173, --strictPort không tự đổi cổng |
| Backend | http://localhost:5000/api, đang hoạt động |

Không thêm proxy, sửa config/source hoặc tạo .env. Không tự chuyển API base sang URL khác. API_BASE của module /src/api/client.js **đã phục vụ qua HTTP** cũng được xác nhận có fallback `http://localhost:5000/api`.

Đã kiểm tra port 5173 trước startup bằng bind thử rồi giải phóng; cổng trống. Các điều kiện cho việc mở dev server và tải tài nguyên HTTP đạt; điều kiện chạy UI đầy đủ chưa đạt vì auto-write requests.

## 3. Request tự động khi mở giao diện — đọc source, chưa thực thi

### Trang mặc định

`client/src/App.jsx:55` khởi tạo activeTab=`topics`. Các view khác chỉ mount khi chọn tab tại App.jsx:708–732; vì vậy **không khẳng định mở trang mặc định sẽ lập tức gọi tất cả các GET tự seed**.

| Nguồn | Request/hành vi tự động | Tác động |
| --- | --- | --- |
| App.jsx:98; api/client.js:74 | restoreSession; nếu localStorage có token thì GET /api/auth/me | Đọc tài khoản; có thể sửa state/token localStorage khi phiên không hợp lệ, không tự tạo tài khoản |
| App.jsx:173–186 | GET /api/topics hoặc kèm studentWallet sau restore | Source là đọc DB; nhánh student có thể gọi AI bên ngoài; chưa gọi trong đợt kiểm tra |
| App.jsx:108; api/web3Client.js:10 | checkContractConnection qua MetaMask provider nếu có hoặc RPC local | RPC đọc trạng thái/code; không gửi giao dịch nhưng vẫn là tương tác ví/RPC tự động; chưa thực thi |
| DashboardView.jsx:21 | GET /api/internship/dashboard khi mount | Source là thống kê đọc; chưa gọi |

StrictMode ở `client/src/main.jsx:7` có thể làm effect chạy lặp trong môi trường dev; cần cân nhắc khi xử lý request không idempotent. Không thực thi StrictMode trong kiểm tra HTTP hiện tại.

### Các tab có request ghi DB tự động

| Trigger và vị trí frontend | Request | Hành vi backend có thể xảy ra |
| --- | --- | --- |
| CvJdView.jsx:43–53, khi mount | GET /api/internship/jds | Tạo JD mẫu khi rỗng → job_descriptions |
| AttendanceView.jsx:32–50, khi mount | GET /api/internship/attendance/history | Insert dữ liệu điểm danh mẫu khi rỗng → attendances |
| Cùng effect AttendanceView | GET /api/internship/tasks | Tạo task mẫu khi không có filter/kết quả → internship_tasks |
| Cùng effect AttendanceView | GET /api/internship/worklogs | Tạo nhật ký mẫu khi rỗng → work_logs |
| Web3CertificateView.jsx:23–39, khi mount | **POST** /api/internship/sync-events rồi GET chain-events | Backfill có thể upsert chain_events/update topics nếu contract/RPC sẵn sàng |

Attendance effect còn gọi GET today-qr, nhưng request này không phải request ghi DB theo source. Không gọi cả nhóm để tránh vô tình kích hoạt các request ghi đi kèm.

Ngoài effect, các nút đăng nhập demo/nonce/login, tạo đề tài/phân công/nộp/chấm/hoàn tất/record-chain-tx, tạo JD/task/worklog/check-in/review có thể ghi dữ liệu; **không kích hoạt**. Không mở browser, không click tab, không đăng nhập hoặc yêu cầu MetaMask.

## 4. Nguy cơ lộ secret

- Vite config không đổi envPrefix hoặc define toàn bộ process.env; chỉ biến có prefix VITE_* mới được expose theo cơ chế mặc định liên quan frontend.
- Đã kiểm tra tên VITE_* trong process và Windows User environment: đều rỗng; không in giá trị env bí mật.
- Quét **21 file text** dưới client/src, client/public và bundle production stage2, so sánh với **giá trị JWT_SECRET thực** chỉ trong bộ nhớ: **0 file khớp**. Không in secret hay đưa secret vào dòng lệnh URL/HTTP.
- Bảy response HTML/module/CSS/SVG đã kiểm tra cũng không chứa giá trị JWT_SECRET thực.
- ABI/contract address là thông tin public, không phải private key. Không kết nối ví thật, không nạp private key và không tạo token đăng nhập để thử.
- `w3i_token` trong localStorage là access token của client nếu người dùng đăng nhập về sau, khác với signing key JWT_SECRET. Chưa có thao tác tạo/đọc phiên browser trong đợt này.

Kết luận giới hạn: **không thấy JWT_SECRET đã biết bị lộ trong các file/response đã quét**. Đây không phải chứng minh không thể lộ mọi loại secret trong toàn bộ app. Không bao giờ cấu hình VITE_JWT_SECRET, VITE_PINATA_JWT hoặc private key dạng VITE_*; các giá trị prefix này là dữ liệu public của frontend.

## 5. Lệnh khởi động và tiến trình

Working directory: `D:\Web3-Internship-Management\client`.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Chạy script hiện có bằng Start-Process/WindowStyle Hidden, không --open. Không sửa persistent env/PATH, source hoặc .env; chỉ bổ sung Node vào PATH process. Vite có thể sinh dependency cache trong node_modules/.vite (Git ignore), không ghi database.

| Thông tin | Giá trị tại thời điểm kiểm tra |
| --- | --- |
| Frontend launcher | PID 14752 |
| Vite node listener | PID **13172**, **127.0.0.1:5173** |
| URL | `http://127.0.0.1:5173/` |
| stdout | `C:\Users\PC\AppData\Local\Web3-Internship-Management\Frontend\logs\frontend-20261030-154426-b6cc7bdd.stdout.log` |
| stderr | `C:\Users\PC\AppData\Local\Web3-Internship-Management\Frontend\logs\frontend-20261030-154426-b6cc7bdd.stderr.log` |

Log startup:

```text
> client@0.0.0 dev
> vite --host 127.0.0.1 --port 5173 --strictPort

VITE v8.3.4 ready in 490 ms
Local: http://127.0.0.1:5173/
```

## 6. HTTP trang chủ và tài nguyên

Chỉ fetch response dưới dạng text, **không evaluate/import module trong browser**. Không thực hiện HMR WebSocket, useEffect hoặc provider ví.

| Đường dẫn frontend | HTTP | Content-Type | Byte response |
| --- | --- | --- | --- |
| / | 200 | text/html | 1378 |
| /@vite/client | 200 | text/javascript | 222118 |
| /src/main.jsx | 200 | text/javascript | 1650 |
| /src/App.jsx | 200 | text/javascript | 197861 |
| /src/api/client.js | 200 | text/javascript | 10905 |
| /src/index.css | 200 | text/javascript | 7463 |
| /favicon.svg | 200 | image/svg+xml | 9522 |

Vite dev phục vụ CSS trong module graph có thể dưới dạng JS wrapper; bảng ghi Content-Type thực tế, không nhận nhầm là response lỗi. Trang chủ có root element và entry /src/main.jsx như dự kiến.

**Kiểm tra proxy:** GET `http://127.0.0.1:5173/api/health` trả **200 text/html**, là SPA fallback của Vite, **không phải health JSON của Backend**. Không có request proxy sang backend từ đường dẫn này. Source frontend dùng API_BASE tuyệt đối nên không phụ thuộc proxy; không tự thêm proxy để “sửa” một cấu hình vốn dùng API khác origin.

## 7. Kết nối Backend và CORS

Từ API_BASE xác minh trong module được phục vụ, đã kiểm tra:

```http
OPTIONS http://localhost:5000/api/health
Origin: http://127.0.0.1:5173
Access-Control-Request-Method: GET
Access-Control-Request-Headers: content-type,authorization
```

Kết quả **204**, Allow-Origin đúng `http://127.0.0.1:5173`, Allow-Headers `content-type,authorization`. Kiểm tra trước startup cũng cho Allow-Methods `GET,HEAD,PUT,PATCH,POST,DELETE`.

```http
GET http://localhost:5000/api/health
Origin: http://127.0.0.1:5173
Content-Type: application/json
```

Kết quả sau khi Vite chạy: **HTTP 200**, Allow-Origin đúng Origin frontend:

```json
{
  "status": "online",
  "dbState": "connected",
  "ipfsConfigured": false,
  "timestamp": "2026-10-30T15:45:17.983Z"
}
```

Timestamp UTC tương ứng 22:45:17 ngày 30/10/2026, Asia/Bangkok. Không gửi Authorization token thật hoặc credential cookie. apiRequest đặt Content-Type JSON ngay cả GET, vì vậy kiểm tra preflight là có ý nghĩa khi browser gọi cross-origin. CORS này đủ cho HTTP health không cookie theo config hiện tại; chưa kiểm thử auth session/các thao tác ghi.

Backend đang dùng default CORS rộng, phản chiếu Origin (`corsOrigin='*'` → origin:true trong app.js), **chưa phải allowlist chỉ origin frontend này**. Kết quả đạt về khả năng kết nối, không phải chứng minh cấu hình production đã chặt chẽ. Không sửa CORS hoặc restart backend trong nhiệm vụ này.

## 8. Runtime, console và dữ liệu

- Vite startup và các module transform đã gọi không ghi nhận error; stderr quan sát được **0 byte**.
- **Browser console/render chưa quan sát**, vì browser không được mở theo điều kiện an toàn. Không tuyên bố UI không có lỗi console, hydration/render, effect hoặc tương tác.
- Các warning lint/build từ Giai đoạn 2 (32 lint warnings, chunk ~576 kB) chưa được sửa; không chạy lại build/lint chỉ để lặp kiểm tra cũ.
- DB trước và sau HTTP checks đều **14 collection, 36 index, 0 document**. Kiểm tra bằng driver đọc listCollections/countDocuments/listIndexes, không dùng Mongoose để tạo thêm cấu trúc.
- Không gọi GET jds/tasks/history/worklogs, POST sync-events, login, nonce, AI matching, check-in hoặc topic mutation.

## 9. Chức năng chưa thể kiểm thử và việc cần sửa

1. **Bỏ ghi mẫu khỏi GET** ở backend, hoặc thống nhất rõ phạm vi seed demo explicit trước khi mở UI có các tab này. Không tự sửa vì chưa có phê duyệt source change.
2. **Không tự POST sync-events khi mount view Web3**; cần action rõ và quyền/scope đồng bộ trước tích hợp chain. Chưa sửa.
3. Rà soát auto checkContractConnection khi mount nếu cần chế độ kiểm tra frontend không chạm ví/RPC. Chưa dùng ví/RPC trong đợt này.
4. Chốt CORS allowlist và VITE_API_URL cho dev/deploy; chỉ thêm proxy nếu nhóm chủ động chọn kiến trúc same-origin. Backend vẫn bind `::`:5000, cần giới hạn/cô lập truy cập theo báo cáo trước.
5. Login/role ownership, task/worklog, ứng tuyển, báo cáo/IPFS, QR, certificate validation và mọi flow ghi DB **chưa kiểm thử**. Các lỗi đã nêu trong audit vẫn còn.
6. AI và blockchain chưa tích hợp trong nhiệm vụ này; không coi UI badge/metadata hoặc contract compile là bằng chứng on-chain. Pinata chưa cấu hình theo health.
7. Cần bộ kiểm thử browser có mock/chặn request ghi, hoặc sửa các side effect được duyệt, trước khi kiểm định render/console/E2E mà vẫn giữ DB không thay đổi.

## 10. Trạng thái Git và bàn giao

`git diff --exit-code` đạt: không có thay đổi tracked. Branch `branch_1`, tracking `origin/branch_1` theo ref local; không fetch/commit/push/merge. Các untracked cũ (tài liệu gốc/ZIP, docs/PROGRESS.md và audit-reports/) được giữ nguyên; chỉ thêm báo cáo này. Không tạo .env hoặc sửa source/config/lockfile; không thay DB, seed/migration/deploy.

Các tiến trình còn hoạt động tại kiểm tra cuối:

| Thành phần | PID | Listener |
| --- | --- | --- |
| MongoDB | 15528 | 127.0.0.1:27017 |
| Backend | 14084 | :::5000 |
| Frontend | 13172 | 127.0.0.1:5173 |

**Giữ các tiến trình này chạy. Dừng công việc tại đây, không mở browser và chờ xác nhận trước khi sửa side effect hoặc tích hợp AI/blockchain.**

# Sửa QR/GPS trên cloud — 09/11/2026

## Trạng thái bàn giao

Đã chuẩn bị thay đổi trong workspace, chưa commit, push hoặc deploy. Không thay secrets, không ghi lên Atlas hoặc database local đang phục vụ bản dữ liệu khôi phục. Không seed, migration, reset, tạo marker hay xóa dữ liệu. Các bản ghi tổng hợp phục vụ integration test chỉ nằm trong database QA riêng, được giữ lại sau test.

Bản mã gốc trước thay đổi: `4b9ed92` trên nhánh `deploy/internova-cloud-20261108`. Website đang chạy chưa nhận bản sửa này.

## Nguyên nhân đã xác minh từ source

`server/src/core/web3.js` đặt `router.use('/web3', ...)` trước các route và gọi `localWeb3.assertTest()` với mọi phương thức khác GET. Cả `POST /api/core/web3/qr/issue` và `POST /api/core/web3/qr/redeem` vì vậy bị kiểm tra TEST local, trả 503 `WEB3_TEST_ONLY` trên `NODE_ENV=production`, dù startup đã xác minh Atlas đúng policy.

`qrGps.js` chỉ dùng chữ ký JWT, nonce, GPS, phân công và WorkSession; không gọi Hardhat, ví, AI hoặc IPFS. Startup cloud đã tích hợp `cloudDemoPolicy.configuration`, `verifyDatabaseIdentity` và `verifyIndexes` trước khi listen; không cần nới policy hoặc thay URI allowlist.

## Thay đổi và phạm vi guard

- `server/src/core/web3.js`: bỏ middleware bao trùm prefix, gắn `requireLocalBlockchain` trực tiếp cho từng endpoint blockchain bên dưới. URL, phương thức và response QR/GPS giữ nguyên.
- `server/src/services/businessWriteEnvironment.js`: kiểm tra môi trường ghi nghiệp vụ. Cloud phải qua policy cấu hình hiện hữu, kết nối đang hoạt động và đọc lại `hello`/marker thật bằng `verifyDatabaseIdentity` trước mỗi thao tác. TEST workflow vẫn cần exact allowlist, đúng tên DB và replica set `internovaTestRs`; TEST cũ vẫn cần guard local port 27017 hiện có. Môi trường không hỗ trợ trả 503 `BUSINESS_ENVIRONMENT_REJECTED` trước khi ghi. Không tạo/chỉnh marker.
- `server/src/services/qrGps.js`: gọi guard nghiệp vụ ở cả issue/redeem; từ chối phân công thiếu thời gian hợp lệ. Giữ nguyên quyền, nonce atomic, GPS, unique-index chống trùng, cách tính giờ, pending/needs_adjustment và tổng giờ duyệt.
- `client/src/components/business/Web3Page.jsx`: đặt tìm sinh viên/chọn phân công ngay trong khu vực tạo QR, hiển thị lựa chọn, khóa tạo khi chưa chọn hoặc phân công hết hiệu lực; bỏ kết quả QR cũ khi đổi lựa chọn, không nhận nhầm kết quả trả chậm của phân công trước. Có trạng thái tạo/chấm công thành công, lỗi và xử lý; khóa thao tác redeem bằng ref ngay khi bắt đầu để chống gửi trùng. Blockchain chưa sẵn sàng chỉ khóa các nút blockchain; QR/GPS vẫn thao tác được và không cần ví.
- `client/src/components/business/NativeQrScanner.jsx`: thông báo rõ camera cần kết nối an toàn; giữ dừng camera/giải phóng stream và thông báo từ chối quyền.
- `client/src/api/client.js`: production mặc định `/api` cùng origin thay vì localhost; `VITE_API_URL` vẫn được ưu tiên, development vẫn dùng API local như trước.
- Thêm ba file kiểm thử: `business-write-environment.unit.test.js`, `qr-route-guards.unit.test.js`, `qr-gps-api.integration.test.js`.

Guard blockchain local vẫn áp dụng cho tất cả các POST sau dưới `/api/core`:

- `/web3/reports/:id/anchor`
- `/web3/placements/:id/time-evidence/anchor`
- `/web3/time/:id/anchor`
- `/web3/placements/:id/complete`
- `/web3/placements/:id/mint`
- `/web3/operations/:id/verify`
- `/web3/operations/:id/reconcile`

Các guard bên trong `localWeb3.js` và các policy TEST/database không bị sửa. Route POST không tồn tại vẫn trả 404; không có miễn trừ tùy tiện cho prefix.

Upload IPFS có guard môi trường ghi nghiệp vụ riêng thay vì guard blockchain; vẫn cần role, report scope, `IPFS_EXTERNAL_UPLOAD_ENABLED`, credential, khóa mã hóa và readback hiện có. Không bật IPFS hoặc thêm credential trong bản sửa. GET status/list vẫn chỉ đọc.

## Các bảo vệ QR/GPS giữ nguyên

Company chỉ tạo QR cho phân công trong phạm vi của mình, đang active và trong khoảng ngày hợp lệ; trong school workflow còn cần `workflow=true`, `activePlacement=true`. Student phải là đúng chủ QR và chủ phân công, không cần ví trong chế độ User ID.

JWT HS256 kiểm tra issuer/audience, TTL 15–300 giây, action check-in/check-out, assignment, session và nonce 24 byte ngẫu nhiên. Chỉ lưu hash nonce. Lệnh cập nhật có điều kiện `usedAt=null`, chưa hết hạn là điểm giành quyền sử dụng nonce; hai request không cùng vượt qua được. Unique indexes của WorkSession tiếp tục chống hai QR khác nhau tạo ca trùng cho một sinh viên. Không tạo index tự động trên cloud.

Backend kiểm tra tọa độ hữu hạn và trong giới hạn, accuracy, timestamp tối đa 30 giây cũ/5 giây tương lai, khoảng cách cộng vùng sai số trong bán kính. GPS vẫn là lời khai từ thiết bị, `spoofResistant=false`; không cam kết chống giả mạo tuyệt đối. Không phát sinh txHash giả, response vẫn `chainStatus=not_recorded`, bằng chứng QR/GPS không trở thành bằng chứng blockchain.

Mở trang chỉ GET dữ liệu, scan chỉ điền token; chỉ nút xác thực QR/GPS mới gửi lệnh chấm công. Phiên checkout vẫn pending hoặc needs_adjustment theo logic cũ; giờ chỉ vào tổng đã duyệt sau bước duyệt nghiệp vụ.

## Cấu hình cloud cần giữ đúng

Không cần credential hoặc biến mới. Không đổi secret hiện tại khi redeploy. Ví dụ dưới đây chỉ có placeholder:

```dotenv
NODE_ENV=production
APP_ENV=CLOUD_DEMO
CORE_BUSINESS_ENABLED=true
SCHOOL_WORKFLOW_ENABLED=true
USER_ID_BUSINESS_ENABLED=true
EMAIL_AUTH_ENABLED=true
JWT_SECRET=<existing-cloud-secret>
MONGODB_URI=mongodb+srv://<user>:<encoded-password>@<verified-cluster>.mongodb.net/internova_cloud_demo?retryWrites=true&w=majority
CLOUD_DEMO_DB_NAME=internova_cloud_demo
CLOUD_DEMO_CLUSTER_HOST=<verified-cluster>.mongodb.net
CLOUD_DEMO_REPLICA_SET=<verified-replica-set>
CLOUD_DEMO_INSTANCE_ID=<existing-verified-instance-id>
WEB3_LOCAL_ENABLED=false
CHAIN_LISTENER_ENABLED=false
DEMO_MODE=false
IPFS_EXTERNAL_UPLOAD_ENABLED=false
HOST=0.0.0.0
SERVE_CLIENT=true
```

Không đặt TEST allowlist trên cloud. Cluster/replica/instance phải khớp marker đã được xác minh từ trước. Thiếu hoặc sai marker phải xử lý cấu hình với người phụ trách; không tự tạo marker để vượt kiểm tra.

Dockerfile hiện có build frontend với `VITE_API_URL=/api`, phục vụ frontend/backend cùng HTTPS origin. Trên Render hiện tại, CORS lấy domain được gán từ `RENDER_EXTERNAL_URL`; domain lạ vẫn bị từ chối. Nếu tách frontend hoặc dùng domain riêng, đặt `CORS_ORIGIN=https://<allowed-frontend-domain>` và build frontend với `VITE_API_URL=https://<backend-domain>/api` đúng hạ tầng đã phê duyệt, không dùng wildcard.

## Kiểm thử đã chạy

### Unit và HTTP router unit: PASS — 44/44

```powershell
node --test --test-concurrency=1 server/test/qr-gps.test.js server/test/business-write-environment.unit.test.js server/test/qr-route-guards.unit.test.js server/test/cloud-demo-policy.unit.test.js server/test/workflow-test-guard.unit.test.js server/test/render-origin.unit.test.js
node --test server/test/runtime-safety.test.js server/test/timeTracking.test.js
```

Đã kiểm tra policy cloud hợp lệ/sai DB, host, replica, marker, TLS, config thiếu; TEST workflow và TEST cũ; CORS; GPS; duration/UTC. Router unit dùng stub QR service và HTTP thật để xác minh dispatch QR không đi qua guard Hardhat, role vẫn bắt buộc và toàn bộ bảy endpoint blockchain vẫn bị 503 trên cloud. Cloud identity unit dùng kết nối giả chỉ có read methods, không mở socket Atlas. Đây không phải integration trên Atlas thật.

### API integration MongoDB TEST thật: PASS — 6/6

```powershell
$env:QR_GPS_API_TESTS='true'
node --test --test-concurrency=1 server/test/qr-gps-api.integration.test.js
Remove-Item Env:QR_GPS_API_TESTS
```

Target cố định: `web3_internship_test_phase1_workflow_qa_20261106_a`, local port 27018, replica set `internovaTestRs`. Harness kiểm tra exact TEST allowlist trước connect; sau connect xác minh tên DB, `hello.setName`, các unique indexes thực tế và QR collection có sẵn trước khi tạo fixture. Tắt autoCreate/autoIndex, không gọi syncIndexes, drop hoặc delete. Synthetic run đã chạy: `946d86723dcc`; chỉ bản ghi tổng hợp mang ID mới trong QA này được tạo/chỉnh. Không được sửa harness để trỏ vào DB người dùng.

Các trường hợp đạt:

- Company đúng vai trò/phạm vi tạo QR; company khác, Student hoặc chưa đăng nhập bị từ chối.
- Phân công chưa active, không chính thức, ngoài ngày, thiếu ngày bị từ chối.
- Tài khoản User ID không có ví vẫn check-in và check-out được; AI, Hardhat và IPFS đều không khả dụng.
- Student khác, chữ ký sai, JWT hết hạn, session hết hạn bị từ chối.
- GPS ngoài phạm vi, accuracy lớn/không hợp lệ, tọa độ sai, timestamp cũ/tương lai, trường thừa bị từ chối; nonce hợp lệ chưa bị dùng.
- Hai request cùng nonce trả 200/409, chỉ một WorkSession; replay bị chặn. Hai nonce khác nhau cùng sinh viên cũng chỉ tạo một phiên nhờ unique indexes đã xác minh.
- Check-in trùng, check-out thiếu ca và redeem sau khi phân công bị hủy bị chặn.
- Checkout tức thời giữ 0 phút và pending; tổng đã duyệt vẫn 0; không có ChainOperation cho phân công kiểm thử.
- GET status/time giữ nguyên fingerprint của collections QR, giờ làm, phân công, operation.

### Frontend unit: PASS — 11/11

```powershell
node --test client/test/qr-code.test.cjs client/test/production-safety.test.mjs
```

QR encoder/decoder roundtrip 40 payload ngẫu nhiên trên các mask, ảnh trống không tạo kết quả giả; phiên đăng nhập, lỗi mạng/API và callback thành công/thất bại vẫn đúng.

### Frontend lint/build: PASS

```powershell
npm --prefix client run lint
$env:VITE_API_URL='/api'
npm --prefix client run build
```

Tổng đã chạy: 61 test PASS, không có test FAIL trong các lệnh nêu trên. Không chạy toàn bộ bộ test nghiệp vụ/Hardhat của repository; không coi các bộ chưa chạy là PASS.

### Chưa chạy / cần nghiệm thu

- Kiểm thử camera/GPS vật lý trên điện thoại: BLOCKED trong phiên này do chưa có thiết bị/quyền thao tác điện thoại; chưa đánh dấu PASS.
- Luồng UI chọn sinh viên, đổi phân công khi request đang chạy và hiển thị lỗi trên trình duyệt: chưa chạy E2E tương tác; lint/build không thay thế kiểm tra này.
- Ghi QR/GPS vào Atlas đang phục vụ người dùng và redeploy công khai: NOT RUN theo yêu cầu. Tiêu chí cloud còn cần xác nhận sau khi người phụ trách triển khai.
- Giao dịch Hardhat thật/mint SBT/IPFS upload thật: NOT RUN; chỉ kiểm tra các endpoint blockchain vẫn bị chặn trên cloud.

## Redeploy do người phụ trách thực hiện

1. Xem diff của các file nêu trên và kết quả kiểm thử. Giữ riêng các file launcher chưa được theo dõi có sẵn; không đưa secrets, archive hay `.team` vào commit.
2. Khi sẵn sàng phát hành, commit/push thay đổi được duyệt vào nhánh đang kết nối Render. Nếu Auto-Deploy đang On Commit, push sẽ tự kích hoạt deploy; nếu Off, dùng Manual Deploy → Deploy latest commit. Bản bàn giao này chưa thực hiện bước đó.
3. Dịch vụ Docker hiện tại build cả frontend lẫn backend, không cần tạo dịch vụ mới. Giữ secrets/Atlas marker, health check `/api/ready`, Dockerfile và cấu hình DB hiện tại. Không chạy migration/seed/reset để chữa guard.
4. Chờ build/start thành công và Live; kiểm tra `/api/ready`, `/api/health`, `/login`, CORS và các assets. Sai DB/marker phải làm startup từ chối, không vượt guard.
5. Nghiệm thu QR bằng tài khoản/thời gian/phân công được người phụ trách cho phép; dùng sinh viên thử nghiệm riêng, không dùng tài khoản người dùng bất kỳ.

## Thử trên điện thoại sau triển khai

1. Trên thiết bị Company, đăng nhập HTTPS bằng tài khoản doanh nghiệp. Mở khu vực tạo QR, tìm sinh viên trong phạm vi doanh nghiệp và chọn phân công chính thức active. Kiểm tra rõ tên sinh viên, đề tài, ngày thực tập. Chưa chọn/hết hạn thì nút tạo phải khóa.
2. Chọn địa điểm đã xác nhận hoặc nhập tâm/phạm vi chính xác. Tạo QR check-in và xem ảnh QR từ thiết bị thứ hai. QR có TTL, không gửi ảnh/token vào kênh công khai.
3. Trên điện thoại Student đúng tài khoản, mở cùng website HTTPS. Cho phép camera; quét chỉ điền mã, chưa ghi giờ. Có thể nhập token dự phòng khi camera bị từ chối.
4. Bấm lấy GPS/xác thực; cho phép vị trí chính xác, đứng trong vùng. GPS sai số lớn hoặc ngoài vùng phải báo lỗi, không tự chấm công. Kiểm tra đúng một phiên mở; thử lại cùng QR phải bị từ chối.
5. Company tạo QR checkout riêng. Student dùng tại đúng vùng; kiểm tra pending/needs_adjustment và tổng đã duyệt không tự tăng. Doanh nghiệp duyệt theo quy trình hiện hữu.
6. Thử từ chối quyền camera/GPS, QR hết hạn, Student khác, phân công hết hiệu lực và bấm liên tiếp. Kiểm tra thông báo rõ; không phát sinh bản ghi khi chỉ mở trang. Blockchain chưa cấu hình phải báo không khả dụng riêng, không yêu cầu ví để điểm danh.

## Rollback code, giữ nguyên dữ liệu

Người phụ trách có thể Rollback tới deploy trước trong Render (nếu còn artifact), hoặc tạo commit revert các thay đổi đã phát hành rồi deploy bản đã duyệt. Nếu rollback bằng Render, kiểm tra lại Auto-Deploy vì Render có thể tắt nó sau rollback.

Không restore archive, drop collection, xóa WorkSession/QR, đổi marker/secret hay chạy seed khi rollback code. Bản sửa không đổi schema dữ liệu; các phiên đã tạo vẫn ở MongoDB. Quay lại code cũ sẽ làm QR/GPS trên cloud bị guard cũ chặn trở lại, nhưng không tự hoàn tác dữ liệu hoặc giờ làm đã ghi.

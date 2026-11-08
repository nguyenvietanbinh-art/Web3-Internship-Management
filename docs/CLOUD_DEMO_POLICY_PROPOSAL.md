# Đề xuất CLOUD_DEMO — chưa kích hoạt

Ngày kiểm tra: 08/11/2026 (Asia/Bangkok).

## Giới hạn đang có

- `server/src/config/workflowTestGuard.js`: bắt buộc NODE_ENV=test, SCHOOL_WORKFLOW_ENABLED=true, MONGODB_URI trùng WORKFLOW_TEST_URI_ALLOWLIST, giao thức MongoDB thường, loopback, port 27018, danh sách tên database cố định và replicaSet internovaTestRs. Từ chối credentials/host khác.
- `server/src/services/databaseSafety.js:connectionOptions`: workflow gọi guard trên trước khi kết nối. `server/src/index.js` dùng hàm này trước import app và trước mongoose.connect. `verifyIndexes` yêu cầu unique indexes đã có, không tự tạo production index.
- `server/src/services/localWeb3.js:assertTest/context`: kiểm tra TEST, metadata deployment và RPC local 18546 trong workflow. Không thay bằng RPC cloud bằng cách đổi duy nhất một biến.
- `server/src/services/nlpClient.js`: chỉ cho HTTP loopback, từ chối hostname/HTTPS ngoài loopback. AI remote cần adapter được duyệt, không bỏ kiểm tra URL.

## Bản nháp an toàn đã bổ sung

`server/src/config/cloudDemoPolicy.js` là hàm thuần, **chưa được import vào startup**. Vì vậy Backend workflow production/Atlas hiện vẫn bị guard cũ chặn. Không có flag nào trong module mới tự bypass guard hiện tại.

Bản nháp yêu cầu:

1. APP_ENV=CLOUD_DEMO, NODE_ENV=production, SCHOOL_WORKFLOW_ENABLED=true; database đúng internova_cloud_demo.
2. MONGODB_URI bí mật trong secret manager, SRV/TLS tới hostname Atlas chính xác trùng CLOUD_DEMO_CLUSTER_HOST; có credentials riêng. Không nhận loopback, cổng tùy ý, database khác, tùy chọn TLS không an toàn hoặc query lạ/trùng.
3. retryWrites=true và write concern majority; chỉ các query đã duyệt được phép.
4. CLOUD_DEMO_REPLICA_SET và CLOUD_DEMO_INSTANCE_ID được khai báo độc lập. Từ chối biến allowlist TEST local và các cờ listener/Web3 local/demo mode trộn môi trường.
5. Sau khi kết nối có kiểm soát, cần đối chiếu databaseName, hello.setName, writable primary và marker định danh đúng instance/cluster/database/environment. Marker không tồn tại hoặc không khớp: ngắt kết nối, không ghi dữ liệu.

Hostname cấu hình cùng TLS và SRV pin đích kết nối; setName/marker kiểm tra thêm danh tính logic, không thay thế bảo mật mạng/credentials. Không dựa riêng vào hậu tố mongodb.net để cho phép mọi cluster.

## Thiết kế tích hợp cần duyệt tiếp

- Dispatcher môi trường rõ ràng: local workflow gọi nguyên guard cũ; CLOUD_DEMO gọi policy riêng; môi trường/flag thiếu hoặc không xác định bị từ chối. Không dùng nhánh else cho phép chung hoặc NODE_ENV=test trên Render.
- Tất cả trường hợp cấu hình thuần phải xác minh trước connect. Mongoose autoCreate=false, autoIndex=false được đặt trước import model cho cả nhánh cloud. Dùng timeout/pool nhỏ, không ghi log URI.
- Chỉ kết nối sau xác minh cấu hình và TLS. Tạm đóng readiness, chưa listen public cho tới khi hello/marker/index verification thành công. Lỗi phải close connection và exit; không fallback sang local.
- Danh tính marker dự kiến: collection deployment_identity, _id internova-cloud-demo-v1, environment CLOUD_DEMO, database, clusterHost, replicaSet, instanceId. Không có credentials trong marker.
- Marker và index được quản trị viên tạo một lần bằng công cụ provisioning riêng sau phê duyệt, chỉ vào database mới. App runtime chỉ đọc marker; không tự tạo khi thiếu. Nếu marker/index khác dự kiến, dừng thay vì sửa.
- Nếu cần hạn chế quyền mạnh hơn, cấp custom role: app không được dropDatabase/dropCollection, sửa marker hoặc tự quản lý index. Bộ provisioning dùng credential tách biệt, không nằm trong app.
- Không chuyển các database hiện tại, tài khoản, hash mật khẩu, điểm hoặc SBT sang cloud. Không có migration hay seed trong startup/GET.
- DDL/provisioning chỉ thêm collection/index có manifest; không syncIndexes, không drop index. Nếu unique index bị trùng, báo cáo và dừng; rollback cấu hình/code, không xóa dữ liệu để chạy được.

Module policy hiện có 25 unit tests; cùng 4 test guard cũ =29 PASS, không kết nối database. Còn cần kiểm thử nối dispatcher, thất bại sau connect, sai marker, credentials ít quyền, TLS/DNS, Atlas transaction và kiểm thử cloud trước nghiệm thu. Vì chưa nối dispatcher, trạng thái nhánh runtime CLOUD_DEMO là NEED_FIX/BLOCKED, không phải đã chạy được.

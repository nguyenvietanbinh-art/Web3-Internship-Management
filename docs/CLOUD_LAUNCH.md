# Trạng thái khôi phục và đưa Internova lên web — 08/11/2026

## Đã thực hiện

- Khôi phục `internova_database.archive` vào database mới `internova_large_test_20261108` tại MongoDB `127.0.0.1:27018`, replica set `internovaTestRs`. Không dùng `--drop`, không ghi đè hai database cũ.
- MongoDB Tools báo 15.302 document được khôi phục, 0 lỗi. Kiểm tra `validate` đầy đủ: cả 27 collection hợp lệ. Công cụ có cảnh báo khác phiên bản: nguồn 8.0.34, đích local 8.3.9; kết quả validate không thay thế nghiệm thu toàn bộ nghiệp vụ.
- Dữ liệu tài khoản: 500 sinh viên, 50 doanh nghiệp, 30 giảng viên, 2 admin. Không đổi mật khẩu.
- Chạy backend và bản frontend đã build, API `/api/health`, `/api/ready`, `/api/core/capabilities` và trang `/login` trả 200. API không tồn tại vẫn trả JSON 404.
- Cấu hình Docker build giao diện với API `/api`, phục vụ frontend và backend cùng origin. Render dùng `render.yaml`, health check `/api/ready`, không tự deploy khi push.
- Startup `CLOUD_DEMO` đã được nối vào policy Atlas. Trước khi mở cổng phải xác minh database, replica set, environment marker và unique indexes. Không dùng `NODE_ENV=test` trên cloud.

## Chưa thực hiện

Đã đăng nhập Atlas và Render. Đã tạo cluster `Internova` gói Free, AWS Singapore, MongoDB 8.0.37 và xác minh trạng thái ACTIVE trên dashboard. Chưa tạo database user/IP access list, chưa chuyển dữ liệu lên Atlas, chưa tạo dịch vụ Render hoặc phát hành URL công khai. Docker daemon trên máy chưa hoạt động nên chưa build image thực tế; frontend build và unit tests đã chạy độc lập. AI, IPFS, SBT/testnet chưa được triển khai. Cấu hình mới tắt adapter Hardhat local trên cloud.

## Hoàn tất triển khai

1. Đăng nhập Atlas bằng tài khoản của chủ dự án, tạo cluster miễn phí riêng. Ưu tiên MongoDB 8.0 tương thích nguồn nếu có lựa chọn. Tạo database user chỉ phục vụ `internova_cloud_demo`. Chỉ cho phép IP quản trị và outbound IP của backend.
2. Lưu URI mới trong `.team/services.env` dưới tên `MONGODB_URI`. URI phải dạng `mongodb+srv://USER:PASSWORD@HOST/internova_cloud_demo?retryWrites=true&w=majority`. URL encode mật khẩu. Không gửi URI vào chat, không commit file secrets.
3. Kiểm tra target trống trước khi restore. Khôi phục bản archive với namespace nguồn `internova_large_test_20261108.*` đổi sang `internova_cloud_demo.*`. Không dùng `--drop`. Kiểm tra lại số document và indexes sau restore. Dữ liệu auth nonce/QR có TTL có thể hết hạn; không tạo lại session cũ.
4. Sau khi xác minh đúng cluster, ghi environment marker trong collection `cloud_environment`, `_id=internova-cloud-demo-v1`, với `environment=CLOUD_DEMO`, `database=internova_cloud_demo`, `clusterHost`, `replicaSet` từ `hello.setName`, `instanceId` mới ngẫu nhiên. Điền cùng giá trị vào `CLOUD_DEMO_CLUSTER_HOST`, `CLOUD_DEMO_REPLICA_SET`, `CLOUD_DEMO_INSTANCE_ID`; `CLOUD_DEMO_DB_NAME=internova_cloud_demo`. Không tái sử dụng marker QA làm marker cloud.
5. Đăng nhập Render, kết nối repository đã chứa thay đổi triển khai, tạo Blueprint từ `render.yaml`. Dùng secret JWT mới được Render tạo, nhập URI Atlas và các giá trị trên. `CORS_ORIGIN` là origin HTTPS thật của dịch vụ. Không nhập TEST allowlist. Không đưa archive, `.team`, `.env`, private key vào repository hay Docker build context.
6. Theo dõi build/start tới trạng thái live. Xác minh từ URL công khai `/api/ready`, `/login`, tải lại trang con, đăng nhập các vai trò và đọc dữ liệu đúng quyền. Cần kiểm tra transaction Atlas, CV PDF/DOCX và camera/GPS trên thiết bị HTTPS thật trước khi kết luận hệ thống hoàn chỉnh.

## Chạy lại bản đã khôi phục trên máy để kiểm tra

MongoDB phải chạy với data directory cũ và replica set `internovaTestRs` tại cổng 27018. Launcher hiện có `.team/start-restored.cjs` dùng database từ archive mới; `.team/start-existing.cjs` và launcher cũ vẫn dùng database trước đây. Không chạy hai backend cùng cổng 57418. Evidence kiểm tra dữ liệu nằm tại `.team/restored-database-verification.json` và được Git bỏ qua.

Cấu hình Render dựa trên [Blueprint specification chính thức](https://render.com/docs/blueprint-spec). Tài liệu audit cũ [DEPLOY_INTERNOVA_FREE.md](DEPLOY_INTERNOVA_FREE.md) mô tả thời điểm policy chưa nối startup; trạng thái hiện hành cho phần thay đổi này được ghi ở đây.

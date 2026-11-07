# Kết quả cài dependency npm

Ngày: 30/10/2026, Asia/Bangkok. Branch `branch_1`.

Đã thực hiện theo phê duyệt, tuần tự **server → kiểm tra → client → kiểm tra → contracts → kiểm tra**. Runtime: Node v22.23.4, npm 10.9.9, Windows x64. Chỉ thêm PATH trong process để terminal công cụ nhận runtime; không đổi PATH persistent.

## Lệnh đã chạy

Trong từng thư mục `D:\Web3-Internship-Management\server`, `client`, `contracts`:

```powershell
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund
```

Trước khi cài, ba thư mục chưa có node_modules. Các lệnh tải package/ghi cache và chạy lifecycle của dependency theo phạm vi được duyệt. Không chạy npm run, build, lint, test, seed, migration, app start, Hardhat node/compile/deploy hoặc audit fix.

## Trạng thái từng thành phần

| Thành phần | npm ci | Kiểm tra sau cài | Manifest/lockfile |
| --- | --- | --- | --- |
| server | Exit 0; added 175 packages in 17s | npm ls --depth=0 exit 0, không báo dependency lỗi | SHA-256 trước/sau không đổi |
| client | Exit 0; added 61 packages in 14s | npm ls --depth=0 exit 0; native Windows bindings nạp được | SHA-256 trước/sau không đổi |
| contracts | Exit 0; added 590 packages in 59s | npm ls --depth=0 exit 0; native bindings nạp được, Hardhat package/executable hiện diện | SHA-256 trước/sau không đổi |

Số package là số npm báo thêm trên nền tảng hiện tại, không phải số dependency trực tiếp. Kiểm tra cây ở độ sâu 0 không phải chạy test nghiệp vụ hay kiểm tra an toàn toàn bộ dependency.

## Warning, notice và error

### Server

- Deprecated `multer@1.4.5-lts.2`: thông báo npm cho biết Multer 1.x chịu ảnh hưởng bởi các lỗ hổng được vá ở 2.x. Chỉ ghi nhận warning từ package registry; chưa chạy security audit và không tự thay version.
- npm notice có bản npm major mới (10.9.9 → 12.2.1). **Không cập nhật npm**; giữ 10.9.9 theo runtime đã duyệt.
- Không có error cài đặt.

### Client

- Không ghi nhận warning/error trong output npm ci.

### Contracts

- Deprecated `lodash.isequal@4.5.0`.
- Deprecated `inflight@1.0.6`: npm cảnh báo không còn hỗ trợ và memory leak.
- Deprecated `glob` các phiên bản 5.0.15, 7.1.7, 7.2.3, 8.1.0, 10.5.0: npm cảnh báo phiên bản cũ không còn hỗ trợ và có vấn đề bảo mật; 7.2.3 xuất hiện nhiều lần trong output.
- Deprecated `uuid@8.3.2`: npm thông báo dòng <=10 không còn hỗ trợ.
- Không có error cài đặt, không có engine error được báo. Không tự nâng/hạ dependency để xử lý warning.

## Native dependencies và Hardhat

Các phép kiểm tra chỉ nạp module, không chạy test hoặc giao dịch:

| Module | Kết quả |
| --- | --- |
| @oxlint/binding-win32-x64-msvc | Native load OK |
| @rolldown/binding-win32-x64-msvc | Native load OK |
| lightningcss-win32-x64-msvc | Native load OK |
| @nomicfoundation/edr-win32-x64-msvc | Native load OK |
| @nomicfoundation/solidity-analyzer-win32-x64-msvc | Native load OK |
| keccak | Module load OK; nạp trực tiếp keccak/bindings thành công, không dùng JS fallback |
| secp256k1 | Module load OK; nạp trực tiếp secp256k1/bindings thành công, không dùng JS fallback |
| hardhat | package.json xác nhận **2.29.1**, node_modules/.bin/hardhat.cmd tồn tại |
| @nomicfoundation/hardhat-toolbox | npm ls xác nhận **6.1.2** |

**Không phát hiện native module lỗi trong các phép nạp trên.** Chưa kiểm thử chức năng tính toán/native operations, Hardhat loader, task hay compiler. Rủi ro ESM/CommonJS của hardhat.config.js từ preflight chưa được tái hiện hoặc loại trừ; việc package cài thành công không chứng minh config chạy được. Không chạy Hardhat CLI trong lần này.

## Bảo toàn file và trạng thái Git

- SHA-256 của cả sáu file package.json/package-lock.json khớp baseline trước cài.
- `git diff --exit-code` đạt: không có thay đổi tracked được phát hiện; branch vẫn `branch_1`, tracking `origin/branch_1` theo ref local, không fetch.
- Untracked trước đó vẫn giữ nguyên: thư mục tài liệu gốc, ZIP tương ứng, docs/PROGRESS.md, audit-reports/. Báo cáo kết quả này nằm trong audit-reports/.
- node_modules được tạo trong ba thành phần và bị Git ignore; không đưa dependency vào commit.
- Không tạo/sửa .env, không sửa source/config, không kết nối hoặc thay database, không deploy, không commit/push/merge.

## Các bước tiếp theo — cần xác nhận, chưa thực hiện

1. **Client:** chạy lint không --fix; build với output mới/staging để không ghi đè dữ liệu build có sẵn. Xác nhận binary/package thực hoạt động, không chỉ nạp bindings.
2. **Hardhat:** kiểm tra CLI và nạp cấu hình trong quy trình riêng; nếu ESM/HH19 lỗi thì dừng báo trước khi sửa. Compile có thể tải compiler 0.8.24 và ghi artifacts/cache, cần phạm vi phê duyệt riêng. Không tự chạy clean/test/deploy.
3. **Backend/AI:** xác nhận MongoDB đích demo, cách cấp JWT/Pinata không lộ secret, AI runtime và CORS/API/RPC. Backend boot có thể tạo index và listener ghi DB; chưa được chạy trong gói cài dependency.
4. **Kiểm thử:** không chạy server npm test hiện có vì helper dropDatabase; đề xuất kiểm tra bằng mock/không DB và test riêng được duyệt. Không seed/migration.
5. **Warnings:** lập phương án nâng cấp riêng, đánh giá thay đổi API và kiểm thử hồi quy trước khi sửa manifest/lockfile; không tự audit fix.

**Đã dừng sau cài và kiểm tra dependency. Chờ người dùng xác nhận trước khi build, kiểm thử runtime hoặc chạy ứng dụng.**

> Luồng hiện hành: **http://localhost:5182/**, email trước và ví sau. [Hướng dẫn thống nhất](FULL_WEBSITE_TEST_GUIDE.md). Các môi trường nhiều cổng bên dưới là lịch sử; Google live cần Client ID hợp lệ cho origin5182.

# Cấu hình và kiểm tra Google Login của Internova

Ngày 01/11/2026 (+07). Code và test nội bộ đã triển khai; **Google thật còn BLOCKED vì chưa có OAuth Client ID**. Không nhập mật khẩu Gmail vào Internova. Email/password của ứng dụng chưa triển khai; form hiển thị trạng thái chưa hỗ trợ.

## 1. Trang đang chạy

- Authentication TEST mới: **http://localhost:5178/**.
- API: `http://localhost:57406/api`.
- Database mới: `web3_internship_test_phase1_b945bbcc_1f508b655dfe`.
- Metadata: `contracts/node_modules/.cache/google-auth-final-20261101/google-runtime.json`.
- Demo cũ `http://127.0.0.1:5177/` vẫn giữ nguyên Backend đang chạy; không dùng nó để nghiệm thu Google mới. Frontend dùng source hiện tại nhưng Backend cũ chưa nạp routes Google.

Bấm **Đăng nhập / Đăng ký** để mở lựa chọn Google hoặc MetaMask. Nút này không tự mở MetaMask nữa. Bấm Google trong môi trường chưa cấu hình phải báo BLOCKED và không tạo tài khoản.

## 2. Tự tạo Google Web Client ID

Thực hiện trên tài khoản Google của bạn; không cần cấp cho tôi mật khẩu hoặc quyền truy cập Cloud Console.

1. Mở [Google Cloud Console](https://console.cloud.google.com/), chọn hoặc tạo project dành cho đồ án.
2. Mở **Google Auth Platform → Branding**, nhập tên Internova, support email và developer contact. Chỉ đưa domain/logo mà bạn sở hữu; không khai thông tin xác minh giả.
3. Trong **Audience**, chọn External nếu dùng Gmail cá nhân. Khi ở chế độ Testing, thêm chính email dùng thử vào Test users theo cấu hình Console.
4. Trong **Data Access**, chỉ dùng thông tin đăng nhập tối thiểu `openid`, `email`, `profile`; không yêu cầu Gmail, Drive hoặc quyền đọc email.
5. Trong **Clients**, tạo OAuth client loại **Web application**.
6. Authorized JavaScript origins thêm chính xác:

   ```text
   http://localhost
   http://localhost:5178
   ```

7. Luồng hiện tại là **GIS popup + JavaScript callback**, không phải redirect/code flow, nên không cần Authorized redirect URI cho callback này. Không điền `/auth/google/login` vào redirect URI: đó là JSON endpoint nội bộ được Frontend gọi.
8. Lấy **Client ID công khai** có đuôi `.apps.googleusercontent.com`. Không cần Client Secret trong luồng này; không đưa Client Secret vào Frontend, Git hoặc chat.

Nguồn: [Google hướng dẫn tạo Client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [GIS button](https://developers.google.com/identity/gsi/web/guides/display-button), [xác minh ID token tại Backend](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## 3. Chạy Backend với Client ID thật — PowerShell

Runtime đang chạy chưa có Client ID. Biến môi trường của terminal không tự cập nhật vào tiến trình đang chạy. Sau khi có ID, đóng **đúng Backend Google TEST mới** trước khi dùng cổng 57406; không dừng MongoDB, Hardhat, NLP hoặc Backend/demo cũ. Có thể gửi Client ID công khai để tôi xác minh và chuyển runtime TEST cho bạn; không gửi secret.

Các lệnh sau là **PowerShell**, không dán vào CMD. Đặt Client ID thật thay placeholder; script từ chối dùng lại metadata của run cũ, luôn tạo database TEST con mới và giữ dữ liệu các run trước.

```powershell
Set-Location D:\Web3-Internship-Management
$env:NODE_ENV='test'
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/web3_internship_test_phase1_google_manual'
$env:MONGODB_URI_TEST_ALLOWLIST=$env:MONGODB_URI_TEST
$env:GOOGLE_CLIENT_ID='DAN_CLIENT_ID_CONG_KHAI_THAT_VAO_DAY'
$googleRun='contracts/node_modules/.cache/google-auth-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
node scripts/demo/google-start.cjs $googleRun
```

Script bật Google/core cho TEST, tạo JWT secret ngẫu nhiên bằng harness hiện có, tắt demo-login/chain listeners/Pinata credentials. Không tạo `.env`, không seed, không deploy. Không dùng script này làm entrypoint production. Nó không cung cấp verifier TEST giả; runtime luôn dùng verifier chính thức.

Frontend đang chạy 5178 đã trỏ API mới. Nếu cần chạy lại, mở PowerShell khác; chỉ chạy khi cổng trống:

```powershell
Set-Location D:\Web3-Internship-Management
$env:VITE_API_URL='http://localhost:57406/api'
$env:VITE_ENABLE_DEMO='false'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5178 --strictPort
```

Mở **http://localhost:5178/**, giữ đồng nhất hostname `localhost` giữa UI/API để cookie SameSite Strict hoạt động. Không đổi riêng Frontend sang 127.0.0.1. Không cần VITE_GOOGLE_CLIENT_SECRET; Client ID lấy từ endpoint cấu hình công khai của Backend.

Kiểm tra cấu hình bằng GET, không tạo user:

```powershell
Invoke-RestMethod http://localhost:57406/api/auth/google/status
```

`enabled: true` chỉ chứng tỏ bật flag và Client ID đúng định dạng, **chưa chứng minh Client ID thuộc project/origin đúng hoặc Google login đã thành công**.

## 4. Nghiệm thu Google thật sau cấu hình

1. Bấm Google, chọn tài khoản trong popup thật. Lần đầu tạo student, không ví/mật khẩu giả. Lưu bằng chứng UI và HTTP status, không chụp token/cookie.
2. Đăng xuất rồi đăng nhập cùng Google: cùng User ID, không tăng số user. UI chuyển Hồ sơ cá nhân nếu chưa có ví.
3. Hủy popup: không tạo user. Bấm bắt đầu lại nếu popup đã đóng hoặc challenge quá 5 phút.
4. Google email trùng hồ sơ cũ: phải báo cần liên kết. Đăng nhập tài khoản ví cũ, vào Hồ sơ → Liên kết Google; xác nhận chữ ký của đúng ví cũ rồi chọn Google. Không tự merge.
5. Google-only: Hồ sơ → Liên kết ví MetaMask. Chọn ví TEST chưa thuộc user khác, ký challenge có User ID/mục đích/origin/hạn, rồi xác thực lại đúng Google. Nếu ví đã thuộc user khác, phải bị từ chối; không chiếm hoặc chuyển dữ liệu user đó.
6. Khi có ví, nghiệp vụ cũ được mở theo role thật. Google mới chỉ student; company/mentor/admin đã được cấp hợp lệ giữ role khi liên kết và đăng nhập Google. Không có lựa chọn tự cấp mentor/admin.
7. Hủy liên kết Google chỉ khi còn ví và có đủ chữ ký ví + Google reauthentication. Google-only không được xóa phương thức cuối. Không đổi/hủy ví đang làm khóa nghiệp vụ trong phạm vi này.

Đừng dùng ví chứa tài sản thật khi demo. Liên kết ví chỉ ký thông điệp, không cần giao dịch/gas. Popup MetaMask có yêu cầu chờ phải được bạn xử lý trong tiện ích; không bấm liên tiếp.

## 5. Lỗi thường gặp

| Hiện tượng | Kiểm tra |
| --- | --- |
| GOOGLE_NOT_CONFIGURED / BLOCKED | Client ID và flag của tiến trình Backend mới; không phải terminal khác. |
| origin_mismatch | Web client, origin chính xác localhost:5178, không có path; đợi cấu hình Cloud có hiệu lực. |
| Popup bị chặn hoặc bị hủy | Cho phép popup Google cho localhost, kiểm tra network/extension; bắt đầu lại, không giả lập thành công. |
| IDENTITY_CHALLENGE_INVALID | Cookie bị chặn, hostname không đồng nhất, challenge sai phiên/hết hạn/replay; bắt đầu lại. |
| ACCOUNT_LINK_REQUIRED | Đăng nhập phương thức cũ rồi link; không sửa email database để vượt kiểm tra. |
| IDENTITY_CONFLICT | Google sub/email xác minh hoặc ví đã thuộc tài khoản khác; không tự gộp. |
| IDENTITY_INDEX_REVIEW_REQUIRED | Database cũ chưa có partial unique indexes; giữ dừng, lập migration riêng. Không syncIndexes/dropIndex tự động. |
| WALLET_LINK_REQUIRED | Tài khoản Google đã đăng nhập nhưng chưa có ví; vào Hồ sơ để liên kết. |
| Google token bị từ chối | Sai audience/issuer/chữ ký/nonce/hạn/email_verified hoặc không lấy được public certificates; kiểm tra Client ID, mạng và đồng hồ thật. Không giảm kiểm tra bảo mật. |

## 6. Giới hạn còn lại

Chưa có bằng chứng Google popup/token thật; chưa kiểm Gmail cá nhân trên máy này. Chưa có email/password/reset password. Tài khoản Google chưa có ví chỉ dùng hồ sơ/cài đặt, theo phạm vi đã duyệt. Chưa áp dụng index migration trên dữ liệu gốc/demo. Runtime này phục vụ kiểm authentication; không tự bật Pinata, deploy hay nối lại toàn bộ Web3 demo cũ. Production còn cần HTTPS, chính sách session/XSS/CSP, audit retention và kiểm thử Google credentials thật.

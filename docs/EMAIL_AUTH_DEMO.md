> Luồng hiện hành: **http://localhost:5182/**, email trước và ví sau. [Hướng dẫn thống nhất](FULL_WEBSITE_TEST_GUIDE.md). Các môi trường nhiều cổng bên dưới là lịch sử; Google live cần Client ID hợp lệ cho origin5182.

# Demo đăng ký / đăng nhập bằng email và mật khẩu

Ngày 02/11/2026 (+07). **Đã triển khai và kiểm thử thực tế trên TEST riêng. Không cần Google OAuth hoặc Client ID.**

## Bạn thao tác ở đâu?

Mở **http://localhost:5182/** → **Đăng nhập / Đăng ký**.

1. Bấm **Chưa có tài khoản? Đăng ký**.
2. Nhập họ tên, email dạng `ten@gmail.com`, mật khẩu riêng của Internova và xác nhận mật khẩu.
3. Bấm **Tạo tài khoản sinh viên**. Backend tạo User, hồ sơ Student, lưu mật khẩu dạng băm và cấp JWT thật; chuyển sang Hồ sơ cá nhân.
4. Bấm Đăng xuất, mở lại Đăng nhập, nhập đúng email/mật khẩu Internova. Không cần tài khoản Google, không có popup Google/MetaMask trong luồng này.
5. Vào Hồ sơ để chỉnh thông tin hoặc đổi mật khẩu. Đổi mật khẩu cần mật khẩu hiện tại và xác nhận mật khẩu mới; các JWT cũ hết hiệu lực, phiên hiện tại nhận JWT mới.

Mật khẩu ít nhất 10 ký tự, tối đa 72 byte UTF-8. Không dùng mật khẩu Gmail thật hoặc mật khẩu đang dùng cho dịch vụ khác. Demo không gửi email xác minh: email luôn được ghi đúng là chưa xác minh bởi hệ thống email. Chưa có chức năng quên mật khẩu/gửi link reset.

Email đăng nhập được chuẩn hóa chữ thường và tách khỏi email hồ sơ. Đổi email hồ sơ không đổi email đăng nhập. Không tự gộp với tài khoản ví/Google cũ chỉ vì trùng email; nếu email trùng phải dùng phương thức cũ, không sửa database để vượt kiểm tra. Chỉ tự đăng ký student; company/mentor/admin không được tự cấp qua form này.

## Ví có bắt buộc không?

**Đăng ký, đăng nhập, chỉnh hồ sơ, đổi mật khẩu không cần ví.** Source nghiệp vụ cũ vẫn dùng wallet làm khóa sở hữu, theo phạm vi đã phê duyệt. Để dùng CV/JD/thực tập/Web3, vào Hồ sơ → nhập mật khẩu hiện tại → **Liên kết ví TEST bằng mật khẩu và chữ ký**. Lúc này mới cần MetaMask để ký, không cần Google hay giao dịch/gas.

Ví đã thuộc user khác bị từ chối; không tạo ví giả hoặc tự chuyển dữ liệu. Không tự đổi/hủy ví đang là khóa sở hữu. Không chuyển toàn bộ nghiệp vụ sang User ID trong lần bổ sung này. Người dùng chưa có ví không được đưa vào các query scope wallet rỗng.

## Runtime riêng và dữ liệu

- Frontend: `http://localhost:5182/`.
- Backend: `http://localhost:57407/api`.
- Metadata chứa tên database TEST mới và PID: `contracts/node_modules/.cache/email-auth-manual-20261102/email-runtime-current.json`.
- Không seed tài khoản/mật khẩu mẫu vào runtime dành cho bạn; bạn tự đăng ký bằng UI.
- Demo cũ 5177 và Google TEST 5178 giữ nguyên dữ liệu. Không dùng các cổng đó để kiểm email/password mới vì Backend cũ chưa nạp route/flag/index email.
- Database gốc/demo không được thay đổi; chỉ tạo database TEST con mới, có exact allowlist và kiểm tra database trống trước chạy.

Nếu cần tạo một lượt TEST mới khi các cổng đã trống, chạy bằng **PowerShell** (không dán vào CMD):

```powershell
Set-Location D:\Web3-Internship-Management
$env:NODE_ENV='test'
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/web3_internship_test_phase1_email_manual'
$env:MONGODB_URI_TEST_ALLOWLIST=$env:MONGODB_URI_TEST
$emailRun='contracts/node_modules/.cache/email-auth-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
node scripts/demo/email-start.cjs $emailRun
```

Terminal khác cho Frontend, chỉ chạy khi cổng trống:

```powershell
Set-Location D:\Web3-Internship-Management
$env:VITE_API_URL='http://localhost:57407/api'
$env:VITE_ENABLE_DEMO='false'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5182 --strictPort
```

Không cần tạo `.env`, cài dependency hoặc Google credentials. Script bật EMAIL_AUTH_ENABLED cho riêng process TEST, tắt Google và dùng JWT secret ngẫu nhiên trong harness. Không dùng launcher này cho production. Nếu muốn dùng lại dữ liệu TEST đang có sau khi dừng tiến trình, cần launcher resume có kiểm tra riêng; script hiện tại cố ý không tái sử dụng database không trống. Không xóa dữ liệu để chạy lại.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
| --- | --- |
| Backend regression toàn bộ | **147/147 PASS**, 0 fail, 0 skip; gồm 8 nhóm email auth mới. |
| Email browser E2E | **5/5 PASS**; form → API → MongoDB → bcrypt → JWT thật, không mock success. |
| Google/ví browser regression | **7/7 PASS**; Google live vẫn BLOCKED như báo cáo trước, không cần cho email demo. |
| Frontend lint/build | **PASS**, lint 0 error/0 warning; output ignore `client/dist/email-auth-acceptance`. |
| Database safety | Ba DB gốc/demo: full collection hashes, counts và index definitions giống nhau trước/sau acceptance. |

Evidence: [kết quả](evidence/email-auth-20261102/result.json), [Backend](evidence/email-auth-20261102/backend.txt), [email browser](evidence/email-auth-20261102/email-browser.txt), [Google/ví regression](evidence/email-auth-20261102/google-browser-regression.txt).

Tests mới kiểm hash/no plaintext, chuẩn hóa/trùng/race email, dữ liệu sai, mật khẩu Unicode vượt giới hạn bcrypt, privilege injection, sai mật khẩu/email không tồn tại, email cũ không auto-merge, profile không đổi loginEmail, đổi mật khẩu/JWT revocation, chữ ký sai/browser cookie sai/user sai/replay/expiry/chiếm ví, disabled account, GET không tự ghi và feature flag thiếu.

## Thay đổi kỹ thuật và giới hạn

- `User`: loginEmail và passwordHash select:false, authVersion; unique partial loginEmail, wallet optional nếu có password identity. Mật khẩu băm bằng bcryptjs đã có, cost12; từ chối >72 byte và NUL, không cắt ngầm. Tham chiếu [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- JWT thêm sessionVersion tương thích phiên cũ mặc định0. Đổi mật khẩu/link ví tăng authVersion; middleware kiểm version, provider hiện có, role và disabled từ DB.
- Route mới dưới `/api/auth/email`: GET status; POST register, login, change-password, wallet-challenge, link-wallet. Thao tác POST ghi là có chủ đích; GET không tạo user/business data. Rate limit auth hiện có áp dụng cho các POST mới.
- Challenge link ví gắn User ID/wallet/nonce/origin/hạn, cookie HttpOnly/SameSite Strict và tiêu thụ nguyên tử. Cần mật khẩu hiện tại + chữ ký ví thật; không nonce login dùng chéo mục đích.
- Tài khoản cũ không được tự thêm mật khẩu hoặc đổi email đăng nhập. Không cho đăng ký trùng email hiện có của ví/Google. Chưa có email verification, password recovery hoặc đổi loginEmail.
- Flag `EMAIL_AUTH_ENABLED` mặc định false. `server/.env.example` chỉ thêm placeholder/flag, không sửa `.env` thật. User indexes được tạo trên TEST mới; runtime từ chối nếu còn index wallet legacy không partial hoặc thiếu unique loginEmail. Không syncIndexes/migration trên dữ liệu cũ; rollout dữ liệu cũ cần kế hoạch/index approval riêng.
- Chưa harden production đầy đủ: HTTPS, session storage/XSS/CSP, email verification/recovery, rate limit phân tán, password breach checking/MFA và audit retention cần triển khai riêng. Không gọi đây là production release.

File chính: `server/src/routes/email.routes.js`, `server/src/models/User.js`, `IdentityChallenge.js`, config/env, app, authService và middleware/auth, auth/google status/me; `client/src/components/EmailIdentity.jsx`, AuthModal, GoogleIdentity settings và App; `server/test/email-auth.test.js`, `client/test/email-auth.e2e.cjs`, Google browser regression; `scripts/demo/email-start.cjs`, `email-acceptance.cjs`. Không thêm dependency, không deploy, không commit/push/merge.

# Liên kết ví bị khóa — 07/11/2026

## Nguyên nhân và sửa

Nút Liên kết ví MetaMask trong `PasswordSettings` dùng chung state `current` với ô Mật khẩu hiện tại của form đổi mật khẩu, có điều kiện `disabled={busy || !current}`. Vì vậy chưa điền ô đổi mật khẩu thì nút liên kết bị khóa, không có ô xác nhận riêng ở phần ví. Admin/giảng viên dùng chung component cũng bị lộ nút ví khi chưa có địa chỉ.

Đã tách `PasswordWalletLink.jsx`, đặt tại `MyWallet.jsx` cho sinh viên/doanh nghiệp đăng nhập mật khẩu và chưa liên kết ví. Form có ô **Mật khẩu xác nhận liên kết ví**, nút không khóa âm thầm; thiếu mật khẩu thì validation đưa focus vào ô. Phần đổi mật khẩu ở `EmailIdentity.jsx` chỉ đổi mật khẩu, không còn thao tác ví. Admin/giảng viên không hiện form liên kết ví. Tài khoản Google vẫn dùng cơ chế xác nhận hiện có, không bị đổi.

Giữ nguyên API challenge/link, cookie ràng buộc trình duyệt, mật khẩu xác nhận, nonce hết hạn/một lần và chữ ký thật. Chỉ xin tài khoản ví khi người dùng submit; không tự liên kết, đổi ví, gộp tài khoản hoặc gửi giao dịch. Báo rõ không có MetaMask, yêu cầu đang chờ và người dùng từ chối. Mật khẩu chỉ trong state form, không ghi vào browser storage hay tài liệu.

## Cách dùng

Tải lại website → Hồ sơ cá nhân → **Ví Web3 của tôi** → nhập mật khẩu đang dùng để đăng nhập → **Liên kết ví MetaMask** → chọn đúng ví thử nghiệm trong tiện ích → ký thông điệp → kiểm trạng thái đã xác minh. Không cần nhập mật khẩu mới hoặc đổi mật khẩu. Chỉ dùng ví local để thử; không gửi private key/mật khẩu cho người khác.

Nếu trình duyệt không bật tiện ích MetaMask sẽ hiện lỗi hướng dẫn. Không tự cài extension hoặc nhập ví thật thay người dùng.

## Kiểm thử

- Frontend lint0 error/warning, build PASS; diff whitespace PASS.
- `client/test/wallet-link-settings-browser.cjs`:6/6 PASS,0 runtime exception. Form riêng và validation của sinh viên/doanh nghiệp, lỗi thiếu MetaMask không gọi API hay đổi mật khẩu; Admin/mentor không có công cụ ví. Không có POST nghiệp vụ từ ca browser này.
- `server/test/email-auth.test.js`:9/9 PASS trên TEST được guard xác minh `web3_internship_test_phase1_777c18fd_1b0695d69ffc`; kiểm mật khẩu, chữ ký bằng ví sinh ngẫu nhiên thật, cookie/owner, chống replay, ví trùng, challenge hết hạn và JWT cũ. Không giao dịch blockchain.
- Chưa chạy thao tác ký qua extension MetaMask trên trình duyệt của người dùng; không tuyên bố bước phần cứng này PASS. Test không bỏ xác thực để giả liên kết thành công.
- Lần browser đầu timeout CDP, lần sau đăng nhập HTTP500: xác minh MongoDB27018 đã dừng. Đã khởi động lại đúng MongoDB8.0.34 với dbpath cũ `LOCALAPPDATA/Web3-Internship-Management/MongoDB/workflow-rs-20261107`, không init/reset/seed. Replica set `internovaTestRs`, primary, ping và marker TEST đều đúng; browser chạy lại6/6 PASS. Không sửa Backend để che lỗi kết nối. MongoDB và ứng dụng giữ chạy.

Bằng chứng local: `contracts/node_modules/.cache/student-workflow-20261107/wallet-settings-1794020466270/results.json`, ảnh bốn vai trò cùng thư mục. Không xuất file tài khoản/password lên Git. Source thay đổi chỉ `EmailIdentity.jsx`, `MyWallet.jsx`, component mới và browser test; không đổi schema/API, mật khẩu hoặc liên kết ví người dùng. Không commit/push.

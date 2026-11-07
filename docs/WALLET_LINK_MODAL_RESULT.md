# Modal liên kết ví Web3 — 07/11/2026

**Cập nhật dừng khi đang chờ:** Dừng liên kết/X/Escape luôn đóng được modal, bỏ qua kết nối/chữ ký đến muộn;11 browser tests/lint/build PASS. Nếu API lưu đã gửi thì thông báo trạng thái đang xử lý, không giả rollback. [Chi tiết](WALLET_LINK_CANCEL_FIX.md). Số41 test bên dưới là kết quả của lần triển khai modal trước đó.

## Kết quả

Đã thay form liên kết ví hiện sẵn bằng nút **Liên kết ví MetaMask** trong **Ví Web3 của tôi**. Nút mở modal có mật khẩu tài khoản, hiển thị/ẩn, Hủy/Tiếp tục. Mật khẩu chỉ xuất hiện khi mở modal; đóng modal xóa giá trị. Phần đổi mật khẩu của sinh viên/doanh nghiệp thu gọn riêng. Không còn nút Liên kết Google hoặc dòng Google:Chưa liên kết ở hồ sơ. Admin/giảng viên giữ phần bảo mật tài khoản, không có công cụ ví.

Backend xác thực mật khẩu trước khi client xin tài khoản MetaMask. Xác thực thành công cấp ticket5 phút, gắn tài khoản, phiên bản xác thực và cookie HttpOnly/SameSite=Strict. Sau khi chọn ví, ticket được dùng đúng1 lần để cấp nonce ký thông điệp; nonce gắn user, wallet, chain ID, origin, purpose và thời hạn. Frontend xóa mật khẩu sau bước xác thực, không gửi lại ở challenge/link của luồng mới. Nếu đổi mạng trong khi ký, phải bắt đầu lại.

Backend xác minh chữ ký thật, browser cookie, phiên tài khoản, thời hạn, nonce chưa dùng và ví chưa thuộc tài khoản khác trước khi lưu. JWT cũ hết hiệu lực khi liên kết; JWT mới và đăng nhập lại trả trạng thái `walletVerified` đúng. Không có giao dịch/chuyển tiền và không yêu cầu private key/seed phrase/mật khẩu MetaMask.

Tài khoản Google chưa có mật khẩu sử dụng luồng xác minh lại Google đã có, trong modal riêng sau nút liên kết ví; không tự tạo mật khẩu, gộp hoặc bỏ phương thức đăng nhập. Backend OAuth và phương thức đăng nhập cũ vẫn giữ nguyên. Thiếu cấu hình Google thì báo lỗi thay vì bypass. Challenge liên kết theo Google cũng ghi chain ID vào thông điệp đã ký; không thay quy trình đăng nhập Google chung.

## API

| Endpoint | Vai trò |
|---|---|
| POST `/api/auth/email/wallet-reauth` |Mới; xác thực password, trả ticket/thời hạn, không password/hash |
| POST `/api/auth/email/wallet-challenge` |Mở rộng; nhận reauthId, walletAddress, chainId; cấp nonce một lần |
| POST `/api/auth/email/link-wallet` |Mở rộng; nhận challengeId, chainId, signature; kiểm và lưu ví |
| POST `/api/auth/google/challenge`, `/api/auth/wallet/link` |Giữ xác minh Google cho tài khoản không mật khẩu; challenge thêm chain ID |
| GET `/api/auth/me`, POST `/api/auth/email/login` |Xác minh trạng thái sau liên kết/đăng nhập lại |

Client cũ dùng password ở challenge/link vẫn được hỗ trợ; challenge mới luôn ký chain ID, client cũ mặc định local31337. Luồng modal mới bắt buộc ticket xác thực và chain ID. Origin kiểm ở cả3 endpoint email; cookie ràng buộc trình duyệt, JWT bắt buộc. Rate limiter `/api/auth` hiện có bảo vệ endpoint mới, trả429/Retry-After. Limiter lưu trong RAM theo IP; chưa phải giới hạn phân tán cho nhiều instance production.

Model `IdentityChallenge` chỉ bổ sung purpose ticket xác thực, chainId và authVersion tùy chọn. Không migration/index mới hoặc viết lại challenge cũ; nonce cũ không đủ điều kiện cho luồng mới không-password. Không thay RBAC hoặc khóa sở hữu nghiệp vụ.

## File thay đổi

- `client/src/components/PasswordWalletLink.jsx`: modal, reauth trước MetaMask, ký/kiểm chain, hủy/lỗi.
- `client/src/components/MyWallet.jsx`: trạng thái đã/chưa liên kết, ví rút gọn, fallback xác minh danh tính.
- `client/src/components/GoogleIdentity.jsx`: ẩn quản lý liên kết Google ở hồ sơ, giữ OAuth/fallback, đổi mật khẩu thu gọn.
- `server/src/routes/email.routes.js`: endpoint reauth, mở rộng nonce/chữ ký, origin và DTO walletVerified.
- `server/src/routes/google.routes.js`: chain ID trong challenge liên kết ví Google.
- `server/src/models/IdentityChallenge.js`: trường/purpose bổ sung tương thích dữ liệu cũ.
- `server/test/wallet-modal-flow.test.js`: kiểm API mới; `client/test/wallet-link-modal-browser.cjs`: E2E mới.
- `client/test/wallet-link-settings-browser.cjs`: entrypoint tương thích gọi suite modal thay kiểm tra form inline cũ.
- `scripts/demo/wallet-modal-snapshot.cjs`: chỉ đọc hash/count/index dữ liệu nghiệp vụ để đối chiếu trước/sau.

Không sửa các script cập nhật CV/JD, dữ liệu bộ đánh giá200 CV hoặc logic tuyển dụng trong nhóm này. Worktree có nhiều thay đổi từ các nhiệm vụ trước, không reset/clean hoặc gộp toàn bộ diff vào thay đổi ví.

## Kiểm thử

| Yêu cầu | Kết quả |
|---|---|
|Chưa nhấn không có ô password ví; Google link ẩn|PASS browser|
|Mở modal, hiện/ẩn, Hủy xóa form và không gọi auth|PASS browser|
|Mật khẩu sai không gọi ví; đúng mới tiếp tục|PASS API/browser|
|Không cài MetaMask hiện thông báo|PASS browser headless|
|Từ chối kết nối hoặc ký không liên kết|PASS EIP-1193 test adapter|
|Chữ ký sai, chain sai, cookie/user/origin sai|PASS API|
|Ticket/nonce hết hạn, dùng lại bị từ chối|PASS API|
|Ví thuộc tài khoản khác bị từ chối|PASS API|
|Ký thành công lưu ví, UI và đăng nhập lại đúng|PASS E2E với chữ ký khóa TEST thật/API thật/MongoDB TEST thật|
|Chống brute force endpoint mới|PASS API429|
|Các vai trò, desktop/mobile, không lưu password trong storage|PASS browser, ảnh mobile390px|
|Google auth regression bằng verifier TEST|16/16 PASS|
|Email auth cũ + API modal/ví mới|16/16 PASS|
|Browser modal và4 vai trò|9/9 PASS,0 runtime exception|
|Frontend lint/build, syntax Backend, diff whitespace|PASS,0 lint error/warning|

Tổng41 test PASS. Browser dùng adapter EIP-1193 chỉ trong harness, ký thật bằng khóa ngẫu nhiên trong Node, gọi API thật, xác minh user trong MongoDB TEST và đăng nhập lại. Không mock kết quả success, không gọi phương thức gửi giao dịch. **Chưa kiểm trực tiếp extension MetaMask hoặc popup Google live trên thiết bị của người dùng**; không ghi các bước này là PASS.

Lượt browser đầu đo visibility bằng getClientRects nên báo FAIL với input nằm trong details đã đóng. Đã kiểm DOM/ảnh xác nhận input không hiển thị, sửa test dùng checkVisibility và chạy lại9/9. Kiểm ảnh cũng phát hiện modal thiếu wrapper card; đã sửa dùng `modal-content` có sẵn rồi chạy lại, không bỏ assertion để che lỗi.

## An toàn dữ liệu và bằng chứng

Test API chỉ ghi database TEST có exact allowlist/guard trên27017; browser tạo tài khoản TEST mới trên `internova_role_qa_20261107` sau kiểm tên replica set và marker. Các lượt thử được giữ lại, không xóa database. Không liên kết/chỉnh mật khẩu bất kỳ tài khoản nghiệp vụ hiện có nào thay người dùng.

Hash BSON, số bản ghi và indexes trước/sau database website `internova_demo_cunhan_kysu_20261107` trùng nhau cho9 collection:

`cvs`275; `topics`68; `topic_opportunities`144; `job_descriptions`8; `school_applications`77; `assignments`35; `business_reports`49; `students`277; `work_sessions`60.

Đây là snapshot sau đợt cập nhật nội dung CV/JD trước đó, không hoàn tác cập nhật ấy. Trong nhiệm vụ ví, CV/JD, chỉ tiêu, ứng tuyển, phân công, báo cáo, GPA và giờ làm không thay đổi. Không seed/migration/deploy/cài dependency/.env/commit/push.

[Ảnh trước khi mở modal](evidence/wallet-link-modal-20261107/wallet-before-modal.png) · [Ảnh modal mobile](evidence/wallet-link-modal-20261107/wallet-mobile-modal.png) · [Kết quả E2E](evidence/wallet-link-modal-20261107/results.json). Thư mục bằng chứng còn có log API/Google và snapshot hash/index, không có password/private key/token.

Hai Backend đã khởi động lại đúng launcher để nạp API: website hiện có **http://localhost:5188**, TEST **http://localhost:5189**. Health57418/57419 đều online/connected; MongoDB và AI không bị dừng. Không nhập địa chỉ ví để tự liên kết nếu chưa ký.

## Bạn tự kiểm tra

Tải lại trang → Hồ sơ cá nhân → Ví Web3 của tôi → Liên kết ví MetaMask → nhập mật khẩu website → Tiếp tục → chọn ví local → ký thông điệp. Kiểm trạng thái đã liên kết và địa chỉ rút gọn, đăng xuất/đăng nhập lại để xác nhận. Không gửi mật khẩu hoặc private key vào chat; nếu MetaMask có yêu cầu pending thì mở tiện ích xử lý/hủy trước khi thử lại.

# Google authentication — preflight và thiết kế đề xuất

Ngày 01/11/2026 (+07). Đây là **preflight lịch sử trước khi được phê duyệt**, không phải trạng thái triển khai mới nhất. Đã có phê duyệt và đã triển khai/test nội bộ; xem [kết quả Google authentication](GOOGLE_AUTH_RESULT.md). Google thật vẫn BLOCKED vì thiếu Client ID. Không thay thế báo cáo nghiệm thu PHASE 7.

## 1. Kết quả kiểm tra source

| File | Hiện trạng / tác động |
| --- | --- |
| `server/src/models/User.js` | `walletAddress` required và unique. Chưa có Google sub, emailVerified, password hash hoặc danh sách provider. Email hiện không unique và có thể sửa ở hồ sơ. |
| `server/src/services/authService.js` | EIP-191 nonce, chữ ký ví, nonce tiêu thụ nguyên tử, JWT có sub/wallet/role. Giữ nguyên đăng nhập ví. |
| `server/src/routes/auth.routes.js` | Đăng ký ví chỉ company/student; mentor/admin cấp riêng. Login có tạo hồ sơ Student/Company. Demo-login có guard riêng. Không có Google OAuth. |
| `server/src/middleware/auth.js` | Nạp User từ JWT sub, đối chiếu wallet, đọc role/disabled từ database. Google-only phải có quy tắc session rõ ràng, không bỏ đối chiếu cho session ví cũ. |
| `server/src/core/shared.js` | Audit history yêu cầu actorWallet; tài khoản chưa có ví cần actorUserId hoặc audit authentication riêng. Không gán ví giả. |
| `server/src/core/accounts.js` | Profile, provisioning, RBAC và audit hiện dựa trên User có ví; DTO ghi authentication=wallet. |
| `server/src/core/{recruitment,placements,dashboard,ai}.js` | Quyền sở hữu và scope dùng walletAddress. Không đưa undefined/null vào truy vấn để tránh đọc nhầm dữ liệu không có owner. |
| `client/src/api/client.js` | JWT trong localStorage, restore/logout, chữ ký MetaMask; chưa có password/Google API. Giữ tương thích phiên cũ; localStorage vẫn có giới hạn trước XSS. |
| `client/src/App.jsx` | AuthModal, restore session, role dashboard. accountsChanged hiện logout mọi session; cần phân biệt Google session khi MetaMask đổi ví. |
| `client/src/components/AuthModal.jsx` | MetaMask và demo có điều kiện. Chưa có form email/password hoạt động. |
| `client/src/components/AppShell.jsx` | Header/sidebar theo role; cần hiện account provider, email và trạng thái chưa liên kết ví. |

Đã đối chiếu các phần authentication trong IMPLEMENTATION_PROGRESS, TEST_RESULTS, FEATURE_ACCEPTANCE_MATRIX và ARCHITECTURE_UPDATED. Không xem wallet-only là đã hoàn thành email/password.

## 2. Phương án đề xuất cần xác nhận

Cho User Google tồn tại khi chưa có ví. Giữ các khóa wallet và dữ liệu nghiệp vụ cũ; không đổi tất cả CV/JD/Assignment sang User ID trong lần bổ sung này. Người chưa liên kết ví dùng trang hồ sơ/cài đặt và được thông báo cần liên kết ví trước nghiệp vụ phụ thuộc wallet. Đây là giới hạn sản phẩm phải hiển thị rõ, không tuyên bố Google-only dùng trọn hệ thống.

Không tạo ví ngẫu nhiên để lấp trường required, không tự đổi ví đã có, không tự gộp tài khoản trùng email. Đổi ví đã gắn với nghiệp vụ nằm ngoài phạm vi; nếu cần phải có kế hoạch chuyển quyền sở hữu riêng.

Phương án thay thế là chuyển toàn bộ khóa sở hữu sang User ID: ảnh hưởng lớn đến schema, API, audit và chứng nhận nên phải lập phạm vi riêng trước khi sửa.

## 3. Flow Google dự kiến

Sử dụng Google Identity Services, popup ID-token callback, không yêu cầu Google API access token hoặc Client Secret. Chỉ tải script chính thức khi người dùng chọn phương thức Google. Không One Tap tự đăng nhập hoặc tự tạo tài khoản khi render.

1. Người dùng chủ động chọn Google; Backend cấp challenge nonce dùng một lần, TTL ngắn, ràng buộc mục đích login/link và origin. Phiên link ràng buộc User hiện tại.
2. GIS khởi tạo với client ID công khai và nonce; Google trả ID token qua JavaScript callback. Không đưa token vào URL/log.
3. POST token và challenge về Backend. Thư viện chính thức xác minh chữ ký, issuer, audience, expiration; kiểm thêm nonce, email_verified, sub, azp khi có. Chỉ cho phép thuật toán/issuer hợp lệ của Google; không chỉ decode JWT.
4. Chỉ tiêu thụ challenge nguyên tử sau khi xác minh, chặn replay/race. Từ chối challenge sai mục đích hoặc sai phiên liên kết.
5. Tìm theo Google sub. Không có sub thì kiểm xung đột email; nếu email đã thuộc tài khoản khác, yêu cầu đăng nhập lại tài khoản đó rồi link, không tự merge.
6. Tài khoản mới mặc định student. Không tin role tùy ý từ Frontend; company phải theo chính sách đăng ký/phê duyệt đã xác định. Mentor/admin chỉ cấp qua quản trị.
7. JWT ứng dụng dùng User ID, RBAC đọc database, trả DTO loại bỏ identity/token nhạy cảm. Dashboard theo role thật; không tự ghi nghiệp vụ khi vào trang.

Flow popup ID token không phải authorization-code flow: không thêm code verifier/PKCE giả. Nonce/challenge chống replay và login CSRF phải kiểm thử riêng; bảo vệ origin không thay thế nonce.

## 4. Account linking

- Link Google: requireAuth + xác thực lại phương thức hiện có, challenge có User ID/mục đích; Google sub unique. Email trùng đơn thuần không đủ điều kiện.
- Link ví: requireAuth + challenge ký có User ID/mục đích/thời hạn; wallet unique; không dùng nonce login thông thường để link nhầm user.
- Link hoặc unlink phải audit bằng User ID, không ghi token/chữ ký/private key. Unlink phải xác thực lại, không xóa phương thức cuối cùng. Không cho unlink/đổi ví đang làm khóa nghiệp vụ trong phạm vi này.
- Tài khoản disabled bị từ chối ở mọi phương thức. Role lấy từ database, không token Google hay request.

## 5. Schema và index — không áp dụng trên database gốc/demo

Đề xuất trường Google subject, email đã xác minh của provider, tên/avatar đã validate, authProviders, trạng thái tài khoản. Email hồ sơ hiện cho sửa nên phải tách rõ với email xác minh của identity; không biến email hồ sơ thành bằng chứng Google.

`walletAddress` phải optional nếu chấp thuận Google-only. Unique index hiện không sparse/partial sẽ chặn nhiều user chưa có ví. Cần kế hoạch thay index: đọc dữ liệu/index trước, kiểm duplicate/null, tạo unique partial index phù hợp trên TEST, xác minh concurrent registration/link. Không tự syncIndexes/dropIndex trên database gốc/demo. Với runtime cũ, giữ nguyên và chỉ khởi động bản authentication mới trên TEST riêng.

Rollback không được xóa User Google để quay lại required wallet. Trước rollback phải vô hiệu tính năng đăng ký mới, giữ identity records, kiểm tài khoản không ví; nếu còn tài khoản không ví thì chưa được khôi phục ràng buộc cũ. Chỉ mô tả kế hoạch cho môi trường thật, chưa thực thi.

## 6. Nhóm file dự kiến

1. Verifier/challenge/authentication identity service mới, model challenge/identity và tests TEST riêng. Thêm `google-auth-library` pin phiên bản sau phê duyệt và kiểm lifecycle/engine.
2. User/middleware/auth routes, DTO, provider audit và linking. Giữ API wallet cũ; các thay đổi JWT/schema phải có regression trước khi khởi động runtime mới.
3. API client/AuthModal/App/AppShell và trang account settings. Thêm Google button chính thức, lỗi/hủy/loading/config BLOCKED. Email/password chưa hỗ trợ phải hiển thị rõ, không form thành công giả; nếu triển khai password phải có validation, hash, rate limit và tests riêng, không hiển thị quên mật khẩu nếu chưa có luồng khôi phục.
4. `.env.example` chỉ placeholder nếu cần, hướng dẫn Google Cloud, báo cáo test, cập nhật bốn tài liệu tiến độ/kiến trúc/nghiệm thu.

## 7. Kiểm thử và cấu hình thực tế

- Đầu tiên unit: validation claims, nonce/mục đích/replay, race/unique và policy roles. Mock verifier chỉ trong TEST phải ghi rõ, không cấu hình verifier giả bằng biến môi trường production.
- API integration: lần đầu/lần sau không duplicate, email collision, liên kết sai user/chiếm ví, token sai/hết hạn/sai aud/iss/email_verified, disabled, JWT hết hạn, RBAC bốn vai trò, unlink phương thức cuối, wallet regression.
- Database ghi chỉ URI TEST exact-allowlist theo `server/src/config/testDatabaseGuard.js`, database mới, không dropDatabase/seed/xóa dữ liệu cũ.
- UI/browser: config thiếu, hủy/timeout, dashboard, mobile/theme/labels, không auto-write; build/lint. Không gọi mock-verifier tests là Google E2E thật.
- **Google thật hiện chưa xác minh**: cần OAuth client ID Web application do chủ dự án tạo. Không cần gửi Google password/Client Secret vào chat.
- Origin localhost phải khớp scheme/host/port của môi trường auth mới; cập nhật CORS tương ứng. Hướng dẫn chính xác sau khi chốt cổng TEST. Popup callback không cần redirect URI; nếu đổi sang redirect flow phải cấu hình URI riêng.

Nguồn chính thức: [GIS button](https://developers.google.com/identity/gsi/web/guides/display-button), [verify Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [GIS JavaScript nonce](https://developers.google.com/identity/gsi/web/reference/js-reference), [OAuth client setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## 8. Trạng thái thực hiện

Người dùng đã phê duyệt thêm google-auth-library và phương án Google trước, liên kết ví trước nghiệp vụ hiện tại. Đã triển khai theo phương án đó, chỉ thay schema/index trong TEST mới, không `.env` thật hoặc dữ liệu gốc/demo. Các phần thiết kế trên ghi nhận lý do và phạm vi; kết quả thực tế và giới hạn ở [GOOGLE_AUTH_RESULT.md](GOOGLE_AUTH_RESULT.md).

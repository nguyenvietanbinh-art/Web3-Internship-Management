# Kết quả bổ sung Google Login / Sign-up

Ngày 01/11/2026 (+07). **Code và kiểm thử nội bộ đã hoàn thành; nghiệm thu Google thật còn BLOCKED vì chưa có Client ID.** Không tuyên bố đã đăng nhập Gmail thật. [Cấu hình và thao tác thử](GOOGLE_AUTH_SETUP.md).

## 1. Phạm vi đã triển khai

- GIS popup ID-token flow, xác minh phía server bằng `google-auth-library@11.3.2`. Node >=22; đã load thành công trên Node 22.23.4. Cài đúng dependency được duyệt, `--save-exact --ignore-scripts --engine-strict --no-audit --no-fund`; thêm 25 packages, có warning deprecated `node-domexception@1.0.0`. Không chạy npm audit fix hoặc nâng dependency có chủ đích khác.
- Verifier kiểm chữ ký Google bằng public certificates chính thức; giới hạn network 10 giây, tắt retry; kiểm issuer, audience, azp nếu có, thời hạn, iat, sub, email_verified và nonce. Không tin email Frontend, không chỉ decode JWT.
- Challenge ngẫu nhiên 256-bit, TTL 5 phút, hash ràng buộc cookie HttpOnly/SameSite Strict, origin CORS allowlist; mục đích và User ID riêng cho linking. Google token không ở URL/log/database; không lưu access/refresh token hoặc Google password. Popup chỉ tải SDK sau thao tác chủ động.
- Google lần đầu tạo **student**, User có `_id`, Google sub/email xác minh, hồ sơ Student và audit đăng ký; không tạo ví/mật khẩu giả. Đăng nhập lại dùng sub, không tạo duplicate. `authProviders` được suy ra từ identity thật thay vì giữ một mảng có thể lệch trạng thái.
- Tài khoản cũ giữ wallet/role/dữ liệu. Trùng email yêu cầu đăng nhập phương thức cũ rồi link; không tự merge. Company có quy trình đăng ký ví hiện có; Google mới không tự cấp company/mentor/admin. Company/mentor/admin đã được cấp hợp lệ giữ role khi link Google.
- Link Google vào tài khoản ví cần chữ ký đúng ví hiện tại và Google token fresh nonce. Link ví vào Google-only cần chữ ký ví mới + xác thực lại đúng Google sub. Unique indexes chặn chiếm Google/ví và race. Không đổi hoặc chuyển ví đã làm khóa sở hữu.
- Unlink Google cần cả hai bằng chứng và phải còn ví. Session Google cũ bị từ chối sau unlink; session hiện tại nhận JWT wallet. Không có endpoint hủy ví/đổi ví trong phạm vi này, không thể xóa phương thức cuối.
- JWT ứng dụng và RBAC hiện có được giữ: đọc role/disabled từ MongoDB, tương thích JWT ví cũ chưa có authProvider. JWT Google ràng buộc User ID/wallet hiện tại và provider vẫn còn liên kết.
- UI có lựa chọn đăng nhập/đăng ký, Google, MetaMask, loading/error/BLOCKED, form mật khẩu disabled với giải thích chưa hỗ trợ, hồ sơ và cài đặt linking/unlinking, tên/email/initial avatar, Light/Dark/mobile. Nút vào hệ thống mở chooser, không tự gọi MetaMask. Không tải ảnh avatar Google bên ngoài.
- Google-only chỉ vào hồ sơ/cài đặt; các API nghiệp vụ wallet bị chặn `WALLET_LINK_REQUIRED` trước truy vấn scope. Sau link ví, dùng nghiệp vụ và dashboard theo role cũ. Đây là giới hạn đã được người dùng phê duyệt, không phải toàn bộ nghiệp vụ đã chuyển sang User ID.

## 2. Endpoint mới

| Method/path, dưới `/api/auth` | Quyền và tác động |
| --- | --- |
| GET `/google/status` | Công khai, chỉ đọc; trạng thái và Client ID công khai khi bật, passwordEnabled=false. |
| GET `/identities` | JWT, chỉ đọc trạng thái provider của chính mình; không lộ Google subject/history. |
| POST `/google/challenge` | Tạo challenge có chủ đích; login công khai, link/unlink yêu cầu JWT. Chặn thiếu Origin/cấu hình/index. |
| POST `/google/login` | Xác minh Google, tiêu thụ challenge, tạo user/profile nếu mới hoặc audit login nếu cũ, cấp JWT. |
| POST `/google/link` | JWT + Google fresh proof + chữ ký ví cũ; update User và audit. |
| POST `/wallet/link` | JWT Google-only + Google fresh proof + chữ ký ví mới; update User, profile, audit, cấp JWT mới. |
| POST `/google/unlink` | JWT + Google fresh proof + chữ ký ví còn lại; bỏ liên kết Google, audit, cấp JWT wallet. |

`GET /auth/me` bổ sung googleLinked, emailVerified, authProvider; emailVerified chỉ đúng khi email hồ sơ còn khớp email Google đã xác minh. Hồ sơ email sửa được không trở thành Google identity. Các route ví cũ vẫn giữ đường dẫn/luồng.

## 3. Database và index

User: wallet optional nếu có Google sub; googleSubject/googleEmail select:false; identityHistory select:false ghi action/time, nằm trong chính User nên gắn với User ID. History nghiệp vụ hỗ trợ actorUserId khi chưa có wallet; history cũ giữ nguyên. Không lưu toàn bộ Google payload/avatar/token.

Khi `GOOGLE_AUTH_ENABLED=true`, schema TEST dùng unique partial string indexes cho walletAddress, googleSubject, googleEmail. Endpoint Google kiểm index trước khi ghi và từ chối khi còn unique wallet index cũ không partial. Startup chuẩn `src/index.js` cũng dùng verifyIndexes hiện có trước listen. Không auto syncIndexes hoặc chuyển index trên dữ liệu gốc/demo.

IdentityChallenge lưu nonce/browser hash/mục đích/user/wallet/message/hạn/usedAt; tiêu thụ bằng atomic conditional update. Challenge hết hạn không còn được chấp nhận, **chưa có job xóa/retention tự động**, tránh thêm thao tác xóa chưa được duyệt. Production cần chính sách retention/audit riêng.

**Kế hoạch migration cho môi trường thật, chưa thực thi:** backup/snapshot và kiểm user trùng/thiếu wallet; tạm khóa ghi authentication; lập thay index wallet unique cũ bằng partial unique đã kiểm; chuẩn bị Google unique indexes và collection; verifyIndexes rồi mới bật Google. Rollback phải ngừng đăng ký mới và giữ identity Google; không thể trở lại schema required-wallet khi vẫn còn Google-only users. Không xóa user để rollback. Cần phê duyệt riêng cho thao tác index trên database cũ.

## 4. Kết quả kiểm thử thật

Evidence máy chạy: [result.json](evidence/google-auth-20261101/result.json), [Backend log](evidence/google-auth-20261101/backend.txt), [Browser log](evidence/google-auth-20261101/browser.txt). Logs không chứa JWT, private key hoặc Google credential thật.

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Backend toàn bộ | **139/139 PASS**, 0 fail, 0 skip | Test ghi vào child DB mới, exact allowlist. Gồm regression 122 cũ + 16 Google integration + 1 official-library RSA fixture. |
| Google integration | **16 nhóm PASS** | Verifier claims được inject vào TEST app có URI guard; Mongo/JWT/nonce/RBAC/linking thật. Không phải token Google thật. |
| Official-library crypto | **PASS** | Chữ ký RSA thật với key tự sinh trong bộ nhớ TEST; kiểm sai key/aud/iss/hạn. Runtime verifier vẫn chỉ dùng certificates Google chính thức; không chấp nhận TEST certificate. |
| Browser | **7/7 PASS**, 0 exceptions, 0 blocked external requests | Chooser/register/BLOCKED, profile lưu Mongo, mobile375/desktop1440, Dark/Light, logout, bốn role ví login nonce/signature thật. Google-only UI dùng User/JWT fixture ghi rõ, không giả Google popup thành công. |
| Google thật | **BLOCKED** | Chưa có Client ID, chưa popup Gmail/Google token/live callback. Hủy popup Google thật, origin/project Cloud thật chưa nghiệm thu. |
| Frontend lint/build | **PASS** | Lint 0 error/0 warning; output Git-ignore `client/dist/google-auth-acceptance`. Entry 291.82 kB raw /88.30 kB gzip tại lần build cuối. |
| Dependency audit server production | **0 vulnerabilities** | Chỉ scope omit=dev server; không kết luận toàn bộ toolchain/client/contracts đã sạch. |
| Database safety | **PASS** | Ba DB gốc/demo so hash nội dung từng collection + counts + index definitions trước/sau. Chỉ đọc để kiểm tra; không migration/seed/drop/delete trên các DB này. |

Các negative tests gồm replay/race, browser cookie/Origin sai, issuer/aud/azp/exp/iat/sub/email_verified/nonce sai, token malformed unsigned qua production verifier, Google sub/wallet thuộc người khác, email collision, role escalation, disabled và JWT hết hạn, last-provider unlink, sai User ID challenge, index legacy. Tests profile/identity/status GET xác minh không tự ghi User.

Một lần browser kiểm cuối có 7/7 assertions PASS nhưng bị đánh FAIL vì hai request tài nguyên `/content/location/location.js` có origin null từ môi trường Edge. Không bỏ điều kiện kiểm soát request: đã giữ [result lần bị chặn](evidence/google-auth-20261101/browser-attempt-extension-blocked.json) và [log](evidence/google-auth-20261101/browser-attempt-extension-blocked.txt), sau đó cô lập Edge bằng `--disable-extensions` và `--disable-component-extensions-with-background-pages`. Retest 7/7, exceptions0, blocked0; source ứng dụng không bị sửa để che lỗi. [Browser result được chấp nhận](evidence/google-auth-20261101/browser-result.json). Log browser được chấp nhận là bản tổng hợp từ CDP result thật, không phải raw stdout.

## 5. File thay đổi trong lần bổ sung

Các file bên dưới là phạm vi Google auth, không phải toàn bộ dirty Git từ các PHASE trước:

- Server dependency: `server/package.json`, `server/package-lock.json`.
- Models/config: `server/src/models/User.js`, `IdentityChallenge.js`, `server/src/config/env.js`.
- Services: `server/src/services/authService.js`, `googleIdentity.js`, `accountProfiles.js`.
- API/auth/RBAC: `server/src/app.js`, `server/src/middleware/auth.js`, `server/src/routes/auth.routes.js`, `google.routes.js`, `server/src/core/accounts.js`, `server/src/core/shared.js`.
- Tests: `server/test/helpers.js`, `google-auth.test.js`, `google-crypto.test.js`, `client/test/google-auth.e2e.cjs`.
- UI: `client/src/App.jsx`, `client/src/api/client.js`, `client/src/components/AuthModal.jsx`, `GoogleIdentity.jsx`, `identity.css`, `AppShell.jsx`, `business/CoreBusinessView.jsx`, `business/ProfileCv.jsx`.
- Tools/config example: `scripts/demo/google-start.cjs`, `google-acceptance.cjs`, `server/.env.example` (placeholder, không `.env` thật). Có thêm bản cục bộ `server/.env.google.example`, bị ignore theo quy tắc `.env.*` sẵn có; bản example được đưa vào source là `server/.env.example`.
- Docs: kế hoạch/setup/result Google, bốn tài liệu triển khai/nghiệm thu/kiến trúc được cập nhật và evidence mới. Ảnh là screenshot trình duyệt thật của TEST UI, không ảnh sinh.

Không sửa AI, Solidity, migration dữ liệu hoặc nghiệp vụ ngoài bảo vệ tài khoản chưa có ví. Không xóa source thành viên khác. Git branch giữ `branch_1`; không commit/push/merge/reset/clean. Trạng thái Git đầy đủ được lưu cùng evidence; có nhiều thay đổi từ các PHASE trước.

## 6. Việc cần để nghiệm thu

1. Làm theo [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md), tạo Web Client ID và origins localhost, cung cấp Client ID công khai hoặc tự cấu hình terminal.
2. Khởi động lại đúng Backend Google TEST với cấu hình, giữ các runtime/data khác; chạy checklist Google thật lần đầu/lần sau/hủy/link/unlink và kiểm User ID.
3. Chỉ sau E2E thật mới đổi trạng thái Google thành PASS nghiệm thu. Không đổi ma trận 7 chức năng KLCN129 thành đạt toàn bộ do bổ sung auth.
4. Chưa triển khai email/password/reset password, company approval mới, chuyển toàn bộ nghiệp vụ sang User ID, production migration/HTTPS/session hardening. Những phần này không được báo hoàn thành.

Dừng sau phạm vi Google auth và chờ nghiệm thu; không tự deploy.

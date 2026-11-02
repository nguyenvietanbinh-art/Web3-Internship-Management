# Global UI Content Audit — Internova

Ngày02/11/2026 (+07). Chỉ sửa văn bản/lớp trình bày và layout cần thiết; không thay business rules, Backend/API, DB, authentication protocol, quyền, AI results hoặc blockchain transactions. Không commit/push/merge.

## 1. Inventory và cách đếm

Quét **45 tệp frontend trước sửa**,48 sau sửa, gồm JSX/JS/constants/config, CSS và HTML. Dùng parser AST OXC/Rolldown đã có trong dependency, không cài parser mới. Không parse lỗi. Không tính comments/test fixtures/API fields thành nội dung cần xóa; các branch/config có thể là candidate cần giữ chứ không phải UI luôn hiện.

- **1.179 vị trí chuỗi ứng viên trước sửa**,1.186 sau sửa. Đây là số occurrence theo AST, không số bản dịch duy nhất hoặc số chữ đang cùng hiện trên màn hình.
- **143 vị trí baseline được xử lý**, gồm7 REMOVE,30 SHORTEN,72 REWRITE,24 RELOCATE,10 CONDITIONAL.136 vị trí sửa/đổi cách hiển thị,7 bỏ khỏi luồng chính.1.036 KEEP.
- **149 bản ghi thay đổi** ở manifest: có cả đoạn JSX/layout/import/presentation helper và các nhóm dynamic labels. Không cộng149 với143, không coi mỗi patch là một chuỗi UI.
- Quét thêm **65 file Backend**,422 candidate error/message trả về. Không sửa Backend; frontend chỉ viết lại thông báo cấu hình/NLP theo code và giữ HTTP/code/validation. Dynamic nội dung người dùng, audit log, tên CV/JD/báo cáo không tự sửa hoặc xóa.
- Source occurrence sau sửa tăng vì giữ LegacyAuthModal sau cờ riêng và thêm labels/trợ giúp có điều kiện; không có nghĩa màn hình chính có nhiều ghi chú hơn.

| Phân loại baseline | Số vị trí |
| --- | --- |
| REMOVE | 7 |
| SHORTEN | 30 |
| REWRITE | 72 |
| RELOCATE | 24 |
| CONDITIONAL | 10 |
| KEEP | 1036 |

Inventory đầy đủ có file/line/kind/text/classification/reason: [classified-inventory.json](evidence/ui-content-20261102/classified-inventory.json). [Baseline](evidence/ui-content-20261102/baseline-inventory.json), [sau sửa](evidence/ui-content-20261102/final-inventory.json), [Backend messages](evidence/ui-content-20261102/backend-message-inventory.json), [manifest toàn bộ thay đổi](evidence/ui-content-20261102/changes.json).

## 2. Màn hình đã quét và kiểm trình duyệt

| Màn hình | Static | Browser ở TEST | Giới hạn |
| --- | --- | --- | --- |
| Welcome/login/register | Có | Production trước/sau; login6/đăng ký6/Google-wallet7 regression | Google thật chưa cấu hình nên nút không hiện |
| Dashboard | Có | Student/company/mentor/admin | Dữ liệu TEST thật theo DB, phần lớn empty state |
| Hồ sơ/cài đặt/ví | Có | Bốn role; email regression có lưu hồ sơ/đổi mật khẩu | Popup MetaMask thật không test |
| Tổng quan tài khoản/thông báo | Có | Bốn role, không auto-mark-read | Không duyệt mọi loại notification payload |
| CV | Có | Student thấy form; role khác không có menu | Không upload lại PDF/DOCX ở lượt text-only |
| JD/cơ hội | Có | Student/company | Không tạo lại đầy đủ JD/application ở lượt này |
| Ứng tuyển/ứng viên | Có | Student/company/admin | Empty/scoped state, không sửa dữ liệu gốc |
| Kỳ/phân công | Có | Bốn role | Chưa duyệt mọi modal với dữ liệu lớn |
| Công việc/nhật ký | Có | Bốn role | Labels/status chỉ dịch hiển thị, values giữ nguyên |
| Chấm công | Có | Bốn role | Không tạo giờ nghiệp vụ thật |
| Báo cáo/KPI/đánh giá | Có | Bốn role | Không đánh lại điểm hoặc tạo bản báo cáo để làm đẹp UI |
| AI matching/risk | Có | Bốn role truy cập trang/status | Không inference/model quality retest trong đợt này |
| Web3/QR/chứng nhận | Có | Bốn role truy cập trang/chưa cấu hình | Không mint/anchor/giao dịch; không camera/GPS phần cứng |
| Tài khoản/phân quyền | Có | Admin; menu không hiện cho role khác | Không cấp quyền thật |
| Legacy Auth/CV/JD/Attendance/Certificate | Có | Native wallet APIs vẫn regression; legacy UI opt-in không browser riêng | Source được giữ, không xóa hoặc giả có tính năng mới |

Trong production navigation:43 ảnh theo role (student12/company11/mentor9/admin11) và ảnh login/register/mobile khác. Screenshot qua browser thật, không ảnh tạo giả. Desktop các menu được cấp quyền; responsive1440/768/375 và Light/Dark kiểm trên Admin dashboard. Không tuyên bố mọi màn hình, mọi modal, mọi dữ liệu và mọi theme đều đã browser-test. Chỉ0 Runtime exceptions trong suites; chưa audit đầy đủ mọi console channel/screenreader/contrast.

## 3. Quyết định nội dung quan trọng

| Component/file | Loại | Trước | Sau | Lý do |
| --- | --- | --- | --- | --- |
| AuthModal.jsx | RELOCATE | Wallet role selector, native wallet login, demo presets in the main authentication modal | Preserved in LegacyAuthModal, opt-in DEV VITE_ENABLE_LEGACY_AUTH_UI only | Luồng chính email-first; không xóa API hoặc mã đăng nhập ví cũ. |
| EmailIdentity.jsx | REMOVE |   {register&&<label>Loại tài khoản được tự đăng ký<select aria-label="Loại tài khoản email" defaultValue="student"><option value="student">Sinh viên</option></select></label>} | Bỏ khỏi giao diện chính | Control chỉ có một lựa chọn, không gửi role; Backend vẫn chỉ cấp student. |
| EmailIdentity.jsx | REWRITE | <label>Mật khẩu Internova<input | <label>Mật khẩu<input | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| EmailIdentity.jsx | CONDITIONAL |   <p className="muted">Mật khẩu riêng của Internova: ít nhất 10 ký tự, tối đa 72 byte. Email chưa được xác minh; khôi phục mật khẩu qua email chưa khả dụng.</p> |   {register&&<small id="register-password-hint" className="muted">Ít nhất 10 ký tự. Tối đa 72 byte khi mã hóa.</small>} | Quy tắc chỉ ở đăng ký; giới hạn Backend/validation được giữ. Trạng thái email ở Cài đặt. |
| EmailIdentity.jsx | REWRITE | register?'Tạo tài khoản sinh viên':'Đăng nhập bằng email' | register?'Tạo tài khoản':'Đăng nhập' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| EmailIdentity.jsx | RELOCATE | <p>Email chưa xác minh. Chỉnh email hồ sơ không thay email đăng nhập.</p> | <details><summary>Thông tin bảo mật</summary><p>Email chưa được xác minh. Khôi phục mật khẩu qua email chưa khả dụng. Đổi email hồ sơ không đổi email đăng nhập.</p></details> | Giữ tình trạng thật, đưa vào Cài đặt thay vì Login. |
| EmailIdentity.jsx | CONDITIONAL |   <button className="btn btn-secondary" disabled={busy}>Đổi mật khẩu</button> |   <small className="muted">Mật khẩu mới cần ít nhất 10 ký tự, tối đa 72 byte khi mã hóa.</small><button className="btn btn-secondary" disabled={busy}>Đổi mật khẩu</button> | Hiển thị quy tắc ở đúng form đổi mật khẩu. |
| ProfileCv.jsx | SHORTEN | Đăng nhập bằng email/mật khẩu Internova hoặc phương thức đã liên kết. Đổi email hồ sơ không đổi email đăng nhập và không xác minh email. | Cập nhật thông tin cá nhân của bạn. | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| ProfileCv.jsx | RELOCATE | <Text label="Email" type="email" value={form.email} | <Text label="Email" type="email" hint="Email hồ sơ không thay đổi email đăng nhập và chưa được xác minh." value={form.email} | Giữ cảnh báo cạnh đúng trường thay vì giới thiệu dài. |
| Shared.jsx | REWRITE | title="Chưa có bản ghi phù hợp" | title="Không tìm thấy kết quả" | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Shared.jsx | REWRITE | placeholder="Tìm trong dữ liệu được phép…" | placeholder="Nhập từ khóa…" | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | WORKSPACE | KHÔNG GIAN LÀM VIỆC | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | Workspace <span>/</span> | Internova <span>/</span> | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REMOVE | Theo dõi dữ liệu thực tập trong phạm vi tài khoản của bạn. | Bỏ khỏi giao diện chính | Dashboard đã có tiêu đề và số liệu rõ. |
| AppShell.jsx | REWRITE | label:'AI matching & phân tích' | label:'Phân tích AI' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | label:'Task & nhật ký theo kỳ' | label:'Công việc & nhật ký' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | label:'Giờ làm theo kỳ' | label:'Chấm công' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | label:'CV đã lưu' | label:'CV của tôi' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| AppShell.jsx | REWRITE | companyLabel:'Quản lý JD' | companyLabel:'Tin tuyển dụng' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Work.jsx | SHORTEN | Dữ liệu có Assignment riêng; không trộn hoặc tự chuyển dữ liệu legacy. Lịch sử được lưu cùng mỗi thay đổi. | Theo dõi công việc và nhật ký thực tập. | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Work.jsx | REWRITE | Task theo kỳ | Công việc | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Work.jsx | REWRITE | Task theo phân công | Công việc được giao | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Work.jsx | REWRITE | Tạo task theo kỳ | Giao công việc | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |
| Work.jsx | REWRITE | title:'Task' | title:'Công việc' | Nội dung ngắn gọn, dễ hiểu; không đổi giá trị/API. |

Ngoài bảng: chuẩn hóa Task→Công việc, Deadline→Hạn hoàn thành, matching/ranking→Độ phù hợp/Xếp hạng, check-in/out→Vào ca/Kết thúc ca; trạng thái, ưu tiên, role và loại báo cáo có bảng nhãn tiếng Việt. `value`, API keys, state stored, audit records không đổi. Mã/CID/hash/địa chỉ hợp đồng/chứng nhận được giữ khi cần xác minh, không đổi dữ liệu thành nhãn giả.

AI: tên phương pháp thật giữ nguyên, cosine chỉ đổi nhãn hiển thị, không đổi phép tính. Chưa huấn luyện risk/uncalibrated/giới hạn coverage giữ, các giải thích dài đưa vào details. SBT chỉ hiển thị badge tiếng Việt khi cùng điều kiện `certificate.verified`; không dùng trạng thái DB để tự báo hợp lệ. Lỗi IPFS chưa upload vẫn rõ.

Nút đóng AuthModal từng bị lặp với Dialog; phát hiện bằng screenshot, sửa thành một nút với closeLabel, giữ Escape/focus trap/focus restoration. Không xóa chức năng đóng hay nhãn accessibility.

## 4. Login/register và tương thích

Login chính chỉ logo/tiêu đề, email/password, nút đăng nhập và đăng ký. Không role selector, không MetaMask bắt buộc, không đoạn giải thích quyền/nghiệp vụ, không forgot-password giả. Google chỉ hiện khi GET `/auth/google/status` báo enabled. Đây là GET đọc cấu hình, không tự đăng nhập, không tải GIS khi chưa chủ động chọn.

Register gồm tên/email/password/xác nhận; giới hạn mật khẩu chỉ tại đăng ký/đổi mật khẩu, được nối aria-describedby ở đăng ký. Bỏ select chỉ có một lựa chọn student; Backend vẫn chỉ cho tự đăng ký student. Không thêm khả năng tự cấp Admin/mentor/company.

Ví được liên kết tại Hồ sơ → Ví Web3, vẫn dùng reauth/challenge/chữ ký Backend hiện có. Cảnh báo ký thông điệp/không gửi giao dịch/phí gas chuyển về trợ giúp xác thực ví. Email chưa xác minh/reset chưa có được giữ ở Cài đặt, không lặp dưới Login.

**Tương thích cần biết:** mã Login ví-only cũ được giữ trong `LegacyAuthModal.jsx`, chỉ có thể mở bằng `VITE_ENABLE_LEGACY_AUTH_UI=true` trong development. Không đưa cờ này vào production. Tài khoản chỉ có ví, chưa có email/password/Google, cần luồng legacy opt-in; không tự gán email hoặc di chuyển dữ liệu. API nonce/signature vẫn có và đã regression. Đây là điều chỉnh điểm vào UI theo yêu cầu email-first, không đổi auth protocol hoặc User identity.

Diagnostics mặc định tắt kể cả development. Internal QA cần raw result/transaction-status (phase2/phase5 browser scripts) phải bật `VITE_SHOW_DIAGNOSTICS=true` ở dev server TEST riêng trước khi chạy; production luôn tắt. Các selector phase5 được cập nhật theo nhãn mới nhưng không chạy giao dịch phase5 trong lượt text-only. Hai nhãn mạng ví và cờ diagnostics được lint/build, DEV Google-wallet7/7 kiểm lại sau production6/6; không coi đó là test mint mới.

## 5. Nội dung KEEP và cần giữ khi mở rộng

- Nhãn input/aria-label, required/min/max, lỗi validation, loading/error/empty states.
- Phạm vi quyền, trạng thái dữ liệu, dữ liệu của người dùng; không đổi tên bản ghi TEST thành dữ liệu thật.
- Email chưa xác minh, giới hạn password, xác thực lại khi link/unlink, phương thức đăng nhập cuối cùng.
- AI model thực, chưa hiệu chuẩn/chưa có nhãn, risk chưa huấn luyện, cảnh báo không phải quyết định kỷ luật.
- Consent camera/vị trí, sai số/chống giả mạo GPS, TTL/replay trong API; không xóa cảnh báo bảo mật.
- IPFS mã hóa/chưa upload/chưa readback, chain thử nghiệm, phí/chữ ký, pending/failed và điều kiện verify/SBT.
- Audit logs và phần chi tiết kỹ thuật cần cho đối chiếu; không tự viết lại data backend/model.

Không phát hiện nội dung pháp lý bắt buộc cần xóa. Các cảnh báo có ý nghĩa bảo mật/nghiệp vụ được giữ ý nghĩa và chuyển đúng ngữ cảnh, không sửa business rules. Nội dung người dùng/audit/event codes không bị mass replace.

## 6. Test trước/sau

| Kiểm tra | Trước | Sau |
| --- | --- | --- |
| Production shell | 5/5 PASS; ảnh trước sửa | 6/6 PASS, thêm minimal auth, toàn bộ menu theo role, account/notifications, Tab/Escape/focus;0 Runtime exceptions |
| Email auth browser | Tham chiếu lượt full-project audit trước; baseline riêng chỉ shell | 6/6 PASS (register/profile/persistence/đăng nhập sai/đổi password) |
| Google/wallet browser | Tham chiếu audit trước, không OAuth live | 7/7 PASS; Google thiếu cấu hình không được gợi ý; ví-only APIs vẫn nonce/signature thật |
| Client unit | 7 safety tests đã có | 10/10 PASS (thêm3 wording/status-preservation tests) |
| Backend auth relevant | Tham chiếu audit trước165 toàn suite, không chạy lại baseline Backend riêng ở đây |40 PASS/0FAIL/1SKIP trong41test; skip on-chain anchor/mint vì text-only không giao dịch |
| Lint | Tham chiếu lượt trước |PASS0error/0warning |
| Build | Production baseline build PASS |PASS RAYON_NUM_THREADS=1, entry301.71kB raw/90.29kB gzip; no LegacyAuthModal production chunk |
| DB gốc/demo | Snapshot bảo toàn audit trước |3DB hash/count/index không đổi sau mọi test |

Không lặp lại full AI/Solidity/E2E on-chain vì không đổi các lớp đó và phạm vi cấm thay giao dịch. Không cài dependency mới; không sửa real.env. Unit/error-message mock chỉ test wording negative cases, không mock thành công nghiệp vụ/Google/AI/blockchain. Browser dùng app thật, Mongo TEST exact allowlist, mật khẩu synthetic và JWT thật.

Lượt production đầu sau sửa đã6/6; phát hiện layout double-close bằng xem ảnh rồi retest6/6. Sau7 chỉnh copy cuối, build/lint và production6/6 được chạy lại với thêm keyboard checks. Log các lượt được giữ, không thay bằng kết quả giả.

## 7. File thay đổi trong frontend

- `client/src/api/client.js`
- `client/src/api/errorMessages.js`
- `client/src/App.jsx`
- `client/src/components/AppShell.jsx`
- `client/src/components/AttendanceView.jsx`
- `client/src/components/AuthModal.jsx`
- `client/src/components/business/AiPage.jsx`
- `client/src/components/business/content.js`
- `client/src/components/business/Kpis.jsx`
- `client/src/components/business/NativeQrScanner.jsx`
- `client/src/components/business/Notifications.jsx`
- `client/src/components/business/Placements.jsx`
- `client/src/components/business/ProfileCv.jsx`
- `client/src/components/business/Recruitment.jsx`
- `client/src/components/business/Reports.jsx`
- `client/src/components/business/Shared.jsx`
- `client/src/components/business/Time.jsx`
- `client/src/components/business/Web3Page.jsx`
- `client/src/components/business/Work.jsx`
- `client/src/components/CvJdView.jsx`
- `client/src/components/EmailIdentity.jsx`
- `client/src/components/identity.css`
- `client/src/components/LegacyAuthModal.jsx`
- `client/src/components/MyWallet.jsx`
- `client/src/components/ui.jsx`
- `client/src/components/Web3CertificateView.jsx`

Tests liên quan: `client/test/ui-content.test.mjs` mới; cập nhật selector/wording trong email-auth/google-auth/unified và production-shell E2E. `unified.e2e.cjs` chỉ cập nhật nhãn, không chạy lại luồng chain trong lượt này. Docs: UI_CONTENT_AUDIT, IMPLEMENTATION_PROGRESS, TEST_RESULTS; evidence dưới docs/evidence/ui-content-20261102. Không gán toàn bộ Git dirty từ audit trước cho đợt này.

## 8. Hạn chế và bước tiếp

1. Inventory AST là candidate scan, không full symbolic dataflow. Chuỗi động từ dữ liệu người dùng/Backend có thể có wording ngoài catalog; giữ dữ liệu, không tự sửa.
2. Browser menu/empty states đã kiểm; các modal với dữ liệu lớn, lỗi hiếm, device permissions và live provider chưa kiểm hết.
3. Google live/Pinata/Atlas còn thiếu cấu hình; risk NOT_TRAINED và chất lượng model chưa có nhãn. Nội dung gọn không biến chức năng này thành PASS.
4. Legacy DEV-only còn copy cũ để bảo toàn luồng cũ; không thuộc Login production. Mã raw trong audit/chi tiết xác minh là dữ liệu đối chiếu cần giữ, không ghi chú hướng dẫn thừa.
5. Các findings production-readiness trước đây vẫn tồn tại; đợt text cleanup không nghiệm thu production toàn hệ thống.

Xem [bằng chứng và ảnh](evidence/ui-content-20261102/INDEX.md), [summary đếm được](evidence/ui-content-20261102/summary.json). Không commit/push/merge; giữ nguyên database và các service người dùng.

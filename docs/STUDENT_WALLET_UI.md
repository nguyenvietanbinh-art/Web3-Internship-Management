# Ví cá nhân chỉ dành cho sinh viên — 06/11/2026

Theo yêu cầu, Frontend chỉ hiển thị quản lý/liên kết ví cá nhân cho role student. Nhà trường, giảng viên và doanh nghiệp không thấy mục Ví Web3 của tôi, nút liên kết ví trong password/Google settings, trạng thái ví trong phần tài khoản trên header hoặc nút kiểm tra mạng ví ở Web3.

Giữ nguyên email/password, Google và API xác thực cũ; không unlink/xóa địa chỉ ví đã có, không thay RBAC/schema/database. Tài khoản legacy dùng ví vẫn được bảo toàn cơ chế xác thực. Đây là thay đổi trình bày, không phải cấm liên kết ví bằng API hoặc migration tài khoản.

Nhà trường vẫn có chức năng duyệt/cấp chứng nhận; doanh nghiệp vẫn có QR/bằng chứng theo quyền. Backend dùng attestor local như trước, không yêu cầu staff kết nối MetaMask. Sinh viên vẫn có ví nhận và xác minh chứng nhận. Các trạng thái chưa đủ điều kiện hoặc dịch vụ chưa sẵn sàng vẫn hiển thị đúng.

File: navigation.js (showPersonalWallet), MyWallet.jsx, GoogleIdentity.jsx, EmailIdentity.jsx, AppShell.jsx, business/Web3Page.jsx; test ui-content.test.mjs và production-shell.e2e.cjs.

Kiểm thử: client unit13/13 PASS; lint/build PASS (ignored dist/student-wallet-only). Browser production6/6 PASS, exceptions0: kiểm trực tiếp phần ví/nút liên kết còn ở student, không xuất hiện ở company/mentor/admin; role navigation và responsive/theme/no-auto-write regression. Dùng DB TEST mới `web3_internship_test_phase1_d12848f3_8d8a795ef818`; không ghi gốc/demo/manual. Không chạy lại Backend hoặc thực hiện giao dịch blockchain trong lượt sửa giao diện này.

Bằng chứng: [browser result](evidence/student-wallet-20261106/result.json). Không commit/push; nhấn Ctrl+F5 trên website đang chạy để nhận giao diện mới.

# Ẩn giao diện nghiệp vụ trước đăng nhập

Ngày 02/11/2026 (+07). Đã thực hiện yêu cầu: người chưa đăng nhập chỉ thấy trang chào Internova, chuyển Light/Dark và nút Đăng nhập / Đăng ký.

- Không render sidebar, menu nghiệp vụ, thông báo, vai trò workspace, nội dung dashboard hoặc trạng thái blockchain cho khách.
- Chờ khôi phục/xác minh session trước khi hiển thị workspace, tránh nháy menu khi tải lại.
- Không tự tải danh sách đề tài `/api/topics` cho khách. GET cấu hình capabilities/session vẫn dùng cho bootstrap.
- Đăng nhập thành công hiển thị workspace theo quyền hiện có; đăng xuất quay lại trang chào ngay. Tài khoản chưa có ví vẫn chỉ profile/settings theo phạm vi trước, không bỏ RBAC hoặc guard wallet.
- Bộ chọn student/company cho đăng ký ví mới chuyển vào dialog xác thực, giữ phương thức ví hiện có. Email registration vẫn do Backend cấp student.

File: `client/src/components/AppShell.jsx`, `auth-entry.css`, `AuthModal.jsx`, `client/src/App.jsx`, `client/test/email-auth.e2e.cjs`. Không sửa Backend/schema/database, không cài dependency hoặc tạo `.env`, không commit/push.

Kiểm thử mới: email browser **5/5 PASS**, Google/ví/bốn role browser regression **7/7 PASS**, 0 JavaScript exceptions và 0 external requests bị chặn. Guest được kiểm ở desktop1440/mobile375; không có aside/data-nav/mobile-menu/runtime-details hoặc request topics; mở form không ghi user/business data; logout không giữ menu. Browser ghi chỉ vào database TEST con mới qua exact allowlist. Frontend lint0error/0warning, buildPASS, output ignored `client/dist/guest-auth-acceptance`.

Backend147/147 của đợt email trước là **kết quả trước thay đổi giao diện**, không chạy lại trong lần này vì không sửa Backend. Các public endpoints Backend trước đây không bị thay chính sách; việc ẩn menu không được coi là thay thế API authentication/authorization.

Evidence thật ở `docs/evidence/guest-auth-20261102/`: JSON CDP và screenshot desktop/mobile không chỉnh sửa; không fake login success. Trang hiện tại: **http://localhost:5182/**. Nếu đang đăng nhập, bấm Đăng xuất để kiểm tra giao diện khách; dùng Ctrl+F5 nếu tab còn giao diện cũ. Không cần restart Backend hoặc thay dữ liệu để áp dụng thay đổi Frontend.

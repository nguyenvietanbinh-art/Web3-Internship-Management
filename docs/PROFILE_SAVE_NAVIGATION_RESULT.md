# Lưu hồ sơ và chuyển sang Tổng quan tài khoản

Ngày 02/11/2026 (+07). Kiểm tra source cho thấy nút Lưu trước đây PATCH dữ liệu và refresh hồ sơ nhưng không có đích chuyển trang hoặc thông báo thành công rõ ràng. Không kết luận tài khoản trong ảnh chưa lưu chỉ từ việc giao diện đứng yên.

Đã bổ sung:

- Chỉ sau PATCH thành công mới báo đã lưu. Khi chỉnh tiếp thông tin, thông báo thành công cũ được xóa.
- Refresh chính tài khoản qua `/auth/me`, kiểm token không bị đổi giữa chừng rồi chuyển tới **Tổng quan tài khoản**. Nếu không refresh được, báo rõ hồ sơ đã lưu nhưng chưa tải lại tài khoản; không giả chuyển thành công.
- Trang Tổng quan tài khoản hiển thị name/email/role/skills/bio của User hiện tại từ server, không KPI hoặc kết quả giả; có nút **Chỉnh sửa hồ sơ**.
- Tài khoản chưa có ví được vào hai trang account overview/profile; các API và trang nghiệp vụ wallet cũ vẫn giữ guard, không mở scope dữ liệu rỗng.
- Người chưa đăng nhập vẫn chỉ có trang chào, không sidebar/menu. Không sửa Backend, schema, role, ví hoặc dữ liệu gốc/demo.

File: `client/src/components/AccountOverview.jsx`, `AppShell.jsx`, `business/ProfileCv.jsx`, `client/src/App.jsx`, `client/test/email-auth.e2e.cjs`.

Kiểm thử mới: email browser **6/6 PASS**, Google/ví/bốn-role regression **7/7 PASS**; exceptions0/blocked0. Test lưu profile thật trên MongoDB TEST mới, kiểm name/skills/bio, chuyển overview sau lưu, quay lại form và reload giữ dữ liệu. Lint0error/0warning, buildPASS trong thư mục ignore `client/dist/profile-save-acceptance`. Backend147/147 là kết quả đợt email trước, không chạy lại vì lần này không sửa Backend. Không ghi tài khoản người dùng trong ảnh để làm test.

Evidence thật ở `docs/evidence/profile-save-20261102/`, gồm CDP JSON và screenshot sau redirect. Không deploy/commit/push.

Cách thử: mở http://localhost:5182/, Ctrl+F5 nếu đang dùng tab cũ; vào Hồ sơ cá nhân, sửa dữ liệu rồi **Lưu hồ sơ**. Sau khi lưu thành công trang chuyển sang Tổng quan tài khoản. Tải lại trình duyệt hiện vẫn theo hành vi restore mặc định về hồ sơ đối với tài khoản chưa có ví; dữ liệu đã lưu được bảo toàn, không phải form chưa lưu. Có thể chọn Tổng quan tài khoản trong sidebar để xem lại. Không tuyên bố đã mở toàn bộ nghiệp vụ không cần ví.

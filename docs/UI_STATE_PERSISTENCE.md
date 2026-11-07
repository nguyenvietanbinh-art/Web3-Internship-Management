# Giữ trạng thái giao diện — 07/11/2026

## Phạm vi thực hiện

`client/src/components/viewStateStore.js` quản lý metadata theo phiên với khóa `internova:view:v1:<User ID>:<vai trò>:<màn hình>:<trường>`. `viewState.jsx` cung cấp context cho các màn hình; `App.jsx` dùng điều hướng `?view=...`; `AppShell.jsx` kiểm màn hình có thuộc menu của vai trò hay không. Không thay cơ chế xác thực hiện có.

Đã áp dụng cho kỳ và bộ lọc cơ hội của sinh viên; kỳ/trạng thái/tìm kiếm/trang của Admin; hộp thư ứng tuyển; trang doanh nghiệp; trang/từ khóa mẫu đề tài; kỳ và tab công việc; nhóm tổng giờ; loại/trạng thái/kỳ và bảng báo cáo; tham số gợi ý/phân tích; sinh viên/phân công đã chọn trong picker dùng chung.

Vùng `details` trong nội dung chính được giữ theo nhãn và ID dòng. Không khôi phục modal xác nhận hoặc các vùng trong modal. Kết quả phân tích chỉ giữ **trong bộ nhớ** của tài khoản đang đăng nhập khi đổi chức năng; reload cần phân tích lại bằng nút chủ động. Dữ liệu có thể đã thay đổi sau lần phân tích trước, nên phải bấm lại để lấy kết quả mới trước khi quyết định nghiệp vụ.

## An toàn và hành vi

- sessionStorage chỉ nhận chuỗi ngắn, số hữu hạn và boolean của những trường được gọi rõ trong source. Không thêm lưu mật khẩu, chữ ký, QR, file, nội dung CV/báo cáo hoặc draft nhạy cảm vào storage.
- Đăng xuất/đổi tài khoản hoặc vai trò xóa metadata của phiên trước; provider đổi key theo User ID nên dữ liệu phân tích trong bộ nhớ cũng mất. Marker owner xử lý cả tình huống đổi tài khoản rồi reload.
- Back/Forward đọc `view`; menu kiểm quyền, API vẫn kiểm quyền độc lập. Địa chỉ không được phép được đưa về Tổng quan.
- Picker chỉ phục hồi ID sau khi tải lại danh sách được phép từ API. ID không còn hợp lệ được xóa và hiện lời nhắc. Kỳ của sinh viên không còn trong phạm vi cũng được yêu cầu chọn lại.
- Đổi tìm kiếm/lọc đưa về trang đầu; bảng dùng chung và danh sách cơ hội tự giảm trang khi kết quả giảm.
- Form có textarea/mật khẩu/file giữ draft trong bộ nhớ màn hình. Khi chưa lưu, chuyển chức năng/Back hoặc đóng modal qua cơ chế Dialog hỏi trước khi bỏ draft; reload/đóng trình duyệt dùng beforeunload. Không autosave. Các trường chọn thuần túy của công cụ tra cứu không bị coi là bài nộp cần lưu.
- Không tự gửi lại POST/PATCH khi quay về màn hình hoặc khôi phục vùng mở. Modal, QR đang chạy, camera và thao tác giao dịch không được khôi phục tự động.

## Kiểm thử

`client/test/role-workflow-browser.cjs`: tìm kiếm theo kỳ → đổi trang → quay lại → Back/Forward → reload; đăng xuất/đổi tài khoản; giữ kết quả phân tích và vùng giải thích mà không gọi inference lại; bốn vai trò, mobile 390px/desktop 1440px, Light/Dark, theo dõi request ghi và runtime exceptions. Xem kết quả cuối trong `docs/ROLE_WORKFLOW_COMPLETION.md`.

Không giữ mọi form chưa lưu sau khi người dùng xác nhận rời trang. Không dùng toàn bộ component đang ẩn để giữ state vì sẽ duy trì request/subscription và draft nhạy cảm không cần thiết. Trạng thái không phải quyền truy cập; dữ liệu bị thu hồi vẫn phải bị API từ chối.

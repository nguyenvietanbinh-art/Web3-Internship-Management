# Sửa ô tìm đề tài và lọc kỹ năng mất con trỏ

Ngày07/11/2026. Trong `client/src/components/business/workflow/MyInternship.jsx`, toolbar trước đây nằm trong `Resource` của danh sách cơ hội. Mỗi ký tự thay URL truy vấn; khi loading, Resource thay toàn bộ children bằng skeleton, gỡ ô input khỏi DOM và làm mất focus. Cả hai ô chỉ nhập thuận lợi ký tự đầu tiên. Test cũ điền cả chuỗi bằng một sự kiện nên không phát hiện lỗi gõ liên tục.

Đã chuyển ô tìm kiếm, lọc kỹ năng, doanh nghiệp và nút xóa lọc ra ngoài Resource. Chỉ bảng kết quả/phân trang bị thay khi loading hoặc lỗi. Giữ API tìm kiếm, phân quyền, state theo tài khoản và quy tắc ứng tuyển hiện có; không sửa Backend hoặc database.

`client/test/opportunity-search-browser.cjs` dùng `Input.insertText` gõ từng ký tự, đợi request giữa các phím và kiểm focus/value sau mỗi phím. Trước sửa:2 FAIL vì mất focus; sau sửa:3/3 PASS gồm gõ tìm kiếm, gõ kỹ năng, xóa lọc. Kiểm kết quả thật từ API, không có POST/PATCH/DELETE nghiệp vụ và không có runtime exception. Chỉ chạy trên localhost5189/database TEST.

Bằng chứng local: `contracts/node_modules/.cache/role-workflow-qa-20261107/opportunity-typing-1794017387976/results.json` và ảnh cùng thư mục. Lint0error/0warning, buildPASS. Source mới được Vite nạp cho cả5188 và5189; Ctrl+F5 nếu trình duyệt còn giao diện cũ. Không commit/push.

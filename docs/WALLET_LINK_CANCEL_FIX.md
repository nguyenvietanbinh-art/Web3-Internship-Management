# Dừng liên kết ví khi MetaMask đang chờ — 07/11/2026

Nguyên nhân: modal khóa nút Hủy và từ chối đóng khi `busy`; request kết nối/ký của tiện ích có thể chờ vô hạn nên người dùng bị kẹt.

Đã sửa `client/src/components/PasswordWalletLink.jsx`:

- Nút **Dừng liên kết**, X, Escape và đóng ngoài modal hoạt động cả lúc đang chờ.
- Mỗi lần liên kết có mã thao tác và AbortController riêng. Hủy dừng request xác thực/challenge phía trình duyệt và xóa mật khẩu, loading, lỗi cũ.
- Kiểm tra trạng thái hủy sau từng bước bất đồng bộ; kết nối/chữ ký về muộn không được tiếp tục xin nonce hoặc gọi API lưu ví. Kết quả cũ không thay trạng thái lượt mới.
- Khi component bị tháo hoặc tài khoản thay đổi, không để kết quả cũ ghi token cho tài khoản khác.
- Trình duyệt không có cơ chế chung để ép tiện ích MetaMask đóng yêu cầu. Web nhắc mở tiện ích và hủy yêu cầu pending trước khi thử lại; không giả đã hủy popup ví.
- Nếu người dùng đã ký và API lưu **đã được gửi**, hủy giao diện không thể bảo đảm rollback tác vụ server. Web thông báo yêu cầu đã gửi, giữ phản hồi để đồng bộ trạng thái thật khi cùng phiên tài khoản, không báo sai rằng ví chắc chắn chưa liên kết. Không tự gỡ ví đã lưu.

## Kiểm thử

`client/test/wallet-link-modal-browser.cjs`: **11/11 PASS**,0 runtime exception, gồm:

- Giữ kết nối ví pending → nhấn Dừng → trả kết nối muộn: không phát sinh challenge từ lượt đã hủy.
- Giữ ký pending → Escape → trả chữ ký thật muộn: không gọi link-wallet và API me vẫn không có ví.
- Mở lại modal sạch mật khẩu, rồi liên kết thành công qua API thật và đăng nhập lại đúng trạng thái.
- Form/modal, lỗi mật khẩu/thiếu MetaMask/từ chối và quyền4 vai trò giữ đúng.

Hồi quy dùng tài khoản TEST mới và adapter EIP-1193 ký thật bằng khóa ngẫu nhiên, không dùng ví/tài sản thật hoặc giao dịch. Lượt đầu assertion kiểm `null` trong khi DTO bỏ trống walletAddress; đã sửa để kiểm không có địa chỉ, chạy lại đầy đủ11/11. Không bỏ kiểm tra API hoặc sửa dữ liệu để làm PASS.

Lint0error/0warning, build PASS, diff whitespace PASS. Không sửa Backend/schema, CV/JD, quy trình tuyển dụng hoặc database nghiệp vụ. Không commit/push. MetaMask extension thật và lỗi mạng ở thời điểm server đã nhận lệnh lưu chưa được tái hiện trực tiếp; không tuyên bố rollback request đã gửi.

Bằng chứng: `contracts/node_modules/.cache/student-workflow-20261107/wallet-modal-1794025727793/results.json`; log `wallet-cancel-browser-final.log` và build `wallet-cancel-build.log`. [Kết quả được lưu trong tài liệu](evidence/wallet-link-modal-20261107/cancel-results.json).

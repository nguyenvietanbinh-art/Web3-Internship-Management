# Form đề tài và bảo mật tài khoản — 07/11/2026

## Thay đổi giao diện

Trang sinh viên chỉ còn một card **Tìm đề tài phù hợp với CV**. Desktop: kỳ thực tập rộng nhất → phương pháp đối chiếu → số đề tài rộng 110px → nút tìm. Tablet chia hai hàng, mobile xếp dọc. Trạng thái công cụ ở cuối form, kết quả ở card phía dưới.

Giữ ba phương pháp và các mã API hiện có. Số đề tài mặc định 5, chỉ nhận số nguyên 1–20. Kỳ lấy từ API kỳ được cấp cho tài khoản. Đổi lựa chọn xóa kết quả cũ; chuyển tab giữ lựa chọn. Form hỗ trợ Enter, khóa trường/nút khi gửi và dùng ref chống gửi trùng. Nếu rời trang trong khi chờ thì không đưa kết quả trả về muộn vào form mới. Các lỗi thiếu CV, lỗi API, công cụ chưa sẵn sàng, chưa có kỳ hoặc đã nhận đề tài vẫn được hiển thị.

Hồ sơ có khu vực **Bảo mật tài khoản** với hai card Ví Web3 và Mật khẩu, icon cùng thư viện hiện có, nút cao tối thiểu 44px và thẳng hàng. Mobile xếp dọc; Light/Dark dùng token hiện hành. Admin/Giảng viên chỉ có card mật khẩu, không hiển thị ví.

Ví chưa liên kết có nút mở modal xác nhận mật khẩu. Giữ reauth → connect → nonce → ký → lưu hiện có và Dừng liên kết/bỏ qua kết quả muộn; thêm hiển thị địa chỉ rút gọn và sao chép khi liên kết. Không thêm API gỡ ví mới; chức năng gỡ đã có được giữ trong chi tiết. Tài khoản Google chưa có mật khẩu giữ luồng xác minh Google hiện hữu. Không cung cấp luồng đặt mật khẩu mới khi Backend chưa hỗ trợ; card giải thích liên hệ quản trị viên.

Đổi mật khẩu mở modal với ba ô có nút hiện/ẩn riêng; kiểm tra xác nhận và 8 ký tự/72 byte UTF-8. Giữ API trả token mới và vô hiệu hóa phiên cũ. Khi request đã gửi, Hủy/Esc không đóng modal; trạng thái yêu cầu chờ xác nhận. Đóng an toàn sẽ hủy component chứa mật khẩu, không lưu mật khẩu vào storage hay URL. Dialog hiện có giữ focus/khôi phục focus, không thay bằng cơ chế mới.

## File sửa

- `client/src/components/business/AiPage.jsx`: chỉ nhánh sinh viên school workflow dùng form mới; nhánh giảng viên được giữ.
- `client/src/components/business/StudentMatchingForm.jsx`: form gộp, validation, request state.
- `client/src/business.css`: layout form theo breakpoint, ô số 110px.
- `client/src/components/GoogleIdentity.jsx`: bố cục và điều kiện theo vai trò.
- `client/src/components/MyWallet.jsx`: card ví, trạng thái và sao chép.
- `client/src/components/PasswordWalletLink.jsx`: nhãn từng bước, dọn mật khẩu/visibility khi kết thúc lượt.
- `client/src/components/PasswordSettings.jsx`: card và modal đổi mật khẩu; `EmailIdentity.jsx` re-export component này, giữ nguyên đăng nhập/đăng ký.
- `client/src/components/identity.css`: card bảo mật và ô mật khẩu.
- `client/test/matching-security-ui-browser.cjs`: kiểm thử giao diện/API thật trên QA.
- `client/test/wallet-link-modal-browser.cjs`: cập nhật selector trạng thái/heading theo thiết kế mới, giữ nguyên kiểm tra xác thực.

## Kết quả thực tế

| Phạm vi | Trạng thái |
| --- | --- |
| Frontend lint/build cuối | PASS, không lỗi/warning |
| Form gộp, kỳ được cấp, responsive 1440/900/390 | PASS |
| Giữ lựa chọn, đổi input không tự gọi phân tích | PASS |
| Enter, payload enrollmentId/engine/topK, chặn gửi trùng | PASS |
| TF-IDF/Sentence-BERT/so sánh chạy API thật trên cùng tài khoản QA | PASS |
| Card bảo mật, Light/Dark, desktop/mobile | PASS |
| Modal mật khẩu, hiện/ẩn, Hủy/Esc, focus trả về, mismatch không gọi API | PASS |
| Sai mật khẩu bị từ chối; đổi đúng qua API, token cũ 401; không lưu password vào storage | PASS |
| Modal không đóng khi request đổi mật khẩu đang gửi | PASS |
| Regression ví: sai mật khẩu, thiếu MetaMask, từ chối connect/ký, cancel và late result | PASS |
| Chữ ký thật bằng khóa test, liên kết và đăng nhập lại; quyền company/mentor/admin | PASS |
| Giảng viên mở bài đã nộp/bài mẫu và phân tích ngữ nghĩa thật, không lưu điểm | PASS |
| Tiện ích MetaMask thật do người dùng thao tác, clipboard trong mọi trình duyệt, Google popup thật | NOT TESTED trong lượt này |

Tổng **21 browser checks PASS**: suite mới 7, ví 11, giảng viên 3; không runtime exception. Ví sử dụng provider thử và chữ ký mật mã thật từ khóa test ngẫu nhiên qua API thật; không gọi đó là kiểm thử tiện ích MetaMask thật. Chặn request tạm trong harness để kiểm busy/cancel, sau đó tiếp tục gửi request thật; không giả lập response thành công.

Lần đầu suite mới có một bước kiểm thử thất bại vì tìm nút đổi mật khẩu ngay sau khi callback xác thực đã điều hướng về tổng quan. Đã sửa harness quay về hồ sơ theo hành vi xác thực hiện có; chạy lại toàn suite PASS, không sửa Backend để làm test qua.

## Dữ liệu và Git

Toàn bộ browser test kết nối `localhost:5189` → `localhost:57419` → database `internova_role_qa_20261107`, kiểm marker và replica set trước tạo fixture. Chỉ tạo tài khoản TEST mới cho đổi mật khẩu/liên kết ví; không dùng tài khoản người dùng đang thao tác. Fixture được giữ, không dropDatabase hoặc dọn dữ liệu. Tài khoản tham chiếu QA chỉ dùng đăng nhập và đối chiếu đọc dữ liệu; đăng nhập ghi audit theo cơ chế hiện hữu.

Không thay API, Backend, schema, thuật toán, CV/JD, dữ liệu database gốc/demo hay quy trình tuyển dụng. Không cài dependency, commit/push/merge. Các thay đổi chưa commit từ nhiệm vụ trước được giữ. `git diff --check` cho các file sửa PASS; có thông báo LF/CRLF hiện hữu của Git.

## Ảnh và bằng chứng

- [Form desktop](evidence/matching-security-ui-20261107/matching-1440.png), [tablet](evidence/matching-security-ui-20261107/matching-900.png), [mobile](evidence/matching-security-ui-20261107/matching-390.png).
- [Bảo mật Light](evidence/matching-security-ui-20261107/security-1440-light.png), [Dark](evidence/matching-security-ui-20261107/security-1440-dark.png), [mobile Light](evidence/matching-security-ui-20261107/security-390-light.png), [mobile Dark](evidence/matching-security-ui-20261107/security-390-dark.png).
- [Suite giao diện](evidence/matching-security-ui-20261107/results.json), [regression ví](evidence/matching-security-ui-20261107/wallet-regression.json), [giảng viên](evidence/matching-security-ui-20261107/mentor-regression.json).

## Cách nghiệm thu

Tải lại **http://localhost:5188**. Sinh viên mở **Đề tài phù hợp**, chọn kỳ/phương pháp/số lượng rồi nhấn tìm; thử đổi tab và quay lại. Mở **Hồ sơ cá nhân** để xem hai card bảo mật. Chỉ liên kết ví hoặc đổi mật khẩu trên tài khoản của bạn khi chủ động xác nhận; thao tác đó thực sự thay đổi tài khoản.

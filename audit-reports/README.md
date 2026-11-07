# Đánh giá Web3-Internship-Management

Ngày đánh giá: **30/10/2026**, múi giờ Asia/Bangkok. Branch: **branch_1**. Commit: `d11a1852c5f03963bbe260425a246b0e65fe1091`.

## Kết luận

Đồ án đã có khung MERN, API nghiệp vụ KPI, xác thực chữ ký ví/JWT, service AI TF-IDF, Pinata client và mã tích hợp ethers. **Chưa đủ bằng chứng để xác nhận chạy demo hoàn chỉnh hoặc đáp ứng đầy đủ yêu cầu Web3/BERT/NFT/SBT.** Có lỗi làm sai kết quả demo: chứng nhận mẫu được gắn nhãn xác minh thật, QR chưa được xác thực, dữ liệu MongoDB và blockchain có thể lệch nhau, chức năng ứng tuyển chỉ hiện thông báo.

| Báo cáo | Nội dung |
| --- | --- |
| [01-assessment.md](01-assessment.md) | Git, phạm vi, đánh giá từng thành phần và tương thích |
| [02-findings.md](02-findings.md) | Lỗi, file/điểm mã liên quan, tác động và hướng sửa |
| [03-requirements.md](03-requirements.md) | Đối chiếu đề cương Word và tài liệu use case |
| [04-repair-plan.md](04-repair-plan.md) | Thứ tự sửa, phụ thuộc, tiêu chí nghiệm thu và kịch bản demo |
| [05-verification.md](05-verification.md) | Kiểm tra thực sự đã chạy và các giới hạn |

## Phần đã có và phần còn thiếu

- **Đã có trong source, chưa xác nhận E2E:** nonce/chữ ký/JWT; quyền sở hữu của phần lớn API đề tài; tạo đề tài/KPI tổng 100%; phân công; nộp, chấm, hoàn tất; schema và dữ liệu mẫu; dashboard, JD, task, điểm danh, nhật ký; Pinata và các hàm giao dịch ethers.
- **Đã chạy kiểm tra riêng:** AST Python và 12 kiểm tra AI trực tiếp/TestClient trong bộ nhớ, với TF-IDF. Kiểm tra có thể chạy thành công nhưng vẫn phát hiện điểm gợi ý tối thiểu 50 cho báo cáo rỗng/lạc đề. Không coi đây là kiểm định độ chính xác AI.
- **Còn thiếu hoặc chưa tích hợp đúng:** NFT/SBT thật; xác minh chứng nhận từ chain; QR thật và vị trí/thời gian; quản lý giờ làm; ứng tuyển/xét duyệt; BERT và benchmark; cảnh báo rủi ro/notification; quản trị nhà trường; kiểm thử triển khai và luồng xuyên hệ thống.

## Ưu tiên cho demo

1. Chuẩn bị runtime/dependency theo quy trình được cho phép; bổ sung cấu hình JWT, MongoDB, Pinata và sửa cấu hình Hardhat sau khi xác minh bằng runtime.
2. Loại bỏ chứng nhận/điểm AI/sự kiện mẫu bị trình bày như dữ liệu đã xác minh; khóa đường ghi giao dịch giả và đăng nhập demo ngoài môi trường demo riêng.
3. Hoàn thiện phân quyền task/nhật ký, QR và liên kết công ty–sinh viên.
4. Đồng bộ DB–chain có trạng thái pending/failed/confirmed, sửa listener và kiểm thử mất mạng/hủy ký.
5. Bổ sung các chức năng thiếu theo đề cương; chạy kịch bản nghiệm thu trong môi trường riêng.

Trong đợt đánh giá này chỉ tạo file Markdown dưới `audit-reports`; không sửa source, không cài dependency, không chạy seed, không thay đổi database, không xóa untracked, không commit/push/merge. Đã tránh khởi động backend và mở UI vì một số GET tự ghi dữ liệu và listener cũng ghi database.

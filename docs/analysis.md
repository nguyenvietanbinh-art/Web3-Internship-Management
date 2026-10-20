# Phân tích đề tài và đối chiếu project

## Mục tiêu

Đề tài yêu cầu nền tảng quản lý thực tập có phân vai công ty/sinh viên, giao đề tài minh bạch theo KPI, nộp và đánh giá minh chứng, phân tích độ phù hợp bằng NLP, lưu bằng chứng phi tập trung và cung cấp dashboard. MERN là kiến trúc chính; smart contract/IPFS và AI là các phần tích hợp cần chứng minh được bằng cấu hình và giao dịch thật.

## Hiện trạng phát hiện

| Hạng mục | Trạng thái trong mã nguồn | Khoảng cách chính |
| --- | --- | --- |
| React dashboard | Có danh sách đề tài, trạng thái KPI và các form thao tác | Dữ liệu ban đầu là demo; các luồng ghi trước đây chỉ cập nhật state trình duyệt |
| Express/MongoDB | Có model và REST routes | Tạo đề tài bỏ KPI; chấm và hoàn thành thiếu điều kiện nghiệp vụ |
| AI/NLP | FastAPI có so khớp và phân tích báo cáo | Sentence-BERT chưa được bật; mặc định TF-IDF. Kết quả AI không nên thay quyết định mentor |
| IPFS | Có Pinata client | Không cấu hình Pinata thì trước đây tạo chuỗi giả giống CID |
| Solidity | Có state machine cho đề tài/KPI/chứng nhận | Frontend/backend chưa gọi contract; không thể tuyên bố dữ liệu hiện tại là on-chain |
| Xác thực và phân quyền | Có đăng nhập theo ví trong API | Các route nghiệp vụ chưa xác minh chữ ký/token và quyền chủ đề; cần làm trước triển khai production |
| Triển khai | Có cấu hình Netlify và hướng dẫn môi trường | Chưa có bằng chứng triển khai backend, MongoDB Atlas, AI service hoặc contract testnet |

## Thay đổi trong lần chỉnh sửa

- Frontend gọi API cho tạo đề tài, nộp KPI, đánh giá và hoàn tất; lỗi API được báo thay vì giả lập thành công.
- Backend lưu KPI gửi kèm đề tài và kiểm tra tổng trọng số, trạng thái đề tài, địa chỉ ví, nội dung báo cáo, trạng thái KPI, điểm 0–100 và điều kiện cấp chứng nhận.
- Hợp đồng từ chối tổng trọng số KPI vượt 100% và ngăn cấp chứng nhận lặp.
- Mã lưu trữ dự phòng được đánh dấu `local-...`, không giả dạng IPFS CID; kết quả AI dự phòng cho biết rõ đó chỉ là đối chiếu từ khóa.
- Dashboard không tự nhận đã xác minh on-chain hoặc đã chống gian lận khi chưa tích hợp giao dịch thật.

## Để đáp ứng đầy đủ đề tài

1. Thêm xác thực bằng chữ ký ví, session/token, và kiểm tra vai trò cùng quyền sở hữu đề tài trên mọi route ghi.
2. Triển khai contract lên testnet, lưu địa chỉ contract/chain ID/ABI, tích hợp frontend bằng ethers và đồng bộ transaction/event vào backend.
3. Cấu hình Pinata, chỉ lưu CID đã upload thật; quy định nội dung nhạy cảm nào không được đưa lên IPFS công khai.
4. Hoàn thiện hồ sơ sinh viên và gọi endpoint AI matching thực từ dashboard; ghi rõ engine và giải thích kỹ năng khớp/thiếu.
5. Chọn model đa ngôn ngữ phù hợp, đánh giá trên bộ dữ liệu báo cáo có gán nhãn, đo precision/recall và ghi hạn chế của điểm AI.
6. Bổ sung log kiểm toán, chống gửi lặp, phân trang/tìm kiếm và kiểm thử API/contract; sau đó triển khai MongoDB Atlas, API, AI service và frontend.

Blockchain bảo đảm dấu vết giao dịch và trạng thái đã ghi, không tự bảo đảm nội dung báo cáo đúng hoặc chống gian lận ngoài chuỗi. IPFS cũng cần pinning để đảm bảo khả dụng lâu dài.

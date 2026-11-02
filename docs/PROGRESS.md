# Tiến độ dự án: Thiết kế hệ thống Web3 hỗ trợ thực tập sinh

## 1. Hoàn thành

### 1.1. Kiểm tra cấu trúc repo
- Repo hiện tại chưa có mã nguồn ứng dụng, chỉ có:
  - README.md
  - thư mục "Thư mục mới" chứa tài liệu gốc và sơ đồ
  - file nén ZIP tương ứng
- Không có thay đổi hoặc ghi đè nào lên file gốc.

### 1.2. Khảo sát tài liệu gốc
- Đã xác định được hai file Word quan trọng:
  - KLCN129_Trần-Việt-Hùng.docx
  - Tuần-3_-sơ-đồ-123.docx
- Các file H2D trong thư mục tài liệu không đọc được thành văn bản có nghĩa, nên không được dùng làm căn cứ nghiệp vụ.

### 1.3. Xác định phạm vi và mục tiêu đề tài
- Đề tài chính là: "Thiết kế hệ thống Web3 hỗ trợ thực tập sinh".
- Mục tiêu chính đã được xác định rõ từ tài liệu gốc:
  - tối ưu hóa quản lý thực tập
  - hỗ trợ nhà trường và doanh nghiệp
  - so khớp CV/JD bằng AI
  - minh bạch hóa quá trình thực tập bằng Web3
  - cấp chứng nhận thực tập trên blockchain

### 1.4. Xác định yêu cầu chức năng cốt lõi
- Quản lý hồ sơ thực tập: CV, JD, điểm số, hồ sơ sinh viên
- Gợi ý vị trí thực tập dựa trên AI matching CV-JD
- Check-in hàng ngày bằng QR code
- Quản lý task và giờ làm việc
- Nộp báo cáo tuần/cuối kỳ
- Lưu báo cáo bằng IPFS
- AI đánh giá tiến độ, cảnh báo chậm tiến độ
- Chấm điểm doanh nghiệp và giảng viên
- Cấp chứng nhận on-chain dạng NFT/SBT

### 1.5. Xác định vai trò nghiệp vụ
- Sinh viên / Thực tập sinh
- Doanh nghiệp / HR / Người hướng dẫn
- Nhà trường / Giảng viên phụ trách
- Hệ thống AI
- Smart Contract / Blockchain

### 1.6. Phân tích sơ đồ thiết kế có thể đọc được
- Sơ đồ trong file Word cho thấy các luồng nghiệp vụ chính sau:
  - Quản lý hồ sơ thực tập (CV/JD)
  - Gợi ý và xét duyệt thực tập
  - Điểm danh hàng ngày (QR Code)
  - Quản lý task & giờ làm
  - Đăng nhập / quản lý tài khoản
  - Nộp & quản lý báo cáo (IPFS)
  - Quản lý điểm & cấp chứng nhận (NFT/SBT)
  - Phân tích tiến độ & cảnh báo (AI BERT)

### 1.7. Đề xuất công nghệ phù hợp
- Frontend: React.js + Tailwind / Material UI
- Backend: Node.js + Express.js hoặc NestJS
- Database: MongoDB Atlas
- AI: BERT / Sentence-Transformers, có thể tách thành Python service
- Web3: Solidity, Hardhat, Ethers.js, IPFS, NFT/SBT

### 1.8. Đề xuất mô hình dữ liệu ban đầu
- users
- students
- companies
- internship_positions
- applications
- attendance_logs
- tasks
- task_progress
- reports
- evaluations
- certificates
- notifications
- ipfs_metadata

### 1.9. Lập kế hoạch giai đoạn phát triển
- Giai đoạn 1: nghiên cứu phạm vi, yêu cầu, vai trò và dữ liệu
- Giai đoạn 2: thiết kế use case, cửa sổ màn hình, API, ERD
- Giai đoạn 3: xây dựng MVP nghiệp vụ
- Giai đoạn 4: tích hợp AI và cảnh báo
- Giai đoạn 5: tích hợp Web3, IPFS, chứng nhận on-chain

---

## 2. Những việc còn thiếu

- Chưa có tài liệu yêu cầu chi tiết đầy đủ dạng spec kỹ thuật
- Chưa có mô hình dữ liệu final/hoàn chỉnh từ bên chủ nhiệm
- Chưa có sơ đồ hệ thống đầy đủ theo dạng use case, class diagram, ERD chuẩn
- Chưa có backlog chức năng theo từng vai trò chi tiết
- Chưa có thiết kế API định nghĩa rõ request/response
- Chưa có lựa chọn framework cụ thể cuối cùng cho toàn bộ stack
- Chưa có xác nhận phần nào là MVP và phần nào là nâng cao
- Chưa có quyết định triển khai mạng blockchain thật hay testnet

---

## 3. Lỗi đang gặp / ràng buộc

- Các file H2D không thể đọc như văn bản nghiệp vụ, nên không thể dùng để suy ra yêu cầu chức năng.
- Có thể có một số file Word và sơ đồ chứa dữ liệu dạng ảnh hoặc biểu đồ, cần đọc qua hình ảnh để hiểu đúng ý đồ thiết kế.
- Tài liệu gốc đang ở dạng Word và sơ đồ nên cần xử lý cẩn thận để không vượt quá phạm vi đề tài.
- Chưa có mã nguồn thực thi, nên chưa thể triển khai hoặc kiểm tra ứng dụng ngay.

---

## 4. Bước cần thực hiện tiếp theo

### Bước 1: Xác nhận phạm vi cốt lõi
- Xác nhận liệu đề tài nên tập trung vào MVP quản lý thực tập hay còn cần tích hợp đầy đủ Web3/AI ngay từ đầu.

### Bước 2: Thiết kế hệ thống ở mức nghiệp vụ
- Use case theo từng vai trò
- Luồng nghiệp vụ theo từng quy trình
- Sơ đồ hoạt động và sơ đồ lớp cơ bản

### Bước 3: Thiết kế dữ liệu kỹ thuật
- ERD chi tiết
- Mô tả bảng và quan hệ
- Ràng buộc nghiệp vụ và trạng thái

### Bước 4: Thiết kế kiến trúc hệ thống
- Frontend + Backend + AI service + Blockchain service
- Cách lưu file báo cáo, chứng nhận, metadata

### Bước 5: Chuẩn bị Giai đoạn 2
- Lập backlog chức năng chi tiết
- Chia task theo module
- Xác định ưu tiên phát triển

---

## 5. Kết luận ngắn gọn
Hiện tại, dự án đã xác định rõ mục tiêu, phạm vi, vai trò, quy trình nghiệp vụ và công nghệ phù hợp theo tài liệu gốc. Dữ liệu quan trọng đã được xác định từ đề cương khóa luận và sơ đồ, trong khi các file H2D không đủ giá trị để dùng làm căn cứ yêu cầu. Đây là nền tảng hợp lệ để chuyển sang Giai đoạn 2 với thiết kế chi tiết hệ thống.

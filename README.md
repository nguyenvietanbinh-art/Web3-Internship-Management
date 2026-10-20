# Web3 Internship & KPI Platform

Nền tảng quản lý đề tài thực tập, giao KPI theo trọng số, nhận báo cáo và hỗ trợ mentor đánh giá. Frontend React/Vite, API Express/MongoDB, AI service FastAPI, và smart contract Solidity.

## Chạy local

1. MongoDB phải chạy trước. Backend mặc định kết nối `mongodb://127.0.0.1:27017/web3_internship`.
2. Chạy backend: `cd server`, `npm install`, `npm start` (API tại `http://localhost:5000`).
3. Chạy AI service: `cd ai-service`, tạo/kích hoạt môi trường Python, cài `pip install -r requirements.txt`, rồi `python main.py` (API tại `http://localhost:8000`).
4. Chạy frontend: `cd client`, `npm install`, `npm run dev`. Có thể đặt `VITE_API_URL` trỏ tới URL API, mặc định `http://localhost:5000/api`.
5. Biên dịch contract: `cd contracts`, `npx hardhat compile`.

## Trạng thái tích hợp

- Tạo đề tài, nộp báo cáo, đánh giá KPI và hoàn thành được ghi qua API vào MongoDB. Đề tài mới có hai KPI mẫu 40/60; backend yêu cầu tổng trọng số bằng 100% trước khi phân công.
- Các schema MongoDB đầy đủ cho `users`, `students`, `companies`, `topics`, `assignments`, `submissions`, `kpi_evaluations`, `ai_analyses` và `chain_events` nằm trong `server/src/models/`. Chạy `cd server && npm run seed` để tạo collection và nạp bộ dữ liệu demo (6 doanh nghiệp, 16 sinh viên, 25 đề tài và các assignment/báo cáo/đánh giá liên quan); xem [docs/mongodb-setup.md](docs/mongodb-setup.md).
- API truy vấn hồ sơ, đề tài, phân công, báo cáo, đánh giá và dashboard được ghi tại [docs/api-queries.md](docs/api-queries.md); các endpoint đọc chuẩn hóa nằm dưới `/api/data`.
- AI service hiện dùng TF-IDF theo mặc định. Có thể bật Sentence-Transformers bằng cách cài model tương ứng và cấu hình tải model trong `ai-service/main.py`. Điểm AI chỉ hỗ trợ tham khảo; mentor là người quyết định điểm nghiệm thu.
- Upload IPFS thật chỉ chạy khi đặt `PINATA_JWT` trong `server/.env`. Nếu thiếu, backend trả mã `local-...` phục vụ phát triển, không phải IPFS CID.
- Giao diện ví MetaMask có thể kết nối ví, nhưng các thao tác nghiệp vụ hiện chưa gửi giao dịch tới contract. Không hiển thị dữ liệu demo như bằng chứng on-chain.
- `contracts/contracts/InternshipRegistry.sol` là contract registry khớp mô hình collection chuẩn hóa; `InternshipPlatform.sol` cũ vẫn được giữ cho luồng milestone hiện tại. Chưa có event listener đồng bộ event từ registry về MongoDB.
- Dữ liệu khởi tạo trong frontend chỉ để xem thử; thao tác ghi yêu cầu đề tài có MongoDB ID và backend đang chạy.

Chi tiết phạm vi và các hạng mục còn thiếu theo đề tài được ghi tại [docs/analysis.md](docs/analysis.md).

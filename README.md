> **Thành viên clone mới:** đọc [TEAM_QUICKSTART.md](docs/TEAM_QUICKSTART.md) để cài dependency, chạy MongoDB/AI/Hardhat/Backend/Frontend và tạo file tài khoản TEST trên máy mình. Database cloud sẽ làm sau; không cần mật khẩu trên máy tác giả.
>
> Luồng hiện hành: **http://localhost:5182/**, email trước và ví sau. [Hướng dẫn thống nhất](docs/FULL_WEBSITE_TEST_GUIDE.md). Các môi trường nhiều cổng bên dưới là lịch sử; Google live cần Client ID hợp lệ cho origin5182.

> **Email/password demo:** http://localhost:5182/ — [cách tự đăng ký/đăng nhập và bằng chứng](docs/EMAIL_AUTH_DEMO.md). Không cần Google OAuth; không dùng mật khẩu Gmail thật.

> Google Login/Sign-up bổ sung: [hướng dẫn cấu hình](docs/GOOGLE_AUTH_SETUP.md), [kết quả kiểm thử và giới hạn](docs/GOOGLE_AUTH_RESULT.md). Live Google còn BLOCKED thiếu Client ID; email/password chưa hỗ trợ.

> PHASE 7: [Hướng dẫn tự kiểm tra/demo](docs/DEMO_SCRIPT.md) · [Trạng thái cuối](docs/FINAL_PROJECT_STATUS.md) · [Cài đặt](docs/INSTALLATION_GUIDE.md). Demo TEST tại **http://127.0.0.1:5177/**; cần mở Edge TEST và chọn vai trò theo hướng dẫn. Tách khỏi dữ liệu gốc/demo, chưa đạt 100% đề cương.

> Web3 PHASE5: [kết quả local, giao dịch thật và phần còn BLOCKED](docs/WEB3_INTEGRATION_RESULT.md). Chỉ TEST/Hardhat31337; chưa Pinata live hoặc hardware UAT. Dừng trước PHASE6.

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
- AI legacy giữ TF-IDF baseline; API/UI NLP mới đã kiểm thử Sentence-BERT multilingual MiniLM ONNX int8 chạy thật trên CPU, pin revision/hash và không tự tải model từ `AI_ENGINE`. Chưa có dữ liệu nhãn độc lập nên chưa công bố metrics chất lượng; classifier rủi ro vẫn `NOT_TRAINED`. Xem [bằng chứng inference và API/UI](docs/AI_RUNTIME_INFERENCE_RESULT.md), [tài liệu AI](docs/AI_IMPLEMENTATION.md). Cosine và cảnh báo quy tắc hỗ trợ người hướng dẫn, không tự chấm điểm hoặc quyết định kỷ luật.
- Upload IPFS thật chỉ chạy khi đặt `PINATA_JWT` trong `server/.env`. Nếu thiếu, backend trả mã `local-...` phục vụ phát triển, không phải IPFS CID.
- Giao diện ví MetaMask có thể kết nối ví, nhưng các thao tác nghiệp vụ hiện chưa gửi giao dịch tới contract. Không hiển thị dữ liệu demo như bằng chứng on-chain.
- `contracts/contracts/InternshipRegistry.sol` là contract registry khớp mô hình collection chuẩn hóa; `InternshipPlatform.sol` cũ vẫn được giữ cho luồng milestone hiện tại. Chưa có event listener đồng bộ event từ registry về MongoDB.
- Dữ liệu khởi tạo trong frontend chỉ để xem thử; thao tác ghi yêu cầu đề tài có MongoDB ID và backend đang chạy.

Chi tiết phạm vi và các hạng mục còn thiếu theo đề tài được ghi tại [docs/analysis.md](docs/analysis.md).

# Hiện trạng và tương thích

## 1. Git và môi trường

- `git branch --show-current`: `branch_1`.
- `git status -sb`: `branch_1...origin/branch_1`, không báo ahead/behind theo remote-tracking ref hiện có. Không fetch nên không kết luận bằng với GitHub tại thời điểm đánh giá.
- HEAD: `d11a1852c5f03963bbe260425a246b0e65fe1091`, thông điệp `thay đổi mới`.
- Ban đầu không có tracked file bị sửa/staged. Untracked có `docs/PROGRESS.md`, thư mục `Thư mục mới/` và ZIP tương ứng. Giữ nguyên toàn bộ.
- Không tìm thấy `AGENTS.md` trong kết quả quét repo ngoài dependency/venv.
- Shell không tìm thấy `node`, `npm`, `mongosh`; đường chuẩn `C:/Program Files/nodejs/node.exe` không tồn tại. Đây là tình trạng phiên kiểm tra, không khẳng định máy hoàn toàn không có Node ở nơi khác.
- Không có `client/node_modules`, `server/node_modules`, `contracts/node_modules`; không cài thêm.
- Chỉ thấy `server/.env.example`, không thấy `.env` tại root các thành phần đã kiểm tra; chưa kiểm chứng biến môi trường do dịch vụ ngoài shell cấp.
- Python global 3.13.5 có FastAPI, uvicorn, Pydantic, NumPy, sklearn. Venv kèm repo không chạy được vì trỏ Python 3.10 của máy người khác.

## 2. Tài liệu đã đối chiếu

Đã đọc README gốc, `client/README.md`, tất cả Markdown trong `docs`: `analysis.md`, `api-queries.md`, `architecture.md`, `mongodb-setup.md`, `PROGRESS.md`.

Đã trích văn bản từ `word/document.xml` của hai DOCX trong thư mục untracked: đề cương `KLCN129_Trần-Việt-Hùng.docx` và `Tuần-3_-sơ-đồ-123.docx`. Đề cương có yêu cầu chức năng và thang điểm cụ thể; tài liệu tuần 3 có các use case UC-01–UC-07. Không thay đổi các file này. Chưa kiểm tra trực quan toàn bộ sơ đồ/ảnh nhúng (2 và 25 ảnh theo kiểm kê), không suy diễn nội dung H2D. Không dùng ZIP làm phiên bản source thay thế.

`PROGRESS.md` nói chưa có mã ứng dụng: thông tin này đã lỗi thời. README và một số docs vẫn nói không có chữ ký/JWT/listener/giao dịch, trong khi code mới đã thêm. README nói thiếu Pinata dùng local fallback nhưng source hiện trả 503 khi nộp/cấp chứng nhận.

## 3. Phân tích các thành phần

### client

React 19/Vite 8, entry `src/main.jsx`, màn hình chính `src/App.jsx`; bốn view dashboard, CV/JD, attendance/task/worklog, chứng nhận và AuthModal. `src/api/client.js` gắn Bearer token, đăng nhập nonce/chữ ký, demo-login và khôi phục phiên. `src/api/web3Client.js` có các hàm create/addKPI/assign/submit/evaluate/complete và đọc chain. ABI/address đã được chép vào client.

Có form tạo đề tài với các hàng KPI; thao tác thực gọi REST thay vì chỉ sửa state. Tuy nhiên CV chỉ ở state; ứng tuyển chỉ toast; QR là hình CSS; UI chưa phân biệt đầy đủ mentor/company/admin, chưa lọc quyền sở hữu nút; một số fallback tạo số liệu không thật. Đã xem cấu hình Vite/Netlify/redirect và các tài nguyên giao diện; chưa build, lint hay kiểm thử trình duyệt. CSS/ảnh và artifact không phải bằng chứng chức năng hoạt động.

### server

Express 4/Mongoose 8/ethers 6. `app.js` tách khỏi `index.js`; middleware error trả JSON; config tập trung phần lớn biến. Có 15 model: User, Student, Company, Topic, Assignment, Submission, KPIEvaluation, AIAnalysis, ChainEvent, AuthNonce, JD, Task, Attendance, WorkLog (14 tên liệt kê; đây là danh sách model thực tế, không suy theo số collection docs). Các nhóm route auth/topics/data/internship.

Auth có nonce một lần, kiểm tra signature, JWT, nạp role từ DB, chặn tự đăng ký mentor/admin. API topics kiểm tra tổng KPI, ví, trạng thái, quyền công ty/sinh viên/mentor. API data có phân trang và sửa hồ sơ theo chủ sở hữu. API internship mới mở rộng JD/task/attendance/worklog/certificate nhưng áp dụng quyền và độ trung thực dữ liệu không đồng đều với nhóm topics. Demo-login cấp JWT không cần signature và chưa được giới hạn môi trường.

Pinata JSON/file helper đã có; nộp KPI và hoàn tất bắt buộc Pinata thật. Backend fallback phân tích báo cáo ghi rõ keyword-fallback; matching fallback chưa ghi engine. Listener tồn tại nhưng cần sửa cách giải mã ethers Result, định danh topic, đồng bộ normalized records và xử lý lỗi/retry.

### ai-service

FastAPI có `/health`, `/api/match`, `/api/analyze-report`; schema snake_case phù hợp adapter Node. Matching kết hợp TF-IDF/cosine và tỷ lệ kỹ năng, report dựa tương đồng và keyword. Có nhánh tải SentenceTransformer qua `AI_ENGINE`, nhưng requirements không chứa sentence-transformers; không có mô hình/benchmark/dataset đánh giá. Không thấy endpoint cảnh báo tiến độ hoặc lịch xử lý nhật ký tuần. `BatchMatchRequest` mới là schema, chưa có route batch.

Đã thực chạy TF-IDF bằng Python global, không dùng venv hỏng và không tải model. Chi tiết ở báo cáo 05.

### contracts

`InternshipPlatform.sol` mô hình một sinh viên/đề tài, KPI có trạng thái và trọng số, ghi CID và event hoàn thành. `InternshipRegistry.sol` mô hình assignment đa slot, hash chứng cứ và điểm; chưa có deploy/client/listener sử dụng registry. Cả hai không triển khai NFT/SBT. Contract cũ và backend khác quyền mentor, đa slot, điều kiện assign, nộp lại và cách làm tròn điểm.

Deploy script xuất ABI/address/chainId cho client và server. Hai metadata hiện giống nhau, chainId 31337, address `0x5FbDB2315678afecb367f032d93F642f64180aa3`; không chứng minh đã deploy trên node đang hoạt động. Artifact/cache sẵn có không thay thế compile/test mới. Hardhat cấu hình ESM `.js` cùng Hardhat 2 là rủi ro boot cần tái hiện; package test hiện chỉ exit 1, dù có file Mocha test ba luồng thuận.

### database

Đã đọc `database/seed.mongodb.js`, `server/scripts/seed.js`, models và route ghi/đọc liên quan. Có hai cách seed, không chạy cách nào. Các schema có ref/index/validation nhưng MongoDB không tự bảo đảm ref tồn tại. Assignment thiếu unique pair topic–student. Source giữ KPI embedded cùng normalized collections, chưa có giao dịch DB bảo đảm cập nhật cùng lúc.

Seed Mongoose vừa tạo mẫu vừa migration/drop index/xóa evaluation trùng và ghi đè hồ sơ/đề tài mẫu. Seed mongosh có nhánh dùng userId cố định thay vì ID thực tìm được, thiếu milestoneIndex cho bản ghi mẫu đầu tiên. Số lượng 6 công ty/16 sinh viên/25 đề tài là dự định của script, chưa xác nhận dữ liệu database thực.

## 4. Tương thích giữa các phần đóng góp

Không quy lỗi cho cá nhân khi chưa có bằng chứng phân công/ownership rõ trong Git; đánh giá theo ranh giới module.

| Ranh giới | Phần khớp trong source | Phần lệch/chưa chứng minh |
| --- | --- | --- |
| Client ↔ auth | nonce/message/signature/JWT/Bearer và wallet field khớp | Demo JWT không gắn signer; mentor bị coi như company; mất token chưa đồng bộ ngay UI |
| Client ↔ topics | Đường dẫn, body KPI, assign, report, evaluate, complete khớp | Nút cập nhật báo cáo submitted bị backend từ chối; quyền UI rộng hơn API; chain lỗi bị nuốt |
| Client ↔ internship | JD, task status, check-in, worklog, certificate có endpoint | Task không gửi ví người nhận; CV không lưu; ứng tuyển không có API; GET tự seed |
| Server ↔ AI | Snake_case request/response đã có adapter báo cáo camelCase | Matching thiếu engine/fallback flag; TF-IDF thay BERT; nhật ký tuần không gọi AI |
| Client ↔ contract | ABI và tên hàm Platform phù hợp source; metadata client/server giống nhau | Không kiểm tra chainId/signer; partial addKPI bị bỏ qua; contract không mint token |
| Server ↔ chain | Có event tương ứng với Platform | Parse named args, processed flag sớm, đồng bộ theo title, thiếu chain scope/checkpoint/normalized records |
| DB ↔ nghiệp vụ | Model collections và route normalized có liên kết | Embedded KPI và normalized có thể lệch; đa slot không thực thi; seed hai phiên bản lệch |
| Docs ↔ code | Kiến trúc bốn thành phần đúng | Trạng thái auth/IPFS/Web3/PROGRESS lỗi thời; chưa có runbook đồng nhất |

## 5. Mức sẵn sàng

Đủ nền tảng để tiếp tục tích hợp MVP. Chưa thể gọi là chức năng hoàn thiện đã kiểm thử ngoài phạm vi AI ghi rõ ở báo cáo 05. Chưa chứng minh chạy API/MongoDB, Pinata thật, MetaMask, EVM, testnet hay deployment. Không tính tỷ lệ hoàn thành hoặc điểm chấm đồ án khi chưa có nghiệm thu và benchmark.

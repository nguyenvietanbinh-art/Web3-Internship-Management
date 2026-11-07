# Nhật ký kiểm tra và giới hạn bằng chứng

Ngày 30/10/2026, Asia/Bangkok. Chỉ dùng công cụ local và dependency có sẵn. Không browse Internet vì nhiệm vụ là kiểm tra snapshot source, không thẩm định các phiên bản mới nhất hoặc advisory bảo mật ngoài repo.

## Đã thực chạy

| Kiểm tra | Kết quả thực tế | Giới hạn |
| --- | --- | --- |
| Git branch/status/log/diff | Branch `branch_1`; HEAD d11a1852…; lúc bắt đầu không thay đổi tracked, untracked được giữ nguyên | Không fetch; remote status chỉ là tracking ref local |
| Kiểm kê file/docs/models/routes/contracts/seeds | Đã đọc và đối chiếu logic của năm thành phần | Không coi dependency vendor, compiled artifacts, venv hay CSS/ảnh là mã nghiệp vụ cần kiểm thử chức năng |
| DOCX XML extraction | Đọc đề cương và use case từ hai DOCX | Chưa thẩm định trực quan 27 ảnh nhúng hoặc H2D |
| Node/PATH | `node --version` báo command not found; Get-Command node/npm/mongosh không tìm thấy | Không suy máy không có runtime ở bất kỳ vị trí nào khác |
| Node dependencies | Cả ba node_modules không tồn tại | Không npm install/npm ci/npx tải package |
| Python global | Python 3.13.5; module FastAPI/uvicorn/Pydantic/NumPy/sklearn có sẵn | Không cài package mới |
| Venv Python repo | Chạy executable báo No Python tại đường Python310 của máy admin | Không sửa/xóa/tạo lại venv |
| Python AST | `ast.parse(ai-service/main.py)` PASS | Chỉ cú pháp Python |
| Metadata ABI client/server | Hai JSON bằng nhau, chainId 31337/address 0x5FbDB…0aa3 | Không có RPC/bytecode/receipt xác thực deployment đang sống |

## 12 kiểm tra AI đã chạy: 12/12 đạt assertion kỹ thuật

Đặt `AI_ENGINE=tfidf` chỉ trong tiến trình kiểm tra. Nạp `ai-service/main.py` qua importlib, chạy bằng `python -B` để không ghi pycache. TestClient gọi ASGI trong bộ nhớ, không khởi động HTTP listener ngoài và không gọi MongoDB/Pinata/blockchain. Assertion smoke kiểm tra response/range/shape, không đánh giá tính đúng của thang điểm.

| # | Ca kiểm tra | Kết quả quan sát |
| --- | --- | --- |
| 1 | Gọi health trực tiếp | online, TF-IDF fallback, bert_active=false |
| 2 | Similarity hai chuỗi giống `smart contract react` | 1.0000000000000002, sai số floating point bình thường |
| 3 | Similarity chuỗi rỗng và `react` | 0.0 |
| 4 | Similarity `python data` và `solidity governance` | 0.0 |
| 5 | Match React với yêu cầu React/Python | score 56.3; matched React, missing Python; semantic 65.7, skill ratio 50 |
| 6 | Report rỗng, tiêu chí solidity smart contract/testing | relevance 0, suggested 50, thiếu cả solidity/testing |
| 7 | Report `cooking bread recipe` với tiêu chí trên | relevance 0, suggested 50 |
| 8 | Report `solidity smart contract testing` | relevance 100, suggested 90, found solidity/testing |
| 9 | TestClient GET `/health` | 200, TF-IDF fallback, bert_active=false |
| 10 | TestClient POST `/api/match`, React với React | 200, score 89.2, skill ratio 100 |
| 11 | TestClient POST `/api/analyze-report` với report_content rỗng | 200, relevance 0, suggested 50 |
| 12 | TestClient POST `/api/match` body `{}` | 422 |

Sự kiện report rỗng/lạc đề vẫn 50 là phát hiện A18, **không phải chức năng AI đã đạt yêu cầu**. Backend topics có kiểm tra báo cáo không rỗng, nhưng API AI trực tiếp hiện không có giới hạn này. BERT, tiếng Việt, ranking accuracy, nguy cơ chậm tiến độ và model quality chưa được kiểm định.

## Chủ động không chạy

- `server npm test`: `server/test/helpers.js` gọi dropDatabase lúc start và stop; ngay cả DB test riêng cũng vi phạm yêu cầu không thay đổi database trong đợt này.
- Seed Mongoose/mongosh/migration và API ghi: tạo/sửa/xóa dữ liệu, có script drop index/deleteMany.
- Backend start hoặc UI duyệt tab: listener có thể ghi DB; một số GET có auto-create sample. Không gọi các endpoint này kể cả dưới danh nghĩa read-only.
- Client build/lint, backend Node syntax/runtime, Hardhat compile/test/deploy: không có Node/dependency trong môi trường đã kiểm tra; không tự cài thêm. Cấu hình Hardhat có nguy cơ lỗi được gắn nhãn source-based cần tái hiện, không ghi là test fail đã quan sát.
- Pinata upload/gateway thực, MetaMask ký, giao dịch EVM/testnet, Atlas và deployment: chưa có kiểm thử tích hợp thật.
- Không chạy automated security scan/dependency audit, Postman, Lighthouse hay UAT; không kết luận không có lỗi khác.

## Phạm vi bảo toàn

Chỉ xuất báo cáo Markdown trong `audit-reports`. Không chỉnh README/docs/source/config/lockfile, không thay database, không cài dependency, không commit/push/merge, không xóa hoặc giải nén đè untracked. Báo cáo 01/02/03 phản ánh kết luận đọc source, báo cáo này chỉ rõ phần đã thực kiểm tra; không lấy test file/compiled artifact có sẵn làm test pass.

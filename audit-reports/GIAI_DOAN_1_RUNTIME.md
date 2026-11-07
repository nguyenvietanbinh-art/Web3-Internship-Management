# GIAI ĐOẠN 1 — Môi trường và khả năng chạy

Ngày kiểm tra: **30/10/2026, Asia/Bangkok**. Workspace: `D:\Web3-Internship-Management`.
Branch: **branch_1**. HEAD: `d11a1852c5f03963bbe260425a246b0e65fe1091`.

## 1. Kết luận thực tế

**Chưa thể khởi động toàn bộ hệ thống bằng môi trường hiện tại.** Chưa tìm thấy Node.js/npm và MongoDB local qua PATH/các vị trí thông dụng đã kiểm tra; ba thư mục `node_modules` chưa có. JWT/Pinata chưa được cấp trong process kiểm tra, không tìm thấy `.env` thật tại root hoặc root các service.

**AI TF-IDF có thể nạp và xử lý request trong bộ nhớ bằng Python global đang có.** Đã kiểm tra AST và bốn request ASGI TestClient, không mở server mạng, không ghi database. Venv đi kèm repo không hoạt động. BERT chưa sẵn sàng vì thiếu sentence-transformers và torch trong Python đang kiểm tra.

Chưa chạy build/lint/test Node, compile/deploy Hardhat, backend start, seed hoặc UI. Cấu hình Hardhat có rủi ro ESM/CommonJS cần tái hiện sau khi được phép cài dependency; không ghi nhận đây là lỗi runtime đã thực chạy.

Đã đọc lại README gốc và đủ sáu báo cáo: `audit-reports/README.md`, `01-assessment.md`, `02-findings.md`, `03-requirements.md`, `04-repair-plan.md`, `05-verification.md`. Ghi chú đính chính bằng chứng: báo cáo 01 có câu “15 model” nhưng danh sách và kiểm kê thực tế là **14 model**; giữ nguyên báo cáo cũ, không sửa ngoài phạm vi.

## 2. Công cụ đã cài và còn thiếu

| Công cụ | Kết quả kiểm tra thực tế | Nhận định |
| --- | --- | --- |
| Hệ điều hành | Windows x64, build 26200.9711; Python nhận diện Windows 11 | Registry còn ghi ProductName Windows 10 Home Single Language, DisplayVersion 25H2; ghi build làm định danh đáng tin cậy hơn nhãn cũ |
| PowerShell | Desktop 5.1.26100.9711, process 64-bit | Dùng lệnh PowerShell; không dùng `&&` của shell mới trong hướng dẫn |
| Git | 2.52.0.windows.1, `C:\Program Files\Git\cmd\git.exe` | Có sẵn; chỉ kiểm tra read-only, không fetch/commit/push/merge |
| Python | 3.13.5, `C:\Users\PC\miniconda3\python.exe` | Có sẵn và chạy được AI TF-IDF |
| pip | 25.1, thuộc Python 3.13 global | Có sẵn; chưa cài thêm package |
| Node.js/npm/npx | Get-Command không tìm thấy | Cần xác nhận runtime/cài hoặc cung cấp đường dẫn; không kết luận máy không có ở bất kỳ vị trí khác |
| MongoDB mongod/mongosh/mongo | Không tìm thấy trong PATH; không thấy service/process MongoDB qua kiểm tra hiện tại | Chưa xác nhận MongoDB local khả dụng; Atlas ngoài máy chưa được cấu hình/kiểm tra |
| Docker | Không tìm thấy CLI hoặc đường cài phổ biến, không thấy service tương ứng | Không bắt buộc cho stack nếu chọn MongoDB local/Atlas; không tự cài Docker |
| Solidity compiler CLI solc | Không tìm thấy | Không bắt buộc cài global: Hardhat quản lý compiler riêng sau khi cấu hình hoạt động |
| MetaMask/browser | Chưa kiểm tra extension hay ký giao dịch | Cần kiểm tra thủ công khi được phép demo Web3; Ví Demo không thay thế chữ ký giao dịch thật |

Đã kiểm tra và không thấy: `C:\Program Files\nodejs\node.exe`, `C:\Program Files\MongoDB`, đường Docker Desktop thông dụng, thư mục npm/nvm trong AppData, `C:\nvm`, `C:\tools\nodejs`. Không quét toàn bộ ổ đĩa. `Get-CimInstance Win32_OperatingSystem` bị Access denied; dùng thông tin OSVersion/registry/platform thay thế, không yêu cầu nâng quyền.

Kết nối TCP `127.0.0.1` tới **27017, 5000, 8000, 8545, 5173, 4173** đều timeout trong thời hạn 0,6 giây/port. Không quan sát được listener các port này từ truy vấn hệ thống. **Không coi timeout là bằng chứng chắc chắn port đóng hoặc service chưa cài**, vì giới hạn quyền/network có thể ảnh hưởng; không gửi MongoDB query hay JSON-RPC ghi trạng thái.

## 3. Dependency theo từng thành phần

Ba lockfile dùng `lockfileVersion: 3`. Các khai báo dependencies/devDependencies ở root lockfile **khớp package.json**. Chưa có `client/node_modules`, `server/node_modules`, `contracts/node_modules`. Package root repo không có `package.json`; `package-lock.json` root chỉ có `packages: {}`. Không chạy npm install/ci tại root.

### 3.1. Client

| Package | Khai báo | Phiên bản trong lockfile |
| --- | --- | --- |
| axios | ^1.20.0 | 1.20.0 |
| ethers | ^6.17.0 | 6.17.0 |
| lucide-react | ^1.55.0 | 1.55.0 |
| react / react-dom | ^19.2.8 | 19.3.0 / 19.3.0 |
| @types/react | ^19.2.18 | 19.3.0 |
| @types/react-dom | ^19.2.7 | 19.3.0 |
| @vitejs/plugin-react | ^6.1.1 | 6.1.2 |
| oxlint | ^1.81.0 | 1.87.0 |
| vite | ^8.3.0 | 8.3.4 |

Vite/plugin-react/oxlint trong lockfile yêu cầu **Node `^20.19.0 || >=22.12.0`**. Không thể dùng tùy ý Node 18 hay Node 20.0. Phương án runtime để xin chấp thuận là **Node 22.x x64, phiên bản ít nhất 22.12.0**, thỏa engines ghi trong repo; chưa kiểm chứng runtime thực của tổ hợp này, không tuyên bố đây là bản mới nhất trên Internet. Cần giữ các optional native bindings cho Windows x64: oxlint, rolldown, lightningcss; không dùng `--omit=optional` một cách máy móc.

React/ReactDOM và các type packages đã khớp peer version trong lockfile. Các peer tùy chọn như sass, react compiler, vite devtools vắng mặt không tự động là dependency thiếu cho app hiện tại.

### 3.2. Server

| Package | Khai báo | Phiên bản trong lockfile |
| --- | --- | --- |
| axios | ^1.7.7 | 1.20.0 |
| bcryptjs | ^2.4.3 | 2.4.3 |
| cors | ^2.8.5 | 2.8.6 |
| dotenv | ^16.4.5 | 16.6.1 |
| ethers | ^6.13.2 | 6.17.0 |
| express | ^4.21.0 | 4.22.3 |
| form-data | ^4.0.0 | 4.0.6 |
| jsonwebtoken | ^9.0.2 | 9.0.3 |
| mongoose | ^8.7.0 | 8.24.5 |
| multer | ^1.4.5-lts.1 | 1.4.5-lts.2 |
| nodemon (dev) | ^3.1.7 | 3.1.14 |

Mongoose/MongoDB driver yêu cầu Node >=16.20.1, nhưng một số dependency transitive mới có range `20 || >=22`; dùng chung runtime thỏa client thuận lợi hơn. Khác range axios/ethers giữa client và server **không phải xung đột đã xác nhận**: lockfile cả hai hiện chốt axios 1.20.0 và ethers 6.17.0.

### 3.3. AI service

| Requirement | Python global đã cài | Đạt constraint khai báo? |
| --- | --- | --- |
| fastapi>=0.115.0 | 0.124.1 | Có |
| uvicorn>=0.30.0 | 0.38.0 | Có |
| pydantic>=2.9.0 | 2.12.4 | Có |
| numpy>=1.26.0 | 2.2.6 | Có |
| scikit-learn>=1.5.0 | 1.7.2 | Có |
| requests>=2.32.0 | 2.32.4 | Có |

Có thêm scipy 1.16.2, httpx 0.28.1 và starlette 0.50.0; TestClient dùng httpx có sẵn, nhưng requirements của dự án chưa khai báo dependency kiểm thử này. Không có sentence-transformers/torch trong interpreter global đã kiểm tra. `AI_ENGINE=sbert` sẽ đi vào nhánh optional loader; import/tải lỗi bị bắt và fallback TF-IDF, không fail-fast.

`python -m pip check` **không đạt** do môi trường chung có ultralytics/ultralytics-thop nhưng thiếu torch và torchvision. Đây là xung đột của môi trường chung, không phải bằng chứng sáu requirement của AI không tương thích; smoke TF-IDF vẫn chạy được. Không cài torch để sửa môi trường chung trong giai đoạn này.

`ai-service/venv/Scripts/python.exe --version` **không chạy được**: trỏ tới Python310 của `C:\Users\admin\...` không còn tồn tại. Venv được tạo cho Python 3.10.4 ở máy khác. Không xóa hoặc thay thế venv. Nếu được chấp thuận, tạo **một thư mục môi trường mới chưa tồn tại**, không ghi đè venv cũ; khóa phiên bản sau khi kiểm thử. Requirements chỉ có lower bound nên chưa tái lập chính xác môi trường bằng riêng file này.

### 3.4. Contracts

| Package chính | Phiên bản lockfile | Tương thích khai báo đáng chú ý |
| --- | --- | --- |
| hardhat | 2.29.1 | package.json ^2.29.1 |
| @nomicfoundation/hardhat-toolbox | 6.1.2 | peer hardhat ^2.28.0 |
| @nomicfoundation/hardhat-ethers | 3.1.3 | ethers ^6.14.0, hardhat ^2.28.0 |
| ethers | 6.17.0 | Khớp plugin và client/server |
| @nomicfoundation/hardhat-chai-matchers | 2.1.2 | chai ^4.2.0; lockfile chai 4.5.0 |
| @nomicfoundation/edr | 0.12.0-next.23 | Node >=20, có binding win32-x64-msvc |
| typescript / ts-node | 7.0.2 / 10.9.2 | Range peer không chặn tổ hợp này; chưa kiểm thử khả năng chạy thực tế |
| solc (dependency npm) | 0.8.26 | Không đồng nghĩa compiler được chọn trong hardhat.config.js |

Quét lockfile không thấy peer bắt buộc bị thiếu entry ở cả ba thành phần; các peer chính Hardhat/toolbox/ethers/chai đáp ứng range ghi trong lockfile. Đây là **đối chiếu tĩnh**, chưa thay thế `npm ci`/`npm ls` hay kiểm thử native addon. Không dùng `--force`/`--legacy-peer-deps` để bỏ qua lỗi chưa hiểu.

Package keccak/secp256k1 có install scripts; fsevents là package tùy nền tảng. Có thể cần build tools nếu không dùng được prebuilt binary, nhưng chưa có lỗi cài đặt thực tế nên chưa kết luận phải cài Visual Studio Build Tools hoặc C++ runtime. Không chạy lifecycle script hay tải compiler trong đợt kiểm tra.

## 4. File cấu hình và biến môi trường

Chỉ tìm thấy **`server/.env.example`** trong root repo/root các service; không tìm thấy `.env` thật tại các vị trí đã quét. Đã chỉ kiểm tra tên biến, có/rỗng và constraint; **không in giá trị bí mật**. Tất cả biến liệt kê dưới đây đều **unset trong process shell kiểm tra**; không kết luận môi trường deploy bên ngoài cũng unset.

| Biến | Vai trò và yêu cầu | Giá trị mặc định không bí mật trong source |
| --- | --- | --- |
| JWT_SECRET | Bắt buộc trước backend boot; dài >=16 ký tự; không dùng test secret thật | Không có default; thiếu sẽ throw |
| MONGODB_URI | Bắt buộc có đích DB khả dụng; dùng DB demo riêng nếu được phép ghi | mongodb://127.0.0.1:27017/web3_internship |
| PORT | Cổng backend | 5000 |
| JWT_EXPIRES_IN | Hạn token | 8h |
| NONCE_TTL_SECONDS | Hạn nonce | 300 |
| CORS_ORIGIN | Origin frontend; phân tách bằng dấu phẩy khi nhiều origin | Runtime default `*`; example localhost:5173 |
| AI_SERVICE_URL | Base URL service AI, không thêm /api vào base | http://localhost:8000 |
| PINATA_JWT | Bắt buộc để nộp báo cáo và cấp metadata chứng nhận; không bắt buộc để backend boot | Rỗng; submit/complete trả 503 khi thiếu |
| BLOCKCHAIN_RPC_URL | RPC cho listener backend; chưa có trong .env.example | http://127.0.0.1:8545 |
| VITE_API_URL | Base API frontend, phải có /api | http://localhost:5000/api |
| AI_ENGINE | Chọn tfidf/sbert/bert/sentence-transformers | tfidf |
| MONGODB_URI_TEST | Biến bộ test backend đang đọc | Không sử dụng trong giai đoạn này vì helper vẫn dropDatabase |

Địa chỉ MongoDB/URL trong bảng là **default từ source**, không phải thông tin kết nối thật đã được người dùng cung cấp.

`server/src/config/env.js` gọi dotenv theo working directory trước, rồi `.env` tại root repo. Vì vậy nên chạy từ `server`, và ưu tiên biến process có sẵn theo hành vi dotenv mặc định. `aiClient.js` đọc AI_SERVICE_URL lúc import, không qua getter config: phải cấp biến trước khởi động, thay đổi cần restart. AI `main.py` không tự load dotenv; AI_ENGINE phải được đưa vào environment trước import. Vite cần restart dev server/rebuild khi đổi biến build; chỉ đặt dữ liệu public trong VITE_*, tuyệt đối không đặt JWT/Pinata/private key ở frontend.

README hiện không phản ánh đầy đủ yêu cầu JWT và còn nói Pinata local fallback; code đã chuyển sang IPFS thật cho submit/complete. Không làm theo bước npm install/seed trong README một cách tự động.

## 5. Kết nối giữa các thành phần

| Luồng | Cấu hình source | Kết quả xác minh |
| --- | --- | --- |
| Browser → Vite | Dev thường 5173; preview thường 4173; vite.config.js chưa khóa port | Chưa boot; cần --strictPort để tránh tự đổi cổng làm lệch CORS |
| Frontend → API | VITE_API_URL hoặc http://localhost:5000/api, Bearer JWT | Adapter và route prefix khớp qua đọc source; chưa HTTP thật |
| API → MongoDB | MONGODB_URI, Mongoose connect ở index.js | Chưa kết nối; không mở backend vì auto-index/listener có thể ghi DB |
| API → AI | AI_SERVICE_URL, POST /api/match và /api/analyze-report, timeout 5s | Payload/response adapter khớp tĩnh; AI TestClient chạy được; chưa kiểm thử Node→AI |
| API → Pinata/IPFS | PINATA_JWT; Pinata JSON/file API; timeout 30/60s | Chưa thử credential/upload/gateway, không phát sinh pin mới |
| Frontend → blockchain | BrowserProvider MetaMask; read-only fallback http://127.0.0.1:8545 | Chưa xác minh signer/chain/bytecode bằng RPC; URL fallback frontend không đọc BLOCKCHAIN_RPC_URL |
| API → blockchain | BLOCKCHAIN_RPC_URL và server/src/contracts/InternshipPlatform.json | Listener chạy sau DB connect và có thể backfill ghi ChainEvent/Topic |

Nếu dùng `127.0.0.1:5173` thay vì `localhost:5173`, origin khác CORS example. Preview 4173 cũng cần origin riêng. Nếu deploy frontend public, localhost là máy của người xem; phải đổi API/RPC HTTPS phù hợp và cấu hình CORS tương ứng. Không thử endpoint GET jds/tasks/history/worklogs vì chúng có nhánh ghi sample.

Backend `app.listen` chạy trước khi promise MongoDB connect xong: log “Server running” chưa chứng minh DB sẵn sàng. `/api/health` cần `dbState=connected`; `status=online` một mình chưa đủ. Ngay cả mở backend rồi chỉ gọi health vẫn không bảo đảm read-only vì index initialization/listener xảy ra trong boot.

## 6. Hardhat, blockchain và smart contract

- `contracts/package.json` dùng **type=module**, config `.js` dùng import/export, nhưng Hardhat là **2.29.1**. Giữ phát hiện A13: có nguy cơ HH19/module loading; **chưa tái hiện** vì chưa có Node/dependency. Cần xác minh trước khi chọn sửa `.cjs` hoặc đổi toolchain; không tự đổi module mode/dependency.
- Solidity config **0.8.24**, optimizer enabled, runs=200. Hai source pragma `^0.8.24` phù hợp compiler được chọn. Artifact build-info hiện ghi **0.8.24+commit.e11b9ed9**, nhưng chỉ là artifact có sẵn, không phải compile mới.
- `solc` npm transitive 0.8.26 không phải bằng chứng compile bằng 0.8.26: Hardhat chọn compiler theo config, có thể cần tải/cached compiler 0.8.24. Không tự tải compiler khi chưa được phép.
- Có network `hardhat: {}` và `localhost` URL 127.0.0.1:8545; **không có Sepolia config**. Mặc định chạy deploy không chỉ định network có thể dùng chain tạm trong process và biến mất khi process kết thúc. Muốn server/frontend dùng lâu dài phải dùng node local đang chạy và `--network localhost` sau khi được phép.
- Metadata client và server **giống nhau**, chainId **31337**, network label **hardhat**, contract address **0x5FbDB2315678afecb367f032d93F642f64180aa3**; ABI metadata cũng khớp ABI artifact Platform. Không xác nhận contract tồn tại trên node hiện tại từ thông tin này.
- Deploy script triển khai **InternshipPlatform**, không phải Registry, và **ghi đè JSON metadata trong client/server**. Do đó không chạy deploy trong giai đoạn này; cần phê duyệt riêng phạm vi cập nhật metadata.
- Frontend/backend chưa đối chiếu chainId với metadata đủ chặt; RPC cùng port nhưng node reset có thể khiến address/chain state không còn khớp. Cần eth_chainId + eth_getCode + receipt/event read-only sau khi có node, không dùng eth_sendTransaction/reset để kiểm tra kết nối.
- Platform hiện chỉ lưu cờ/CID/event hoàn thành, chưa mint NFT/SBT. Registry là mô hình khác chưa tích hợp. Runtime chạy được sau này cũng không giải quyết tự động thiếu chức năng này.

## 7. Script build/lint/test: kiểm tra tĩnh

| Thành phần | Script/lệnh có trong source | Trạng thái trong đợt này |
| --- | --- | --- |
| client | dev=vite, build=vite build, lint=oxlint, preview=vite preview | Có script; chưa chạy do thiếu Node/dependency; không có test script |
| server | start=node src/index.js; dev=nodemon src/index.js | Có script; chưa start, tránh DB/listener write |
| server | test=node --test --test-concurrency=1 test/*.test.js | **Không chạy**: helper gọi dropDatabase trước/sau, kể cả chọn một test vẫn có hooks |
| server | seed=node scripts/seed.js | **Không chạy**: có dropIndex/deleteMany và ghi đè dữ liệu mẫu |
| contracts | npm test = echo Error: no test specified && exit 1 | Script placeholder chắc chắn không chạy file Mocha tests; không coi đây là kết quả test contract thất bại đã quan sát |
| contracts | File test/InternshipPlatform.test.js có 3 ca thuận | Chỉ đọc; test deploy vào chain test; chưa có Registry test; chưa chạy |
| contracts | Không có scripts compile/deploy/lint trong package.json | Phải gọi CLI local sau cài dependency và xử lý config |
| ai-service | Không có bộ pytest/unittest riêng trong source | Đã dùng TestClient sẵn có, không thêm file test/package |

Không tự chạy npm audit/registry lookup/npx tải package. Kiểm tra lockfile không phải audit lỗ hổng hay xác nhận package tải được. Chưa thấy runtime pin `.nvmrc`/`.node-version`, `.npmrc` riêng trong kết quả quét; cần chốt phiên bản ở giai đoạn được phép sửa cấu hình.

## 8. Lệnh cần chạy và thứ tự khởi động — chỉ là hướng dẫn, chưa thực thi

Tất cả lệnh cài đặt, tạo môi trường, compiler download, deploy, sửa cấu hình và khởi động có khả năng ghi DB dưới đây **phải chờ chấp thuận**. Mỗi block chạy từ working directory được nêu. Không copy toàn bộ thành script chạy tự động. Không có bước seed/xóa dữ liệu trong quy trình này.

### 8.1. Sau khi chấp thuận runtime và cài dependency

1. Cài hoặc cung cấp đường dẫn Node 22.x x64 >=22.12.0 và npm đi kèm, mở shell mới; kiểm tra `node --version`, `npm --version`. Chọn MongoDB local riêng hoặc Atlas do người dùng chỉ định; không tự khởi tạo/chuyển DB đang dùng.
2. Xác nhận từng node_modules vẫn chưa tồn tại trước khi dùng npm ci, vì **npm ci có thể xóa node_modules sẵn có**. Nếu đã xuất hiện dữ liệu mới ở đó, dừng và thống nhất dùng thư mục staging mới, không ghi đè. Không thay lockfile để chữa lỗi cài đặt chưa rõ.

```powershell
# Working directory: D:\Web3-Internship-Management\client
npm ci
# Working directory: D:\Web3-Internship-Management\server
npm ci
# Working directory: D:\Web3-Internship-Management\contracts
npm ci
```

Các lệnh này tải dependency và có thể chạy install scripts; chưa được chạy. Không cài global Hardhat/Vite và không dùng npm install tại root repo.

3. AI: kiểm tra thư mục mới `.venv-runtime-stage1` **chưa tồn tại** trước khi tạo; giữ nguyên `ai-service/venv`. Phiên bản Python 3.13.5 hiện đã chạy smoke được; nếu chọn Python khác phải kiểm thử lại compatibility.

```powershell
# Working directory: D:\Web3-Internship-Management\ai-service
python -m venv .venv-runtime-stage1
.\.venv-runtime-stage1\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-runtime-stage1\Scripts\python.exe -m pip check
```

Nếu cần TestClient trong môi trường mới, xin phép cài dependency kiểm thử httpx riêng và chốt version; không mặc nhiên có sẵn như Python global. SBERT/torch và model download là gói phê duyệt riêng, không tự thêm vào requirements.

4. Người dùng cấp biến môi trường bí mật bằng cơ chế local của họ; không yêu cầu dán JWT/Pinata/URI có password vào chat. Không tự tạo/copy/ghi đè `.env`. Cần JWT_SECRET, DB URI đã xác nhận và PINATA_JWT cho flow nộp/cấp metadata; các URL public ở bảng phần 4 phải thống nhất.

### 8.2. Kiểm tra build/contract trước khi mở ứng dụng

Build có thể ghi/empty thư mục output `dist`; compile có thể ghi artifact/cache. Do quy tắc không ghi đè, chỉ chạy trong **thư mục staging mới được chấp thuận**, hoặc xác minh output đích hoàn toàn mới và đổi output qua cấu hình staging được duyệt. Không chạy lệnh build/compile mặc định trên output sẵn có trong repo. Không chạy hardhat clean.

```powershell
# client, trong staging mới được chấp thuận:
npm run lint
npm run build

# contracts, sau khi module/config được xác minh hoặc sửa có phê duyệt:
.\node_modules\.bin\hardhat.cmd --version
.\node_modules\.bin\hardhat.cmd compile
```

Dùng executable local để tránh npx tự tải khi chưa có package. `--version` chỉ kiểm tra CLI, chưa chứng minh config nạp được; compile mới đi qua config/compiler. Nếu config lỗi, dừng lấy mã lỗi; không dùng --force hoặc thay package tùy ý.

### 8.3. Thứ tự khởi động khi đã được phép dùng môi trường demo riêng

1. **MongoDB/Atlas đã được người dùng chỉ định:** xác minh host/port/auth read-only trước. Không có lệnh mongod dùng thư mục data hiện tại hay seed trong báo cáo. Nếu phải tạo instance/data directory mới, xin phê duyệt riêng.
2. **Blockchain local node**, terminal riêng trong contracts/staging, sau khi cấu hình hoạt động:

```powershell
.\node_modules\.bin\hardhat.cmd node --hostname 127.0.0.1 --port 8545
```

Hardhat node có thể in private key của tài khoản thử: không đưa output key vào báo cáo/chat, chỉ dùng tài khoản local test không có tài sản thật.

3. **Deploy Platform lên node local**, terminal khác, chỉ sau phê duyệt giao dịch và metadata. Script gốc ghi đè hai file ABI/address; nếu cấm ghi đè vẫn giữ nguyên thì phải dùng staging/cơ chế xuất file mới được duyệt trước, **không chạy trực tiếp lên repo hiện tại**:

```powershell
# Chỉ minh họa lệnh của script hiện có, chưa được phép chạy trực tiếp:
.\node_modules\.bin\hardhat.cmd run scripts/deploy.js --network localhost
```

Xác minh chainId 31337, code ở address và ABI/address hai phía trùng nhau; sau đó mới mở backend listener. Không deploy lên Sepolia vì chưa có cấu hình và phê duyệt network/gas/key.

4. **AI**, terminal trong ai-service, dùng môi trường đã được chấp thuận:

```powershell
$env:AI_ENGINE = 'tfidf'
.\.venv-runtime-stage1\Scripts\python.exe -B -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Lệnh source README `python main.py` cũng tồn tại nhưng bind 0.0.0.0 và bật reload; lệnh trên phù hợp kiểm tra local, không sửa source. Kiểm tra GET http://127.0.0.1:8000/health phải trả online và engine đúng; không nhận là BERT khi bert_active=false.

5. **Backend**, terminal trong server, sau khi người dùng cấp env và cho phép DB demo nhận auto-index/listener writes:

```powershell
npm start
```

Cần log MongoDB connected và `/api/health` dbState connected. `ipfsConfigured=true` chỉ cho biết token có giá trị, chưa chứng minh token hợp lệ hoặc upload thành công. Không mở UI trước khi chốt phạm vi ghi DB.

6. **Frontend**, terminal trong client, với VITE_API_URL/CORS thống nhất:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Nếu dùng host 127.0.0.1 thì CORS phải cho `http://127.0.0.1:5173`; nếu dùng localhost thì đồng bộ cả URL truy cập và CORS sang localhost. VITE_API_URL vẫn phải kết thúc `/api`. MetaMask chọn đúng node local, đúng ví đã đăng nhập JWT. Không click các tab có GET tự seed trước phê duyệt ghi DB.

AI và node blockchain không phụ thuộc lẫn nhau; thứ tự trên đưa tất cả dependency sẵn sàng trước backend và frontend. Chạy demo off-chain có thể bỏ node/deploy nhưng phải thể hiện rõ thiếu Web3, không báo mint token.

## 9. Kiểm thử an toàn

### Đã thực chạy ở giai đoạn 1

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Đọc JSON manifest/lockfile | Parse thành công, root dependencies khớp, peer bắt buộc có entry | Chưa npm resolution/native loading |
| Kiểm tra requirement Python | 6/6 version global thỏa constraint | Môi trường chung pip check vẫn lỗi package ngoài dự án |
| AST main.py | PASS | Chỉ cú pháp |
| ASGI GET /health | 200, TF-IDF fallback, bert_active=false | TestClient trong bộ nhớ, không bind port |
| ASGI POST /api/match React↔React | 200, similarity 89.2, skill ratio 100 | Một smoke case, không benchmark |
| ASGI POST /api/analyze-report Solidity/tests | 200, relevance 100, suggested 80, engine TF-IDF | Một smoke case, không xác nhận độ chính xác nghiệp vụ |
| ASGI POST /api/match body rỗng | 422 | Kiểm tra validation |
| Venv repo --version | FAIL: interpreter gốc không tồn tại | Không sửa venv |
| pip check global | FAIL: ultralytics/ultralytics-thop thiếu torch/torchvision | Không cài/sửa môi trường chung |
| Metadata JSON/ABI | Client=server, ABI=artifact, compiler build-info 0.8.24 | Chưa eth_getCode/receipt hoặc compile mới |
| TCP/OS/tool discovery | Kết quả phần 2 | Timeout và quyền hạn chế, không kết luận tuyệt đối |

### Phương án tiếp theo sau phê duyệt

- Backend: ưu tiên `node --check` từng file JS và kiểm tra config/validation với mock không kết nối DB. Chỉ import `app.js` nếu đã xác minh không connect/index/listener; dùng fake model để test middleware/401/403. Việc tạo test mới cần phê duyệt sửa source.
- Không import `server/test/helpers.js` hoặc chạy `npm test`, kể cả với `--test-name-pattern`: hooks trước/sau vẫn có thể xóa DB. Không đổi MONGODB_URI_TEST rồi cho rằng an toàn.
- MongoDB ping hoặc truy vấn đọc dùng tài khoản chỉ đọc có scope, không bootstrap Mongoose app thật; tránh autoIndex/autoCreate. Chỉ thực hiện sau khi xác nhận đích và quyền truy cập; chưa thực hiện trong đợt này.
- Contract: sau khi xử lý config và compiler trong staging, chạy file test cụ thể bằng local CLI với `--network hardhat` để dùng chain tạm trong bộ nhớ: `.\node_modules\.bin\hardhat.cmd test test/InternshipPlatform.test.js --network hardhat`. Không dùng localhost/testnet đang có dữ liệu, không reset node của người dùng. Đây là kế hoạch, chưa chạy.
- Frontend: lint không auto-fix; build trong output staging mới; kiểm tra UI với API mock để không kích hoạt GET tự ghi DB. Không mở trực tiếp UI trỏ vào DB thật.
- AI: tiếp tục TestClient, AI_ENGINE=tfidf trong process, python -B, không model download. Benchmark/BERT là bước riêng cần dataset/model và môi trường được duyệt.
- Tích hợp xuyên hệ thống chỉ chạy khi được phép ghi vào DB demo riêng; **không sử dụng test có thao tác xóa dữ liệu**, kể cả khi database riêng. Chưa chạy seed/migration/delete/drop/index changes để chuẩn bị test.

## 10. Các bước cần người dùng chấp thuận

| Gói phê duyệt | Phạm vi đề nghị | Chưa thực hiện |
| --- | --- | --- |
| A — Runtime Node | Cài hoặc cấp đường dẫn Node x64 thỏa engines, dùng npm đi kèm | Chưa tải/cài hoặc đổi PATH hệ thống |
| B — Dependency dự án | npm ci trong ba component khi đích mới/không có dữ liệu, cho phép lifecycle scripts cần thiết sau rà soát | Chưa cài, chưa sửa lockfile |
| C — Python riêng | Tạo môi trường mới, cài requirements; httpx test hoặc SBERT/model chỉ khi được duyệt riêng | Chưa tạo/thay venv, chưa cài torch/model |
| D — MongoDB demo | Chọn local instance mới hoặc Atlas, xác nhận DB/tài khoản chỉ đọc và phạm vi ghi cho boot/integration sau này | Chưa start/connect/seed hay thay DB |
| E — Cấu hình/code | Xác minh rồi sửa Hardhat module mode/script; bổ sung kiểm thử an toàn và cấu hình mẫu cần thiết | Chưa sửa bất kỳ source/config hiện có |
| F — Build/chain/boot | Staging mới cho output; tải compiler; node local/deploy, metadata mới; boot backend có auto-index/listener và UI có GET tự ghi | Chưa build/compile/deploy/start hoặc ghi metadata |
| G — Bí mật local | Người dùng tự cấp JWT/Pinata/URI qua cơ chế bảo mật; xác nhận chỉ trạng thái có/hợp lệ | Không tạo/thay `.env`, không in giá trị secret |

**Đã dừng ở bước xác minh và xuất báo cáo.** Không tự thực hiện gói nào ở trên. Không sửa sáu báo cáo cũ, source, database, dependency, lockfile hoặc Git; không xóa untracked. Chỉ thêm file Markdown này. Chờ người dùng xác nhận phạm vi tiếp theo trước khi cài đặt hoặc sửa chữa.

# GIAI ĐOẠN 2 — Build và cấu hình runtime

Ngày kiểm tra: **30/10/2026, Asia/Bangkok**. Branch **branch_1**, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`.
Runtime dùng kiểm tra: Node **22.23.4**, npm **10.9.9**, Windows x64. PATH chỉ bổ sung cho tiến trình, không sửa persistent PATH.

## 1. Kết luận

| Hạng mục | Kết quả đã thực kiểm tra | Giới hạn |
| --- | --- | --- |
| Frontend lint | Exit 0, **32 warnings, không có error** | Không auto-fix |
| Frontend type-check | Không có script type-check/tsc hoặc tsconfig dự án trong kết quả kiểm tra | Không tự thêm công cụ hay bật checkJs; build Vite không thay type-check |
| Frontend production build | **Thành công**, Vite 8.3.4, output mới được Git ignore | Chưa mở UI, chưa chạy nghiệp vụ hoặc HTTP tích hợp |
| Backend JavaScript | **31/31 file đạt node --check** | Chỉ cú pháp, không thực thi entrypoint/test |
| Backend JWT config | **Chưa sẵn sàng**: getter từ chối JWT_SECRET thiếu | Không tạo .env/secret thật |
| MongoDB | Chưa tìm thấy installation/service/process trong phạm vi kiểm tra; TCP 27017 ECONNREFUSED | Không connect bằng driver, không tạo database/index |
| AI/RPC local | TCP 8000/8545 ECONNREFUSED tại thời điểm kiểm tra | Không start AI hoặc Hardhat node |
| Hardhat version/config | **2.29.1; --help nạp được config ESM và các plugin** khi cache ghi trong vùng được phép | Lần đầu gặp EPERM của sandbox; không có HH19 được tái hiện |
| Solidity | **Compile mới thành công 2 contract bằng 0.8.24**, EVM paris, compiler errors/warnings rỗng | Compile bản sao byte-identical trong staging; không deploy/giao dịch/test chain |

Đã đọc lại các báo cáo audit, đặc biệt `GIAI_DOAN_1_NPM_INSTALL_RESULT.md`, và đối chiếu package/config/source hiện tại. Các báo cáo trước là lịch sử: nhận định “Node chưa có”, “dependency chưa cài”, “chưa build/compile” không còn là trạng thái hiện tại. Nghi vấn A13 về loader được cập nhật bằng kết quả thực ở mục 4; không tự đổi sang CommonJS.

## 2. Frontend

### Script và phạm vi

`client/package.json` có `lint=oxlint`, `build=vite build`, `dev=vite`, `preview=vite preview`. Không có script type-check/test. Dự án dùng JavaScript/JSX; các package @types/react không tự tạo bước kiểm tra kiểu.

Đã chạy từ client:

```powershell
npm.cmd run lint
npm.cmd run build -- --outDir dist/stage2-runtime
```

Trước build đã xác minh `client/dist/stage2-runtime` chưa tồn tại và `git check-ignore` xác nhận được ignore. Không build đè output cũ; không sửa vite.config.js, source hoặc cấu hình lint.

### Build

- Exit **0**, **2062 modules transformed**, built in **6.88s** (theo output Vite).
- Output: `client/dist/stage2-runtime/index.html` **1.22 kB**, CSS `assets/index-CvD4t5L8.css` **4.55 kB**, JS `assets/index-Nnxj_vo1.js` **576.04 kB** (**184.89 kB gzip**).
- **Một warning build:** một số chunk vượt 500 kB sau minification, do builtin:vite-reporter phát ra. Vị trí trực tiếp là bundle `client/dist/stage2-runtime/assets/index-Nnxj_vo1.js`; không có số dòng source riêng do đây là warning kích thước bundle.
- Hướng sửa dự kiến nếu được duyệt: đo bundle và xem xét dynamic import/chia màn hình ở `client/src/App.jsx` cùng cấu hình chunking phù hợp Vite 8; không chỉ tăng ngưỡng để che warning. Chưa sửa.

Build thành công chứng minh mã frontend có thể bundle trong môi trường hiện tại, không chứng minh ví, API, dữ liệu, IPFS hoặc chức năng on-chain đúng.

### Toàn bộ 32 lint warnings

Exit 0 không có nghĩa không còn warning. Bảng giữ tên rule và vị trí file:line:column theo output, lược phần help lặp lại.

| Vị trí | Rule | Warning |
| --- | --- | --- |
| client/src/components/Web3CertificateView.jsx:4:3 | eslint(no-unused-vars) | Identifier 'Award' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:6:3 | eslint(no-unused-vars) | Identifier 'ExternalLink' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:7:3 | eslint(no-unused-vars) | Identifier 'CheckCircle2' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:8:3 | eslint(no-unused-vars) | Identifier 'Clock' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:9:3 | eslint(no-unused-vars) | Identifier 'Cpu' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:11:3 | eslint(no-unused-vars) | Identifier 'FileCheck2' is imported but never used. |
| client/src/components/Web3CertificateView.jsx:39:5 | react(set-state-in-effect) | Calling setState synchronously within an effect can trigger cascading renders |
| client/src/components/Web3CertificateView.jsx:39:5 | react-hooks(exhaustive-deps) | React Hook useEffect has a missing dependency: 'fetchChainEvents' |
| client/src/components/DashboardView.jsx:6:3 | eslint(no-unused-vars) | Identifier 'BrainCircuit' is imported but never used. |
| client/src/components/DashboardView.jsx:7:3 | eslint(no-unused-vars) | Identifier 'CheckCircle2' is imported but never used. |
| client/src/components/DashboardView.jsx:8:3 | eslint(no-unused-vars) | Identifier 'Clock' is imported but never used. |
| client/src/components/DashboardView.jsx:10:3 | eslint(no-unused-vars) | Identifier 'Users' is imported but never used. |
| client/src/components/DashboardView.jsx:13:3 | eslint(no-unused-vars) | Identifier 'ExternalLink' is imported but never used. |
| client/src/components/DashboardView.jsx:19:10 | eslint(no-unused-vars) | Variable 'loading' is declared but never used. Unused variables should start with a '_'. |
| client/src/components/CvJdView.jsx:8:3 | eslint(no-unused-vars) | Identifier 'Users' is imported but never used. |
| client/src/components/CvJdView.jsx:11:3 | eslint(no-unused-vars) | Identifier 'CheckCircle2' is imported but never used. |
| client/src/components/CvJdView.jsx:12:3 | eslint(no-unused-vars) | Identifier 'AlertCircle' is imported but never used. |
| client/src/components/CvJdView.jsx:13:3 | eslint(no-unused-vars) | Identifier 'Clock' is imported but never used. |
| client/src/components/CvJdView.jsx:20:10 | eslint(no-unused-vars) | Variable 'matchingResults' is declared but never used. Unused variables should start with a '_'. |
| client/src/components/CvJdView.jsx:20:27 | eslint(no-unused-vars) | Variable 'setMatchingResults' is declared but never used. Unused variables should start with a '_'. |
| client/src/components/CvJdView.jsx:53:5 | react(set-state-in-effect) | Calling setState synchronously within an effect can trigger cascading renders |
| client/src/components/AttendanceView.jsx:6:3 | eslint(no-unused-vars) | Identifier 'Calendar' is imported but never used. |
| client/src/components/AttendanceView.jsx:10:3 | eslint(no-unused-vars) | Identifier 'AlertCircle' is imported but never used. |
| client/src/components/AttendanceView.jsx:11:3 | eslint(no-unused-vars) | Identifier 'Sparkles' is imported but never used. |
| client/src/components/AttendanceView.jsx:12:3 | eslint(no-unused-vars) | Identifier 'UserCheck' is imported but never used. |
| client/src/components/AttendanceView.jsx:16:42 | eslint(no-unused-vars) | Parameter 'user' is declared but never used. Unused parameters should start with a '_'. |
| client/src/components/AttendanceView.jsx:50:5 | react(set-state-in-effect) | Calling setState synchronously within an effect can trigger cascading renders |
| client/src/App.jsx:12:3 | eslint(no-unused-vars) | Identifier 'AlertCircle' is imported but never used. |
| client/src/App.jsx:19:3 | eslint(no-unused-vars) | Identifier 'Filter' is imported but never used. |
| client/src/App.jsx:25:22 | eslint(no-unused-vars) | Identifier 'getToken' is imported but never used. |
| client/src/App.jsx:186:5 | react(set-state-in-effect) | Calling setState synchronously within an effect can trigger cascading renders |
| client/src/App.jsx:186:5 | react-hooks(exhaustive-deps) | React Hook useEffect has a missing dependency: 'fetchTopics' |

Hướng sửa dự kiến: dọn import/state không sử dụng sau khi xác nhận chức năng; rà soát callback/effect để tránh cascade render và stale dependencies. Riêng `AttendanceView.jsx:16:42` cho thấy prop user chưa được dùng, cần kết hợp sửa scope dữ liệu theo user thay vì chỉ bỏ prop. Không tự chèn dependency/callback hoặc tắt rule trong giai đoạn kiểm tra.

## 3. Backend và các kết nối cấu hình

### JavaScript và entrypoint

Đã dùng `node --check` từng file dưới `server/src`, `server/test`, `server/scripts`: **31 file, 0 lỗi cú pháp**. Đọc file test/seed để xác minh cú pháp không thực thi các lệnh trong chúng.

- Entrypoint: `server/src/index.js`.
- Script `npm start`: `node src/index.js`.
- Script dev: `nodemon src/index.js`.
- `server/src/app.js` định nghĩa Express app; **không khởi động backend** trong đợt này.
- Test helper `server/test/helpers.js:15,22` có dropDatabase; **không chạy npm test**.
- Seed có dropIndex/deleteMany; không chạy.

### Kiểm tra config thực tế, không truy cập database

Chỉ nạp `server/src/config/env.js` và metadata thư viện; không import entrypoint hay mở listener. Mongoose connection.readyState quan sát được là **0 (disconnected)**. Không gọi mongoose.connect, không tạo model/index/collection để test.

- JWT_SECRET, MONGODB_URI, PORT, JWT_EXPIRES_IN, NONCE_TTL_SECONDS, CORS_ORIGIN, AI_SERVICE_URL, PINATA_JWT, BLOCKCHAIN_RPC_URL đều **unset trong process kiểm tra**.
- Getter `jwtSecret` tại `server/src/config/env.js:13` thực trả lỗi: **“JWT_SECRET chưa cấu hình hoặc quá ngắn (cần >= 16 ký tự)”**. Theo entrypoint, đây là lỗi chặn boot hiện tại nếu không cấp cấu hình.
- MONGODB_URI fallback `mongodb://127.0.0.1:27017/web3_internship` có protocol hợp lệ. Đây là default source, chưa phải kết nối thành công.
- API port default **5000**. CORS runtime default `*`; file example đề nghị `http://localhost:5173`. Cần thống nhất origin localhost/127.0.0.1, không dùng chúng thay nhau khi CORS giới hạn.
- AI_SERVICE_URL default `http://localhost:8000`; adapter `server/src/services/aiClient.js` POST đến `/api/match` và `/api/analyze-report`, timeout 5 giây. URL mặc định hợp lệ về cấu trúc, chưa có service lắng nghe để chứng minh Node→AI.
- PINATA_JWT thiếu: `ipfsConfigured=false`. Không chặn boot, nhưng sẽ chặn submit/complete (503) theo source.
- BLOCKCHAIN_RPC_URL default `http://127.0.0.1:8545`; listener chỉ được gọi sau DB connect, có thể ghi ChainEvent/Topic.
- Frontend VITE_API_URL default `http://localhost:5000/api`; chưa có env triển khai được cấp.
- Không có .env thật được tạo/sửa; không in giá trị secret. `server/.env.example` vẫn được giữ nguyên.
- Nạp được metadata `jsonwebtoken 9.0.3`, `mongoose 8.24.5`; chưa kiểm thử auth/API.

`index.js` gọi app.listen trước khi promise MongoDB hoàn tất: log cổng mở chưa đủ xác nhận backend sẵn sàng. Khi được phép chạy, phải kiểm tra dbState và từng dependency; ngay cả backend boot cũng có nguy cơ ghi DB qua auto-index/listener, nên chưa chạy.

## 4. Hardhat và compiler

### Loader/config thực tế

1. `hardhat.cmd --version` trả **2.29.1**.
2. Lần đầu `hardhat.cmd --help` trong sandbox gặp **EPERM: mkdir C:\\Users\\PC\\AppData\\Roaming\\hardhat-nodejs**, tại `contracts/node_modules/hardhat/src/internal/util/global-dir.ts:22` và `internal/context.ts:22`. Đây là hạn chế ghi cache/config global của môi trường kiểm tra, **không phải lỗi Solidity hay HH19**.
3. Đã xử lý trong phạm vi runtime kiểm tra bằng cách đặt APPDATA/LOCALAPPDATA **chỉ cho tiến trình** vào `contracts/node_modules/.cache/stage2-runtime/` (Git ignore), không sửa config/source hay registry. Đây là vùng dữ liệu riêng của công cụ, không thay các thư mục AppData thật.
4. Chạy lại `hardhat.cmd --help` **exit 0**: nạp được config hiện tại, hiện tasks coverage/typechain/ignition cùng các task chuẩn.
5. Config vẫn là `type:module` với import/export trong `hardhat.config.js`. **Không tái hiện HH19 trên Node 22.23.4 + Hardhat 2.29.1**. Installed loader `internal/core/config/config-loading.js` dùng require và lấy imported.default; kết quả thực tế cho tổ hợp hiện tại quan trọng hơn giả định từ phiên bản trước. Không kết luận mọi Node/Hardhat khác cũng chạy được.

### Bảo vệ artifacts gốc

`git ls-files` xác nhận các artifact JSON và `contracts/cache/solidity-files-cache.json` hiện có **đang tracked**. Vì vậy không compile mặc định trong root contracts để tránh ghi đè chúng.

Đã tạo thư mục mới được Git ignore:
`contracts/node_modules/.cache/stage2-compile/`.

Chỉ sao chép nguyên trạng `package.json`, `hardhat.config.js` và hai file .sol vào project tạm; **byte của cả bốn bản sao khớp file gốc**. Không sao chép/chạy deploy script, test, .env hoặc seed. Compiler/cache global cũng được chuyển vào `.runtime` dưới staging cho riêng tiến trình.

### Compile đã thực hiện

Trong staging, gọi CLI Hardhat local đã cài:

```powershell
& 'D:\Web3-Internship-Management\contracts\node_modules\.bin\hardhat.cmd' compile
```

Kết quả:

```text
Downloading compiler 0.8.24
Compiled 2 Solidity files successfully (evm target: paris).
```

- Exit **0**; compiler tải mới **0.8.24+commit.e11b9ed9**.
- Build-info mới: source_count **2**, compiler `output.errors=[]` (**không có warning/error Solidity**).
- Contract: `InternshipPlatform.sol`, `InternshipRegistry.sol`; config optimizer enabled, runs=200, không thay đổi.
- Output chỉ dưới staging: `artifacts/build-info/`, `artifacts/contracts/...`, `cache/solidity-files-cache.json` và cache runtime/compiler.
- Không npm install, không cài dependency mới; việc tải compiler là bước compile được phép. `solc` npm transitive 0.8.26 không được dùng thay compiler config.
- Không chạy Hardhat node, test, run/deploy, reset, provider transaction hoặc giao dịch on-chain.
- Chưa xác minh hoạt động chain/testnet, receipt/event, hay chức năng token. Compile không khắc phục việc contract chưa mint NFT/SBT.

Networks hiện có: hardhat và localhost `127.0.0.1:8545`, chưa có Sepolia. Metadata client/server chưa bị thay đổi. Cần đúng deployment/chainId/address/signer khi triển khai runtime sau này.

## 5. MongoDB trên Windows

### Kiểm tra thực tế

- Get-Command không tìm thấy mongod/mongosh/mongo; không thấy service hoặc process MongoDB trong kết quả kiểm tra.
- Không thấy thư mục thông dụng `C:/Program Files/MongoDB`, `.../Server`, `.../MongoDB Compass`.
- Không thấy entry MongoDB từ các nhánh registry Uninstall được kiểm tra.
- TCP localhost **27017 → ECONNREFUSED**, AI **8000 → ECONNREFUSED**, RPC **8545 → ECONNREFUSED**. Chỉ TCP handshake, không gửi MongoDB query hoặc JSON-RPC.
- Kết luận giới hạn: **chưa có MongoDB local khả dụng tại default endpoint trong môi trường kiểm tra**, không khẳng định không tồn tại installation ở mọi đường dẫn/host khác. MONGODB_URI chưa cấp nên chưa thể đánh giá Atlas riêng của người dùng.

### Hai phương án đề xuất, chưa thực hiện

| Phương án | Khi phù hợp | Chuẩn bị sau khi được duyệt |
| --- | --- | --- |
| MongoDB Community Server trên Windows | Demo một máy, ưu tiên kiểm soát local và giảm phụ thuộc mạng | Chọn bản tương thích Windows và driver, cài server/mongosh; xác nhận service/port; dùng data directory và DB demo riêng, không ghi đè dữ liệu có sẵn |
| MongoDB Atlas cloud | Cần nhiều thành viên hoặc backend triển khai truy cập chung | Dùng deployment do người dùng chỉ định; tài khoản DB, network access và URI bảo mật; xác minh DNS/TLS/kết nối trước khi cho app ghi |

Đề xuất cho demo local hiện tại là **Community Server** nếu người dùng đồng ý cài; Atlas là lựa chọn nếu cần dùng chung/triển khai cloud. Đây là lựa chọn vận hành, chưa phải lệnh cài đặt. Không chốt phiên bản server theo phỏng đoán hoặc tự tạo cluster/database/tài khoản.

Đã đối chiếu các lựa chọn với [hướng dẫn MongoDB Community cho Windows](https://www.mongodb.com/docs/manual/administration/install-community-windows/?win-method=wizard) và [hướng dẫn deployment MongoDB/Atlas](https://www.mongodb.com/docs/get-started/). Không chạy các lệnh tạo deployment trong tài liệu. Việc dùng transaction khi sửa nghiệp vụ sau này còn cần topology hỗ trợ, không được mặc định standalone đáp ứng mọi yêu cầu.

## 6. Những lỗi/warning còn ảnh hưởng bước tiếp theo

| Ưu tiên | Phát hiện | File/vị trí | Hướng xử lý dự kiến, chưa sửa |
| --- | --- | --- | --- |
| P0 runtime | JWT_SECRET thiếu, getter ném lỗi | server/src/config/env.js:13; src/index.js:6 | Người dùng cấp secret >=16 ký tự bằng cơ chế local bảo mật; không đưa secret vào chat/Git |
| P0 runtime | MongoDB default không lắng nghe | server/src/config/env.js:11; src/index.js connect | Chọn Community hoặc Atlas, xác nhận đích demo và phạm vi ghi trước boot |
| P1 tích hợp | AI/RPC chưa lắng nghe | server/src/services/aiClient.js; chainListener.js | Chuẩn bị service AI và network riêng theo phê duyệt, không nhầm fallback là dịch vụ thật |
| P1 nghiệp vụ | Pinata chưa cấu hình | server/src/config/env.js:23; services/ipfsService.js | Cấp token riêng nếu cần submit/complete thật; không tạo CID giả |
| P2 frontend | 32 lint warnings | Chi tiết mục 2 | Sửa có kiểm soát hook/scope dữ liệu/import khi được duyệt |
| P2 frontend | JS chunk 576.04 kB | client/dist/stage2-runtime/assets/index-Nnxj_vo1.js | Đo bundle, chia tải màn hình phù hợp; chưa sửa cấu hình |
| Môi trường kiểm tra | Hardhat global cache EPERM | global-dir.ts:22 | Đã vượt qua bằng cache riêng trong generated ignored dir; không phải lỗi config cần sửa |

Không đổi kết luận các lỗi nghiệp vụ A02–A26 khác chỉ vì build/compile đạt. Chưa kiểm thử UI/auth/API/Mongo/IPFS/chain xuyên hệ thống.

## 7. File sinh tự động, bảo toàn và Git

Các đường dẫn mới được Git ignore:
- `client/dist/stage2-runtime/`: frontend build.
- `contracts/node_modules/.cache/stage2-runtime/`: cache/config runtime Hardhat cho help.
- `contracts/node_modules/.cache/stage2-compile/`: bản sao tạm, compiler và compile outputs.

Không xóa các output này; không dùng hardhat clean. Đối chiếu **20 file gốc** bằng SHA-256 trước/sau compile (manifest/lockfile/config/contract/source metadata/artifact/cache) đều không đổi. `git diff --exit-code` đạt, không có thay đổi tracked; các untracked cũ được giữ nguyên. Chỉ bổ sung báo cáo Markdown này ngoài generated ignored output.

Không start backend, không test dropDatabase, không seed/migration, không tạo/sửa .env, không cài MongoDB, không tạo database/index, không deploy/giao dịch, không commit/push/merge.

## 8. Bước tiếp theo cần người dùng xác nhận

1. Chọn MongoDB Community local hoặc Atlas; chưa cài/tạo deployment.
2. Chốt cơ chế cấp JWT/Mongo URI/Pinata và phạm vi DB demo; không gửi secret trong chat.
3. Phê duyệt chuẩn bị môi trường AI riêng và bật service AI nếu cần, giữ TF-IDF/BERT rõ ràng.
4. Sau đó mới phê duyệt boot backend/kiểm tra HTTP và UI, vì boot có thể tạo index/listener ghi DB, UI có GET tự seed.
5. Sửa lint/các lỗi nghiệp vụ hoặc triển khai chain/testnet là phạm vi riêng; chưa thực hiện.

**Dừng sau Giai đoạn 2. Frontend build và Solidity compile đã đạt; runtime ứng dụng đầy đủ chưa sẵn sàng do cấu hình và dịch vụ còn thiếu.**


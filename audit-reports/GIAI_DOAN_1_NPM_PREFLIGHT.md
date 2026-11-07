# Kiểm tra trước khi cài dependency npm

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`.

## Kết quả thực tế

Đã đọc lại `GIAI_DOAN_1_RUNTIME.md` và đối chiếu manifest/lockfile/script/config hiện tại. Chỉ thêm báo cáo này; không chạy npm ci/install/audit fix, không sửa source/config/lockfile, không tạo .env, không khởi động backend, không deploy hay thay đổi database.

- Node **v22.23.4**, npm/npx **10.9.9**, nền tảng **win32 x64** hoạt động.
- PATH ban đầu của phiên công cụ chưa có Node; đã thêm đường cài vào **PATH của tiến trình kiểm tra**, không sửa lại PATH persistent/system. Các terminal công cụ mới có thể vẫn cần bước này. Đây không phải bằng chứng cài Node thất bại.
- Cả ba lockfile version 3 parse được; root dependencies/devDependencies khớp manifest. Toàn bộ dependency trực tiếp thỏa range khai báo.
- Đã dùng `semver` có sẵn trong bản npm đã cài, không tải package mới, để kiểm tra Node engines và peer dependencies bắt buộc trong lockfile. **Không phát hiện vi phạm Node engines áp dụng Windows x64, thiếu peer bắt buộc hoặc lệch version peer bắt buộc**. Không coi optional peer vắng mặt là lỗi.
- `node --check` **37 file JavaScript đạt**: server/src, server/test, server/scripts, scripts/tests/config Hardhat, config Vite và hai API client. Không thực thi file, không import dependency, không parse JSX/Solidity. Kết quả này không chứng minh Hardhat load config hay ứng dụng chạy được.
- Chưa có node_modules trong client/server/contracts. Không có package.json tại root repo; không cài tại root.
- Các biến JWT_SECRET/MONGODB_URI/PINATA_JWT/AI_SERVICE_URL/BLOCKCHAIN_RPC_URL/VITE_API_URL/CORS_ORIGIN đều unset trong process kiểm tra; không thấy .env thật tại root các thành phần. Chỉ kiểm tra trạng thái, không hiển thị secret.
- Metadata client/server giống nhau, chainId 31337, address `0x5FbDB2315678afecb367f032d93F642f64180aa3`; chưa xác minh deployment bằng RPC.

## Phiên bản dependency

Phiên bản sau là **lockfile**, chưa được cài vào dự án.

| Thành phần | Package và phiên bản |
| --- | --- |
| Client runtime | axios 1.20.0; ethers 6.17.0; lucide-react 1.55.0; react/react-dom 19.3.0 |
| Client dev | @types/react và @types/react-dom 19.3.0; @vitejs/plugin-react 6.1.2; oxlint 1.87.0; vite 8.3.4 |
| Server runtime | axios 1.20.0; bcryptjs 2.4.3; cors 2.8.6; dotenv 16.6.1; ethers 6.17.0; express 4.22.3; form-data 4.0.6; jsonwebtoken 9.0.3; mongoose 8.24.5; multer 1.4.5-lts.2 |
| Server dev | nodemon 3.1.14 |
| Contracts khai báo trực tiếp | hardhat 2.29.1; @nomicfoundation/hardhat-toolbox 6.1.2 |
| Contracts peer/transitive đáng chú ý | hardhat-ethers 3.1.3; hardhat-chai-matchers 2.1.2; ethers 6.17.0; chai 4.5.0; EDR 0.12.0-next.23; typescript 7.0.2; ts-node 10.9.2; solc npm 0.8.26 |

React/ReactDOM/types khớp peer range. Client và server khai báo range axios/ethers khác nhau nhưng lockfile chốt cùng version, không có bằng chứng xung đột chỉ vì range khác. Node hiện tại thỏa Vite/plugin/oxlint `^20.19.0 || >=22.12.0`, EDR `>=20` và các engine áp dụng còn lại.

## Rủi ro và cấu hình bổ sung

1. **Hardhat 2 + type=module + hardhat.config.js ESM:** còn nguy cơ HH19/module loading. Node --check chỉ chứng minh cú pháp, không xác minh loader. Chờ cài dependency rồi xác minh bằng CLI local; nếu lỗi, báo lại trước khi sửa config hoặc đổi version.
2. **Native Windows dependencies:** client cần bindings oxlint/rolldown/lightningcss, contracts cần EDR/solidity-analyzer. Giữ optional dependencies để không bỏ nhầm binary của nền tảng hiện tại.
3. **Install scripts:** package root ba thành phần không có preinstall/install/postinstall/prepare. Lockfile contracts đánh dấu install scripts cho keccak 3.0.4 và secp256k1 4.0.5; chúng có thể tạo native binary hoặc dùng toolchain. Chưa có nội dung package cài để kiểm tra toàn bộ hành vi script. Có thể cần build tools nếu prebuilt không hoạt động, nhưng chưa có lỗi thực để kết luận phải cài thêm. fsevents dành macOS không phải nhu cầu cài Windows.
4. **TypeScript 7.0.2/ts-node 10.9.2/TypeChain:** thỏa range peer rộng; vẫn cần kiểm chứng runtime/plugin sau cài, không tự hạ/nâng phiên bản theo phỏng đoán.
5. **Compiler:** Hardhat chọn Solidity **0.8.24**, optimizer 200; solc npm transitive 0.8.26 không thay thế lựa chọn compiler. Compile có thể tải compiler riêng, cần phạm vi phê duyệt sau.
6. **Network/secret:** registry/package download chưa được thử trong đợt này; không kiểm tra registry xác thực bằng cách in config chứa token. Không khẳng định npm ci sẽ thành công chỉ từ lockfile.
7. **Tái lập cài đặt:** npm config hiện tại ignore-scripts=false, legacy-peer-deps=false, force=false, engine-strict=false; omit/include rỗng. Không thay đổi các config này. Không dùng --force/--legacy-peer-deps/npm audit fix để bỏ qua lỗi.

## Scripts và mức độ an toàn

| Thành phần | Script/lệnh | Hiện trạng và tác động |
| --- | --- | --- |
| Client | npm run dev → vite | Có; chạy server, trình duyệt gọi backend có thể kích hoạt GET tự seed |
| Client | npm run build → vite build | Có; ghi/empty dist, cần output mới hoặc staging nếu không được ghi đè |
| Client | npm run lint → oxlint | Có; không có --fix; chưa chạy vì thiếu dependency |
| Client | npm run preview → vite preview | Có; cần build trước, thường 4173; CORS phải tương ứng |
| Client | test/deploy | Không có npm script tương ứng |
| Server | npm start / npm run dev | node / nodemon src/index.js; boot có thể tạo index và listener ghi DB |
| Server | npm test | Có; helper gọi dropDatabase lúc start/stop. **Không chạy**, kể cả lọc tên test |
| Server | npm run seed | Có dropIndex/deleteMany/update dữ liệu. **Không chạy** |
| Server | build/lint/deploy | Không có npm script tương ứng |
| Contracts | npm test | Placeholder echo lỗi và exit 1; không chạy ba test Mocha sẵn có |
| Contracts | dev/build/compile/deploy | Không có npm scripts; dùng CLI local Hardhat sau cài, chưa thực thi |
| Contracts | scripts/deploy.js | Deploy Platform, ghi đè metadata JSON client/server; không chạy |

Sau khi cài, có thể xác minh CLI local mà không dùng npx tự tải. Không chạy compile/test/deploy trong phạm vi chỉ phê duyệt npm ci. Cần kiểm tra config riêng trước khi sửa; các contract test cũng không được dùng node localhost đang chứa dữ liệu của người dùng.

## Các điều kiện để khởi động

| Phần | Điều kiện còn cần |
| --- | --- |
| Frontend | Dependency client có dev + optional; VITE_API_URL đúng base /api; backend sẵn sàng; CORS khớp localhost hoặc 127.0.0.1 và port; quyền mở UI có GET tự ghi DB |
| Backend | Dependency server; JWT_SECRET >=16 ký tự; MongoDB local/Atlas đích được xác nhận; quyền auto-index/listener trong DB demo; AI_SERVICE_URL đúng. Pinata token bắt buộc cho submit/complete, không phải điều kiện boot |
| AI phục vụ backend | Interpreter/môi trường đúng; AI TF-IDF đã smoke ở báo cáo trước, chưa HTTP Node→AI; venv repo cũ hỏng; SBERT cần dependency/model riêng |
| Smart Contract | Dependency contracts; loader config Hardhat hoạt động; compiler 0.8.24; node/RPC đúng chain; deployment thật; metadata đúng address/ABI; MetaMask đúng network/signer |

Chưa có cấu hình Sepolia trong hardhat.config.js; chỉ có hardhat và localhost RPC 127.0.0.1:8545. Backend dùng BLOCKCHAIN_RPC_URL, frontend fallback RPC đang hardcode nên không tự đổi theo biến backend. Không tạo .env hoặc sửa các địa chỉ trong lần kiểm tra này.

## Lệnh npm ci đề nghị và thứ tự

**Chưa thực thi.** Ba thành phần độc lập ở bước cài; đề nghị **server → client → contracts** để kiểm tra nền backend trước, frontend sau, toolchain/native contracts cuối. Cài package server không phải khởi động server và không tự chạy script seed/test theo manifest hiện tại.

Nếu terminal chưa nhận PATH mới, bước chuẩn bị process-only:

```powershell
$nodeRuntimePath = Join-Path $env:LOCALAPPDATA 'Programs\NodeJS\node-v22.23.4-win-x64'
$env:Path = $nodeRuntimePath + ';' + $env:Path
node --version
npm.cmd --version
```

Các lệnh chính xác, dùng đường dẫn tuyệt đối và npm.cmd để tránh PowerShell chặn npm.ps1:

```powershell
# 1. Backend dependencies
Set-Location 'D:\Web3-Internship-Management\server'
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund

# 2. Frontend dependencies
Set-Location 'D:\Web3-Internship-Management\client'
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund

# 3. Smart contract toolchain
Set-Location 'D:\Web3-Internship-Management\contracts'
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund
```

`--include=dev` giữ build/dev/test tools, `--include=optional` giữ native bindings; `--engine-strict` từ chối engines không tương thích thay vì cảnh báo; `--no-audit --no-fund` bỏ tác vụ audit/funding tự động. Không dùng --ignore-scripts mặc định vì native dependencies có thể cần lifecycle; phạm vi phê duyệt cần bao gồm scripts của package đã khóa, không chỉ tải archive.

Trước từng lệnh: kiểm tra lại manifest/lockfile, node_modules và Git. Nếu node_modules đã xuất hiện từ thao tác khác, **dừng trước npm ci** vì npm ci có thể xóa nội dung đó. Nếu cài lỗi/ERESOLVE/native failure: lưu lỗi có che secret, dừng và báo lại; không sửa version/lockfile, không cài thêm build tools, không chạy audit fix. Khi cài thành công: kiểm tra npm ls và binary/version cần thiết; không start service/build/compile/deploy trong gói cài này.

## Thao tác làm thay đổi dữ liệu hoặc cấu hình

- **npm ci:** tạo/xóa lại node_modules, tải và ghi npm cache/log; dependency install scripts có thể tạo native output. Theo thiết kế không cập nhật manifest/lockfile; vẫn kiểm tra hash trước/sau. Không bảo đảm mọi third-party lifecycle script chỉ chạm node_modules khi chưa xem code package thực.
- **npm install/audit fix:** có thể thay package-lock.json/package.json; chưa được phép.
- **npm config set, đổi PATH persistent, tạo .env:** thay cấu hình; chưa thực hiện trong đợt này. Việc thêm PATH chỉ trong process kiểm tra không đổi registry.
- **Client build/Hardhat compile:** ghi hoặc thay output/cache/artifact, compile có thể tải compiler; chưa thực hiện.
- **Deploy contract:** giao dịch thay trạng thái chain và script ghi đè hai file metadata; chưa được phép.
- **Backend start/UI:** auto-index/listener và các GET tự seed có thể ghi DB; chưa được phép trong gói cài dependency.
- **Server npm test/seed:** có thao tác xóa dữ liệu/index; không chạy dưới yêu cầu hiện tại.

## Nội dung xin phê duyệt

Chỉ xin phép chạy **ba lệnh npm ci ở trên, theo thứ tự server → client → contracts**, gồm tải package, ghi node_modules/cache và lifecycle scripts cần thiết. Sau đó chỉ xác minh cây dependency/binary và báo kết quả. Không bao gồm sửa source/config/lockfile, tạo .env, build/compile, khởi động service, test có DB, deploy, seed, Git commit/push/merge hoặc cài bổ sung ngoài lockfile. **Dừng tại đây và chờ người dùng phê duyệt.**

# Clone và chạy Internova trên máy thành viên

Hướng dẫn Windows PowerShell, chạy từ **root repository** trừ khi ghi rõ. Không cần database/cloud/mật khẩu của máy tác giả. Mỗi người có MongoDB TEST và tài khoản riêng; database dùng chung sẽ cấu hình sau. Không đưa `manual-login.txt`, `.env`, vault hoặc dữ liệu MongoDB vào Git.

## 1. Clone và chuẩn bị

```powershell
git clone --branch branch_1 https://github.com/nguyenvietanbinh-art/Web3-Internship-Management.git
Set-Location Web3-Internship-Management
node --version
npm.cmd --version
python --version
```

Môi trường đã kiểm: Node22.23.4/npm10.9.9, MongoDB8, Windows Python3.13. Cài MongoDB Community riêng nếu chưa có. Cần Internet cho lần tải dependency/compiler/model. BERT cần tối thiểu1GiB RAM available khi nạp, không chỉ RAM tổng. Chưa xác minh toàn bộ quy trình clone mới trên Linux/macOS; staff vault dùng Windows DPAPI.

**Chỉ trên clone mới**, cài lần lượt, lỗi ở bước nào thì dừng:

```powershell
Push-Location server
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund
Pop-Location
Push-Location client
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund
Pop-Location
Push-Location contracts
npm.cmd ci --include=dev --include=optional --engine-strict --no-audit --no-fund
Pop-Location
```

Không chạy lại contracts `npm ci` trên máy đã có runtime: nó thay node_modules, nơi cache hiện chứa model/vault/deployment. Không `npm audit fix`, không chạy `database/seed.mongodb.js` hoặc script seed cũ.

## 2. MongoDB local

Trong terminal riêng, chỉ khi27017 trống, chọn một thư mục dữ liệu mới ngoài repository, ví dụ `$env:LOCALAPPDATA\InternovaTeamMongo`. Không dùng thư mục có dữ liệu cũ hoặc start thêm nếu Mongo đã chạy.

```powershell
$dbpath = Join-Path $env:LOCALAPPDATA 'InternovaTeamMongo'
# Nếu đường dẫn đã tồn tại/có dữ liệu: dừng và kiểm tra, không xóa.
New-Item -ItemType Directory -Path $dbpath -ErrorAction Stop
mongod --bind_ip 127.0.0.1 --port 27017 --dbpath $dbpath
```

`mongod` phải có trong PATH; nếu chưa, dùng đường dẫn đầy đủ tới binary đã cài. Giữ terminal này chạy.

## 3. AI và PDF parser (terminal riêng)

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ai-service/requirements.txt
.\.venv\Scripts\python.exe -m pip install pypdf==6.21.4
.\.venv\Scripts\python.exe -m pip install -r ai-service/requirements-nlp.txt
New-Item -ItemType Directory -Force contracts/node_modules/.cache/phase4-20261031
.\.venv\Scripts\python.exe ai-service/evaluation/download_model.py --target contracts/node_modules/.cache/phase4-20261031/model --approved-public-artifacts
$env:NLP_MODEL_DIR = (Resolve-Path 'contracts/node_modules/.cache/phase4-20261031/model').Path
Push-Location ai-service
..\.venv\Scripts\python.exe -B -m uvicorn main:app --host 127.0.0.1 --port 8003 --no-access-log
```

Các pip requirements nền có khoảng phiên bản; resolve trên máy mới chưa được kiểm chứng toàn bộ. NLP pinned dành runtime đã kiểm; lỗi wheel/phiên bản thì dừng và gửi lỗi, không tự đổi model. Download khoảng121.59MiB artifacts có hash kiểm; model không nằm trên Git. Thiếu model/RAM: SBERT BLOCKED, không fake score; TF-IDF vẫn là baseline. Risk classifier chưa huấn luyện, chưa có metrics chất lượng trên nhãn độc lập.

## 4. Hardhat local (terminal riêng)

```powershell
Set-Location contracts
npm.cmd run compile:local
npm.cmd run node:local
```

Terminal khác ở `contracts`, **chỉ deploy lần đầu trên chain local mới**, metadata output không được tồn tại:

```powershell
New-Item -ItemType Directory -Force node_modules/.cache/phase5-20261031
npm.cmd run deploy:local
```

Chain31337, RPC18545. Không public chain/ví thật. Giữ RPC chạy; reset chain làm metadata/receipt/DB cũ không khớp. Không chép deployment.json từ máy tác giả hoặc giữa các máy.

## 5. Chuẩn bị database TEST mới và Backend

Terminal PowerShell mới ở root. Chọn hậu tố riêng khi chạy lượt mới; không tái sử dụng DB có dữ liệu với bước khởi tạo. Các lệnh sau **tạo index** trong TEST, không import dữ liệu của tác giả.

```powershell
$env:NODE_ENV = 'test'
$env:MONGODB_URI_TEST = 'mongodb://127.0.0.1:27017/web3_internship_test_phase1_team_first'
$env:MONGODB_URI_TEST_ALLOWLIST = $env:MONGODB_URI_TEST
$env:CV_PARSER_PYTHON = (Resolve-Path '.venv/Scripts/python.exe').Path
$indexDir = 'contracts/node_modules/.cache/team-first-indexes'
node server/scripts/unified-index-migration.cjs plan $indexDir
# Chỉ tiếp tục khi plan thành công và database đúng, mới/rỗng.
node server/scripts/unified-index-migration.cjs apply $indexDir --maintenance
# Chỉ tiếp tục nếu apply thành công.
node server/scripts/start-unified.cjs contracts/node_modules/.cache/team-first --test-staff
```

Backend57407, tự tạo JWT ngẫu nhiên trong process, tắt startup autoIndex/autoCreate. `--test-staff` cấp rõ ràng một Admin và company/mentor qua API thật nếu chưa có Admin; không seed nghiệp vụ. Mật khẩu riêng được bảo vệ DPAPI. Mongo/AI/RPC phải đúng như trên. Thư mục runtime phải mới, không chép runtime.json/vault từ máy khác.

## 6. Frontend và file đăng nhập

Terminal mới ở root:

```powershell
$env:VITE_API_URL = 'http://localhost:57407/api'
Push-Location client
npm.cmd run dev -- --host 127.0.0.1 --port 5182 --strictPort
```

Mở **http://localhost:5182/**. Một URL cho mọi role. Terminal khác ở root, xuất tài khoản **chỉ trên máy này**:

```powershell
node scripts/demo/export-login.cjs contracts/node_modules/.cache/team-first/runtime.json --export-local-passwords
notepad contracts/node_modules/.cache/team-first/manual-login.txt
```

File chứa email/password TEST của Admin (`admin`), Doanh nghiệp (`company`), Giảng viên (`mentor`). Đăng xuất trên website rồi nhập email/password role cần dùng tại `/login`. Không cần ví để dùng CV/JD/task/báo cáo. Không push file password; script không ghi đè file đã có. Sinh viên tự đăng ký tại `/register`; Admin cấp account khác trong Tài khoản & phân quyền.

Tạo JD bằng company → CV/ứng tuyển bằng student → company duyệt → admin tạo kỳ → company/admin phân công → task/log/time/report → đánh giá → link ví TEST sau → Web3 đủ điều kiện. Xem [checklist nghiệp vụ](FULL_WEBSITE_TEST_GUIDE.md); thay đường dẫn runtime cục bộ `unified-20261102` trong hướng dẫn lịch sử bằng `team-first`, hoặc dùng email/password từ file trên, không cần helper browser.

Google live/Pinata live chưa cấu hình: BLOCKED. Không clone secrets từ người khác. Camera/GPS/MetaMask thật cần kiểm thiết bị. Không tuyên bố mọi tích hợp PASS chỉ vì health200. Database cloud **chưa tạo/cấu hình**, mỗi máy độc lập nên dữ liệu không tự đồng bộ.

## 7. Kiểm tra và khởi động lại

Frontend: trong client chạy `npm.cmd run lint`, `npm.cmd run build` (dist ignored). Health: http://localhost:57407/api/health. Không chạy test Mongo trên URI đang demo; test phải có DB TEST riêng và exact allowlist. Xem scripts/test guard và [kết quả đã chạy](TEST_RESULTS.md), không thay NODE_ENV sang test để bypass cloud safety.

Máy thiếu RAM có thể gặp Rolldown `out of memory` khi build. Lượt đóng gói này lint PASS, build mặc định FAIL do RAM; chạy lại với giới hạn một luồng PASS (không thay dependency/source):

```powershell
$env:RAYON_NUM_THREADS = '1'
npm.cmd --prefix client run build -- --outDir dist/team-release
```

`start-unified.cjs` yêu cầu output runtime mới. Khi khởi động lại giữ DB/vault/deployment cũ, chọn thư mục runtime output mới, bỏ `--test-staff` nếu account đã có; dùng email/password đã lưu cục bộ. Giữ nguyên biến môi trường DB allowlist. Không xóa DB/metadata hoặc deploy lại để chữa lỗi. Nếu restart cả Hardhat thì chain cũ mất, Web3 báo mismatch; giữ bằng chứng và dùng lượt TEST mới sau khi xác định kế hoạch, không giả receipt cũ còn hợp lệ.

Mật khẩu đăng nhập là của ứng dụng, khác mật khẩu MongoDB và Gmail. Git không cung cấp sẵn tài khoản cloud/database/khóa. Không có yêu cầu chia sẻ mật khẩu hiện tại của tác giả.

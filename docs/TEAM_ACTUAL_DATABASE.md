# Nhóm chạy source và đúng database hiện có

Đây là bản chụp **database thật trên máy tác giả**, giữ dữ liệu đã chỉnh, ID và password hash hiện có. Không thay bằng seed. Main có 31 collection/2.561 bản ghi; QA có 32 collection/3.812 bản ghi tại thời điểm trong manifest. Các tình huống thực hành trong DB vẫn là dữ liệu tổng hợp, không trở thành thành tích người thật.

Mỗi máy có bản khôi phục riêng; GitHub không phải MongoDB cloud và không tự đồng bộ thay đổi giữa các thành viên.

## 1. Source và database không mã hóa

```powershell
git clone --branch branch_1 https://github.com/nguyenvietanbinh-art/Web3-Internship-Management.git
Set-Location Web3-Internship-Management
```

Theo yêu cầu của chủ dự án, `database/shared-snapshot/main.snapshot.json` và `qa.snapshot.json` chứa nguyên dữ liệu hiện có, password hash và nội dung các file tài khoản đã biết, không mã hóa. Restore mặc định đọc JSON, không cần khóa giải mã. Người có quyền đọc repository có thể đọc dữ liệu và tài khoản này. Các bản `.enc` cũ vẫn được giữ để bảo toàn lịch sử; không cần dùng chúng. `.env`, JWT signing secret, private key và khóa mã hóa riêng của máy vẫn nằm ngoài Git.

## 2. Cài dependency trên clone mới

Môi trường đã kiểm: Node22.23.4/npm10.9.9, Python3.13, MongoDB8. Dùng PowerShell; lỗi bước nào dừng bước đó. Không chạy contracts npmci trên workspace tác giả đang có cache/runtime riêng.

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

## 3. MongoDB và khôi phục dữ liệu

Cần MongoDB Community Server; Compass chỉ là giao diện quản lý. Trên máy mới, dùng thư mục dữ liệu mới ngoài repo, cổng27018/replicaSetinternovaTestRs. Kiểm cổng trước: `Get-NetTCPConnection -LocalPort 27018 -State Listen`. Không khởi động trùng hoặc dùng dbpath của Mongo khác.

Terminal Mongo, thay `mongod` bằng đường dẫn thực nếu chưa có trong PATH:

```powershell
$teamData=Join-Path $env:LOCALAPPDATA 'InternovaTeamMongoRs'
New-Item -ItemType Directory -Path $teamData -Force | Out-Null
mongod --bind_ip 127.0.0.1 --port 27018 --replSet internovaTestRs --dbpath $teamData --wiredTigerCacheSizeGB 0.25
```

Terminal khác tại root repo:

```powershell
node scripts/team/init-mongo.cjs
node scripts/team/database.cjs restore main --verify-only
node scripts/team/database.cjs restore main
```

Init chỉ khởi tạo server local đúng tham số và chưa có DB nghiệp vụ; đã cấu hình thì không đổi. Restore từ chối nếu DB đích có bất kỳ collection, không drop/merge/ghi đè. Khi thấy REFUSE_NONEMPTY_DATABASE, giữ dữ liệu và kiểm tra môi trường; không xóa để ép restore.

Giữ nguyên ID/quan hệ/tệpCV/task và indexes; so hash từng collection sau restore trước khi bật lại TTL indexes. Sau đó MongoDB có thể tự hết hạn các nonce/reauth cũ theo TTL vốn có, không phải script xóa dữ liệu nghiệp vụ. Các file tài khoản được trích xuất vào `.team/login-main/`, mở bằng VSCode/Notepad. Không reset mật khẩu. Nếu chủ tài khoản từng đổi mật khẩu sau khi tạo file login, phải dùng mật khẩu mới do chủ tài khoản cung cấp; không suy ra plaintext từ hash.

Compass: `mongodb://127.0.0.1:27018/?replicaSet=internovaTestRs`, chọn `internova_demo_cunhan_kysu_20261107`.

## 4. AI/BERT và PDF parser

Model+tokenizer khoảng121.6MiB, không đưa binary lớn vào Git. Tải từ nguồn chính thức với revision/hash cố định; không train lại. Cần ít nhất1GiB RAM available khi cold-load,256MiB lúc inference.

```powershell
python -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r ai-service/requirements.txt -r ai-service/requirements-nlp.txt pypdf
& .\scripts\team\download-model.ps1
& .\scripts\team\start-ai.ps1
```

Đây là các lệnh thành viên tự chạy trên máy mình; chưa kiểm toàn bộ clean-install ở máy khác. Không bỏ guard/hash. Bộ phân loại rủi ro thử nghiệm tổng hợp95kB có sẵn, chỉ bật bằng `start-ai.ps1 -ExperimentalRisk`; không coi đó là BERT fine-tune hoặc bộ chấm điểm đã kiểm định.

## 5. Backend và Frontend

Terminal Backend:

```powershell
node scripts/team/start.cjs main
```

Terminal Frontend:

```powershell
$env:VITE_API_URL='http://localhost:57418/api'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5188 --strictPort
```

Mở **http://localhost:5188**. Dùng tài khoản `.team/login-main/`. Backend không seed/migration/index tự động; JWT mới riêng máy lưu `.team/jwt-main.txt`, không cần JWT của tác giả. Không tạo.env chứa thông tin thật. Health: `http://localhost:57418/api/health`; BERT status: `http://127.0.0.1:8003/api/v1/nlp/status`.

## 6. Thử đúng báo cáo Phúc và QA

QA là database TEST hiện có được chụp nguyên, không thay main:

```powershell
node scripts/team/database.cjs restore qa
node scripts/team/start.cjs qa
```

Terminal Frontend QA:

```powershell
$env:VITE_API_URL='http://localhost:57419/api'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5189 --strictPort
```

Mở http://localhost:5189, file login Phúc trong `.team/login-qa/` có tên chứa student-report-assessment. Mentor chọn bài Phúc để xem7điểm; student có self80/AI77.5/official chưa xác nhận. Giảng viên sửa/nháp/xác nhận rồi trường chốt theo quy định. Xem `docs/INTERNOVA_PRODUCTION_READINESS/AI_AUTO_GRADING/`.

```powershell
node --test --test-concurrency=1 server/test/report-auto-scoring.unit.test.js server/test/report-auto-grading.integration.test.js
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
```

Test mới tự tạo fixture trong QA có marker/allowlist, không xóa DB. Các script lịch sử trongcache tác giả không bắt buộc để chạy web trên máy nhóm.

## 7. Ví, Hardhat và IPFS

Email/CV/ứng tuyển/task/báo cáo không đòi ví. Student/company liên kết MetaMask bằng mật khẩu website và chữ ký; mentor/admin không cần ví trình duyệt. Chỉ dùng víTEST, không ví/private key thật.

Nếu cổng18546 trống, terminal blockchain mới:

```powershell
node contracts/scripts/workflow-hardhat.cjs node --hostname 127.0.0.1 --port 18546
```

Terminal khác, deploy local mới một lần, metadata phải chưa tồn tại:

```powershell
New-Item -ItemType Directory -Path contracts/node_modules/.cache/team -Force | Out-Null
$env:LOCAL_DEPLOYMENT_OUTPUT=Join-Path (Get-Location) 'contracts/node_modules/.cache/team/sbt-deployment.json'
node contracts/scripts/workflow-hardhat.cjs run scripts/deploy-local.cjs --network localhost
```

Sau deploy nạp lại đúng team Backend để đọc metadata, giữ Mongo chạy. Node mới không có lịch sử blockchain cũ: tx/SBT trong DB không tự VERIFIED. Cần luồngQA mới để anchor/mint thật hoặc RPC gốc được phép; không reset node đang dùng/sửa txhash để làm đẹp. Compile lần đầu cần compiler/cache được tải bởi Hardhat khi thành viên chủ động chạy.

IPFS cần Pinata/key mã hóa do nhóm quản lý riêng; thiếu cấu hình thì BLOCKED. Hash không đồng nghĩa uploadIPFS. Keys của dịch vụ ngoài không nằm trong snapshot/Git. Nếu tệp cũ cần khóa mã hóa, chủ sở hữu phải cung cấp riêng đúng keyId; không tạo khóa mới để giả vờ đọc được.

## 8. An toàn và giới hạn

Ai có quyền đọc repository có thể đọc toàn bộ dữ liệu/tài khoản trong bản JSON không mã hóa. Không commit `.team/`. Restore gián đoạn giữ nguyên phần đã ghi để kiểm tra, không tự xóa hoặc ghi đè. Đã restore hai DB TEST mới và kiểm document hash/indexes khớp trên máy tác giả. Chưa kiểm toàn bộ clone/cài dependency trên Windows khác/Linux/macOS, không tuyên bố PASS cho các máy đó. GoogleMaps/Pinata live, kiểm định điểmAI bằng chuyên gia và lịch sửchain trên máy khác vẫn có giới hạn. Không tắt Mongo27018 khi web đang dùng; đóng Compass không dừng Mongo.

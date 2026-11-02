# Hướng dẫn cài đặt và chạy

> **Clone mới trên máy thành viên:** dùng [TEAM_QUICKSTART.md](TEAM_QUICKSTART.md), một website5182 và tài khoản tạo riêng. Các cổng/cache/máy tác giả bên dưới là lịch sử các phase.

Ngày 01/11/2026 (+07). Hướng dẫn này không tự cài bất kỳ thành phần nào. Máy hiện tại đã có dependency/runtime/model; không cần chạy lại npm ci hoặc cài model để kiểm tra demo.

## Mở nhanh trên máy hiện tại

Mongo 27017, NLP 8003, Hardhat 18545 đã chạy; manual demo Backend 57405/Frontend 5177 đã chuẩn bị. Làm mục 1 của DEMO_SCRIPT để mở Edge riêng và chọnvai. Metadata: contracts/node_modules/.cache/phase7-20261031/manual/demo.json. Hồ sơInspection 5175/57404 khác dataset manual, không trộn.

```powershell
Set-Location D:Web3-Internship-Management
node --version
npm.cmd --version
python --version
Invoke-RestMethod http://127.0.0.1:57405/api/health
Invoke-RestMethod http://127.0.0.1:8003/api/v1/nlp/status
```

## Stack và yêu cầu đã kiểm

Windows/PowerShell, Node 22.23.4/npm 10.9.9; React 19/Vite 8, Express 4/Mongoose 8, MongoDB 8.0.34; CPython 3.13/FastAPI/scikit-learn, ONNXRuntime 1.31.1/tokenizers 0.23.3; Hardhat 2.29.1/Solidity 0.8.24, ethers 6. Exact npmversions nằm tronglock. ModelCPU cần ít nhất 1024 MiBavailable khi coldload và 256 MiB khihot inference; tổngRAMmáy~7,4 GiB đã chịuáp lực. Đừng coi 8 GBtổng làđủbộnhớtrống. GPUkhông bắt buộctrongsetupđã kiểm.

Helperdemo cầnWindowsCurrentUserDPAPI; chưa portableLinux/macOS. BasePython requirements dùng>=, chưalocktoànbộ; cài máy mới phải xác minh dependencies, khôngcamkếtpipresolvegiốngmáy này. Wheelhash NLP lock làWindowsCPython 3.13 cụthể. Không tự nângNode/Hardhat/toolbox để né lỗi.

## Máy mới: cài dependency có kiểm soát

Giữ đúngbranch/lockfile, kiểmgitstatus trước. Lệnhchỉdànhchobảnclone mới/đãbackup, không phảihướngdẫnchạylạitrênmôi trườnghiện tại:

```powershell
Set-Location server
npm.cmd ci --include=dev --include=optional --engine-strict --ignore-scripts --no-audit --no-fund
Set-Location ../client
npm.cmd ci --include=dev --include=optional --engine-strict --ignore-scripts --no-audit --no-fund
Set-Location ../contracts
# CHỈ ở clone mới, khi node_modules/.cache chưa chứa model/demo/evidence:
npm.cmd ci --include=dev --include=optional --engine-strict --ignore-scripts --no-audit --no-fund
Set-Location ..
```

**npm ci xóa/thay node_modules.** Trong dự ánnày model,compiler,evidence vàvaultTEST đang nằm ở contracts/node_modules/.cache. Không chạycontractsci nếu chưabackupcache ra vị trían toàn; tuyệtđốikhông coi đây là lệnhcleanup. Không npm audit fix/--force, seed.js hoặc database/seed.mongodb.js. Không xóauntracked. .env thật khôngtạo/tựghi đèbởihướngdẫnnày.

Mongo: dùngMongoCommunityđãcàihoặc mộtmáychủlocalđã duyệt, bind 127.0.0.1:27017. Kiểmcổng/process trước; khôngstartthêmmongodhoặcthaydbpathcũ. Máy mới chọnthưmụcdata ngoài Git vàtrống, tạo trước có chủ đích; khôngbậtWindowsservice/startupngầm. AppTEST sửdụngdatabaseconriêngtrênserver 27017, khônggốc/demo. Atlas/cloud chưa đượcnghiệm thu vàkhông tựdùngtrongdemo.

Python: dùngvenvcôlậptrên máy mới; base ai-service/requirements.txt cầngiảiquyếtxungđộtvàkiểmtrước. PDFparser dùngpypdf 6.21.4 ởtargetcontracts/node_modules/.cache/phase 3-20261031/python-deps; DOCXstdliblextractor. NLPwheelđãpin trongrequirements-nlp-lock.txt. Chỉkhiđược cài trênWindowsCPython 3.13 phùhợp:

```powershell
python -m pip install --target contracts/node_modules/.cache/phase4-20261031/python-deps --no-deps --only-binary=:all: --require-hashes -r ai-service/requirements-nlp-lock.txt
# Parser PDF, trong target riêng; không sửa Python global:
python -m pip install --target contracts/node_modules/.cache/phase3-20261031/python-deps --no-deps pypdf==6.21.4
```

Các lệnh pip trên là hướngdẫn thao tác sauphê duyệt, chưa đượcchạylạiởPHASE 7; cầnbaseNumPy/packaging/huggingface-hubtương thích. KhôngcàiTorch/modelAIthêm.

## Model BERT và AI service

Model thật: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2, revision e8f8c211226b894fcb81acc59f3b34ba3efd5f42, graph ONNX int8 CPU và tokenizer, tổng 121,59 MiB. SHA256 model: 783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672; tokenizer: 2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8. Engine kiểm manifest/hash trước nạp, không download khi API request.

Chỉ tải lầnđầu vào targetchưatồn tại, saukiểmtàinguyên/quyềndownload:

```powershell
python ai-service/evaluation/download_model.py --target contracts/node_modules/.cache/phase4-20261031/model --approved-public-artifacts
```

TerminalAI mới (không chạyinstance 2 nếucổng 8003 đangcó):

```powershell
$env:PYTHONPATH = (Resolve-Path 'contracts/node_modules/.cache/phase4-20261031/python-deps').Path
$env:NLP_MODEL_DIR = (Resolve-Path 'contracts/node_modules/.cache/phase4-20261031/model').Path
Set-Location ai-service
python -B -m uvicorn main:app --host 127.0.0.1 --port 8003 --no-access-log
```

Statusready=false trước lầninferenceđầucó thể làlazyload. RAM<1 GiB →503/guard, khônghạguard; TF-IDFcó thểdùngđộc lập. Sbertreadykhôngchứngminhqualitymetrics; riskclassifierNOT_TRAINED vẫnđúng.

## Hardhat local

NếuRPC 18545 đangchạy: giữnguyên, khôngreset/redeploy. Nếuchưa có, trongterminalriêng:

```powershell
Set-Location contracts
npm.cmd run compile:local
npm.cmd run node:local
```

Terminalkháctrongcontracts, metadataOUTPUTmớichưatồn tại:

```powershell
$newDeployDir = Join-Path (Get-Location) 'node_modules/.cache/my-new-local'
if (Test-Path $newDeployDir) { throw 'Chọn thư mục deployment mới, không ghi đè dữ liệu hiện có' }
New-Item -ItemType Directory -Path $newDeployDir | Out-Null
$env:LOCAL_DEPLOYMENT_OUTPUT = Join-Path $newDeployDir 'deployment.json'
npm.cmd run deploy:local
```

Deployscriptchỉ localhost/31337, khôngmainnet. ChọnWEB 3_LOCAL_DEPLOYMENTtrỏmetadata này choBackendtrướcstart. Mặcđịnhmetadata cũ làphase5-20261031/deployment.json; restartHardhat làm mất in-memorychain vàđổihardhatInstanceId, địa chỉdeploytấtđịnhcó thểgiốngnhưngkhông phảichaincũ. Dùngmetadata+DBTEST mới, giữrecords/evidencecũ; khôngfakehash hoặcforceVERIFIED. CJSconfiglocal tránhloader ESMlegacy; dùngnpm scriptslocal, không tựsửa hardhat.config.js.

## Tạo lượt demo thủ công mới sau reboot hoặc khi muốn làm lại

Chỉ khi 57405/5177 trống; khôngkillprocesskhôngrõ. Chạy từroot, rundirmới mỗi lần (khôngxóa/ghi đèdữ liệulượttrước):

```powershell
$demoRunDir = Join-Path (Get-Location) ('contracts/node_modules/.cache/phase7-demo-' + (Get-Date -Format yyyyMMdd-HHmmss))
# Nếu dùng deploymentmới, set env này trước:
# $env:WEB3_LOCAL_DEPLOYMENT = 'đường-dẫn-local-metadata-đã-verify'
node scripts/demo/start.cjs $demoRunDir
```

GiữterminalBackendđórunning. Terminalkhác:

```powershell
$newDemoMeta = 'đường-dẫn-run-dir-mới/demo.json'
node scripts/demo/prepare.cjs $newDemoMeta
$env:VITE_API_URL = 'http://127.0.0.1:57405/api'
$env:VITE_ENABLE_DEMO = 'false'
npm.cmd --prefix client run dev -- --host 127.0.0.1 --port 5177 --strictPort
```

prepare chỉ choDBTESThoàn toàntrống, khởi tạo 4 actors TEST và 1 topicthật qua API, khôngcơnghệpublicadminsignup/backdoor. MởEdgeđúngprofilecủarundir mới và 9227 nhưDEMO_SCRIPT, rồisession.cjs `$newDemoMeta student`. SaurestartBackendmộtlượt mới tạoDBmới; vaultcũkhông dùngchéo. Đừngchạy lại prepaređể“reset”. Không cần .env chohelper demo.

## Biến môi trường và secrets

| Biến | Mục đích / yêu cầu |
| --- | --- |
|NODE_ENV, MONGODB_URI_TEST, MONGODB_URI_TEST_ALLOWLIST|TestrequireexactURIlocal/nameweb 3_internship_test_phase 1_…; helpertạochildrồikiểm lạichính xác. |
|MONGODB_URI, CORE_BUSINESS_ENABLED, HOST, PORT|Entrypointthực; demohelpersetTEST vàloopback/57405. Khôngchạyngầmserver/starttrênrootdatabase. |
|JWT_SECRET, JWT_EXPIRES_IN, NONCE_TTL_SECONDS|Auth; helpersinhJWTrandomprocess, không dùngsecretthậtWindowsđểtest, khôngin. |
|AI_SERVICE_URL, AI_SERVICE_URL_TEST, NLP_SERVICE_URL|Loopback 8003; đặtAI_SERVICE_URL_TESTkhi dùnghelper đểkhôngfallback 8001. |
|CV_PARSER_PYTHON, CV_PARSER_MODULE_PATH|Pythonvàtargetpypdfcôlập. |
|NLP_MODEL_DIR, PYTHONPATH|Modelartifactđãpinvàruntimeisolated; khôngtrỏAPIcloud. |
|WEB 3_LOCAL_ENABLED, WEB 3_LOCAL_DEPLOYMENT|HardhatTESTonly 31337, code/instance/deployguard. |
|CHAIN_LISTENER_ENABLED, CHAIN_VERIFICATION_ENABLED|Demohelpersgiữfalsechoadapterlegacy, khôngstartupwrite ngoàiýmuốn. |
|PINATA_JWT, REPORT_ENCRYPTION_KEY, REPORT_ENCRYPTION_KEY_ID, IPFS_EXTERNAL_UPLOAD_ENABLED|PrivateIPFS; keybase 6432 byte. Hiệnthiếu/tắt, khôngcredentials thật trongtest. |
|VITE_API_URL, VITE_ENABLE_DEMO|Browser chỉ nhận APIpublicURL/flagfalse. TuyệtđốikhôngVITE_JWT_SECRET/Pinata/key/privatekey. |

Helperdemo cốý tắt Pinata vàkey, không hỗtrợbậtcloudbằngcáchcopysecretvào chat/.env. Nếu được duyệtkiểmPinatalive: dùng BackendTESTđược cấu hìnhriêng quaentrypointthực, secrets local securestore, explicitencrypteduploadTEST và readback; không thaydemohelperguard hoặc publicplaintext. .env.examplehiệnchỉcómộtsốbiếnlegacy, bảngnàymô tảcảbiếnbổsung; không tự tạo.env.

## Tests an toàn

Frontend `npm.cmd --prefix client run lint`, `npm.cmd --prefix client run build`; QR `node --test client/test/qr-code.test.cjs`; helperWindows `node --test scripts/demo/demo.test.cjs`; contracts `npm.cmd --prefix contracts test` và`run test:legacy`.

Backend cần terminaltestmới, URIallowlist đúng, không dùngDB gốc/demo:

```powershell
$env:NODE_ENV='test'
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/web3_internship_test_phase1_acceptance'
$env:MONGODB_URI_TEST_ALLOWLIST=$env:MONGODB_URI_TEST
$env:WEB3_INTEGRATION_TESTS='true'
$env:WEB3_TEST_DEPLOYMENT=(Resolve-Path 'contracts/node_modules/.cache/phase5-20261031/deployment.json').Path
$env:AI_SERVICE_URL_TEST='http://127.0.0.1:8003'
$env:NLP_SERVICE_URL='http://127.0.0.1:8003'
$env:NLP_INFERENCE_TESTS='true'
$env:CV_PARSER_MODULE_PATH=(Resolve-Path 'contracts/node_modules/.cache/phase3-20261031/python-deps').Path
npm.cmd --prefix server test
```

Web3 tests tạm đổiautomine rồi phục hồi; không chạy đồng thời với thao tác demo chain. Không dropDatabase, không seedcleanup. Pythonunit: trongai-service`python -m unittest discover -s tests -p test_nlp.py -v`; model 6 tests chỉ bậtNLP_INFERENCE_TESTS khi model đã duyệt vàRAMđủ, khôngđồngthờinạpmodel 2 ởmáy đangthiếuRAM. E2E 70/39/7: sourceclient/test/phase3-browser.cjs/phase2-browser.cjs/phase 5-qr-browser.cjscóguardport/metadataTEST vàfreshDB; chỉchạytheorunbookQA tươngứng, khônggánmetadata 5177 vàoharness 57404.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
|Guest/khôngMetaMask|DùngEdgeprofileTEST+sessionhelper; đây làsigAPI thật, chưaextensionUAT. |
|DemoPID/portmismatch|Metadata stale; khôngbỏguard. Kiểmowner/cổng, tạo lượtTEST mớiđúngstartscript. |
|DPAPIfailed|ĐúngWindowsuser/nativeTerminal, khôngsandbox; khôngdecrypt/insecret, khôngtắtExecutionPolicy toànmáy. |
|EADDRINUSE|Xácđịnhprocess, khôngstarttrùng hoặckillngười khác. |
|PDF 503|KiểmPython/pathpypdf; DOCXkhôngcầnpypdf. PDFscan/mãhóacó thể 422 đúngpolicy. |
|AI 503/readyfalse|Kiểmservice 8003/modelhash/RAM; dùngTF-IDFcóghiengine, khônggọilàBERT. |
|IPFS 503/BLOCKED|Đúngtrạng tháithiếucấu hình; không thayCIDstub. |
|QR 409/400/GPSdenied|Mãđã dùng/hết hạn/scope/GPS; tạođúng phiênmới, không tự retrycheckin ghi trùng. |
|Mint 409|Kiểmcompleted/KPI/finalapproved/giờapprovedpositive/proof/complete; chưa đủthìkhông mint. |
|RPCmismatch/verify 503|Khônggiữbadgecũ; metadata/instancekhôngkhớp, khôngforceblockchainstate. |
|Staleversion 409|Reload/đọcphiên bảnmới, khôngoverwriteupdatecủangười khác. |

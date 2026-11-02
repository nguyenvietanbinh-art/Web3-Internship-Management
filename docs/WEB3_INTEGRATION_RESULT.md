# PHASE 5 — Kết quả tích hợp Web3 local

Ngày 31/10/2026. Người dùng phê duyệt PHASE 5 sau PHASE 4 và phê duyệt thêm hai thư viện QR. **Các luồng Web3 local đã triển khai và kiểm thử thực tế; IPFS cloud vẫn BLOCKED và camera/GPS phần cứng chưa được nghiệm thu. Không đánh dấu toàn bộ PHASE 5 PASS. Dừng trước PHASE 6.**

## Kết quả và phạm vi

| Hạng mục | Trạng thái | Bằng chứng thực tế |
| --- | --- | --- |
| Smart contract evidence/SBT | PASS local | Solidity 0.8.24, Hardhat 2.29.1; 9 unit tests và 3 legacy contract tests |
| Report/attendance/completion commitments | PASS local | API + UI ghi giao dịch thật; receipt, calldata, event, state và canonical block đối chiếu |
| SBT ERC721/ERC5192 | PASS local | Mint token #4 từ browser; owner, locked, mapping, completion hash được đọc lại RPC |
| Pending/retry/reconciliation | PASS trong các case kiểm | Tắt automine trong TEST, giữ hash pending thật, mine rồi reconcile; mất xác nhận DB được khôi phục từ event mà không mint thêm |
| QR/GPS/API | PASS trong TEST | JWT có hạn dùng, nonce một lần/CAS, scope sinh viên, sai chữ ký/hết hạn/replay/GPS cũ/ngoài vùng/sai số bị từ chối |
| QR encoder/scanner/UI | PASS bằng ảnh/video TEST | QR PNG thật → ZXing thật → input → người dùng bấm GPS → WorkSession; không tự điểm danh sau khi quét |
| Camera/GPS thiết bị thật | NOT TESTED | Canvas MediaStream và CDP GPS là fixture khai báo rõ; chưa có xác nhận camera/định vị ngoài thực địa |
| Encrypted IPFS adapter | PASS unit/transport fixture | AES-GCM, hash, CID validation, readback/hash/decrypt, timeout và lỗi gateway được kiểm với transport mock công khai |
| Pinata upload/readback thật | BLOCKED | Thiếu PINATA_JWT, REPORT_ENCRYPTION_KEY và quyền bật IPFS_EXTERNAL_UPLOAD_ENABLED; không phát sinh upload/CID thật |
| Mainnet/testnet công khai | NOT RUN | Chỉ Hardhat loopback, không ví thật/private key thật hoặc dịch vụ trả phí |

## Môi trường và giao dịch xác minh

- RPC: `http://127.0.0.1:18545`, chain ID **31337**, Hardhat local.
- Contract: `InternshipEvidenceSBT` tại `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- Deployment TX: `0x51813c7c0b001b10e3d2bebef69f9dc5baff8b93297e959725cf6c8ec02a22f8`, block 1.
- Hardhat instance: `0x2fdc6515737c639d2b9d7d38d792b213608294400070239f87eaa26dac6e7382`; cấu hình kiểm thêm genesis hash, deployment block/hash và runtime code hash.
- TEST review database: `web3_internship_test_phase1_a4e9f58f_829629bf93ee`; không phải database gốc/demo.
- Attestor là tài khoản unlocked mặc định của Hardhat. Backend kiểm JWT/RBAC rồi gửi TX; **đây không phải TX do ví người dùng ký**. Các phép đăng nhập ví trong test dùng ví TEST ngẫu nhiên, ký nonce thật.

| Operation từ browser | Block | Transaction hash thật |
| --- | --- | --- |
| report | 14 | `0xd932a69b51aad2f0d83617f395652e530f87d97b0427084faeb603f4a76305fc` |
| attendance | 15 | `0xc2ca5a2fc44f9356d6df86b9b20c107e9305c38c637828e53734192412f44973` |
| completion | 16 | `0x5b3f242061bb28d3a8ab6acdb2e7f338bc38f717f02a06e5e878d5aab8058208` |
| mint | 17 | `0xb2ef6b1222d389091cd3b7b9ae125da5dd99204f34b73f4dc8d3e90f1380556e` |

Tất cả receipt status=1, đúng địa chỉ contract/signer, input và event khớp operation/digest/student; state đọc trực tiếp xác nhận token #4 khóa vĩnh viễn và đúng chủ sở hữu. Bốn SBT đã mint trong tổng các lượt TEST được giữ lại trên cùng node local; bảng trên là **một luồng UI hoàn chỉnh**, không phải toàn bộ TX từ các lần chạy. Unit tests dùng EVM riêng trong process và không tính vào node RPC này. Evidence máy đọc: `contracts/node_modules/.cache/phase5-20261031/verified-transactions.json`.

Backend từ chối xác minh nếu RPC lỗi, expected chain/code/instance không khớp hoặc dữ liệu DB khác receipt. UI xóa badge cũ trước khi xác minh lại; GET chỉ đọc, không reconcile ngầm. Chứng nhận là xác nhận của issuer tại thời điểm phát hành, không tự chứng minh tính đúng đắn của mọi nội dung học thuật.

## Luồng API/UI mới

Các route dưới `/api/core` dùng JWT và Assignment scope của PHASE 3. Mọi mutation `/web3` còn yêu cầu `NODE_ENV=test` và URI TEST khớp allowlist chính xác.

| Endpoint | Quyền / tác dụng |
| --- | --- |
| GET /web3/status | Đọc readiness chain/IPFS; chỉ trả cờ cấu hình, không secret |
| POST /web3/qr/issue | Doanh nghiệp của phân công active; tạo phiên QR có TTL 15–300 giây |
| POST /web3/qr/redeem | Đúng sinh viên, phiên active/chưa dùng, chữ ký và GPS hợp lệ; check-in/out WorkSession chuẩn |
| GET /web3/reports/:id/artifacts | Người có Assignment scope, chỉ đọc metadata/hash/CID |
| POST /web3/reports/:id/ipfs | Chủ báo cáo xác nhận upload JSON đã mã hóa |
| POST /web3/reports/:id/ipfs/file | Chủ báo cáo, PDF/DOCX tối đa 2 MiB, kiểm bằng parser dùng lại PHASE 3 |
| POST /web3/reports/:id/anchor | Người có scope, chỉ final report hiện hành đã duyệt; hash nội dung hoặc artifact đúng báo cáo đã readback |
| POST /web3/time/:id/anchor | Company/admin có scope, phiên giờ dương đã duyệt |
| POST /web3/placements/:id/complete | Admin; completed/KPI/final report/giờ làm/proof hiện hành được kiểm lại |
| POST /web3/placements/:id/mint | Admin; completion đúng snapshot đã confirmed; duplicate trả cùng operation |
| GET /web3/placements/:id/certificate | Đọc RPC hiện tại, không lấy DB làm bằng chứng VERIFIED |
| GET /web3/placements/:id/operations | Đọc tiến trình operation theo scope |
| POST /web3/operations/:id/reconcile | Người đã gửi/admin; đối chiếu event/receipt thật, cập nhật TEST DB rõ ràng |

Menu **Web3 theo kỳ** cung cấp trạng thái mạng, hash/CID, camera, GPS, bằng chứng giờ, completion/mint, certificate viewer và reconciliation. Connect wallet/signature login có sẵn được giữ. Nút kiểm mạng ví chỉ đọc eth_chainId; giao dịch local qua attestor được giải thích ngay trên UI. Scanner và encoder lazy-load riêng; không có API cloud tạo QR chứa nonce.

## An toàn và schema

- Thêm `chain_operations`, `private_report_artifacts`, `core_qr_sessions` **chỉ trong TEST**. Thêm proof QR/GPS tùy chọn vào WorkSession; manual flow giữ nguyên, không backfill gốc/demo.
- Unique operation ID và TX index gồm chain instance. Namespace operation có deployment TX + Hardhat instance để tránh nhầm chain sau reset có cùng địa chỉ deploy tất định.
- Lease/CAS chống gửi trùng; kiểm receipt/event/calldata/state trước confirmed. Reconciliation explicit POST, không giả hash hoặc fallback VERIFIED. Đây là local single-attestor, chưa phải hàng đợi signer phân tán production.
- QR có student/assignment/action, nonce hash, expiry; GPS kiểm timestamp, accuracy và `distance + accuracy <= radius`. GPS là client claim, không chống giả mạo tuyệt đối. Proof `verified=false` không bị đổi thành blockchain/GPS tuyệt đối đúng.
- QR consume và WorkSession là hai thao tác trên Mongo standalone; khi lỗi không xác định, giữ nonce đã dùng và cần đối chiếu, không âm thầm cho replay. Không dùng transaction Mongo giả hoặc xóa lịch sử.
- AES-256-GCM + HKDF/salt/IV ngẫu nhiên mã hóa báo cáo trước Pinata. Server giữ khóa; envelope không chứa plaintext, tên báo cáo hoặc raw GPS. Ciphertext cũng public-addressable nếu upload: quyền truy cập dựa vào mã hóa, không phải CID bí mật.
- Upload lưu CID trước readback; gateway lỗi không được đánh dấu verified. Key backup/rotation cần quy trình riêng trước production. Không tạo .env/khóa thật hoặc bật upload bên ngoài trong giai đoạn này.
- Adapter IPFS legacy bị chặn public plaintext ngay cả khi có credentials; flow mới dùng ciphertext. Đây là privacy gate có chủ đích, được test; hai contract legacy và source chức năng cũ được giữ.
- Contract kiểm writer, replay, subject, prerequisites và khóa chuyển nhượng. Quy tắc học thuật do backend/issuer xác nhận, contract không đọc Mongo. Chưa có quy trình thu hồi/cấp lại chứng nhận hoặc cơ chế nhiều issuer production.
- Chưa rollout schema/index vào gốc/demo. Rollback local: tắt WEB3_LOCAL_ENABLED/hoàn nguyên patch từ bản lưu, giữ DB/evidence; không drop/reset/clean. Rollout dữ liệu thật cần backup, kiểm trùng/index và kế hoạch riêng được duyệt.

## Kết quả test

| Bộ kiểm | Kết quả | Evidence trong ignored phase5-20261031/ |
| --- | --- | --- |
| Backend PHASE 1–5, NLP thật và RPC local | **111/111 PASS**, fail0/skip0 | backend-full-final.log, 57,17 giây |
| Solidity mới | **9/9 PASS** | solidity-final.log; local EVM access/replay/prerequisites/mint/transfer |
| Contract legacy | **3/3 PASS** | legacy-contract-tests.log |
| Browser core PHASE 3–5 | **64/64 PASS** | browser-results.json/browser-first.log, gồm 51 checks PHASE 3–4 + 13 Web3 |
| Browser legacy PHASE 2 | **39/39 PASS** | compat/browser-results.json |
| Browser QR sau cài thư viện/sửa scanner | **7/7 PASS** | qr-release/qr-browser-results.json và qr-browser-release.log |
| QR unit | **2/2 PASS** | qr-unit-first.log; 40 random long payloads, đủ 8 mask, thêm blank rejection |
| Python NLP unit | **16/16 PASS** | python-regression.log |
| Frontend lint | **0 error/0 warning** | lint-final-accepted.log |
| Frontend build | **PASS** | build-final-accepted.log; ignored client/dist/phase5-accepted-final |

64 core checks chạy trước khi thêm thư viện QR; sau phần QR chỉ chạy lại checks QR, unit, lint/build phù hợp, không gọi 64 checks là post-QR toàn bộ. Model Python 6 inference tests không nạp lại một model thứ hai vì RAM hạn chế; 22/22 của PHASE 4 là evidence lịch sử. Lượt hiện tại vẫn kiểm inference SBERT thật qua API/UI sử dụng service8003 đang chạy. Không tạo quality metrics AI hoặc trained risk classifier khi thiếu nhãn.

Đã kiểm pixel QR → decoder thực, camera denied/cancel/stream cleanup, GPS CDP, replay; **chưa kiểm phần cứng camera/GPS, thiết bị di động thật hoặc MetaMask extension thật**. Transport failure của certificate là fixture lỗi có khai báo, không phải đã ngắt RPC thật. Wrong expected chain/code/instance có case thật fail-closed. Không diễn giải test fixture là upload Pinata thật.

Các lỗi trung gian được giữ nguyên: cache Hardhat sandbox EPERM, từ khóa Solidity `reference`, JSX dư dấu ngoặc, CID fixture không canonical, fixture .toObject sai, race tải danh sách phân công, React state-in-effect warning, StrictMode camera race, decoder dense QR và Vite tối ưu dependency làm reload form. Đã sửa và chạy lại bộ liên quan; không bỏ qua assertion để làm PASS. QR có fallback ZXing pure-image thực (vẫn parse/error-correction), kiểm 40 token ngẫu nhiên thay vì chọn duy nhất ảnh dễ quét.

Build entry JS khoảng284,69kB; encoder khoảng24,20kB, scanner khoảng436,66kB, tải lazy riêng. Một build trung gian có warning PLUGIN_TIMINGS do thời gian plugin CSS; build cuối không có lỗi hay chunk>500kB. 33 package mới từ đúng hai dependency QR và peer/transitive; không đổi phiên bản cũ, không install lifecycle, native module hoặc upgrade Node.

## Bảo toàn database và Git

Snapshot trước `2026-10-31T13:02:36.701Z`, sau `2026-10-31T14:07:17.685Z`. So sánh **toàn bộ nội dung SHA-256 từng collection và danh sách index** bằng nhau, không chỉ số lượng:

| Database | Collections | Indexes | Documents | Kết quả |
| --- | --- | --- | --- | --- |
| web3_internship |14|36|3|UNCHANGED |
| web3_internship_demo_20261030_2340 |14|36|223|UNCHANGED |
| web3_internship_demo_20261030_2340_foundation |14|36|66|UNCHANGED |

Không seed/migration/drop/delete dữ liệu hoặc reset blockchain để che lỗi. Các DB TEST và lần chạy lỗi được giữ lại. Không tạo/sửa .env, không bật Windows service/startup và không thao tác ứng dụng cá nhân trong PHASE 5.

Git branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`, không stage/commit/push/merge/reset/clean. Working tree đã có PHASE 1–4 từ trước; không xem toàn bộ git diff là thay đổi PHASE 5. `integrity-final.json` lưu baseline 8481 file, file sửa/thêm/thiếu, lock version check và pattern scan build; `git-status-final.txt` giữ trạng thái đầy đủ. Python tạo thêm __pycache__ trong test; không xóa untracked của người dùng.

## Runtime để review và cách chạy lại

Đang giữ Frontend **http://127.0.0.1:5175/** → Backend TEST **http://127.0.0.1:57404/api** → `web3_internship_test_phase1_a4e9f58f_829629bf93ee`; Mongo27017, NLP8003, Hardhat18545. Không khởi động Backend gốc5000/demo5001. Edge headless và Backend/Vite compatibility tạm đã đóng sau test. Bộ legacy AI trong helper review hiện fallback TF-IDF nội bộ vì default8001; API core AI vẫn dùng8003 thật. Lần start TEST tiếp theo nên đặt AI_SERVICE_URL_TEST=http://127.0.0.1:8003. Không đổi cấu hình môi trường người dùng.

Các lệnh contract (chỉ sau khi kiểm môi trường):

```powershell
cd contracts
npm.cmd run compile:local
npm.cmd test
# Nếu cần tạo môi trường local mới, giữ evidence hiện có trước khi restart/reset:
npm.cmd run node:local
# deploy:local chỉ cho localhost/chain31337; output metadata mặc định phải chưa tồn tại.
# Không ghi đè deployment.json đang dùng; cần output mới và TEST DB riêng cho một lượt mới.
```

RPC đang chạy dùng port18545, trong khi script node:local khai báo port đó trong package.json. Không chạy node thứ hai trên cùng port. Metadata deployment trong ignored node_modules cache, không secret. Hardhat in-memory mất chain khi restart máy; old Mongo records không được coi là VERIFIED trên chain mới.

Test Backend yêu cầu NODE_ENV=test, MONGODB_URI_TEST và MONGODB_URI_TEST_ALLOWLIST cùng base TEST đã duyệt; helper tạo child riêng rồi xác minh đúng child. Với Web3 thêm WEB3_INTEGRATION_TESTS=true và WEB3_TEST_DEPLOYMENT trỏ deployment local hợp lệ. Không thay bằng URI gốc/demo. Chi tiết biến trong PHASE5_IMPLEMENTATION_PLAN và source test. QR unit: `node --test client/test/qr-code.test.cjs`; frontend: `npm.cmd --prefix client run lint` và `npm.cmd --prefix client run build`.

## Phần còn thiếu trước nghiệm thu đầy đủ

1. Cấu hình Pinata, khóa mã hóa được quản lý/backup và cho phép upload ciphertext; thực hiện upload/readback/hash thật trên báo cáo TEST không nhạy cảm. Không gửi secret qua chat/Git.
2. UAT camera và GPS trên thiết bị thật, permission/accuracy/ngoài vùng/hết hạn; localhost điện thoại không phải máy host, cần phương án HTTPS/loopback forwarding được duyệt trước khi mở mạng.
3. Xác nhận trust boundary issuer, policy cấp/thu hồi/cấp lại chứng nhận và rollout dữ liệu thật. Testnet công khai cần phê duyệt riêng; mainnet không thuộc scope.
4. Giới hạn AI PHASE 4 vẫn giữ: chưa có nhãn độc lập/quality metrics/risk classifier đã huấn luyện. Không mở PHASE 6 khi chưa nghiệm thu.

**Dừng tại PHASE 5 để người dùng review.**


## File thay đổi riêng trong PHASE 5

Danh sách so với snapshot ngay trước PHASE5, không gộp thay đổi PHASE1–4 đã có. File sinh Python __pycache__ được ghi riêng trong integrity, không xem là source feature.

- `README.md` — sửa
- `client/package-lock.json` — sửa
- `client/package.json` — sửa
- `client/src/business.css` — sửa
- `client/src/components/AppShell.jsx` — sửa
- `client/src/components/business/CoreBusinessView.jsx` — sửa
- `client/src/components/business/NativeQrScanner.jsx` — thêm
- `client/src/components/business/QrCode.jsx` — thêm
- `client/src/components/business/Shared.jsx` — sửa
- `client/src/components/business/Web3Page.jsx` — thêm
- `client/src/components/business/qrDecoder.js` — thêm
- `client/test/phase3-browser.cjs` — sửa
- `client/test/phase5-browser.cjs` — thêm
- `client/test/phase5-qr-browser.cjs` — thêm
- `client/test/qr-code.test.cjs` — thêm
- `client/vite.config.js` — sửa
- `contracts/contracts/InternshipEvidenceSBT.sol` — thêm
- `contracts/hardhat.local.cjs` — thêm
- `contracts/package.json` — sửa
- `contracts/scripts/deploy-local.cjs` — thêm
- `contracts/scripts/local-hardhat.cjs` — thêm
- `contracts/test-local/InternshipEvidenceSBT.test.cjs` — thêm
- `docs/ARCHITECTURE_UPDATED.md` — sửa
- `docs/FEATURE_ACCEPTANCE_MATRIX.md` — sửa
- `docs/IMPLEMENTATION_MASTER_PLAN.md` — sửa
- `docs/IMPLEMENTATION_PROGRESS.md` — sửa
- `docs/PHASE5_IMPLEMENTATION_PLAN.md` — thêm
- `docs/TEST_RESULTS.md` — sửa
- `docs/UI_DESIGN_SYSTEM.md` — sửa
- `docs/WEB3_INTEGRATION_RESULT.md` — thêm
- `server/src/core/index.js` — sửa
- `server/src/core/web3.js` — thêm
- `server/src/models/BusinessModels.js` — sửa
- `server/src/models/Web3Models.js` — thêm
- `server/src/services/databaseSafety.js` — sửa
- `server/src/services/ipfsService.js` — sửa
- `server/src/services/localWeb3.js` — thêm
- `server/src/services/privateIpfs.js` — thêm
- `server/src/services/qrGps.js` — thêm
- `server/test/error-safety.test.js` — sửa
- `server/test/helpers.js` — sửa
- `server/test/private-ipfs.test.js` — thêm
- `server/test/qr-gps.test.js` — thêm
- `server/test/web3-integration.test.js` — thêm

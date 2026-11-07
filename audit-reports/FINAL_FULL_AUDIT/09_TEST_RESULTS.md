# KẾT QUẢ KIỂM THỬ VÀ BẢO TOÀN

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Phạm vi và cách hiểu

PASS đúng assertion đã chạy, FAIL là assertion không đạt; BLOCKED không chạy vì an toàn/thiếu dịch vụ, NOT IMPLEMENTED chưa có test/chức năng, NOT TESTED chưa thực hiện. Không cộng tỷ lệ unit pass thành tỷ lệ nghiệp vụ hoàn thành. **33 assertion thuần/mock mới: 16 PASS, 17 FAIL**. Suite harness exit0 chỉ nghĩa đã thu kết quả, không nghĩa mọi assertion pass. Không dùng model giả để tuyên bố DB persistence/HTTP middleware integration ngoài router đã đạt.

## Lệnh đã chạy và kết quả

| Lệnh/phép kiểm | Kết quả | Output/an toàn |
| --- | --- | --- |
| npm.cmd run lint (client) | PASS exit0,32 warning | Không --fix; log ignored staging |
| npm.cmd run build -- --outDir dist/final-full-audit | PASS exit0 | Thư mục mới ignored; chunk >500kB |
| node --check từng server/src, scripts, test/*.js | PASS31/31 | Chỉ parse, không import/execute |
| hardhat.cmd compile trong bản sao mới | PASS2 Solidity0.8.24 | staging/compile; APPDATA/LOCALAPPDATA riêng, cache compiler sao chép từ staging cũ |
| node contracts/node_modules/.cache/final-full-audit/pure.cjs | Xem assertion | Mongoose.connect/createConnection bị chặn; nonce model giả, ephemeral secret/wallet không in key; axios giả không network |
| python -B .../ai_checks.py | Xem assertion | AI_ENGINE=tfidf, không bind port/model download/pycache |
| node .../route_checks.cjs | Xem assertion | Gọi Express route stack trong bộ nhớ, req/res giả; auth thật với User model giả; không listen/HTTP live; driver writes và connect bị chặn |
| Mongo ping/list/find/indexes trước/sau | Ping PASS; preservation FAIL do3JD mới | Chỉ đọc, không tạo index, không count bằng ghi |
| git diff, hash tracked/untracked, status | Xem cuối báo cáo | Không commit/reset/clean |

Route tests thay create/insertMany/update/save bằng counters và fixture trong memory, không Mongo test DB. Mỗi GET xấu gọi fake-write1 lần; đó là bằng chứng nhánh code có mutation, không có document hiện tại nào được ghi. Public sync test thay listener bằng fake unavailable và countDocuments giả; chứng minh thiếu authorization/false success, chưa chứng minh chain backfill hoạt động.

## Assertion mới

Những assertion về điểm0/provenance và tính nhất quán API–chain là tiêu chí kiểm định đã nêu, chưa phải toàn bộ đặc tả nghiệp vụ được chốt. FAIL cho biết sai khác với assertion đó; không khẳng định điểm AI50 tự động làm báo cáo được duyệt. Các hàm AI được gọi trực tiếp, test schema dùng Pydantic; chưa chạy FastAPI HTTP service dù tên assertion có chữ HTTP schema.

| Test | Kết quả | Chi tiết/phạm vi |
| --- | --- | --- |
| AUTH valid wallet signature with fake nonce store | PASS | signature verified; no DB |
| AUTH replay rejected | PASS | nonce consumed |
| AUTH wrong wallet rejected | PASS | Đạt |
| AUTH expired nonce rejected | PASS | Đạt |
| JWT valid and tampered tokens | PASS | Đạt |
| WEB3 listener extracts named topicId | FAIL | ethers Result numeric enumerable keys => payload missing topicId |
| WEB3/API weighted rounding agrees | FAIL | Backend 81 vs Solidity 80 for equal weights, scores 80/81  81 !== 80  |
| AI fallback no-overlap gets zero score | FAIL | No-overlap fallback returns 20  20 !== 0  |
| AI fallback exposes provenance | FAIL | Matching fallback score 70 without engine/fallback flag |
| AI report fallback identifies keyword engine | PASS | Đạt |
| No Mongoose connection established | PASS | Đạt |
| AI health TF-IDF | PASS | Đạt |
| AI empty similarity zero | PASS | Đạt |
| AI identical similarity near one | PASS | Đạt |
| AI unrelated similarity zero | PASS | Đạt |
| AI empty matching score zero | PASS | Đạt |
| AI exact skills overlap ratio | PASS | Đạt |
| AI blank report must not earn passing score | FAIL | actual=50; expected=0 |
| AI unrelated report must not earn passing score | FAIL | actual=50; expected=0 |
| AI C++ vs C# normalization preserves distinction | FAIL | Both normalize to c |
| AI HTTP schema rejects missing fields | PASS | Missing required fields rejected by Pydantic |
| GET jds never writes | FAIL | Expected values to be strictly equal:  1 !== 0  |
| GET tasks never writes | FAIL | Expected values to be strictly equal:  1 !== 0  |
| GET history never writes | FAIL | Expected values to be strictly equal:  1 !== 0  |
| GET worklogs never writes | FAIL | Expected values to be strictly equal:  1 !== 0  |
| Student cannot change another task | FAIL | actual HTTP 200  200 !== 403  |
| Student cannot approve another worklog | FAIL | actual HTTP 200  200 !== 403  |
| Invalid QR rejected | FAIL | actual HTTP 200  200 !== 400  |
| Student cannot record tx for another company topic | FAIL | actual HTTP 200  200 !== 403  |
| Demo login requires wallet proof | FAIL | actual HTTP 200, token issued=true |
| Public sync requires authorization | FAIL | actual HTTP 200, success=true |
| No-token auth/me denied | PASS | Fake writes=0 |
| Student cannot create topic | PASS | Fake writes=0 |

## HTTP thật đã xác minh không ghi trước khi gọi

| Method | URL | HTTP | Kết quả | Giới hạn |
| --- | --- | --- | --- | --- |
| GET | /api/health | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/auth/me | 401 | PASS | negative theo dự kiến |
| GET | /api/auth/profile/0x0000000000000000000000000000000000000001 | 404 | PASS | negative theo dự kiến |
| GET | /api/topics | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/topics/bad-id | 400 | PASS | negative theo dự kiến |
| GET | /api/data/overview | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/students | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/companies | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/topics | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/assignments | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/submissions | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/evaluations | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/ai-analyses | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/data/chain-events | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/internship/dashboard | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/internship/attendance/today-qr | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/internship/chain-events | 200 | PASS | rỗng/health; chưa E2E |
| GET | /api/internship/certificate/audit-nonexistent-certificate | 200 | FAIL | verified=true,onChain=true dù không có topic |
| GET | /api/not-a-real-endpoint | 404 | PASS | negative theo dự kiến |

GET /api/topics/bad-id test negative400; /auth/profile/ ví không tồn tại404; /auth/me401; endpoint lạ404 đều đúng kỳ vọng. GET certificate FAIL là semantic response, dù transport200. GET dashboard chỉ transport PASS; average85 trên dữ liệu rỗng là lỗi số liệu đọc source. CORS health với Origin https://audit.invalid phản chiếu origin: xác nhận S11; không gửi request tới domain đó.

Frontend 4 tài nguyên GET200; không mở browser, không console capture, không camera/ví. Không gọi GET jds/tasks/history/worklogs hoặc POST sync trên server hiện tại. Không ký/gửi blockchain transaction. Không auth/demo-login thật, không tạo User thật.

## Các phép kiểm chưa chạy

| Phép kiểm | Trạng thái | Lý do |
| --- | --- | --- |
| npm test server foundation | BLOCKED | helpers.js:15,22 dropDatabase; chưa cô lập DB/process với guard URI |
| Seed/migration | BLOCKED | Ghi/xóa dữ liệu, không nằm trong audit |
| npm test contracts | NOT IMPLEMENTED script | Placeholder exit1 dù có3 Mocha happy tests |
| hardhat test/deploy | BLOCKED | Cần EVM cục bộ độc lập xác minh; không chạy transaction trong audit |
| Full login/create/assign/submit/evaluate/complete | BLOCKED | Live DB không được ghi, Pinata/AI/RPC thiếu |
| Browser UI/E2E/mobile/console/Lighthouse | NOT TESTED | Các tab tự ghi chưa được cô lập |
| SBERT benchmark, ranking/classification metrics | NOT IMPLEMENTED | Thiếu deps/model/dataset/evaluator |
| npm audit/CVE/fuzz/load/penetration | NOT TESTED | Không mạng ngoài/cài/fix, không tấn công phá hoại |
| Upload IPFS/readback và NFT verification | BLOCKED | Pinata chưa config, chưa mint/token runtime |

## Warning và vị trí nguyên văn

32 warning lint dưới đây là kết quả mới. PowerShell ghi stderr build thành NativeCommandError record cho warning chunk, nhưng process exit0 và có “built”; không phải build failed.

```text
> client@0.0.0 lint
> oxlint

src/components/DashboardView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'BrainCircuit' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:7:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'ExternalLink' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:19:10: warning eslint(no-unused-vars): Variable 'loading' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:20:10: warning eslint(no-unused-vars): Variable 'matchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:20:27: warning eslint(no-unused-vars): Variable 'setMatchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:53:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/AttendanceView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'Calendar' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'Sparkles' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'UserCheck' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:16:42: warning eslint(no-unused-vars): Parameter 'user' is declared but never used. Unused parameters should start with a '_'. help: Consider removing this parameter.
src/components/AttendanceView.jsx:50:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/Web3CertificateView.jsx:4:3: warning eslint(no-unused-vars): Identifier 'Award' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'ExternalLink' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:7:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:9:3: warning eslint(no-unused-vars): Identifier 'Cpu' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'FileCheck2' is imported but never used. help: Consider removing this import.
src/components/Web3CertificateView.jsx:39:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/Web3CertificateView.jsx:39:5: warning react-hooks(exhaustive-deps): React Hook useEffect has a missing dependency: 'fetchChainEvents' help: Either include it or remove the dependency array.
src/App.jsx:12:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/App.jsx:19:3: warning eslint(no-unused-vars): Identifier 'Filter' is imported but never used. help: Consider removing this import.
src/App.jsx:25:22: warning eslint(no-unused-vars): Identifier 'getToken' is imported but never used. help: Consider removing this import.
src/App.jsx:186:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/App.jsx:186:5: warning react-hooks(exhaustive-deps): React Hook useEffect has a missing dependency: 'fetchTopics' help: Either include it or remove the dependency array.
```

```text
> client@0.0.0 build
> vite build --outDir dist/final-full-audit

vite v8.3.4 building client environment for production...
transforming...
✓ 2062 modules transformed.
rendering chunks...
computing gzip size...
dist/final-full-audit/index.html                   1.22 kB │ gzip:   0.71 kB
dist/final-full-audit/assets/index-CvD4t5L8.css    4.55 kB │ gzip:   1.83 kB
dist/final-full-audit/assets/index-Nnxj_vo1.js   576.04 kB │ gzip: 184.89 kB

npm.cmd : [plugin builtin:vite-reporter] 
At line:2 char:89
+ ... +$env:PATH; npm.cmd run build -- --outDir dist/final-full-audit *> .. ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([plugin builtin:vite-reporter] :String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: 
https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 567ms
```

## Artifact kiểm định

Ignored `contracts/node_modules/.cache/final-full-audit/` giữ baseline.json, runtime-before.json, runtime-after.json, pure-results.json, ai-results.json, route-results.json, các script kiểm tra, lint/build/compile logs và bản sao compile. Không chứa JWT_SECRET thật hoặc private key thật trong báo cáo/script. Secret ephemeral chỉ tồn tại trong tiến trình kiểm thử. JSON/runtime hash bảo toàn dữ liệu sẽ được đối chiếu ở mục cuối sau khi xuất báo cáo.


## Đối chiếu cuối: có thay đổi database đồng thời — không được bỏ qua

Snapshot đầu **23:11:09 ngày30/10/2026 (+07:00)** có14 collections/36indexes/0documents. Snapshot sau23:28:50 và lần cuối vẫn có14 collections/36indexes, nhưng **3 documents trong job_descriptions**,13collections còn lại0. Cả3 có createdAt khoảng **23:18:21.925–926 (+07:00)**, tiêu đề trùng3 JD mẫu trong `server/src/routes/internship.routes.js:99`. So sánh bảo toàn toàn DB: **FAIL / không giống snapshot đầu**. Không được báo database giữ nguyên0document suốt kiểm định.

Chỉ chứng minh có ghi đồng thời và nội dung phù hợp nhánh seed; **chưa xác định nguồn request/process gây ghi** vì Backend không có access/audit log đủ để quy thuộc. Frontend/Backend/Mongo vốn đang chạy. Không khẳng định người dùng đã mở tab hay có bên nào cụ thể thực hiện. Các lệnh audit live chỉ GET đã kiểm tra read-only và Mongo read commands; không gọi /jds hoặc API ghi trên Backend hiện tại. Router mutation tests dùng model fake, connect/driver write bị chặn và readyState0, không dùng MongoDB thật. Không vì kết quả source/mock mà quy nguồn3document cho một request chưa quan sát.

Không xóa3JD, không khôi phục snapshot bằng ghi, không dừng tiến trình đang chạy ngoài phạm vi cho phép. Đã dừng thêm thử nghiệm runtime; chỉ đọc collection/timestamps và hoàn thiện báo cáo. Cần xử lý auto-write P0 và cô lập client/database trước E2E. Evidence ở ignored staging: runtime-before.json, runtime-after.json, runtime-final.json, concurrent-change.json. Timestamp trong JSON là UTC; báo cáo đổi sang Asia/Bangkok. Việc live environment có writer đồng thời giới hạn kết luận bảo toàn DB, không làm vô hiệu các assertion thuần/mock đã cô lập.


## Git và bảo toàn file: kết quả cuối

SHA-256 đối chiếu toàn bộ **8336 file tracked** và **22 file untracked có sẵn** với baseline: **0 thay đổi,0 mất file**. Source/config/manifest/lock/.env/artifact/cache gốc không đổi. Thư mục DOCX/ZIP và mọi báo cáo cũ giữ nguyên. Chỉ13 báo cáo mới trong FINAL_FULL_AUDIT và generated outputs ignored được thêm; không commit/push/merge/reset.

```text
## branch_1...origin/branch_1
?? "Th\306\260 mu\314\243c m\306\241\314\201i.zip"
?? "Th\306\260 mu\314\243c m\306\241\314\201i/"
?? audit-reports/
?? docs/PROGRESS.md
```

Git gom audit-reports dưới một dòng untracked nên status không liệt kê từng báo cáo; đã đếm riêng đủ13file. Không có tracked diff. Mongo15528/Backend14084/Frontend13172 vẫn nghe127.0.0.1:27017/:::5000/127.0.0.1:5173 tại lần kiểm cổng cuối;8000/8545 không có listener. Không dừng hay khởi động thêm service.


## Dependency consistency kiểm tra mới

`npm.cmd ls --depth=0 --json` ở server/client/contracts đều exit0. Đối chiếu23 direct dependencies/devDependencies: package range thỏa semver, package-lock version khớp installed version, **23/23 đạt**; đây không phải security audit/transitive vulnerability scan. require native @nomicfoundation/edr, @nomicfoundation/solidity-analyzer, keccak và secp256k1 đều PASS. Frontend build/lint đã thực thi native toolchain của Vite/oxlint. Không cài hoặc nâng cấp dependency.

| Module | Dependency | Range manifest | Lock và installed |
| --- | --- | --- | --- |
| server | axios | ^1.7.7 | 1.20.0 |
| server | bcryptjs | ^2.4.3 | 2.4.3 |
| server | cors | ^2.8.5 | 2.8.6 |
| server | dotenv | ^16.4.5 | 16.6.1 |
| server | ethers | ^6.13.2 | 6.17.0 |
| server | express | ^4.21.0 | 4.22.3 |
| server | form-data | ^4.0.0 | 4.0.6 |
| server | jsonwebtoken | ^9.0.2 | 9.0.3 |
| server | mongoose | ^8.7.0 | 8.24.5 |
| server | multer | ^1.4.5-lts.1 | 1.4.5-lts.2 |
| server | nodemon | ^3.1.7 | 3.1.14 |
| client | axios | ^1.20.0 | 1.20.0 |
| client | ethers | ^6.17.0 | 6.17.0 |
| client | lucide-react | ^1.55.0 | 1.55.0 |
| client | react | ^19.2.8 | 19.3.0 |
| client | react-dom | ^19.2.8 | 19.3.0 |
| client | @types/react | ^19.2.18 | 19.3.0 |
| client | @types/react-dom | ^19.2.7 | 19.3.0 |
| client | @vitejs/plugin-react | ^6.1.1 | 6.1.2 |
| client | oxlint | ^1.81.0 | 1.87.0 |
| client | vite | ^8.3.0 | 8.3.4 |
| contracts | @nomicfoundation/hardhat-toolbox | ^6.1.2 | 6.1.2 |
| contracts | hardhat | ^2.29.1 | 2.29.1 |

Python3.13.5 hiện tại: FastAPI0.124.1, uvicorn0.38.0, Pydantic2.12.4, NumPy2.2.6, sklearn1.7.2. requirements.txt chỉ giới hạn >=, không pin môi trường tái lập; nhánh SBERT thiếu deps. Không dùng venv tracked máy cũ, không pip install. Các warning deprecated từ lần npm ci là lịch sử; audit này không chạy lại install nên không báo chúng như warning mới.

# 87 PHÉP KIỂM — KẾT QUẢ, LỆNH VÀ GIỚI HẠN

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

## Tổng kết

**87 phép kiểm,70 PASS,17 FAIL**,không phải 87 chức năng độc lập. API 50(37/13),browser 16(12/4),foundation 21(21/0). Lint/build/syntax/compile là nhóm kiểm tra riêng không cộng vào 87. Các lần browserharnessbanđầulỗiselector/serialization/phiên lưu đã được sửa ở công cụ và chạy lại,có giữ JSON lịch sử; không tính các FAIL harness đó là lỗi app. JSON cuối là browser-results-verified.json.

## API thật

| Test | Kết quả | Chi tiết |
| --- | --- | --- |
| Health Backend connected, IPFS unconfigured | PASS | Đạt assertion |
| Real signed nonce company login creates profile | PASS | Đạt assertion |
| Real signed nonce student login creates profile | PASS | Đạt assertion |
| Second company signed login | PASS | Đạt assertion |
| Consumed signature replay rejected 401 | PASS | Đạt assertion |
| Wrong-wallet signature rejected 401 | PASS | Đạt assertion |
| JWT /auth/me res to res correct role | PASS | Đạt assertion |
| No-token /auth/me denied 401 | PASS | Đạt assertion |
| Demo login requires proof (security) | FAIL | Actual 200; JWT issued=true |
| Seed topic list 25 | PASS | Đạt assertion |
| Normalized GET /data/overview | PASS | Đạt assertion |
| Normalized GET /data/students | PASS | Đạt assertion |
| Normalized GET /data/companies | PASS | Đạt assertion |
| Normalized GET /data/topics | PASS | Đạt assertion |
| Normalized GET /data/assignments | PASS | Đạt assertion |
| Normalized GET /data/submissions | PASS | Đạt assertion |
| Normalized GET /data/evaluations | PASS | Đạt assertion |
| Normalized GET /data/ai-analyses | PASS | Đạt assertion |
| Normalized GET /data/chain-events | PASS | Đạt assertion |
| Self Student profile PUT and readback | PASS | Đạt assertion |
| Other Student profile PUT denied 403 | PASS | Đạt assertion |
| Student cannot create topic 403 | PASS | Đạt assertion |
| Invalid KPI weights rejected 400 | PASS | Đạt assertion |
| Company creates topic with total weights 100 | PASS | Đạt assertion |
| Cross-company assign denied 403 | PASS | Đạt assertion |
| Owner assigns registered student | PASS | Đạt assertion |
| maxSlots 2 permits second student (business) | FAIL | Actual 409 after first assignment despite maxSlots=2  409 !== 200  |
| Submit without Pinata returns 503 and no Submission write | PASS | Đạt assertion |
| Evaluate unsubmitted KPI denied 409 | PASS | Đạt assertion |
| Complete before approval denied 409 | PASS | Đạt assertion |
| Demo presets load seeded company/student (demo only) | PASS | Đạt assertion |
| Company evaluates pre-seeded submitted KPI | PASS | Đạt assertion |
| GET jds never creates records (security) | FAIL | GET created 3 documents  3 !== 0  |
| GET tasks never creates records (security) | FAIL | GET created 3 documents  3 !== 0  |
| GET worklogs never creates records (security) | FAIL | GET created 2 documents  2 !== 0  |
| GET attendance/history never creates records | FAIL | GET history inserted sample records  7 !== 0  |
| Attendance history respects requested student filter | PASS | Đạt assertion |
| Invalid QR must be rejected (security) | FAIL | Actual 200  200 !== 400  |
| Duplicate attendance blocked 409 | PASS | Đạt assertion |
| Company creates task for explicit student | PASS | Đạt assertion |
| Unrelated company cannot update task (security) | FAIL | Actual 200  200 !== 403  |
| Student creates real worklog | PASS | Đạt assertion |
| Student cannot self-approve worklog (security) | FAIL | Actual 200  200 !== 403  |
| Student cannot record arbitrary tx on foreign topic | FAIL | Actual 200  200 !== 403  |
| Unknown certificate must not be verified | FAIL | Actual 200 verified=true onChain=true |
| Sync endpoint requires authorization | FAIL | Actual 200 success=true |
| AI service runtime TF-IDF health | PASS | TF-IDF fallback |
| Frontend/Backend-facing match-cv reaches live AI | PASS | [{'title': 'Kỹ sư Thực tập Smart Contract & DeFi', 'score': 46.6}, {'title': 'Thực tập sinh Blockchain Frontend Developer', 'score': 12.7}, {'title': 'Thực tập sinh Full stack AI & Web3 Integration', 'score': 12.6}] |
| AI HTTP blank report should return 0 | FAIL | Actual 50  50 !== 0  |
| Dashboard works on seeded data | PASS | {'total Topics': 26, 'completed Topics': 6, 'in Progress Topics': 14, 'open Topics': 6, 'completionRate': 23, 'avgScore': 82, 'total Students': 17, 'total Companies': 8, 'total Assignments': 20, 'onChain Events': 0} |


“Attendancehistoryrespectsfilter”PASS chỉ assertion array.every; với kết quả[]có thể đạt rỗng,không chứng minh scope correct. GETđầutiênđãchứngminhtạomẫuvíkhácnhưngcasehậuđọcduplicateđượccatchthành[]; không dùng positive đó để hạ severity. Matching blank report expected 0 là policy kiểm định đề xuất,chưa rubric đã duyệt; actual 50 là kết quả đo.

## Browser thật

| Test | Kết quả | Chi tiết |
| --- | --- | --- |
| Initial React page renders populated topic list | PASS | {'headings': ['Web3 Internship Hub', 'DEMO REAUDIT controlled topic', 'Đề tài mẫu 24: Bộ công cụ kiểm thử Solidity', 'Đề tài mẫu 23: Ứng dụng lưu trữ IPFS', 'Đề tài mẫu 22: Quản lý danh tính phi tập trung', 'Đề tài mẫu 21: Marketplace tài sản số', 'Đề tài mẫu 20: Hệ thống staking token', 'Đề tài mẫu 19: Phát hiện giao dịch bất thường', 'Đề tài mẫu 18: Cổng tuyển dụng Web3', 'Đề tài mẫu 17: Ứng dụng NFT chứng nhận học tập', 'Đề tài mẫu 16: Smart Contract cho chuỗi cung ứng', 'Đề tài mẫu 15: Dashboard quản trị DAO', 'Đề tài mẫu 14: Phân tích dữ liệu giao dịch DeFi', 'Đề tài mẫu 13: Xây dựng ví Web3 đa chuỗi', 'Đề tài mẫu 12: Bộ công cụ kiểm thử Solidity', 'Đề tài mẫu 11: Ứng dụng lưu trữ IPFS', 'Đề tài mẫu 10: Quản lý danh tính phi tập trung', 'Đề tài mẫu 09: Marketplace tài sản số', 'Đề tài mẫu 08: Hệ thống staking token', 'Đề tài mẫu 07: Phát hiện giao dịch bất thường', 'Đề tài mẫu 06: Cổng tuyển dụng Web3', 'Đề tài mẫu 05: Ứng dụng NFT chứng nhận học tập', 'Đề tài mẫu 04: Smart Contract cho chuỗi cung ứng', 'Đề tài mẫu 03: Dashboard quản trị DAO', 'Đề tài mẫu 02: Phân tích dữ liệu giao dịch DeFi', 'Đề tài mẫu 01: Xây dựng ví Web3 đa chuỗi', 'Phát triển hệ thống quản trị DAO Web3', 'DEMO REAUDIT controlled topic', 'Tiến độ Thực tập & Tiêu chí KPI (2 mốc)']} |
| Demo company login through real UI | PASS | Demo only; not wallet-security proof |
| Dashboard tab renders using Backend | PASS | ['Web3 Internship Hub', 'Nexus Labs Blockchain', 'Tiến Độ Thực Tập & Trạng Thái KPI Các Đề Tài'] |
| CV/JD tab renders real JD data | PASS | ['Web3 Internship Hub', 'Hồ Sơ Năng Lực Ứng Viên (CV)', 'Vị Trí Thực Tập Đang Tuyển Dụng (4)'] |
| Company creates JD through browser form and persists | PASS | Đạt assertion |
| Browser -> Backend -> AI matching works | PASS | Browser request 200; AI access log corroborates live /api/match |
| Apply button persists an application (business) | FAIL | Toast only: no POST from apply click |
| Attendance management tab renders | PASS | ['Web3 Internship Hub'] |
| Task and worklog subtabs render | PASS | Both subtab buttons clicked and rendered |
| Web3 tab renders events view | PASS | ['Web3 Internship Hub', 'Tra Cứu Chứng Nhận Thực Tập Web3 On-Chain (SBT / NFT Explorer)'] |
| Web3 mount must not POST sync (business) | FAIL | Observed automatic POST sync-events  2 !== 0  |
| Unknown certificate never shows VERIFIED badge (business) | FAIL | Unknown query rendered ON-CHAIN VERIFIED / ERC-5192 badge |
| Mobile viewport 320 has no horizontal overflow | FAIL | scrollWidth=529 |
| Demo student login and restore through browser | PASS | Preset login and /auth/me restore; not MetaMask proof |
| Demo mentor login and restore through browser | PASS | Preset login and /auth/me restore; not MetaMask proof |
| No uncaught browser JavaScript exceptions | PASS | Đạt assertion |


NgoạilệJavaScriptuncaught 0; console warning/error 0 trong capture,không suy ra 0 mọi vấn đề. Externalfonts/RPC bị chặn có chủ đích bởiFetchinterception. Đủ 5 tab+2 subtabsrender,không phải mọi form mọi case đã test. Tạo JD form/readback và 3 preset restore được test; submit/score UI còn NOT TESTED.

## Foundation: app+DB thật,IPFS stub

| STT | Test hiện có | Kết quả | Phạm vi |
| --- | --- | --- | --- |
| 1 | health trả về trạng thái DB và IPFS | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 2 | endpoint không tồn tại trả 404 JSON | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 3 | nonce: từ chối ví không hợp lệ | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 4 | login: không có chữ ký bị từ chối | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 5 | login: chữ ký của ví khác bị từ chối (401) | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 6 | login: không có nonce thì từ chối | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 7 | login: nonce chỉ dùng được một lần (chống replay) | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 8 | login: không cho tự đăng ký role mentor/admin | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 9 | login: user cũ giữ nguyên role dù gửi role khác | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 10 | /me cần token hợp lệ | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 11 | profile: chỉ chủ tài khoản được sửa | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 12 | PUT /data/students / companies cần xác thực và đúng chủ | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 13 | tạo đề tài: cần đăng nhập, đúng role company | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 14 | tạo đề tài: tổng trọng số KPI phải = 100% | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 15 | tạo đề tài: danh tính công ty lấy từ token, bỏ qua companyWallet trong body | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 16 | công ty khác không được sửa/phân công/hoàn thành đề tài | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 17 | phân công: sinh viên phải là tài khoản student đã đăng ký | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 18 | luồng đầy đủ: assign → nộp → đánh giá → hoàn thành, kiểm tra phân quyền từng bước | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 19 | mentor được chỉ định có quyền chấm, mentor lạ thì không | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 20 | nộp báo cáo khi chưa cấu hình PINATA_JWT trả 503, không tạo CID giả | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |
| 21 | ID đề tài sai định dạng trả 400, không tồn tại trả 404 | PASS | DB foundation thật; IPFS stub ở test có; AI 8001 |


Không chạy nguyên bản npm test vì helpers.js:15,22 có dropDatabase. Đã copy test/helper sang ignored staging,loại bỏ hoàn toàn 2 dòng dropDatabase,đổi require path và URI đích cố định foundation DB mới đã xác minh rỗng. Các assertion gốc giữ nguyên; khôngnớiđểchoPASS. Preload guard kiểm URI/chặn xóa dữ liệu nghiệp vụ/dropIndex; helpermớikhôngchứacall dropDatabase. Không clean up DB sau test. 21 PASS không chứng minh IPFS thật,vì ngay test gốc có stub upload trong 2 full flow tests; không có chain.

## Lệnh và output build

```powershell
# ChỉURI/processenvdemo,trướcđócóguardpreloadchặnxóa vàdbkhác
# Trong server: npm.cmd run seed
# AI: python -B -m uvicorn main:app --host 127.0.0.1 --port 8001
# Backend: npm.cmd start (PORT5001; DBdemo; guard; AI_SERVICE_URL8001)
# Frontend: npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
# VITE_API_URL=http://127.0.0.1:5001/api chỉtrongprocessFrontend
# Kiểmtra:
npm.cmd run lint
npm.cmd run build -- --outDir dist/demo-reaudit-20261030-2340
# node --check31file server/src,scripts,test
# hardhat.cmd compile trongstagingbyte-identicalmới,khôngartifacttracked
# node --require .../foundation-guard.cjs --test --test-concurrency=1 .../foundation.test.cjs
# node .../api-demo.cjs; node .../browser-demo.cjs
```

Đây là nhật ký lệnh đã chạy,không hướng dẫn copy seed vào DB gốc. Backend JWT chỉ process không in secret. Lint 0/32 warnings,build 0/chunk warning,syntax 31/31,compile 2 contract 0.8.24 EVM paris PASS.

```text
> client@0.0.0 build
> vite build --outDir dist/demo-reaudit-20261030-2340

vite v8.3.4 building client environment for production...
transforming...
✓ 2062 modules transformed.
rendering chunks...
computing gzip size...
dist/demo-reaudit-20261030-2340/index.html                   1.22 kB │ gzip:   0.71 kB
dist/demo-reaudit-20261030-2340/assets/index-CvD4t5L8.css    4.55 kB │ gzip:   1.83 kB
dist/demo-reaudit-20261030-2340/assets/index-Nnxj_vo1.js   576.04 kB │ gzip: 184.89 kB

npm.cmd : [plugin builtin:vite-reporter] 
At line:2 char:89
+ ... +$env:PATH; npm.cmd run build -- --outDir dist/demo-reaudit-20261030- ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([plugin builtin:vite-reporter] :String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: 
https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 570ms
```

## 32 warning lint vị trí thật

```text
> client@0.0.0 lint
> oxlint

src/components/DashboardView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'BrainCircuit' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:7:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'ExternalLink' is imported but never used. help: Consider removing this import.
src/components/DashboardView.jsx:19:10: warning eslint(no-unused-vars): Variable 'loading' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/AttendanceView.jsx:6:3: warning eslint(no-unused-vars): Identifier 'Calendar' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:10:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'Sparkles' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'UserCheck' is imported but never used. help: Consider removing this import.
src/components/AttendanceView.jsx:16:42: warning eslint(no-unused-vars): Parameter 'user' is declared but never used. Unused parameters should start with a '_'. help: Consider removing this parameter.
src/components/AttendanceView.jsx:50:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
src/components/CvJdView.jsx:8:3: warning eslint(no-unused-vars): Identifier 'Users' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:11:3: warning eslint(no-unused-vars): Identifier 'CheckCircle2' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:12:3: warning eslint(no-unused-vars): Identifier 'AlertCircle' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:13:3: warning eslint(no-unused-vars): Identifier 'Clock' is imported but never used. help: Consider removing this import.
src/components/CvJdView.jsx:20:10: warning eslint(no-unused-vars): Variable 'matchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:20:27: warning eslint(no-unused-vars): Variable 'setMatchingResults' is declared but never used. Unused variables should start with a '_'. help: Consider removing this declaration.
src/components/CvJdView.jsx:53:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
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

## Bảo toàn / chưa kiểm

Database gốc hash/index giống trước sau,3 documents; demo 223 và foundation 67 ở snapshot cuối được giữ. 8336 tracked/22 untracked baseline không đổi,HEAD không đổi. Git chỉ có các untracked cũ/báo cáo; no commit/push/merge. Nền Backend/Mongo/Frontend cũ không bị dừng; service demo giữ chạy,Edge headless đã đóng.

BLOCKED: Pinata upload/readback thật; RPC/contract deploy/transactions/mint token; SBERT deps/model/benchmark; full E2ErealIPFS+chain. NOT TESTED: MetaMask browser/wallethardware,concurrency/load/fuzz/production/testnet,Lighthouse/UAT. NOT IMPLEMENTED: Application,QR scanner/GPS/checkout,risk classifier/metrics,admin/school full flow/token mint. Không đổi NOT TESTED thành PASS.

Evidence JSON/logs/scripts giữ tại`contracts/node_modules/.cache/demo-20261030-2340/`: original-db-before.json,final-databases.json,git-integrity.json,api-results.json,browser-results-verified.json,foundation.log,ai.stdout.log,các log process và compile. Không chứa secret production. Ảnh copy vào screenshots trong bộ report này.

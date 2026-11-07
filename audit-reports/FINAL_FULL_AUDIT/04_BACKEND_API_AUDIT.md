# BACKEND VÀ TOÀN BỘ API

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Kiểm kê

**48 endpoint Express**: auth6, topics11, data14, internship16, health1. AI có thêm3 endpoint riêng ở báo cáo06. Không có controller layer tách riêng; routes xử lý nghiệp vụ trực tiếp. Không có DELETE API công khai trong source hiện tại.

| Method | URL | File/vị trí | Vai trò thực tế | Auth | Validation | Side effect | Frontend consumer | Kiểm thử |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | /api/auth/nonce | `server/src/routes/auth.routes.js:34` | Công khai | Không | Ví đúng regex; chuẩn hóa lowercase | AuthNonce upsert | signInWithWallet | BLOCKED live write; source reviewed |
| POST | /api/auth/login-wallet | `server/src/routes/auth.routes.js:42` | Công khai | Không | Ví/chữ ký/nonce; role đăng ký company/student | Consume nonce; User create; Student/Company upsert | signInWithWallet | BLOCKED live write; source reviewed |
| POST | /api/auth/demo-login | `server/src/routes/auth.routes.js:72` | Công khai | Không | Chọn preset; không chữ ký, role lạ fallback company | User/profile create/upsert; cấp JWT | AuthModal 3 demo buttons | FAIL mock isolation; live write BLOCKED |
| GET | /api/auth/me | `server/src/routes/auth.routes.js:105` | Mọi user đã login | JWT | JWT + User còn tồn tại | Không | restoreSession | PASS live negative401; chưa có user thật |
| GET | /api/auth/profile/:wallet | `server/src/routes/auth.routes.js:108` | Công khai | Không | Normalize ví, không regex rõ | Không; trả User công khai | Không consumer trực tiếp | NOT TESTED |
| PUT | /api/auth/profile/:wallet | `server/src/routes/auth.routes.js:115` | Chủ wallet | JWT | JWT owner; whitelist fields | User save; normalized profile sync | Chưa UI đầy đủ | BLOCKED live write; source reviewed |
| GET | /api/topics | `server/src/routes/topic.routes.js:64` | Công khai | Không | Filter/status; studentWallet tùy chọn | Không ghi DB; gọi AI nếu có hồ sơ | App.fetchTopics | PASS HTTP rỗng |
| POST | /api/topics/ai-match | `server/src/routes/topic.routes.js:96` | Mọi user đã login | JWT | JWT; cấu trúc payload adapter | Không ghi DB; compute AI | Không gọi trực tiếp từ UI hiện tại | BLOCKED live write; source reviewed |
| GET | /api/topics/:id | `server/src/routes/topic.routes.js:101` | Công khai | Không | ObjectId; 400/404 | Không | Có thể đọc detail; App chủ yếu dùng list | NOT TESTED |
| POST | /api/topics | `server/src/routes/topic.routes.js:106` | company | JWT | Role company, title/description/date, KPI integer weights tổng100, maxSlots | Topic create; profile upsert; optional Pinata | App create topic modal | PASS HTTP rỗng |
| POST | /api/topics/:id/kpis | `server/src/routes/topic.routes.js:158` | company sở hữu | JWT | Owner, open, weight tổng <=100 | Topic embedded KPI save | Không thấy UI riêng | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/mentor | `server/src/routes/topic.routes.js:177` | company sở hữu | JWT | Owner, ví mentor đã đăng ký | Topic.mentorWallet save | Không thấy flow UI riêng | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/assign | `server/src/routes/topic.routes.js:187` | company sở hữu | JWT | Owner, open/slots/KPI100, student đăng ký | Assignment upsert; Topic assigned | App assign modal | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/kpis/:milestoneIndex/submit | `server/src/routes/topic.routes.js:214` | student được phân công | JWT | Assigned student; KPI pending/rejected, nonempty content | Pinata; AI; Assignment/Submission/AIAnalysis/Topic | App submit modal | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/kpis/:milestoneIndex/evaluate | `server/src/routes/topic.routes.js:276` | owner hoặc mentor được gán | JWT | Owner/assigned mentor; submitted; score0..100; enum | KPIEvaluation/Topic/Assignment | App evaluation modal | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/complete | `server/src/routes/topic.routes.js:317` | company sở hữu | JWT | Owner; all KPI approved, weight100 | Pinata cert JSON; Topic/Student/Assignment | App complete button | BLOCKED live write; source reviewed |
| POST | /api/topics/:id/record-chain-tx | `server/src/routes/topic.routes.js:352` | Mọi user đã login | JWT | JWT + topic tồn tại; thiếu owner/receipt/hash validation | Topic.txHash/onChainId save | App sau các ethers calls | FAIL mock isolation; live write BLOCKED |
| GET | /api/data/overview | `server/src/routes/data.routes.js:24` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/students | `server/src/routes/data.routes.js:33` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/students/:id | `server/src/routes/data.routes.js:44` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | NOT TESTED |
| PUT | /api/data/students/:id | `server/src/routes/data.routes.js:56` | Chủ profile | JWT | JWT + chủ profile; whitelist trường | Student hoặc Company + User update | CV form chưa nối endpoint này | BLOCKED live write; source reviewed |
| GET | /api/data/companies | `server/src/routes/data.routes.js:72` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/companies/:id | `server/src/routes/data.routes.js:82` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | NOT TESTED |
| PUT | /api/data/companies/:id | `server/src/routes/data.routes.js:94` | Chủ profile | JWT | JWT + chủ profile; whitelist trường | Student hoặc Company + User update | CV form chưa nối endpoint này | BLOCKED live write; source reviewed |
| GET | /api/data/topics | `server/src/routes/data.routes.js:109` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/topics/:id | `server/src/routes/data.routes.js:125` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | NOT TESTED |
| GET | /api/data/assignments | `server/src/routes/data.routes.js:133` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/submissions | `server/src/routes/data.routes.js:146` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/evaluations | `server/src/routes/data.routes.js:157` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/ai-analyses | `server/src/routes/data.routes.js:168` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/data/chain-events | `server/src/routes/data.routes.js:179` | Công khai | Không | Page/limit (tối đa100), escaped search; ID/wallet lookup; invalid filter có thể bị bỏ qua | Không | Không consumer UI riêng | PASS HTTP rỗng |
| GET | /api/internship/dashboard | `server/src/routes/internship.routes.js:25` | Công khai | Không | role/wallet query, không auth | Không; điểm mặc định85 khi rỗng | DashboardView mount | PASS HTTP rỗng |
| GET | /api/internship/jds | `server/src/routes/internship.routes.js:95` | Công khai | Không | Public; status open | JD.create 3 mẫu nếu rỗng | CvJdView mount — nguy hiểm | FAIL mock GET ghi; BLOCKED live |
| POST | /api/internship/jds | `server/src/routes/internship.routes.js:138` | company | JWT | Company; title/description; skills array | JD create | CvJdView create modal | FAIL mock GET ghi; BLOCKED live |
| POST | /api/internship/match-cv | `server/src/routes/internship.routes.js:157` | Công khai | Không | Public; kỹ năng/bio từ body | Không ghi; đọc JD và gọi AI sort | CvJdView matching button | BLOCKED live write; source reviewed |
| GET | /api/internship/tasks | `server/src/routes/internship.routes.js:197` | Công khai | Không | Query student/company tùy chọn | Task.create 3 mẫu nếu rỗng không filter | AttendanceView mount — nguy hiểm | FAIL mock GET ghi; BLOCKED live |
| POST | /api/internship/tasks | `server/src/routes/internship.routes.js:240` | Mọi user đã login | JWT | JWT; title; thiếu company role/assignment check | Task create; fallback tự gán | AttendanceView task modal | FAIL mock GET ghi; BLOCKED live |
| PATCH | /api/internship/tasks/:id/status | `server/src/routes/internship.routes.js:255` | Mọi user đã login | JWT | JWT; enum status; thiếu owner check | Task update, completedAt | AttendanceView task buttons | FAIL mock isolation; live write BLOCKED |
| GET | /api/internship/attendance/today-qr | `server/src/routes/internship.routes.js:273` | Công khai | Không | Public; không session/company auth | Không; hash dự đoán từ ngày | AttendanceView mount | PASS HTTP rỗng |
| POST | /api/internship/attendance/check-in | `server/src/routes/internship.routes.js:286` | Mọi user đã login | JWT | JWT; không validate hash/hạn/GPS/student role | Attendance create; company hardcode | AttendanceView check-in | FAIL mock isolation; live write BLOCKED |
| GET | /api/internship/attendance/history | `server/src/routes/internship.routes.js:313` | Công khai | Không | Public; studentWallet filter tùy chọn | Attendance.insertMany 7 mẫu nếu rỗng | AttendanceView mount — nguy hiểm | FAIL mock GET ghi; BLOCKED live |
| GET | /api/internship/worklogs | `server/src/routes/internship.routes.js:341` | Công khai | Không | Public; studentWallet tùy chọn | WorkLog.create 2 mẫu nếu rỗng | AttendanceView mount — nguy hiểm | FAIL mock GET ghi; BLOCKED live |
| POST | /api/internship/worklogs | `server/src/routes/internship.routes.js:379` | Mọi user đã login | JWT | JWT; title/tasksDone, thiếu assignment/role check | WorkLog create, company hardcode | AttendanceView log modal | FAIL mock GET ghi; BLOCKED live |
| PATCH | /api/internship/worklogs/:id/review | `server/src/routes/internship.routes.js:396` | Mọi user đã login | JWT | JWT; thiếu owner/role; thiếu enum/runValidators | WorkLog review update | Chưa UI review | FAIL mock isolation; live write BLOCKED |
| GET | /api/internship/certificate/:query | `server/src/routes/internship.routes.js:410` | Công khai | Không | Nhận ObjectId/wallet/tx; không kết quả vẫn200 | Không ghi; trả fake verified/onChain | Web3CertificateView search | FAIL live GET query không tồn tại |
| GET | /api/internship/chain-events | `server/src/routes/internship.routes.js:465` | Công khai | Không | Public, limit50 | Không | Web3CertificateView sau sync | PASS HTTP rỗng |
| POST | /api/internship/sync-events | `server/src/routes/internship.routes.js:470` | Công khai | Không | Public, không quyền | Backfill từ0; ChainEvent upsert/Topic update nếu RPC | Web3CertificateView mount + refresh — nguy hiểm | FAIL mock isolation; live write BLOCKED |
| GET | /api/health | `server/src/app.js:18` | Công khai | Không | Không | Không | HTTP kiểm tra thủ công | PASS live200 connected |

## Startup, middleware và lỗi vận hành

- `server/src/index.js:11` gọi mongoose.connect rồi khởi động listener sau khi connected; app.listen chạy riêng trước khi connect hoàn tất. Health có thể online nhưng disconnected; cần readiness503 khi DB chưa sẵn sàng.
- Mongoose autoCreate/autoIndex có thể tạo collections/indexes khi startup. 14 collections/36 indexes đã tồn tại. Không khởi động lại Backend trong đợt kiểm định này.
- `server/src/services/chainListener.js` startup/backfill/realtime có thể upsert chain_events và sửa topics nếu RPC có contract. Không chỉ là listener đọc. RPC8545 hiện không chạy nên không có xác minh đồng bộ runtime.
- `requireAuth` kiểm JWT rồi nạp User để dùng role hiện tại; nhóm topics có owner/assigned/evaluator guards tốt hơn nhóm internship. PUT profile dùng whitelist; chưa thấy mass assignment toàn bộ req.body ở các route này.
- Error wrapper trả JSON và 400/401/403/404 đúng một số negative path đã test. CastError/ObjectId chưa được chuẩn hóa đều ở internship; status update WorkLog không runValidators. Không thử payload phá hoại.
- Nhóm data có pagination/escaped search; nhóm topics/internship còn nhiều find không phân trang. GET topics có student skills có thể gọi AI tuần tự N lần × timeout5s. Không benchmark dữ liệu lớn vì DB rỗng.
- Không có rate-limit, audit log nghiệp vụ chuẩn, health gate AI/Pinata/chain, background retry queue, transaction/outbox hoặc reconcile job tin cậy. Pinata/AI/RPC không bắt buộc để app nghe5000, nhưng submit/complete cần Pinata.

## Tách đọc và ghi cần thực hiện sau phê duyệt

GET phải trả [] khi không có dữ liệu, bỏ các nhánh create/insertMany. Fixture chỉ nằm ở công cụ demo opt-in dùng DB khác. POST sync-events phải là hành động quản trị/worker được xác thực, không chạy khi mount UI. POST/PATCH nghiệp vụ phải kiểm role + owner + assignment + tenant. Tách trạng thái lưu DB, upload IPFS và xác nhận chain; không trả “verified/minted” khi chỉ có MongoDB.

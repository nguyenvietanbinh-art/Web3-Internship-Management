# Kế hoạch sửa các thao tác ghi dữ liệu ngoài ý muốn

Ngày phân tích: **30/10/2026**, Asia/Bangkok. Branch `branch_1`.

## 1. Kết luận và phạm vi phê duyệt

**Chỉ phân tích và lập kế hoạch; chưa sửa source hoặc schema.** Đã đối chiếu FRONTEND_RUNTIME_RESULT.md, BACKEND_RUNTIME_RESULT.md và 26 phát hiện trong 02-findings.md với source hiện tại.

Có **5 luồng cần sửa trước khi mở các tab liên quan**:

1. GET `/api/internship/jds` tự tạo JD mẫu.
2. GET `/api/internship/tasks` tự tạo task mẫu.
3. GET `/api/internship/attendance/history` tự tạo lịch sử điểm danh mẫu.
4. GET `/api/internship/worklogs` tự tạo nhật ký mẫu.
5. Tab Web3 tự POST `/api/internship/sync-events` khi mount; endpoint có thể đồng bộ ghi DB mà không yêu cầu xác thực.

Đề xuất gói sửa đầu tiên: bỏ bốn nhánh auto-seed trong GET; tách tải event chỉ đọc khỏi đồng bộ có chủ đích; bảo vệ sync endpoint; bổ sung trạng thái rỗng/lỗi và kiểm thử không kết nối DB thật. **Không cần đổi schema, thêm index, migration hoặc xóa dữ liệu.**

Mốc **14 collection, 36 index, 0 document** là kết quả các lần runtime trước trong báo cáo, **không phải phép đo mới trong đợt phân tích này**. Lần này không gọi API, không truy vấn DB, không mở browser/tab, không chạy test, không restart tiến trình hoặc seed. Không dùng việc DB trước đây rỗng để suy ra các GET nguy hiểm đã được kiểm thử an toàn.

Vị trí dòng dưới đây thuộc source tại thời điểm lập kế hoạch; sau sửa có thể thay đổi.

## 2. Nguyên tắc phân loại

| Nhóm | Ý nghĩa trong kế hoạch |
| --- | --- |
| R — Chỉ đọc DB | Không tạo/sửa/xóa dữ liệu nghiệp vụ hoặc index; có thể cập nhật React state hoặc log thông thường |
| C — Tính toán/đọc hệ thống ngoài | Có thể dùng POST để gửi CV/text hoặc đọc RPC; chưa có ghi DB nghiệp vụ trong source hiện tại |
| W — Ghi có chủ đích | Người dùng chủ động submit/click thao tác ghi; vẫn cần auth, quyền, validation và kiểm soát gửi lặp |
| U — Ghi ngoài ý muốn | Việc tải danh sách/mount view dẫn đến tạo dữ liệu hoặc đồng bộ ghi DB mà người dùng chưa chọn |
| B — Ghi nền/lifecycle | Không phải request UI; ví dụ Mongoose tạo cấu trúc, listener đồng bộ khi boot/nhận event |

GET/HEAD được dùng để đọc representation, không để người dùng vô tình yêu cầu tạo dữ liệu nghiệp vụ. Điều này không cấm access log hoặc side effect vận hành thông thường. Không đồng nhất “idempotent” với “chỉ đọc”: index chống trùng không biến GET tạo điểm danh thành an toàn. [RFC 9110, safe methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.1).

POST cũng không tự chứng minh thao tác là có chủ đích: POST sync trong useEffect vẫn là U. Ngược lại POST matching chỉ tính toán có thể hợp lý vì payload CV/text, không cần ép thành GET. Quyền ghi phải được kiểm tra ở backend, không chỉ ẩn nút frontend.

## 3. Toàn bộ request tự động khi mở trang/chuyển tab

### Trang mặc định, thay đổi phiên và root effects

| Trigger | File/vị trí frontend | Request hoặc hành vi | Nhóm và tác động |
| --- | --- | --- | --- |
| Mount App | App.jsx:98–109; api/client.js:74–83 | restoreSession; GET `/api/auth/me` **chỉ khi có w3i_token trong localStorage** | R: đọc User. Có thể cập nhật user state hoặc xóa token local khi 401; không tự tạo tài khoản |
| Mount App | App.jsx:108; api/web3Client.js:10–25 | checkContractConnection qua BrowserProvider nếu có ethereum, nếu không qua RPC 127.0.0.1:8545 | C: đọc chain/network/code; không phải DB write hay gửi transaction. Vẫn là tương tác ví/RPC tự động, chưa phù hợp phiên kiểm thử không chạm Web3 nếu không mock/chặn |
| Mount App hoặc user.walletAddress đổi | App.jsx:171–187; topic.routes.js:64–93 | GET `/api/topics`, có thể kèm studentWallet | R với DB; nhánh matching có thể gọi AI qua HTTP, không thấy lưu kết quả matching vào DB tại GET này |
| accountsChanged từ provider | App.jsx:112–121 | Xóa token/state và toast; không có HTTP trực tiếp trong callback | Local state. Việc đổi user có thể kích hoạt GET topics tiếp theo |
| Chọn topic | App.jsx:773 | Chọn object từ state | Không tạo request mới chỉ từ click danh sách; refreshTopic GET detail được gọi sau hành động ghi có chủ đích |

App mặc định `activeTab='topics'` tại App.jsx:55. Các view khác render có điều kiện tại App.jsx:708–732. **Không phải mở trang mặc định sẽ lập tức seed cả JD/task/attendance/worklog.** Các effect nguy hiểm được kích hoạt khi mount view tương ứng.

React StrictMode ở main.jsx:7 có thể chạy thêm chu kỳ effect trong dev, làm lộ/làm nặng lỗi request không an toàn. Không sửa bằng cách tắt StrictMode hay thêm cờ “chạy một lần” để che auto-write. [Tài liệu React StrictMode](https://react.dev/reference/react/StrictMode).

### Các tab và refresh

| Tab/trigger | File/vị trí | Request | Nhóm |
| --- | --- | --- | --- |
| Dashboard mount hoặc user đổi | DashboardView.jsx:21–34 | GET `/api/internship/dashboard?wallet=...&role=...` | R: counts/find; source không ghi DB |
| CV/JD mount | CvJdView.jsx:43–54 | GET `/api/internship/jds` | **U**: backend JD.create nếu rỗng |
| CV/JD sau submit tạo JD | CvJdView.jsx:74–93 | POST jds rồi GET jds qua fetchJds | POST là W; GET refresh phải là R sau sửa |
| AttendanceView mount | AttendanceView.jsx:32–51 | GET `/api/internship/attendance/today-qr` | R với DB: tính/hash phiên trong response, không lưu DB; QR bảo mật chưa hoàn chỉnh là vấn đề riêng |
| Cùng mount AttendanceView | AttendanceView.jsx:36 | GET `/api/internship/attendance/history` | **U**: insertMany mẫu nếu query không có kết quả |
| Cùng mount AttendanceView | AttendanceView.jsx:37 | GET `/api/internship/tasks` | **U**: create mẫu khi rỗng và không có filter ví |
| Cùng mount AttendanceView | AttendanceView.jsx:38 | GET `/api/internship/worklogs` | **U**: create mẫu khi query rỗng |
| Sau check-in người dùng chủ động | AttendanceView.jsx:54–62 | POST check-in rồi fetchData gọi lại cả bốn GET trên | POST là W; refresh hiện có thể gây U ở các collection không liên quan |
| Chuyển subtab attendance/tasks/worklogs | AttendanceView.jsx:115,126,137 | Chỉ setActiveSubTab | Không có effect mới riêng cho subtab. **Cả bốn GET đã chạy ngay khi mount tab cha**, không chờ chọn subtab task/nhật ký |
| Web3 mount | Web3CertificateView.jsx:23–40 | POST sync-events rồi GET chain-events | **U**: mount kích hoạt command ghi, không phải chỉ tải ledger |
| Nút Đồng Bộ Sự Kiện | Web3CertificateView.jsx:175–183 | Cũng gọi fetchChainEvents như effect | Có ý định W từ click, nhưng dùng chung hàm khiến không phân biệt load và command; backend thiếu quyền |
| Tìm chứng nhận bằng form | Web3CertificateView.jsx:42–54 | GET `/api/internship/certificate/:query` | R với DB, có fallback verified giả (A02); **không tự chạy khi mount** chỉ vì input có ví mẫu |

Rời tab cha rồi quay lại làm component mount lại và chạy lại effect. Refresh trang, nhiều cửa sổ hoặc nhiều người xem cũng có thể lặp request. Hiện không thấy polling timer ứng dụng riêng gây ghi; nguyên nhân trực tiếp là handler GET và effect dùng chung command.

## 4. Ghi có chủ đích cần giữ và không nhầm với auto-write

| Hành động | Endpoint | File chính | Ghi/tính toán |
| --- | --- | --- | --- |
| Người dùng chọn đăng nhập ví | POST `/api/auth/nonce`, `/login-wallet` | api/client.js:44–57; auth.routes.js:34,42; authService.js | W: nonce, dùng/xóa nonce một lần, tạo User/profile nếu cần. Không phải effect restoreSession |
| Người dùng chọn Ví Demo | POST `/api/auth/demo-login` | api/client.js:61–71; auth.routes.js:72 | W: User/profile; còn bypass A10, không biến đây thành hành động tự động |
| Lưu hồ sơ | PUT auth/profile/:wallet, data/students/:id, data/companies/:id | auth.routes.js:115; data.routes.js:56,94 | W: profile và record liên quan; không tự chạy từ đọc profile |
| Tạo/chỉnh KPI, phân công, mentor, nộp/chấm/hoàn tất, record tx | POST nhóm `/api/topics` | App.jsx:195–387; topic.routes.js:106–359 | W: Topic/Assignment/Submission/Evaluation/AIAnalysis/Student/IPFS; phải giữ điều kiện quyền và kiểm tra receipt theo audit |
| Tạo JD/task/nhật ký/check-in | POST jds/tasks/worklogs/attendance/check-in | CvJdView.jsx:74; AttendanceView.jsx:54,84,97; internship.routes.js:138,240,286,379 | W: chỉ sau hành động hợp lệ; hiện còn thiếu role/ownership/người nhận ở một số route |
| Đổi trạng thái task/duyệt nhật ký | PATCH tasks/:id/status, worklogs/:id/review | AttendanceView.jsx:71; internship.routes.js:255,396 | W; phần review có API nhưng view hiện chưa có đầy đủ UI duyệt; không tự thêm duyệt vào effect |
| Bấm phân tích CV/JD | POST `/api/internship/match-cv`, `/api/topics/ai-match` | CvJdView.jsx:57–71; internship.routes.js:157; topic.routes.js:96 | C: đọc JD và gọi AI/tính điểm, không thấy persistence matching tại các endpoint này |

Không đề xuất xóa các POST/PATCH hợp lệ để làm UI “chỉ đọc” vĩnh viễn. Sửa phải loại bỏ mutation khỏi load flow, đồng thời giữ hành động ghi chủ động hoạt động sau khi có auth/validation phù hợp. Những lỗi phân quyền/QR/receipt riêng chưa tự được giải quyết chỉ bằng sửa method.

## 5. Hồ sơ từng lỗi auto-write

Mức **P1** dưới đây nghĩa là cần sửa trước khi mở các tab trên DB thật/demo đang bảo toàn. Các tác động là **phân tích source, chưa tái hiện bằng request nguy hiểm** trong đợt này.

### AW-01 — GET JD tự seed — P1, liên quan A07/A17/A18/A26

- Endpoint: GET `/api/internship/jds`.
- Vị trí: server/src/routes/internship.routes.js:95–136, đặc biệt 97–133; client/src/components/CvJdView.jsx:43–54.
- Loại side effect: `JD.create([...])` có thể tạo **3 job_descriptions** của ví công ty hardcode khi danh sách rỗng; route không requireAuth.
- Nguyên nhân: gộp chuẩn bị showcase/demo fixture vào handler đọc. “Không có kết quả” bị hiểu là “cần tạo dữ liệu”. Schema không có unique key chống cùng bộ mẫu.
- Hệ quả: xem tin tuyển dụng làm DB thay đổi; hai GET đồng thời có thể cùng qua điều kiện rỗng và tạo trùng; JD không do công ty đang đăng nhập đăng.
- Cách sửa: bỏ nhánh create trong GET; giữ find/sort/lean và response **200 `[]`** khi rỗng. Không gọi seed helper hoặc một POST seed thay thế trong effect.
- Tác động chức năng: lần đầu mở tab sẽ không có 3 tin mẫu; view hiển thị “Chưa có tin tuyển dụng”. POST jds hiện có vẫn là nơi tạo tin khi công ty chủ động submit. Không đổi array response sang object phân trang trong cùng gói sửa.

### AW-02 — GET task tự seed — P1, liên quan A07/A08/A09/A25/A26

- Endpoint: GET `/api/internship/tasks`.
- Vị trí: internship.routes.js:197–238, đặc biệt 204–235; AttendanceView.jsx:32–51.
- Loại side effect: `Task.create([...])` có thể tạo **3 internship_tasks** khi query không có filter và rỗng; student/company wallet hardcode.
- Nguyên nhân: UI gửi GET không filter; backend dùng chính việc thiếu filter như tín hiệu seed, thay vì chỉ đọc danh sách.
- Hệ quả: mở tab Điểm danh đã tạo task, chưa cần bấm subtab Nhiệm vụ; remount/concurrent GET có thể tạo trùng. Task mẫu thuộc người khác vẫn hiển thị trong view đang xem.
- Cách sửa: xóa nhánh create khỏi GET; giữ filter/sort hiện tại, rỗng trả `[]`. **Không chỉ thêm studentWallet vào UI để né nhánh seed**, vì endpoint tự ghi vẫn tồn tại với caller khác.
- Tác động: task rỗng phải có empty state; POST tasks vẫn có chủ đích nhưng lỗi gán chính công ty làm người nhận (A09) và thiếu quyền/scope (A08/A26) cần sửa riêng hoặc được duyệt gói mở rộng. Không khẳng định task nghiệp vụ đã đúng sau AW-02.

### AW-03 — GET lịch sử điểm danh tạo bằng chứng chuyên cần — P1, liên quan A06/A07/A08/A26

- Endpoint: GET `/api/internship/attendance/history`.
- Vị trí: internship.routes.js:313–336, đặc biệt 319–333; AttendanceView.jsx:36,49–51,62.
- Loại side effect: `Attendance.insertMany` tạo tối đa **7 attendances** cho ví demo, gồm **ngày hôm nay**; dùng ngày/giờ động và note trạng thái mẫu.
- Nguyên nhân: điều kiện query rỗng tạo bộ mẫu bất kể studentWallet query là ai; `.catch(() => [])` nuốt lỗi insert, trộn lỗi ghi với trạng thái danh sách rỗng.
- Hệ quả: hồ sơ chuyên cần giả; kết quả có thể không đúng filter; mẫu hôm nay chiếm unique `(studentWallet,date)` và làm check-in thật trả 409. Insert có thể ghi một phần rồi gặp lỗi, nhưng response vẫn bị đổi thành `[]`, không có rollback từ catch.
- Cách sửa: bỏ toàn bộ tạo sampleDates/insertMany/catch khỏi GET; giữ query/sort/limit. Rỗng trả `[]`, lỗi đọc phải qua error handler, không bị giả thành danh sách trống.
- Tác động: lịch sử ban đầu trống và không tự đánh dấu đúng giờ/đi muộn. POST check-in là đường ghi chủ động, nhưng kiểm tra QR/GPS/role vẫn cần gói A06/A08; không thêm check-in khi load.

### AW-04 — GET nhật ký tạo cả bản đã duyệt — P1, liên quan A07/A08/A21/A25/A26

- Endpoint: GET `/api/internship/worklogs`.
- Vị trí: internship.routes.js:341–377, đặc biệt 347–374; AttendanceView.jsx:38,49–51.
- Loại side effect: `WorkLog.create` tạo **2 work_logs**, gồm một bản approved có mentorFeedback/reviewedAt, ví công ty/sinh viên hardcode.
- Nguyên nhân: seed trong nhánh query không có kết quả, kể cả khi filter là một sinh viên không có dữ liệu; không có ràng buộc chống bộ mẫu trùng.
- Hệ quả: xem nhật ký tạo báo cáo và kết quả duyệt chưa có người dùng nộp/mentor duyệt; filter sai; remount hoặc concurrent query có thể nhân bản.
- Cách sửa: GET chỉ find/filter/sort → response array, `[]` khi rỗng. Tạo nhật ký qua POST worklogs và duyệt qua PATCH review sau khi áp quyền đúng; không tự tạo approved document để lấp view trống.
- Tác động: view không có nhật ký tuần mẫu; hiện empty state rõ ràng. Lỗi review thiếu quyền/validator vẫn thuộc A08, không được coi là đã sửa chỉ vì bỏ seed.

### AW-05 — Mount Web3 tự đồng bộ ghi DB — P1, liên quan A03/A07/A11/A12/A16/A26

- Endpoint ghi: POST `/api/internship/sync-events`, internship.routes.js:470–474. Endpoint đọc ledger: GET `/api/internship/chain-events`, dòng 465–468.
- Frontend: Web3CertificateView.jsx:23–40; button dòng 175–183 dùng lại cùng `fetchChainEvents`. App.jsx:728 hiện chưa truyền user vào view.
- Service ghi: chainListener.js:25–108 (`processChainEvent`), 115–150 (`syncPastEvents`).
- Loại side effect: POST quét logs từ block 0, upsert chain_events và update topics/KPI nếu listener đã có contract; không phải giao dịch on-chain. Không thấy normalized Assignment/Submission/Evaluation cập nhật đầy đủ.
- Nguyên nhân: hàm tải bảng vừa command sync vừa GET; effect và button cùng gọi hàm; endpoint không requireAuth/requireRole. Service trả lỗi/not-ready bằng object, route vẫn bọc `success:true`; frontend nuốt lỗi POST rồi báo “đồng bộ thành công”.
- Hệ quả: chỉ xem tab cũng có thể backfill/thay trạng thái đề tài; người chưa đăng nhập gọi được command; StrictMode/remount có thể lặp full scan. Hiện RPC chưa chạy theo báo cáo trước nên có thể chưa ghi, **nhưng code vẫn nguy hiểm khi RPC hoạt động về sau**.
- Cách sửa đề xuất: effect chỉ gọi hàm GET ledger; nút Đồng bộ gọi handler POST riêng sau thao tác người dùng. Backend dùng requireAuth và requireRole hiện có. Với command **global** quét toàn bộ contract, đề xuất chỉ **admin** được gọi; không cho company tự đăng ký kích hoạt global sync. Trả 401/403 trước khi chạm RPC/DB write.
- Khi contract/RPC chưa sẵn sàng: trả 503 với code ổn định như `SYNC_UNAVAILABLE`, không bọc thành success. Cần chuẩn hóa kết quả readiness/error của syncPastEvents hoặc thêm status accessor chỉ đọc; không tạo listener hoặc đồng bộ trong GET status/ledger.
- Tác động: ai xem ledger vẫn tải GET; đồng bộ không còn xảy ra khi mở tab, đổi tab hay refresh. Ví company/student/demo không có nút global sync được phép. Schema User đã có enum admin nên không cần đổi schema; **chưa có quy trình cấp admin đầy đủ**, không tự tạo tài khoản để “mở” chức năng này.
- Phần thực thi đồng bộ chain thật vẫn cần sửa A11/A12/A16 riêng. Gói này không tuyên bố đã xác minh receipt/event hay cho phép chạy sync thật trên DB đang bảo toàn.

### Tác động gián tiếp với HEAD

Express đang cài chuyển HEAD sang handler GET nếu route không khai báo HEAD riêng (`server/node_modules/express/lib/router/route.js:68–69,113–114`). Do đó bốn handler GET trên cũng có thể tạo mẫu khi bị gọi bằng **HEAD**. Không gọi HEAD để tái hiện hiện tại. Sửa handler chỉ đọc giải quyết cả GET và HEAD; regression phải kiểm tra cả hai, không chỉ JSON GET.

## 6. Thiết kế tách đọc–ghi đề xuất

### Contract API tối thiểu, giữ tương thích

| Đọc sau sửa | Khi rỗng | Ghi có chủ đích giữ riêng |
| --- | --- | --- |
| GET /internship/jds | 200 `[]` | POST /internship/jds, công ty chủ động đăng |
| GET /internship/tasks | 200 `[]` | POST /internship/tasks; PATCH tasks/:id/status |
| GET /internship/attendance/history | 200 `[]` | POST /internship/attendance/check-in |
| GET /internship/worklogs | 200 `[]` | POST /internship/worklogs; PATCH worklogs/:id/review |
| GET /internship/chain-events | 200 `[]` | POST /internship/sync-events, thao tác admin có chủ đích |

Prefix đầy đủ là `/api`. Giữ đường dẫn, filter, sort, limit và array response của GET để không phá client; không đổi phân trang hay schema trong gói tối thiểu. Read error không được biến thành dữ liệu mẫu hoặc success giả.

### Frontend

- `loadChainEvents()` chỉ GET/setState; effect chỉ gọi hàm này. Không toast “đã đồng bộ chain” sau GET thường.
- `handleSyncEvents()` chỉ gắn với button/confirm action, có quyền hiển thị theo user, trạng thái pending và chống click lặp; POST thành công thật mới refresh GET và báo kết quả. Không nuốt 401/403/503. Có thể dùng in-flight guard phía client; backend cũng phải kiểm soát quyền và các sync chồng nhau, không dựa riêng disabled button.
- Truyền user từ App vào Web3CertificateView để UI không trình bày global sync như khả năng mọi role. Backend vẫn là nơi enforce quyền.
- CV/JD, lịch sử điểm danh, task, worklog: tách loading/error/empty. Empty là “chưa có dữ liệu”, không tự seed, không gọi mutation để lấp bảng. Error phải hiện lỗi tải, không dùng fallback biến thành thành công.
- Không tự POST lại command sau khi GET rỗng hoặc lỗi; không dùng click giả để tiếp tục giữ showcase cũ.
- Có thể dùng effect cleanup/AbortController để tránh cập nhật state cũ khi chuyển tab; việc hủy request ở browser **không phải bảo đảm backend đã hủy mutation**, nên sửa handler GET là bắt buộc. Không thêm dependency mới chỉ để làm việc này.
- Scope theo user là phần tiếp giáp cần chốt: AttendanceView hiện nhận user nhưng chưa dùng và fetch một lần lúc mount. Thêm filter từ user giúp UX nhưng **không thay thế quyền/scope ở server**. Gói phân quyền A08/A26 phải được duyệt riêng nếu mở rộng ngoài auto-write.

### Dữ liệu mẫu

Không cần tạo seed endpoint mới để sửa lỗi này. Trong gói tối thiểu, bỏ fixture khỏi runtime GET; nếu cần minh họa cho test, dùng fixture **trong bộ nhớ** chỉ trong test không DB.

Nếu sau này cần dữ liệu demo thực: lập gói riêng với script import explicit, DB đích được xác nhận và kiểm tra trước khi chạy. **Không dùng lại ngay `npm run seed` hiện có**, vì server/scripts/seed.js có dropIndex/deleteMany/ghi đè bản ghi mẫu (A22). Không đề xuất tự gọi script đó khi rỗng hoặc khi mở frontend.

## 7. Những thay đổi Database cần và không cần

**Không cần thay đổi database/schema cho AW-01–AW-05.** Giữ nguyên models, collection names, validators và indexes. Không migration, syncIndexes, dropIndex, thêm field isDemo hoặc thêm unique index trong gói này. Role admin đã tồn tại trong enum User, không tự ghi record admin.

Không xóa fixture nếu tình cờ đã có: bản ghi mẫu và bản ghi người dùng có thể cùng cấu trúc, thiếu provenance đáng tin cậy. Việc cleanup cần đánh giá/backup/phê duyệt riêng, không lọc theo tên hoặc ví rồi delete. Báo cáo 0 document trước đây không phải quyền xóa hoặc reset DB hiện tại.

Tác động sau sửa là **ngừng phát sinh document khi đọc**, không sửa/xóa những document đã tồn tại. Dữ liệu JD/task/điểm danh/nhật ký được tạo hợp lệ trước đó phải giữ nguyên nội dung, ID và timestamp.

## 8. Startup/background writes cần phân biệt

- `server/src/index.js:12–15`: Mongoose autoCreate/autoIndex có thể ghi metadata 14 collection khi boot; đây là B, không phải side effect của GET. Không thay đổi hoặc tắt tùy ý trong gói sửa GET.
- `chainListener.js:157–183`: khi RPC hoạt động, startup tự backfill và listener tiếp tục ghi chain_events/topics. Tách button khỏi effect **không tắt background listener này**.
- Trước gói AI/blockchain sau này, đề xuất một bước riêng để listener có cấu hình opt-in rõ ràng, báo readiness và có scope/checkpoint/retry/idempotency đúng. Gói đó có thể sửa config/index/listener nhưng chưa nằm trong gói auto-write tối thiểu, chưa tạo env file hoặc bật RPC.
- `auth_nonces` có TTL: nonce hết hạn bị MongoDB xóa theo index sau khi có dữ liệu. Đó là lifecycle đã thiết kế, không phải hành vi của GET đọc tab; không sửa TTL/schema để chữa các lỗi đang phân tích.

Tiêu chí gói đầu tiên là **mở/đổi tab không gửi command ghi và GET/HEAD không sửa dữ liệu nghiệp vụ**; không tuyên bố toàn hệ thống đã không còn ghi nền khi bật mọi tích hợp.

## 9. File dự kiến sửa sau khi được phê duyệt

| File | Thay đổi dự kiến | Phạm vi |
| --- | --- | --- |
| server/src/routes/internship.routes.js | Bỏ bốn nhánh auto-seed; giữ array/query contract; bảo vệ POST sync; trả error/readiness đúng | Gói chính |
| server/src/services/chainListener.js | Bổ sung kết quả trạng thái/error hoặc accessor tối thiểu cho manual sync, không thay parse/backfill pipeline trong gói này | Gói chính chỉ phần cần để không báo success giả; review diff giới hạn |
| client/src/components/Web3CertificateView.jsx | Tách load GET và manual POST; quyền UI; pending/error; thông báo đúng | Gói chính |
| client/src/App.jsx | Truyền user vào Web3 view | Gói chính, một ranh giới prop |
| client/src/components/CvJdView.jsx | Loading/error/empty phù hợp 200 [] | Gói chính |
| client/src/components/AttendanceView.jsx | Empty/error riêng cho dữ liệu; không tự gọi mutation; giữ hành động submit tách rời | Gói chính |
| server/test/auto-write-readonly.test.js (file mới dự kiến) | Kiểm thử node:test với model/service mock, không kết nối MongoDB và không dùng helpers.js | Gói test an toàn sau phê duyệt |
| docs/api-queries.md hoặc tài liệu endpoint liên quan | Mô tả GET rỗng, không seed; quyền/manual sync và error contract | Tài liệu theo gói sửa được duyệt |

Không cần sửa model, package.json/lockfile, contract hoặc .env. Dùng lại requireAuth/requireRole đã có; không tự tạo cơ chế auth thứ hai. Nếu implementation đòi mở rộng file/phạm vi ngoài bảng, báo trước thay vì nhập cả 26 lỗi vào một lần sửa.

## 10. Kế hoạch kiểm thử hồi quy không ghi DB thật

### Điều kiện harness

- **Chưa chạy bất kỳ test nào trong lần lập kế hoạch này.**
- Test backend mới dùng node:test/assert/fetch có sẵn; không import server/test/helpers.js, không chạy server/src/index.js, không dùng npm test glob hiện có.
- Mọi connect/createConnection MongoDB/Mongoose phải bị guard fail trong harness; query trả fixture in-memory, external AI/Pinata/RPC đều fake. Không trỏ vào cổng 27017, 5000 hoặc dịch vụ thật.
- Spy/guard ở boundary model và driver ghi phải **ghi nhận lần thử trước khi throw**. Phải assert số lần mutation bằng 0, không chỉ assert HTTP 200/[]: code cũ attendance có catch nuốt lỗi insert, có thể trả [] dù đã thử ghi.
- Không dropDatabase/delete/reset/seed/index changes, kể cả “DB test riêng”. Model/schema được nạp để test route không được kết nối hoặc auto-init ra DB thật.
- Test UI cần harness browser/network mocks trước navigation; chặn mọi request tới backend/RPC thật, không ví thật. Nếu cần thêm dependency/framework chưa cài thì xin phê duyệt riêng; không tự cài Playwright/Vitest/testing-library. Render SSR không chạy effect, không được dùng làm bằng chứng không có auto-write.

### Test matrix dự kiến

| ID | Ca kiểm tra | Assertion có ý nghĩa |
| --- | --- | --- |
| T01 | GET bốn endpoint với DB fake rỗng | 200 [], đúng query/sort/limit; **0 mutation attempt** ở mọi model/driver |
| T02 | HEAD cùng bốn endpoint | Thành công, không body; 0 mutation attempt; handler GET fallback không seed |
| T03 | Dữ liệu đã có, GET lặp nhiều lần | Trả đúng fixture; fingerprint nội dung/ID/updatedAt trước sau bằng nhau, không chỉ count |
| T04 | Filter ví không có kết quả nhưng fixture của ví khác có dữ liệu | Trả [] đúng filter; không tạo/đổi/trả mẫu của ví demo |
| T05 | Nhiều GET song song lúc rỗng | Không seed/race; không mutation attempt; không cần unique index mới |
| T06 | Fake read query ném lỗi | Error handler trả lỗi phù hợp, không create/insert fallback, không success giả |
| T07 | Mount/remount CV/JD với network mock | Chỉ GET danh sách; empty state, không tự POST tạo JD hoặc bịa dữ liệu |
| T08 | Mount AttendanceView và chuyển các subtab | Chỉ các GET được thiết kế; không POST check-in/task/worklog; rỗng không có dữ liệu chuyên cần giả |
| T09 | Mount/remount Web3 | Chỉ GET chain-events, **0 POST sync-events**; không toast đồng bộ thành công |
| T10 | StrictMode root, đổi tab nhiều lần | Cho phép GET đọc lặp; **0 command ghi khi chỉ duyệt UI**, không tắt StrictMode |
| T11 | Manual sync không token hoặc role student/company/mentor | 401/403 theo trường hợp; service sync/RPC/write fake chưa được gọi |
| T12 | Admin fake, RPC/contract chưa sẵn sàng | 503 SYNC_UNAVAILABLE, UI báo đúng lỗi, không success toast hoặc tự retry command |
| T13 | Admin fake click sync với service fake sẵn sàng | Chỉ click mới POST; refresh GET sau success; loading/in-flight ngăn double submit phía UI |
| T14 | POST sync fake báo lỗi giữa luồng | Không bọc success:true; UI giữ lỗi. Không chạy đồng bộ thật để tái hiện |
| T15 | Hành động ghi hợp lệ của JD/task/worklog/check-in dùng fake service/model | Vẫn gửi đúng method/body và đúng nhánh handler; chỉ sau submit; không tạo dữ liệu ở GET refresh liên quan |
| T16 | Chuỗi POST check-in fake thành công → fetchData | Một command có chủ đích; các GET refresh còn lại không phát sinh JD/task/nhật ký khác |
| T17 | Đổi user/phiên khi view còn mount | Không tự tạo mẫu hoặc dùng dữ liệu cũ làm dữ liệu người mới; nếu chưa duyệt scope fix thì ghi rõ giới hạn thay vì tuyên bố đã sửa quyền |
| T18 | Scan bảo toàn files và model contracts | Model/schema/index/package/lockfile không đổi; không thêm seed runtime hoặc luồng ghi trong effect mới |

Lệnh dự kiến chỉ sau khi test mới được viết và review an toàn:

```powershell
# Working directory server; chưa chạy trong lần này
node --test --test-concurrency=1 test/auto-write-readonly.test.js
```

**Không chạy `npm test`** vì glob kéo foundation.test.js và helper dropDatabase. Không coi cài dependency/build/health trước đây là các test T01–T18 đã đạt.

### Kiểm tra runtime sau sửa, cần phê duyệt riêng

1. Chốt phạm vi sửa source trước; giữ browser đóng/chặn request và không bật AI/RPC trong thời gian còn source cũ.
2. Chạy test in-memory; lint không --fix và build ra output mới được ignore nếu được duyệt. Không tự cài test framework.
3. Backend đang chạy không tự nạp code mới. Cần cho phép restart có kiểm soát sau review; lưu ý autoCreate/autoIndex vẫn có thể chạm metadata DB. Không gộp phê duyệt sửa source với quyền ghi dữ liệu nghiệp vụ.
4. Kiểm tra UI với network mock toàn bộ API/RPC trước. Không mở browser trỏ thẳng backend hiện tại để thử lỗi cũ.
5. Chỉ khi người dùng duyệt kiểm tra đọc runtime sau sửa mới gửi GET/HEAD mới; so sánh dữ liệu và cấu trúc trước/sau bằng quyền đọc. Không tạo/xóa bản ghi để “reset” ca thử. Các test ghi hợp lệ trước hết vẫn dùng fake/in-memory.

## 11. Tiêu chí nghiệm thu và tác động chức năng

- Bốn GET/HEAD chỉ đọc trong mọi trạng thái rỗng/có dữ liệu/lỗi/filter; không Model.create/insertMany/upsert/save/delete/index changes ở request path.
- Không POST/PATCH/PUT/DELETE tự động từ mount/đổi tab. Matching có chủ đích giữ POST tính toán; không đưa công việc ghi vào GET khác để né kiểm tra.
- Tab Web3 mở được danh sách event mà không sync; sync là hành động admin riêng, auth/permission enforced ở server, lỗi/not-ready không bị báo thành công.
- Client hiện đúng empty/error state. Giao diện DB rỗng sẽ ít thẻ/bảng hơn showcase cũ; đây là hệ quả cần thiết, không phải hồi quy phải lấp bằng dữ liệu giả.
- Những hành động tạo JD/task/nhật ký/check-in được giữ; quyền/đầu vào chưa hoàn chỉnh vẫn phải được liệt kê, không tự tuyên bố đã xử lý tất cả A06/A08/A09.
- Không thay schema/index/migrate hoặc cleanup dữ liệu. Không triển khai seed thay thế hoặc cấp admin tự động.

## 12. Liên hệ với 26 phát hiện và các phần không nhập chung

- **Trọng tâm:** A07 (GET auto-seed), phần A12 (sync/error status), phần A25 (load/empty/role UI).
- **Cần phòng tái phát:** A22 (seed không an toàn), A23 (test helper xóa DB), A26 (read scope/public dữ liệu), A08/A09 (quyền task/log và người nhận).
- **Gói Web3 riêng:** A03/A04/A05/A11/A14/A15/A16/A19 (receipt, orchestration, token, parser/listener, policy/đa slot). Gói auto-write không hợp thức hóa record-chain-tx hoặc sync pipeline hiện tại.
- **Gói nghiệp vụ/AI riêng:** A02/A06/A10/A17/A18/A20/A21 (chứng nhận giả, QR, demo-login, CV/application, điểm/provenance, BERT và chức năng thiếu).
- **Trạng thái/tài liệu:** A01 được cải thiện qua cài runtime/dependency; A13 chưa tái hiện ở Node/Hardhat hiện tại và đã compile được, không tự sửa config theo nghi vấn cũ; A24 cần cập nhật docs theo phạm vi thực sự sửa/test.

## 13. Điểm dừng

Chỉ tạo **AUTO_WRITE_FIX_PLAN.md**. Không sửa source/schema/.env, không gọi API/DB hoặc chạy test/build trong lần phân tích này, không mở tab/browser, không seed/migration/deploy, không xóa dữ liệu/untracked hoặc commit/push/merge. Không restart các tiến trình đang chạy.

**Chờ người dùng phê duyệt gói sửa ở mục 9 và phạm vi test không DB thật ở mục 10 trước khi triển khai source.** Việc cleanup dữ liệu, cấp admin, restart runtime hoặc bật chain/AI cần quyền tương ứng, không suy ra từ việc đồng ý đọc kế hoạch.

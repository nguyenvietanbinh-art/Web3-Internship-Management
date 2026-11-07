# KIỂM ĐỊNH FRONTEND

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Điều đã thực kiểm tra

HTTP GET /, /src/main.jsx, /src/api/client.js, /favicon.svg trả200; không thực thi JavaScript trong browser. Lint exit0 với32 warnings; production build mới thành công, chunk chính >500kB. Không có script type-check/tsconfig ứng dụng; Vite build không phải type-check. Console browser, responsive, click flow, accessibility và trạng thái UI runtime: **NOT TESTED**, do không mở tab gây ghi dữ liệu.

## Trang, form và nút

| Khu vực | Source/bằng chứng | Xử lý thật / hạn chế | Dự kiến sửa và kiểm thử |
| --- | --- | --- | --- |
| Navigation | App.jsx state activeTab; main.jsx StrictMode | Tab điều kiện, không URL router/deep-link; remount gọi effect lại | Quyết định URL routing; test back/refresh/state khi đổi tab |
| AuthModal | components/AuthModal.jsx:44,71,104,137 | MetaMask và 3 preset company/student/mentor có handler; demo cấp JWT thật không chữ ký | Tách demo opt-in; test role, fail sig, token expired, logout, account/chain change |
| Topic list/detail/search | App.jsx fetchTopics và selectedTopic | GET topics thật; empty/error/loading có xử lý nhưng chưa browser; owner UI chưa đồng nhất API | Render theo quyền; test empty/error/not-owner |
| Tạo topic/KPI | App.jsx:225 trở đi | Kiểm tổng100 ở client và server; modal title/skills/deadline; một số ngày/phạm vi khác contract | Validation chung, deadline tương quan, giữ form khi lỗi, không success khi chain thất bại |
| Assign | App.jsx:190 trở đi | POST assign, chain tùy chọn; slot>1 không nối đầy đủ | Assignment model canonical, test owner và oversubscribe |
| Submit KPI | App.jsx:280 trở đi | POST submit có Pinata/AI, lỗi hiển thị toast; UI “cập nhật” trong khi submitted bị409 | Đồng bộ state machine; test reject/resubmit/approved/503 |
| Evaluate/complete | App.jsx:320 trở đi | REST trước tx; lỗi chain console.warn rồi toast thành công; thiếu tách pending/confirmed | Trạng thái 2 pha; score0 phải hiển thị, tránh default score bằng toán tử || |
| Dashboard | DashboardView.jsx:42 và internship.routes.js:25 | Backend trả counts, score85 khi rỗng; frontend fallback88/16/6/12; chưa biểu đồ phân tích dữ liệu thật | null/no-data thay số bịa, scope company/school, kiểm dataset chuẩn |
| CV/GPA | CvJdView.jsx:26,145 | Form state local, GPA+university chung value nhưng onChange chỉ đổi university; không lưu Student | Tách inputs, validation GPA0..4, PUT profile và test reload persistence |
| JD | CvJdView.jsx:43,78 | GET mount tự seed; POST create thật; nút company chưa guard role UI đầy đủ; thiếu edit/close | GET-only, role rendering, JD lifecycle |
| Matching | CvJdView.jsx:61,196 | POST match-cv thật; trước matching hiển thị80% và skills mẫu; GPA không tham gia AI | null score, provenance engine/fallback, benchmark |
| Apply | CvJdView.jsx:269 | Handler chỉ showToast “Đã gửi hồ sơ”; không API/model | Application API + loading/errors + lịch sử xét duyệt |
| Attendance | AttendanceView.jsx:32–50 | Mount Promise.all QR/history/tasks/worklogs; 3 GET có write. Subtab không tạo effect riêng; cả3 đã tải trước khi bấm | Tách fetch chỉ đọc, filter wallet/tenant; test zero writes cho mount/remount |
| QR/check-in | AttendanceView.jsx:57 | Hình QR bằng CSS, không scanner/GPS; hash hoặc QR-VERIFIED gửi POST | QR thật, scanner opt-in, server session verify, không tự bật camera |
| Task modal/buttons | AttendanceView.jsx:73,87 | Có create/status handlers, task form thiếu assignee nên gán công ty cho chính mình; backend IDOR | Chọn SV theo assignment, company guard, cross-tenant negative |
| Worklog modal | AttendanceView.jsx:100 | POST thật; chỉ DB, không số giờ/AI/IPFS; API review chưa có UI handler | Bổ sung giờ và review đúng role; không tự approve |
| Web3 events | Web3CertificateView.jsx:23–39 | Mount POST sync-events, sau đó GET events; lỗi sync bị nuốt | Mount chỉ GET; nút sync có quyền, hiển thị lỗi thật |
| Certificate search | Web3CertificateView.jsx:47 và server/src/routes/internship.routes.js:410 | GET thật nhưng backend fake; badge verified/SBT không chứng minh chain | Không render verified nếu không có bằng chứng receipt/token |
| Profile/admin/school | App.jsx + components | Thiếu UI trường/admin lifecycle; mentor có preset nhưng nhánh role UI như company | Dashboard riêng và permission matrix; không coi enum role là đã có chức năng |

## Request tự động và phân loại

- App mount: restoreSession GET /auth/me nếu có token; checkContractConnection chỉ RPC getCode; GET /topics khi mount/wallet đổi. Không ghi DB theo source trong các nhánh này, nhưng GET topics có thể gọi AI.
- Dashboard mount GET /internship/dashboard: đọc, nhưng số liệu fallback không trung thực.
- CV/JD mount GET /internship/jds: **ghi ngoài ý muốn**.
- Attendance mount GET today-qr (đọc), history/tasks/worklogs (**ghi ngoài ý muốn**).
- Web3 mount POST sync-events (**ghi ngoài ý muốn**, có thể sửa DB khi chain sẵn), sau đó GET chain-events (đọc).
- Tạo JD/task/log, check-in, assign/submit/evaluate/complete, demo-login, ký ví/profile: **ghi có chủ đích khi bấm**, nhưng cần sửa guard/validation và không test live trong audit.
- StrictMode/remount ở dev có thể gọi effect nhiều lần; không cần giả định một lần mount tương đương một lần request, có race tạo mẫu. Không tắt StrictMode để che lỗi.

## State, UX và bảo mật

State chủ yếu useState trong App.jsx (~1198 dòng) và component; không có global state/query-cache chuyên biệt. Nhiều catch chỉ console/log hoặc fallback nên người dùng không biết failure; toast ứng tuyển/mint/sync có thể gây hiểu nhầm. Modal có handler đóng/hủy, nhưng chưa kiểm keyboard/focus trap/ARIA. Layout fixed grid380px/360px/340px gây nguy cơ tràn trên mobile theo source, chưa xác nhận bằng ảnh/browser. Chưa có download CV thực; CID link không thay thế file access control. Bundle warning cần lazy-load tabs/ethers, đo trước sau; không tự sửa. JWT trong localStorage, không thấy secret backend được đưa vào VITE config; kiểm tra 4 tài nguyên HTTP không chứa JWT_SECRET hiện tại không thay secret scanning toàn bộ lịch sử.

Chi tiết32 warnings và dòng source được lưu nguyên văn ở 09_TEST_RESULTS.md. Không có bằng chứng Lighthouse/UAT/browser console, phải ghi NOT TESTED.

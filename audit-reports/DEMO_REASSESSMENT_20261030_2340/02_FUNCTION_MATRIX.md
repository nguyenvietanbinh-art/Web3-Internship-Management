# MA TRẬN 81 CHỨC NĂNG — SAU CHẠY DEMO

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

Giữ nguyên mẫu số 81 hàng của kiểm định trước, không tạo thêm tính năng để tăng tỷ lệ. VERIFIED PASS chỉ đúng phạm vi test ở hàng; unit/API/mock/browser được phân biệt. “Có code” vẫn 67/81 vì không sửa ứng dụng; số PASS tăng nhờ có bằng chứng chạy, không phải đã sửa lỗi. F035 chuyển PARTIAL→FAIL vì đã tái hiện đa-slot sai. F038/F078 chuyển BLOCKED→PARTIAL do kiểm được phần API/test, tích hợp hoặc script gốc còn vấn đề.

| Chỉ số | Tử số/81 | Tỷ lệ |
| --- | --- | --- |
| Có code ít nhất một phần | 67/81 | 82.7% |
| VERIFIED PASS đúng phạm vi hàng | 21/81 | 25.9% |
| MISSING | 14/81 | 17.3% |
| FAIL/PARTIAL/MOCK | 38/81 | 46.9% |
| BLOCKED | 5/81 | 6.2% |
| IMPLEMENTED UNVERIFIED | 3/81 | 3.7% |


Các nhóm trạng thái loại trừ nhau. Chỉ số “có code” chồng với các nhóm khác, kể cả MOCK; không là phần trăm hoàn thành luận văn. F 007 compile và các primitive đã kiểm lại/giữ bằng chứng source không đổi; F040/F061/F069 unit từ audit trước vẫn là bằng chứng lịch sử, không giả là lần này chạy lại.

| ID | Module | Vai trò | Chức năng | Frontend | Backend | Database | AI/Web3 | Test | Trạng thái | Mức ưu tiên | Bằng chứng |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F001 | Runtime | Tất cả | Frontend HTTP và static assets | HTTP 200 | — | — | — | PASS HTTP, không render | VERIFIED PASS | P3 | `client/vite.config.js:1` |
| F002 | Runtime | Dev | Frontend lint | Có | — | — | — | PASS exit 0; 32 warning | VERIFIED PASS | P3 | `client/package.json:9` |
| F003 | Runtime | Dev | Frontend production build | Có | — | — | — | PASS build mới | VERIFIED PASS | P3 | `client/package.json:8` |
| F004 | Runtime | Dev | Backend kiểm tra cú pháp | — | Có | — | — | PASS 31 file | VERIFIED PASS | P3 | `server/package.json:1` |
| F005 | Runtime | Dev | MongoDB kết nối/ping | — | Có | Có | — | PASS live read-only | VERIFIED PASS | P1 | `server/src/config/env.js:11` |
| F006 | Runtime | Dev | Backend health và trạng thái DB | API thủ công | Có | Có | — | PASS live HTTP | VERIFIED PASS | P1 | `server/src/app.js:18` |
| F007 | Runtime | Dev | Compile 2 smart contracts | — | Hardhat | — | Solidity 0.8.24 | PASS compile staging | VERIFIED PASS | P2 | `contracts/hardhat.config.js:6` |
| F008 | Auth | Tất cả | Nonce + ký ví + chống replay | MetaMask chưa test | Có | Nonce giả trong bộ nhớ | EIP-191 | PASS HTTP thực: nonce ký ví, wrong signature/replay bị 401; keys ngẫu nhiên test không dùng ví thật | VERIFIED PASS | P0 | `server/src/services/authService.js:35`; xem09_TEST_RESULTS.md lượt demo |
| F009 | Auth | Tất cả | JWT kiểm tra chữ ký và token sửa đổi | Token localStorage | Có | Không kết nối | — | PASS unit với secret tạm | VERIFIED PASS | P0 | `server/src/services/authService.js:51` |
| F010 | Auth | Khách | Từ chối /auth/me không token | restoreSession | Có | Không truy vấn khi thiếu token | — | PASS live 401 và mock | VERIFIED PASS | P0 | `server/src/routes/auth.routes.js:105` |
| F011 | Auth | Sinh viên | Chặn tạo topic bằng role student | UI chưa test | Có | Không ghi | — | PASS middleware mock 403 | VERIFIED PASS | P0 | `server/src/routes/topic.routes.js:106` |
| F012 | Auth | SV/DN | Đăng ký/đăng nhập ví và tạo hồ sơ đầy đủ | Có | Có | Có | MetaMask | PASS API ví ký thật trong bộ nhớ, tạo User/Student/Company và JWT; không phải MetaMask browser | VERIFIED PASS | P1 | `server/src/routes/auth.routes.js:42`; xem09_TEST_RESULTS.md lượt demo |
| F013 | Auth | Tất cả | Đăng xuất/khôi phục phiên/change account | Có | Có | User | — | PASS logout/restore UI company/student/mentor; MetaMask account/chain change NOT TESTED | IMPLEMENTED UNVERIFIED | P1 | `client/src/api/client.js:74`; xem09_TEST_RESULTS.md lượt demo |
| F014 | Auth | SV/DN/Mentor | Demo login không ký ví | Có | Có | Có | — | FAIL HTTP demo cấpJWT không chữ ký; UI demo login hoạt động nhưng không an toàn production | FAIL | P0 | `server/src/routes/auth.routes.js:72`; xem09_TEST_RESULTS.md lượt demo |
| F015 | Auth | SV/DN | Email/password, đổi và quên mật khẩu | Không | Không | Không có password/reset | — | NOT TESTED | MISSING | P1 | `server/src/routes/auth.routes.js:1` |
| F016 | Admin | Nhà trường | Tạo/khóa/mở khóa/phân quyền tài khoản | Không | Không | Có enum admin, thiếu lifecycle | — | NOT TESTED | MISSING | P0 | `server/src/models/User.js:1` |
| F017 | Hồ sơ | Sinh viên | Đọc/sửa hồ sơ, skills/GPA/CV CID | CV form không nối PUT | Có | Student/User | — | PASS API tự sửa/readback GPA/university; cross-owner 403. Skills/CV CID toàn flow chưa test | IMPLEMENTED UNVERIFIED | P1 | `server/src/routes/data.routes.js:56`; xem09_TEST_RESULTS.md lượt demo |
| F018 | Hồ sơ | Doanh nghiệp | Đọc/sửa hồ sơ doanh nghiệp | Chưa có flow đầy đủ | Có | Company/User | — | NOT TESTED | IMPLEMENTED UNVERIFIED | P1 | `server/src/routes/data.routes.js:94` |
| F019 | CV | Sinh viên | Form CV lưu hồ sơ bền vững | Có | Có PUT nhưng UI chưa dùng | Student không được cập nhật bởi form | — | NOT TESTED | PARTIAL | P1 | `client/src/components/CvJdView.jsx:26` |
| F020 | CV | Sinh viên | Upload PDF/DOCX, trích text/skills/GPA | Không file input | Không upload route/parser | Chỉ cvCid | Chưa có parser | NOT TESTED | MISSING | P1 | `ai-service/main.py:1` |
| F021 | JD | Tất cả | Xem JD không gây ghi dữ liệu | Có | Có | job_descriptions bị tạo mẫu | — | FAIL HTTP GET /jds tạo 3 JD trên DB demo | FAIL | P0 | `server/src/routes/internship.routes.js:95`; xem09_TEST_RESULTS.md lượt demo |
| F022 | JD | Doanh nghiệp | Tạo JD thật | Có | Có | JD | — | PASS UI form tạo JD, POST 201 và GET readback DB | VERIFIED PASS | P1 | `server/src/routes/internship.routes.js:138`; xem09_TEST_RESULTS.md lượt demo |
| F023 | JD | Doanh nghiệp | Sửa/đóng/xóa JD và quản lý vòng đời | Không | Không | JD có status nhưng thiếu flow | — | NOT TESTED | MISSING | P1 | `server/src/routes/internship.routes.js:1` |
| F024 | AI | Sinh viên | Tính TF-IDF và tỷ lệ khớp skills | Có | Có | Không | TF-IDF | PASS unit similarity/skills; không đánh giá độ chính xác | VERIFIED PASS | P2 | `ai-service/main.py:88` |
| F025 | AI | Sinh viên | Backend nối CV/JD, sort gợi ý | Có | Có | JD | Adapter có, AI 8000 chưa chạy | PASS Browser→Backend→AI TF-IDF và sort. Vẫn PARTIAL vì provenance/fallback/GPA/benchmark thiếu | PARTIAL | P2 | `server/src/routes/internship.routes.js:157`; xem09_TEST_RESULTS.md lượt demo |
| F026 | AI | Sinh viên | Điểm mặc định trước khi matching | Có | Có | Có | 80% hardcode | NOT TESTED | MOCK | P0 | `client/src/components/CvJdView.jsx:196` |
| F027 | AI | Sinh viên | Matching khi AI lỗi và provenance | Có | Có | Có | Fallback 20–95, empty 70 | FAIL unit zero-overlap/provenance | FAIL | P0 | `server/src/services/aiClient.js:28` |
| F028 | Tuyển dụng | Sinh viên | Ứng tuyển JD và theo dõi kết quả | Có | Không application API | Không application model | — | FAIL business UI: chỉ toast, không POST, vẫn MOCK | MOCK | P1 | `client/src/components/CvJdView.jsx:269`; xem09_TEST_RESULTS.md lượt demo |
| F029 | Tuyển dụng | Doanh nghiệp | Xem/duyệt/từ chối ứng viên | Không | Không | Không application | — | NOT TESTED | MISSING | P1 | `server/src/routes/internship.routes.js:1` |
| F030 | Topic | Tất cả | Liệt kê topic và kiểm tra ID sai | Có | Có | Topic | — | PASS HTTP danh sách 25 topic seed; browser 26 sau tạo mới; foundation 400/404 ID | VERIFIED PASS | P1 | `server/src/routes/topic.routes.js:64`; xem09_TEST_RESULTS.md lượt demo |
| F031 | Topic | Doanh nghiệp | Tạo topic và KPI tổng trọng số 100 | Có | Có | Topic/Company | IPFS tùy chọn; chain riêng | PASS POST 201, KPI 100; sai weights 400; chưa chain/IPFS thật | VERIFIED PASS | P1 | `server/src/routes/topic.routes.js:106`; xem09_TEST_RESULTS.md lượt demo |
| F032 | Topic | Doanh nghiệp | Thêm KPI sau khi tạo topic | Có | Có | Embedded KPI | Khác chain: Open/Assigned | NOT TESTED | PARTIAL | P1 | `server/src/routes/topic.routes.js:158` |
| F033 | Topic | Doanh nghiệp | Gán mentor đăng ký hợp lệ | Có | Có | Topic/User | — | PASS foundation test gán mentor/mentor authorization trên DB test; không chain | VERIFIED PASS | P1 | `server/src/routes/topic.routes.js:177`; xem09_TEST_RESULTS.md lượt demo |
| F034 | Topic | Doanh nghiệp | Phân công một sinh viên | Có | Có | Topic/Assignment/Student | Platform | PASS HTTP owner assign, cross-company 403, DB Assignment tạo | VERIFIED PASS | P1 | `server/src/routes/topic.routes.js:187`; xem09_TEST_RESULTS.md lượt demo |
| F035 | Topic | Doanh nghiệp | Phân bổ nhiều slot/sinh viên | Có | Có | maxSlots có, status khóa sau 1 người | Registry chưa nối | FAIL HTTP maxSlots 2: sau 1 student, lần 2 bị 409 | FAIL | P1 | `server/src/routes/topic.routes.js:187`; xem09_TEST_RESULTS.md lượt demo |
| F036 | Báo cáo | Sinh viên | Nộp KPI và lưu phiên bản, CID/hash/AI | Có | Có | Topic/Assignment/Submission/AIAnalysis | Pinata thiếu, AI/RPC offline | BLOCKED IPFS thật; 503 không ghi Submission. Foundation mock IPFS full flow PASS | BLOCKED | P1 | `server/src/routes/topic.routes.js:214`; xem09_TEST_RESULTS.md lượt demo |
| F037 | Báo cáo | Sinh viên | Nộp lại KPI submitted trong UI | UI cho cập nhật | Có | API chỉ pending/rejected | Chain cho ghi lại | NOT TESTED | PARTIAL | P1 | `server/src/routes/topic.routes.js:214` |
| F038 | Đánh giá | DN/Mentor | Chấm KPI, điểm và phản hồi | Có | Có | Topic/KPIEvaluation/Assignment | Mentor API khác quyền chain | PASS HTTP chấm KPI seeded và foundation mentor/API; chain mentor khác quyền, chưaE2E thật | PARTIAL | P1 | `server/src/routes/topic.routes.js:276`; xem09_TEST_RESULTS.md lượt demo |
| F039 | Đánh giá | DN | Hoàn thành thực tập và điểm tổng | Có | Có | Topic/Student/Assignment | Pinata bắt buộc, chain tùy chọn | BLOCKED complete với Pinata thật. Foundation mocked IPFS complete/rounding API PASS | BLOCKED | P1 | `server/src/routes/topic.routes.js:317`; xem09_TEST_RESULTS.md lượt demo |
| F040 | Đánh giá | Tất cả | Điểm API và chain thống nhất | Có | Có | finalScore | Round vs floor | FAIL unit 80.5 -> 81/80 | FAIL | P1 | `server/src/routes/topic.routes.js:324` |
| F041 | Task | Tất cả | GET tasks chỉ đọc | Có | Có | internship_tasks tạo mẫu | — | FAIL HTTP GET tạo 3 tasks | FAIL | P0 | `server/src/routes/internship.routes.js:197`; xem09_TEST_RESULTS.md lượt demo |
| F042 | Task | Doanh nghiệp | Tạo/giao task đúng sinh viên | Có | Thiếu role/assignment check | Task | — | NOT TESTED | PARTIAL | P1 | `client/src/components/AttendanceView.jsx:87` |
| F043 | Task | Sinh viên | Cập nhật task đúng người sở hữu | Có | Có | Task | — | FAIL HTTP công ty khác sửa task 200 | FAIL | P0 | `server/src/routes/internship.routes.js:255`; xem09_TEST_RESULTS.md lượt demo |
| F044 | Điểm danh | Tất cả | Tính payload QR theo ngày (không ghi) | Có | Có | Không | — | PASS live HTTP; không phải QR an toàn | VERIFIED PASS | P2 | `server/src/routes/internship.routes.js:273` |
| F045 | Điểm danh | Sinh viên | Quét QR, xác thực phiên/hạn/vị trí | CSS QR/nút check-in, không scanner | Có | Attendance | — | FAIL HTTP QR sai vẫn 200; trùng ngày 409 hoạt động | FAIL | P0 | `server/src/routes/internship.routes.js:286`; xem09_TEST_RESULTS.md lượt demo |
| F046 | Điểm danh | Tất cả | Lịch sử điểm danh không tạo mẫu | Có | Có | Attendance insertMany | — | FAIL HTTP GET tạo 7 attendance mẫu | FAIL | P0 | `server/src/routes/internship.routes.js:313`; xem09_TEST_RESULTS.md lượt demo |
| F047 | Điểm danh | Sinh viên | Check-out, giờ làm/timesheet | Không | Không checkout | Không duration | — | NOT TESTED | MISSING | P1 | `server/src/models/Attendance.js:1` |
| F048 | Điểm danh | Sinh viên | Check-in được ghi blockchain | Không giao dịch check-in | Không | Attendance thuần Mongo | Không function/event | NOT TESTED | MISSING | P2 | `contracts/contracts/InternshipPlatform.sol:1` |
| F049 | Nhật ký | Tất cả | GET worklogs chỉ đọc | Có | Có | WorkLog tạo 2 mẫu | — | FAIL HTTP GET tạo 2 worklogs mẫu | FAIL | P0 | `server/src/routes/internship.routes.js:341`; xem09_TEST_RESULTS.md lượt demo |
| F050 | Nhật ký | Sinh viên | Tạo nhật ký tuần | Có | Có | WorkLog | Không AI/IPFS | PASS HTTP POST 201 tạo worklog thực trong DB demo; chưa AI/IPFS/hours | VERIFIED PASS | P1 | `server/src/routes/internship.routes.js:379`; xem09_TEST_RESULTS.md lượt demo |
| F051 | Nhật ký | Mentor/DN | Duyệt nhật ký đúng quyền | Thiếu handler review | Có | WorkLog | — | FAIL HTTP student tự duyệt worklog 200 | FAIL | P0 | `server/src/routes/internship.routes.js:396`; xem09_TEST_RESULTS.md lượt demo |
| F052 | AI | Nhà trường/DN | Phân loại tiến độ/rủi ro và gửi cảnh báo | Không | Không classifier/notifications | Không risk/notification model | Không BERT pipeline | NOT TESTED | MISSING | P2 | `ai-service/main.py:1` |
| F053 | Dashboard | SV/DN | Thống kê và tiến độ theo vai trò | Có | Có | Query toàn cục, score fallback 85 | — | PASS API/UI có dữ liệu seed; chưa đúng toàn bộ tenant/empty/fallback nên PARTIAL | PARTIAL | P1 | `server/src/routes/internship.routes.js:25`; xem09_TEST_RESULTS.md lượt demo |
| F054 | Dashboard | Tất cả | Số liệu thay thế khi chưa có dữ liệu | Có | Có | Không nguồn cho fallback | — | NOT TESTED | MOCK | P0 | `client/src/components/DashboardView.jsx:42` |
| F055 | Dashboard | Giảng viên | Theo dõi SV, nhật ký, báo cáo riêng | Mentor dùng UI nhánh company | Chỉ topic evaluator cho mentor | Topic.mentorWallet | — | PASS mentor demo login/restore; chưa dashboard giảng viên riêng | PARTIAL | P1 | `client/src/App.jsx:1`; xem09_TEST_RESULTS.md lượt demo |
| F056 | Dashboard | Nhà trường | Dashboard trường/thống kê đợt thực tập | Không | Không school/batch API | Không trường/đợt | — | NOT TESTED | MISSING | P1 | `client/src/App.jsx:1` |
| F057 | IPFS | Sinh viên | Upload/readback báo cáo hoặc portfolio thật | CID link | JSON helper; file helper chưa route | CID/hash | Pinata chưa cấu hình | BLOCKED external service | BLOCKED | P2 | `server/src/services/ipfsService.js:25` |
| F058 | Web3 | SV/DN | Wallet signer, đúng chain và đúng JWT | Có | Có | Metadata local | Không check chainId/JWT wallet | NOT TESTED | PARTIAL | P0 | `client/src/api/web3Client.js:28` |
| F059 | Web3 | SV/DN | Giao dịch thật + receipt nhất quán với DB | Có | Có | REST trước tx, catch rồi success | RPC offline | NOT TESTED | PARTIAL | P0 | `client/src/App.jsx:212` |
| F060 | Web3 | Tất cả đã login | Ghi txHash/onChainId được xác minh | Có | Có | Topic | Không xác minh receipt/owner | FAIL HTTP student khác ghi txHash giả/onChainId 200 | FAIL | P0 | `server/src/routes/topic.routes.js:352`; xem09_TEST_RESULTS.md lượt demo |
| F061 | Web3 | Tất cả | Listener giải mã payload ethers v 6 | Có | Có | ChainEvent/Topic | Named keys mất | FAIL ABI unit không RPC | FAIL | P1 | `server/src/services/chainListener.js:133` |
| F062 | Web3 | Worker | Đồng bộ chain idempotent, retry/reorg | Có | Có | processed trước cập nhật, thiếu normalized records | Backfill từ 0 | NOT TESTED | PARTIAL | P1 | `server/src/services/chainListener.js:44` |
| F063 | Web3 | Tất cả | Mở tab Web3 không tự đồng bộ ghi DB | Có | Có | ChainEvent/Topic nếu RPC sẵn | — | FAIL browser mount POST sync 2 lần do StrictMode | FAIL | P0 | `client/src/components/Web3CertificateView.jsx:27`; xem09_TEST_RESULTS.md lượt demo |
| F064 | Chứng nhận | Sinh viên | Mint NFT/SBT đúng tiêu chuẩn | Có nhãn SBT | Có CID/cờ, không mint | Topic.certificateIssued | Không ERC 721/ERC 5192/tokenId | NOT TESTED | MISSING | P2 | `contracts/contracts/InternshipPlatform.sol:37` |
| F065 | Chứng nhận | Tất cả | Xác minh mã không tồn tại bị từ chối | Có | Có | Không có topic vẫn verified | Không RPC verification | FAIL HTTP mã lạ verified true; browser hiển thị ON-CHAIN VERIFIED/ERC 5192 | FAIL | P0 | `server/src/routes/internship.routes.js:410`; xem09_TEST_RESULTS.md lượt demo |
| F066 | Chứng nhận | Tất cả | Tra cứu token/chain/receipt chuẩn | Nhập query | Có | Topic _id/wallet/tx, không tokenId | Contract/tx/CID hardcode | NOT TESTED | PARTIAL | P2 | `server/src/routes/internship.routes.js:410` |
| F067 | AI | Nghiên cứu | Sentence-BERT chạy và benchmark thật | Không engine status đủ rõ | Nhánh optional, thiếu deps | Không dataset | Chưa có runtime/model | BLOCKED không cài/model download | BLOCKED | P2 | `ai-service/main.py:30` |
| F068 | AI | Mentor | Chấm gợi ý báo cáo trống/không liên quan | Có | Có | AIAnalysis khi submit | TF-IDF điểm sàn 50 | FAIL AI HTTP báo cáo trống 50; tiêu chí 0 là kiểm định bảo thủ, chưa rubric chốt | FAIL | P0 | `ai-service/main.py:143`; xem09_TEST_RESULTS.md lượt demo |
| F069 | AI | Nghiên cứu | Phân biệt kỹ năng C++/C# trong text | Có | Có | — | Cả hai thành c | FAIL pure normalization | FAIL | P2 | `ai-service/main.py:57` |
| F070 | AI | Nghiên cứu | Ranking Precision@K/Recall@K/MAP/NDCG | Không | Không evaluator/dataset | Không nhãn | Thiếu metrics | NOT TESTED | MISSING | P2 | `ai-service/main.py:1` |
| F071 | AI | Nghiên cứu | Accuracy/Precision/Recall/F 1/Confusion Matrix | Không | Không classifier/evaluator | Không nhãn | Thiếu metrics | NOT TESTED | MISSING | P2 | `ai-service/main.py:1` |
| F072 | Quản trị | Nhà trường | Quản lý doanh nghiệp và sinh viên | Không admin UI | Public read/self edit, không admin lifecycle | User/Student/Company | — | NOT TESTED | PARTIAL | P1 | `server/src/routes/data.routes.js:33` |
| F073 | Quản trị | Nhà trường | Quản lý đợt thực tập, duyệt kết quả | Không | Không batch/approval | Không batch/school approval | — | NOT TESTED | MISSING | P1 | `server/src/models/Assignment.js:1` |
| F074 | Quản trị | Nhà trường | Quản lý chứng nhận và audit hoạt động | Explorer | Chỉ chain-events, không audit HTTP | Không nhật ký admin | Không quản lý revoke | NOT TESTED | PARTIAL | P2 | `server/src/models/ChainEvent.js:1` |
| F075 | Dữ liệu | Tất cả | Phân trang API dữ liệu normalized (có seed) | Chưa có màn riêng | Có | 8 danh sách/overview | — | PASS 9 GET data overview/lists có seed, không chỉ DB rỗng | VERIFIED PASS | P1 | `server/src/routes/data.routes.js:24`; xem09_TEST_RESULTS.md lượt demo |
| F076 | Dữ liệu | Tất cả | Bảo vệ riêng tư dữ liệu theo tenant | Không guard thay backend | GET công khai/populate | User/Student/Submission... | — | NOT TESTED | PARTIAL | P0 | `server/src/routes/data.routes.js:24` |
| F077 | Dữ liệu | Dev | Transaction/chống ghi trùng xuyên collection | Không | Có | Thiếu transaction, Assignment unique pair | — | NOT TESTED | PARTIAL | P1 | `server/src/routes/topic.routes.js:243` |
| F078 | QA | Dev | Backend foundation integration tests | — | Có tests | Helper xóa DB | — | PASS 21 test bản sao cô lập đã bỏ dropDatabase; script/helper gốc vẫn nguy hiểm chưa sửa | PARTIAL | P1 | `server/test/helpers.js:15`; xem09_TEST_RESULTS.md lượt demo |
| F079 | QA | Dev | Contract happy/negative tests và Registry | — | 3 happy tests, npm test placeholder | — | Chưa chạy deploy test | BLOCKED chưa dựng EVM cô lập | PARTIAL | P1 | `contracts/test/InternshipPlatform.test.js:1` |
| F080 | Deploy | Dev | Deploy frontend/backend/Atlas/Sepolia | Netlify config | Local đã chạy | Local, chưa Atlas | Chưa có deployment kiểm chứng | BLOCKED không deploy | BLOCKED | P2 | `contracts/scripts/deploy.js:1` |
| F081 | QA | Người dùng | UAT/Lighthouse/Postman/khả năng dùng mobile | Chưa có kết quả | Chưa có artifacts kiểm chứng | — | — | Mobile smoke FAIL tràn 529 px/viewport 320; chưa UAT/Lighthouse/Postman, giữ MISSING cho bộ đầu ra yêu cầu | MISSING | P3 | `docs/PROGRESS.md:1`; xem09_TEST_RESULTS.md lượt demo |

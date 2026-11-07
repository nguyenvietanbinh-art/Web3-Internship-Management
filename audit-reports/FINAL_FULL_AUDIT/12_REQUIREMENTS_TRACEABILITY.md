# ĐỐI CHIẾU YÊU CẦU VÀ KIỂM ĐỊNH CŨ

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Nguồn

Đã đọc lại README.md, docs/*.md và toàn bộ14 báo cáo cấp trên audit-reports trước phân tích. Hai DOCX untracked được đọc read-only bằng zip/XML word/document.xml: `Thư mục mới/KLCN129_Trần-Việt-Hùng.docx` (đề cương, mục5–7/9) và `Thư mục mới/Tuần-3_-sơ-đồ-123.docx` (mô tả nghiệp vụ/UC01–07). Chưa thẩm định trực quan sơ đồ nhúng trong ảnh. Không sửa hoặc xóa DOCX/ZIP untracked. docs/PROGRESS là lịch sử, không tự coi đánh dấu hoàn thành là bằng chứng.

Q01–Q21 là nhóm truy vết do đợt audit chuẩn hóa từ văn bản, không giả là mã requirement nguyên gốc. Các Fxxx chia nguyên tử để đánh giá; API/model/hạ tầng đã có trong code được đưa vào cùng danh mục và công khai mẫu số. Không chấm thang điểm luận văn, không bỏ yêu cầu password/BERT/QR/NFT chỉ vì demo hiện dùng wallet/TF-IDF.

| Nhóm | Yêu cầu | Nguồn | Chức năng đối chiếu | Kết luận |
| --- | --- | --- | --- | --- |
| Q01 | MERN/API/giao diện vận hành | KLCN129 mục6–7; README | F001, F002, F003, F004, F005, F006 | Có runtime local; chưa E2E nghiệp vụ |
| Q02 | Đăng nhập/đăng xuất và phân quyền | DOCX UC06/07; docs/api-queries | F008, F009, F010, F011, F012, F013, F014 | Nonce/JWT unit đạt; demo bypass và internship ACL chưa đạt |
| Q03 | Tài khoản admin, email/password/reset/khóa | Tuần3 UC06/07 | F015, F016 | Thiếu password/reset/admin lifecycle; wallet-only chưa có thay đổi phạm vi được duyệt |
| Q04 | CV, skills/GPA và hồ sơ doanh nghiệp | KLCN129 chức năng01; Tuần3 tuyển dụng | F017, F018, F019, F020 | Model có, CV form chưa save/parser; GPA chưa dùng |
| Q05 | JD và quản lý vị trí tuyển | KLCN129 chức năng01; Tuần3 tuyển dụng | F021, F022, F023 | Create có; GET seed; edit/close thiếu |
| Q06 | Matching/ranking phù hợp năng lực | KLCN129 chức năng01 | F024, F025, F026, F027 | TF-IDF thật chạy pure, chain Front→Back→AI chưa runtime; fallback/mock cần sửa |
| Q07 | Ứng tuyển, xét duyệt và phân bổ | Tuần3 gợi ý và ứng tuyển; KLCN129 phân bổ | F028, F029 | Apply chỉ toast; thiếu Application/duyệt |
| Q08 | Đề tài/KPI/phân công theo công ty | DOCX quản lý thực tập; docs/api-queries | F030, F031, F032, F033, F034, F035 | API có, multi-slot và consistency chưa hoàn chỉnh |
| Q09 | Nộp báo cáo tuần/cuối kỳ, lưu chứng cứ | Tuần3 UC04; KLCN129 chức năng02/03 | F036, F037 | KPI source có IPFS/AI nhưng blocked; weekly log thuần DB, chưa full flow |
| Q10 | Đánh giá điểm, nghiệm thu/hoàn tất | KLCN129 chức năng04; DOCX nghiệp vụ | F038, F039, F040 | API+contract có, role/rounding/state lệch; chưa E2E |
| Q11 | Giao task, cập nhật tiến độ | Tuần3 quản lý thực tập | F041, F042, F043 | UI/API có nhưng assignee/IDOR chưa đạt |
| Q12 | QR xác thực vị trí/thời gian → Blockchain; giờ làm | KLCN129 chức năng05; Tuần3 check-in/task | F044, F045, F046, F047, F048 | Không scanner/GPS/hashvalidation/chain checkin; thiếu checkout/duration |
| Q13 | Nhật ký và BERT phân loại tiến độ/rủi ro/cảnh báo | KLCN129 chức năng03; Tuần3 UC04 | F049, F050, F051, F052 | Worklog có, thiếu BERT risk classifier và notification |
| Q14 | Dashboard SV/DN/nhà trường | KLCN129 chức năng06 | F053, F054, F055, F056 | SV/DN partial; fallback số giả; school thiếu |
| Q15 | IPFS báo cáo/portfolio và hash smart contract | KLCN129 chức năng02; mục tiêu bảo mật | F057 | Helper có; chưa credentials/upload/readback/fileflow |
| Q16 | Điểm và bằng chứng minh bạch trên smart contract | KLCN129 chức năng04; docs/architecture | F007, F058, F059, F060, F061, F062, F063 | Compile đạt nhưng RPC/offline, sync sai, DB/chain không đảm bảo |
| Q17 | NFT/SBT chứng nhận không thể làm giả | KLCN129 mục tiêu và chức năng04; Tuần3 kết quả | F064, F065, F066 | Không mint chuẩn; certificate verification fake FAIL live |
| Q18 | BERT/metrics ranking và phân loại | KLCN129 chức năng01/03 và thước đo | F067, F068, F069, F070, F071 | Optional SBERT chưa chạy; thiếu dataset/evaluator/metrics |
| Q19 | Giảng viên/admin/trường quản lý và duyệt | Tuần3 UC06; KLCN129 dashboards | F072, F073, F074 | Mentor chỉ evaluator, thiếu trường/batch/admin lifecycle |
| Q20 | Dữ liệu, bảo mật, quan hệ và thống kê | KLCN129 bảo mật/lưu trữ; docs/mongodb-setup | F075, F076, F077 | 14 models/index có; tenant/atomicity/privacy chưa đạt |
| Q21 | Kiểm thử, triển khai, tài liệu/UAT | KLCN129 mục7/9; README; docs/PROGRESS | F078, F079, F080, F081 | Build/compile/local health có, test destructive blocked, chưa staging/testnet/UAT |

## Đối chiếu26 phát hiện trước

| ID cũ | Phát hiện cũ | Cập nhật audit này |
| --- | --- | --- |
| A01 | P0 — Môi trường phiên audit chưa chạy được Node stack (T) | Đã cải thiện: Node/deps/build/compile/Mongo/FE/BE chạy; Pinata/AI/RPC còn thiếu. Không còn kết luận toàn Node stack không chạy. |
| A02 | P0 — Chứng nhận không tồn tại vẫn được xác minh (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A03 | P0 — Người dùng bất kỳ có JWT được ghi txHash/onChainId cho mọi topic (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A04 | P0 — DB thành công trước, giao dịch lỗi bị bỏ qua (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A05 | P0 — Chưa có NFT/SBT dù UI thông báo đã mint (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A06 | P0 — QR không được xác thực và không phải mã quét thật (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A07 | P1 — API đọc tự tạo dữ liệu, mở trang cũng ghi DB (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A08 | P1 — Task/nhật ký thiếu phân quyền theo đối tượng (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A09 | P1 — Giao task từ UI bị gán cho chính công ty (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A10 | P1 — Demo-login bỏ qua bảo vệ chữ ký và không giới hạn môi trường (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A11 | P1 — Listener có nguy cơ mất payload sự kiện ethers v6 (S, cần runtime xác nhận) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A12 | P1 — Listener đánh dấu xử lý sớm, định danh topic yếu, đồng bộ thiếu (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A13 | P1 — Cấu hình Hardhat có dấu hiệu không tương thích chế độ module (S, chưa tái hiện) | Không tái hiện HH19/ESM: Hardhat2.29.1 config nạp và compile mới đạt. Đóng nghi vấn loader; giữ các lỗi nghiệp vụ riêng. |
| A14 | P1 — API và chain dùng quy tắc nghiệp vụ khác nhau (S) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A15 | P1 — Chưa kiểm soát chainId/signer, dễ lệch JWT demo với MetaMask (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A16 | P1 — Ghi nhiều collection không nguyên tử, thiếu chống cạnh tranh (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A17 | P1 — CV không lưu, ứng tuyển chỉ toast (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A18 | P1 — Điểm AI giả lập và provenance chưa rõ (S + T cho report) | Có kiểm chứng mới (live GET hoặc pure/mock) ngoài đọc source; xem09. Chưa sửa. |
| A19 | P2 — Đa slot chưa dùng được và hai contract chưa thống nhất (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A20 | P2 — Venv không di chuyển được, BERT chưa được triển khai đủ (T + S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A21 | P2 — Thiếu quản lý giờ làm, AI cảnh báo và dashboard nhà trường (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A22 | P1 — Seed không an toàn cho dữ liệu đang dùng và không đồng nhất (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A23 | P1 — Test helper xóa database, test script contract chưa dùng tests (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A24 | P2 — Tài liệu chạy và triển khai không phản ánh source (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A25 | P2 — UI trạng thái/quyền không khớp API (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |
| A26 | P2 — API đọc công khai dữ liệu nội bộ, thiếu phân trang ở nhóm mới (S) | Còn theo source; chưa sửa. Đọc chi tiết báo cáo chuyên đề. |

## Cần chốt với chủ đồ án sau kiểm định

Wallet-only có thay email/password/reset theo UC07 không; mentor có đại diện giảng viên/nhà trường không; chọn Platform hay Registry; một hay nhiều sinh viên/topic; rubric/rounding/mentor chain permission; NFT hay SBT và chuẩn token; SBERT có đáp ứng yêu cầu BERT/risk classification hay cần classifier riêng. Chưa có phê duyệt thay phạm vi nên các mục thiếu vẫn giữ MISSING/PARTIAL/BLOCKED, không tự xóa khỏi mẫu số.


## Tài liệu sai lệch cần cập nhật sau khi sửa

README phần IPFS nói thiếu Pinata trả local-... nhưng helper hiện ném503 IPFS_NOT_CONFIGURED. README nói thao tác nghiệp vụ chưa gửi giao dịch trong khi App.jsx đã có ethers calls nhưng catch lỗi và success sai. README khuyên npm install/seed trực tiếp chưa có safety guard; seed.js:17,20 dropIndex và:26 deleteMany duplicate evaluations, ngoài các upsert rộng. database/seed.mongodb.js createIndex/update/upsert cũng là thao tác ghi, không phải kiểm tra read-only. Không thực hiện các lệnh này. docs/analysis còn nói cần thêm auth dù nonce/JWT đã có; cần đối chiếu từng tuyên bố với source và không xem PROGRESS là kết quả UAT.

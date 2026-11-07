# Đánh giá chức năng so với đề cương KLCN129

Ngày đánh giá: 31/10/2026, Asia/Bangkok.

Nguồn chính: `Thư mục mới/KLCN129_Trần-Việt-Hùng.docx`, mục 5, 6, 7, 9 và 10. Đã đọc lại văn bản trong DOCX. Bằng chứng thực thi lấy từ đợt demo tối 30/10 đến đầu ngày 31/10/2026: [kết quả kiểm thử](DEMO_REASSESSMENT_20261030_2340/09_TEST_RESULTS.md). Không chạy lại ứng dụng hoặc sửa source trong lần đối chiếu này.

## 1. Kết luận

Đồ án có nền tảng MERN vận hành và nhiều nghiệp vụ thực, nhưng **chưa đáp ứng đầy đủ các chức năng trọng tâm của đề cương**. Phần thiếu lớn nhất nằm ở BERT, QR xác thực, IPFS thực và chứng nhận NFT/SBT thực.

Trong **7 chức năng được đánh số tại mục 9 của đề cương**, hiện chưa chức năng nào có đủ bằng chứng để nghiệm thu toàn bộ yêu cầu. Có 4 chức năng đáp ứng một phần (01, 02, 04, 06); 3 chức năng chưa đạt yêu cầu cốt lõi (03, 05, 07). Đây không phải kết luận đồ án “0% hoàn thành”: mỗi nhóm bao gồm nhiều phần, và hạ tầng/API/chức năng phụ đã có kết quả kiểm thử thành công.

Quy ước: “Một phần” có nghĩa có triển khai hữu ích nhưng còn thiếu thành phần bắt buộc hoặc kiểm chứng tích hợp. “Chưa đạt” có nghĩa điều kiện cốt lõi của yêu cầu còn thiếu hoặc đã kiểm thử thất bại. Không lấy số lượng dữ liệu seed, build/compile thành công hoặc tỷ lệ test PASS làm tỷ lệ đáp ứng đề cương.

## 2. Chức năng cơ bản

| Yêu cầu tại mục 9 | Bằng chứng hiện có | Kết luận | Việc cần hoàn thiện |
| --- | --- | --- | --- |
| Đăng nhập | Nonce, ký ví và JWT đã kiểm thử HTTP; tạo hồ sơ sinh viên/doanh nghiệp thành công. Ba preset demo hoạt động trong trình duyệt. | Một phần | Tách demo-login khỏi môi trường dữ liệu thật; không coi đăng nhập demo không chữ ký là xác thực an toàn. |
| Đăng xuất | Đã thao tác logout và khôi phục phiên trong trình duyệt với các preset. | Đạt trong phạm vi smoke test đã chạy | Kiểm thêm token hết hạn, thay đổi tài khoản/mạng MetaMask và các trường hợp lỗi. |
| Đổi mật khẩu | Chưa có luồng mật khẩu/đổi mật khẩu; hiện dùng ví. | Chưa có theo yêu cầu nguyên văn | Triển khai hoặc có xác nhận của giảng viên cho phép thay yêu cầu bằng cơ chế quản lý xác thực ví. Không tự coi wallet-only đã thay thế yêu cầu. |
| Phân quyền Admin, Doanh nghiệp, Sinh viên | Nhóm topic có owner/student/evaluator guards và nhiều negative test đạt. Admin mới chủ yếu có enum; task, worklog, QR, record-chain-tx còn lỗi quyền. | Chưa đạt đầy đủ | Bổ sung quản trị và kiểm role + owner + assignment/tenant trên toàn bộ API liên quan. |

File chính: `server/src/routes/auth.routes.js`, `server/src/middleware/auth.js`, `server/src/routes/topic.routes.js`, `server/src/routes/internship.routes.js`, `client/src/components/AuthModal.jsx`.

## 3. Đối chiếu đúng 7 chức năng của đề cương

| Mã | Yêu cầu nguyên tắc trong đề cương | Đã có và đã kiểm chứng | Thiếu hoặc sai | Đánh giá |
| --- | --- | --- | --- | --- |
| 01 | Phân tích CV–JD, tự động gợi ý/ranking phù hợp năng lực; đánh giá Precision@K, Recall@K, MAP, NDCG@K. Mục 7 yêu cầu BERT/Sentence-Transformers. | Tạo JD bằng form và lưu MongoDB; TF-IDF + skills overlap thực thi. Luồng trình duyệt → Backend → AI và sắp xếp kết quả đã chạy. | Chưa chứng minh Sentence-Transformers chạy; thiếu đọc/trích CV file, CV form chưa lưu hồ sơ, GPA chưa tham gia matching. Chưa có dataset gán nhãn hoặc các metrics yêu cầu. Điểm mặc định/fallback gây hiểu nhầm. | **Một phần** |
| 02 | Lưu báo cáo thực tập phi tập trung bằng IPFS và ghi hash bằng Smart Contract để xác thực. | Có Pinata helper, trường CID/hash và logic submit trong API/contract. Kiểm tra thực xác nhận thiếu Pinata trả 503 và không thêm Submission. | Chưa upload/pin/readback thật, chưa đối chiếu hash với nội dung và receipt trên chain. Full-flow foundation test dùng IPFS stub nên không chứng minh tích hợp thật. | **Một phần về triển khai; chưa nghiệm thu tích hợp** |
| 03 | BERT phân tích báo cáo định kỳ, đánh giá tiến độ và cảnh báo rủi ro; Accuracy, Precision, Recall, F1, Confusion Matrix cho các lớp báo cáo. | Có TF-IDF/keyword phân tích báo cáo KPI và lưu AIAnalysis trong luồng test. | Chưa BERT phân loại báo cáo tuần/cuối kỳ; thiếu nhãn, dataset, classifier, cảnh báo và metrics. AI HTTP cho báo cáo trống vẫn gợi ý 50 điểm. Đây chưa phải hệ thống phân loại tiến độ/rủi ro mà đề cương yêu cầu. | **Chưa đạt** |
| 04 | Quản lý công việc, chấm công, cập nhật số giờ và task hoàn thành. | Task, WorkLog, Attendance, dashboard có model/API/UI. Tạo task với assignee rõ ràng và tạo nhật ký bằng API đã thành công. | Thiếu check-out, duration/timesheet và số giờ; giao task từ UI có thể sai người; task status/worklog review thiếu quyền. Một số GET tạo lịch sử giả. | **Một phần** |
| 05 | QR check-in xác thực vị trí/thời gian theo chuỗi Sinh viên → QR → Backend → xác thực → Blockchain. | Có payload QR theo ngày, giao diện điểm danh và POST check-in; trùng ngày trả 409. | Không có QR scanner thực/GPS/session validation đầy đủ; QR sai vẫn HTTP 200. Chưa ghi check-in lên blockchain. Hình QR/CSS và nút check-in không đáp ứng luồng yêu cầu. | **Chưa đạt** |
| 06 | Dashboard Doanh nghiệp/Nhà trường theo dõi thực tập sinh và Sinh viên quản lý nhật ký, nộp báo cáo. | Dashboard có dữ liệu seed; đủ 5 tab đã render; các API đọc dữ liệu thực hoạt động. Có nhật ký và API KPI. | Thiếu dashboard nhà trường/Admin đầy đủ; mentor chưa là luồng giảng viên riêng; còn fallback số liệu, scope dữ liệu/quyền chưa đúng. Nộp báo cáo thật bị chặn bởi Pinata. | **Một phần** |
| 07 | Quản lý điểm qua Smart Contract và tự động cấp chứng nhận on-chain NFT/SBT minh bạch. | Có API chấm KPI; chấm dữ liệu mẫu qua HTTP thành công. Hai contract compile; có ethers calls và listener source. | Chưa chạy luồng điểm/receipt/DB nhất quán trên chain; role/state/rounding còn lệch. Không mint token chuẩn. Tra mã không tồn tại vẫn verified/onChain=true và UI hiện ON-CHAIN VERIFIED/ERC-5192. | **Chưa đạt** |

### File liên quan và hướng sửa

| Mã | File chính | Hướng hoàn thiện dự kiến |
| --- | --- | --- |
| 01 | `ai-service/main.py`, `ai-service/requirements.txt`, `server/src/services/aiClient.js`, `client/src/components/CvJdView.jsx`, `server/src/routes/internship.routes.js` | Lưu CV/profile; nhận và xử lý CV file; chạy Sentence-Transformers thực; hiển thị provenance; chuẩn bị dataset và evaluator ranking. |
| 02 | `server/src/services/ipfsService.js`, `server/src/routes/topic.routes.js`, `contracts/contracts/InternshipPlatform.sol`, `client/src/api/web3Client.js` | Cấu hình môi trường Pinata thử được duyệt, upload/readback/hash; ghi và xác minh receipt đúng chain/contract. Không dùng CID stub để nghiệm thu. |
| 03 | `ai-service/main.py`, `server/src/services/aiClient.js`, `server/src/models/AIAnalysis.js`, `server/src/models/WorkLog.js` | Định nghĩa các lớp tiến độ, gán nhãn dữ liệu, triển khai BERT/classifier và cảnh báo; đo metrics; xử lý đầu vào trống/không liên quan. |
| 04 | `server/src/routes/internship.routes.js`, `server/src/models/Attendance.js`, `server/src/models/Task.js`, `server/src/models/WorkLog.js`, `client/src/components/AttendanceView.jsx` | Assignment/tenant scope; assignee đúng; bổ sung check-out/giờ làm và review đúng quyền; bỏ dữ liệu mẫu tạo khi GET. |
| 05 | `client/src/components/AttendanceView.jsx`, `server/src/routes/internship.routes.js`, `server/src/models/Attendance.js`, các contract | QR thật + scanner, phiên có hạn/công ty/assignment, kiểm vị trí/thời gian phía server và luồng bằng chứng blockchain. |
| 06 | `client/src/App.jsx`, `client/src/components/DashboardView.jsx`, `server/src/routes/internship.routes.js`, `server/src/routes/data.routes.js` | Dashboard theo vai trò, trường/giảng viên, scope đúng và empty state trung thực; hoàn thiện luồng nhật ký/báo cáo. |
| 07 | `contracts/contracts/InternshipPlatform.sol`, `contracts/contracts/InternshipRegistry.sol`, `server/src/services/chainListener.js`, `server/src/routes/topic.routes.js`, `server/src/routes/internship.routes.js`, `client/src/components/Web3CertificateView.jsx` | Chọn contract canonical, thống nhất rubric/role/state, xác minh receipt, mint NFT/SBT đúng chuẩn và bỏ mọi nhánh certificate giả. |

Vị trí dòng, lỗi và tiêu chí kiểm thử chi tiết: [48 API](DEMO_REASSESSMENT_20261030_2340/04_BACKEND_API_AUDIT.md), [bảo mật](DEMO_REASSESSMENT_20261030_2340/08_SECURITY_AUDIT.md), [roadmap](DEMO_REASSESSMENT_20261030_2340/10_COMPLETION_ROADMAP.md).

## 4. Công nghệ, kiểm thử và triển khai theo mục 6–7

| Yêu cầu | Hiện trạng/bằng chứng | Đánh giá |
| --- | --- | --- |
| MERN, React + ethers, Node/Express/MongoDB | Các service local đã chạy; API, dữ liệu và giao diện thực được kiểm tra. | Đạt phần nền tảng local; chưa đủ chứng minh mọi nghiệp vụ. |
| Solidity + Hardhat | Hai contract compile bằng Solidity 0.8.24; Hardhat 2.29.1 ESM hoạt động. | Đạt biên dịch, chưa kiểm chứng độ ổn định chức năng trên EVM/Sepolia trong đợt demo. |
| BERT/Sentence-Transformers và Hugging Face | Có nhánh tùy chọn SBERT nhưng runtime demo dùng TF-IDF; chưa có classifier báo cáo. | Chưa đạt công nghệ AI được yêu cầu. |
| Backend Render/Vinahost; DB Atlas M0; Frontend Vercel/VPS | Chỉ có bằng chứng runtime local. Kế hoạch tuần 10 còn cho phép Netlify cho Frontend. | Chưa có bằng chứng triển khai được kiểm tra; không mặc định là không tồn tại bên ngoài repository. |
| Postman, Lighthouse | Có kiểm tra API/browser bằng công cụ tự động, chưa có bộ Postman hoặc báo cáo Lighthouse được xác minh. | Có kiểm thử kỹ thuật thay thế một phần, chưa đủ bằng chứng đúng các đầu ra yêu cầu. |
| Sepolia | Không có runtime giao dịch/deployment được xác minh. | Chưa kiểm chứng. |
| Phản hồi doanh nghiệp/nhà trường/sinh viên | Chưa thấy bằng chứng UAT/khảo sát được xác minh. | Chưa kiểm chứng. |

Kết quả 87 phép kiểm có 70 PASS, 17 FAIL; 21 foundation test đã chạy trên bản sao bỏ dropDatabase và DB test riêng. Kết quả này có ích nhưng không thay thế metrics AI, Sepolia, UAT hay kiểm thử IPFS thật. Dữ liệu seed được phép dùng để demo/test theo kế hoạch tuần 4, nhưng không được dùng mẫu hardcode để tuyên bố model chính xác hoặc chứng nhận đã có trên chain.

## 5. Thang điểm đề cương: có thể và chưa thể kết luận gì

Mục 9 dành 0,5 điểm cho nhóm chức năng cơ bản và 0,5 điểm cho mỗi chức năng 01–07, tổng 4,0 điểm cho nhóm này. Kiểm thử/triển khai là 0,75 điểm riêng. Các phần khảo sát, sơ đồ, kế hoạch, báo cáo viết, định dạng, thái độ và thuyết trình cũng được chấm.

Không đủ cơ sở chấm điểm tổng /10 chỉ từ source hoặc demo này. Chưa thẩm định đầy đủ chất lượng sơ đồ nhúng, quyển báo cáo, khảo sát, slide, thuyết trình và tác phong. Cũng không tự cho điểm trọn vẹn một chức năng chỉ vì có UI/model hoặc test dùng stub. Cách giảng viên cho điểm thành phần phải theo rubric và nghiệm thu thực tế.

## 6. Ưu tiên để bám đúng đề cương

1. **Tính trung thực và an toàn:** bỏ certificate/điểm/success giả, bỏ GET/mount tự ghi, sửa demo bypass và quyền task/worklog/QR/record-chain-tx. Đây là điều kiện để demo không gây hiểu nhầm hoặc sửa dữ liệu người khác.
2. **AI bắt buộc:** chạy Sentence-Transformers cho CV–JD, bổ sung classifier báo cáo/rủi ro và dataset + metrics. TF-IDF giữ làm baseline, không gọi là BERT.
3. **Minh bạch thật:** Pinata upload/readback/hash, QR xác thực, receipt/đồng bộ và mint/verify NFT/SBT đúng chuẩn. Hoàn thiện trên mạng thử được duyệt trước khi tuyên bố on-chain.
4. **Quản lý thực tập đầy đủ:** giờ làm, assignment/multi-slot, dashboard nhà trường, CV/Application và vòng xét duyệt.
5. **Đầu ra nghiệm thu:** kiểm thử API/contract, Postman/Lighthouse, deployment, khảo sát người dùng và tài liệu kết quả.

Ngày kết thúc trong đề cương là 08/11/2026. Tại ngày đối chiếu 31/10/2026, cần thống nhất phạm vi còn lại với giảng viên; mọi thay thế như wallet-only, TF-IDF hoặc chứng nhận chỉ lưu CID cần được chấp thuận rõ ràng, không tự xem là đáp ứng yêu cầu ban đầu.

Đợt này chỉ đối chiếu và tạo báo cáo; không sửa ứng dụng, thay dữ liệu, cài dependency hoặc triển khai dịch vụ.

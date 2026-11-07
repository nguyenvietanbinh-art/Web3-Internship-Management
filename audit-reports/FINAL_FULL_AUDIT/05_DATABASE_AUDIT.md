# MONGODB VÀ MÔ HÌNH DỮ LIỆU

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Quan sát read-only

Mongo8.0.34 tại127.0.0.1:27017, DB web3_internship, ping ok1. Snapshot đầu: **14 collections,36 indexes,0 documents**; cuối có3JD (xem mục cuối). Bảng dưới là snapshot đầu, không phải số liệu cuối. Chỉ listCollections/find/indexes, không createIndex hoặc ghi. Snapshot đầu rỗng, cuối chỉ3JD mẫu; không có assignment/reference dataset đủ để xác nhận toàn vẹn nghiệp vụ hoặc hiệu năng khi có tải.

| Collection | Model/file | Documents | Index count | Index thực tế | Ràng buộc/vấn đề |
| --- | --- | --- | --- | --- | --- |
| ai_analyses | `server/src/models/AIAnalysis.js:1` | 0 | 2 | _id_; submissionId_1 UNIQUE | submissionId unique; kết quả AI, chưa quality metrics |
| assignments | `server/src/models/Assignment.js:1` | 0 | 3 | _id_; studentId_1_status_1; topicId_1 | topicId/studentId refs; thiếu unique pair, kpiAtAssign required |
| attendances | `server/src/models/Attendance.js:1` | 0 | 4 | _id_; studentWallet_1; companyWallet_1; studentWallet_1_date_1 UNIQUE | wallet+date unique; không company/session scope đầy đủ, thiếu checkout/duration |
| auth_nonces | `server/src/models/AuthNonce.js:1` | 0 | 3 | _id_; walletAddress_1 UNIQUE; expiresAt_1 TTL0 | wallet unique + TTL expiresAt0; DB TTL không thay expiry check ứng dụng |
| chain_events | `server/src/models/ChainEvent.js:1` | 0 | 3 | _id_; processed_1; txHash_1_logIndex_1 UNIQUE | txHash/logIndex unique, processed index; thiếu chainId/contract/reorg/checkpoint |
| companies | `server/src/models/Company.js:1` | 0 | 2 | _id_; userId_1 UNIQUE | userId unique; chưa quản lý phê duyệt DN |
| internship_tasks | `server/src/models/Task.js:1` | 0 | 1 | _id_ | Chỉ _id index; thiếu assignment ownership enforcement |
| job_descriptions | `server/src/models/JD.js:1` | 0 | 1 | _id_ | Chỉ _id index, status có nhưng thiếu lifecycle API |
| kpi_evaluations | `server/src/models/KPIEvaluation.js:1` | 0 | 3 | _id_; assignmentId_1; assignmentId_1_milestoneIndex_1 UNIQUE | assignment+milestone unique; tiêu chí con đang cùng điểm đầu vào |
| students | `server/src/models/Student.js:1` | 0 | 3 | _id_; userId_1 UNIQUE; studentCode_1 UNIQUE | userId unique, studentCode unique sparse, GPA0..4, kpi0..100; cvCid chưa parser |
| submissions | `server/src/models/Submission.js:1` | 0 | 2 | _id_; assignmentId_1_milestoneIndex_1_version_1 UNIQUE | assignment+milestone+version unique; không atomic sequence |
| topics | `server/src/models/Topic.js:1` | 0 | 4 | _id_; onChainId_1; companyId_1; companyId_1_status_1 | Embedded KPI + wallet + refs; 1 assignedStudentWallet, maxSlots không nối đủ |
| users | `server/src/models/User.js:1` | 0 | 2 | _id_; walletAddress_1 UNIQUE | Vai trò company/student/mentor/admin, ví unique; không password/reset/lock |
| work_logs | `server/src/models/WorkLog.js:1` | 0 | 3 | _id_; studentWallet_1; companyWallet_1 | Wallet refs dạng string, topic optional, tuần thiếu min; thiếu hours/AI/CID |

## Quan hệ và nhất quán

User1–1 Student/Company; Company→Topic; Topic→Assignment←Student; Assignment→Submission→AIAnalysis; Assignment→KPIEvaluation; Topic còn embedded KPI và wallet song song. Attendance/Task/WorkLog chủ yếu wallet strings, không enforce quan hệ company/assignment. Không có foreign key Mongo nên ref không bảo đảm document tồn tại. Không có Application, InternshipBatch, SchoolApproval, Notification, CertificateToken hoặc audit HTTP model.

Topic embedded submission/score và normalized Submission/Evaluation lưu song song, listener chỉ sửa Topic/ChainEvent. Submit/evaluate/complete ghi nhiều bước và gọi external services; lỗi giữa bước có thể tạo lệch, chưa có rollback/retry. Student.kpiScore có thể bị thay bằng điểm lần hoàn tất gần nhất, chưa rõ rubric tích lũy. Version last+1 có race dù unique submission sẽ chặn trùng cuối cùng; cần retry hoặc atomic sequence. Assignment upsert thiếu unique(topicId,studentId) dễ trùng khi concurrent. maxSlots/status/open/assignedCount không nguyên tử.

KPI weight sum100 ở route, không phải invariant toàn schema; score embedded chưa min/max. WorkLog update không validators, weekNumber thiếu range; Task/Attendance company dùng hardcode. ChainEvent key thiếu network/contract, Topic.onChainId chỉ index không unique/network scope. Không có cascade/delete policy đã thiết kế; không thử xóa, không có DELETE route tương ứng.

## Query và index

GET internship nhiều find/sort không phân trang; Task/JD chỉ _id index; topics filter wallet/status chưa khớp tất cả index; chain-events sort createdAt chưa có index riêng; regex escaped vẫn có thể full scan. Không thể kết luận hiệu năng thực tế trên0document; cần explain/load bằng DB test có volume đại diện, sau duyệt. Không tự thêm index vì có thể ghi metadata/khóa tài nguyên.

## Rủi ro và kế hoạch thay đổi DB

P0 bỏ seeding khi GET, tenant scope và dữ liệu giả. P1 xác định canonical Assignment/KPI, unique keys và consistency. Mongo đang standalone local: multi-document transaction cần replica set; không chỉ thêm session.withTransaction rồi coi chạy được. Sau phê duyệt chọn replica set riêng cho dev/test hoặc outbox/compensation. Mọi migration/index mới cần backup, dry-run trên DB test và không tự xóa duplicate. Snapshot trước/sau được đối chiếu ở09; dữ liệu nghiệp vụ không được ghi trong audit.


## Đối chiếu cuối: có thay đổi database đồng thời — không được bỏ qua

Snapshot đầu **23:11:09 ngày30/10/2026 (+07:00)** có14 collections/36indexes/0documents. Snapshot sau23:28:50 và lần cuối vẫn có14 collections/36indexes, nhưng **3 documents trong job_descriptions**,13collections còn lại0. Cả3 có createdAt khoảng **23:18:21.925–926 (+07:00)**, tiêu đề trùng3 JD mẫu trong `server/src/routes/internship.routes.js:99`. So sánh bảo toàn toàn DB: **FAIL / không giống snapshot đầu**. Không được báo database giữ nguyên0document suốt kiểm định.

Chỉ chứng minh có ghi đồng thời và nội dung phù hợp nhánh seed; **chưa xác định nguồn request/process gây ghi** vì Backend không có access/audit log đủ để quy thuộc. Frontend/Backend/Mongo vốn đang chạy. Không khẳng định người dùng đã mở tab hay có bên nào cụ thể thực hiện. Các lệnh audit live chỉ GET đã kiểm tra read-only và Mongo read commands; không gọi /jds hoặc API ghi trên Backend hiện tại. Router mutation tests dùng model fake, connect/driver write bị chặn và readyState0, không dùng MongoDB thật. Không vì kết quả source/mock mà quy nguồn3document cho một request chưa quan sát.

Không xóa3JD, không khôi phục snapshot bằng ghi, không dừng tiến trình đang chạy ngoài phạm vi cho phép. Đã dừng thêm thử nghiệm runtime; chỉ đọc collection/timestamps và hoàn thiện báo cáo. Cần xử lý auto-write P0 và cô lập client/database trước E2E. Evidence ở ignored staging: runtime-before.json, runtime-after.json, runtime-final.json, concurrent-change.json. Timestamp trong JSON là UTC; báo cáo đổi sang Asia/Bangkok. Việc live environment có writer đồng thời giới hạn kết luận bảo toàn DB, không làm vô hiệu các assertion thuần/mock đã cô lập.


## Tài liệu sai lệch cần cập nhật sau khi sửa

README phần IPFS nói thiếu Pinata trả local-... nhưng helper hiện ném503 IPFS_NOT_CONFIGURED. README nói thao tác nghiệp vụ chưa gửi giao dịch trong khi App.jsx đã có ethers calls nhưng catch lỗi và success sai. README khuyên npm install/seed trực tiếp chưa có safety guard; seed.js:17,20 dropIndex và:26 deleteMany duplicate evaluations, ngoài các upsert rộng. database/seed.mongodb.js createIndex/update/upsert cũng là thao tác ghi, không phải kiểm tra read-only. Không thực hiện các lệnh này. docs/analysis còn nói cần thêm auth dù nonce/JWT đã có; cần đối chiếu từng tuyên bố với source và không xem PROGRESS là kết quả UAT.

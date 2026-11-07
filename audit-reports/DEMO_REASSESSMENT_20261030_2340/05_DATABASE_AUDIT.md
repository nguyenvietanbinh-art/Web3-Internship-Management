# DATABASE DEMO, SEED VÀ BẢO TOÀN

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

## Đích seed và dữ liệu ban đầu

Chạy `npm.cmd run seed` trong server, MONGODB_URI=`mongodb://127.0.0.1:27017/web3_internship_demo_20261030_2340`. Đã listCollections xác nhận target rỗng trước chạy. Không chạy `database/seed.mongodb.js` vì line 6 getSiblingDB cố định web 3_internship gốc. Script server vẫn có dropIndex/deleteManynhưngguardchặncácopđó; không có deleteMany được thực hiện, vì DB mới không duplicate.

| Collection | Sau seed | Snapshot cuối demo | Indexes cuối |
| --- | --- | --- | --- |
| ai_analyses | 37 | 37 | 2 |
| assignments | 19 | 20 | 3 |
| attendances | 0 | 8 | 4 |
| auth_nonces | 0 | 0 | 3 |
| chain_events | 0 | 0 | 3 |
| companies | 6 | 8 | 2 |
| internship_tasks | 0 | 4 | 1 |
| job_descriptions | 0 | 5 | 1 |
| kpi_evaluations | 31 | 32 | 3 |
| students | 16 | 17 | 3 |
| submissions | 37 | 37 | 2 |
| topics | 25 | 26 | 4 |
| users | 22 | 26 | 2 |
| work_logs | 0 | 3 | 3 |


Seed ban đầu 22 users/6 companies/16 students/25 topics/19 assignments/37 submissions/37ai_analyses/31 evaluations; các attendance/task/worklog/JD/chains trống. Các JD 3/Task 3/WorkLog 2/Attendance 7 do GET tự tạo trong demo được ghi rõ như lỗi, không tính seed script đã có tính năng hoàn chỉnh. Thêm record do API/UI test có chủ đích, giữ lại không clean up xóa. Snapshot cuối 223 documents; nonce TTL có thể hết hạn sau snapshot, khôngtrìnhbàysốliệunàylàbấtbiến.

Database foundation riêng 67 documents; test helper bản sao bỏ dropDatabase, nên record test được giữ chứ không xóa. Auth Nonce consume hợp lệ và TTL là kỹ thuật luồng xác thực, không xóa dữ liệu nghiệp vụ. Không tạo/sửa schema hoặc index source; autoCreate/autoIndex Mongoose ở DB thử được phép để chạy.

## Kiểm tra nhất quán chỉ đọc

7 nhóm reference(User↔Student/Company, Assignment→Topic/Student, Submission→Assignment, AIAnalysis→Submission, Evaluation→Assignment) có 0 dangling trong snapshot demo. Không tuyên bố foreign key đã được enforce. Kiểmcomputedcriteriaweightedvsstoredtotal 0 sai lệch; còn 1 embedded KPI approved/submitted không có normalized submission match milestone. Đây là bất đồng fixture/representation trên snapshot, khôngdùngfixturesđểchứngminhfull flow đã chạy. Chưa load test/concurrency/explain dữ liệu lớn; missing unique Assignment/network keys/transactions vẫn chưa sửa.

## Database gốc

`web3_internship`: trước/sau 14 collections,36 indexes,3 JD. SHA 256 mỗi collection+index list giống nhau: **PASS bảo toàn database gốc** ởlượtdemonày. KhôngghiBusinessAPIđếnBackend 5000; hệ thống gốc vẫn chạy. Kết quả này độc lập với audit trước từng phát hiện 3 JD được tạo đồng thời, khôngviếtlạilịchsửđó.

Muốn xem dữ liệu trong Compass,kết nối 127.0.0.1:27017 và chọn database **web3_internship_demo_20261030_2340**, không phải web3_internship. [Audit 14 schema/index gốc](../FINAL_FULL_AUDIT/05_DATABASE_AUDIT.md) vẫnápdụngdo source không đổi.

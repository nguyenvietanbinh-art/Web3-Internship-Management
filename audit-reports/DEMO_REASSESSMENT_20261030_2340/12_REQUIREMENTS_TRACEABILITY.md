# ĐỐI CHIẾU ĐỀ CƯƠNG VÀ 26 PHÁT HIỆN SAU DEMO

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

Nguồn yêu cầu vẫn là 2 DOCX KLCN 129 và Tuần 3 UC 01–07,README/docs. Không tự đổi phạm vi wallet-only thay password,BERT thành TF-IDF,hoặc cờ certificateIssued thành SBT. Sơ đồ nhúng chưa được kiểm định trực quan lại lần này. Toàn bộ code/docs/source tracked không đổi,kếthừaphântíchrequirementtrước; cập nhật bằng chứng runtime ở 02/09.

| Nhóm | Yêu cầu | Nguồn | Chức năng đối chiếu | Kết luận |
| --- | --- | --- | --- | --- |
| Q01 | MERN/API/giao diện vận hành | KLCN 129 mục 6–7; README | F001, F002, F003, F004, F005, F006 | Có runtime local; chưa E2E nghiệp vụ |
| Q02 | Đăng nhập/đăng xuất và phân quyền | DOCX UC 06/07; docs/api-queries | F008, F009, F010, F011, F012, F013, F014 | Nonce/JWT unit đạt; demo bypass và internship ACL chưa đạt |
| Q03 | Tài khoản admin, email/password/reset/khóa | Tuần 3 UC 06/07 | F015, F016 | Thiếu password/reset/admin lifecycle; wallet-only chưa có thay đổi phạm vi được duyệt |
| Q04 | CV, skills/GPA và hồ sơ doanh nghiệp | KLCN 129 chức năng 01; Tuần 3 tuyển dụng | F017, F018, F019, F020 | Model có, CV form chưa save/parser; GPA chưa dùng |
| Q05 | JD và quản lý vị trí tuyển | KLCN 129 chức năng 01; Tuần 3 tuyển dụng | F021, F022, F023 | Create có; GET seed; edit/close thiếu |
| Q06 | Matching/ranking phù hợp năng lực | KLCN 129 chức năng 01 | F024, F025, F026, F027 | TF-IDF thật chạy pure, chain Front→Back→AI chưa runtime; fallback/mock cần sửa |
| Q07 | Ứng tuyển, xét duyệt và phân bổ | Tuần 3 gợi ý và ứng tuyển; KLCN 129 phân bổ | F028, F029 | Apply chỉ toast; thiếu Application/duyệt |
| Q08 | Đề tài/KPI/phân công theo công ty | DOCX quản lý thực tập; docs/api-queries | F030, F031, F032, F033, F034, F035 | API có, multi-slot và consistency chưa hoàn chỉnh |
| Q09 | Nộp báo cáo tuần/cuối kỳ, lưu chứng cứ | Tuần 3 UC 04; KLCN 129 chức năng 02/03 | F036, F037 | KPI source có IPFS/AI nhưng blocked; weekly log thuần DB, chưa full flow |
| Q10 | Đánh giá điểm, nghiệm thu/hoàn tất | KLCN 129 chức năng 04; DOCX nghiệp vụ | F038, F039, F040 | API+contract có, role/rounding/state lệch; chưa E2E |
| Q11 | Giao task, cập nhật tiến độ | Tuần 3 quản lý thực tập | F041, F042, F043 | UI/API có nhưng assignee/IDOR chưa đạt |
| Q12 | QR xác thực vị trí/thời gian → Blockchain; giờ làm | KLCN 129 chức năng 05; Tuần 3 check-in/task | F044, F045, F046, F047, F048 | Không scanner/GPS/hashvalidation/chain checkin; thiếu checkout/duration |
| Q13 | Nhật ký và BERT phân loại tiến độ/rủi ro/cảnh báo | KLCN 129 chức năng 03; Tuần 3 UC 04 | F049, F050, F051, F052 | Worklog có, thiếu BERT risk classifier và notification |
| Q14 | Dashboard SV/DN/nhà trường | KLCN 129 chức năng 06 | F053, F054, F055, F056 | SV/DN partial; fallback số giả; school thiếu |
| Q15 | IPFS báo cáo/portfolio và hash smart contract | KLCN 129 chức năng 02; mục tiêu bảo mật | F057 | Helper có; chưa credentials/upload/readback/fileflow |
| Q16 | Điểm và bằng chứng minh bạch trên smart contract | KLCN 129 chức năng 04; docs/architecture | F007, F058, F059, F060, F061, F062, F063 | Compile đạt nhưng RPC/offline, sync sai, DB/chain không đảm bảo |
| Q17 | NFT/SBT chứng nhận không thể làm giả | KLCN 129 mục tiêu và chức năng 04; Tuần 3 kết quả | F064, F065, F066 | Không mint chuẩn; certificate verification fake FAIL live |
| Q18 | BERT/metrics ranking và phân loại | KLCN 129 chức năng 01/03 và thước đo | F067, F068, F069, F070, F071 | Optional SBERT chưa chạy; thiếu dataset/evaluator/metrics |
| Q19 | Giảng viên/admin/trường quản lý và duyệt | Tuần 3 UC 06; KLCN 129 dashboards | F072, F073, F074 | Mentor chỉ evaluator, thiếu trường/batch/admin lifecycle |
| Q20 | Dữ liệu, bảo mật, quan hệ và thống kê | KLCN 129 bảo mật/lưu trữ; docs/mongodb-setup | F075, F076, F077 | 14 models/index có; tenant/atomicity/privacy chưa đạt |
| Q21 | Kiểm thử, triển khai, tài liệu/UAT | KLCN 129 mục 7/9; README; docs/PROGRESS | F078, F079, F080, F081 | Build/compile/local health có, test destructive blocked, chưa staging/testnet/UAT |



## Cập nhật bằng chứng so với 26 finding

- A01: local Node/deps/Mongo/FE/BE đã chạy trước,nayseed+AI 8001+browser thật đạt. Pinata/RPC/BERT vẫn thiếu; không đánh đồng hạ tầng với nghiệp vụ.
- A02/A03/A06/A07/A08/A10: đã tái hiện HTTP và DB demo,không còn chỉ source review/mock. A 02 còn UI badge thực.
- A04/A05/A11/A12/A14/A15/A16: chưa cóchainE2E; source/unit trước vẫn có giá trị,naykhôngtuyênbốlistener/tx/mint thật đã PASS.
- A09/A17/A18/A19/A25: source chưa đổi; UI apply không POST/AI service có request/đa-slot 409 đã quan sát. CV local form,task assignee,role UI vẫn cần sửa.
- A13: lần compile mới 2 contract xác nhận loader ESM không lỗi; không bắt buộc đổi CommonJS.
- A20/A21: AI TF-IDF runtime đạt,mặtnàycảithiệnbằngchứng; SBERT deps/metrics/risk/giờ làm/school vẫn thiếu.
- A22: seed đã chạy được trên DB riêng với guard; source vẫn có dropIndex/deleteMany,khôngcoiđãváseedantoànchung.
- A23: 21 test đạt trên bản sao bỏ dropDatabase; helper gốc chưa sửa,contract npm test placeholder chưa sửa.
- A24: README/IPFS/ethers/auth chưa cập nhật,lần đánh giá mới không sửa tài liệu app.
- A26: public normalized GET thực trả dữ liệu mẫu; phải giới hạn projection/tenant trước dùng hồ sơ thật.

CácnhómQ/F và mẫu số 81 giữ nguyên; requirementtablecũlàbảnđốichiếunguồn,cột kết luận hiện thời ưu tiên theo 02/09 mới ở bộ này. Không chấm lại thang điểm luận văn bằng tỷ lệ test PASS.

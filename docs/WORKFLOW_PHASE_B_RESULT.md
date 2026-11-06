> **2026-11-06 ? catalog for new periods:** Creating a period now automatically publishes open company topic templates with independent period quotas. The two existing empty periods were repaired with 41 opportunities each. See [rules and current verification](NEW_BATCH_TOPIC_CATALOG_RESULT.md). GET requests never populate data, and synchronization never reopens or overwrites an existing opportunity.

> **2026-11-06 ? first company acceptance:** The owner explicitly chose immediate acceptance by the first company, with automatic withdrawal of the student's other open applications and notifications to their companies. This supersedes the earlier offer/student-confirmation rule (D03). See [implementation, current bachelor-001 result and tests](FIRST_COMPANY_ACCEPTANCE_RESULT.md).

> **2026-11-06 ? direct applications:** The owner clarified that students apply directly to the selected company. This supersedes the earlier school-dispatch gate (D01). Admin intervention is the fallback from seven days before the period starts when no placement has been secured. See [updated policy, data fix and verification](DIRECT_APPLICATION_ROUTING_FIX.md).

# Internova — tiến độ triển khai giai đoạn B

Cập nhật ngày 06/11/2026. **Giai đoạn B đang triển khai, chưa nghiệm thu toàn bộ.** Báo cáo này ghi kết quả mới của nhánh nghiệp vụ nhà trường, không thay kết quả lịch sử bằng tuyên bố PASS chung.

## Phạm vi và môi trường thực tế

Kế hoạch tham chiếu: [INTERNSHIP_WORKFLOW_DATABASE_WEB3_PLAN.md](INTERNSHIP_WORKFLOW_DATABASE_WEB3_PLAN.md). Người dùng đã yêu cầu chuyển sang giai đoạn B. Gate D06 về dependency và gate migration lên database đang sử dụng vẫn tách riêng.

- Frontend mới: `http://localhost:5188`.
- Backend mới: `http://localhost:57418/api`.
- MongoDB replica set riêng: `internovaTestRs`, loopback `27018`.
- Demo: `web3_internship_test_phase1_workflow_20261106_a`.
- QA: `web3_internship_test_phase1_workflow_qa_20261106_a`.
- Hardhat riêng: `http://127.0.0.1:18546`, chain ID `31337`.
- AI nội bộ: `127.0.0.1:8003`; dùng model ONNX đã có, không tải model hay cài dependency mới.
- Flag `SCHOOL_WORKFLOW_ENABLED=true` chỉ chạy với exact URI TEST allowlist. Không bật lên database gốc.

Ứng dụng cũ và MongoDB `27017` được giữ nguyên. Đã so sánh nội dung BSON canonical, số document và index của toàn bộ **25 collection** database `web3_internship_test_phase1_khoa_20261106`: không thay đổi tại thời điểm đối chiếu. Không commit/push/merge/reset/clean Git.

## Đã triển khai

1. Chặn tạo tài khoản công khai bằng email, Google và ví trong chế độ mới; ẩn đăng ký trên giao diện. Tái sử dụng cấp tài khoản email của nhà trường và đổi mật khẩu. JWT có SID riêng mỗi lần đăng nhập, thay mật khẩu thu hồi phiên cũ.
2. Tách quyền tham gia kỳ, đăng ký kỳ, ứng tuyển, quyết định tiếp nhận và phân công chính thức. Có cấp membership, đổi diện tham gia kèm lý do, danh sách tạm ngưng/miễn/không thuộc diện. Không suy ra đăng ký từ tài khoản.
3. Cơ hội tuyển thuộc doanh nghiệp–đề tài–kỳ, có capacity và confirmedCount. Mỗi kỳ tối đa ba cơ hội đã ứng tuyển trong suốt lịch sử, bao gồm rút/từ chối. Hồ sơ và CV giữ snapshot.
4. Doanh nghiệp chỉ xem hồ sơ/CV sau khi nhà trường giao quyền xét. Thu hồi/hủy/rút/nhận đề tài khác cập nhật phạm vi. Offer không giữ chỗ; sinh viên xác nhận mới chiếm đúng một chỗ.
5. Transaction thật trên replica set cho nhận đề tài, phân công, hủy và điều chuyển. Bổ sung/đổi giảng viên không chiếm thêm chỗ. Hủy có audit, giữ lịch sử, hoàn chỗ một lần. Finalization thất bại rollback cả admission/chỉ tiêu.
6. Trường phân bổ trực tiếp từ thời điểm bắt đầu kỳ trừ bảy ngày, kể cả sau khi kỳ bắt đầu; yêu cầu doanh nghiệp cho phép và còn chỗ. Sinh viên chưa đăng ký cần xác nhận tham gia riêng, có audit.
7. Màn hình theo vai trò: admin quản lý kỳ/sinh viên/dispatch; sinh viên xem kỳ được cấp và ứng tuyển của mình; doanh nghiệp xem cơ hội, hồ sơ được giao và sinh viên chính thức; giảng viên chỉ xem phân công được giao. Dropdown phụ thuộc reset khi đổi lựa chọn, GET không tự phân công.
8. Dashboard lấy số người thực tế theo kỳ, có danh sách chi tiết và bộ lọc. Popup theo user/SID/kỳ; tick + OK giữ tắt qua reload/tab trong cùng phiên. Đăng nhập mới nhắc lại. Web Locks tránh mở đồng thời ở nhiều tab; dashboard vẫn hiển thị việc tồn khi tắt popup. Việc phát sinh trong kỳ đã tắt nhắc không tự mở lại trong phiên; bộ đếm vẫn cập nhật khi tải lại.
9. Tái sử dụng công việc, nộp tệp, nhật ký, chấm công, KPI và báo cáo qua adapter phân công chính thức. Hạn chế `/placements` legacy mutation, vẫn cho phép GET phân công có scope và các command KPI được phân quyền.
10. AI xếp hạng cơ hội theo membership của sinh viên; doanh nghiệp chỉ xếp hạng CV snapshot được giao. TF-IDF và Sentence-BERT chạy nội bộ thật. Service không sẵn sàng trả 503, không tạo điểm dự phòng.
11. Thông báo nghiệp vụ theo hồ sơ/phân công trong phạm vi, đánh dấu đã đọc theo user. Nhắc onboarding ví cho sinh viên/doanh nghiệp; không khóa task/chấm công/báo cáo vì thiếu ví.
12. Chứng nhận SBT hiện có đã triển khai trên chain riêng; giữ kiểm tra chain instance, deployment receipt, code hash, event/calldata và quyền sở hữu. Không tự xác nhận token hay dùng hash giả.

## Dữ liệu demo thực tế

Đã tạo **218 tài khoản synthetic**: 200 sinh viên, 8 doanh nghiệp, 8 giảng viên, 2 admin. Mỗi loại kỳ 100 sinh viên; 40 đề tài gốc, 80 cơ hội theo kỳ, 200 memberships, 140 hồ sơ, 40 phân công chính thức. Capacity ban đầu 3–5 tùy đề tài.

Mỗi kỳ có 80 đã đăng ký, 20 chưa đăng ký, 30 đã nhận đề tài, 70 chưa có đề tài, 10 thiếu giảng viên, 20 đã phân công. Tài khoản dùng miền `example.invalid`, không phải thông tin người thật.

- Cử nhân: 20/11/2026 08:00 → 15/01/2027 17:00 giờ Việt Nam; hiện 0 active, 0 completed, chưa tới mốc nhắc thiếu đề tài.
- Kỹ sư: 01/11/2026 08:00 → 27/12/2026 17:00; hiện 15 active, 0 completed; 70 thiếu đề tài đã tới mốc nhắc.

Không seed giờ lao động, tx/CID/chứng nhận, kết quả AI hay thanh toán giả. Các phân công cử nhân tương lai giữ approved; không ép active để đủ cơ cấu kế hoạch. Kịch bản hoàn tất và chứng nhận đã thực hiện bằng API thật ở QA riêng, không đưa kết quả QA vào thống kê demo.

## Kiểm thử mới

Lệnh chạy toàn bộ tích hợp:

```powershell
$env:WORKFLOW_SBT_TESTS='true'
node --test --test-concurrency=1 server/test/workflow.integration.test.js
```

Kết quả gần nhất: **9 tests, 9 PASS, 0 FAIL, 0 SKIP**. Các nhóm:

- Public signup, vai trò, đổi mật khẩu, SID và thu hồi token.
- Eligibility khác registration; hồ sơ/CV trước dispatch và doanh nghiệp khác bị chặn.
- Bốn request ứng tuyển đồng thời chỉ ba thành công; rút không hoàn quota.
- Hai sinh viên tranh chỗ cuối chỉ một được nhận; retry/finalize/hủy không chiếm/hoàn lặp.
- Bộ đếm người theo kỳ và ranh giới bảy ngày bằng clock injection TEST kín.
- Finalization sai giảng viên rollback admission, registration và chỉ tiêu; hủy admission thu hồi CV.
- Task/nộp bài, nhật ký được giao, check-in/out, báo cáo hai đánh giá và điểm cuối; IDOR bị chặn; đổi giảng viên thu hồi scope cũ.
- TF-IDF/SBERT inference thật trong scope; lỗi service không sinh kết quả giả.
- Chữ ký liên kết ví thật, check-in/out đo hơn một phút thời gian thực, duyệt phút kiểm thử; KPI/báo cáo cuối kỳ, report/time/completion anchors, mint, retry cùng tx, SBT locked/owner và IDOR.

Khoảng một phút trong QA là **thời gian đo phiên kiểm thử**, không phải bằng chứng lao động của sinh viên thật. Không chỉnh đồng hồ máy hay backdate giờ làm.

Trình duyệt Chrome headless qua CDP: **5/5 PASS**, không runtime exception: đăng nhập không đăng ký; admin bộ đếm/390px không tràn ngang; popup theo SID/reload/nhiều tab; menu và kỳ sinh viên; scope menu doanh nghiệp/giảng viên và picker công việc. Có ảnh kiểm tra desktop/mobile trong evidence local. Đây là các kịch bản đại diện, không phải tuyên bố đã tự động hóa mọi biểu mẫu/edge case.

`npm --prefix client run lint` và `npm --prefix client run build`: PASS. SBT tái sử dụng artifact Solidity 0.8.24; đã đối chiếu source trong build-info trùng file contract hiện tại. Không gọi đây là lần compile ERC20 mới.

## Bảo toàn và phục hồi database

Đã chạy native BSON backup mã hóa bằng Windows CurrentUser DPAPI, rồi phục hồi vào **25 collection có prefix `recovery_20261106_` trong QA**. Nội dung BSON, số document và số index khớp. Không phục hồi đè application collections hoặc database gốc. Định dạng này là công cụ diễn tập nội bộ, **không phải file `mongodump --archive`**, không dùng `mongorestore` để đọc.

Dry-run migration chỉ đọc đã phân loại 45 bản ghi, ghi nhận 2 Student profile orphan và 3 kỳ cần xác minh loại. Không tự gán loại kỳ, không gộp email/ví, không suy ra quyền dispatch từ acceptance cũ. Script không có chế độ apply lên nguồn; migration nguồn/ledger/rollback rollout cần phê duyệt riêng sau khi xử lý mapping.

## Chưa hoàn thành và gate tiếp theo

**Chưa triển khai luồng chuyển token hỗ trợ ERC20:** chưa có contract payment, chữ ký doanh nghiệp gửi transfer, UI hỗ trợ, receipt verifier/reconciliation payment hoặc kiểm thử thanh toán. `SupportRound`/`SupportPayment` hiện là schema chuẩn bị, không phải tính năng đã hoàn thành. Không có khoản hỗ trợ nào được ghi là đã trả.

Mục D06 của kế hoạch yêu cầu duyệt dependency cụ thể và không cho dùng phê duyệt kế hoạch chung thay gate này. Đã đề nghị **`@openzeppelin/contracts@5.4.0` pin chính xác**, giữ Solidity 0.8.24; chưa nhận xác nhận nên chưa cài hoặc sửa lockfile. Cần duyệt trước nhánh ERC20/EIP712/ECDSA; không tự viết crypto thay thế.

G1–G5 đã có triển khai và kiểm thử đại diện; G6 mới có phần ví/SBT, còn hỗ trợ ERC20; G7 có dry-run và phục hồi TEST, chưa rollout nguồn; G8 chưa nghiệm thu toàn bộ ma trận. Không đánh dấu toàn bộ giai đoạn B hoàn tất.

## Chạy và kiểm tra thủ công

Evidence local hiện tại: `contracts/node_modules/.cache/workflow-b-20261106-205837/`. Các mật khẩu nằm trong `accounts.dpapi` và `manual-login-workflow.txt` được Git ignore, không chép vào tài liệu/log.

Ứng dụng đã chạy: mở `http://localhost:5188`, xem file tài khoản local rồi đăng nhập. Có thể dùng admin-1/admin-2, company-1 đến company-8, mentor-1 đến mentor-8, bachelor-001 đến bachelor-100 và engineer-001 đến engineer-100 tại miền `example.invalid`. Mật khẩu lấy từ file local, không dùng mật khẩu DB gốc.

- Admin: mở Kỳ & phân công, chọn loại và kỳ; lọc thiếu đề tài/thiếu giảng viên, dispatch hồ sơ. Kỳ cử nhân tương lai chưa tới thời điểm trường phân bổ trực tiếp là hành vi đúng.
- Sinh viên `engineer-001`–`020`: chưa đăng ký; `021`–`030`: đã đăng ký chưa ứng tuyển; `031`–`045`: hồ sơ chờ trường; `046`–`060`: trường đã giao; `061`–`070`: có offer; `071`–`080`: đã nhận, thiếu giảng viên; `081`–`100`: đã phân công.
- Doanh nghiệp: xem hồ sơ được giao, offer; sinh viên xác nhận; admin bổ sung giảng viên. Với phân công active, dùng công việc/nhật ký/chấm công/báo cáo hiện có.
- Giảng viên: chỉ thấy phân công được giao; kiểm điểm/nhận xét trong Báo cáo & kết quả.

Khởi động lại backend và frontend nếu đã dừng (hai terminal riêng; replica set phải đang hoạt động):

```powershell
node server/scripts/start-workflow.cjs contracts/node_modules/.cache/workflow-b-20261106-205837
```

```powershell
$env:VITE_API_URL='http://localhost:57418/api'
npm --prefix client run dev -- --host 127.0.0.1 --port 5188 --strictPort
```

Không chạy seed/bootstrap apply lại trên DB đã có dữ liệu; script sẽ từ chối. Không chạy `npm ci` trong contracts để tránh xóa cache/vault local. Nếu Hardhat bị tắt và khởi động chain mới, metadata/instance cũ không còn hợp lệ: không reset hay ghi đè deployment để báo PASS. Cần chuẩn bị deployment TEST mới có kiểm soát và giữ lịch sử cũ.

Evidence chính: `seed-result.json`, `final-integration.log`, `browser-results.json`, `sbt-qa-result.json`, `sbt-artifact-check.json`, `source-before.json`, `source-after.json`, `source-migration-dry-run.json`, `recovery-result.json`. Backup/credentials chứa dữ liệu nhạy cảm chỉ lưu DPAPI/local ignored; không commit thư mục evidence cache.

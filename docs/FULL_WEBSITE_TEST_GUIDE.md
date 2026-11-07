## Kiểm tra gợi ý CV/JD mới nhất — 07/11/2026

**Giao diện mới:** kỳ, phương pháp, số đề tài và nút tìm nằm trong một card. Hồ sơ có hai card bảo mật; đổi mật khẩu mở modal. [Ảnh và 21 kiểm thử trình duyệt](MATCHING_SECURITY_UI_RESULT.md).

**Cập nhật thông tin sau upload CV:** sau khi tải PDF/DOCX hoặc lấy từ URL, kiểm tra hộp **Thông tin đọc từ tệp CV** → **Đưa vào thông tin CV** → **Lưu CV**. Upload chỉ lưu tệp; các trường nhập tay chỉ cập nhật khi bạn xác nhận và lưu. Tệp không có cấu trúc rõ thì xem nội dung trích xuất để nhập thủ công. [Chi tiết và kiểm thử](CV_UPLOAD_FORM_SYNC.md).

Mở **http://localhost:5188**, đăng nhập sinh viên `2699000004@gmail.com` bằng mật khẩu trong file login local. Vào **Gợi ý đề tài phù hợp**, chọn kỳ tham chiếu và 5 kết quả. Thử TF-IDF → Sentence-BERT → chế độ so sánh; đổi cách sắp theo từng phương pháp. Mở “Xem chi tiết” để xem bốn nhóm kỹ năng. Kỹ năng liên quan không được tính là đã đáp ứng. Không cần liên kết ví để chạy AI.

Điểm hai phương pháp có thể gần nhau giữa các JD và không dùng làm xác suất trúng tuyển. BERT hiện đã nạp thật; nếu khởi động lại thiếu RAM, giải phóng bộ nhớ và thử lại. Không đổi nhãn TF-IDF thành BERT. [Kết quả, ảnh thật, giới hạn và các file đã sửa](SEMANTIC_MATCHING_REVIEW.md).

## Bắt đầu kiểm tra luồng sinh viên mới — 07/11/2026

**Bộ200 CV đã có trên web:** đăng nhập localhost5188 bằng tài khoản `2699000004@gmail.com` trong file local `contracts/node_modules/.cache/cv-jd-reference-web-20261107/main-manual-login.txt`, vào Gợi ý đề tài phù hợp → kỳ **Thực tập cử nhân CNTT — Đợt tháng11, năm học2026–2027** → thử TF-IDF và Sentence-BERT. Cả hai đã chạy thật đủ20 đề tài; không cần train lại hay liên kết ví. Tài khoản2211... cũ không tự được cấp kỳ này. [Danh sách hướng, dữ liệu và hướng dẫn](REFERENCE200_WEB_IMPORT.md).

**Nếu liên kết ví bị chờ:** nhấn **Dừng liên kết**, X hoặc Esc. Web bỏ qua kết nối/chữ ký trả về muộn; nếu MetaMask vẫn có yêu cầu pending, mở tiện ích và hủy tại đó trước khi thử lại. Nếu lệnh lưu đã gửi, kiểm lại trạng thái ví hoặc đăng nhập lại, không mặc định đã rollback. [Cách xử lý và kiểm thử](WALLET_LINK_CANCEL_FIX.md).

**Luồng ví hiện hành:** Hồ sơ → Ví Web3 của tôi → **Liên kết ví MetaMask** mới mở modal mật khẩu → Tiếp tục → chọn ví local và ký. Không còn ô mật khẩu ví hiện sẵn/nút Liên kết Google tại hồ sơ. Đừng điền phần Đổi mật khẩu để liên kết ví. [Hướng dẫn, API và41 test PASS](WALLET_LINK_MODAL_RESULT.md). Các mô tả form inline bên dưới là lịch sử.

**Xem thực nghiệm200 CV:** mở [CV_JD_EVALUATION_200.md](CV_JD_EVALUATION_200.md), chọn file CV/phiếu đối chiếu hoặc bảng4.000 cặp. Bộ này chạy riêng qua cùng AI service của web, không nhập/ghi đè hồ sơ sinh viên trong MongoDB và không thay kết quả tài khoản bạn đang dùng. CSV chờ xác nhận của người chấm được để trống đúng trạng thái.

Chỉ sinh viên/doanh nghiệp có công cụ ví; Admin/giảng viên không cần ví. [Lịch sử nguyên nhân nút bị khóa](WALLET_LINK_FORM_FIX.md); cách thao tác hiện tại dùng modal được mô tả ở đầu trang.

**Vị trí nộp và lưu báo cáo:** Báo cáo kết quả → chọn thực tập → **Nộp báo cáo kết quả**. Sau nộp, chọn **Xem bài báo cáo** trong danh sách để đọc bài, xem tệp và mở khối **Lưu trữ & bằng chứng báo cáo của tôi**. Khối IPFS/bằng chứng không còn ở Điểm danh. Thiếu cấu hình IPFS thì nút upload khóa; không đồng nghĩa bài chưa được nộp cho nhà trường. Báo cáo tuần vẫn nộp tại Công việc được giao.

Website hiện có **http://localhost:5188**. Để thử các thao tác ghi, dùng **http://localhost:5189** (database TEST riêng). Mở file tài khoản local `contracts/node_modules/.cache/student-workflow-20261107/manual-login-student-workflow.txt`; giữ mật khẩu ở máy, không copy vào tài liệu/Git.

1. Đăng nhập `freshStudent`: Tổng quan đã gộp tài khoản và thực tập; không còn Tổng quan tài khoản riêng hoặc công cụ phân công quản trị.
2. **CV của tôi**: chọn PDF/DOCX tại [docs/sample-cvs](sample-cvs/README.md), tải lên rồi xem văn bản đã đọc. Kiểm cả kỹ năng nhập có cấu trúc; không mặc định từ khóa trong file đã được xác minh.
3. Đăng nhập `unplaced` để thử **Gợi ý đề tài phù hợp**: chọn kỳ, so sánh TF-IDF/Sentence-BERT. Tài khoản này chưa có đề tài. Chỉ gợi ý cơ hội còn được phép; không phải xác suất được tuyển.
4. `freshStudent` → **Công việc được giao** → chọn thực tập → **Báo cáo tuần**: nhập5 mục, nộp cho doanh nghiệp, xem lại bài. Chuyển trang/Back/Forward rồi quay về kiểm lựa chọn còn giữ.
5. **Báo cáo kết quả**: chỉ bài cuối kỳ. `freshStudent` bàn giao chưa có bài nên có thể nộp lần đầu ngay; sau đó giảng viên yêu cầu bổ sung mới được nộp phiên bản mới. Sinh viên chỉ xem/nộp của mình; doanh nghiệp/giảng viên nhận xét, Admin chốt theo điều kiện cũ.
6. **Chấm công**: kiểm lý do khóa. `freshStudent` bàn giao đang active,0 phiên giờ,0 báo cáo: bạn có thể vào ca ngay. Sau ca đầu không vào lần2 cùng ngày UTC; không sửa timestamp, chỉnh đồng hồ hoặc xóa phiên. Luồng hợp lệ không cần ví: Vào ca → chờ ít nhất1 phút → Kết thúc ca → doanh nghiệp duyệt → tổng giờ mới tăng.
7. Dùng company/mentor/admin trong cùng file để kiểm báo cáo đúng phạm vi. Logout trước khi đổi tài khoản. Không dùng mật khẩu của môi trường5188 cho5189.

[Báo cáo thay đổi, file và giới hạn](STUDENT_WORKFLOW_UPDATE.md) · [Bằng chứng80 PASS/1 SKIP](evidence/student-workflow-20261107/README.md) · [Lệnh khởi động dịch vụ](RUN_FULL_WORKFLOW.md). Camera/GPS/ví thật chưa kiểm thử phần cứng trong đợt này; IPFS live vẫn BLOCKED. Các hướng dẫn menu cũ bên dưới chỉ là lịch sử.

> **Đọc và phân tích bài báo cáo — 07/11/2026:** Tại localhost5188, giảng viên chọn báo cáo → chọn **Nội dung dùng để phân tích** → **Xem bài báo cáo** → **Phân tích báo cáo**. Chọn **Bài mẫu chi tiết theo đề tài** để dùng48 bài mới; chọn **Bài báo cáo đã nộp** để dùng nguyên nội dung MongoDB. Bài mẫu không thay bài/điểm đã chốt. [Xem bài mẫu Giang/Đăng và hướng dẫn](REPORT_READING_SAMPLES.md).

> **Hướng dẫn hiện hành 07/11/2026:** dùng [RUN_FULL_WORKFLOW.md](RUN_FULL_WORKFLOW.md) để khởi động và thử từng vai trò. Website dữ liệu hiện có **localhost:5188**; website TEST riêng **localhost:5189**, tài khoản tại `contracts/node_modules/.cache/role-workflow-qa-20261107/manual-login-qa.txt`. Sinh viên do trường cấp tài khoản, không tự đăng ký công khai; doanh nghiệp không còn AI ranking; giảng viên/Admin không cần ví cá nhân. Đã có SBT thật trên Hardhat QA18546; IPFS live còn BLOCKED. [Kết quả nghiệm thu và các giới hạn](ROLE_WORKFLOW_COMPLETION.md). Các đoạn/cổng và hướng dẫn đăng ký cũ bên dưới là lịch sử, không áp dụng cho workflow hiện tại.

> **Bài báo cáo ngắn cho kỳ đã hoàn thành — 07/11/2026:** Có 36 bài/12 sinh viên tổng hợp, ba mức nội dung. Giảng viên xem/sửa bài trên form, chấm trước và hoàn tất phiếu thử riêng, xuất JSON; giữ nguyên báo cáo/điểm đã chốt. API scope tests PASS; 2 browser tests PASS gồm sửa form và tải file, không gọi API ghi điểm chính thức. Unit/rubric tests, lint/build PASS. Dataset chờ nhãn tại ai-service/datasets/completed-report-exercises-v1, chưa tự huấn luyện lại. [Hướng dẫn và bằng chứng](COMPLETED_REPORT_EXERCISES.md).
> **Đối chiếu kỹ năng và BERT đã nối đủ — 07/11/2026:** Sửa API workflow trước đây gửi kỹ năng đề tài rỗng; hiện dùng Topic.requiredSkills đã có. Bổ sung yêu cầu cụ thể cho 60 đề tài/144 cơ hội do script tạo, giữ 73 CV ứng tuyển. Giao diện hiện kỹ năng yêu cầu/đáp ứng/cần bổ sung và doanh nghiệp có ô nhập kỹ năng. Bốn nhóm CV × TF-IDF/SBERT đều HTTP 200, BERT inference thật; 8 unit/route/guard tests, lint/build PASS. Browser NOT TESTED; không coi toàn dự án đã production-ready. [Bằng chứng, tài khoản và giới hạn](SKILLS_MATCHING_IMPLEMENTATION.md).
> **GPA/kỹ năng — 07/11/2026:** Bổ sung đồng bộ 271 sinh viên tổng hợp và CV, giữ một hồ sơ đã thay đổi. GPA 2–4, kỹ năng 2/4/7/10 thuộc 8 hướng; 73 CV ứng tuyển đã gửi giữ nguyên. Bốn nhóm đăng nhập/CV/gợi ý TF-IDF HTTP 200; BERT BLOCKED (503, RAM dưới 1 GiB), không fallback giả. GPA chưa tham gia xếp hạng. [Tài khoản thử và bằng chứng](STUDENT_GPA_SKILLS_EXAMPLES.md).
> **Luồng mới: chấm trước, giảng viên kiểm tra — 07/11/2026:** Kết quả phân tích có điểm đề xuất 7 tiêu chí (official:false); giảng viên mở phiếu đã điền sẵn để sửa/xác nhận. Không tự lưu điểm; bài đầy đủ 82,33 và bài thiếu 32,84 trong lần thử API, báo cáo trước/sau không đổi. Chuẩn bị 6 bài mẫu thiếu và xuất 48 file đọc thử; thêm nút Xem bài báo cáo. 5 test chấm trước + 16 NLP + 5 phiếu chấm, lint/build PASS; browser NOT TESTED. [Hướng dẫn và giới hạn cách chấm](PROPOSED_REPORT_GRADING.md).
> **Phiếu chấm giảng viên — 07/11/2026:** Thêm 7 tiêu chí tổng 100 điểm, căn cứ và nhận xét do giảng viên nhập; lưu chi tiết vào nhận xét theo API hiện có. Gợi ý phân tích dùng lời dễ hiểu, không biến điểm tương đồng thành điểm chấm. Lint/build và 5 unit tests PASS; chưa ghi điểm/test lưu bằng trình duyệt. [Hướng dẫn, phạm vi và giới hạn](TEACHER_REPORT_GRADING.md).
> **Classifier tổng hợp đã tích hợp local — 07/11/2026:** TF-IDF + Logistic Regression fit trên 600/1.000 báo cáo synthetic; AI 8003 bật opt-in và kiểm SHA-256. API trả EXPERIMENTAL_SYNTHETIC, confidence null, không sửa điểm/dữ liệu. BERT vẫn dùng để đối chiếu ngữ nghĩa, không được fine-tune. 26 test Python, lint/build PASS; 4 lần phân tích qua Backend HTTP 200. Chất lượng trên dữ liệu thật chưa nghiệm thu; browser NOT TESTED. [Chi tiết và giới hạn đã quan sát](SYNTHETIC_CLASSIFIER_INTEGRATION.md).
> **Báo cáo đầy đủ — 07/11/2026:** Đã bổ sung 48 báo cáo tổng hợp (10 mục/bài, 3.358–3.630 ký tự), giữ nguyên điểm/nhận xét/trạng thái. Giảng viên 1 và 12 thấy đủ bốn bài; TF-IDF/SBERT thực tế HTTP 200 trên báo cáo đang nộp và đã duyệt. Một bài SBERT bị giới hạn 13/1.021 token; classifier NOT_TRAINED. [Cách thử và giới hạn](FULL_REPORT_EXAMPLES_20261107.md). Browser NOT TESTED.
> **Bổ sung dữ liệu theo công đoạn — 07/11/2026:** Giữ nguyên database hiện tại, thêm 72 sinh viên (6 nhóm × 12 doanh nghiệp), 2 kỳ theo năm học (đang thực tập/đã đóng), 72 task, 48 nhật ký, 60 phiên giờ và 48 báo cáo tổng hợp. Không coi giờ/điểm mẫu là hoạt động người thật. Lint/build và 3 unit/route tests PASS; API đọc dữ liệu theo 5 tình huống đăng nhập PASS, truy cập chéo sinh viên 404; phân tích báo cáo TF-IDF HTTP 200, classifier NOT_TRAINED. Browser E2E NOT TESTED, IPFS/blockchain BLOCKED. [Tài khoản, từng bước thử và bằng chứng](LIFECYCLE_EXAMPLES_20261107.md).
> **Runtime 07/11/2026:** http://localhost:5188/ ? MongoDB `internova_demo_cunhan_kysu_20261107` (27018 replica set). [Current demo data and login guide](COMBINED_DEMO_20261107.md). Older runtime/login instructions below are historical.

> **2026-11-06 ? company work period selection:** Company Work & Diary now selects the period first, then its official student placement. Task/diary tables and both assignment forms use that period; switching periods clears stale selection. See [behavior and current tests](COMPANY_WORK_PERIOD_FILTER.md).

> **2026-11-06 ? catalog for new periods:** Creating a period now automatically publishes open company topic templates with independent period quotas. The two existing empty periods were repaired with 41 opportunities each. See [rules and current verification](NEW_BATCH_TOPIC_CATALOG_RESULT.md). GET requests never populate data, and synchronization never reopens or overwrites an existing opportunity.

> **2026-11-06 ? first company acceptance:** The owner explicitly chose immediate acceptance by the first company, with automatic withdrawal of the student's other open applications and notifications to their companies. This supersedes the earlier offer/student-confirmation rule (D03). See [implementation, current bachelor-001 result and tests](FIRST_COMPANY_ACCEPTANCE_RESULT.md).

> **2026-11-06 ? direct applications:** The owner clarified that students apply directly to the selected company. This supersedes the earlier school-dispatch gate (D01). Admin intervention is the fallback from seven days before the period starts when no placement has been secured. See [updated policy, data fix and verification](DIRECT_APPLICATION_ROUTING_FIX.md).

> **Workflow Phase B ? 2026-11-06:** School-managed workflow is running in isolated TEST at `http://localhost:5188` (Mongo replica set `27018`, Hardhat `18546`). New evidence: 9/9 real HTTP/DB/NLP/SBT tests and 5/5 browser scenarios; frontend lint/build pass. See [current implementation and test report](WORKFLOW_PHASE_B_RESULT.md). The original database is unchanged. ERC20 support payments remain unimplemented pending the explicit pinned dependency approval in D06; source migration and full Phase B acceptance are not complete. Historical results below do not prove the new workflow or payments. Credentials are local ignored files only.

# Kiểm thử Internova — một website, email trước, ví sau

Cập nhật 02/11/2026. Chỉ mở **http://localhost:5182/**. Backend57407, database TEST `web3_internship_test_phase1_d8c3534f_0f4877b64b94`. Không chuyển sang5177/5178 hoặc sao chép tài khoản giữa database.

## 1. Chuẩn bị

Nhấn Ctrl+F5 và đăng nhập lại một lần sau nâng cấp Backend. Email, mật khẩu, User ID và hồ sơ cũ được giữ nguyên. Dùng mật khẩu riêng của Internova, không mật khẩu Gmail.

Mongo27017, Backend57407, Frontend5182, NLP8003 và Hardhat18545 cần đang chạy. Mở http://localhost:57407/api/health: HTTP200, Mongo connected. Đây chỉ là readiness. Nếu sau reboot service chưa chạy, dừng ở bước môi trường; không tự seed/reset chain/migration. Hướng dẫn này không tự khởi động mọi service sau reboot.

Chỉ nhập dữ liệu TEST, mã lượt ví dụ `TEST_20261102_01`, CV không có thông tin cá nhân thật. Không ví có tài sản, private key thật. F12 → Network → Preserve log để quan sát method/status; không chụp password/JWT/cookie/QR còn hiệu lực. Không xóa dữ liệu để thử lại.

## 2. Đăng ký, đăng nhập, hồ sơ — chưa cần ví

1. Đăng xuất nếu có phiên. Mở `/register` trên cùng website. Khách chưa đăng nhập không thấy menu nghiệp vụ.
2. Nhập họ tên TEST, email mới, mật khẩu và xác nhận. Đăng ký công khai chỉ Sinh viên; không tự cấp Admin/Giảng viên.
3. Bấm **Tạo tài khoản sinh viên**: vào Dashboard sinh viên, không yêu cầu MetaMask/chọn role để đăng nhập.
4. Đăng xuất → `/login` → email/password vừa tạo: cùng tài khoản, Dashboard đúng role. Sai password phải bị từ chối.
5. Hồ sơ cá nhân → sửa tên/kỹ năng/giới thiệu → **Lưu hồ sơ**. Mở lại và reload để kiểm persistence. Các menu nghiệp vụ không bị khóa vì thiếu ví.
6. Thử email trùng, xác nhận password khác, thiếu thông tin: lỗi rõ, không tạo success giả. Đổi mật khẩu TEST: phiên cũ hết hiệu lực, đăng nhập lại bằng mật khẩu mới.
7. Google live **BLOCKED thiếu Client ID**; không giả đăng nhập. Khi cấu hình thật dùng cùng Client ID Backend/Frontend và authorized origin `http://localhost:5182`. Không có cơ chế reset mật khẩu an toàn thì chưa nghiệm thu quên mật khẩu.

## 3. Bốn vai trò trên cùng website

Company=`company`, giảng viên=`mentor`, nhà trường=`admin`. Quyền do Backend kiểm. Không sửa localStorage/database để tự nâng quyền. Staff TEST có mật khẩu Windows DPAPI bảo vệ, không ghi trong tài liệu.

Mở **CMD**, chạy từng dòng riêng (không dán cú pháp PowerShell vào CMD):

```bat
cd /d D:\Web3-Internship-Management
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-address=127.0.0.1 --remote-debugging-port=9231 --user-data-dir="D:\Web3-Internship-Management\contracts\node_modules\.cache\unified-20261102\manual-profile" http://localhost:5182/
node scripts/demo/unified-session.cjs contracts/node_modules/.cache/unified-20261102/runtime.json admin
```

Giữ cửa sổ Edge TEST. Khi đổi role, chạy một dòng tương ứng rồi dùng tab mới nhất:

```bat
node scripts/demo/unified-session.cjs contracts/node_modules/.cache/unified-20261102/runtime.json company
node scripts/demo/unified-session.cjs contracts/node_modules/.cache/unified-20261102/runtime.json mentor
node scripts/demo/unified-session.cjs contracts/node_modules/.cache/unified-20261102/runtime.json admin
```

Helper dùng email/bcrypt login thật, kiểm runtime PID/port, không bypass JWT. Chỉ là tiện ích QA cho staff; sinh viên dùng form bình thường. Tab cùng browser profile chia sẻ phiên; không gửi request từ tab role cũ. Nếu9231 bị chiếm hoặc metadata cũ, dừng và báo lỗi, không đóng browser cá nhân tùy tiện. Admin có form cấp tài khoản email TEST company/mentor/student; không đăng ký công khai đặc quyền.

## 4. CV → JD → AI → ứng tuyển

| Vai trò | Thao tác | Kỳ vọng |
| --- | --- | --- |
| Student | CV: React, JavaScript, Node.js, MongoDB; lưu; thử PDF/DOCX hợp lệ | Không ví, reload/login lại còn dữ liệu; file sai bị từ chối |
| Company | Tạo/đăng JD TEST React Node Internship, mô tả/kỹ năng và hạn tương lai | Có JD thật; company khác không sửa được |
| Student | AI: chọn `sbert`, bấm Phân tích matching | Engine/model thật trả ranking, không hứa điểm cố định; TF-IDF là baseline |
| Student | JD: bấm **Ứng tuyển trong hàng bảng**, nhập lời nhắn, nộp | Application cùng User ID; ứng tuyển trùng bị chặn |
| Company | Xem ứng viên JD của mình, xét duyệt | Sinh viên xem đúng trạng thái/thông báo |

AI thiếu CV/service phải báo chưa sẵn sàng, không điểm giả. Đăng xuất/đăng nhập giữa các bước để kiểm persistence; mọi bước trên không cần ví.

## 5. Kỳ thực tập, task và nhật ký

1. Admin tạo kỳ mã TEST riêng, trạng thái mở, ngày bao gồm hôm nay.
2. Company tạo đề tài/rubric ở Phân công: nội dung TEST, KPI tổng trọng số100%, deadline phù hợp.
3. Company/Admin phân công: kỳ, đề tài, sinh viên được nhận ứng tuyển, giảng viên, ngày bắt đầu/kết thúc. Company chỉ thấy sinh viên trong phạm vi; Admin điều phối.
4. Company tạo/giao task, deadline/ưu tiên. Sinh viên cập nhật tiến độ, ghi nhật ký/báo cáo công việc.
5. Mentor xem sinh viên phụ trách, nhận xét theo quyền. Người ngoài phân công bị từ chối. Dashboard mỗi role phản ánh dữ liệu thật; không dữ liệu thì empty state.

## 6. Chấm công và QR/GPS — vẫn không cần ví

1. Sinh viên chọn phân công, chủ động Check-in. Refresh/chuyển tab không tự ghi. Check-in trùng bị chặn.
2. Đợi khoảng thời gian thật rồi Check-out; thiếu phiên mở phải bị từ chối. Lịch sử và tổng giờ phải khớp.
3. Company duyệt/điều chỉnh đúng phạm vi với lý do và audit log. Giờ TEST được hiệu chỉnh không là chứng minh lao động thật.
4. Company tạo QR với vị trí/phạm vi/TTL. Sinh viên chủ động mở scanner, cấp camera/vị trí, quét khi còn hạn.
5. QR sai/hết hạn/replay bị chặn. Từ chối camera/GPS báo lỗi; thiếu thiết bị/sai số lớn ghi BLOCKED. Không sửa GPS để gian lận. GPS client không chống gian lận tuyệt đối; fixture tự động không thay kiểm thiết bị thật.

## 7. Báo cáo và đánh giá

Sinh viên nộp báo cáo TEST cho đúng phân công. Company/Mentor đọc, nhận xét/chấm điểm/duyệt theo quyền; sinh viên xem kết quả, reload vẫn còn. Người ngoài bị từ chối.

Rủi ro: phân biệt quy tắc task/giờ/tiến độ với NLP. Classifier hiện **NOT_TRAINED**, chưa có nhãn độc lập; không báo confidence hay metrics nghiệm thu giả. IPFS live **BLOCKED** thiếu credentials/key/flag; không công khai báo cáo cá nhân. Test adapter không thay cho Pinata live.

## 8. Liên kết ví sau, giữ cùng tài khoản

1. Ghi lại CV/Application/phân công. Hồ sơ → **Ví Web3 của tôi**: Chưa liên kết ví.
2. Dùng MetaMask TEST không tài sản. Trong mục liên kết, xác thực lại bằng mật khẩu Internova, kết nối và ký challenge; không nhập private key, không cần giao dịch để liên kết.
3. Hủy ký không đổi tài khoản. Thành công hiện địa chỉ/verified; cùng URL/User ID, không logout, không nhân đôi dữ liệu. Kiểm network chủ động trong chi tiết.
4. Ví thuộc User khác/nonce hết hạn/replay bị từ chối. Unlink cần chữ ký mới, còn phương thức đăng nhập khác và không có ràng buộc blockchain/phiên mở/legacy chưa map.

Automation dùng chữ ký EIP191 thật từ ví TEST qua EIP1193/CDP; **popup extension MetaMask thật NOT TESTED**, cần bạn nghiệm thu thủ công.

## 9. Blockchain và SBT

Chỉ Hardhat local chain31337, RPC18545; không mainnet/reset/deploy lại chain. Thiếu ví chỉ chặn hành động Web3 cần ví, không chặn nghiệp vụ/QR.

Dùng nút ghi bằng chứng đúng role khi báo cáo/giờ/phân công đủ điều kiện; Backend dùng service wallet local riêng theo quyền. Theo dõi pending/confirmed/failed và receipt thật. Thiếu CID/IPFS/duyệt báo BLOCKED theo response, không điền hash giả.

Admin hoàn tất/mint khi đủ điều kiện giờ/đánh giá/commitments và recipient wallet verified. Không nới điều kiện demo. Thời gian thật chưa đủ thì chờ hoặc điều chỉnh TEST có audit đúng quy trình. Sinh viên bấm **Xác minh chứng nhận on-chain**: VERIFIED chỉ khi contract/token/recipient được RPC xác nhận; token không tồn tại/RPC lỗi không VERIFIED. Mint trùng bị chặn, SBT không chuyển nhượng.

## 10. Giao diện, bảo mật và phiếu nghiệm thu

Kiểm desktop1440/tablet768/mobile375, Light/Dark, sidebar/bảng/form, tab/focus/labels. Logout mất quyền, role client không nâng quyền Backend. Chuyển trang không tự POST/PATCH/DELETE nghiệp vụ. Dừng khi lỗi500/ghi ngoài ý muốn; giữ log, không xóa DB để chữa.

| Mục | Role | Thao tác/thời điểm | Kỳ vọng | Thực tế/HTTP | PASS/FAIL/BLOCKED/NOT TESTED | Ảnh/lỗi |
| --- | --- | --- | --- | --- | --- | --- |
| Email → Dashboard | student | | không ví | | | |
| CV/JD/AI/ứng tuyển | student/company | | cùng User ID | | | |
| Kỳ/task/log/giờ | bốn role | | đúng quyền | | | |
| QR/GPS | student/company | | TTL/replay/thiết bị | | | |
| Báo cáo/đánh giá | student/mentor/company | | đúng phạm vi | | | |
| Link ví/chain/SBT | student/admin | | giữ dữ liệu, receipt thật | | | |
| Google/Pinata live | | | cấu hình thật | | BLOCKED hiện tại | |

[Báo cáo](UNIFIED_IDENTITY_RESULT.md), [bằng chứng](evidence/unified-20261102/INDEX.md). Test tự động dùng DB TEST riêng; dữ liệu đó không tự hiện trong tài khoản của bạn. Tạo tuần tự bằng các role trên; không có seed ngầm để điền dashboard.

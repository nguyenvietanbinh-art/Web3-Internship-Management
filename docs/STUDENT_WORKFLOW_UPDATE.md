# Cập nhật luồng sinh viên — 07/11/2026

## Điều chỉnh tiếp: báo cáo thuộc Báo cáo kết quả

Khối lưu IPFS, tệp đính kèm và ghi bằng chứng báo cáo đã chuyển khỏi Điểm danh/chứng nhận. Mở **Báo cáo kết quả → Xem bài báo cáo** để thao tác với đúng bài cuối kỳ đang xem; không cần chọn lại báo cáo ở trang khác. Nút **Nộp báo cáo kết quả** vẫn nằm trên đầu trang này; lưu IPFS không thay thế nộp bài. Báo cáo tuần vẫn ở Công việc được giao.

Component mới `business/reports/ReportEvidence.jsx` tái sử dụng endpoint và guard cũ; `Reports.jsx` hiển thị theo bài đang mở, `CoreBusinessView.jsx` truyền đúng chế độ xác thực; `Web3Page.jsx` bỏ khối cùng các request đọc báo cáo không còn dùng. Không sửa Backend/schema/database. Sinh viên giữ quyền upload bài mình; các vai trò khác không có công cụ upload. Ghi blockchain chỉ cho bài cuối kỳ hiện hành đã duyệt và điều kiện ví cũ. Không tự upload/gửi giao dịch khi mở bài.

`client/test/report-evidence-location-browser.cjs`:8/8 PASS qua4 vai trò,0 runtime exception; kiểm không còn công cụ báo cáo tại Điểm danh, công cụ xuất hiện trong bài cuối kỳ, quyền upload/nút bị khóa và không auto-write. Lint0 error/warning và build PASS. Lần gọi npm ban đầu ở root báo thiếu package.json; đã chạy lại đúng client thành công, không cài gì. IPFS live vẫn BLOCKED do cấu hình, không upload hoặc thực hiện giao dịch để thử thay đổi vị trí UI. Bằng chứng local: `contracts/node_modules/.cache/student-workflow-20261107/report-location-1794020181904`.

## Kết quả và phạm vi

Đã triển khai và kiểm thử các thay đổi bên dưới trên website TEST http://localhost:5189, API http://localhost:57419/api, database `internova_role_qa_20261107`. Website dữ liệu hiện có http://localhost:5188 dùng cùng source cập nhật, API57418, database `internova_demo_cunhan_kysu_20261107`. Hai môi trường dùng cùng MongoDB replica set27018 nhưng **khác database và tài khoản**.

Không cài/nâng dependency, tạo `.env`, migration, seed reset, xóa dữ liệu, dùng ví thật hoặc deploy contract. Không commit/push/merge/reset/clean Git. Không tuyên bố toàn bộ hệ thống đạt production hoặc mô hình đã có độ chính xác thực tế.

## Menu và giao diện sinh viên

| Trước | Sau |
|---|---|
| Tổng quan + Tổng quan tài khoản | Một **Tổng quan**, gồm hồ sơ, kỳ được cấp, nơi tiếp nhận, giảng viên, công việc, báo cáo cuối kỳ và giờ đã duyệt |
| Công việc & nhật ký | **Công việc được giao**; các tab Công việc / Báo cáo tuần |
| Báo cáo & kết quả có cả tuần và cuối kỳ | **Báo cáo kết quả**, chỉ bài cuối kỳ của sinh viên |
| AssignmentPicker thiếu role trong trang công việc | **Thông tin thực tập của tôi**, chỉ dữ liệu được cấp quyền |

Chỉ bỏ câu môi trường TEST ở Tổng quan sinh viên; nguồn gốc tổng hợp vẫn ghi tại bộ CV, manifest, fixture và tài liệu. Không đổi quyền Admin/giảng viên/doanh nghiệp, không biến quan hệ phân công backend thành dữ liệu công khai. Trang Tổng quan tài khoản của ba vai trò còn lại giữ nguyên. Lưu hồ sơ sinh viên chuyển về Tổng quan.

Tổng quan có loading/error riêng, không kết luận “chưa có kỳ” khi API đang tải hoặc lỗi. Các thống kê lấy từ API theo quyền, không hardcode KPI.

## Chấm công: nguyên nhân và cách xử lý

Nút Vào ca trước đây chỉ bị khóa theo điều kiện mà chưa giải thích đủ. Phân công phải thực sự `active`, nằm trong ngày bắt đầu/kết thúc và chưa có phiên mở/trùng ngày UTC. Được cấp kỳ hoặc được doanh nghiệp nhận chưa đồng nghĩa đã bắt đầu thực tập chính thức.

Đọc dữ liệu hiện có ghi nhận 13 phân công active,8 approved,12 completed,1 proposed,1 cancelled. Vì vậy không thể mở ca cho mọi tài khoản bằng cách bỏ kiểm tra. Chưa kết luận riêng tài khoản Trung khi chưa xác định đúng user/phân công và phiên giờ của tài khoản đó.

Đã bổ sung lý do rõ cho: chưa chọn/chưa có phân công, chưa bắt đầu, đã hoàn thành, ngày sai/ngoài khoảng, phiên chưa kết thúc và đã có phiên trong ngày UTC; lỗi tải lịch sử được hiển thị. Backend tiếp tục kiểm tra quyền và chống trùng, kể cả gọi API trực tiếp. Danh sách kiểm tra nhanh lấy100 phiên gần nhất; backend vẫn là nơi quyết định cuối cùng.

**Bằng chứng chạy thật trong TEST:** sinh viên không có ví vào ca; chờ63,144 giây thực tế; ra ca pending; tổng được duyệt vẫn0; doanh nghiệp duyệt đúng1 phút thì tổng tăng1. Đây là thời gian kiểm thử phần mềm, không phải bằng chứng lao động của người thật. Không chỉnh đồng hồ, sửa timestamp hoặc cộng giờ mẫu để test PASS. Check-in trùng trả409; doanh nghiệp ngoài phạm vi xử lý phiên trả404.

QR/GPS và wallet attendance không bị bỏ hoặc sửa guard. Kiểm thử QR/GPS ở mức API hồi quy đạt; camera, vị trí trên thiết bị thật và thao tác MetaMask chưa được kiểm thử lại trong đợt này.

## CV và gợi ý đề tài

Tạo8 bộ CV với kỹ năng ít/nhiều, mục tiêu, học vấn/GPA, bài tập cá nhân, cách phối hợp, trách nhiệm, khó khăn và lịch tham gia. Mỗi bộ có PDF thật, DOCX thật, Markdown và HTML. Xem [danh sách và cách upload](sample-cvs/README.md).

Integration đã upload16 PDF/DOCX qua API thật, kiểm SHA-256, tên tiếng Việt và nội dung kỹ năng. Parser PDF `pypdf-6.21.4`, DOCX `docx-stdlib-v1`; nội dung đọc được khoảng1.900–1.965 ký tự. Browser còn chọn trực tiếp `05-data.pdf` từ máy, tải lên và mở văn bản trích xuất.

Launcher trước chưa truyền đường dẫn pypdf đã cài cô lập. Hai launcher nay dùng thư mục module có sẵn nếu tồn tại và chưa có cấu hình riêng; không cài thêm, không đổi môi trường Python toàn máy. Thiếu module vẫn phải báo lỗi, không giả thành công.

Form CV hướng dẫn nhập mục tiêu, công việc đã làm và nguyện vọng vào trường nội dung hiện có. Form doanh nghiệp hướng dẫn mô tả nhiệm vụ, yêu cầu bắt buộc/ưu tiên, phối hợp nhóm, trách nhiệm, thời gian và đầu ra. TEST có8 cơ hội với các nội dung này; không sửa đề tài/CV người dùng trong database hiện có.

API matching đã đọc summary/experience/extractedText và mô tả yêu cầu. Đã kiểm TF-IDF và Sentence-BERT thật trên8 ứng viên/cơ hội; UI BERT trả gợi ý thật cho sinh viên chưa có đề tài. Kỹ năng khai báo được đối chiếu riêng với yêu cầu, không coi từ “siêng năng” là bằng chứng phẩm chất hoặc biến cosine thành xác suất đạt. Không thêm trọng số, model hoặc phần trăm tin cậy tự đặt. Nội dung dài vẫn chịu giới hạn token hiện có; kết quả có thể không bao phủ toàn CV.

Upload giữ các trường CV đã nhập; sinh viên cần kiểm kỹ năng có cấu trúc. Không tự khẳng định kỹ năng được xác minh chỉ từ từ khóa trong tệp. CV snapshot đã nộp ứng tuyển được kiểm hash trước/sau upload: không đổi. GPA không tự trở thành điểm xếp hạng.

## Báo cáo tuần và cuối kỳ

**Tuần:** Công việc được giao → chọn thông tin thực tập → Báo cáo tuần → Nộp báo cáo tuần. Form gồm công việc đã làm, kết quả, khó khăn, hỗ trợ cần từ doanh nghiệp và kế hoạch tiếp theo. Dùng API/collection báo cáo hiện có với `kind=weekly`, tự nhận đúng doanh nghiệp trong phân công. Không tạo bảng hoặc hệ thống nộp mới. Nhật ký cũ giữ nguyên và vẫn đọc/phản hồi theo quyền; sinh viên không có thêm nút tự tạo nhật ký song song với báo cáo tuần.

**Cuối kỳ:** Báo cáo kết quả → chọn thông tin thực tập → Nộp báo cáo kết quả. Chỉ query `kind=final`, không có chọn loại hoặc công cụ chấm/duyệt cho sinh viên. Sau nộp xem lại bài, trạng thái, phiên bản và phản hồi. Nút nộp khóa khi đã có bài, trừ khi bản hiện hành `need_revision`. Backend trả409 `FINAL_RESUBMISSION_NOT_REQUESTED` khi client cũ gọi nộp thêm không đúng điều kiện. Bản cũ và bài đã chốt giữ nguyên.

Đây là thay đổi hành vi có chủ đích trong school workflow; đã lập [phương án tương thích](STUDENT_WORKFLOW_COMPATIBILITY_PLAN.md). Không đổi collection/schema/đường dẫn API hoặc hành vi legacy khi school workflow tắt. Gửi nhà trường vẫn qua đánh giá doanh nghiệp/giảng viên và điều kiện chốt hiện có, không bỏ bước duyệt.

Đã kiểm hai phiên bản tuần, vòng cuối kỳ → yêu cầu bổ sung → phiên bản2, bảo toàn nội dung bản trước. Company/mentor/Admin đọc đúng phạm vi; sinh viên khác/doanh nghiệp khác nhận404; sinh viên tự approve nhận403. KPI sinh viên chuyển sang Công việc được giao, không trộn vào trang chỉ nộp kết quả.

## Kiểm thử và bằng chứng

| Nhóm | Kết quả thực tế |
|---|---|
| `student-workflow.integration.test.js` | PASS5/5:16 upload thật, TF-IDF/SBERT, weekly/final và quyền, manual attendance, fixture TEST |
| `workflow.integration.test.js`, `ROLE_WORKFLOW_QA=true` | PASS13; SKIP1 SBT, không chạy lại contract trong nhóm thay đổi này |
| Core work/time/reports, edge cases, security-regression, QR/GPS | PASS33/33, database TEST ngẫu nhiên có guard |
| Time eligibility, rubric, report tasks unit | PASS10/10 |
| `student-workflow-browser.cjs` | PASS11/11, gồm4 vai trò,1 phút thực tế, chọn tệp, weekly/final, BERT và mobile dark;0 exception |
| `student-navigation-browser.cjs` | PASS5/5: overview tải xong, Back/Forward/tab/lựa chọn, cảnh báo chưa lưu và không ghi draft vào storage, không auto-write, logout/đổi tài khoản |
| `opportunity-search-browser.cjs` | PASS3/3: gõ từng ký tự, không mất focus, xóa lọc và không ghi dữ liệu |
| Frontend lint/build | PASS, lint0 error/0 warning; npm chỉ thông báo có bản mới, không nâng cấp |
| Git diff whitespace | PASS |
| Hash dữ liệu và indexes4 database gốc/demo | PASS, trước/sau trùng nhau |
| Camera/GPS thiết bị thật, MetaMask thiết bị người dùng | NOT TESTED trong đợt này |
| IPFS cloud readback / public blockchain | BLOCKED/ngoài phạm vi; không có credentials hoặc quyền deploy mới |
| Chất lượng AI trên dữ liệu người thật / độ tin cậy hiệu chuẩn | NOT TESTED; không có nhãn chuyên gia độc lập |

Các test đã sửa một lỗi biến trong harness logout (`fixture` chưa nội suy vào expression trình duyệt); bản chạy sau PASS. Không sửa sản phẩm để bỏ assertion. Đây là kết quả nghiệm thu phạm vi sinh viên, không phải tuyên bố mọi chức năng toàn hệ thống PASS.

Bằng chứng có thể mở trong [evidence/student-workflow-20261107](evidence/student-workflow-20261107/README.md). Log/cache đầy đủ ở `contracts/node_modules/.cache/student-workflow-20261107`; cache chứa tài khoản riêng, không đưa lên Git.

## Dữ liệu và bảo toàn

Mọi ghi nghiệp vụ kiểm thử ở `internova_role_qa_20261107` hoặc database TEST do guard sinh trên27017. Trước kết nối xác minh URI exact allowlist, tên replica set `internovaTestRs`, marker `qa_safety_marker/role-workflow`; tắt autoIndex/autoCreate trong integration workflow. Không thay schema/index database gốc.

Integration mới đã chạy4 lần với cohort ID riêng: tổng4 kỳ,32 lượt ghi danh,32 sinh viên và16 tài khoản nhà trường/doanh nghiệp/giảng viên/ngoài phạm vi. Mỗi cohort có8 CV,8 đề tài,8 cơ hội có mô tả phong phú; các lần trước được giữ nguyên. Upload16 tệp/lần cập nhật CV chỉ của cohort mới; báo cáo/ứng tuyển/phân công/phiên giờ và lịch sử phát sinh qua API thật. Hồi quy workflow còn bổ sung cohort riêng; xem log test tương ứng. Các tập này là dữ liệu tổng hợp, không phải người dùng thật.

Collections TEST chịu tác động gồm `users`, profile sinh viên/doanh nghiệp/giảng viên, CV, `topics`, `internship_batches`, `batch_enrollments`, `topic_opportunities`, `school_applications`, `assignments`, `business_reports`, `work_sessions` và lịch sử/notification theo cơ chế hiện có. Không tác động điểm đã chốt, bài nộp hoặc mật khẩu cũ để tạo fixture. Quy trình tiếp nhận tự kết thúc hồ sơ khác theo rule hiện có, nhưng chỉ trong cohort mới.

Snapshot BSON SHA-256 và indexes trước/sau xác minh không đổi:

| Database bảo toàn | Cổng | Số document |
|---|---|---:|
| `web3_internship` |27017|3|
| `web3_internship_demo_20261030_2340` |27017|223|
| `web3_internship_demo_20261030_2340_foundation` |27017|66|
| `internova_demo_cunhan_kysu_20261107` |27018|1712|

Không xóa fixture khi kết thúc. Phục hồi chức năng: điều chỉnh source theo Git diff có chọn lọc sau review; không reset/clean worktree và không xóa dữ liệu TEST/gốc. Bài nộp cũ, CV snapshot và lịch sử không cần chuyển đổi để dùng giao diện mới. File login gốc/demo không đổi. File trỏ tài khoản TEST của nhóm này cập nhật khi tạo cohort bàn giao; bản đã chạy browser được sao lưu cùng metadata trong `browser-tested-cohort` trước khi cập nhật, không mất tài khoản nào.

## File triển khai trong nhóm này

- `client/src/App.jsx`, `components/AppShell.jsx`: menu và điều hướng hồ sơ sinh viên.
- `business/workflow/Dashboard.jsx`, **StudentOverview.jsx mới**: gộp tổng quan, dữ liệu thật và loading/error.
- `business/Work.jsx`, `Reports.jsx`, `reports/ReportForm.jsx`: báo cáo tuần/final, nhập nội dung và trạng thái nộp.
- `business/Time.jsx`, **timeEligibility.mjs mới**: khóa chấm công có lý do.
- `business/cv/CvForm.jsx`, `business/MatchingDetails.jsx`, `business/placements/Topics.jsx`: nội dung CV/yêu cầu và giải thích kỹ năng.
- `server/src/core/reports.js`: kiểm điều kiện nộp lại cuối kỳ trong workflow.
- `server/scripts/start-workflow.cjs`, `start-role-qa.cjs`: dùng parser đã cài cô lập khi hiện diện.
- Tests mới: `student-workflow.integration.test.js`, `student-time-eligibility.test.mjs`, `student-workflow-browser.cjs`, `student-navigation-browser.cjs`.
- `scripts/demo/generate-sample-cvs.py`, `print-sample-cvs.cjs`; bộ file `docs/sample-cvs/`; báo cáo này, compatibility plan, evidence và4 tài liệu tiến độ/nghiệm thu/hướng dẫn.

Nhiều file ở trên đã có chỉnh sửa từ nhiệm vụ trước; giữ và mở rộng từng phần, không quy toàn bộ Git diff thành thay đổi mới. Branch `branch_1`, HEAD `8aa463b`; worktree còn nhiều modified/untracked từ các đợt trước. `git diff --check` không lỗi. Không staging/commit/push.

## Bạn tự kiểm tra theo thứ tự

1. Mở **http://localhost:5189**. Dùng file local `contracts/node_modules/.cache/student-workflow-20261107/manual-login-student-workflow.txt`; không đưa mật khẩu vào ảnh hoặc Git. `freshStudent` bàn giao mới đang active,0 báo cáo,0 phiên giờ; `unplaced` chưa có đề tài để thử gợi ý. Cohort đã chạy browser giữ nguyên; file tài khoản cũ lưu trong cache `browser-tested-cohort`. Không dùng tài khoản của5188 để đăng nhập5189.
2. Sinh viên → Tổng quan: chỉ1 trang, có tài khoản và thông tin thực tập. Hồ sơ → lưu → quay về Tổng quan.
3. CV của tôi → upload một PDF/DOCX tại `docs/sample-cvs` → xem văn bản đã đọc → kiểm kỹ năng khai báo. Với `unplaced`, thử Gợi ý đề tài phù hợp cả TF-IDF/Sentence-BERT, không sửa CV chỉ để tăng điểm.
4. Công việc được giao → chọn thực tập → Công việc để xem deadline/kết quả; Báo cáo tuần để đọc/nộp5 mục cho doanh nghiệp. Chuyển trang rồi quay lại kiểm lựa chọn.
5. Báo cáo kết quả → chỉ bài cuối kỳ. `freshStudent` bàn giao chưa nộp nên có thể nộp bài đầu tiên ngay, rồi **Xem bài báo cáo**. Sau nộp nút khóa đúng; để nộp lại, giảng viên dùng quy trình nhận xét **Yêu cầu bổ sung** rồi sinh viên nộp phiên bản mới.
6. Chấm công → chọn đúng thực tập. `freshStudent` bàn giao chưa có phiên: Vào ca → chờ ít nhất1 phút → Kết thúc ca → doanh nghiệp duyệt → kiểm tổng giờ. Sau ca này khóa trùng ngày UTC là đúng; không sửa đồng hồ/timestamp hoặc xóa phiên để vào lại. Sinh viên `student` trong file đã có phiên integration hôm nay, có thể dùng để xem xử lý tiếp.
7. Doanh nghiệp → xem báo cáo/phiên đúng sinh viên của mình → phản hồi/duyệt. Giảng viên → báo cáo mình hướng dẫn. Admin → xem thông tin đủ giảng viên/đề tài/công ty và chốt theo điều kiện cũ. Không nới quyền khi tài khoản không có dữ liệu.
8. Logout, đổi tài khoản và thử desktop/mobile/light-dark. API lỗi phải hiện lỗi, không giả dữ liệu. Muốn thử camera/GPS/ví cần thực hiện thêm ca phần cứng riêng với ví Hardhat local, không nhập ví thật.

Khởi động lại dịch vụ khi cần: theo [RUN_FULL_WORKFLOW.md](RUN_FULL_WORKFLOW.md), kiểm cổng trước; AI8003, Mongo27018, backend57419 và Vite5189. Các tiến trình hiện đã giữ chạy. Không chạy lại generator/test chỉ để xem bài vì test tạo cohort mới và file trỏ tài khoản TEST mới.

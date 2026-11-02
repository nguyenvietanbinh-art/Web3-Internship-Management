# Full project audit — Internova

Ngày02/11/2026 (+07). Baseline Git `8f4e5ac`, branch_1; không commit/push/merge trong đợt này. Môi trường gốc/demo giữ nguyên. Đây là kiểm định source + TEST local, không là chứng nhận production hoặc penetration test đầy đủ.

## Phạm vi và bằng chứng

Quét static293 tệp baseline,137 route declarations,849 import references,13 Python files syntax PASS; xem [inventory](evidence/production-20261102/source-inventory.json). Bao gồm client/server/AI/contracts/database/scripts và tài liệu tracked, không quét node_modules/model binaries như source. Inventory/import search không đồng nghĩa mọi nhánh đã runtime-test. Git untracked audit-reports giữ nguyên; không xóa code/thư mục.

Các nhóm thực tế: email/Google/wallet identity, core recruitment/placements/tasks/log/time/report/KPI, AI ranking/risk, encrypted IPFS, QR/GPS, Hardhat evidence/SBT, role-scoped dashboard; client điều hướng state + History /login,/register. API legacy bị410 khi unified bật, lookup certificate công khai vẫn giữ; không API hợp nhất giả.

## Findings

**23 phát hiện:7 đã sửa,16 còn lại/chờ cấu hình/đánh giá.** Severity:9High,10Medium,4Low, không phát hiện Critical được chứng minh trong phạm vi này. Không có nghĩa hệ thống không thể có lỗi Critical. Advisory counts là nhóm dependency riêng, không cộng thành48 lỗi chức năng.

| ID | Mức | Trạng thái | Phát hiện | File/vị trí | Cách sửa/giới hạn |
| --- | --- | --- | --- | --- | --- |
| P01 | High | FIXED | 401 cũ xóa token mới | client/src/api/client.js:32; client/src/api/session.js:7 | So token snapshot trước invalidate; giữ phiên mới. Unit mô phỏng response trễ. |
| P02 | Medium | FIXED | Token hết hạn nhưng sidebar và user state còn | client/src/App.jsx:102 | Sự kiện expiry xóa UI riêng tư, về /login; E2E gọi API thật với token bị từ chối. |
| P03 | Medium | FIXED | Form không chờ callback async sau lưu | client/src/components/business/Shared.jsx:15; client/src/api/formAction.js:2 | Await cả mutation và onSaved, đưa lỗi vào vòng đời form; không gọi callback nếu mutation fail. |
| P04 | Medium | FIXED | Validation có thể phản chiếu giá trị riêng tư | server/src/middleware/errorHandler.js:10 | Trả message validation an toàn, giữ HTTP400/code VALIDATION; regression kiểm không echo giá trị. |
| P05 | Low | FIXED | Ghi chú nội bộ và debug trên UI | client/src/components/AppShell.jsx; EmailIdentity.jsx; GoogleIdentity.jsx; business/CoreOverview.jsx; business/Web3Page.jsx | 48 mục copy/diagnostic đổi có manifest; debug/raw response chỉ DEV; demo quick-login bị tắt trong build production. |
| P06 | Medium | FIXED | Selector phân công chỉ hiện ví, tài khoản email thành dấu gạch | client/src/components/business/Shared.jsx:37 | Dùng participantNames.student được API scoped trả về, fallback wallet legacy, không đổi ownership. |
| P07 | Low | FIXED | Phần cài đặt danh tính thiếu spacing/form select thống nhất | client/src/components/identity.css; GoogleIdentity.jsx; EmailIdentity.jsx | CSS scoped, input/select/theme và khoảng cách hồ sơ thống nhất; giữ labels/focus. |
| P08 | High | OPEN | Nộp phiên bản báo cáo chưa atomic | server/src/core/reports.js:12-13 | Source: supersede bản cũ rồi create bản mới. Nếu create fail, có thể thiếu current report. Chưa fault-injection lần này; cần transaction/unique-current design và rollback, đánh giá replica set trước. Không tự migration. |
| P09 | High | OPEN | Advisory dependency toolchain contracts | contracts/package-lock.json; evidence/production-20261102/contracts-npm-audit.json | Npm audit48 advisories:18High/16Moderate/14Low. Toolchain dev, không tự suy contract exploitable. Cần duyệt bản vá tương thích; không audit fix/major upgrade tự động. |
| P10 | High | NOT TESTED | Chưa có bằng chứng deployment production được bảo vệ | server/src/app.js:15-27; server/src/index.js; client/src/api/session.js | App có CORS allowlist, bearer và limiter memory/IP; chưa TLS/reverse-proxy/CSP/HSTS/shared rate-limit/secret rotation/backup restore/load test được nghiệm thu. JWT localStorage còn bề mặt XSS. Cần thiết kế vận hành, không đổi auth hàng loạt. |
| P11 | High | BLOCKED | Web3 chỉ hỗ trợ chain/DB TEST local | server/src/services/localWeb3.js:7-18; contracts/hardhat.local.cjs | Guard intentionally fail closed, không bỏ guard. Public/testnet/service signer cần phê duyệt riêng; không dùng receipt local làm production proof. |
| P12 | Medium | BLOCKED | Google live chưa có Client ID | server/src/services/googleIdentity.js; client/src/components/GoogleIdentity.jsx | Cấu hình Client ID/authorized origin và kiểm Google thật; hiện xác minh cấu trúc/code và UI unavailable, không fake OAuth. |
| P13 | High | BLOCKED | Pinata live/readback chưa cấu hình | server/src/services/privateIpfs.js; server/src/core/web3.js | Cần Pinata token, key32byte/key ID, enable flag; kiểm encrypted upload/readback thật. Test adapter không thay external integration. |
| P14 | High | BLOCKED | Chưa nghiệm thu chất lượng AI/risk classifier | ai-service/nlp/risk.py:19; ai-service/evaluation/README.md | SBERT inference thật có; risk NOT_TRAINED, thiếu nhãn độc lập. Cần dữ liệu consent, adjudication/split leakage, metrics P@K/R@K/MAP/NDCG; không tự gán nhãn để PASS. |
| P15 | Medium | OPEN | Ranking chỉ xét50 candidate theo ID | server/src/core/ai.js:14,20 | Giới hạn được trả catalog_limit/candidate_count. Chưa full-catalog retrieval; cần retrieval/pagination có benchmark, không hứa top-K toàn bộ catalog. |
| P16 | Medium | OPEN | 2 advisory Moderate ở server dev tooling | server/package-lock.json; evidence/production-20261102/server-npm-audit.json | minimatch/nodemon; cần duyệt patch tương thích, không dùng fixAvailable major tự động. Client audit0. |
| P17 | Medium | NOT TESTED | Chưa stress/query-plan trên dữ liệu quy mô lớn | server/src/core/dashboard.js:5; client/src/components/business/Shared.jsx:36 | Dashboard nạp các assignment IDs; picker tối đa100. Cần dataset TEST riêng, explain và load test trước tối ưu index. Không suy production latency từ5health requests. |
| P18 | Medium | OPEN | Email verify/reset password chưa hoàn thiện | server/src/routes/email.routes.js; client/src/components/EmailIdentity.jsx | Change password đã test; chưa mail verification/reset token/delivery. Thiết kế TTL/rate-limit/không enumerate account trước triển khai, không fake forgot-password link. |
| P19 | Low | REVIEW | Export SaveButton chưa thấy consumer | client/src/components/business/Shared.jsx:39 | rg import/source chỉ thấy declaration; chưa đủ kết luận không có consumer ngoài repo. Giữ file/export, đề xuất kiểm contract consumer trước xóa. |
| P20 | Low | REVIEW | Hai nhánh UI/API legacy/unified và CSS còn chồng lớp | client/src/App.jsx; client/src/components/DashboardView.jsx; server/src/app.js | Feature flags/dynamic imports và regression legacy còn dùng. Giữ, lập kế hoạch deprecate riêng, không xóa vì unified không gọi. |
| P21 | High | BLOCKED | Atlas/shared database chưa cấu hình | server/src/config/testDatabaseGuard.js; server/scripts/start-unified.cjs | Không URI/cluster permission; không migration. Shared environment cần indexes/backup/access credentials riêng; không bật TEST để bypass local guard. |
| P22 | Medium | OPEN | Web3 có GET status lặp khi chưa chọn phân công | client/src/components/business/Web3Page.jsx:13-14 | operations/artifacts fallback status cùng status hook. Read-only, không auto-write; đề xuất hook null/skip và browser request-count regression, chưa refactor trong lượt này. |
| P23 | High | BLOCKED | Bộ nhớ hạn chế chặn nghiệm thu native AI/production browser đầy đủ | ai-service/nlp/engine.py; evidence/production-20261102/ai-unit-inference.txt; production-browser-retest.txt | Native AI abort allocation17MiB, renderer screenshot/CDP timeout. Không lower guard, không tắt ứng dụng cá nhân. Cần giải phóng RAM/commit headroom rồi retest; API SBERT service hiện có vẫn đã chạy E2E. |

P08 là rủi ro nhìn từ source, chưa tái hiện fault-injection; không mô tả như đã gây mất dữ liệu. P10/P17 là thiếu bằng chứng vận hành/scale, không suy thành khai thác đã thành công. Không thay transaction/schema/migration/Atlas/production signer trong lượt này; các phần đó cần thiết kế và phê duyệt riêng.

## Kiểm tra liên kết nghiệp vụ và quyền

Luồng email → CV/JD → SBERT → ứng tuyển → placement → task/log/hours/report → link wallet → local commitments/SBT đã chạy ở TEST. User ID authoritative, fallback wallet chỉ bản ghi ID thiếu và verified wallet. Backend nạp role/status/authVersion, scope/IDOR kiểm bằng test; client menu không thay Backend permission. No-auto-write kiểm navigation/fingerprint, không chỉ suy từ HTTP method.

Public register chỉ student; Admin email provisioning company/mentor/student có audit. Không thêm quyền. Forgot/reset và email verification còn thiếu. Frontend bearer/localStorage không tự làm CSRF biến mất: các challenge cookie/origin đã được suite kiểm, chưa có kiểm OWASP/headers/proxy production đầy đủ.

File upload qua parser Python giới hạn loại/kích thước/active content; tests kiểm PDF/DOCX và negative cases. Không gửi CV ra AI cloud; Pinata chỉ encrypted payload khi bật và đủ credentials. GET health/status không chứng minh model quality hoặc certificate.

## Kết quả và mức sẵn sàng

[Baseline/final và lỗi retest](PRODUCTION_READINESS_CHECKLIST.md), [UI cleanup](PRODUCTION_UI_CLEANUP.md), [dead code](DEAD_CODE_REVIEW.md). Nghiệp vụ local đã regression, nhưng **chưa sẵn sàng production** vì P08/P09/P10/P11/P13/P14/P21/P23 và các kiểm chứng còn thiếu. Không dùng tỷ lệ test PASS để tuyên bố100%.

Ưu tiên tiếp:1) giải phóng tài nguyên/retest phần bị chặn;2) duyệt toolchain patch và transaction báo cáo;3) môi trường triển khai/TLS/backup/rate-limit;4) cấu hình Google/Pinata/Atlas được phép;5) dữ liệu nhãn AI;6) benchmark và deprecate legacy có kiểm soát.

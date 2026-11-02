# Rà soát file, import và code dư thừa

Ngày02/11/2026. [Inventory/import graph](evidence/production-20261102/source-inventory.json):293 baseline files/849 references/137 routes. Static regex không là tree-shaker/callgraph hoàn chỉnh; dynamic import, string registry và scripts được xem trước kết luận. **Không xóa file trong đợt này.**

| Nhóm | Tệp/module | Bằng chứng và quyết định |
| --- | --- | --- |
| A — giữ | client/src/App.jsx, api/client.js, business/*; server/src/core/*/models/services | Luồng unified/regression thực dùng; giữ |
| A — giữ | contracts/contracts/InternshipEvidenceSBT.sol, scripts/local-hardhat.cjs, hardhat.local.cjs | Solidity suite/local receipts; giữ. ESM/CommonJS wrapper có mục đích |
| A — giữ | legacy InternshipPlatform contract/ABI và legacy UI/routes | Feature flags, web3Client import và legacy regression; không xóa chỉ vì unified trả410 |
| B — refactor đề xuất | App.jsx, legacy Dashboard/CvJd/Attendance/Certificate và core equivalents | Hai flow nghiệp vụ có phạm vi/flags khác; trùng tên không chứng minh trùng behavior. Tách shell/features sau khi deprecate plan được duyệt |
| B — refactor đề xuất | design-system.css/index.css/business.css/identity.css | Lớp override còn có vai trò. Chưa CSS coverage từng route/role/theme; không tự xóa selector |
| C — ứng viên không consumer | Shared.jsx export SaveButton | rg source chỉ thấy declaration; giữ vì chưa xác minh external consumers. Không tuyên bố toàn file Shared dư |
| D — giữ tests | server/test, client/test, ai-service/tests, contracts/test-local | Suites regression đang chạy, kể cả negative/synthetic fixtures; không xóa thư mục test/demo |
| E — giữ docs | docs và audit-reports lịch sử | Evidence/thiết kế/giới hạn cần cho nghiệm thu; docs nhiều cổng cũ được đánh dấu lịch sử, không xóa |
| F — cần xác nhận | archives/dự án ngoài phạm vi, Python venv, cache/profile/models, runtime/deployment/vault | Có thể chứa dữ liệu/credentials/phiên đang dùng; không xóa. Git ignore không đồng nghĩa an toàn để xóa |
| F — cần xác nhận | database/seed.mongodb.js và server/scripts/seed.js | Có thể phục vụ quy trình thành viên; chưa dùng trong QA, không chạy hoặc xóa |

Các GET API không có consumer ở unified có thể dành scripts/legacy/public lookup. Route declarations trùng đường dẫn tương đối nằm trong router/middleware khác nhau; không kết luận collision nếu chưa xét mount/policy. Native artifacts/model không phải code chết chỉ vì không import trực tiếp.

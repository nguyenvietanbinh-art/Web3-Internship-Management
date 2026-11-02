# PHASE 6 — Kế hoạch QA và phạm vi thay đổi

Ngày 31/10/2026 (+07). Người dùng phê duyệt tích hợp/QA sau PHASE5; giữ rõ các giới hạn Pinata live, camera/GPS hardware và AI labels. Không chuyển PHASE7, không commit/push hoặc thao tác DB gốc/demo.

## Các nhóm và file trước khi sửa

1. Harness/evidence: server/test/full-system-security.test.js; client/test/phase6-browser.cjs và hook opt-in trong phase3-browser.cjs. TEST riêng với exact allowlist, random test JWT/wallet, không seed/drop/delete/credentials thật. Bổ sung assertions có ý nghĩa, không đổi luồng nghiệp vụ để làm test PASS.
2. Security: kiểm RBAC/IDOR/JWT/signature/replay/body/query/file/CORS/XSS. Chỉ sửa source khi tái hiện được lỗi và mô tả tác động; thay đổi kiến trúc lớn cần phê duyệt riêng. Không làm mất các policy PHASE1–5.
3. Performance: script đo trong ignored contracts/node_modules/.cache/phase6-20261031, fixture TEST có nhãn synthetic. Đo API/NLP/transaction, query explain và bundle; không xem số liệu máy cá nhân là benchmark production. Nếu explain cho thấy thiếu index theo tenant, phạm vi dự kiến server/src/models/Assignment.js + test index; chỉ tạo index ở TEST. Gốc/demo giữ autoIndex=false, chưa rollout/migration.
4. Regression/UI: backend toàn bộ, contract mới/legacy, QR unit, Python unit, browser core+AI+Web3+QR và UI legacy; 4 role, viewport/theme/console/network/no-auto-write. Không nạp một model AI thứ hai khi thiếu RAM. Unit transport IPFS được tách rõ khỏi live credentials BLOCKED.
5. Docs: FINAL_INTEGRATION_TEST_REPORT, SECURITY_RETEST, PERFORMANCE_REPORT, REMAINING_ISSUES; cập nhật progress/test/matrix/architecture nếu có thay đổi thật, giữ lịch sử.

## Bảo vệ dữ liệu/runtime

Advisory audit bổ sung: không tự nâng dependency. Đề xuất ba bản vá nhỏ được ghi trong DEPENDENCY_PATCH_PROPOSAL.md và hỏi người dùng riêng; mọi phần QA không phụ thuộc được tiếp tục. Full dev audit còn có toolchain Hardhat2 cần đánh giá nâng major riêng, không dùng npm audit fix --force.

Snapshot đầy đủ 3 DB trước/sau (SHA-256 từng collection + indexes). Baseline source/Git trước sửa, không xóa untracked. Test tạo child DB mới từ allowlist đã xác minh, không dropDatabase. Giữ Hardhat instance18545 đang chạy; không reset/deploy lại hoặc dùng key thật. Chỉ dừng helper/TEST review đã xác minh chính xác khi cần thay runtime; không dừng ứng dụng người dùng. IPFS ngoại vi không được bật, không in secrets hoặc sửa .env. Status phải phân biệt PASS/FAIL/BLOCKED/NOT TESTED.

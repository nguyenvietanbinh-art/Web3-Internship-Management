# Kết quả triển khai identity thống nhất

Ngày02/11/2026. **http://localhost:5182/** là địa chỉ duy nhất cho người dùng. Backend57407, database TEST `web3_internship_test_phase1_d8c3534f_0f4877b64b94`. Không copy/gộp dữ liệu5177 vào5182. Runtime metadata: [runtime.json](evidence/unified-20261102/runtime.json).

## 1. Kết quả sử dụng

Email/password → Dashboard đúng student/company/mentor/admin → CV/JD/AI/ứng tuyển/phân công/task/nhật ký/chấm công/báo cáo/đánh giá không cần ví → Hồ sơ liên kết ví sau → Web3 có kiểm quyền. Link giữ cùng User ID/ownership/business records, không chuyển URL hoặc logout. Guest không menu nghiệp vụ. Google option có xác minh chính thức nhưng live BLOCKED khi thiếu Client ID.

## 2. Identity và phân quyền

Sử dụng User model hiện có, không User trùng. JWT sub=userId; DB role/status/authVersion là nguồn quyền. Public register chỉstudent; Admin cấp staff qua API có audit. Password bcrypt, wallet optional/verified sau challenge/signature, Google subject riêng; không gộp theo email. Ownership User IDs có ưu tiên tuyệt đối; fallback chỉ wallet thật verified khi ID thiếu. GET không backfill và không match wallet null. Unique CV/application/active-session theo User ID; dữ liệu link ví không nhân đôi.

Wallet unlink dùng nonce mới/TTL/purpose/user/browser và chữ ký, giữ provider khác; chặn chain-associated/open-session/unmapped legacy. Frontend không biết private key; service attestor local có quyền riêng.

## 3. Database và chuyển đổi

Flag `USER_ID_BUSINESS_ENABLED` mặc địnhfalse để runtime legacy không tự đổi schema/index. Runtime unified bậttrue, autoIndex/autoCreatefalse và verify index trước phục vụ. Đã chuẩn bị32 thay đổi index trên TEST được allowlist; index xung đột chỉ thay trên collection rỗng, không update/delete document. Mapping dry-run:0candidate/0issue, không apply ownership. Không migration lên database gốc/demo.

Bốn record User/profile cũ qua nâng cấp có SHA giống nguyên trạng; sau đó cấp rõ ràng ba staff TEST có credentials DPAPI, không seed business data. Password/User ID cũ giữ nguyên. [Bảo toàn](evidence/unified-20261102/preserved-users.json), [index](evidence/unified-20261102/index-applied.json), [mapping](evidence/unified-20261102/mapping-plan.json).

Rollback: không xóa dữ liệu hoặc ép DB walletless vào code required-wallet. Chuyển gốc/demo cần kế hoạch mapping/backup/rollback riêng, chưa thực hiện. [Kế hoạch tương thích](UNIFIED_IDENTITY_MIGRATION_PLAN.md).

## 4. Kiểm thử thực tế

| Nhóm | Kết quả và phạm vi |
| --- | --- |
| Backend | 164/164 PASS,0fail,0skip; gồm14 nhóm identity và3 nhóm migration guard |
| Unified browser | 8/8 PASS lần cuối,0exception/0blocked; register/CV/JD/SBERT/apply/persistence/link/local SBT/responsive/theme/no auto-write |
| Email regression | 6/6 PASS |
| Google/wallet regression | 7/7 PASS; không thay nghiệm thu Google live |
| Frontend lint/build | PASS; lint0error/0warning; entry303.86kB raw/90.71kB gzip |
| Protected databases | Gốc và hai demo: document hashes/counts/indexes trước/sau full suite không đổi |
| Hardhat | Receipt/commitment/completion/mint/verify thật trên chain31337, SBT ERC721/ERC5192 locked |

Automation dùng frontend5184 với DB TEST ngẫu nhiên riêng, một origin cho toàn bộ luồng. Đây không phải hướng dẫn người dùng chuyển từ5182 sang5184. Quan hệ staff/placement và hiệu chỉnh hai phút TEST thiết lập bằng API thật; không tuyên bố mọi thao tác là click-only hay giờ lao động thật. Chữ ký EIP191 thật qua TEST EIP1193/CDP; không private key thật và không giao dịch qua cầu ví trình duyệt.

Kết quả lần đầu có lỗi duplicate ownerUserId index declaration, fixture vi phạm unique CV và selector Ứng tuyển chọn sidebar; đã sửa đúng nguyên nhân và retest. Không bỏ unique constraint để PASS. Logs đầu còn ở cache task, kết quả nghiệm thu mới ở [bằng chứng](evidence/unified-20261102/INDEX.md).

## 5. Chứng cứ blockchain

Lượt UI cuối mint token24, receipt block97, tx `0x8f6d9fae2d53f63faab11c785486bec83411adcc42936f578bd6226f01a5eec5`; contract `0x5FbDB2315678afecb367f032d93F642f64180aa3`, chain31337. Recipient được verify/locked thật. [Chain proof](evidence/unified-20261102/chain-proof.json). Chỉ có ý nghĩa với Hardhat local hiện tại, không chứng minh public-chain deployment và không reset chain.

## 6. File thay đổi

Danh sách dưới so với baseline chọn trước tác vụ, không nhầm toàn bộ Git dirty từ các phase trước:

- `server/src/app.js`
- `server/src/config/env.js`
- `server/src/core/ai.js`
- `server/src/core/dashboard.js`
- `server/src/core/index.js`
- `server/src/core/placementPolicy.js`
- `server/src/core/placements.js`
- `server/src/core/recruitment.js`
- `server/src/core/reports.js`
- `server/src/core/time.js`
- `server/src/core/web3.js`
- `server/src/core/work.js`
- `server/src/middleware/auth.js`
- `server/src/models/Assignment.js`
- `server/src/models/BusinessModels.js`
- `server/src/models/IdentityChallenge.js`
- `server/src/models/JD.js`
- `server/src/models/Task.js`
- `server/src/models/Topic.js`
- `server/src/models/User.js`
- `server/src/models/Web3Models.js`
- `server/src/models/WorkLog.js`
- `server/src/routes/auth.routes.js`
- `server/src/routes/email.routes.js`
- `server/src/routes/google.routes.js`
- `server/src/services/localWeb3.js`
- `server/src/services/qrGps.js`
- `client/src/App.jsx`
- `client/src/components/AppShell.jsx`
- `client/src/components/AuthModal.jsx`
- `client/src/components/DashboardView.jsx`
- `client/src/components/EmailIdentity.jsx`
- `client/src/components/GoogleIdentity.jsx`
- `client/src/components/business/Accounts.jsx`
- `client/src/components/business/CoreBusinessView.jsx`
- `client/src/components/business/Placements.jsx`
- `client/src/components/business/Web3Page.jsx`

File mới của tác vụ: `server/src/services/businessIdentity.js`, `server/src/models/userOwnership.js`, `server/src/core/unifiedPlacements.js`, `server/src/routes/walletIdentity.routes.js`; scripts `server/scripts/unified-index-migration.cjs`, `user-id-mapping-plan.cjs`, `start-unified.cjs`; `scripts/demo/unified-session.cjs`, `unified-acceptance.cjs`; tests `server/test/unified-identity.test.js`, `unified-index-migration.test.js`, `client/test/unified.e2e.cjs`; UI `client/src/components/MyWallet.jsx`; tài liệu migration/result và evidence. Các tài liệu bắt buộc đã cập nhật, FULL_WEBSITE_TEST_GUIDE/DEMO_SCRIPT viết lại cho một URL.

## 7. Hạn chế còn lại

- Google live BLOCKED thiếu Client ID hợp lệ; Pinata live BLOCKED credentials/encryption key/enable flag. Không giả CID/readback thành công.
- Risk classifier NOT_TRAINED; chưa có nhãn độc lập cho metrics nghiệm thu ranking/risk. SBERT inference thật không đồng nghĩa chất lượng đã được nghiệm thu.
- Popup MetaMask extension thật, camera/GPS thiết bị thật cần kiểm thủ công; automation không chứng minh chống GPS spoof.
- Đổi mentor của phân công có API User ID nhưng UI unified hiện chỉ chọn lúc tạo; chưa có form sửa mentor tương ứng.
- Quên mật khẩu/email verification qua mail chưa hoàn thiện; email/password demo không phải quyền sở hữu Gmail được Google xác minh.
- Môi trường đang chạy là TEST trên máy, không production/deployment tự khởi động sau reboot. Các runtime lịch sử có thể vẫn tồn tại để đối chiếu; không thuộc luồng người dùng hiện hành.

## 8. Git và an toàn

Branch `branch_1`, HEAD giữ nguyên `d11a1852c5f03963bbe260425a246b0e65fe1091`, không staged/commit/push/merge/reset/clean. Sáu package manifest/lock giữ SHA baseline, không dependency mới. Không real.env, không xóa untracked, không sửa DB gốc/demo. Git vốn dirty từ các phase trước; [snapshot và đối chiếu](evidence/unified-20261102/git-and-dependencies.json).

## 9. Bạn kiểm tiếp

Ctrl+F5 → http://localhost:5182/ → login email cũ hoặc register mới → làm theo [hướng dẫn đầy đủ](FULL_WEBSITE_TEST_GUIDE.md). Chuyển role QA bằng helper ở cùng website; tạo dữ liệu lần lượt vì dữ liệu tự động nằm ở DB TEST riêng. Liên kết MetaMask TEST sau khi hoàn thành nghiệp vụ thông thường. Điền PASS/FAIL/BLOCKED/NOT TESTED theo quan sát thật. Dừng chờ nghiệm thu, không triển khai public hoặc thay gốc/demo.

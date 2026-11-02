# Cập nhật hiện tại — PHASE 5 Web3 local

Ngày31/10/2026. Đã triển khai/test Web3 local theo phê duyệt; chưa đánh dấu toàn bộ PHASE5 nghiệm thu khi Pinata live và camera/GPS phần cứng còn thiếu. Không chuyển PHASE6. [Báo cáo đầy đủ, TX thật, file và giới hạn](WEB3_INTEGRATION_RESULT.md).

Bổ sung Web3Page lazy, QrCode lazy (ảnh PNG local/margin trắng), NativeQrScanner dùng ZXing lazy và qrDecoder có fallback parse thật. Scanner permission chỉ onclick, decoded token chỉ điền form; GPS/redeem cần nút riêng. Stream cleanup xử lý StrictMode và permission trả về muộn. VERIFIED badge chỉ sau GET RPC thành công, xóa trước retry/error. CID/TX wrap trên mobile; statuses phân biệt operation confirmed với certificate verified. Vite prebundle các dependency QR để lần mở đầu không reload form dev. Light/Dark và320/768/1440 đã kiểm; chưa UAT camera/mobile hardware.

---

# UI Design System — Internova / PHASE 2

Ngày31/10/2026. **Đã triển khai trong Frontend; không còn là bản thiết kế dự kiến PHASE0.** Premium Web3 SaaS Dashboard, Indigo/Blue/Violet, Light mặc định và Dark tùy chọn. React/Vite/Lucide/CSS hiện có, không thêm dependencies. Đây là nghiệm thu giao diện hiện có, không cam kết Backend của mọi mục menu đã hoàn thành.

## Tokens đã triển khai

Nguồn: `client/src/design-system.css`, nạp sau index.css; CSS cũ giữ làm compatibility base, bỏ font remote. Các alias bg-dark/bg-card/border-glass được giữ để code của thành viên tương thích; ý nghĩa phụ thuộc theme, không cố định tối/glass.

| Token | Light | Dark |
| --- | --- | --- |
| bg-dark | #f7f8fc | #0b1120 |
| bg-card | #fff | #111b2e |
| surface-muted | #f1f4f9 | #1a263c |
| text-main | #17213a | #edf1fc |
| text-muted | #526078 | #bbc7df |
| text-dim | #64718a | #a2b0c9 |
| border-glass | #e3e7f0 | #2b3952 |
| primary | #4f46e5 | #4f46e5 |
| primary-light | #4f46e5 | #b2b3ff |
| primary-soft | #eeedff | #272650 |
| accent-cyan | #0369a1 | #7dd3fc |
| accent-emerald | #047857 | #6ee7b7 |
| accent-purple | #7e22ce | #d8b4fe |
| accent-amber | #92400e | #fde68a |
| accent-rose | #b91c1c | #fca5a5 |
| focus-ring | #2563eb | #93c5fd |


Typography: Segoe UI/Inter local/system sans-serif, không tải Google Fonts. Mono dùng ui-monospace/Consolas. Body15px/1,55; page title29px (mobile24), section19px, control13–14px; captions10–12px. Sidebar252px, collapsed78px; header80px/68px mobile. Card radius14–16px, button/input9px, dialog18px. Content spacing12/16/18/24/28/32/36px; desktop content tối đa1600px.

Light mặc định cho preference mới; chọn Dark lưu duy nhất `w3i_theme` trong localStorage, không lưu PII trong preference. JWT storage vẫn là cơ chế PHASE1, không bị đổi bởi theme. CSS color-scheme và reduced-motion được hỗ trợ.

## Component thực tế

| Component | Trách nhiệm |
| --- | --- |
| AppShell | Sidebar/Topbar, account/role/wallet, collapse/drawer, skip link, main focus, page context, theme, diagnostics rõ trạng thái |
| PageHeader | Eyebrow/title/description, nhãn phạm vi theo vai trò |
| StatCard | Giá trị API; giữ0, null thành dấu— hoặc chưa có điểm; không phần trăm tăng trưởng mẫu |
| DataTable | Scoped rows, labels/caption, search/filter và6row/page phía client, pagination, empty state, scroll region keyboard |
| EmptyState | Empty hoặc error, giải thích và CTA retry có chủ đích |
| LoadingSkeleton | aria-busy/status, bố cục ổn định khi tải chunk/API |
| Dialog | role dialog/aria-modal/name, focus trap, Escape, restore, click backdrop, body scroll lock |
| UnavailableView | NOT IMPLEMENTED, không nút ghi hoặc success toast giả |
| ViewBoundary | Render/lazy-chunk error và reload có chủ đích |

Không tuyên bố đã xây FileUploader/QRScanner/Notification backend/Certificate verifier/StatusTimeline độc lập. Mục thông báo dùng dialog NOT IMPLEMENTED, không badge unread mẫu. Biểu đồ CSS có legend+count text thực, không cần chart package.

## Trang và vai trò

Cả bốn vai trò dùng cùng5view có sẵn, dữ liệu/CTA tuân theo quyền PHASE1: Dashboard, Đề tài & KPI/báo cáo/đánh giá, CV/JD & matching, Công việc/điểm danh/nhật ký, Chứng nhận Web3. Không thay policy bằng menu ẩn. Sidebar group WORKSPACE cho trang đã có; SẮP TRIỂN KHAI chỉ dẫn tới trạng thái chưa có Backend.

- Student: overview scoped, CV/matching, task/log/check-in, KPI/report, chứng nhận; ứng tuyển chưa có Backend.
- Company: overview, JD, đề tài/phân công/task/QR/evaluate; ứng viên chưa có Backend.
- Mentor: overview, đề tài được phụ trách, worklogs/progress và evaluator guards; quản lý danh sách sinh viên/cảnh báo đầy đủ chưa có Backend.
- Admin: overview tổng theo API, ledger permission, menu accounts/company/student hiện NOT IMPLEMENTED; chưa user lifecycle, batch và permission editor.

## Form, table và trạng thái

Giữ các handler/API hiện có và ID/selector cũ cho test tích hợp. Form dùng label hoặc accessible name, native required/pattern/min/max và server validation; lỗi thao tác vẫn hiển thị toast/status hoặc error state theo view. KPI có visible label trọng số/hạn trên mobile. Không chuyển ngày/giờ hoặc data schema Backend; thiếu checkInTime hiển thị chưa ghi nhận thay giờ mẫu.

JD search và DataTable filters là cục bộ trên API rows đã tải, không global search hoặc server pagination. Profile CV chỉ dùng đối chiếu tạm; không gọi đã lưu hoặc đã ứng tuyển. Unknown certificate404/missing verifier503 vẫn bị khóa, không VERIFIED từ Mongo/CID/tx string. Wallet signed-in khác chứng nhận chain hợp lệ; kiểm RPC chỉ đọc qua nút có chủ đích, không probe khi mount.

## Responsive và accessibility

Breakpoints1200/1024/768/374px; desktop sidebar, dưới1024 drawer. Grid nhiều cột về một cột; KPI modal xếp theo trường; table rộng cuộn trong region thay vì tràn trang. Kiểm thực tế320/375/768/1024/1440px, bốn vai trò; dữ liệu nonempty và cả hai theme. Không giấu page overflow bằng overflow-x:hidden.

Keyboard: skip link, focus-visible3px, nav button Enter, topic card Enter/Space, main focus khi chuyển trang; dialog Escape/trap/restore và mobile drawer đóng đúng. Subtab aria-pressed; icon-only buttons có accessible name. Chart có text counts thay thế màu. Reduced-motion tắt animation/transition; motion bình thường nhẹ ở drawer/dialog/skeleton.

22 cặp semantic foreground/background có ratio>=4,63:1 ở Light/Dark, gồm body/muted/caption/status/button. Tab selected primary+white được đo computed style. **Chưa kiểm định WCAG toàn diện**, screen reader thực, OS high-contrast, zoom200–400%, Lighthouse/axe/UAT. Không coi token contrast là mọi phần tử đều đạt AA.

## Bundle và an toàn

App lazy-load4view; BrowserProvider/ethers dynamic import theo thao tác ví hoặc explicit RPC check. Entry JS290,53kB/gzip88,08kB; ethers379,90kB deferred, không cảnh báo chunk>500kB. Không thay nonce/JWT/chain/signer checks, không cài chart/UI/QR library. CSS khoảng24,42kB minified gồm compatibility base, chưa loại toàn bộ legacy inline styles.

Không mutation khi render/chuyển tab; chỉ gọi API ghi từ hành động người dùng đã có. Test scope/allowlist và business counts trước/sau được ghi trong [TEST_RESULTS.md](TEST_RESULTS.md). Secret scan là source/pattern build, không audit bảo mật toàn diện. Không secret hoặc private key thật trong Frontend/test fixture.

## Evidence và giới hạn

Build PASS; lint0error/0warning; Backend43/43; browser39/39 và polish4/4. Ảnh trong ignored staging: company-dashboard-light.png, admin-dashboard-dark.png, student-mobile-light.png, jd-mobile-light.png, jd-desktop-dark.png, topic-form-mobile.png. Dữ liệu ảnh có chữ TEST và là fixture explicit; không dùng làm số liệu sản phẩm.


- Chưa có Backend hoàn chỉnh cho Application/ứng viên, lưu/upload/parser CV, quản lý tài khoản/phân quyền/doanh nghiệp/sinh viên, batch, notification/audit, cảnh báo rủi ro và giờ làm/check-out. Các mục liên quan hiển thị NOT IMPLEMENTED hoặc hành động bị khóa; không toast thành công giả.
- AI vẫn là TF-IDF/fallback có nguồn; không BERT hoặc bộ phân loại rủi ro. Matching browser gọi AI TEST thật, không phải benchmark mô hình.
- Pinata/RPC/token verifier thật chưa được cấu hình; chứng nhận unknown404/known503, không badge VERIFIED. QR vẫn nhập token phiên, chưa encoder/camera/GPS hoặc attendance proof blockchain.
- Không có EVM/deploy/MetaMask hardware/cloud integration/UAT/Lighthouse hoặc kiểm định WCAG đầy đủ ở PHASE2. Contrast chỉ đo các cặp semantic tokens được liệt kê; chưa kiểm mọi nội dung tự do/trạng thái hệ điều hành.
- Auth/nonce/JWT policy giữ nguyên PHASE1; localStorage JWT và SIWE domain/CSP hardening vẫn là khoảng thiếu đã ghi. Menu theo vai trò không thay kiểm quyền Backend.
- Search/filter/pagination của bảng và JD chạy trên dữ liệu API đã tải, chưa server pagination/global search. Biểu đồ chỉ phản ánh các đề tài đã tải, không tạo chuỗi thời gian hoặc xu hướng giả.
- ethers chunk vẫn khoảng380kB khi người dùng thao tác ví/RPC; đã tách tải, không phải giảm tổng dung lượng thư viện. Không cài dependency hoặc đổi framework.
- Seed cũ vẫn nguy hiểm/hardcode và không chạy. Không áp schema/migration/model mới vào DB gốc/demo; rollout vào đó là công việc riêng.

Ảnh kiểm tra: [Dashboard Light](../contracts/node_modules/.cache/phase2-20261031/company-dashboard-light.png), [Dashboard Dark](../contracts/node_modules/.cache/phase2-20261031/admin-dashboard-dark.png), [JD mobile](../contracts/node_modules/.cache/phase2-20261031/jd-mobile-light.png), [form KPI mobile](../contracts/node_modules/.cache/phase2-20261031/topic-form-mobile.png). Ảnh dùng dữ liệu TEST, không phải số liệu database gốc/demo.

**Dừng sau PHASE2 để review; chưa bắt đầu PHASE3.** Tài liệu kế hoạch master giữ lịch sử PHASE0/1; trạng thái hiện tại nằm trong [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) và [FEATURE_ACCEPTANCE_MATRIX.md](FEATURE_ACCEPTANCE_MATRIX.md).

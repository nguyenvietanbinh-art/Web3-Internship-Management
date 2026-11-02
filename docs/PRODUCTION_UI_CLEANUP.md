> Global text audit mới nhất: [UI_CONTENT_AUDIT.md](UI_CONTENT_AUDIT.md), có inventory, phân loại và ảnh trước/sau.

# Chuẩn hóa nội dung và UI

## Bổ sung theo ảnh giao diện — 02/11/2026

Đã bỏ thêm 5 đoạn hướng dẫn thừa trong AppShell, MyWallet, GoogleIdentity và AccountOverview:

- Dòng dưới nút đăng nhập: “Đăng nhập bằng email; bạn có thể liên kết ví sau.”
- Đoạn liệt kê các nghiệp vụ không cần ví trong mục Ví Web3.
- Đoạn nhắc liên kết ví trong Phương thức đăng nhập.
- Mô tả “Dữ liệu hồ sơ hiện tại của bạn.”
- Đoạn diễn giải quyền/nghiệp vụ phụ thuộc ví ở Tổng quan tài khoản; nội dung cũ cũng không còn đúng với unified identity.

Giữ labels, validation, lỗi, trạng thái ví, cảnh báo quyền riêng tư và giao dịch. Chỉ sửa nội dung hiển thị; lint/build PASS, không chạy lại E2E cho lần chỉnh copy này. Không thay database hoặc commit/push.

Ngày02/11/2026. Giữ design tokens/layout/role navigation; sửa có chọn lọc, không viết lại website. Không đổi API/schema/quyền. Có48 mục copy/diagnostic trong manifest; ngoài ra CSS identity và xử lý phiên/form được sửa theo báo cáo audit.

## Thay đổi

Gỡ mô tả Backend/database/API/PHASE khỏi phần giao diện nghiệp vụ hiện hành; đổi lỗi đăng nhập sang ngôn ngữ người dùng; giữ Google chưa cấu hình, email chưa xác minh/reset chưa có, AI engine thực tế/uncalibrated/risk NOT_TRAINED, IPFS chưa upload, local-chain/fee/signature/privacy/verification. Tên bản ghi TEST do test/user nhập không bị đổi thành dữ liệu thật.

Ẩn runtime RPC diagnostics/raw thao tác bằng import.meta.env.DEV, tắt demo quick-login trong production bundle. Bằng chứng production cần Vite NODE_ENV=production; build với NODE_ENV=test vẫn DEV theo Vite, đã sửa test harness tách khỏi Backend TEST. Không ẩn CID/tx/network cần thiết cho xác minh.

IdentitySettings dùng spacing scoped; input/select dùng surface/theme thống nhất; giữ labels/autocomplete/error/focus. AssignmentPicker dùng tên sinh viên từ API authorized thay dấu gạch khi chưa có ví. Không thêm default GPS, mock KPI hoặc auto-submit.

## Bảng copy đầy đủ

| File | Trước | Sau |
| --- | --- | --- |
| client/src/components/AppShell.jsx | PanelLeftOpen, Menu, Wallet, LogOut, ShieldCheck, GraduationCap, ArrowUpRight | PanelLeftOpen, Menu, Wallet, LogOut, ShieldCheck, GraduationCap |
| client/src/components/AppShell.jsx | Có thể dùng email và mật khẩu riêng của Internova. Không cần Google hoặc ví để đăng nhập bằng email. | Đăng nhập bằng email; bạn có thể liên kết ví sau. |
| client/src/components/AppShell.jsx | Quyền truy cập được xác minh tại Backend. | Chỉ bạn và người được cấp quyền có thể truy cập. |
| client/src/components/AppShell.jsx | description={current.description // 'Theo dõi tình trạng triển khai của chức năng.'} | description={current.description} |
| client/src/components/AppShell.jsx | <span>AI có nguồn · Chứng nhận cần xác minh <ArrowUpRight size={13} /></span> |  |
| client/src/components/AppShell.jsx | <details className="runtime-details"> | {import.meta.env.DEV && <details className="runtime-details"> |
| client/src/components/AppShell.jsx | Chứng nhận token chỉ được xác nhận khi có bằng chứng.</p></details> | Chứng nhận token chỉ được xác nhận khi có bằng chứng.</p></details>} |
| client/src/components/AppShell.jsx | NOT IMPLEMENTED | Chưa khả dụng |
| client/src/components/AppShell.jsx | Chức năng chưa được bật hoặc cần đăng nhập. Không hiển thị số chưa đọc hoặc thông báo mẫu. | Thông báo hiện chưa khả dụng. Vui lòng thử lại sau. |
| client/src/components/EmailIdentity.jsx | Backend này chưa có đăng nhập email; mở môi trường email TEST theo hướng dẫn. | Đăng nhập email hiện chưa khả dụng. Vui lòng liên hệ quản trị viên. |
| client/src/components/EmailIdentity.jsx | Cần MetaMask và ví TEST để ký liên kết. Đăng nhập email không cần MetaMask. | Cần cài MetaMask để liên kết ví. Bạn vẫn có thể đăng nhập bằng email. |
| client/src/components/EmailIdentity.jsx | Liên kết ví TEST bằng mật khẩu và chữ ký | Liên kết ví MetaMask |
| client/src/components/EmailIdentity.jsx | Dùng mật khẩu riêng cho Internova, không dùng mật khẩu Gmail. Tối thiểu 10 ký tự, tối đa 72 byte. Email chưa được xác minh; chưa có khôi phục mật khẩu qua email. | Mật khẩu riêng của Internova: ít nhất 10 ký tự, tối đa 72 byte. Email chưa được xác minh; khôi phục mật khẩu qua email chưa khả dụng. |
| client/src/components/GoogleIdentity.jsx | BLOCKED: Backend đang chạy bản cũ chưa có Google Login. Mở môi trường Google TEST theo hướng dẫn. | Đăng nhập Google hiện chưa khả dụng. Vui lòng dùng email hoặc phương thức đã liên kết. |
| client/src/components/GoogleIdentity.jsx | BLOCKED: Google Login chưa được cấu hình Client ID trên Backend. | Đăng nhập Google chưa được cấu hình. Vui lòng dùng phương thức khác. |
| client/src/components/GoogleIdentity.jsx | Cần MetaMask và ví TEST để ký xác nhận liên kết. | Cần cài MetaMask để ký xác nhận liên kết. |
| client/src/components/GoogleIdentity.jsx | Liên kết ví TEST khi cần chức năng blockchain. | Liên kết ví khi cần chức năng blockchain. |
| client/src/components/GoogleIdentity.jsx | Không tự gộp tài khoản theo email. Không đổi/hủy ví đang làm khóa sở hữu nghiệp vụ. Không thể xóa phương thức đăng nhập cuối cùng. | Tài khoản không tự gộp theo email. Không thể gỡ phương thức đăng nhập cuối cùng hoặc ví còn ràng buộc với dữ liệu blockchain. |
| client/src/components/AuthModal.jsx | Email và mật khẩu Internova · Không cần tài khoản Google | Chào mừng bạn trở lại |
| client/src/components/AuthModal.jsx | Đăng ký email cấp tài khoản sinh viên. Giảng viên và Admin do nhà trường cấp; không tự chọn quyền cao. | Sinh viên có thể tự đăng ký. Tài khoản doanh nghiệp, giảng viên và nhà trường được cấp riêng. |
| client/src/components/AuthModal.jsx | Google OAuth (tùy chọn, không cần cho demo email) | Đăng nhập bằng Google |
| client/src/components/AuthModal.jsx | Yêu cầu ký xác thực Nonce (EIP-191) an toàn, không tốn phí Gas. | Ký thông điệp để xác thực; không gửi giao dịch và không mất phí gas. |
| client/src/components/business/CoreOverview.jsx | CORE BUSINESS · THEO PHÂN CÔNG | TỔNG QUAN THỰC TẬP |
| client/src/components/business/CoreOverview.jsx | Nguồn database theo vai trò; chỉ giờ đã duyệt, không cộng Attendance QR cũ thiếu checkout. | Theo dõi tiến độ, kết quả và giờ làm đã được duyệt. |
| client/src/components/business/CoreOverview.jsx | Từ User và InternshipBatch | Tổng số doanh nghiệp và kỳ thực tập |
| client/src/components/business/CoreOverview.jsx | Task đã xong / tổng | Công việc đã xong / tổng |
| client/src/components/business/CoreOverview.jsx |  · chưa phải điểm on-chain |  |
| client/src/components/business/CoreOverview.jsx | KPI có trọng số của phân công đã kết thúc; khác điểm nhận xét báo cáo | Kết quả KPI có trọng số sau khi hoàn tất thực tập |
| client/src/components/business/ProfileCv.jsx |  · Vai trò do Backend quản lý: {user.role} |  |
| client/src/components/business/ProfileCv.jsx | CV riêng tư; doanh nghiệp chỉ xem snapshot của hồ sơ bạn đã ứng tuyển. Nội dung trích xuất dùng được cho AI ở PHASE4. | CV riêng tư. Doanh nghiệp chỉ xem bản hồ sơ bạn đã gửi khi ứng tuyển. |
| client/src/components/business/ProfileCv.jsx | Chưa upload tài liệu. | Chưa tải lên tài liệu. |
| client/src/components/business/Recruitment.jsx | Tìm kiếm và phân trang từ API. Chấp nhận ứng tuyển không tự tạo phân công hoặc chứng nhận. | Tìm cơ hội phù hợp và theo dõi ứng viên. Sau khi nhận ứng tuyển, cần tạo phân công thực tập. |
| client/src/components/business/Accounts.jsx | Chỉ Admin cấp quyền/khóa tài khoản, mọi thay đổi có lý do và lịch sử. Không có mật khẩu cho tài khoản ví. | Quản lý quyền và trạng thái tài khoản. Mọi thay đổi được lưu trong lịch sử. |
| client/src/components/business/CoreBusinessView.jsx | Xác thực tài khoản có vai trò phù hợp. API vẫn kiểm tra quyền trên từng bản ghi. | Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này. |
| client/src/components/business/Shared.jsx | {label} — phân trang phía API | {label} |
| client/src/components/business/Shared.jsx | ${shortWallet(a.studentWallet)} | ${a.participantNames?.student // shortWallet(a.studentWallet)} |
| client/src/components/business/Shared.jsx | Tối đa100 phân công được phép đã tải. Thời gian hiển thị theo máy; nghiệp vụ giờ làm dùng UTC. | Hiển thị tối đa 100 phân công. Thời gian theo múi giờ thiết bị. |
| client/src/components/business/AiPage.jsx | AI / NLP cục bộ | Phân tích mức độ phù hợp |
| client/src/components/business/AiPage.jsx | Chỉ phân tích khi bạn bấm nút. CV và báo cáo không gửi tới dịch vụ bên ngoài; không ghi database. | Nội dung CV và báo cáo được xử lý nội bộ, không gửi đến dịch vụ AI bên ngoài. |
| client/src/components/business/AiPage.jsx | Kết quả phân tích thực tế | Kết quả phân tích |
| client/src/components/business/Web3Page.jsx | Thiếu credentials/key thì BLOCKED; anchor hash không có CID không được coi là đã upload IPFS. | Lưu hash không đồng nghĩa báo cáo đã được tải lên IPFS. |
| client/src/components/business/Web3Page.jsx | IPFS live BLOCKED: thiếu Pinata/quyền bật upload/khóa mã hóa. Chưa readback thật. | Lưu trữ IPFS chưa sẵn sàng. Báo cáo chưa được tải lên và xác minh. |
| client/src/components/business/Web3Page.jsx | Cần phân công completed, đủ KPI, finalreport approved, giờ dương đã duyệt và các proof đã anchor. Backend kiểm lại điều kiện, không mint khi render. | Chỉ phát hành khi hoàn tất thực tập, đủ KPI, báo cáo cuối kỳ và giờ làm được duyệt, bằng chứng được xác nhận. |
| client/src/components/business/Web3Page.jsx | {last&&<details data-testid="web3-last-result" open> | {import.meta.env.DEV && last&&<details data-testid="web3-last-result" open> |
| client/src/components/ui.jsx | NOT IMPLEMENTED · PHASE 3+ | Chưa khả dụng |
| client/src/components/ui.jsx | Chức năng này chưa có luồng Backend hoàn chỉnh. Giao diện không tạo dữ liệu hoặc thông báo thành công thay thế. | Chức năng này hiện chưa khả dụng. Vui lòng liên hệ quản trị viên để được hỗ trợ. |
| client/src/components/DashboardView.jsx | Biểu đồ được tính từ đề tài API đã tải; không dùng dữ liệu mẫu. | Biểu đồ sẽ hiển thị khi có dữ liệu thực tập. |
| client/src/components/CvJdView.jsx | Thứ tự theo API; chỉ có điểm sau khi chạy matching | Điểm phù hợp được hiển thị sau khi phân tích |

## Kiểm thử và rollback

Production shell5/5 (bốn role, responsive/theme, debug-hidden) và dev browser9/9 sau sửa; Google selector cũ fail1, đã đổi selector theo nhãn mới và retest7/7. Build production thực và giới hạn tài nguyên ghi riêng ở [checklist](PRODUCTION_READINESS_CHECKLIST.md), không dùng ảnh dev làm chứng cứ production. Desktop/tablet/mobile có screenshot; keyboard labels/focus giữ nguyên, chưa có audit screenreader/contrast toàn trang đầy đủ. Rollback chọn từng file bằng bản HEAD tham chiếu; không reset/clean working tree, không rollback DB.

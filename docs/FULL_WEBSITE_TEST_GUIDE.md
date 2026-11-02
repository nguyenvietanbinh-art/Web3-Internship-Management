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

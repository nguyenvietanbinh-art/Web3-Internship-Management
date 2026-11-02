# Identity thống nhất: kế hoạch và giới hạn chuyển đổi

Ngày 02/11/2026. Phê duyệt của người dùng: một website, email/Google trước, ví sau; chuyển ownership nghiệp vụ sang User ID và kiểm trên TEST mới. Không phê duyệt chuyển dữ liệu gốc/demo.

Nguồn dữ liệu: giữ nguyên mọi database cũ. Runtime mới có một database TEST thống nhất, không copy/gộp tài khoản giữa5177 và5182. User model hiện có tiếp tục là danh tính duy nhất; role student/company/mentor/admin do Backend kiểm tra. Đăng ký công khai chỉ student, các role khác được quản trị cấp.

Nhóm1: thêm ownership User IDs và index partial cho CV/JD/Topic/Assignment/Application/Task/WorkLog/WorkSession/Report. Ví snapshot legacy giữ nguyên. Feature flag USER_ID_BUSINESS_ENABLED dành riêng runtime mới; mặc định tắt để tránh đòi index mới trên runtime/dữ liệu cũ.

Nhóm2: policy đọc ưu tiên User ID. Fallback wallet chỉ áp dụng bản ghi chưa có owner ID và ví thật đã xác minh thuộc User hiện tại; không match undefined/null, không tạo ví giả, không dùng wallet giả dạng User ID. Owner ID đã có là authoritative, không được fallback sang ví để chiếm bản ghi. Các GET không backfill dữ liệu.

Nhóm3: chuyển route core CV/JD/application/placements/tasks/logs/time/reports/dashboard/AI sang policy trên. Dữ liệu mới ghi User IDs; task/log/report/time kế thừa IDs từ phân công. Unique theo User ID chặn duplicate trước và sau khi link ví. Không đổi ownership records khi link ví.

Nhóm4: Web3 giải quyết recipient wallet từ User ID tại thời điểm hành động, yêu cầu ví xác minh thật và kiểm ownership. Snapshot commitment đã on-chain không được tự thay khi có wallet mới. Không đổi wallet đã có hoặc unlink nếu có dữ liệu/operation ràng buộc. QR và giờ làm là nghiệp vụ, không được giả địa chỉ Ethereum để lưu.

Nhóm5: Frontend email-first dashboard theo role, /login và /register, các menu core không bị wallet gate; Web3 có thông báo và nút vào cài đặt ví. Một API/base URL cho một frontend; AI/RPC vẫn là internal services. Giữ UI và API legacy để tương thích, không dùng các menu legacy thay luồng unified.

Migration dữ liệu cũ chỉ lập kế hoạch: dry-run mapping wallet→User exact/unique, báo unresolved/duplicate/null/conflict; không resolve theo email, không auto-merge. Owner ID đã có không ghi đè. Kế hoạch apply phải có backup, optimistic condition, batch manifest và rollback chỉ gỡ ID do đúng migration ghi khi chưa có sửa sau đó; không xóa User/records/transactions. Không áp dụng lên gốc/demo trong lần này. Legacy indexes không tự sync/drop.

Rollback code: tắt flag ở runtime cũ không đổi database cũ. Database unified có dữ liệu walletless phải giữ nguyên; không ép dùng code required-wallet để rollback, không xóa dữ liệu nhằm làm schema cũ hợp lệ. Runtime cũ vẫn có thể dùng riêng cho đối chiếu nhưng người dùng cuối chỉ dùng URL unified.

Kiểm thử: test DB exact allowlist mới; đăng ký/login, bốn role, CV/JD/AI/apply/placement/tasks/logs/time/report khi chưa có ví, persistence/relogin, IDOR/role/search/notifications, wallet signature/replay/conflict, User ID và business IDs không đổi sau link, chain local mint/verify thật. Google/Pinata live thiếu cấu hình ghi BLOCKED. Bảo toàn hash/index database gốc/demo, không commit/push hoặc cài dependency.

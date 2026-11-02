# Demo Internova — một website

Ngày02/11/2026. Chỉ **http://localhost:5182/**, một Backend57407, một database TEST. [Hướng dẫn từng thao tác và lệnh CMD đổi role](FULL_WEBSITE_TEST_GUIDE.md). Các hướng dẫn nhiều cổng trước đây là lịch sử.

## Trước demo

Ctrl+F5/login lại sau nâng cấp; mật khẩu/User ID cũ được giữ. Kiểm health, Mongo/NLP/RPC. Dùng dữ liệu và ví TEST, không seed/migration/reset chain.

| Bước | Role | Cần chứng minh |
| --- | --- | --- |
| 1 | Khách/student | `/register` → email/password → Dashboard; không menu trước login, không cần ví |
| 2 | Student | Lưu hồ sơ, tạo CV; logout/login vẫn còn |
| 3 | Company | Email login, tạo/đăng JD trên cùng website |
| 4 | Student | SBERT matching thật, ứng tuyển và chặn trùng |
| 5 | Company/Admin | Duyệt ứng viên, kỳ/đề tài/KPI, phân công bằng User IDs |
| 6 | Company/Student | Task, nhật ký, check-in/out chủ động, tổng giờ và audit |
| 7 | Company/Student | QR/GPS, TTL/replay; thiếu thiết bị báo BLOCKED |
| 8 | Student/Mentor/Company | Báo cáo, nhận xét/đánh giá, Dashboard đúng quyền |
| 9 | Student | Hồ sơ → Ví Web3 của tôi; reauth/chữ ký TEST, cùng tài khoản/dữ liệu |
| 10 | Staff/Student | Local commitment/completion/mint đủ điều kiện, receipt và verify SBT thật |

Google/Pinata live BLOCKED thiếu cấu hình; risk classifier NOT_TRAINED, thiếu metrics trên nhãn độc lập. Không điền CID/tx/AI success giả. Thiếu điều kiện mint thì giải thích response, không bỏ guard.

Backend164/164; browser unified8/8 + email6/6 + Google/wallet7/7. Có setup quan hệ/giờ TEST qua API thật; không phải mọi bước đều click-only. MetaMask popup/camera/GPS thật cần nghiệm thu thủ công. [Báo cáo](UNIFIED_IDENTITY_RESULT.md), [ảnh thật](evidence/unified-20261102/INDEX.md). Sau demo logout, giữ dữ liệu làm bằng chứng; không xóa DB/reset chain.

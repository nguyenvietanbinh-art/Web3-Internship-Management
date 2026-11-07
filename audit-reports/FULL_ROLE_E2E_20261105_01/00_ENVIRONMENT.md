# Môi trường kiểm thử — 05/11/2026 (+07)

Branch `branch_1`, HEAD đầu lượt `e14adeb`. Ban đầu chỉ `audit-reports/` untracked; không ghi đè hoặc xóa các báo cáo cũ. Không commit/push/merge/reset/clean.

| Thành phần | Xác minh thực tế |
| --- | --- |
| Windows | Windows local, PowerShell; Node22.23.4, npm10.9.9, Python3.13.5 |
| RAM | Khoảng 723MiB available lúc đầu; khoảng839MiB ở probe cuối. Không đủ guard1024MiB để nạp model lạnh |
| MongoDB | Ban đầu không có listener27017. Người dùng đã phê duyệt khởi động lại đúng dữ liệu cũ |
| MongoDB phục hồi | PID27644, bind127.0.0.1:27017; `C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\data`; cache WiredTiger0.25GiB chỉ trong command line, không sửa config/service |
| Frontend manual | http://localhost:5182/; HTTP200 qua loopback |
| Backend manual | http://localhost:57407/api/health; HTTP200, Mongo connected |
| AI | http://127.0.0.1:8003; SBERT đã nạp sẵn, ready=true; risk classifier NOT_TRAINED |
| RPC | http://127.0.0.1:18545, chain31337; không restart/reset/redeploy chain |
| Browser TEST | Edge headless riêng, profile trong cache ignored; production5186/CDP9232, email5183/9229, unified production5184/9230; các tiến trình này đã đóng |
| Credentials | Không đọc/in mật khẩu manual; Google live/Pinata live chưa sẵn sàng, không dùng credentials thật trong test |

MongoDB recovery có thể cập nhật journal/storage nội bộ. Hash nghiệp vụ baseline được lấy SAU phục hồi; không tuyên bố có hash ngay trước khi Mongo dừng. Không tạo MongoDB mới trên27017 vì Backend demo có thể tự kết nối nhầm instance.

Nguồn: README, TEAM_QUICKSTART, FULL_WEBSITE_TEST_GUIDE, DEMO_SCRIPT, IMPLEMENTATION_PROGRESS, TEST_RESULTS, FEATURE_ACCEPTANCE_MATRIX, FINAL_KLCN129_ACCEPTANCE, FULL_PROJECT_AUDIT, PRODUCTION_READINESS_CHECKLIST, REMAINING_ISSUES và source/test liên quan. Đã trích văn bản DOCX KLCN129 gốc vào evidence/requirements-original.txt. Tài liệu lịch sử có mô tả cổng/auth cũ; chỉ dùng cấu hình đã probe cho kết luận hiện tại.

Lưu ý: toàn bộ database TEST lịch sử quá nhiều để snapshot hiệu quả trên RAM thấp. Script snapshot đầu tiên được dừng trước khi chạy test; không có thao tác ghi. Lượt chính snapshot gốc, hai demo và TEST manual đang dùng, không quét lại TEST lịch sử.

Bằng chứng: [Mongo recovery](evidence/mongo-recovery.json), [probe cuối](evidence/runtime-final-readonly.json), [database safety](evidence/database-safety.json).

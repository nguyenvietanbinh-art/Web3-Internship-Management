# Kế hoạch đóng tuyển và hoàn lượt — 07/11/2026

Phạm vi được người dùng phê duyệt ở mục L/M. Thay đổi bổ sung tương thích bản ghi cũ, không chạy migration hoặc xóa dữ liệu.

- `usedOpportunities` giữ toàn bộ cơ hội đã từng ứng tuyển; unique application index giữ nguyên. Bỏ ràng buộc chiều dài lịch sử 3, giới hạn 3 áp dụng cho hiệu của lịch sử và các lượt hoàn.
- Thêm `refundedOpportunities` mặc định rỗng; bản ghi cũ coi là rỗng. Chỉ thêm khi hệ thống kết thúc hồ sơ vì cơ hội đã đủ chỉ tiêu.
- Application thêm trạng thái `closed_full`, thời điểm đóng/hoàn lượt và lý do. Opportunity thêm nguyên nhân đóng.
- Toàn bộ nhận chỗ cuối, đóng cơ hội, kết thúc hồ sơ và hoàn lượt trong transaction hiện có. Cùng kỳ được serialize qua revision của kỳ; counter và allocation vẫn có điều kiện atomic.
- Không refund cho tự rút/từ chối/đã có admission. Không tự mở khi giảm counter hoặc tăng capacity. Mở lại cần quyền doanh nghiệp, lý do, còn chỗ và kỳ đang cho phép.
- Test ghi trên DB mới `internova_role_qa_20261107`, replica set local 27018; không drop hoặc seed lại database gốc/hiện hành.
- Rollback triển khai: dừng ghi, đánh giá các bản ghi `closed_full`/refund đã phát sinh và phiên bản code. Không quay về code cũ tính lịch sử là lượt dùng mà bỏ dấu hoàn; không tự xóa trường hoặc lịch sử. Phục hồi phải bảo toàn idempotency và chỉ tiêu.

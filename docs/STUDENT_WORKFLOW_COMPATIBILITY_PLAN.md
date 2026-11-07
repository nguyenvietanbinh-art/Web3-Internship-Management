# Phương án tương thích trước thay đổi báo cáo sinh viên

Phạm vi được phê duyệt trong yêu cầu cập nhật trải nghiệm sinh viên ngày07/11/2026.

- Giữ collection, quan hệ phân công/kỳ, `kind=weekly|final`, API và lịch sử hiện có. Báo cáo tuần chuyển vị trí UI sang Công việc được giao, không chuyển/xóa dữ liệu. Nhật ký cũ vẫn tra cứu và phản hồi; không tạo thêm luồng tự nộp nhật ký mới bên cạnh báo cáo tuần.
- Sinh viên chỉ còn trang kết quả cuối kỳ ở menu Báo cáo kết quả. Các công cụ KPI chuyển sang Công việc được giao; các vai trò khác giữ quy trình cũ.
- Thay đổi hành vi có chủ đích trong **workflow theo kỳ**: đã nộp báo cáo cuối kỳ thì không nộp phiên bản mới, trừ khi trạng thái mới nhất là `need_revision`. Backend trả409 cho client cũ cố nộp lại trước yêu cầu bổ sung. Bài `approved` tiếp tục bị khóa như trước. Không thay hành vi legacy khi workflow tắt.
- Doanh nghiệp/giảng viên vẫn nhận xét độc lập, Admin chỉ chốt sau các điều kiện hiện có. Không bỏ bước duyệt để “gửi Admin”.
- Không migration/backfill hoặc cập nhật bài đã nộp. Thử toàn bộ hành vi ghi trên database TEST riêng; giữ snapshot trước/sau các bản cũ và CV đã ứng tuyển.
- Rollback source cần giữ mọi lịch sử/bài nộp mới; không xóa dữ liệu hoặc sửa điểm để quay về hành vi cũ. Có thể đưa vị trí UI về trước mà không chuyển collection; việc bỏ hạn chế nộp lại là thay đổi quy trình cần đánh giá riêng.

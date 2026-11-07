# Quy trình đánh giá giảng viên

1. Doanh nghiệp tạo task với mục tiêu, việc cần làm, sản phẩm, thời hạn và tiêu chí có trọng số. Task do giảng viên đề xuất phải được doanh nghiệp xác nhận tiêu chí.
2. Sinh viên lưu nháp/nộp kết quả và tệp. Mỗi lần nộp có phiên bản; nộp không tự tăng tiến độ. BERT chỉ tìm đoạn liên quan và phần thiếu bằng chứng.
3. Doanh nghiệp kiểm tra sản phẩm, ghi căn cứ cho từng tiêu chí. Tiến độ = tổng trọng số tiêu chí được xác nhận đạt / tổng trọng số. Resubmit cần xác nhận lại; lịch sử không mất. Tổng kỳ cân theo trọng số task, không cộng thêm vì báo cáo cùng task nhiều tuần.
4. Giảng viên mở bài, đọc trích đoạn, kiểm tra bằng chứng và lưu nháp riêng tư; không dùng cosine để chấm đúng/sai. Rubric mặc định 100: mục tiêu10, cách thực hiện20, kết quả25, bằng chứng20, tiến độ10, bài học10, trình bày5.
5. Mục chưa được kiểm tra để thiếu, không tự cho tối đa vì có từ khóa. Đề xuất có thể `total:null` khi thiếu căn cứ. Mức kiểm tra từng mục0–4 chuyển theo trọng số; tiến độ lấy phần doanh nghiệp xác nhận. Lưu riêng điểm đề xuất, điểm giảng viên, chênh lệch, lý do, rubricVersion, reportVersion, hash đầu vào và người/thời điểm xác nhận.
6. Nhà trường chọn rõ chính sách dùng điểm giảng viên hoặc trọng số hai bên (tổng100). Báo cáo mới không tự lấy trung bình. Chỉ công bố sau đủ review/KPI. Sinh viên không thấy điểm nháp hoặc bảng chấm riêng trước công bố.

API: `/core/report-rubrics`, `/core/report-rubrics/:batchId`, `.../proposals`, `/core/reports/:id/review-draft`, `.../evidence-checks`, `.../reviews`, `.../approve`. Bài đã duyệt không bị AI ghi đè điểm. Bài test thực tế xác nhận đề xuất77.5, giảng viên78.5, chênh1; browser độc lập xác nhận74 rồi Admin công bố74. Đây là hành động của tài khoản kiểm thử, không phải đánh giá chuyên gia độc lập.

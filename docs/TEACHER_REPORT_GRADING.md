> **Luồng mới: chấm trước, giảng viên kiểm tra — 07/11/2026:** Kết quả phân tích có điểm đề xuất 7 tiêu chí (official:false); giảng viên mở phiếu đã điền sẵn để sửa/xác nhận. Không tự lưu điểm; bài đầy đủ 82,33 và bài thiếu 32,84 trong lần thử API, báo cáo trước/sau không đổi. Chuẩn bị 6 bài mẫu thiếu và xuất 48 file đọc thử; thêm nút Xem bài báo cáo. 5 test chấm trước + 16 NLP + 5 phiếu chấm, lint/build PASS; browser NOT TESTED. [Hướng dẫn và giới hạn cách chấm](PROPOSED_REPORT_GRADING.md).
# Phiếu chấm báo cáo cho giảng viên

Ngày cập nhật: 07/11/2026. Giao diện dùng cách diễn đạt nghiệp vụ; không biến gợi ý tự động thành nhận xét do giảng viên xác nhận.

## Sử dụng

1. Mở http://localhost:5188/, Ctrl+F5 và đăng nhập giảng viên.
2. Trong **Phân tích báo cáo thực tập**, chọn báo cáo và bấm phân tích nếu cần gợi ý phần cần kiểm tra. Hai lựa chọn hiển thị là **Đối chiếu ý nghĩa nội dung** và **Đối chiếu từ ngữ trong báo cáo**.
3. Kết quả hiển thị tiến độ cần xem xét, gợi ý cho người hướng dẫn và lưu ý đọc lại nội dung. Không hiển thị tên thuật toán, điểm tương đồng hoặc độ tin cậy như điểm chấm.
4. Mở **Báo cáo & kết quả**, chọn bài mới nhất chưa chốt và bấm **Chấm điểm / nhận xét**.
5. Đọc bài, kiểm tra sản phẩm và bằng chứng; nhập điểm từng tiêu chí và căn cứ khi cần. Nếu chưa đủ căn cứ, chưa nhập điểm, trao đổi với sinh viên hoặc xem thêm bằng chứng; không tự cho 0 điểm chỉ vì ô đang trống.
6. Ghi nhận xét tổng thể: phần làm được, phần còn thiếu, nội dung cần sửa hoặc tài liệu cần bổ sung. Chọn kết quả đánh giá và xác nhận lưu.

## Tiêu chí

| Tiêu chí | Điểm |
| --- | ---: |
| Mục tiêu và yêu cầu đề tài | 10 |
| Phân tích và cách thực hiện | 20 |
| Kết quả và mức độ hoàn thành | 25 |
| Kiểm thử và bằng chứng | 20 |
| Tiến độ và quá trình thực tập | 10 |
| Khó khăn, bài học và cải tiến | 10 |
| Trình bày và nguồn tài liệu | 5 |

Tốt: 85–100% điểm từng tiêu chí; đạt: 65–84%; cần bổ sung: 40–64%; chưa đạt: dưới 40%. Đây là hướng dẫn chấm do dự án đề xuất, chưa được khẳng định là quy chế chính thức của nhà trường.

Tổng chỉ xuất hiện khi đủ bảy mục. Không điền sẵn điểm, không cộng/trừ dựa trên gợi ý, không tạo nhận xét như thể giảng viên đã kiểm tra sản phẩm. Số điểm quy đổi /10 chỉ để tham khảo, tổng /100 vẫn là giá trị lưu theo API hiện có.

## Lưu trữ và phạm vi

- Phiếu chấm dành cho vai trò giảng viên. Doanh nghiệp giữ biểu mẫu đánh giá hiện có; Admin giữ quy trình chốt sau hai đánh giá, không tự sửa cách lấy điểm trung bình.
- Giữ nguyên API `/core/reports/:id/reviews`, gửi `score`, `comment`, `decision`, `version` như trước. Chi tiết bảy tiêu chí, căn cứ và nhận xét được lưu dạng văn bản trong `comment`, không thêm trường/schema/migration.
- Backend tiếp tục kiểm quyền, quyền sở hữu, phiên bản, thang tổng điểm và trạng thái báo cáo như trước. Kiểm tra từng tiêu chí mới là hỗ trợ ở biểu mẫu, chưa là quy định riêng được Backend bắt buộc cho mọi API client.
- Những nhận xét và điểm cũ không được chuyển đổi hoặc ghi đè. Không tạo dữ liệu chấm điểm mới trong đợt thay đổi này.
- Kết quả tự động được ghi rõ đang thử với báo cáo giả lập, chưa được kiểm chứng với báo cáo thực tế; có thể gợi ý sai ngay cả khi bài đã được duyệt. Giữ cảnh báo nếu công cụ chỉ đọc được một phần báo cáo dài.

## Kiểm tra

- Frontend lint/build PASS; build output ignored `client/dist/teacher-grading`.
- Năm unit tests PASS: tổng trọng số 100 và số 0 được nhập tường minh; không quy ô thiếu thành 0; từ chối quá điểm/âm/số không hợp lệ; lưu chi tiết và nhận xét; giới hạn độ dài.
- Không chạy test ghi dữ liệu hoặc chấm thử vào database đang dùng.
- Browser E2E thao tác chấm/lưu sau thay đổi: NOT TESTED. Cần thử bằng báo cáo fixture riêng trước khi áp dụng quy trình chấm thực tế.

Files: `reports/gradingRubric.mjs`, `reports/ReviewForm.jsx`, `Reports.jsx`, `ReportAnalysisResult.jsx`, `AiPage.jsx`, `client/test/report-rubric.test.mjs`.

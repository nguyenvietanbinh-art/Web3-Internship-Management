# Báo cáo thực tập đầy đủ để thử phân tích

Ngày bổ sung: 07/11/2026. Database hiện tại: `internova_demo_cunhan_kysu_20261107`; website http://localhost:5188/.

## Nội dung đã bổ sung

48 báo cáo tổng hợp của 24 sinh viên đang thực tập/đã hoàn thành, thuộc 12 doanh nghiệp và 12 giảng viên. Mỗi sinh viên có một báo cáo tiến độ và một báo cáo tổng kết. Nhóm chưa đăng ký, chưa được nhận hoặc chưa bắt đầu kỳ không được tự tạo báo cáo như đã thực tập.

Mỗi bài có 10 mục: thông tin sinh viên/đề tài/kỳ; bối cảnh và mục tiêu; phạm vi và phương pháp; công việc đang có; sản phẩm; đối chiếu KPI; nhật ký và giờ làm; khó khăn; kế hoạch; tự đánh giá và giới hạn bằng chứng. Phần thông tin mở đầu và mục tiêu được đặt trước để mô hình thấy ngữ cảnh chính.

Nội dung dài 3.358–3.630 ký tự, lấy tên đề tài, kỳ, người hướng dẫn, trạng thái task/KPI, số nhật ký và tổng phút đã duyệt từ dữ liệu fixture liên quan. Không bịa đường dẫn sản phẩm, kết quả kiểm thử hoặc bằng chứng IPFS/blockchain. Điểm và đánh giá có sẵn là fixture được giữ nguyên, không phải do mô hình chấm.

## Cách thử

1. Mở website, đăng nhập `lecturer-1@example.invalid` bằng mật khẩu trong file login local.
2. Chọn **Phân tích báo cáo thực tập**.
3. Chọn phương pháp **TF-IDF** hoặc **Sentence-BERT**.
4. Trong **Báo cáo của sinh viên phụ trách**, chọn báo cáo của Nguyễn Hải Đăng (đang thực tập, email `2311000005@gmail.com`) hoặc Nguyễn Thu Giang (đã hoàn thành, email `2311000006@gmail.com`).
5. Bấm **Phân tích báo cáo**; xem cảnh báo theo quy tắc, các yếu tố liên quan và độ tương đồng với tiêu chí. Không diễn giải điểm tương đồng thành điểm báo cáo hoặc xác suất rủi ro.
6. Mở **Báo cáo & kết quả** để đọc toàn văn trước khi so sánh với kết quả mô hình.
7. Các giảng viên 2–12 cũng có bốn báo cáo đầy đủ của hai sinh viên tương ứng. Xem danh sách tài khoản và công đoạn tại [LIFECYCLE_EXAMPLES_20261107.md](LIFECYCLE_EXAMPLES_20261107.md).

## Kết quả thực tế

- Giảng viên 1 và 12 đăng nhập thành công, mỗi người thấy đủ bốn báo cáo đã bổ sung.
- Báo cáo đang nộp: TF-IDF HTTP 200, khoảng 79 ms; SBERT HTTP 200, khoảng 817 ms. Cảnh báo theo quy tắc `review` phù hợp với phiên giờ đang cần xử lý của fixture; không phải classifier dự đoán.
- Báo cáo đã duyệt: TF-IDF HTTP 200, khoảng 26 ms; SBERT HTTP 200, khoảng 345 ms. Kết quả `no_observed_rule_alert` chỉ nói không thấy các điều kiện cảnh báo hiện có, không chứng minh không có rủi ro.
- Đây là bốn lần đo đơn lẻ, không phải benchmark tải hoặc cam kết thời gian đáp ứng.
- SBERT với bài đang nộp: tổng 1.021 token, dùng 1.008 token, tám chunk, `truncated:true`. Kết quả chỉ bao phủ phần nội dung đã xử lý; phải đọc toàn văn và không khẳng định đã phân tích hết bài.
- SBERT với bài đã duyệt: 960/960 token, tám chunk, `truncated:false`.
- Cả hai trường hợp classifier vẫn `NOT_TRAINED`, confidence null. Không tự tạo nhãn chất lượng hoặc xác suất để làm đẹp kết quả.
- Browser E2E lần này: NOT TESTED. Không sửa source AI hoặc Frontend trong lần bổ sung nội dung.

## Bảo toàn dữ liệu

- Chỉ chọn báo cáo có lịch sử `fixture.report_prepared` thuộc run `school-year-examples-20261107`, phiên bản nội bộ chưa thay đổi và nội dung còn nguyên bản.
- Cả 48 báo cáo đủ điều kiện; không có bài người dùng đã sửa bị ghi đè. Một báo cáo ngoài nhóm mẫu được đối chiếu BSON và giữ nguyên.
- Chỉ cập nhật nội dung và ghi thêm lịch sử bổ sung fixture; giữ nguyên số phiên bản báo cáo nghiệp vụ, trạng thái, nhận xét, điểm, current và thông tin phê duyệt. Tăng phiên bản nội bộ để chống cập nhật dựa trên bản cũ.
- Cập nhật trong một transaction; không thay database gốc/import/demo cũ, không xóa dữ liệu, không deploy, không gọi dịch vụ AI bên ngoài.
- Script: `server/scripts/enrich-example-reports.cjs`; đã chạy, có guard chống chạy lại. Bản trước cập nhật và kết quả kiểm tra lưu trong thư mục cache đã được Git ignore.
- Ví dụ toàn văn local: `contracts/node_modules/.cache/workflow-combined-20261107/report-example.md`.

Không commit/push/merge.

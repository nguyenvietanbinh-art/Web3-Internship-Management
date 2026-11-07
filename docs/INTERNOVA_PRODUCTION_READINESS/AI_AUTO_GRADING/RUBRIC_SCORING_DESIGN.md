# Thiết kế thang100 và quy tắc

Lấy rubric DB của kỳ; nếu kỳ cũ chưa có thì dùng cấu hình v2 hiện hữu. Kỳ của Phúc được Admin TEST công bố chính rubric7mục đó, không thay trọng số: mục tiêu10, cách thực hiện20, kết quả25, bằng chứng20, tiến độ10, bài học10, trình bày5. Dùng levels0–4 của rubric, không tạo nhãn chuyên gia.

Mỗi mục trả maxScore/suggestedScore/scoringLevel/evidence/matchedRequirements/missingRequirements/explanation/confidenceStatus/evaluationStatus. Quy tắc công khai trong reportAutoScoring.js:

- Mục tiêu: vấn đề liên quan nhiệm vụ, phạm vi, sản phẩm, yêu cầu.
- Phương pháp: đầu vào/ra/thiết kế, cơ chế cụ thể, lý do/giới hạn, phần việc thực hiện.
- Kết quả: kết quả cụ thể, đối chiếu yêu cầu, tệp đúng phiên bản được công ty xác nhận, giới hạn.
- Bằng chứng: tệp đọc được/hashkhớp, ca kiểm tra/kết quả, nội dung kiểm thử trong tệp, xác nhận đúng phiên bản từ công ty.
- Bài học: khó khăn cụ thể, xử lý, bài học, kế hoạch.
- Trình bày: bố cục, nội dung nhiều mục, nguồn nhận diện được, trích dẫn/đường dẫn.

Số dấu hiệu phù hợp quyết định level=min(3,sốdấuhiệu). Không có dấu hiệu ->null. Thiếu liên hệ nhiệm vụ hoặc sản phẩm chưa xác nhận giới hạn mức1; chỉ có đoạn BERT rời rạc không có phần nội dung rõ giới hạn mức2. Tự động tối đa3/4 vì chưa xác minh chất lượng chuyên môn đầy đủ. Do đó trên rubric mặc định với tiến độ100, mức tối đa AI là77.5; giảng viên có thể nâng/hạ sau kiểm tra. Đây là giới hạn thiết kế công khai, không phải điểm được học từ giảng viên.

Tệp lỗi/hashsai ->NEEDS_REVIEW vànull ở kết quả/bằng chứng, không0. Rubric hint tùy chỉnh ngoài bộ quy tắc ->NEEDS_REVIEW cho mục đó, không giả vờ hiểu yêu cầu mới. Tổng chỉ có khi mọi mục đều có số. Câu lệnh yêu cầu cho100trong bài không thay trọng số/quy tắc. Không fetch URL hoặc chạy mã tệp người dùng.

Hạn chế: luật nhận diện cấu trúc/từ ngữ vẫn có thể bị diễn đạt mơ hồ đánh lừa; không thay thẩm định nội dung/sản phẩm. Tệp công ty xác nhận là căn cứ nghiệp vụ, không phải chứng minh tuyệt đối không gian lận. Đã giữ trích đoạn/hash/version và mức độ cần kiểm tra.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

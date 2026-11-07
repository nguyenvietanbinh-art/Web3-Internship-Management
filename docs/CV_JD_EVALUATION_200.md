# Thực nghiệm đối chiếu 200 CV với yêu cầu công việc — 07/11/2026

## Đã đưa vào đồ án

Thư mục [ai-service/datasets/cv-jd-reference-200-v1](../ai-service/datasets/cv-jd-reference-200-v1/README.md) có200 CV,20 yêu cầu công việc và4.000 đánh giá từng cặp. Mỗi CV có file đọc riêng; mỗi phiếu đối chiếu nêu điểm, căn cứ, kỹ năng thiếu và mức phù hợp theo cách người hướng dẫn xem xét hồ sơ. Có bảng chờ giảng viên kiểm tra, nhận xét và xác nhận; không tự điền danh tính hoặc chữ ký người đánh giá.

Nguồn là dữ liệu tổng hợp và nhãn theo quy tắc tham chiếu. Chưa có CV người thật, nhãn chuyên gia hoặc xác minh năng lực thực hành; không gọi đây là bộ nhãn độc lập. Không công bố một con số độ tin cậy cho sinh viên từ các kết quả này. Vai trò “giảng viên CNTT” được dùng để xây dựng thang xem xét, không phải chứng cứ đã có giảng viên thật xác nhận.

## Nội dung và thang đối chiếu

-10 hướng: Frontend, Backend, Java, QA, dữ liệu, Android, DevOps, bảo mật web, NLP, blockchain; mỗi hướng20 CV và2 JD.
- CV có mục tiêu, GPA mẫu, kỹ năng ít/nhiều, bài tập/mức hoàn thành, cách phối hợp, lịch tham gia và phần còn thiếu. Không tạo URL sản phẩm/chứng chỉ không tồn tại. Không dùng GPA để cộng điểm xếp hạng.
-100 điểm tham chiếu:40 kỹ năng bắt buộc,35 mô tả bài tập,15 định hướng,10 lịch tham gia. Đây là kiểm tra phù hợp trên khai báo, không phải điểm đánh giá thực hành.
- Mức0:chưa phù hợp;1:thiếu yêu cầu trọng yếu;2:phù hợp phần lớn;3:phù hợp trực tiếp trên thông tin khai báo. Điều kiện và công thức đầy đủ tại README của bộ dữ liệu.
-253/4.000 cặp đạt mức2–3.150 CV có ít nhất một JD đạt mức2–3;50 CV chưa đủ điều kiện cho các JD trong catalog. Không xóa50 CV này để nâng metrics.
-120/40/40 CV chia train/validation/test theo family. Lần này không fit hoặc tune model. Cùng mẫu câu và catalog JD vẫn được dùng giữa các split; không gọi đây là held-out độc lập về miền dữ liệu.

## Kết quả gọi AI thật

Gọi tuần tự API local `http://127.0.0.1:8003/api/v1/nlp/rank`, cùng CV/JD/labels cho cả hai phương pháp.400 request thành công:200 TF-IDF và200 Sentence-BERT, mỗi request xếp đủ20 JD. Không mock, fallback, gửi cloud hoặc tạo phần trăm tin cậy. Model thật: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, backend ONNX CPU int8. Không tải model mới hoặc huấn luyện lại.

| Phạm vi | Phương pháp | Precision@5 | Recall@5 | MAP | NDCG@5 | Thời gian TB/request |
|---|---|---:|---:|---:|---:|---:|
|150 CV có JD phù hợp trên toàn tập|TF-IDF|0,3373|1,0000|1,0000|0,9938|19,51ms|
|150 CV có JD phù hợp trên toàn tập|Sentence-BERT|0,3240|0,9467|0,8258|0,8754|68,04ms|
|30 CV có JD phù hợp trong40 CV test|TF-IDF|0,3333|1,0000|1,0000|0,9939|19,21ms|
|30 CV có JD phù hợp trong40 CV test|Sentence-BERT|0,3200|0,9500|0,8028|0,8618|66,84ms|

10 CV test còn lại không có nhãn phù hợp; vẫn inference đầy đủ và báo riêng. Mẫu số Recall/MAP bằng0 ở những CV này nên không gộp vào trung bình chất lượng có nhãn phù hợp; không diễn giải các metrics trên là chất lượng cả200 CV không điều kiện. Precision chia5; vì thường chỉ có1–2 JD phù hợp nên tối đa thực tế của một CV có thể thấp hơn1. NDCG dùng mức0–3, P/R/MAP dùng ngưỡng nhãn≥2. Không lấy cosine BERT cao hơn cosine TF-IDF để kết luận chính xác hơn.

**Nhận định:** TF-IDF tốt hơn trên bộ này. Văn bản và nhãn cùng được tạo theo danh mục kỹ năng/mẫu câu, làm bài toán thuận lợi cho phương pháp từ khóa. MAP1,0 của TF-IDF không phải chứng minh độ chính xác100% ngoài thực tế. Không chỉnh nhãn, xóa lỗi hay đổi trọng số để đưa BERT lên đầu. Cần người đánh giá độc lập và dữ liệu đa dạng hơn trước nghiệm thu chất lượng thực tế.

Model đã nạp, có cache khi đo; không phải thời gian khởi động lạnh hoặc hiệu năng nhiều người đồng thời. Không có CV bị cắt nội dung trong lượt chạy này. Các CV thiếu điều kiện vẫn nhận danh sách xếp hạng vì API hiện làm retrieval, không có quyết định tuyển dụng/từ chối; không dùng top1 thay cho kiểm điều kiện bắt buộc.

## File để bạn xem

1. [CV-004](../ai-service/datasets/cv-jd-reference-200-v1/cvs/CV-004.md): mẫu có bài tập giao diện và nhiều kỹ năng; [phiếu đối chiếu](../ai-service/datasets/cv-jd-reference-200-v1/reviews/CV-004.md).
2. [CV-001](../ai-service/datasets/cv-jd-reference-200-v1/cvs/CV-001.md): hồ sơ ít kỹ năng, chưa có bài tập hoàn chỉnh; [phiếu đối chiếu](../ai-service/datasets/cv-jd-reference-200-v1/reviews/CV-001.md).
3. [Kết quả và top1 của200 CV](../ai-service/datasets/cv-jd-reference-200-v1/evaluation-20261107/RESULTS.md).
4. [Bảng4.000 cặp với điểm và thứ hạng thật](../ai-service/datasets/cv-jd-reference-200-v1/evaluation-20261107/pair-comparison.csv): mở bằng Excel/LibreOffice; CSV UTF-8 BOM để đọc tiếng Việt.
5. [Phiếu chờ người đánh giá](../ai-service/datasets/cv-jd-reference-200-v1/human-review.csv): chỉ có ID, các ô người chấm/điểm/lý do/thời gian để trống. Đọc và chấm độc lập trước khi xem kết quả máy.
6. `evaluation-20261107/metrics.json`, `predictions.jsonl`: số liệu chưa làm tròn, model/revision, từng thứ hạng và coverage. `manifest.json` chứa hash nguồn để kiểm lại.

## Code và kiểm thử

- `evaluation/build_cv_reference.py`: tạo dữ liệu và phiếu, deterministic, từ chối ghi đè thư mục đã có.
- `evaluation/evaluate_cv_reference.py`: xác minh hash/nguồn, chỉ gọi loopback API, ghi đủ ranking từng CV; lỗi thật được ghi PARTIAL/BLOCKED, không giả inference.
- `evaluation/summarize_cv_reference.py`: CSV đối chiếu và báo cáo từ kết quả thật, không thay cosine/nhãn.
- `tests/test_cv_reference.py`:4/4 PASS về số lượng/tính nhất quán4000 cặp, nhóm split, công thức P/R/MAP và chặn nhãn tổng hợp bị dùng như nhãn độc lập.
- Hồi quy `tests/test_nlp.py`:16/16 PASS; các kiểm tra TF-IDF thật, validation, công thức metrics, guard model và phân biệt rules/classifier giữ nguyên. Không cần build Frontend vì đợt này không sửa UI hoặc code runtime.
- Lệnh unittest ban đầu bị trùng package `tests` với thư viện ngoài có sẵn và báo thiếu torch; đã dùng `unittest discover -s tests` đúng thư mục, không cài torch hoặc đổi môi trường.
- `evaluation/evaluate.py`, validator nhãn chuyên gia và runtime matching/UI **không sửa**. Bộ dữ liệu này không vượt guard của quy trình nghiệm thu độc lập.

Không ghi MongoDB, thêm tài khoản, đổi mật khẩu/CV/bài nộp/điểm đã chốt, tạo `.env`, cài dependency hoặc deploy. Không commit/push. Chỉ thêm file dữ liệu, script kiểm tra và tài liệu; website tiếp tục dùng pipeline hiện có, không hiển thị metrics này như độ tin cậy của người dùng thật.

## Trạng thái nghiệm thu

**PASS:** tạo bộ200 CV/20 JD/4000 cặp, chạy TF-IDF/SBERT thật toàn bộ, xuất kết quả có căn cứ và kiểm tra nhất quán.

**PARTIAL:** chất lượng gợi ý theo tham chiếu tổng hợp; có thiên lệch từ cách tạo dữ liệu và chưa xác minh năng lực.

**BLOCKED đối với nghiệm thu nhãn chuyên gia:** chưa có đánh giá được người có chuyên môn xác nhận. Bước tiếp theo là đọc/chấm độc lập, xử lý bất đồng, tạo bản nhãn có nguồn xác nhận thực tế rồi chạy evaluator nghiệm thu. Không cần huấn luyện lại BERT chỉ để có kết quả cao hơn trên bộ tổng hợp này.

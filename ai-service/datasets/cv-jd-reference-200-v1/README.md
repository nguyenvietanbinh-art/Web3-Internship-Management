# Bộ đối chiếu CV–đề tài CNTT: 200 CV, 20 JD

## Mục đích và nguồn

Bộ dữ liệu gốc do công cụ tạo, mô phỏng hồ sơ sinh viên để thử chức năng gợi ý của Internova; không sao chép CV cá nhân từ website, không có người thật hoặc chứng chỉ/sản phẩm được xác minh. Nhận xét dùng thang chấm tham chiếu bên dưới, **không có người chấm chuyên môn độc lập xác nhận**. Không dùng danh xưng giảng viên để thay cho bằng chứng xác nhận. Có thể dùng làm thực nghiệm có nêu giới hạn trong đồ án và chuẩn bị phiếu cho giảng viên duyệt.

Không huấn luyện lại BERT, không sửa điểm hoặc sinh viên trên MongoDB, không thay thuật toán xếp hạng production để làm đẹp kết quả. Không dùng bộ1.000 báo cáo thực tập làm nhãn CV/JD.

## Nội dung

| File/thư mục | Nội dung |
|---|---|
| `cvs/` |200 CV Markdown có mục tiêu, học vấn, kỹ năng, bài tập, phối hợp và lịch tham gia |
| `cvs.jsonl` |200 CV có cấu trúc, split và group_id |
| `jobs.jsonl` |20 yêu cầu công việc;2 JD cho mỗi hướng |
| `reviews/` |200 phiếu đọc, mỗi phiếu đối chiếu20 JD và giải thích điểm |
| `reference-judgments.jsonl` |4.000 cặp với điểm thành phần, mức phù hợp, kỹ năng đáp ứng/thiếu, căn cứ |
| `human-review.csv` |4.000 dòng chờ người đánh giá điền; không tự điền tên giảng viên hoặc điểm xác nhận |
| `manifest.json` |Nguồn gốc, SHA-256 file nguồn, số lượng và giới hạn |
| `evaluation-20261107/RESULTS.md` |Metrics và top1 của200 CV chạy qua API TF-IDF/SBERT thật |
| `evaluation-20261107/pair-comparison.csv` |Điểm tham chiếu, cosine và thứ hạng của cả hai phương pháp cho4.000 cặp |

10 hướng: Frontend, Backend Node.js, Java, QA, dữ liệu, Android, DevOps, an toàn web, NLP và blockchain. Mỗi hướng20 CV, có người mới học/thiếu kỹ năng và người có bài tập phù hợp hơn. Không dùng mức GPA, tên, tuổi hoặc giới tính để cộng điểm phù hợp.

## Thang tham chiếu 100 điểm

| Tiêu chí | Điểm | Căn cứ có thể kiểm |
|---|---:|---|
| Kỹ năng bắt buộc |40|Tỷ lệ kỹ năng khai báo giao với yêu cầu JD; không chứng minh trình độ |
| Mô tả bài tập đúng hướng |35|0 khi không có;18 khi mới nháp;35 khi mô tả phần thực hiện và cách tự kiểm tra; chưa xác minh sản phẩm |
| Định hướng chuyên môn |15|Cùng hướng CV/JD; trường phân nhóm của kịch bản, không phải suy luận độc lập |
| Lịch tham gia |10|Số ngày có thể tham gia đáp ứng lịch JD |

- **Mức3:** tổng≥75, đáp ứng≥75% kỹ năng bắt buộc và có mô tả bài tập cùng hướng.
- **Mức2:** tổng≥55, đáp ứng≥50% kỹ năng bắt buộc và có mô tả bài tập cùng hướng.
- **Mức1:** còn liên quan nhưng chưa đạt hai mức trên, tổng≥30.
- **Mức0:** còn lại.

Các điểm này dùng để làm căn cứ tham chiếu, không phải điểm tuyển dụng chính thức hoặc xác suất. Mức2–3 là phù hợp khi tính Precision/Recall/MAP; NDCG xét đầy đủ mức0–3. Không chấm phẩm chất “siêng năng” chỉ vì CV có nhắc đến.

## Tính độc lập và giới hạn

200 CV chia120 train,40 validation,40 test theo family trong từng hướng. Không có huấn luyện trong lần chạy này; tên split để giữ quy ước cho các thực nghiệm sau. Cùng family không đi qua nhiều split, nhưng **các split vẫn dùng chung mẫu câu và danh mục JD**. Đây là đánh giá trong kịch bản tổng hợp, chưa phải đánh giá độc lập theo miền dữ liệu/người thật.

Nhãn và văn bản cùng sinh từ một danh mục kỹ năng, làm TF-IDF có lợi thế rõ. Không dùng score của mô hình làm nhãn, nhưng cách sinh vẫn thiên lệch. Bộ này có50 CV chưa đủ điều kiện với bất kỳ JD nào; vẫn gọi AI cho chúng và báo riêng, không âm thầm loại. Trong150 CV còn lại thường chỉ có1–2 JD phù hợp, vì vậy đọc P@5 cùng Recall/MAP. Không tự chọn ngưỡng nhận/rớt sinh viên từ kết quả này.

Để đánh giá độc lập: nhờ giảng viên/người tuyển dụng đọc CV và JD, chấm riêng không xem kết quả máy, lưu người chấm/thời điểm/căn cứ và xử lý bất đồng; nếu dùng CV thật cần quyền sử dụng và ẩn dữ liệu cá nhân. Evaluator `evaluation.evaluate` hiện có vẫn yêu cầu nhãn độc lập, **không bị nới guard** để nhận bộ tham chiếu này.

## Chạy lại an toàn

Từ `ai-service`, dùng Python đã có; không cài dependency. AI local8003 phải đang chạy mô hình đã duyệt. Lệnh chỉ gọi endpoint xếp hạng trên localhost, không đọc/ghi MongoDB, không gửi ra cloud:

```powershell
python -B -m unittest discover -s tests -p test_cv_reference.py -v
python -B -m evaluation.evaluate_cv_reference --dataset datasets/cv-jd-reference-200-v1 --output ../contracts/node_modules/.cache/cv-jd-reference-200-20261107/run-02 --base http://127.0.0.1:8003 --k 5
```

Thư mục output phải mới; nếu đã có thì chọn tên khác. Không chạy lại generator để thay bản hiện tại. Generator `evaluation/build_cv_reference.py` từ chối ghi đè thư mục dữ liệu. Evaluator kiểm hash nguồn trước chạy, giữ guard tài nguyên của service; lỗi được ghi BLOCKED/PARTIAL thay vì tự fallback. Không cần import200 CV vào database đang sử dụng để mở kết quả thực nghiệm.

# Vietnamese synthetic internship reports v1

Bộ dữ liệu tự viết để minh họa pipeline phân loại báo cáo thực tập, không phải hồ sơ sinh viên thật. Không dùng làm tập nghiệm thu chất lượng AI trên người thật.

## Tham khảo công khai

- [Open University Learning Analytics Dataset — OU Analyse](https://research.stem.open.ac.uk/ouanalyse/dataset/): tham khảo ý tưởng liên kết sinh viên, khóa/kỳ, đánh giá và hoạt động học tập.
- [Bài báo mô tả OULAD](https://pmc.ncbi.nlm.nih.gov/articles/PMC5704676/): nguồn mô tả dữ liệu học tập có cấu trúc.

OULAD không được dùng như nguồn báo cáo thực tập tiếng Việt hoặc nhãn rủi ro cho bộ này. Không tải/copy record OULAD, không cào CV và không dùng thông tin cá nhân thực. Đây là lựa chọn thiết kế của dự án dựa trên cấu trúc tham khảo, không phải bản chuyển đổi OULAD.

## File

- `reports.jsonl`: 240 báo cáo, mỗi dòng một JSON. Mở trong VS Code để xem; không import vào MongoDB.
- `manifest.json`: nguồn gốc tổng hợp, số lượng, SHA-256 và giới hạn sử dụng.
- Mã sinh: `training/build_synthetic.py`, seed cố định `20261107`. Script không ghi đè thư mục đã tồn tại.

## Cấu trúc

| Trường | Ý nghĩa |
| --- | --- |
| id | Mã báo cáo giả lập |
| student_id | Khóa nhóm, không được dùng làm feature |
| split | train / validation / test |
| report_text | Nội dung báo cáo tiếng Việt |
| features | Task, phiên giờ chưa hoàn tất, phút được duyệt, số phiên bản tại thời điểm báo cáo |
| label | Nhãn do người viết kịch bản quy định |
| label_source | Luôn `scenario-generator-not-expert` |
| synthetic | Luôn true |
| scenario, label_rationale | Dùng để kiểm tra cách sinh nhãn, không được đưa vào feature huấn luyện |

Hai nhãn minh họa:

- `on_track`: tình huống có kế hoạch và tiến độ tương đối rõ, chưa thấy nhu cầu can thiệp trong kịch bản.
- `needs_support`: tình huống cần người hướng dẫn làm rõ hoặc hỗ trợ; không đồng nghĩa vi phạm, kém năng lực hay kỷ luật.

Tám tình huống: tiến độ bình thường, tắc tích hợp API, việc quá hạn, giờ làm chưa duyệt nhưng công việc vẫn tiến triển, báo cáo thiếu minh chứng, đã giải quyết khó khăn, chưa liên hệ được người hỗ trợ và đang kiểm thử.

120 sinh viên, hai báo cáo/người. Train 144 bài/72 sinh viên, validation 48/24, test 48/24. Mỗi tập cân bằng hai nhãn. Không dùng giới tính, dân tộc, tên hoặc điểm cuối kỳ làm feature.

## Giới hạn bắt buộc

- Nhãn là quyết định của generator, chưa được giảng viên đánh giá độc lập. Không gọi là ground truth thực tế.
- Chia tập theo sinh viên, chặn trùng văn bản chính xác, nhưng các tập vẫn chia sẻ khuôn câu/tình huống. Điểm thử cao chủ yếu thể hiện học được quy tắc sinh dữ liệu.
- Không tương đương tập đa doanh nghiệp độc lập hoặc tập dữ liệu thực tế theo thời gian. Không chứng minh hiệu quả phát hiện rủi ro thực tập.
- Không đặt `synthetic=false` hoặc sửa nguồn nhãn thành chuyên gia để qua guard. Muốn nghiệm thu phải xây tập dữ liệu riêng có phép sử dụng, quy tắc nhãn, annotator và kiểm tra độc lập.

## Chạy thử trên Windows PowerShell

Tại thư mục repository:

```powershell
Set-Location ai-service
python -B -m unittest discover -s tests -p test_training_experiment.py
python -B -m training.experiment --dataset datasets/synthetic-internship-v1/reports.jsonl --output ../contracts/node_modules/.cache/risk-training-next/tfidf --engine tfidf --allow-synthetic-experiment
```

Không tự cài dependency. Script dùng NumPy/scikit-learn/SciPy đã có; nếu máy nhóm chưa có thì cài trong môi trường Python riêng theo hướng dẫn dự án. Đổi tên thư mục output cho lần thử mới vì script từ chối ghi đè.

Engine `sbert` dùng encoder ONNX hiện có, đóng băng model và huấn luyện Logistic Regression trên embedding cùng feature nghiệp vụ. **Đó không phải fine-tune trọng số BERT.** Cần cấu hình `NLP_MODEL_DIR`, `PYTHONPATH` trỏ runtime đã cài cô lập và đạt guard RAM hiện có; không tự tải model hoặc hạ guard. Báo cáo dài bị cắt sẽ có coverage trong kết quả.

`metrics.json` lưu precision/recall/F1, confusion matrix trên validation/test, và luôn đánh dấu `SYNTHETIC_EXPERIMENT_ONLY`, `acceptance:false`, `deployable:false`. File tham số JSON chỉ để thử nghiệm offline; website không tự nạp nó. Không công bố probability như confidence đã hiệu chuẩn.

## Lần kiểm tra 07/11/2026

- Generator đã chạy: 240 bài, manifest checksum đã sinh.
- Năm test: PASS; kiểm tra bắt buộc khai báo synthetic, chống lẫn sinh viên/trùng văn bản giữa tập, không giả provenance.
- TF-IDF + Logistic Regression: đã fit và tính metrics thực tế, output local `contracts/node_modules/.cache/risk-training-20261107/tfidf`.
- SBERT experiment: chưa chạy; lúc kiểm tra RAM trống 811,65 MiB, thấp hơn ngưỡng 1.024 MiB. Không lấy điểm TF-IDF làm kết quả BERT.
- Lệnh test dạng `tests.test_training_experiment` ban đầu đụng package `tests` toàn cục của môi trường Python, đã chuyển sang unittest discovery như trên; không cài torch hoặc sửa Python global.
- Không sửa database, nhãn thật, API AI đang chạy hoặc trạng thái classifier của website.

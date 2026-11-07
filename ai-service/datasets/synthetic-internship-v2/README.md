# 1.000 báo cáo thực tập tổng hợp

- 500 sinh viên giả lập, mỗi người hai bài; 600 train / 200 validation / 200 test.
- Hai nhãn cân bằng: `on_track`, `needs_support`, do kịch bản sinh dữ liệu quyết định.
- Không có báo cáo người thật, nhãn chuyên gia, dữ liệu cào hoặc CV cá nhân.
- Chia theo sinh viên và kiểm trùng văn bản; các tập vẫn chia sẻ khuôn tình huống nên không phải đánh giá khả năng khái quát hóa ngoài đời.
- Nguồn tham khảo cấu trúc và giới hạn: [dataset v1](../synthetic-internship-v1/README.md).
- Website local có thể thử classifier TF-IDF + Logistic Regression với cờ opt-in; xem [hướng dẫn tích hợp và bằng chứng](../../../docs/SYNTHETIC_CLASSIFIER_INTEGRATION.md).

Sinh dataset từ thư mục `ai-service` (chỉ khi thư mục v2 chưa có, không xóa thư mục hiện tại để chạy lại):

```powershell
python -B -m training.build_synthetic --students 500 --name synthetic-internship-v2
```

Huấn luyện experiment offline, output mới chưa tồn tại:

```powershell
python -B -m training.experiment --dataset datasets/synthetic-internship-v2/reports.jsonl --output ../contracts/node_modules/.cache/risk-training-next/tfidf-1000 --engine tfidf --allow-synthetic-experiment
```

Không gọi metrics của bộ này là độ chính xác trên sinh viên thật. Không tự sửa `synthetic`, `acceptance` hoặc nguồn nhãn để biến experiment thành mô hình được nghiệm thu.

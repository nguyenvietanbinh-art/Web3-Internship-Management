# Tích hợp classifier thử nghiệm vào phân tích báo cáo

Ngày: 07/11/2026. Trạng thái: **chạy local thành công, chưa nghiệm thu chất lượng dự đoán trên dữ liệu thực tế**.

## Mô hình thực sự dùng

- Đối chiếu báo cáo–tiêu chí: giữ Sentence-BERT ONNX multilingual hoặc TF-IDF theo lựa chọn giao diện.
- Classifier hỗ trợ: **TF-IDF + Logistic Regression**, huấn luyện offline từ `synthetic-internship-v2`: 1.000 bài tổng hợp, 600 train, 200 validation, 200 test. Không fine-tune BERT.
- Hai nhãn theo kịch bản: `on_track`, `needs_support`. Không phải nhãn do giảng viên xác nhận, không phải chẩn đoán rủi ro.
- Classifier luôn ghi `EXPERIMENTAL_SYNTHETIC`, `real_world_validated:false`, `confidence:null`. Quality metrics của API vẫn null. Không đưa điểm synthetic thành độ chính xác website trên sinh viên thật.
- Tham số offline gốc giữ `deployable:false`. Người dùng đã yêu cầu áp dụng nên bổ sung đường nạp **chỉ để trình diễn local, bật tường minh**, không đổi thành model được nghiệm thu.

## Luồng

`Giảng viên → Backend kiểm quyền/phạm vi → AI local → (cảnh báo quy tắc + classifier tổng hợp + đối chiếu ngữ nghĩa) → giao diện`

Không ghi kết quả vào MongoDB, không tự đánh giá hoặc chốt điểm. Cảnh báo quy tắc được trả độc lập, không thay bằng classifier. Chọn SBERT chỉ đổi phương pháp đối chiếu ngữ nghĩa; classifier vẫn TF-IDF + Logistic Regression.

## Cách thử trên website

1. Mở http://localhost:5188/ và Ctrl+F5.
2. Đăng nhập `lecturer-1@example.invalid` bằng mật khẩu file local.
3. Chọn **Phân tích báo cáo thực tập**, chọn báo cáo sinh viên phụ trách và bấm **Phân tích báo cáo**.
4. Kết quả có ba phần:
   - **Cảnh báo từ dữ liệu tiến độ**: quy tắc về task và phiên giờ.
   - **Nhận định từ mô hình thử nghiệm**: nhãn thử nghiệm, nguồn dữ liệu tổng hợp và giới hạn.
   - **Đối chiếu nội dung với tiêu chí**: cosine theo engine được chọn; cảnh báo nếu BERT chỉ xử lý một phần bài dài.

Không diễn giải `on_track` thành đảm bảo không có rủi ro, hoặc `needs_support` thành kết luận sinh viên có vấn đề. Cần xem nội dung và tiến độ thực tế.

## Bật/tắt và chạy lại

AI local hiện đã khởi động lại ở 127.0.0.1:8003 bằng script:

```powershell
powershell -NoProfile -File scripts/demo/start-synthetic-ai.ps1
```

Chạy từ thư mục repo, chỉ khi cổng 8003 trống; không chạy lệnh này nhiều lần. Script không tự dừng ứng dụng khác, không cài/tải model và không tạo .env.

Biến môi trường chỉ trong tiến trình AI:

- `NLP_ALLOW_SYNTHETIC_CLASSIFIER=true`: đồng ý bật classifier tổng hợp.
- `NLP_RISK_MODEL_FILE`: artifact local `contracts/node_modules/.cache/risk-training-20261107/tfidf-1000/local-classifier.json`.
- `NLP_RISK_MODEL_SHA256`: hash đã pin của artifact. Script từ chối artifact khác hash.
- Giữ `NLP_MODEL_DIR` và `PYTHONPATH` trỏ model/runtime ONNX đã cài cô lập.

Không có flag hoặc không có đường dẫn: `NOT_TRAINED`, prediction null. Artifact thiếu/sai hash/sai schema: `UNAVAILABLE`, prediction null; đối chiếu và quy tắc vẫn hoạt động, không giả kết quả thành công.

Artifact chỉ là JSON, không dùng pickle. Kiểm kích thước, SHA-256, nguồn synthetic, số mẫu, class, kích thước vector, số hữu hạn và scaler trước suy luận. Không tự activate model chỉ vì có file trong thư mục.

Máy thành viên chưa có artifact: cần chạy pipeline offline ghi trong `ai-service/datasets/synthetic-internship-v1/README.md`, đổi dataset thành v2 và output thành `tfidf-1000`, sau đó `python -B -m training.prepare_local_classifier` từ `ai-service`. Hash được launcher pin để yêu cầu rà soát khi artifact thay đổi; không tự bỏ kiểm tra hash hoặc tải artifact không rõ nguồn.

## Bằng chứng thực tế

- 16 test NLP hiện có PASS khi không bật classifier.
- 6 test dataset/training safety PASS.
- 4 test classifier PASS: mặc định tắt, hash sai không dự đoán, 200 bài held-out tái tạo đúng confusion matrix của mô hình offline, API giữ riêng classifier và cảnh báo quy tắc.
- Lint/build Frontend PASS, output ignored `client/dist/synthetic-classifier-integration`.
- Đúng AI Python local 8003 cũ được xác minh rồi restart; không dừng MongoDB/Backend/Frontend.
- Hai tài khoản giảng viên 1/12 đăng nhập và thấy đủ bốn báo cáo/người.
- Qua Backend, báo cáo đang nộp và đã duyệt được gọi với cả TF-IDF và SBERT: bốn lần HTTP 200, classifier `EXPERIMENTAL_SYNTHETIC`, prediction `needs_support`, confidence null.
- BERT vẫn inference thật: một bài 1.008/1.021 token nên có `truncated:true`, bài khác 960/960 không cắt.
- Browser E2E sau thay đổi giao diện này: NOT TESTED. Không coi build/API test là bằng chứng đã kiểm mọi thao tác trình duyệt.

## Giới hạn đã quan sát

Classifier gợi ý hỗ trợ cả báo cáo mẫu đã duyệt có task/KPI hoàn thành. Không có nhãn chuyên gia cho bài này để định lượng đúng/sai, nhưng kết quả cho thấy không thể dùng synthetic model để thay thế đánh giá nghiệp vụ. Không sửa nhãn hoặc che kết quả để demo đẹp hơn. Cảnh báo quy tắc trên cùng bài vẫn `no_observed_rule_alert`, hai kết quả được hiển thị riêng.

Các khuôn văn bản xuất hiện trong cả train/test nên metrics synthetic có thể cao dù không chuyển được sang báo cáo dài ngoài bộ sinh. Chưa có phép hiệu chuẩn confidence hay benchmark độc lập. Muốn nghiệm thu cần dữ liệu báo cáo thực tập được phép sử dụng, nhãn giảng viên, tập test độc lập theo sinh viên/thời gian và so sánh có kiểm soát.

## File liên quan

- `ai-service/nlp/risk_classifier.py`: nạp mô hình và suy luận opt-in.
- `ai-service/nlp/risk.py`, `nlp/api.py`: tích hợp kết quả/status.
- `ai-service/training/prepare_local_classifier.py`: đóng gói mô hình từ experiment đúng nguồn.
- `ai-service/tests/test_local_risk_classifier.py`: kiểm thử an toàn/parity/API.
- `client/src/components/business/ReportAnalysisResult.jsx`, `AiPage.jsx`: kết quả tách riêng và cảnh báo coverage.
- `scripts/demo/start-synthetic-ai.ps1`: chạy local với flags/hash đã pin.

Không đổi schema, dữ liệu nghiệp vụ, quyền giảng viên, .env, dependency hoặc weights BERT. Không commit/push/merge.

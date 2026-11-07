# Kết quả kiểm thử

- Backend: **29/29PASS** (7unit luật;5integration gồm10tình huốngBERT;15integration tiến độ/báo cáo;1role gate và1test mã hóa snapshot).
- Browserbốn vai trò: **8/8PASS**, gồm student nộp → phân tích → công ty yêu cầu bổ sung → nộp lại → mentor điều chỉnh/nháp/xác nhận → Admin công bố74theoquyđịnh, không lấy điểmAIthay điểmgiảngviên.
- BrowserPhúc: **4/4PASS**, self80/AI77.5/officialnull,7dòng5cột, xemtríchđoạn, dùngđiểm/sửa/nháp, desktop/tablet/mobile/dark.
- Frontendunit10/10; lint/buildPASS. Snapshot encryption roundtrip/wrongkey/tamper1/1PASS.

| Ca BERT thật | Tổng AI | Kết quả |
| --- | ---: | --- |
| full | 77.5 | PASS |
| missing-results | 71.25 | PASS |
| missing-evidence | 72.5 | PASS |
| repeats-assignment | Chưa đủ căn cứ | PASS |
| unrelated | Chưa đủ căn cứ | PASS |
| rubric-copy | 33.75 | PASS |
| paraphrase | 77.5 | PASS |
| prompt-injection | 77.5 | PASS |
| unreadable-file | Chưa đủ căn cứ | PASS |
| modified-report | 77.5 | PASS |

Không phải metrics độ chính xác. Không có điểm giảng viên độc lập để MAE/kappa/calibration; BLOCKED về kiểm định đó. APIraceinitialhai yêu cầu chungidempotencyKey chỉ1record; lỗiAI giữ nguyênbài; quyền sai bị403/404; rubricđổiSTALEvàkhôngxácnhậnsnapshotcũ; need_revision khôngdựngđiểm0; nộplạigiữbảncũ.

Các lần lỗi và sửa không che: harness nạp schema trước UserIDflag làm400 (sửa thứ tựsetup); kiểm chất lượng phát hiện điểm khi thiếu kết quả không giảm (giới hạn trích đoạn rời rạc); MODEL_BUSY do tranh encoder (retryhữuhạn); APIoldPOSTtrảreadonlyproposal thay409 (chuyểnGETlịch sử); Admin UI crash vì thiếu grading.proposed bị ẩn (sửa render chỉ điểm xác nhận). Log cũ giữ cache. Tất cả lần cuối nêu trên PASS; không đổi test thành nhận lỗi là thành công.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

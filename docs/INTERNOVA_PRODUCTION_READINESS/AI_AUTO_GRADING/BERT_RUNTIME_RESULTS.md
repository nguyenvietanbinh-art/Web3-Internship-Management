# BERT runtime

BERT thật đang ready trong process Python29100 trên port8003; đo đúng1processuvicorn (không đếm PowerShell kiểm tra). Không restart/nạp thêm encoder/Python trong đợt chấm. Encoder dùng Lock, một ONNX session, LRU128embedding/TTL600giây; cold-load cần1GiBavailable, inference256MiB. Backend giới hạn2NLPrequest, cache/single-flight giảm trùng; retrybusy tối đa5lần trong ngân sách15giây. Không hạ guard hoặc tắt MongoDB/frontend để đủ RAM.

Số đo fresh nằm trong evidence/bert-runtime.json, available RAM khoảng1.7GiB tại lúc đo. Working set và private memory được lưu riêng; không gọi RSS là toàn bộ RAM model. Không có thử tải kéo dài để kết luận không memory leak; phần đó NOT TESTED. Có inference thật trong28test,10tình huống và E2E; lỗi kết nối được kiểm fail-closed, không fallback giả sangTF-IDF.

BERT chỉ truy xuất tối đa40đoạn; coverage/truncated được giữ. Bộ luật đọc nội dung parse và trích đoạn nguồn, không tuyên bố model đã hiểu/xác minh mọi sản phẩm. Tệp20k hoặc quá3tệp đánh dấu cần xem đầy đủ. Không gửi CV/bài cá nhân ra ngoài máy.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

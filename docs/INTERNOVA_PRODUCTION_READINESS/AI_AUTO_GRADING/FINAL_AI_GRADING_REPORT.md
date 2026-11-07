# Nghiệm thu AI chấm sơ bộ

Đã triển khai bộ chấm có quy tắc công khai kết hợp BERTtruy xuấtbằngchứng. **Phúc77.5/100; tựchấm80; officialnull.** Không fine-tune BERTgiả, không similaritynhânđiểm, không tự cho100, không lấy10tiếnđộ làm90nội dung. Giảng viên có thể sửa/nháp/yêu cầu bổ sung/xác nhận; Admin chốt đúngquytrình. Snapshot trước không bị ghiđè.

PASS: modelthật; bài và tệp đọc được;7tiêu chí có lýdo/nguồn/điểm hợp lệ; tổngđúng;3loạiđiểm riêng;RBAC/ownership;race/cache;statusSTALE/FAILED;qualitynegative10ca;E2E8+4;lint/build;khôngmấtdữliệu.

PARTIAL/BLOCKED: không có nhãn/điểm chuyên gia độc lập để chứng minh độ chính xác; luật dựa cấu trúc/từ ngữ nên có thể nhận xét sai, tối đa3/4 và cầngiảngviên; rubric hint tùy chỉnh ngoài luật đượcbáocầnkiểmtra; chưakiểmthửmemoryleakdài hạn/truycậpthiếtbịthật. Không dùngAIđểkỷluật hoặc tựcôngbốđiểm.

Bàn giao:8báocáotrongthưmụcnày;[source/design](SCORING_ENGINE_IMPLEMENTATION.md);[hướngdẫn nhóm](../../TEAM_ACTUAL_DATABASE.md);[trial](STUDENT_REPORT_TRIAL.md). Database chia sẻ là dữ liệu thật từ máy tác giả, mã hóa; không phải seed thay thế. Khóa giải mã và filelogin chỉ gửi riêng. Nocommit/push ban đầu đã được user thay bằng yêu cầu push sau kiểm thử; không push secret.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

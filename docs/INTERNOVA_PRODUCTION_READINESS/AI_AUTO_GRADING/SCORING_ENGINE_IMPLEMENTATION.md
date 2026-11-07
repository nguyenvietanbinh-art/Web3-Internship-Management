# API, dữ liệu và triển khai

Backend mới/mở rộng:

- `reportAutoScoring.js`: bộ luật độc lập, không truy cập DB hoặc thực thi nội dung.
- `reportEvidence.js`: đọc tệp task/report cùng assignment, kiểm SHA256 và phiên bản, company criterionReviews đúng actor/version; TXT/PDF/DOCX đọc qua parser cũ, tối đa3tệp/20k ký tự mỗi tệp.
- `reportEvaluation.js`: snapshot, idempotency, single-flight theo report, fresh/stale/failed/current, gradingInput kiểm hash. Cachekey gồm inputHash,engine,scoringEngineVersion. Atomic version + không trùng idempotencyKey bảo vệ giữa process; cùng process chia sẻ promise. AI lỗi không rollback bài đã nộp.
- `reportSelfGrading.js`, BusinessModels: selfGrading/selfGradingHistory riêng; evaluationHistory Mixed giữ modelName/version, rubricId/version, criterionResults, suggestedTotal, evaluationStatus/evaluatedAt, evidenceReferences. Không overwrite lịch sử. revisionRequests riêng, yêu cầu bổ sung không cần dựng điểm0.
- nlpClient retry hữu hạn chỉ MODEL_BUSY_RETRY, không retry/che thiếu RAM, lỗi dữ liệu hoặc unavailable thành success.

API: POST `/core/ai/reports/:id/analyze` (studentown/mentorassigned; company/admin403); GET `/core/reports/:id/ai-evaluation` (scope, Admin/company không có analysis); PUT `.../self-assessment` (studentown); PUT `.../review-draft` (mentor); POST `.../request-revision` (mentor, chưa chấm số); POST `.../reviews` và `.../approve` giữ xác nhận/chốt điểm. POST báo cáo nhận selfGrading đã validate7mục/rubricVersion; student không gửi điểmAI/official.

UI gửi yêu cầu phân tích sau hành động nộp báo cáo cuối kỳ; nếu AI lỗi bài vẫn lưu, chi tiết có nút thử lại. Mở trang hoặc GET trạng thái không tự phân tích/ghi dữ liệu. Sinh viên thấy self/AI/phản hồi và trạng thái mentor; giảng viên có bảng5cột, trích đoạn, dùng điểm AI, sửa/nháp/bổ sung/xác nhận. Admin chỉ thấy điểm giảng viên xác nhận, không rawAI; đã sửa ReportReview không crash khi Backend ẩn proposed.

Report/rubric/task thay đổi ->snapshotcũSTALE; rubric cũ/điểm giảng viên cũ được giữ nguyên. POST phân tích bản cũ/chốt/need_revision409; xem lịch sử qua GET. Không tạo chat.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

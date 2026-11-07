# Trạng thái AI tự chấm — 07/11/2026

**PASS luồng chấm sơ bộ có điều kiện trên TEST; PARTIAL về kiểm định chất lượng thực tế.** Nguyên nhân cũ được xác minh tại `core/reportEvaluation.js:proposal`: sáu mục chỉ tính từ evidenceChecks do mentor nhập, không có thuật toán chấm nội dung. Không phải thiếu BERT, rubric hoặc quyền. Không đổi10điểmtiếnđộ thành điểm nội dung.

Đã thêm rule scorer, evidence loader task/tệp, cache phiên bản, API trạng thái/kết quả, selfGrading riêng, UI sinh viên/giảng viên và nháp/điều chỉnh. Phúc4004ký tự sau trim (tệp nguồn4005),8mục,7tiêu chí, tổngAI77.5, self80, officialnull. BERT/API/browser đều chạy thật. Không ép100/100 hoặc hardcode theo người.

File chính: reportAutoScoring.js, reportEvidence.js, reportEvaluation.js, reportSelfGrading.js, reports.js, reportContext.js, ai.js, BusinessModels.js, nlpClient.js; ReportAiEvaluation/ReportSelfAssessment/ReportForm/ReviewForm/ReportReview/AiPage/ReportAnalysisResult. Xem báo cáo triển khai để biết API và tác động.

## Phạm vi, bằng chứng và giới hạn chung

Ghi chỉ database TEST `internova_role_qa_20261107`, exact allowlist/replicaSet/marker; không migration/index hoặc thay dữ liệu website chính. Không cài dependency, train model mới, dùng dịch vụ trả phí, deploy công khai hoặc ví thật. Kết quả trước được giữ nguyên. User sau đó cho phép commit/push; việc chia sẻ DB được xử lý bằng snapshot mã hóa dữ liệu thật, xem `docs/TEAM_ACTUAL_DATABASE.md`.

Model: Sentence-BERT multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`), revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, artifact hash pin. Scoring `report-rules-v1.1`; nội dung = max×level/4; tiến độ = max×confirmedProgress/100; không cosine×max. Điểm AI không phải điểm giảng viên hoặc xác suất chính xác. Chưa có điểm chuyên gia độc lập nên đánh giá độ chính xác/hiệu chuẩn: BLOCKED, không công bố metrics giả.

Bằng chứng đã lọc thông tin đăng nhập trong `evidence/`. Báo cáo/tệp/trích đoạn đầy đủ và ảnh gốc giữ trong cache riêng; database thật được chia sẻ mã hóa. Không xuất mật khẩu/JWT/private key vào các báo cáo công khai.

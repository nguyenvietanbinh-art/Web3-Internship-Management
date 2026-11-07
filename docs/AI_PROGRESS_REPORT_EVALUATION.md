# AI đánh giá tiến độ và báo cáo — kết quả triển khai 07/11/2026

Trạng thái: luồng đánh giá có xác nhận **PASS trên TEST**, hoàn thiện production và chất lượng chấm tự động **PARTIAL/BLOCKED**. Tài liệu tổng hợp: [nghiệm thu V3](INTERNOVA_PRODUCTION_READINESS/FINAL_READINESS_REPORT.md), [ma trận](INTERNOVA_PRODUCTION_READINESS/FEATURE_MATRIX.md), [test thực tế](INTERNOVA_PRODUCTION_READINESS/E2E_TEST_RESULTS.md).

## Các lỗi đã xử lý

- Sinh viên tự PATCH phần trăm/trạng thái hoặc submit tự100: bị chặn; chỉ tiêu chí doanh nghiệp xác nhận đạt mới tính tiến độ, có trọng số/version.
- Nộp lại mất căn cứ phiên bản/tệp: snapshot bài nộp, nhận xét, phân tích và byte tệp; giới hạn15phiên bản/8MiBtệp/15MiBBSON. Tệp lịch sử bị serialize BSON thành JSON đã sửa trả đúng Buffer và kiểm tải byte thật.
- Đếm tiến độ lặp theo báo cáo: báo cáo tuần liên kết nhiệm vụ, không tự cộng % vì nộp nhiều tuần. Phiên bản hiện hành riêng từng tuần, selfAssessment tách nội dung đánh giá.
- Chấm trước từ từ khóa: luồng mới dùng trích đoạn BERT và bằng chứng đã được người hướng dẫn kiểm; cosine không chuyển thành điểm. Thiếu căn cứ để trống total. Lưu riêng điểm đề xuất/giảng viên/chênh lệch/lý do/version/hash.
- Báo cáo mới tự trung bình hai bên: nhà trường phải công bố chính sách mentor hoặc weighted rõ ràng. Bản nháp và điểm chưa công bố không lộ cho sinh viên.
- Menu sai vai trò khi tab khác đổi token: cập nhật phiên và xóa UI riêng cũ; API vẫn RBAC/ownership. Doanh nghiệp không có ranking; trường có gợi ý phân công, mentor phân tích bài mình phụ trách, sinh viên đối chiếu CV mình.

## File triển khai chính

AI: `ai-service/nlp/evidence.py`, `schemas.py`, `api.py`, `tests/test_evidence.py`. Shared: `shared/report-rubric.json`.

Backend: `models/Task.js`, `BusinessModels.js`, `Company.js`; `core/taskEvaluation.js`, `taskEvaluationService.js`, `taskEvidenceFile.js` nằm trong services, `tasks.js`, `creationIdentity.js`, `reportEvaluation.js`, `reportVersions.js`, `reportContext.js`, `reports.js`, `ai.js`, `companyLocations.js`, `core/index.js`, `work.js`; `services/qrGps.js`, `workflow/notifications.js`, `app.js`.

Frontend: `work/TaskAssessment.jsx`, `taskCriteria.mjs`, `TaskForms.jsx`, `WorkDialog.jsx`, `Work.jsx`; `reports/ReportForm.jsx`, `ReviewForm.jsx`, `ReportReview.jsx`, `ReportRubricSettings.jsx`, `MentorRubricProposal.jsx`, `gradingRubric.mjs`; `Reports.jsx`, `AiPage.jsx`, `ReportAnalysisResult.jsx`, `CompanyLocations.jsx`, `Web3Page.jsx`, `Shared.jsx`, `historyContent.js`; `App.jsx`, `AppShell.jsx`, `business.css`, `workflow/AdminPage.jsx`.

Contract: `contracts/contracts/InternshipRegistry.sol` thêm chặn deadline và đăng ký trùng; không thay deployment cũ. Test mới `contracts/test-local/InternshipRegistryDeadline.test.cjs`.

Test/runtime: `server/test/progress-evaluation.{unit,integration}.test.js`, `report-analysis-role.unit.test.js`, cập nhật `student-workflow.integration.test.js`; `client/test/evaluationFixture.cjs`, `progress-report-v3-browser.cjs`, `v3-role-session-browser.cjs`; `server/scripts/prepare-v3-dataset.cjs`; `scripts/demo/verify-v3-ai-roles.cjs`, `verify-v3-web3.cjs`, `measure-v3-runtime.cjs`, `v3-protected-snapshot.cjs`.

Các file khác đang dirty từ các yêu cầu trước được giữ nguyên; không nhận toàn bộ working tree là thay đổi mới của đợt này. Không sửa CV/JD trong đợt tiến độ/báo cáo này, chỉ thêm dữ liệu QA mới.

## API mới / hành vi

Task: `PUT /core/tasks/:id/criteria`, `PUT .../draft`, `POST .../analyze`, `POST .../criteria-review`, `GET /core/tasks/progress/summary`. Task submit/version/download dùng API cũ mở rộng, `?submissionVersion=` cho tệp lịch sử. POST task/report nhận Idempotency-Key.

Report: rubric theo kỳ GET/PUT và proposal POST; review-draft PUT; evidence-checks POST; `/core/ai/reports/:id/analyze` dùng NLP thật; review/approve hiện hữu kiểm snapshot và chính sách. Company locations GET/POST; QR issue chấp nhận locationId scoped.

## Kết quả và giới hạn

BERT local ready, model multilingual MiniLM revision pin, không mạng ngoài. Các suite và ảnh trong `docs/evidence/v3-20261107`; lệnh/kết quả chi tiết ở báo cáo E2E. Main5188 đã reload, HTTP200,31collection/index/BSONhash không đổi. TEST5189 có dữ liệu mới và file login riêng ignored.

Không có fine-tuned BERT chấm điểm đã được kiểm định, nhãn chuyên gia độc lập hoặc xác suất tin cậy hiệu chuẩn; bộ tổng hợp không chứng minh chất lượng ngoài thực tế. IPFS live và Maps SDK chưa đủ cấu hình. Deadline/roster/weekly-onchain đầy đủ còn thiếu tích hợp. Không tuyên bố hoàn tất toàn bộ V3.

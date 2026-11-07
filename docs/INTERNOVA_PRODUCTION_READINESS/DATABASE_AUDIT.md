# Database và bảo toàn dữ liệu

Ghi kiểm thử chỉ vào `internova_role_qa_20261107` cổng 27018 có exact URI allowlist, replica set và marker `qa_safety_marker/_id:role-workflow`; các test legacy dùng DB mới `web3_internship_test_phase1_<hash>_<random>` cổng 27017, kiểm tra rỗng trước khi tạo. Không `dropDatabase`, xóa dữ liệu hoặc migration phá dữ liệu.

Mở rộng tùy chọn, không chạy migration trên main:

- Task: tiêu chí/phiên bản, người duyệt, trọng số; draft; submissionVersions và tệp lịch sử; evidenceAnalysis và criterionReviews.
- Report: weekNumber/weeklyRevision/taskIds, selfAssessment, evaluationHistory, evidenceChecks, reviewDrafts, grading/publicationPolicy snapshot.
- InternshipBatch: reportRubric, rubricProposals; Company: locations có người xác nhận và thời điểm.
- Dùng `_id` để chống tạo trùng theo Idempotency-Key, không thêm index nghiệp vụ trên main.

31 collection của database website được hash BSON và chụp indexes trước/sau nạp lại Backend và health: **khớp hoàn toàn**. Bằng chứng `../evidence/v3-20261107/main-before-reload.json` và `main-after-reload.json`. Chứng minh này chỉ áp dụng khoảng kiểm tra đó, không suy diễn các thao tác người dùng ở thời điểm khác.

Bộ seed V3 chụp danh sách ID/hash 11 collection cũ trong QA; sau thêm dữ liệu tất cả bản ghi cũ vẫn khớp. Không ghi đè mật khẩu, bài nộp hoặc điểm đã chốt. Khôi phục source không cần rollback dữ liệu chính vì không migration; không tự xóa fixture QA. Khi cần loại bỏ fixture về sau phải lập kế hoạch riêng theo seedBatchId và quan hệ, chưa chạy.

# Kết luận nghiệm thu V3 — còn điều kiện

**PARTIAL.** BERT hoạt động thật và đúng phạm vi ở các luồng đã kiểm; luồng task → bài nộp → doanh nghiệp xác nhận → giảng viên đánh giá → nhà trường công bố đã chạy E2E. Không tuyên bố hệ thống đạt100% hoặc chấm điểm tự động như chuyên gia.

Đã sửa: tiến độ tự tăng/chỉnh tay; bỏ qua nghiệm thu tiêu chí; mất tệp bài nộp lịch sử do BSON conversion; chấm điểm không có rubric/rule; điểm/nháp bị dùng ngoài quy trình; session tab cũ giữ vai trò; raw metadata lịch sử. Đã bổ sung bài nộp/nháp/phiên bản, trích đoạn BERT, rubric theo kỳ và bằng chứng điểm điều chỉnh; dữ liệu V3 mới chỉ TEST, không ghi đè dữ liệu cũ.

Ưu tiên còn lại:

1. **HIGH — live IPFS:** cần credentials/keyId/key mã hóa quản lý bền vững và quyền upload; xác minh upload/readback ciphertext trước nghiệm thu. Không tạo CID thay thế.
2. **HIGH — yêu cầu on-chain bổ sung:** deadline/chốt danh sách/tiến độ tuần chưa được nối thống nhất với deployment/UI/API; Registry mới chỉ đã compile/test; giữ contract hiện tại cho chứng nhận cũ.
3. **MEDIUM — Maps SDK/camera thực:** chưa có cấu hình provider/key, hiện chỉ tọa độ xác nhận và link bản đồ; cần thử điện thoại thực. Không xem GPS client là chống gian lận tuyệt đối.
4. **HIGH về kết luận học thuật:** cần nhãn độc lập và điểm giảng viên thật, kiểm định/hiệu chuẩn và khảo sát trước tuyên bố độ chính xác/chấm tự động. Bộ tự tạo không thay bằng chứng đó.
5. **MEDIUM — phủ UI:** multi-task tuần và proposal rubric đã có E2E3/3; mọi tổ hợp responsive/accessibility vẫn cần mở rộng; chưa nghiệm thu production backup/monitoring.

Website đang dùng5188, môi trường kiểm thử có dữ liệu mới5189. Hướng dẫn `../RUN_V3_FULL_WORKFLOW.md`. File login mới nằm trong cache ignored; không push mật khẩu. Không commit/push hoặc thay package-lock. Kết quả Git có nhiều thay đổi tồn tại từ trước; không gán tất cả cho đợt này.

Kiểm tra bàn giao: lint/build lần cuối PASS; node --check29module corePASS; git diff --check exit0 (có cảnh báo chuẩn hóa LF/CRLF của Git, không sửa cấu hình line endings). Branchbranch_1;244mục dirty/untracked từ toàn bộ quá trình, không commit/push. Danh sách chi tiết local `contracts/node_modules/.cache/progress-evaluation-runtime/git-status-final.txt`; không coi tất cả là thay đổi riêng đợt này.

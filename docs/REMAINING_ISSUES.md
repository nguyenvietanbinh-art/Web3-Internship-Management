# Cập nhật sau bản vá dependency

P6-SEC-01/02/03 đã FIXED trong server/client và retest PASS. Production audit cả hai workspace về0; dev/toolchain vẫn còn OPEN. [Chi tiết](DEPENDENCY_PATCH_RESULT.md). Không chuyển PHASE7.

# PHASE6 — Remaining issues và ưu tiên

Ngày 31/10/2026 (+07). Chưa đủ điều kiện nghiệm thu toàn hệ thống hoặc phát hành công khai. Các test code/API đã PASS không thay thế việc nghiệm thu bảo mật, cloud, phần cứng và chất lượng AI.

| ID | Ưu tiên / trạng thái | File/thành phần | Cách sửa dự kiến / điều kiện |
| --- | --- | --- | --- |
|P6-SEC-01|FIXED / retest PASS|server/package-lock.json: body-parser1.20.9|Đã phê duyệt/cài; gzip, lỗi/trailing bytes và health trong child PASS; backend122/122, audit production0. Xem DEPENDENCY_PATCH_RESULT.md. |
|P6-SEC-02|FIXED trong server/client / retest PASS|Hai package-lock.json: follow-redirects1.16.2|Cross-realm sensitiveHeaders trên redirect HTTP thật PASS; browser70/39/7 PASS, audit production0. Bản trong contracts chưa thuộc phạm vi vá. |
|P6-SEC-03|FIXED / retest PASS|server/package-lock.json: qs6.16.1|Comma stringify với own toString không callable PASS; backend/query regression PASS, audit production0. |
|P6-SEC-04|HIGH toolchain / OPEN|contracts/package-lock.json: Hardhat 2/toolbox 6 và các dependency gián tiếp|Phân tích phạm vi dev và đường gọi từ audit-all-contracts.log. Lập kế hoạch tương thích, xin duyệt trước Hardhat 3/toolbox 7; không audit fix --force hoặc tự hạ phiên bản. |
|P6-SEC-05|MODERATE dev / OPEN|server: nodemon/minimatch|Chọn bản vá tương thích trong kế hoạch riêng; không làm theo đề xuất hạ nodemon về 1.0.2 một cách máy móc. |
|P6-INT-01|HIGH đối với nghiệm thu toàn bộ / BLOCKED|server/src/services/privateIpfs.js; core/web3.js; Pinata và quản lý khóa|Cấu hình credentials, sao lưu khóa và cho phép upload ciphertext TEST; readback/hash/decrypt thật. Không gửi secret qua chat/Git; mock adapter không thay tích hợp live. |
|P6-ML-01|BLOCKED tài nguyên|ai-service/tests/test_model_inference.py; guard RAM trong engine|Cần ít nhất 1 GiB RAM trống trước khi nạp model lạnh để chạy lại 6 test, hoặc máy kiểm thử khác được duyệt. Giữ guard; không dừng ứng dụng của người dùng. Inference qua API với model đang chạy đã PASS. |
|P6-ML-02|BLOCKED dữ liệu; tồn tại từ PHASE 4|ai-service/evaluation; bộ phân loại rủi ro|Cần CV/JD/báo cáo có nhãn độc lập, chia dữ liệu tránh leakage và đo metrics/hiệu chuẩn thật; không tự gán nhãn để làm đẹp kết quả. |
|P6-UAT-01|NOT TESTED|NativeQrScanner.jsx/qrDecoder.js; qrGps.js|UAT camera/GPS trên điện thoại thật, ánh sáng, sai số, từ chối quyền, ngoài vùng và hết hạn. Cần kế hoạch HTTPS/mạng được duyệt; GPS client không chống giả mạo tuyệt đối. |
|P6-UAT-02|NOT TESTED|Ví, frontend và browser matrix|Kiểm extension ví, Safari/Firefox/mobile, screen reader và WCAG; không dùng ví hoặc tiền thật. |
|P6-AUTH-01|PARTIAL theo phạm vi cũ|authService.js; client/api/client.js|Chưa có luồng mật khẩu. SIWE domain/chain binding, thu hồi phiên, localStorage JWT, CSP và rate limit phân tán cần thiết kế được duyệt; không tự thay cơ chế xác thực lớn. |
|P6-PERF-01|FIXED trong TEST; chưa rollout|server/src/models/Assignment.js|Ba index giảm số bản ghi phải đọc từ 1.000 xuống 1/20/10. Gốc/demo giữ nguyên; rollout cần backup, review index và dry run riêng. |
|P6-PERF-02|NOT TESTED|Dashboard aggregation; React rendering; dữ liệu lớn|Cần kiểm tải production, đồng thời, thời gian dài, rò bộ nhớ, React profiler và Web Vitals; mẫu loopback nhỏ chưa đủ đánh giá SLA. |
|P6-CHAIN-01|Local PASS / production NOT TESTED|InternshipEvidenceSBT.sol/localWeb3.js|Cần quy trình tin cậy issuer, quản lý khóa, thu hồi/cấp lại, signer phân tán và confirmation policy; testnet cần phê duyệt riêng, không mainnet. |

Ưu tiên: vá dependency HIGH sau phê duyệt → audit và regression lại → Pinata TEST live → UAT phần cứng → dữ liệu nhãn/chất lượng AI → kiến trúc, bảo mật và tải production. Ba bản vá nhỏ đã được phê duyệt, cài và retest PASS. Nâng major toolchain là hạng mục riêng, chưa tự thực hiện.

Không có functional FAIL trong 122 Backend, 70 core browser, 39 legacy, 7 QR browser, 12 contract, 2 QR unit và 16 Python test đã chạy. **Audit FAIL và các mục BLOCKED/NOT TESTED vẫn còn**, nên chưa thể kết luận hệ thống hoàn chỉnh. Dừng PHASE 6, chưa PHASE 7.

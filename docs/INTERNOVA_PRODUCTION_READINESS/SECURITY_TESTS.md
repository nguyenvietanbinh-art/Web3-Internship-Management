# Security retest

PASS: JWT/password session revocation; origin/cookie/password proof trước ký ví; nonce một lần/expiry/chain binding/chữ ký sai/ví trùng; RBAC và assignment ownership; student không ghi progress/status/điểm/duyệt; company không giả mentor rubric; dữ liệu nháp/điểm chưa công bố không lộ sang student; CV/JD hash không thay trong test tiến độ; upload kiểm MIME/magic/UTF8/DOCX/PDF và giới hạn; không fetch URL tệp từ ngoài; tạo mới có idempotency; stale version/concurrent review chỉ một thành công.

Luồng nhận chỗ cuối/đóng/hoàn lượt chạy lại trong role-workflow; quota tách lịch sử usedOpportunities và refundedOpportunities, không xóa hồ sơ/CV để hoàn lượt. DB TEST allowlist/marker/replicaSet trước ghi. Không in hoặc xuất JWT, cookie, passwordHash, private key vào báo cáo.

32/32 suite security/email/wallet/QR/IPFS adapter/database safety; 23/23 integration tiến độ + roles/semantic + unit; 17/17 workflow regression. Không phải pentest độc lập toàn hệ thống. Unit mock transport/verifier được ghi rõ, không tính là Google/Pinata E2E. Không audit-fix hoặc nâng dependency trong vòng này.

Lỗi đã sửa qua kiểm thử: tải tệp phiên bản cũ trả BSON Binary thành JSON → chuyển đúng byte Buffer; student tự nhập %/submit100 bị chặn; stale tab còn menu role cũ → đồng bộ storage event; điểm mới tự lấy trung bình → cần chính sách trường. Chưa có bằng chứng production TLS, backup restore thực địa hoặc kiểm định bảo mật bên thứ ba.

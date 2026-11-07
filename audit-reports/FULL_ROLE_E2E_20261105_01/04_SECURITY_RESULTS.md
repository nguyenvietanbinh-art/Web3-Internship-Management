# Security retest

PASS trong phạm vi assertions của165 Backend và21 browser groups:

- RBAC/Admin restriction, IDOR cùng/khác role và ownership theo User ID; legacy routes bị chặn đúng mode.
- Email validation/duplicate/password hashing, role injection, JWT authVersion/disabled/revocation và nonce/challenge/signature replay.
- Local RSA fixture kiểm official Google verifier; không Google OAuth live.
- Upload PDF/DOCX thực, MIME/magic/macro/external reference/active-content/oversize/decompression policy, private owner access.
- Request GET/dashboard/navigation fingerprint không thay dữ liệu; đánh dấu notification đọc bằng mutation tường minh.
- QR expiry/replay/geo distance/accuracy policy; vị trí synthetic, không anti-spoof tuyệt đối.
- Contract quyền issuer, replay/idempotency, receipt/instance/chain mismatch, non-transferable token, duplicate mint và reconciliation.
- Session401 cũ không xóa token mới; expired session ẩn menu riêng, về login. Không bỏ middleware để PASS.

Bằng chứng: [Backend TAP](evidence/backend-all.txt), [browser production](evidence/production-role-navigation-browser-0/result.json), [unified browser](evidence/unified-business-browser-browser-0/result.json).

Không phát hiện secrets trong các artifact đã quét mẫu; không full DLP hoặc penetration-test chứng nhận. Bundle được build không truyền secrets server vào VITE variables của TEST. Không rà lại mọi commit lịch sử/extension/supply chain. Không audit production mới hoặc live-public endpoint. Lỗi atomic report HIGH vẫn FAIL dù security cases cũ PASS.

Protected DB: gốc, hai demo và manual TEST cùng hashes/count/index trước/sau. Không đọc plaintext document ra báo cáo, chỉ lưu SHA/count/index. Các fixtures chỉ ghi DB TEST mới. Chưa có content hash trước thời điểm phục hồi Mongo.

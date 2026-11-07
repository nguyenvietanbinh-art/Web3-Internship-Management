# CHECKLIST SAU CHẠY DEMO

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

- [x] Database demo mới đã xác minh rỗng trước seed,seed đã chạy và có dữ liệu.
- [x] Không chạy file mongosh cố định DB gốc; guard chặn db khác/drop/xóa business/index drop.
- [x] Mongo/Backend/Frontend gốc giữ chạy; Backend 5001/Frontend 5174/AI 8001 demo đang chạy loopback.
- [x] Browser render 5 tab,company/student/mentor preset login/logout/restore,Tạo JD form và matching.
- [x]50 API checks;16 browser checks;21 foundation checks trên bản sao loại dropDatabase.
- [x] Lint/build/syntax/compile mới đạt;0 uncaughtJSexceptiontrongbrowser đã test.
- [x] Database gốc 3 document hash/index không đổi;source/config/manifest/lock/.env không đổi;no Git mutation.
- [x] Đóng Edge headless/debug port,giữdemoURLs để người dùng xem; không xóa các DB thử.
- [ ] GET/mount không write,Web 3 không auto POST.
- [ ] Demo auth an toàn/role owner/Task/WorkLog/QR/record tx PASS negative checks.
- [ ] Unknown cert không verified/mint;không fake CID/tx/score/success toast.
- [ ] Application/CV save/multi-slot/giờ làm/school admin flow.
- [ ] Pinata upload/readback thật,SBERT/quality metrics,risk warnings,QR scan GPS.
- [ ] RPC/EVM tests/receipts/listener reconcile/mint NFT SBT thật.
- [ ] Mobile 320 không tràn,Lighthouse/a11y/UAT/production deployment.

Được xem demo ở 5174 với dữ liệu mẫu. Không dùng ví thật/giao dịch thật/dữliệuthậtvàkhôngđưademonàyrapublickhicácP 0 chưa sửa. Đây là giới hạn đã quan sát,tính năng giả không được tính hoàn thành.

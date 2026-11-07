# Đề xuất riêng — atomic report replacement (CHƯA ÁP DỤNG)

Phát hiện: ROLE-HIGH-01. Phạm vi dừng: code nghiệp vụ reports, schema/index và topology MongoDB; chưa sửa các phần này.

## Phương án ưu tiên

1. Kiểm tra khả năng transaction; standalone hiện tại không đủ cho multi-document transactions. Chuẩn bị replica set TEST riêng (không chuyển instance/data directory gốc/demo đang chạy).
2. Trong session.withTransaction: đọc latest/current → kiểm rule đã approved → supersede bằng version-CAS → tạo bản mới trong cùng session. Lỗi bất kỳ abort: bản cũ vẫn current.
3. Thiết kế serialization chống hai submit cùng kỳ/kind, kiểm tra unique version/current index hiện có. Transaction đơn thuần không thay kiểm tra race khi chưa có report đầu tiên; xem xét partial unique index assignmentId+kind khi current=true sau review schema.
4. Trả409 hoặc retry bounded cho transient conflict theo policy được duyệt; không tự retry duplicate POST vô hạn. API payload và auth không thay đổi.
5. Không coi catch+restore current=true đơn giản là giải pháp atomic: có thể ghi đè submit khác hoặc rollback fail.

## File dự kiến

- `server/src/core/reports.js`: session/transaction và lỗi conflict.
- `server/src/models/BusinessModels.js`: chỉ khi index thiết kế cần bổ sung và được duyệt.
- `server/src/services/databaseSafety.js` và script plan/index tương ứng: readiness và dry run nếu index đổi.
- Test mới fault/first-submit race/replacement race/approved-lock/scope; scripts TEST replica set riêng và tài liệu rollout.

## Kiểm thử nghiệm thu

- Insert mới thất bại: HTTP lỗi, bản cũ current=true, version/history không đổi.
- Hai submit cùng lúc: chính xác một current; không duplicate version hoặc mất report.
- Submit đầu tiên đồng thời; finalized approval cạnh tranh submit; review cũ bị từ chối đúng.
- Ownership/RBAC/validation và regression165, browser9/6/6 vẫn PASS.
- Repro mới phải chuyển từ FAIL sang PASS bằng fix thật, không sửa kỳ vọng về currentCount=0.

## Rollout/rollback

Inventory dữ liệu chỉ đọc → backup được xác minh → dry-run duplicate/current analysis → phê duyệt maintenance/index/topology → chạy TEST trước. Không tự áp dụng gốc/demo. Rollback code/index/topology phải được review cùng dữ liệu phát sinh; không giả standalone rollback là an toàn nếu code đã đòi transactions. Giữ compatibility khi deployment chưa sẵn sàng và fail readiness rõ ràng; không fallback thành non-atomic success.

Cần người dùng phê duyệt phương án cụ thể trước khi tạo replica set, thay schema/index hoặc áp dụng sửa nghiệp vụ này. Tài liệu này chỉ là kế hoạch review, không là phê duyệt đã nhận.

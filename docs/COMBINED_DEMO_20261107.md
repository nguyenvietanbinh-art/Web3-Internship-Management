# Database kết hợp cũ và mới — 07/11/2026

**Website đang chạy: http://localhost:5188/**. Backend http://localhost:57418/api. Source nền `8aa463b`.

MongoDB Compass kết nối `mongodb://127.0.0.1:27018/?replicaSet=internovaTestRs`, chọn **internova_demo_cunhan_kysu_20261107**. Replica set một node local, PID28224, data directory mới `%LOCALAPPDATA%/Web3-Internship-Management/MongoDB/workflow-rs-20261107`. Không đổi service/autostart hoặc MongoDB27017.

## Dữ liệu

- Sao chép25collection,43document từ `web3_internship_test_phase1_import_f8d067c0` ở27017, giữ `_id`, password hash, ví và lịch sử. Source hashes/counts/indexes trước/sau không đổi. Kiểm tra43document cũ trong bản sao giữ nguyên BSON sau seed.
- Bổ sung226tài khoản synthetic:200sinh viên,12doanh nghiệp,12giảng viên,2nhà trường. Tổng232User bao gồm6tài khoản cũ.
- Sinh viên có MSSV10chữ số: cử nhân `2211000001`–`2211000100`, kỹ sư `2212000001`–`2212000100`. Email là MSSV@gmail.com, mật khẩu ban đầu là MSSV. Đây là địa chỉ giả lập phục vụ đăng nhập local; không gửi thư hoặc tuyên bố sở hữu Gmail thật.
- Tên, ngành học, GPA, kỹ năng, CV và thông tin doanh nghiệp được tạo giả lập, không phải danh tính/hồ sơ đã xác minh. Mật khẩu bằng MSSV chỉ dùng trong TEST.
- Hai kỳ mới: Thực tập cử nhân2026—DEMO bắt đầu24/11/2026; Thực tập kỹ sư2026—DEMO bắt đầu12/11/2026. Mỗi kỳ100sinh viên:50đã đăng ký,50chưa đăng ký. Giữ2kỳ lịch sử của nguồn, tổng4kỳ trong DB.
- Bổ sung60đề tài,120cơ hội theo hai kỳ, chỉ tiêu5–9người/đề tài/kỳ. Tổng68đề tài bao gồm8đề tài cũ.
- Không seed tiếp nhận/giảng viên/phân công mới, số giờ lao động, kết quả AI, tx/CID hoặc chứng nhận giả. Có thể tự thực hiện luồng mới từ dữ liệu demo.
- Dữ liệu cũ chưa có quan hệ workflow được giữ làm lịch sử; không tự suy ra membership/admission mới từ tài khoản, ứng tuyển hoặc ví cũ. Không tuyên bố mọi chức năng cũ tự tương thích workflow.

## Đăng nhập

Mở file local ignored:
`contracts/node_modules/.cache/workflow-combined-20261107/manual-login-combined.txt`.

File có họ tên/vai trò/email/mật khẩu mới. Staff có mật khẩu random; sinh viên dùng MSSV. Dữ liệu credentials cũng lưu DPAPI trong accounts.dpapi. Không đưa file vào Git/ảnh công khai. File login cũ vẫn giữ nguyên nhưng không phải danh sách tài khoản mới.

Ví dụ: sinh viên `2211000001@gmail.com` dùng mật khẩu ban đầu bằng MSSV của mình. Admin dùng các tài khoản school trong file; doanh nghiệp enterprise; giảng viên lecturer. Tất cả chỉ là TEST.

## Thay đổi và kiểm tra

- Guard chỉ thêm đúng một tên database mới vào allowlist cổng27018/replicaSetinternovaTestRs; vẫn chặn production, cổng khác, URI tùy ý. Unit guard2/2PASS; syntax script PASS.
- Script mới `server/scripts/create-combined-demo.cjs`: chỉ DB TEST này, từ chối DB đích đã có dữ liệu; giữ checkpoint, credentials local, snapshot source. Resume chỉ được dùng ở bước copied-only trước khi tạo tài khoản và phải khớp hash.
- Lần chuẩn bị index ban đầu lỗi85: hai index expiresAt_1 của auth_nonces/attendance_sessions thiếu TTL. Chỉ thay hai index đó trong collections RỖNG của bản sao mới; không thay index nguồn. Giữ thông tin tại empty-ttl-index-repair.json; không xóa document để sửa lỗi.
- BackendPID3156, FrontendPID31316; website cũ5182 và DB27017 được giữ chạy. Health/ready/capabilities và trang chủ mới HTTP200. Login +Dashboard API thực tế bốn vai trò đều200. Student login dùng mật khẩu MSSV đã kiểm qua API.
- Kiểm100registered/100unregistered và43documentlegacy nguyên BSON PASS. Không coi kiểm API là full browser E2E.
- Browser automation đã thử nhưng FAIL ở CDP Runtime.evaluate timeout; chưa có bằng chứng PASS UI hoặc nguyên nhân xác định. Đợt kiểm API đầu tiên dùng vault đọc được; lần thử sau DPAPI helper lỗi nên retest dùng file login local đã xuất, không in mật khẩu. Retest API thành công, không che lỗi browser/DPAPI thành PASS.
- Chưa chạy lại toàn bộ regression/AI/contract suites. Không deploy chain. Web3 trong runtime mới chưa bật vì chưa có metadata triển khai riêng; chuyển token hỗ trợ cũng chưa được triển khai trong source hiện tại. Không giả báo thành công các chức năng đó.

## Bằng chứng local

`contracts/node_modules/.cache/workflow-combined-20261107/`:
source-before.json/source-after.json, copy-checkpoint.json,
empty-ttl-index-repair.json, combined-result.json, http-login-verification.json,
workflow-runtime.json, running-services.json và logs.

Không commit/push hoặc cài dependency. Không restore/seed lại lên DB này; chọn DB/migration được duyệt riêng khi cần thay đổi dữ liệu. Không tự sửa địa chỉ ví/hashes của các bản ghi cũ để biến thành bằng chứng chain hiện tại.

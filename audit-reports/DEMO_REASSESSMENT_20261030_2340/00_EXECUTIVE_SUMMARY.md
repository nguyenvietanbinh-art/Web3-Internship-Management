# ĐÁNH GIÁ LẠI SAU KHI CHẠY DEMO

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

## Kết luận

**Demo local đã chạy được với dữ liệu và AI thật; chưa phải demo nghiệp vụ Web3 hoàn chỉnh.** Có thể truy cập **http://127.0.0.1:5174/** để xem dữ liệu mẫu và dùng 3 preset demo. Đây là môi trường thử, có các lỗi phân quyền/giả mạo kết quả chưa sửa; không đưa dữ liệu thật vào. 5173/5000 vẫn là hệ thống cũ, không chuyển sang DB demo.


| Thành phần | Địa chỉ/cấu hình demo | Trạng thái |
| --- | --- | --- |
| Frontend | http://127.0.0.1:5174 | Đang chạy, browser đã render đủ 5 tab |
| Backend | http://127.0.0.1:5001/api/health |200 connected; chỉ bind 127.0.0.1 |
| AI | http://127.0.0.1:8001/health |200, TF-IDF fallback, bert_active=false |
| Mongo | mongodb://127.0.0.1:27017/web3_internship_demo_20261030_2340 | Seed+demo+test, snapshot cuối 223 documents |
| Foundation tests | web3_internship_demo_20261030_2340_foundation | DB riêng,67 documents được giữ, không drop |
| RPC | Backend demo trỏ 127.0.0.1:18545 chưa chạy | Không deploy/tx; browser RPC 8545 bị chặn |
| Pinata | Không có credential demo | Submit thực 503, không tạo CID giả |


## Bằng chứng chạy mới

**87 phép kiểm: 70 PASS,17 FAIL** = API 37/50 PASS + browser 12/16 PASS + foundation 21/21 PASS. Những FAIL trùng nguyên nhân, không phải 17 lỗ hổng độc lập; không lấy 70/87 làm tỷ lệ hoàn thành đồ án. Không tính các lần harness sai selector/phiên lưu vào kết quả ứng dụng.

Đã kiểm thật: ví ngẫu nhiên ký nonce→JWT→profile; profile GPA readback; tạo topic/KPI 100; owner assign; quyền company/student ở topic; tạo JD bằng form trình duyệt và lưu DB; tạo Task/WorkLog API; chấm KPI đã seed; các GET normalized có dữ liệu; đăng nhập/đăng xuất/restore 3 preset UI; đủ 5 tab; Browser→Backend→AI TF-IDF có request 200 cả 3 tầng.

Foundation full flow assign→submit→reject/resubmit→evaluate→complete PASS nhưng **IPFS được stub theo test**, không pin file thật, không mint token, không gửi tx. Submit không Pinata trên demo thật trả 503 và Submission count giữ nguyên: blocker cấu hình được xác nhận, không coi full E2E đã đạt.

## Lỗi thực tế vẫn còn

1. GET jds/tasks/history/worklogs ghi dữ liệu mẫu; Web3 mount tự POST sync 2 lần.
2. Demo-login bỏ chữ ký; công ty khác sửa Task; student tự duyệt WorkLog; QR bất kỳ được chấp nhận; student ghi tx giả cho Topic người khác.
3. maxSlots 2 vẫn khóa sau 1 student. Ứng tuyển chỉ toast, không POST/Application.
4. Mã certificate không tồn tại vẫn HTTP 200/verified/onChain true; UI hiển thị ON-CHAIN VERIFIED/ERC 5192 dù không RPC/token.
5. AI HTTP report trống vẫn 50 điểm; chưa SBERT/benchmark/risk classifier. Mobile 320 px tràn ngang 529 px.

Không quan sát uncaught JavaScript exception trong browser đã chạy; điều đó không làm các lỗi nghiệp vụ thành PASS. Google Fonts và RPC 8545 bị chặn bởi harness; không kết luận đó là outage ứng dụng.

## Ma trận cập nhật và ưu tiên

| Chỉ số | Tử số/81 | Tỷ lệ |
| --- | --- | --- |
| Có code ít nhất một phần | 67/81 | 82.7% |
| VERIFIED PASS đúng phạm vi hàng | 21/81 | 25.9% |
| MISSING | 14/81 | 17.3% |
| FAIL/PARTIAL/MOCK | 38/81 | 46.9% |
| BLOCKED | 5/81 | 6.2% |
| IMPLEMENTED UNVERIFIED | 3/81 | 3.7% |


Nguồn/mẫu số 81 tại 02. Phải phân biệt verified phạm vi API/unit với hoànthiệnE2E. Nhóm security vẫn 21 nguyên nhân được giữ:0 CRITICAL đã xác nhận,10 HIGH,8 MEDIUM,3 LOW; lần chạy bổ sung bằng chứng chứ chưa sửa lỗ hổng.

P0: bỏ auto write/fake cert/fake success, khóa demo trong môi trường dữ liệu thật, role+owner+assignment, QR/session và receipt. P1: Application/CV/JD full lifecycle, canonical assignment/multi slot/consistency, test helper gốc an toàn. P2: Pinata/SBERT metrics/QR thật/chain/token/listener. P3: mobile,loading/error/a11y,32 lint warnings và bundle>500 kB.

## Bảo toàn

Seed đích riêng đã xác minh rỗng; không chạy `database/seed.mongodb.js` vì file cố định database gốc. Đã dùng `npm.cmd run seed` của server với MONGODB_URI demo và preload guard. Guard chặn dropDatabase, xóa dữ liệu nghiệp vụ và dropIndex; consume Auth Nonce một lần theo luồng đăng nhập được phép. Không mock API/AI trên demo; riêng IPFS trong foundation test được stub có chú thích.

**Database gốc web3_internship: hash từng collection+indexes trước/sau giống nhau, vẫn 3 JD.** Toàn 8336 tracked files và 22 untracked có sẵn từ baseline giữ nguyên; git diff/cached không đổi, không commit/push/merge. Hai DB thử được giữ để xem, không xóa. Các service cũ và demo giữ chạy; Edge headless kiểm định đã đóng. Không sửa code để che FAIL.

Xem 09 để đọc toàn 87 test,04 đủ 48 API,05 số liệu DB,10 kế hoạch sửa. 13 báo cáo mới không ghi đè 13 báo cáo cũ.

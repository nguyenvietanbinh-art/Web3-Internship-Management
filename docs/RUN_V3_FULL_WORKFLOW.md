# Hướng dẫn chạy và kiểm tra Internova V3

Dùng **PowerShell**, gõ từng dòng, không ghép cả khối thành một dòng trong cmd. Đường dẫn máy hiện tại `D:\Web3-Internship-Management`. Node22.23.4/npm10.9.9 và dependency đã có; không cần npm install lại.

## 1. Truy cập ngay

- Website dữ liệu hiện có: **http://localhost:5188**.
- Website TEST để thử toàn bộ thao tác mới: **http://localhost:5189**.
- File tài khoản TEST mới: `contracts/node_modules/.cache/internova-v3-20261107/manual-login-v3.txt`.
- Chỉ dùng tài khoản tương ứng đúng website/database; không đưa file login lên Git. Để thử bốn vai trò cùng lúc, dùng bốn profile trình duyệt. Các tab cùng profile chia sẻ đăng nhập và hiện đã đồng bộ khi đổi vai trò.

Trong PowerShell tại repository:

```powershell
Get-Content -Encoding UTF8 contracts/node_modules/.cache/internova-v3-20261107/manual-login-v3.txt
```

Sinh viên0/1 trong file: chưa nhận đề tài, dùng CV/đối chiếu/ứng tuyển. Sinh viên2/3: active, có nhiệm vụ và báo cáo mẫu để kiểm tra. Student3 đã nộp, không coi là doanh nghiệp đã xác nhận. Tài khoản mentor/company/admin đi cùng nhóm này. Các bài kiểm thử tự tạo tài khoản khác và không đổi mật khẩu các tài khoản này.

## 2. Dịch vụ cần giữ chạy

MongoDB27018 → AI8003 (cho đối chiếu) → Backend57419 → Frontend5189. Hardhat18546 chỉ cần khi kiểm blockchain/chứng nhận. Backend/Frontend thông thường vẫn chạy nếu AI/RPC lỗi, riêng thao tác phụ thuộc phải báo chưa sẵn sàng.

Kiểm tra trước khi mở thêm tiến trình:

```powershell
Set-Location D:\Web3-Internship-Management
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 27018,8003,57419,5189,18546 }
Invoke-RestMethod http://localhost:57419/api/health
Invoke-RestMethod http://127.0.0.1:8003/api/v1/nlp/status
```

Nếu cổng đã có tiến trình thì không khởi động trùng. Không reset Hardhat hoặc xóa metadata; việc restart node làm mất trạng thái EVM trong RAM, certificate cũ sẽ không còn xác minh và guard phải chặn. Không thay deployment để làm certificate cũ thành verified.

Nếu Mongo27018 đã dừng, dùng đúng thư mục dữ liệu đang có, không tạo lại replica set:

```powershell
& 'C:\Users\PC\AppData\Local\Programs\MongoDB\8.0.34\mongodb-win32-x86_64-windows-8.0.34\bin\mongod.exe' --bind_ip 127.0.0.1 --port 27018 --replSet internovaTestRs --dbpath 'C:\Users\PC\AppData\Local\Web3-Internship-Management\MongoDB\workflow-rs-20261107' --wiredTigerCacheSizeGB 0.25
```

Chạy trong terminal riêng nếu và chỉ nếu cổng trống, path đúng và dữ liệu vẫn tồn tại. Không chạy rs.initiate hoặc restore/seed lên dữ liệu gốc. Compass kết nối `mongodb://127.0.0.1:27018/?replicaSet=internovaTestRs`, chọn đúng DB, không đổi website chỉ bằng việc đổi connection trong Compass.

Backend QA ở terminal riêng:

```powershell
node server/scripts/start-role-qa.cjs
```

Frontend QA ở terminal riêng:

```powershell
$env:VITE_API_URL='http://localhost:57419/api'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5189 --strictPort
```

AI nếu đã dừng, terminal PowerShell riêng:

```powershell
& .\scripts\demo\start-synthetic-ai.ps1
```

Cần tối thiểu1GiBRAM trống để cold-load model. Nếu BLOCKED, đóng bớt ứng dụng rồi kiểm tra lại; không hạ guard. Không restart AI đang ready. Launcher không cài/tải/train model. Hardhat đang chạy thì giữ nguyên; sau reboot muốn tạo môi trường chain mới cần lưu deployment mới riêng và kiểm tra lại dữ liệu chứng nhận, không chạy lại deploy vào metadata cũ.

## 3. Kiểm thử tuần tự theo vai trò

1. **Sinh viên chưa có đề tài:** đăng nhập bằng tài khoản student0, mở CV, xem thông tin/kỹ năng. Có thể upload PDF/DOCX của mình; chọn Đưa vào thông tin CV, kiểm tra và Lưu CV. Bản đã ứng tuyển giữ snapshot riêng.
2. Mở **Đề tài phù hợp**: chọn kỳ được cấp, phương pháp ngữ nghĩa, số2–5, tìm. Chạy lại bằng từ khóa hoặc so sánh. Thay lựa chọn chỉ xóa kết quả, không tự gọi AI. Không hiểu cosine là xác suất được nhận.
3. Mở kỳ/cơ hội, tìm tên hoặc kỹ năng, nộp tối đa3 cơ hội theo điều kiện. Doanh nghiệp xét nhận; trường gán giảng viên. Nhận slot cuối đóng cơ hội, hồ sơ chờ của chính cơ hội đó được kết thúc/hoàn lượt một lần, lịch sử vẫn giữ.
4. **Nhà trường:** dùng student0 để xem Gợi ý phân công; không thể ép gán trước cửa sổ cho phép chỉ vì AI có kết quả. Kỳ fixture tương lai bắt đầu28/11/2026, cửa sổ phân công mở21/11; không chỉnh đồng hồ Windows để thử. Test thời gian dùng test clock cô lập ở suite workflow.
5. **Doanh nghiệp:** chọn sinh viên active2/3, giao task có mục tiêu/việc/sản phẩm/tiêu chí/trọng số. Không dùng menu xếp hạng ứng viên (đã bỏ theo yêu cầu). Xem bài và xác nhận tiêu chí, không nhập % tùy ý.
6. **Sinh viên active:** mở Công việc & nhật ký, lưu nháp, nộp kết quả và tệp. Phân tích nội dung để xem đoạn liên quan. Nộp không tự100. Xem nhận xét, bổ sung khi được yêu cầu; có lịch sử tệp/phiên bản. Báo cáo tuần chọn tuần, một hoặc nhiều task, tự đánh giá, công việc/kết quả/khó khăn/kế hoạch; gửi doanh nghiệp.
7. **Điểm danh:** doanh nghiệp lưu địa điểm đã xác nhận, chọn đúng sinh viên active, tạo QR checkin. Sinh viên nhập/quét mã và cho quyền vị trí. Sai vị trí/QRhết hạn phải bị chặn. Tạo QRcheckout khi kết thúc; doanh nghiệp duyệt thì giờ mới cộng. Không đợi vài giây rồi đòi có một giờ làm. Không điều chỉnh dữ liệu người thật để thuận tiện thử.
8. **Báo cáo kết quả:** sinh viên chỉ nộp/xem bài mình; doanh nghiệp chỉ sinh viên đơn vị, mentor chỉ sinh viên hướng dẫn, Admin toàn bộ có thông tin phân công. Mở bài đã nộp trước khi phân tích, không chọn bài mẫu nếu muốn đánh giá bài nộp.
9. **Giảng viên:** Phân tích báo cáo → chọn bài → ngữ nghĩa → xem trích đoạn. Sang Chấm điểm/nhận xét, kiểm tra căn cứ theo rubric, lưu nháp hoặc xác nhận từng tiêu chí và lý do. Thiếu bằng chứng có thể chưa có điểm đề xuất; không phải lỗi BERT. Đề xuất rubric cần nhà trường duyệt, không tự thay quy định trường.
10. **Nhà trường:** chọn quy định chốt điểm rõ ràng, chờ review và KPI, chốt báo cáo. Sinh viên xem điểm đã công bố; không thấy bản nháp/điểm riêng trước đó.
11. **Ví TEST:** chỉ sinh viên/doanh nghiệp có công cụ ví. Tạo ví thử riêng hoặc dùng tài khoản Hardhat local, không dùng ví thật. Hồ sơ → Liên kết MetaMask → mật khẩu website → chọn chain31337 → ký thông điệp. Không yêu cầu seed/private key/mật khẩu MetaMask; hủy/dừng được trước khi lưu, kết quả muộn bị bỏ qua.
12. **Blockchain:** môi trường QA có deployment đúng18546. Sau khi báo cáo cuối kỳ, KPI, giờ làm được duyệt và thực tập hoàn tất, ghi hash báo cáo/giờ → Admin completion → mint → verify. Chỉ VERIFIED khi RPC/receipt/state thực khớp. Admin/mentor không cần kết nối ví trình duyệt; attestor local gửi giao dịch theo quyền Backend.
13. **IPFS:** hiện BLOCKED do thiếu cấu hình. Không bấm và hiểu hash đã có là upload thành công. Chỉ nghiệm thu upload sau khi ciphertext được readback/hash khớp với credentials hợp lệ.

## 4. Chạy lại test đã chuẩn bị

Các test sau ghi fixture riêng QA, không xóa DB. Chỉ chạy khi đã hiểu đúng môi trường; không chạy npm test bừa vào database đang dùng.

```powershell
node --test --test-concurrency=1 server/test/progress-evaluation.integration.test.js
node client/test/progress-report-v3-browser.cjs
node client/test/v3-role-session-browser.cjs
node scripts/demo/verify-v3-ai-roles.cjs
node contracts/scripts/workflow-hardhat.cjs test
```

`verify-v3-web3.cjs <thư-mục-browser-fixture-mới>` cần E2E browser đã chốt báo cáo; dùng một lần/fixture, không dùng lại ví/tài khoản đã mint của lần trước. Không thay đổi mining/time node đang chạy. Các bài AI ghi lịch sử bị giới hạn20lần/bài để tránh phình dữ liệu; tạo fixture mới khi cần.

## 5. RAM và cách dừng

Không tắt MongoDB27018 khi vẫn dùng website. Tắt đúng cách không xóa dữ liệu trên ổ đĩa nhưng Backend sẽ mất kết nối; login/CV/task/reports lỗi cho đến khi Mongo trở lại. Mongo27017 là bản legacy, có thể dừng sau khi xác minh không còn test/service dùng; chưa tự dừng trong đợt này. Đóng Compass chỉ đóng giao diện quản lý, khác với dừng mongod. Không xóa file trong dbpath để giải phóng RAM.

Chi tiết PASS/PARTIAL/BLOCKED/NOT TESTED ở [ma trận nghiệm thu](INTERNOVA_PRODUCTION_READINESS/FEATURE_MATRIX.md). Dữ liệu thực hành giữ provenance, không dùng làm bằng chứng độ chính xác trên người thật.

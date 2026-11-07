# Chạy và tự kiểm thử Internova

Hướng dẫn hiện hành ngày 07/11/2026, dùng **PowerShell**, chạy từng dòng riêng tại `D:\Web3-Internship-Management`. Các hướng dẫn cổng 5177/5182 cũ là lịch sử. Không dán cú pháp PowerShell vào CMD.

## 1. Chọn đúng môi trường

| Môi trường | Website | API | Database |
|---|---|---|---|
| Dữ liệu hiện có của bạn | http://localhost:5188 | http://localhost:57418/api | `internova_demo_cunhan_kysu_20261107` |
| Nghiệm thu thay đổi và thử ghi | **http://localhost:5189** | http://localhost:57419/api | **`internova_role_qa_20261107`** |

MongoDB của hai môi trường dùng replica set local `127.0.0.1:27018`, `internovaTestRs`, nhưng database khác nhau. Tài khoản của môi trường này không mặc nhiên tồn tại ở môi trường kia. Chỉ thử thay đổi dữ liệu trên **5189**. Database `web3_internship` và các demo cũ không được dùng làm nơi chạy regression.

Trong Compass, kết nối `mongodb://127.0.0.1:27018/?replicaSet=internovaTestRs`, sau đó chọn đúng database. Không restore/seed lại để sửa lỗi đăng nhập.

## 2. Kiểm tra công cụ và dịch vụ

```powershell
Set-Location D:\Web3-Internship-Management
node --version
npm.cmd --version
python --version
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object LocalPort -in 27018,8003,18546,57419,5189 |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Máy đã có Node 22.23.4, npm 10.9.9, MongoDB 8.0.34, dependencies và Python/runtime/model local đã chuẩn bị. Không cần cài lại dependency hoặc tạo `.env`. Với máy clone mới, xem `TEAM_QUICKSTART.md` và các tài liệu AI; cache/model và mật khẩu local không nằm trên GitHub.

Chỉ chạy lệnh khởi động một service khi cổng của nó chưa được sử dụng. Không kill tiến trình lạ để lấy cổng, không reset chain hoặc tạo thư mục MongoDB trống thay cho thư mục dữ liệu đang dùng.

## 3. MongoDB trước

Nếu cổng 27018 đang chạy, giữ nguyên. Nếu đã tắt, mở terminal riêng và dùng **đúng thư mục cũ**:

```powershell
$mongoExe = Join-Path $env:LOCALAPPDATA 'Programs/MongoDB/8.0.34/mongodb-win32-x86_64-windows-8.0.34/bin/mongod.exe'
$projectData = Join-Path $env:LOCALAPPDATA 'Web3-Internship-Management/MongoDB/workflow-rs-20261107'
if (!(Test-Path -LiteralPath $mongoExe) -or !(Test-Path -LiteralPath (Join-Path $projectData 'WiredTiger'))) { throw 'Không tìm thấy MongoDB hoặc dữ liệu cũ; dừng để xác minh đường dẫn.' }
& $mongoExe --bind_ip 127.0.0.1 --port 27018 --replSet internovaTestRs --dbpath $projectData --wiredTigerCacheSizeGB 0.25
```

Không gọi lại `rs.initiate`, không xóa lock/database. Launcher Backend kiểm tên replica set và database trước khi phục vụ API.

## 4. AI local

Giữ service 8003 đang chạy. Nếu chưa chạy, terminal riêng:

```powershell
Set-Location D:\Web3-Internship-Management
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/demo/start-synthetic-ai.ps1
```

Script dùng runtime/model có sẵn, kiểm hash classifier, không tải/cài gì. Thiếu artifact hoặc thiếu RAM thì dừng; không hạ guard hoặc tự đóng ứng dụng. Sentence-BERT dùng để đối chiếu nội dung. Bộ cảnh báo thử nghiệm dùng 1.000 báo cáo tổng hợp; không phải BERT đã fine-tune, không có độ tin cậy trên sinh viên thật đã được kiểm chứng.

## 5. Blockchain QA local (tùy luồng cần kiểm)

Tại máy hiện tại, chain mới đã được chuẩn bị ở **18546**. Giữ tiến trình này chạy; chain 18545 cũ không bị thay đổi.

Sau khi reboot, chỉ khi 18546 trống, mở terminal:

```powershell
Set-Location D:\Web3-Internship-Management
node contracts/scripts/workflow-hardhat.cjs node --hostname 127.0.0.1 --port 18546
```

Hardhat khởi động lại tạo chain instance khác. Metadata deployment cũ sẽ bị Backend từ chối; không coi certificate ở chain cũ là VERIFIED trên chain mới. Để chuẩn bị lại cần **đường dẫn deployment mới**, giữ file cũ để đối chiếu, cấu hình Backend đúng metadata và kiểm thử lại. Không ghi đè file deployment cũ hoặc chạy deploy mạng công khai. Không cần chain để đăng nhập email, quản lý hồ sơ, ứng tuyển, task hoặc báo cáo.

Kiểm thử contract trong EVM tạm thời, không tác động MongoDB:

```powershell
npm.cmd --prefix contracts test
```

## 6. Backend và Frontend QA

Fixture và tài khoản TEST đã chuẩn bị. Không chạy lại test chỉ để khởi động website vì mỗi lần test sẽ thêm một đợt dữ liệu TEST mới.

Terminal Backend:

```powershell
Set-Location D:\Web3-Internship-Management
node server/scripts/start-role-qa.cjs
```

Terminal Frontend:

```powershell
Set-Location D:\Web3-Internship-Management
$env:VITE_API_URL='http://localhost:57419/api'
node client/node_modules/vite/bin/vite.js client --host 127.0.0.1 --port 5189 --strictPort
```

Mở http://localhost:57419/api/health rồi http://localhost:5189. Dùng cùng hostname `localhost` khi đăng nhập/liên kết ví vì CORS và chữ ký có kiểm origin.

Tài khoản xem tại file local được Git ignore:

`contracts/node_modules/.cache/role-workflow-qa-20261107/manual-login-qa.txt`

File có Admin, doanh nghiệp, giảng viên, sinh viên đang thực tập, sinh viên chưa có đề tài và sinh viên có kỹ năng đáp ứng hai đề tài (`capabilityStudent`). Không đưa mật khẩu vào ảnh nghiệm thu, chat, Git hoặc dùng mật khẩu Gmail thật. Tài khoản đang dùng ở 5188 vẫn ở `workflow-combined-20261107/manual-login-combined.txt`.

## 7. Thử tuần tự bằng giao diện

1. **Admin:** đăng nhập → Kỳ & phân công → chọn loại và kỳ → xem thiếu đề tài/giảng viên. Doanh nghiệp, giảng viên và sinh viên không có menu quản lý kỳ/phân công của Admin.
2. **Sinh viên chưa có đề tài:** dùng `searchStudent` hoặc `capabilityStudent`. Kỳ thực tập của tôi → chọn kỳ được cấp → tìm theo tên/nội dung/công ty, lọc kỹ năng/doanh nghiệp, xóa bộ lọc, phân trang.
3. **CV/gợi ý:** mở CV của tôi, xem kỹ năng và GPA → Gợi ý đề tài phù hợp → chọn kỳ → chọn TF-IDF hoặc Sentence-BERT → Tìm đề tài phù hợp. `capabilityStudent` có đủ yêu cầu kỹ năng của đúng hai đề tài; đó là độ phủ kỹ năng khai báo, không phải xác suất được nhận. GPA không được tự cộng điểm.
4. **Ứng tuyển:** dùng sinh viên còn lượt, lưu CV, chọn đề tài còn chỗ → nhập nguyện vọng → xác nhận. Đề tài đã nộp chuyển sang lịch sử, không ứng tuyển trùng; tự rút/từ chối vẫn tính lượt.
5. **Doanh nghiệp:** Hồ sơ ứng tuyển → đọc CV snapshot đã gửi → xét/nhận/từ chối. Không có menu hoặc API xếp hạng AI. Nhận sinh viên chiếm một chỗ; các hồ sơ khác của chính sinh viên đó trong kỳ được kết thúc theo quy tắc hiện có.
6. **Chỗ cuối:** với đề tài chỉ còn một chỗ, nhận một sinh viên. Đề tài đóng “Đã đủ chỉ tiêu”; hồ sơ chờ khác của đề tài được kết thúc và hoàn lượt một lần. Sinh viên thua chỗ xem lý do, số lượt hoàn/còn lại, ứng tuyển đề tài khác nếu còn đủ điều kiện. Không tự mở lại khi tăng chỉ tiêu; muốn mở cần còn chỗ, đúng thời gian và lý do.
7. **Nhà trường:** sinh viên đã được nhận → phân công giảng viên, giữ đúng đề tài/công ty. Sinh viên chưa có đề tài chỉ phân bổ trực tiếp theo mốc bảy ngày và điều kiện doanh nghiệp cho phép; xem gợi ý không giữ chỗ hoặc tự phân công.
8. **Công việc:** doanh nghiệp chọn kỳ/sinh viên đã có phân công chính thức → giao task/nhật ký → sinh viên làm và nộp → doanh nghiệp/giảng viên xử lý trong phạm vi. Sinh viên chưa được phân công không được mở quyền công việc chỉ vì đã ứng tuyển.
9. **Giờ làm:** dùng sinh viên phân công active và trong thời gian. Chấm công → chọn thực tập → Vào ca → chờ ít nhất một phút thực → Ra ca → doanh nghiệp duyệt. Tổng giờ chỉ tính phiên đã duyệt. Không đổi đồng hồ Windows để tạo giờ.
10. **Báo cáo:** sinh viên đang thực tập nộp bài của mình → doanh nghiệp/giảng viên Xem bài báo cáo. Admin thấy MSSV, kỳ, đề tài, công ty và giảng viên ở mỗi dòng; có tìm kiếm/lọc/phân trang. Đổi ID sang sinh viên ngoài phạm vi phải bị từ chối.
11. **Chấm trước:** giảng viên chọn báo cáo → phân tích → xem bảy tiêu chí, căn cứ và giới hạn → kiểm tra/sửa điểm, nhận xét → xác nhận mới lưu. Không dùng tương đồng nội dung làm điểm. Doanh nghiệp đánh giá độc lập; Admin chỉ chốt khi đủ điều kiện.
12. **Kỳ đã kết thúc:** trong Báo cáo & kết quả chọn bài `[Tổng hợp]` → Xem bài báo cáo hoặc Đánh giá lại bài mẫu → sửa form thử, Chấm trước bài này → kiểm tra/chấm lại → hoàn tất phiếu thử → xuất JSON. Không thay điểm hoặc bài đã chốt; file xuất chưa là nhãn chuyên gia.
13. **Giữ trạng thái:** chọn kỳ/lọc/trang/mở giải thích → sang Hồ sơ → quay lại; dùng Back/Forward. Kết quả phân tích giữ trong bộ nhớ khi đổi tab, không tự gọi lại; reload không giữ kết quả nhạy cảm. Form chưa lưu hỏi trước khi bỏ; đăng xuất xóa state riêng tư.

## 8. Ví, QR và chứng nhận

Chỉ sinh viên/doanh nghiệp có khu vực ví trong Hồ sơ cá nhân. Giảng viên/Admin không cần ví cá nhân để làm nghiệp vụ. Dùng duy nhất ví TEST không có tài sản. Liên kết cần mật khẩu Internova và chữ ký challenge đúng origin; kết nối ví đơn thuần không thay thế xác minh chữ ký.

Để thử MetaMask bằng tay, tạo hồ sơ trình duyệt TEST riêng, dùng tài khoản Hardhat local không có tài sản thật, thêm mạng local chain ID `31337`, RPC `http://127.0.0.1:18546`. Không nhập ví/private key đang dùng thật. Khi popup đang chờ, xử lý popup đó rồi mới bấm lại. Kiểm tra tài khoản đang chọn khớp địa chỉ định liên kết; không dùng cùng một ví cho hai tài khoản.

Doanh nghiệp tạo QR cho phân công active; sinh viên chủ động mở camera/nhập QR và cấp vị trí. Camera/GPS thật cần thử trên thiết bị, quyền trình duyệt và vị trí thực; test thuật toán không chứng minh chống giả GPS tuyệt đối. Không tự điểm danh khi mở tab.

Ghi hash báo cáo, giờ được duyệt, phê duyệt hoàn tất và cấp SBT theo các điều kiện UI/API; Backend dùng attestor Hardhat local. Kiểm tra receipt/token/chain, không chỉ nhìn toast. IPFS chỉ dùng khi có credentials, khóa mã hóa và cho phép upload ngoài; thiếu thì báo chưa sẵn sàng. Không có CID hoặc giao dịch giả để vượt bước.

Chuyển tiền hỗ trợ toàn luồng chưa được nghiệm thu trong đợt này; không diễn giải kết quả SBT thành kết quả chuyển tiền. Không thử với tài sản thật.

## 9. Chạy lại kiểm thử khi cần

Các lệnh sau **thêm dữ liệu vào TEST**, không sửa database gốc. Chạy từ root, giữ MongoDB/AI sẵn sàng. Không cần rerun nếu chỉ muốn mở website.

```powershell
node --test server/test/role-workflow.integration.test.js
$env:ROLE_WORKFLOW_QA='true'
node --test server/test/workflow.integration.test.js
node client/test/role-workflow-browser.cjs
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
```

Fixture mới được tạo theo run ID; có marker database, kiểm topology và indexes, không xóa lần chạy trước. File `manual-login-qa.txt` được xuất lại cho đợt fixture mới nên dùng bản mới nhất. Muốn chạy bài SBT dài với chain/deployment QA đang đúng mới bật `WORKFLOW_SBT_TESTS=true`; không bật nhầm với chain vừa reset.

Lỗi 404 thường là không đúng phạm vi hoặc quyền đã thu hồi; 409 là dữ liệu/trạng thái đã thay đổi, hết chỗ hoặc chưa đến thời gian; 503 AI/Web3/IPFS là chưa sẵn sàng. Tải lại dữ liệu, xem log của đúng Backend; không seed/reset hoặc nới phân quyền để làm mất lỗi.

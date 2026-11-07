# KIỂM ĐỊNH BẢO MẬT

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

| CRITICAL | HIGH | MEDIUM | LOW | Tổng |
| --- | --- | --- | --- | --- |
| 0 | 10 | 8 | 3 | 21 |

Severity đánh giá theo tác động trên hệ thống đồ án, không gán CVSS/CVE chưa xác minh. Không khẳng định không có lỗi CRITICAL; chỉ chưa xác nhận lỗi thuộc mức này trong phạm vi kiểm định. 21 phát hiện dưới đây được nhóm theo nguyên nhân; không cộng trực tiếp vào 26 phát hiện A01–A26 cũ vì có chồng lặp.

| ID | Mức độ | Lỗi | File/vị trí | Bằng chứng/phạm vi | Cách sửa dự kiến |
| --- | --- | --- | --- | --- | --- |
| S01 | HIGH | Demo login cấp JWT không cần chữ ký | `server/src/routes/auth.routes.js:72` | FAIL mock: 200 + token; không guard môi trường | Tắt mặc định; demo mode riêng với DB riêng, không cấp quyền dữ liệu thật. |
| S02 | HIGH | Ghi receipt/chain ID vào topic người khác | `server/src/routes/topic.routes.js:352` | FAIL mock student cross-owner 200 và fake save | Owner/assignment guard, validate hash, RPC receipt chainId/address/event match, idempotency. |
| S03 | HIGH | Task status IDOR | `server/src/routes/internship.routes.js:255` | FAIL mock update tài nguyên owner khác200 | Lọc đồng thời _id + tenant + assignee; trả403/404 khi không quyền. |
| S04 | HIGH | Worklog review thiếu role/owner và enum | `server/src/routes/internship.routes.js:396` | FAIL mock student duyệt nhật ký người khác200 | Chỉ mentor/DN phụ trách; validate transition/status và runValidators. |
| S05 | HIGH | Check-in chấp nhận QR bất kỳ | `server/src/routes/internship.routes.js:286` | FAIL mock invalid hash200; không TTL/GPS/role | Phiên ngẫu nhiên/HMAC, thời hạn, company+assignment, chống reuse; server validate GPS theo chính sách. |
| S06 | HIGH | GET công khai tạo dữ liệu giả | `server/src/routes/internship.routes.js:95` | FAIL 4 mock GET mỗi request gọi fake write | Bỏ writes ở jds/tasks/history/worklogs; test assertions zero mutations. |
| S07 | HIGH | Chứng nhận giả xác minh thành công | `server/src/routes/internship.routes.js:422` | FAIL live query không tồn tại200 verified/onChain true | 404/verifiedfalse; chỉ xác minh receipt/token tồn tại đúng chain, bỏ fake tx/CID. |
| S08 | HIGH | Public sync và UI tự gọi thao tác ghi | `server/src/routes/internship.routes.js:470` | FAIL mock public sync200; Web3 mount POST theo source | Auth quản trị + giới hạn range/checkpoint; UI GET-only khi mount, queue worker có retry. |
| S09 | HIGH | Dữ liệu nội bộ được đọc công khai | `server/src/routes/data.routes.js:33` | Source public populate; live dữ liệu rỗng nên chưa chứng minh lộ hồ sơ thật | Auth/tenant scope và projection tối thiểu cho CV, email, báo cáo, đánh giá; DTO public riêng. |
| S10 | HIGH | DB xác nhận trước chain, UI vẫn báo thành công | `client/src/App.jsx:212` | Source catch console.warn sau REST; chưa gửi tx | Trạng thái pending/confirmed/failed; verify receipt phía server; không cấp chứng nhận từ DB status. |
| S11 | MEDIUM | Không giới hạn Origin mặc định | `server/src/app.js:10` | Live Origin https://audit.invalid được phản hồi allow-origin tương ứng | Allowlist origin chính xác theo môi trường; không coi CORS là authentication. |
| S12 | MEDIUM | Không rate-limit nonce/login/AI/sync | `server/src/app.js:11` | Source chỉ body limit1MB; chưa load test | Giới hạn per IP/wallet, cooldown nonce, quota AI, timeout/retry bounded. |
| S13 | MEDIUM | Nonce bị tiêu thụ trước khi chữ ký được kiểm | `server/src/services/authService.js:32` | Unit wrong sig bị từ chối nhưng nonce đã mất; nguy cơ DoS ví mục tiêu | Chỉ consume hợp lệ bằng atomic compare; rate-limit; bổ sung domain/URI/chain theo chính sách SIWE. |
| S14 | MEDIUM | Không kiểm chainId/signer so với JWT | `client/src/api/web3Client.js:34` | Source signer lấy từ ví hiện hành, không so JWT/chain | Kiểm expected chain + address; invalid session khi chain/account thay đổi; server verify receipt. |
| S15 | MEDIUM | Listener scope yếu/processed sớm/payload mất | `server/src/services/chainListener.js:44` | Unit ethers payload thiếu topicId; source match title OR chainID, chưa tenant/network | Decode theo fragment; chainId+contract+onChainID unique; processed sau atomic apply; replay/reorg handling. |
| S16 | MEDIUM | Nhiều collection ghi không nguyên tử/cạnh tranh | `server/src/routes/topic.routes.js:243` | Source lastversion+1, thiếu unique Assignment(topic,student), không transaction | Unique compound sau kiểm dữ liệu; transactions khi replica set hoặc outbox/compensation có idempotency. |
| S17 | MEDIUM | Task/worklog dùng công ty hardcode | `server/src/routes/internship.routes.js:247` | Source company fallback và thiếu kiểm quan hệ thực tập | Suy company từ assignment đã xác thực, không từ body/fallback ví mẫu. |
| S18 | MEDIUM | Backend nghe mọi interface | `server/src/index.js:22` | Fresh listener :::5000; Mongo loopback27017 | Local demo bind loopback khi được duyệt; production firewall/reverse proxy/TLS, allowlist. |
| S19 | LOW | JWT trong localStorage cần bảo vệ XSS | `client/src/api/client.js:9` | Source localStorage; chưa phát hiện sink dangerouslySetInnerHTML; không chứng minh XSS | CSP, hạn chế third-party; cân nhắc cookie HttpOnly+CSRF theo kiến trúc. |
| S20 | LOW | Thông báo lỗi downstream trả chi tiết | `server/src/services/ipfsService.js:20` | Source trả Pinata error details; chưa có token leak quan sát | Thông báo public ổn định + error code; log nội bộ redact secret, không log credential. |
| S21 | LOW | Venv/cache và metadata tracked gây vệ sinh repo kém | `ai-service/venv/pyvenv.cfg:1` | 8336 tracked files gồm venv; artifact/address local không chứng minh deploy | Sau duyệt loại generated khỏi tracking một cách bảo toàn; giữ lock/dependency và hướng dẫn tái tạo. |

## Các kiểm soát đã có và giới hạn

Nonce ngẫu nhiên TTL, chữ ký EIP-191, consume nonce chống replay, JWT_SECRET bắt buộc và không default yếu, JWT expiry, DB role refresh, owner/evaluator/student guards cho topic, whitelist profile và search regex escape là các kiểm soát hiện có. Unit chữ ký đúng/sai/replay/hết hạn và JWT sửa đổi đạt; /auth/me thiếu token trả401 thật. Demo-login làm suy yếu tổng thể xác thực dù luồng ký ví đúng.

Không thấy parser upload public, dynamic eval hay dangerouslySetInnerHTML trong app source đã rà; không kết luận miễn nhiễm XSS/NoSQL injection. Không chạy fuzzing, tải lớn hoặc khai thác dữ liệu thật. bcryptjs có dependency nhưng không có password authentication để xác nhận hash đúng. Chưa có phân tích file upload vì API chưa triển khai; khi thêm phải kiểm MIME/content/size/path và malware theo phạm vi.

JWT_SECRET chỉ kiểm boolean hợp lệ và tìm giá trị đã biết trong tài nguyên đã tải; không hiển thị secret. Không thấy giá trị JWT hiện dùng trong 4 tài nguyên HTTP Frontend đã kiểm tra; đây không phải bằng chứng mọi credential lịch sử đều an toàn. Mongo hiện loopback, chưa auth: hạn chế truy cập máy local trước khi dùng dữ liệu thật; không tự bật auth hay đổi cấu hình.

Không chạy npm audit/audit fix hoặc tra CVE online; warning dependency cũ không được gọi là lỗ hổng đã xác nhận chỉ từ tên phiên bản. Cần SCA riêng sau phê duyệt, tuyệt đối không auto-upgrade.

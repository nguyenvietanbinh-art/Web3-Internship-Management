# Danh sách lỗi và hướng sửa dự kiến

P0: chặn chạy hoặc làm mất tính đúng đắn/bằng chứng cốt lõi của demo. P1: cần sửa để demo xuyên hệ thống ổn định và đúng quyền. P2: thiếu yêu cầu/độ hoàn thiện cần xử lý sau đường chạy chính. Tất cả mục dưới đây là **đọc source (S)**, trừ mục có **thực kiểm tra (T)**. Kịch bản tái hiện ghi ở đây là đề xuất kiểm thử sau, không phải đã gửi request vào DB.

## A01 — P0 — Môi trường phiên audit chưa chạy được Node stack (T)

- File: `client/package.json`, `server/package.json`, `contracts/package.json`, `server/src/config/env.js:13`, `server/.env.example`.
- Bằng chứng: không tìm thấy node/npm trong PATH; không có ba node_modules; chỉ có `.env.example`. Backend fail-fast nếu JWT_SECRET thiếu/ngắn. Thiếu Pinata thì submit/complete trả 503 theo source, khác README.
- Tác động: chưa thể build client, chạy backend/Hardhat hoặc đi hết báo cáo–chứng nhận theo hướng dẫn hiện tại. Chưa kiểm tra biến môi trường của môi trường triển khai riêng.
- Sửa dự kiến: thống nhất Node theo engines lockfile, chuẩn hóa cấu hình mẫu và runbook; cấp JWT_SECRET/Pinata/Mongo URI đúng môi trường; cài từ lockfile ở đợt được phép cài. Không đưa secret vào Git. Sau đó build/boot có log.

## A02 — P0 — Chứng nhận không tồn tại vẫn được xác minh (S)

- File: `server/src/routes/internship.routes.js:410`, `client/src/components/Web3CertificateView.jsx` (`handleSearch`, badge VERIFIED).
- Bằng chứng: không tìm thấy topic trả sample `verified: true`, `onChain: true`; topic thật thiếu tx/CID cũng được điền mẫu, score 0 thành 85 qua `||`. `onChain` chỉ kiểm tra có field. UI luôn gắn ERC-5192/VERIFIED và không dựa flags.
- Tác động: tìm chuỗi bất kỳ có thể nhận chứng nhận giả; dữ liệu off-chain bị coi là bằng chứng thật. Tra numeric onChainId chưa được hỗ trợ dù UI ghi Topic ID.
- Sửa dự kiến: không tìm thấy trả 404; tách demo fixture có nhãn; API kiểm tra receipt, chain, contract, event hoàn tất và CID/token; UI chỉ hiện verified khi có bằng chứng. Định nghĩa rõ Mongo ID và on-chain ID. Kiểm thử query không tồn tại, topic chưa hoàn tất, score=0, tx bị revert.

## A03 — P0 — Người dùng bất kỳ có JWT được ghi txHash/onChainId cho mọi topic (S)

- File: `server/src/routes/topic.routes.js:352`, `server/src/models/Topic.js`.
- Bằng chứng: `/record-chain-tx` chỉ requireAuth/loadTopic, không owner/evaluator/student theo action, không xác minh receipt/chain/address/event; nhận trực tiếp txHash và Number(onChainId).
- Tác động: có thể làm giả liên kết on-chain và ảnh hưởng bộ đồng bộ/tra chứng nhận.
- Sửa dự kiến: chỉ lưu thông qua dịch vụ xác minh receipt thành công đúng deployment và action/topic/signer, xác minh quyền; ràng buộc ID/tx, ghi lịch sử giao dịch theo action; test người ngoài, hash giả, chain sai, tx không liên quan.

## A04 — P0 — DB thành công trước, giao dịch lỗi bị bỏ qua (S)

- File: `client/src/App.jsx:195`–các handler assign/create/submit/evaluate/complete; `client/src/api/web3Client.js` (`createTopicOnChain`).
- Bằng chứng: REST ghi trước, `catch(chainErr)` chỉ console.warn, tiếp tục toast thành công; addKPI lỗi từng lần vẫn trả kết quả create; không tìm event còn dùng `onChainId || 1`.
- Tác động: hủy ký/mất RPC vẫn báo cấp SBT/hoàn tất; DB đã khóa thao tác nên không có luồng retry chain rõ ràng; chain có thể thiếu KPI.
- Sửa dự kiến: orchestration với trạng thái offchain/pending/submitted/confirmed/failed, retry idempotent theo action; không tạo ID mặc định; partial KPI phải được đánh dấu và khôi phục; chỉ báo on-chain sau receipt đã được backend xác minh. Test hủy ký từng bước, tx revert, addKPI thất bại giữa chừng và retry.

## A05 — P0 — Chưa có NFT/SBT dù UI thông báo đã mint (S)

- File: `contracts/contracts/InternshipPlatform.sol` (`completeInternship`), `contracts/contracts/InternshipRegistry.sol`, `client/src/App.jsx:368`, `client/src/components/Web3CertificateView.jsx`.
- Bằng chứng: contract chỉ đặt cờ/CID và emit, không có token ownership, tokenURI, mint, locked/interface tương ứng; Registry cũng không cấp token.
- Tác động: chưa đáp ứng yêu cầu NFT/SBT của đề cương; không thể chứng minh token nằm trong ví.
- Sửa dự kiến: bổ sung contract chứng nhận chuẩn được chọn và liên kết assignment/topic, mint một lần sau nghiệm thu, metadata/tokenId và phép đọc xác minh; cập nhật UI đúng khả năng thực tế. Test duplicate mint và transfer/locked nếu chọn SBT. Không coi boolean certificateIssued là NFT.

## A06 — P0 — QR không được xác thực và không phải mã quét thật (S)

- File: `server/src/routes/internship.routes.js:273`, `client/src/components/AttendanceView.jsx` (`Simulated QR Code Graphic`, `handleStudentCheckIn`).
- Bằng chứng: UI vẽ CSS và nút gửi hash sẵn có, không scanner. Check-in không so hash/ngày/hạn; thiếu hash vẫn ghi `QR-VERIFIED`; không role student, GPS, assignment, blockchain. Công ty hardcode; ngày UTC nhưng giờ lấy timezone host.
- Tác động: bất kỳ tài khoản đăng nhập có thể điểm danh không quét, kể cả sai công ty/ngoài vị trí; không đáp ứng yêu cầu QR chính xác thời gian/vị trí.
- Sửa dự kiến: session QR thật có chữ ký và hạn, scope công ty/assignment, scanner; backend xác minh token, role, thời gian theo timezone nghiệp vụ, vị trí theo chính sách, chống replay; lưu và đồng bộ chain đúng yêu cầu. Test hash sai/rỗng/hết hạn/ngày mới/tài khoản company/GPS ngoài vùng.

## A07 — P1 — API đọc tự tạo dữ liệu, mở trang cũng ghi DB (S)

- File: `server/src/routes/internship.routes.js:95` (jds), `:197` (tasks), `:313` (attendance/history), `:341` (worklogs); `client/src/components/AttendanceView.jsx`.
- Bằng chứng: GET gọi create/insertMany khi kết quả rỗng; history/worklogs có thể tạo mẫu ví cố định dù filter ví khác. Sample attendance gồm hôm nay nên sinh viên demo có thể bị 409 ngay lần check-in đầu. Mở tab gọi GET history trước.
- Tác động: dữ liệu mẫu lẫn dữ liệu thật; người lạ truy cập cũng làm DB thay đổi; kết quả không đúng filter. Đây là lý do không mở UI/backend khi audit.
- Sửa dự kiến: GET chỉ đọc, empty trả mảng rỗng; chuyển fixture sang seed explicit trong DB demo riêng và đánh dấu sample; test không có write từ mọi GET và filter ví lạ không trả mẫu.

## A08 — P1 — Task/nhật ký thiếu phân quyền theo đối tượng (S)

- File: `server/src/routes/internship.routes.js:240`, `:255`, `:379`, `:396`; `server/src/models/Task.js`, `WorkLog.js`.
- Bằng chứng: create/status/review chỉ requireAuth; review không role/evaluator/owner, không runValidators; student có thể tự duyệt hoặc cập nhật task khác nếu biết ID. Company hardcode cho nhiều đường ghi.
- Tác động: sai quyền doanh nghiệp/mentor/sinh viên, sửa dữ liệu người khác, status nhật ký ngoài enum có thể lọt qua query update.
- Sửa dự kiến: middleware scope theo công ty–assignment–sinh viên, role trên từng action; validate ID/payload/status và runValidators; chỉ evaluator được chỉ định duyệt. Test chéo ít nhất hai company/hai student và 401/403.

## A09 — P1 — Giao task từ UI bị gán cho chính công ty (S)

- File: `client/src/components/AttendanceView.jsx` (`taskForm`, `handleCreateTask`), `server/src/routes/internship.routes.js:240`.
- Bằng chứng: form không chọn student/topic; server fallback `assignedStudentWallet || req.user.walletAddress`. Company tạo task sẽ trở thành người nhận.
- Sửa dự kiến: chọn sinh viên thuộc assignment, gửi assignment/topic ID, backend suy ra company và student, từ chối thiếu người nhận; scope dữ liệu tải theo người dùng. Test giao cho student và student thấy đúng task.

## A10 — P1 — Demo-login bỏ qua bảo vệ chữ ký và không giới hạn môi trường (S)

- File: `server/src/routes/auth.routes.js` (`DEMO_ACCOUNTS`, `/demo-login`), `client/src/api/client.js` (`demoLoginWallet`).
- Bằng chứng: endpoint công khai cấp JWT có quyền ghi của company/student/mentor preset, không feature flag hoặc DB demo riêng. Trong khi login-wallet chặn tự đăng ký mentor, demo-login lại có preset mentor.
- Tác động: có thể mạo danh các ví demo và thực hiện nghiệp vụ thật trên cùng DB; JWT demo không chứng minh quyền ký MetaMask.
- Sửa dự kiến: mặc định tắt ngoài demo local cô lập; không cho demo JWT ghi dữ liệu thật/ghi nhận chain; bỏ mentor shortcut công khai hoặc chỉ fixture hạn chế. Test môi trường thật không mở endpoint.

## A11 — P1 — Listener có nguy cơ mất payload sự kiện ethers v6 (S, cần runtime xác nhận)

- File: `server/src/services/chainListener.js` (`syncPastEvents`, `contractInstance.on("*")`).
- Bằng chứng: duyệt Object.keys(args) rồi chỉ lấy key không phải số. ethers v6 Result là tuple, truy cập named args không đồng nghĩa key enumerable. Wildcard dựa event.args/eventName mà không parse event.log bằng interface. Nhánh parse lỗi bị bỏ qua.
- Tác động dự kiến: ChainEvent được lưu nhưng payload không có topicId hoặc tên UnknownEvent; Topic không đồng bộ.
- Sửa dự kiến: parse log chung một hàm, map fragment.inputs theo index hoặc Result.toObject hợp lệ, chuyển bigint có kiểm soát; test bằng log fixture ABI cho toàn bộ event và realtime/backfill. Chưa chạy ethers nên chưa khẳng định đã tái hiện.

## A12 — P1 — Listener đánh dấu xử lý sớm, định danh topic yếu, đồng bộ thiếu (S)

- File: `server/src/services/chainListener.js` (`processChainEvent`, `syncPastEvents`, `startChainListener`), `server/src/models/ChainEvent.js`, `Topic.js`.
- Bằng chứng: ghi `processed:true` trước khi cập nhật Topic; TopicCreated tìm `$or` onChainId/title không company/deployment; chỉ cập nhật embedded Topic, không Assignment/Submission/Evaluation/Student; quét từ block 0; không checkpoint/reorg/chainId/contract scope; RPC lỗi chỉ return, không có lịch retry dù log nói thử lại.
- Tác động: topic trùng tên bị nối nhầm; lỗi DB vẫn mang nhãn processed; mất đồng bộ normalized; replay chậm, sai dữ liệu khi đổi node/mạng.
- Sửa dự kiến: lưu raw event pending với chainId/address/blockHash, liên kết Mongo ID qua receipt đã xác minh; processed sau khi cập nhật đủ; checkpoint/confirmations/retry/idempotency và xử lý reorg; test crash giữa chừng, hai title giống nhau và replay.

## A13 — P1 — Cấu hình Hardhat có dấu hiệu không tương thích chế độ module (S, chưa tái hiện)

- File: `contracts/package.json` (`type:module`, Hardhat ^2.29.1), `contracts/hardhat.config.js` (import/export).
- Tác động dự kiến: Hardhat 2 thường yêu cầu config CommonJS trong dự án ESM, có nguy cơ HH19 hoặc lỗi nạp config trước compile/test/deploy. Artifact sẵn có không chứng minh cấu hình hiện tại chạy được.
- Sửa dự kiến: xác minh bằng đúng phiên bản lockfile; chọn cấu hình `.cjs` và require/module.exports phù hợp Hardhat 2 hoặc migration phiên bản được kiểm chứng; đồng bộ deploy/test. Chạy compile offline khi compiler đã có; không dùng npx tự tải trong audit.

## A14 — P1 — API và chain dùng quy tắc nghiệp vụ khác nhau (S)

- File: `contracts/contracts/InternshipPlatform.sol` (`assignStudent`, `addKPI`, `submitKPI`, `evaluateKPI`, `completeInternship`), `server/src/routes/topic.routes.js`, `server/src/middleware/auth.js`.
- Bằng chứng: API cho mentor chỉ định chấm, chain chỉCompany; API chặn nộp lại submitted, chain cho ghi đè; API assign yêu cầu KPI=100, chain không yêu cầu; backend làm tròn Math.round còn Solidity chia nguyên. Ví dụ KPI 50/50, điểm 80/81: API 81, chain 80.
- Sửa dự kiến: chốt policy chung, triển khai quyền mentor/giới hạn trạng thái trên cả hai phía; thống nhất rounding và validation ngày/CID; dùng cùng bộ test vector. Bổ sung API/UI chỉ định mentor và cấp tài khoản hợp lệ.

## A15 — P1 — Chưa kiểm soát chainId/signer, dễ lệch JWT demo với MetaMask (S)

- File: `client/src/api/web3Client.js` (`getInternshipContract`, `checkContractConnection`), `client/src/App.jsx` (điều kiện selectedAddress), metadata client/server, `server/src/services/chainListener.js`.
- Bằng chứng: metadata 31337 nhưng hàm dùng chain MetaMask hiện tại không đối chiếu; thiếu chainChanged; selectedAddress chỉ chứng minh có ví, không khớp wallet JWT. Listener dùng RPC riêng không xác nhận chain đúng metadata.
- Sửa dự kiến: kiểm tra chainId/address bytecode/deployment và signer=JWT wallet trước tx; tách session demo; yêu cầu switch chain và cập nhật UI khi đổi chain; backend xác minh cùng deployment. Test sai network, ví khác, node reset.

## A16 — P1 — Ghi nhiều collection không nguyên tử, thiếu chống cạnh tranh (S)

- File: `server/src/routes/topic.routes.js` (assign/submit/evaluate/complete), `server/src/models/Assignment.js`, `Submission.js`, `Topic.js`.
- Bằng chứng: find/read rồi save nhiều document, không transaction hoặc compare-and-set; Assignment không unique(topicId,studentId); submission đọc version cuối rồi +1. Không có idempotency cho upload/complete.
- Tác động: hai request đồng thời có thể phân công trùng/ghi đè, version collision, DB trạng thái nửa chừng và orphan IPFS pin.
- Sửa dự kiến: transaction nếu topology hỗ trợ, unique indexes theo business key, optimistic concurrency/atomic conditions và idempotency key; tách external upload qua outbox/saga. Test request đồng thời và lỗi từng bước ghi.

## A17 — P1 — CV không lưu, ứng tuyển chỉ toast (S)

- File: `client/src/components/CvJdView.jsx` (`cvForm`, nút Ứng tuyển), `server/src/models/Student.js`, `server/src/routes/internship.routes.js`.
- Bằng chứng: skills/bio/GPA/trường ở state, không gọi PUT profile/student; GPA và university chung input tạo chuỗi ghép lặp. Nút ứng tuyển chỉ showToast, không Application model/API/xét duyệt. Chưa có upload/trích xuất CV/PDF/DOCX; `cvCid` chỉ là field.
- Sửa dự kiến: form lưu profile, tách GPA/university; upload/trích văn bản an toàn và lưu metadata; thêm Application và trạng thái nộp/duyệt/từ chối gắn JD–student–assignment; UI chờ API thành công mới báo gửi.

## A18 — P1 — Điểm AI giả lập và provenance chưa rõ (S + T cho report)

- File: `client/src/components/CvJdView.jsx` (`similarity_score ?? 80`, requirements.slice), `DashboardView.jsx` (fallback 16/6/12 và score 88), `server/src/services/aiClient.js`, `ai-service/main.py` (`suggested_score`), `server/src/models/Topic.js` (aiAnalysis).
- Bằng chứng thực chạy: báo cáo rỗng/lạc đề relevance=0 nhưng suggested=50; endpoint AI nhận báo cáo rỗng HTTP 200. Source matching fallback chặn điểm ở 20..95 và thiếu engine; UI mặc định 80% dù chưa chạy matching. Embedded KPI aiAnalysis không khai báo engine nên sau reload có thể mất provenance và UI fallback nhãn BERT.
- Sửa dự kiến: trạng thái chưa phân tích/không khả dụng thay điểm bịa; trả engine/model/version/fallback ở mọi nhánh và lưu đủ; xử lý rỗng 422 hoặc score không gợi ý, không áp sàn 50; đánh giá calibration bằng dữ liệu gán nhãn. Đừng coi 12 smoke checks là xác nhận chất lượng.

## A19 — P2 — Đa slot chưa dùng được và hai contract chưa thống nhất (S)

- File: `server/src/routes/topic.routes.js:187`, `server/src/models/Topic.js`, `contracts/contracts/InternshipPlatform.sol`, `InternshipRegistry.sol`, `contracts/scripts/deploy.js`.
- Bằng chứng: API nhận maxSlots>1 nhưng lần assign đầu đổi status assigned, lần tiếp bị chặn; chỉ có một assignedStudentWallet và bộ KPI chung. Registry có nhiều assignment nhưng không được deploy/tích hợp.
- Sửa dự kiến: trước demo chốt một-sinh-viên và giới hạn maxSlots=1; nếu cần đa slot thì chuyển KPI/submission/score sang assignment và chọn contract canonical; không trộn ID/event của hai contract.

## A20 — P2 — Venv không di chuyển được, BERT chưa được triển khai đủ (T + S)

- File: `ai-service/venv/pyvenv.cfg`, `ai-service/requirements.txt`, `ai-service/main.py`.
- Bằng chứng thực chạy venv: `No Python at 'C:\Users\admin\AppData\Local\Programs\Python\Python310\python.exe'`. Source chọn all-MiniLM-L6-v2 tùy AI_ENGINE nhưng requirements không chứa sentence-transformers, tải model lỗi sẽ fallback TF-IDF.
- Sửa dự kiến: tạo môi trường riêng tái lập theo Python/dependency được khóa sau khi được phép; không version-control venv; provision model đã chọn, health báo rõ fallback; đánh giá hỗ trợ tiếng Việt bằng dữ liệu đồ án. Không khẳng định BERT lỗi trong runtime global vì audit chỉ chạy TF-IDF.

## A21 — P2 — Thiếu quản lý giờ làm, AI cảnh báo và dashboard nhà trường (S)

- File: `server/src/models/Attendance.js`, `Task.js`, `WorkLog.js`, `server/src/routes/internship.routes.js`, `ai-service/main.py`, `client/src/App.jsx`.
- Bằng chứng: chưa có checkout/duration/timesheet; WorkLog không gửi AI/IPFS; chưa có riskStatus/notification/queue; role UI chỉ student/company, không quản trị trường/admin độc lập. Chưa có auth mật khẩu/reset/khóa tài khoản như use case Word.
- Sửa dự kiến: bổ sung timesheet và phê duyệt, pipeline AI tuần/cảnh báo có lưu kết quả và retry; vai trò/trang quản trị, tài khoản/mentor; thống nhất thay đổi phạm vi wallet-only với tài liệu hoặc triển khai luồng mật khẩu được yêu cầu. Ghi rõ các phần chưa làm trong demo.

## A22 — P1 — Seed không an toàn cho dữ liệu đang dùng và không đồng nhất (S)

- File: `server/scripts/seed.js` (dropIndex/deleteMany/$set đầu script), `database/seed.mongodb.js` (profile $setOnInsert userId và mẫu đầu), `docs/mongodb-setup.md`.
- Bằng chứng: Mongoose seed xóa evaluation trùng không lựa chọn bản mới nhất, drop index, ghi đè mẫu; mongosh query bằng actual user ID nhưng insert profile với ids.companyUser/ids.studentUser cố định; mẫu submission/evaluation đầu thiếu milestoneIndex và filter không scope milestone. Script trực tiếp bỏ qua schema middleware.
- Tác động: chạy sau demo-login có thể tạo profile trỏ ID không tồn tại; chạy hai seed/seed lại có thể gây dữ liệu không nhất quán hoặc reset trạng thái nghiệp vụ.
- Sửa dự kiến: tách migration và fixture, require DB demo riêng; dùng actual IDs và business keys đầy đủ, validator/weighted score thống nhất, migration có backup/dry-run và khôi phục index được kiểm chứng. Audit không chạy seed.

## A23 — P1 — Test helper xóa database, test script contract chưa dùng tests (S)

- File: `server/test/helpers.js:1`, `:15`, `:22`; `server/test/foundation.test.js`; `contracts/package.json`; `contracts/test/InternshipPlatform.test.js`.
- Bằng chứng: MONGODB_URI_TEST được nhận tùy ý rồi dropDatabase cả trước/sau; không guard tên DB/allowlist. Contract npm test luôn exit 1. Backend tests có IPFS stub `bafyTEST`, contract tests dùng chuỗi Qm mẫu: không là bằng chứng upload thật. Thiếu coverage nhóm internship/chain/new features.
- Sửa dự kiến: DB test disposable với guard hostname/name bắt buộc, reset có scope; scripts chạy đúng test runner; thêm negative/integration cases cho A02–A18 và Registry nếu chọn; test Pinata/testnet riêng có bằng chứng. Bộ test backend không được chạy trong audit này.

## A24 — P2 — Tài liệu chạy và triển khai không phản ánh source (S)

- File: `README.md`, `docs/PROGRESS.md`, `docs/analysis.md`, `docs/api-queries.md`, `docs/mongodb-setup.md`, `server/.env.example`, `client/netlify.toml`, `contracts/hardhat.config.js`.
- Bằng chứng: README thiếu bước JWT và nói local IPFS fallback; docs nói auth/listener chưa có; PROGRESS nói chưa có source. Chain chỉ config local/hardhat, chưa có Sepolia; chưa thấy backend/AI deployment manifest, benchmark, Postman/Lighthouse/UAT artifacts. VITE_API_URL mặc định localhost, CORS mẫu 5173; public frontend cần cấu hình backend HTTPS thật.
- Sửa dự kiến: cập nhật tài liệu sau khi chốt code, bảng env/cổng/phiên bản/network/ABI và check sẵn sàng; deploy API/AI/Atlas/frontend/testnet theo yêu cầu và lưu bằng chứng. Không suy deployment đã có từ netlify.toml.

## A25 — P2 — UI trạng thái/quyền không khớp API (S)

- File: `client/src/App.jsx:50`, `:830`, `:984`, `client/src/api/client.js` (`apiRequest`), `client/src/components/AttendanceView.jsx`.
- Bằng chứng: student thấy nút cập nhật khi submitted dù server trả 409; mọi company thấy nút owner trên đề tài khác; assigned bị label thành đã hoàn thành ở danh sách; mentor/admin quy về company; xóa token khi 401 không xóa ngay user state; attendance/worklogs lấy toàn bộ không scope và chỉ fetch lúc mount.
- Sửa dự kiến: predicates theo role+ownership+assignment+trạng thái thống nhất API, mapping status đầy đủ, session-expired signal và refetch khi đổi user; hiển thị lỗi tải rõ ràng. Test logout/login người khác, token hết hạn, submitted/rejected/assigned.

## A26 — P2 — API đọc công khai dữ liệu nội bộ, thiếu phân trang ở nhóm mới (S)

- File: `server/src/routes/data.routes.js` (students/submissions/evaluations/ai-analyses), `server/src/routes/auth.routes.js` (`/profile/:wallet`), `server/src/routes/internship.routes.js` (tasks/history/worklogs/dashboard), `server/src/routes/topic.routes.js` (GET list/detail).
- Bằng chứng: nhiều GET không requireAuth và trả note/bio/email/báo cáo/điểm theo ID/filter do client chọn; nhóm internship và topics legacy đọc toàn bộ hoặc giới hạn cứng, không phân trang giống `/api/data`.
- Sửa dự kiến: chốt trường public/private theo vai trò, projection và scope server, không dùng query wallet làm quyền; phân trang và giới hạn tải; test người lạ không đọc báo cáo riêng. Đối chiếu chính sách dữ liệu đã được nhóm chọn trước khi đưa demo lên mạng công khai.

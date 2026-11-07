# BLOCKCHAIN, IPFS VÀ CHỨNG NHẬN

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Compile khác với runtime

Hardhat2.29.1 nạp được config ESM trên Node22.23.4, toolbox6.1.2. Compile mới **2 file Solidity0.8.24, optimizer200, EVM paris**, exit0, không có Solidity warnings/errors trong build-info. A13 cũ về HH19/ESM **không tái hiện**, không có lý do tự đổi CommonJS. ABI/address metadata tracked và cache/artifact gốc không ghi đè. Bản sao byte-identical package/config/source đặt ở ignored staging mới; không copy deploy/test/.env. RPC8545 không nghe. Không deploy, không ký/gửi transaction, không chạy local EVM test trong audit.

## Hai contract và khác biệt

| Chủ đề | InternshipPlatform | InternshipRegistry / Backend | Tác động |
| --- | --- | --- | --- |
| Mô hình | 1 student/topic; KPI embedded on-chain | Registry nhiều assignment; API schema maxSlots nhưng status assigned sau1 người | Cần chọn canonical, không coi nhiều slot đã chạy |
| Role | registerProfile nhận role text, không dùng role đó làm ACL; onlyCompany dựa topic.company | API dùng DB role; mentor evaluator ở API | Mentor gọi chain evaluate sẽ fail theo source |
| Assign | Open, nonzero student; không bắt totalKPI100 lúc assign | API bắt weight100 và student đăng ký | Validation lệch |
| Submit | Chặn Approved; cho ghi lại Submitted; không guard project state giống API | API chỉ pending/rejected, không khi ended | State machine lệch |
| Add KPI | Open/Assigned, total<=100 | API open và tạo topic đã total100 | UX/thời điểm khác nhau |
| Complete | Tất cả approved +total100; floor(weighted/100); lưu cờ/CID/event | API Math.round, Pinata bắt buộc | Unit equal weights80/81 cho chain80/API81 |
| Certificate | Không ERC721/5192/tokenId/mint/ownerOf/locked | UI/API ghi NFT/SBT/minted | Chưa đáp ứng chứng nhận token |
| Deployment | deploy.js chỉ Platform | Registry chưa nối UI/listener/deploy | Không có runtime Registry |

`contracts/contracts/InternshipPlatform.sol:201` completeInternship không mint token; cờ certificateIssued không phải SBT. Không có cơ chế thu hồi/định danh chứng nhận chuẩn. Không kết luận contract audited an toàn tài sản; chưa chạy negative/permission/reentrancy EVM tests. Không thấy luồng chuyển ETH/token trong nghiệp vụ hiện tại.

## Wallet và giao dịch

client/src/api/web3Client.js dùng BrowserProvider hoặc read-only127.0.0.1:8545; không check expected chainId hoặc signer đối chiếu JWT. App account-change có logout nhưng chưa đủ chain/signature scope. createTopicOnChain catch lỗi addKPI rồi tiếp tục, fallback onChainId1 nếu không parse event. App gọi REST trước, catch chain warning rồi vẫn success. record-chain-tx tin client gửi arbitrary strings/number và thiếu owner: test mock student sửa topic của công ty khác trả200. Chưa có receipt verification phía server, idempotency và status pending/failed/confirmed.

Nonce EIP-191 ký ví được unit-test đúng/sai/hết hạn/replay; không tốn gas. Chưa domain/chain binding theo SIWE, không tự suy ra replay toàn hệ thống đã khai thác được. Demo-login bỏ qua chữ ký hoàn toàn nên phải xử lý P0.

## Listener và đồng bộ

`server/src/services/chainListener.js:132` duyệt Object.keys(parsed.args), bỏ numeric keys. ethers6 Result chỉ expose numeric enumerable keys: test ABI encode/parse thuần tái hiện payload thiếu topicId, nên listener có thể ghi event nhưng không sửa Topic đúng. Realtime wildcard có cấu trúc args/eventName cần kiểm lại trên network test cô lập.

processChainEvent upsert processed=true trước updateTopic; match TopicCreated bằng onChainId OR title không company/chain/address. Không đồng bộ Assignment/Submission/KPIEvaluation normalized, không checkpoint/resume/reorg, không xác nhận đủ blocks. POST public sync từ0 và UI mount làm phát sinh write không mong muốn. Cần decode bằng event fragment, key(chainId,contract,txHash,logIndex), apply idempotent rồi processed, retry và reconcile.

## IPFS và xác minh

Pinata helper upload JSON/binary có assertConfigured, không sinh CID giả; thiếu PINATA_JWT trả503. Binary helper chưa route upload/CV. Submit/complete bị chặn bởi cấu hình hiện tại. Chưa upload/pin/readback thật, không có proof CID hash match dữ liệu hoặc gateway availability. Metadata có tên/ví/điểm nên cần chính sách riêng tư trước public IPFS.

`server/src/routes/internship.routes.js:410` tra query không tồn tại vẫn trả verified/onChain true với tx/CID/address mẫu. **FAIL live trên DB0document**, không phải nhận định từ source. Topic tồn tại cũng có finalScore||85, tx/CID fallback; DB completed không chứng minh chain. UI badge SBT không thay ownerOf/locked/receipt. Cần404, validate chain/contract/token/query và trả trạng thái unknown/unconfirmed; không gắn fake mẫu vào nhánh production.

Trước demo Web3 cần chọn contract, đồng bộ rubric/roles/state, dựng EVM test độc lập, test receipts/events/failure/retry, sau đó mới xin duyệt deploy local/testnet. Không được tuyên bố Sepolia/IPFS/NFT đã hoạt động chỉ vì compile.

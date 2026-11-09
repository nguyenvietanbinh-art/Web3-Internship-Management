# Chuẩn bị deploy Sepolia — chưa deploy — 09/11/2026

Người vận hành cung cấp RPC HTTPS, địa chỉ signer TEST riêng và test ETH. Không dùng khóa Hardhat công khai hoặc master key custody. Không gửi khóa vào chat/Git/frontend.

Compile đúng source InternshipEvidenceSBT.sol bằng Solidity 0.8.24 và settings đã review; lưu source hash, ABI và bytecode. Chuẩn bị transaction chưa broadcast, kiểm gas và balance bằng RPC chỉ đọc khi có endpoint.

Dừng trước deploy công khai để duyệt network, signer public, source hash và gas limit. Sau khi được duyệt mới deploy, xác minh receipt status 1, canonical block, code hash, owner và writer; tạo manifest Sepolia riêng. Verify source bằng công cụ explorer được duyệt, không đưa API key vào Git.

Script deploy local không được dùng nguyên trạng để chuyển mạng. Chưa có deployment/verify script Sepolia đã nghiệm thu trong lượt này. Chưa gửi giao dịch hoặc mint SBT. Mỗi ca nghiệm thu cần phê duyệt riêng trước khi thực hiện.

## Source đã bổ sung trong lượt tiếp tục

- `server/src/config/sepoliaPolicy.js`: cấu hình fail-closed Sepolia/HTTPS/host và manifest; đọc xác minh deployment, canonical block và tối thiểu12confirmation. Không gọi hardhat_metadata trên Sepolia.
- `contracts/scripts/sepolia-preflight.cjs`: `prepare` tạo unsigned deploy plan từ artifact có sẵn, không RPC/key/broadcast; `verify` chỉ đọc receipt/code/owner/writer/standard khi có manifest và RPC. Chưa có script broadcast, cần phê duyệt riêng và kiểm compiler/settings.
- `server/src/services/cloudJournalStore.js`: store MongoDB majority transaction, issuer lease/fencing, unique operation/nonce; yêu cầu guard và index/collection có sẵn, không tự provision. Chưa gọi lên Atlas.
- `server/src/services/cloudTransactionGateway.js`: EIP-1559, raw trước broadcast, retry cùng hash, receipt/reorg gate; provider/store/verifier được inject.
- `server/test/cloud-web3-preparation.test.js`:12test PASS với provider/store kiểm soát. Không có giao dịch thật hoặc mint.

Các module mới chưa được nối vào localWeb3/custodialRuntime/worker đang chạy. Không được hiểu chúng là Cloud đã sẵn sàng chỉ bằng đổi biến môi trường. Cần hoàn thiện runtime adapter và custody policy/key backup portable, thử majority/lease/index/restore trên môi trường được phép rồi mới nghiệm thu live. Không có kết quả E2E Cloud mới.

Không commit/push, không thay env/secret thật, không tạo ví hoặc quét backlog.

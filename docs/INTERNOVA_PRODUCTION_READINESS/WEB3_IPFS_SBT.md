# Blockchain và IPFS

Hardhat local QA cổng18546, chain31337; contract hiện tại `InternshipEvidenceSBT`, địa chỉ xem bằng chứng web3.json. Đã sử dụng đúng deployment metadata, instance/genesis/code hash, receipt/event/state. Không deploy công khai, không dùng private key/ví thật, không đổi automine/reset/đồng hồ của node đang dùng.

Chạy thật: liên kết ví TEST bằng password reauth/cookie/origin/nonce/chữ ký; QR checkin/out; duyệt giờ; anchor hash báo cáo cuối kỳ đã duyệt (không CID); anchor giờ; Admin hoàn tất; mint và verify ERC721/ERC5192 không chuyển nhượng. Tx/token/contract có trong `../evidence/v3-20261107/web3.json`. Lặp anchor trả cùng giao dịch. Unit Solidity kiểm tra owner/writer/replay/duplicate mint/SBT transfers/unknown token.

`InternshipRegistry.sol` bổ sung chặn đúng thời hạn đăng ký và chặn sinh viên trùng trong một topic; 3 EVM tests PASS. Đây là source/compile/test, chưa thay deployment đang chạy và chưa phải luồng deadline/roster/tuần tích hợp đầy đủ.

IPFS adapter mã hóa AES256-GCM, xác thực CID, readback/hash/timeout và không có fake success. Unit dùng **mock transport**, không phải upload thật. Live upload/readback **BLOCKED** vì runtime chưa có PINATA_JWT, REPORT_ENCRYPTION_KEY/keyId và quyền upload ngoài. Không tự tạo/thay key làm mất khả năng đọc tệp cũ. Hash on-chain không đồng nghĩa tài liệu đã lên IPFS.

Một lần chạy nhầm bộ Web3 legacy với metadata RPC18546 trong cấu hình chỉ cho18545: 5PASS/8FAIL; guard đã chặn đúng, không có giao dịch giả. Giữ log trong cache, không nới guard để làm PASS. Đã chạy thay bằng kịch bản QA đúng5/5 và Solidity12/12. Nhánh pending/evm_setAutomine của suite legacy chưa chạy lại trên node đang dùng để tránh đổi trạng thái mining toàn cục: NOT TESTED trong vòng này.

Còn PARTIAL: chốt roster theo deadline và bằng chứng tiến độ từng tuần thống nhất UI/API/contract; portfolio tổng hợp. Main5188 chưa cấu hình SBT deployment nên không suy diễn Web3 main đã sẵn sàng từ kết quả QA5189.

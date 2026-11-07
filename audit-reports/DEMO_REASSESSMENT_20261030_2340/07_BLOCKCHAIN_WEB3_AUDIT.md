# WEB 3/IPFS — GIỚI HẠN DEMO VÀ LỖI ĐÃ THẤY

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

Compile mới 2 Solidity 0.8.24/EVM paris đạt trong staging riêng, config/sourcecopiednguyêntrạng,cache compiler đã có sẵn; không deploy,không gửi transaction,không đụng artifact/cache tracked. Hardhat 2.29.1 ESM vẫn hoạt động. Không chạy 3 Mocha EVM test hay Registry tests; không đánh đồng compile với performance/security chain.

Backend RPC demo trỏ 18545 không chạy; browser get Code 8545 bị chặn đểkhôngvôýchạmmạngkhác. Metadata address local chỉ là file không phải deployment được kiểm chứng. Không ví MetaMask thật,không private key thật,không gửi gas. Company/student API đăng nhập bằng ví ngẫu nhiên ký message off-chain được phép,không phải giao dịch.

Runtime đã tái hiện:

- POST record-chain-tx student khác+tx string không hợp lệ vẫn 200,lưu Topic demo bị thay đổi. Đây là lỗi quyền/trustclient,không phải tx thật đã xác minh.
- Web 3 tab mount tự POST sync 2 lần StrictMode,sau đó GET events. Sync 200 success dù contract not ready;0chain_events không là bằng chứng listener đúng.
- Unknown certificate HTTP 200 verified/onChain true và UI ON-CHAIN VERIFIED/ERC 5192;ảnh đã lưu. Không có token mint/giao dịch thật phía sau nhãn.
- maxSlots 2 lần assign thứ 2 bị 409; Platform 1 student/Registry chưa nối vẫn không thống nhất.
- Missing Pinata submit503IPFS_NOT_CONFIGURED,không thêm Submission; không tạo CID giả trên Backend demo.

21 foundation tests full flow dùng IPFS stub`bafyTEST...`hoặc`bafyMENTOR`trong process kiểm thử; các CID đó không hợp lệ để làm bằng chứng IPFS. Không cấu hình Pinata/đăng ký dịch vụ/tạo secret. Không có NFT/SBT chuẩn trong Platform,không mint/tokenId/ownerOf/locked; nguồn verified hiện tại vẫn không đáng tin.

Listener Result named keys/processedearly/weakmapping/reorg/checkpoint/normalized sync,role mentor API khác chain,round/floor và signer chain Id khác JWT vẫn còn như [07 cũ](../FINAL_FULL_AUDIT/07_BLOCKCHAIN_WEB3_AUDIT.md). Không chạy EVM tái hiện lại lần này; code hash không đổi,nên kết luận source/unit trước được giữ,cần test isolated EVM sau phê duyệt.

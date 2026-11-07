# Kế hoạch sửa và nghiệm thu demo

Đây là kế hoạch, **chưa thực hiện sửa chữa/cài đặt/deploy/seed**. Chia trách nhiệm theo module để nhóm tự phân công, không kết luận người nào gây lỗi. Không ước lượng số ngày khi chưa có runtime và phạm vi được chốt.

## Thứ tự thực hiện

| Bước | Công việc và ID | Phụ trách đề xuất | Điều kiện hoàn tất |
| --- | --- | --- | --- |
| 1 | Tái lập môi trường, Node/lockfile, JWT/Pinata/Mongo/RPC; xác minh và sửa Hardhat; bảo vệ DB test (A01/A13/A20/A23) | Backend + Web3 + AI | Client build, API/AI health, compile và unit tests chạy trong môi trường riêng; không đụng DB người dùng |
| 2 | Bỏ chứng nhận verified giả, tx giả, số liệu AI/chain mẫu và giới hạn demo-login (A02/A03/A10/A18) | Backend + Frontend | Query lạ trả 404; không on-chain khi chưa có receipt; dữ liệu mẫu có nhãn; môi trường thật không có demo bypass |
| 3 | Bỏ writes trong GET, sửa quyền/scope và giao task (A07/A08/A09/A25/A26) | Backend + Frontend | GET không thay DB; company/student khác bị 403; tạo task cho đúng student; đổi phiên không lộ dữ liệu cũ |
| 4 | Chốt mô hình một/đa sinh viên, contract, mentor, rounding, deployment/network (A14/A15/A19) | Nhóm Backend + Web3 | Một tài liệu API/state/policy thống nhất; test vector DB/chain cùng kết quả; đúng signer và chain |
| 5 | Orchestration DB–chain, xác minh receipt, listener pending/retry/checkpoint, nguyên tử DB (A04/A11/A12/A16) | Backend + Web3 | Hủy ký/mất RPC không báo confirmed; retry không trùng; restart/replay đồng bộ đủ dữ liệu normalized |
| 6 | Chứng nhận token thật và explorer xác minh (A02/A05) | Web3 + Frontend + Backend | Token ở ví student, tokenId/metadata/receipt thật, mint lặp bị chặn; SBT không chuyển được nếu chọn SBT |
| 7 | QR thật, session/vị trí/thời gian, timesheet và chứng cứ chain (A06/A21) | Frontend + Backend + Web3 | Scan thật, sai/hết hạn/ngoài vùng từ chối; check-out/tổng giờ đúng; có bằng chứng on-chain theo spec |
| 8 | Lưu CV, upload/extract, Application/JD→assignment, dashboard trường/admin (A17/A21) | Backend + Frontend | Hồ sơ tồn tại sau reload; application có trạng thái xét duyệt; trường có quyền/view riêng |
| 9 | BERT, pipeline tuần, cảnh báo và metrics (A18/A20/A21) | AI + Backend | Engine xác nhận từ health; nhật ký rủi ro tạo thông báo thật; có Precision@K/NDCG và F1/confusion matrix từ tập gán nhãn |
| 10 | Tách seed/migration, cập nhật docs/deploy, chạy nghiệm thu (A22/A24) | Cả nhóm | Demo DB riêng có fixture rõ; runbook từ môi trường sạch; có log API/UI/IPFS/testnet và các giới hạn còn lại |

Bước 2–3 có thể chuẩn bị thay đổi sau khi nhóm cho phép sửa source; trong audit này chưa sửa. Cài dependency/cấp secret/seed là thao tác của đợt triển khai sau, không nằm trong công việc đã thực hiện.

## Đường demo quản lý thực tập cơ bản

Để demo sớm phần quản lý, ưu tiên bước 1–5, task/nhật ký có quyền và Pinata thật. Dùng DB demo riêng, hai tài khoản company/student thật hoặc fixture có nhãn. Nếu chưa có token/QR/BERT, giao diện và lời thuyết trình phải ghi rõ chưa tích hợp; không giới thiệu luồng cơ bản này là demo đủ đề cương.

Kịch bản nghiệm thu dự kiến, sẽ có ghi DB và chỉ chạy ở môi trường cho phép:

1. Kiểm tra phiên bản runtime, health API/DB/AI, Pinata, chainId/address/code; lưu kết quả không chứa secret.
2. Company và student đăng nhập bằng nonce/chữ ký; token hết hạn/sai signature bị từ chối. Company khác không sửa đề tài, student không chấm điểm.
3. Tạo đề tài với KPI 40/60; thử tổng 90 và bị từ chối; phân công student đã đăng ký. Nếu demo một slot thì lần assign tiếp trả 409 có thông báo đúng.
4. Giao task đúng student, cập nhật trạng thái trong phạm vi quyền; người ngoài không cập nhật được.
5. Student nộp báo cáo lên Pinata thật; truy xuất CID và đối chiếu SHA-256; AI trả engine và kết quả tham khảo, mentor quyết định điểm.
6. Mentor/company reject một KPI, student sửa rồi submit; trạng thái và version nhất quán; không thể submit lại KPI đã duyệt.
7. Approve hết KPI; điểm trọng số đúng policy đã thống nhất; complete tạo metadata thật. Nếu có Web3, chỉ chuyển confirmed sau receipt được xác minh.
8. Reload client, restart listener và đối chiếu Topic/Assignment/Submission/Evaluation/AIAnalysis/ChainEvent; không thay bằng mẫu khi backend lỗi.

## Phần bổ sung để demo đầy đủ đề cương

1. Upload CV có trích xuất, matching/ranking bằng model đã chọn, ứng tuyển và công ty duyệt; lưu dữ liệu sau reload.
2. Quét QR thật trong/ngoài vị trí, hết hạn, hai lần/ngày và ranh giới ngày Asia/Bangkok; ghi giờ làm, task deadline/check-in lên chain theo thiết kế.
3. Nộp nhật ký tuần/cuối kỳ, AI phân loại rủi ro và giảng viên/company nhận cảnh báo; service lỗi có trạng thái chờ và retry.
4. Mint chứng nhận NFT/SBT thật, tra bằng wallet/tokenId/topicId/tx trên deployment đúng mạng; query bịa trả 404, không có CID/tx dự phòng.
5. Triển khai testnet Sepolia và các dịch vụ theo yêu cầu, kiểm tra HTTPS/CORS/VITE_API_URL; lưu transaction, block, tokenId, contract address, báo cáo kiểm thử và benchmark.

## Tiêu chí dừng lỗi bắt buộc

- Pinata thiếu/lỗi: không giả CID, không báo đã lưu IPFS; phương án queue phải có trạng thái và retry thật nếu triển khai theo UC-04.
- AI chết: phân biệt keyword fallback hoặc pending-analysis, không nhận là BERT.
- RPC chết, sai chain, user từ chối ký: không báo mint/verified; có retry độc lập không làm lại nghiệp vụ DB sai.
- DB ghi thất bại giữa chừng: không có trạng thái nửa chừng được gắn completed/processed.
- Tra cứu chứng chỉ sai: không trả sample verified; token không tồn tại/tx revert không được công nhận.
- Mọi GET được đo không có insert/update/delete hoặc auto-seed.

## Bằng chứng bàn giao sau sửa

- Log test theo component, phiên bản runtime và commit; tách unit/mock với tích hợp thật.
- Một recording kịch bản từ đăng nhập đến chứng nhận và các lỗi hủy ký/403/Pinata mất cấu hình.
- CID đọc lại được, file hash, receipt, chainId/address/block/tokenId; không công bố secret.
- Kết quả benchmark AI trên tập dữ liệu gán nhãn, cách chia tập và hạn chế.
- README/PROGRESS/API docs cập nhật theo đúng những gì đã kiểm thử; danh sách thiếu còn lại không bị che bằng dữ liệu mẫu.

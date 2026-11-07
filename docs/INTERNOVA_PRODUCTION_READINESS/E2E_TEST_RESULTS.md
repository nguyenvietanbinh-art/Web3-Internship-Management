# Kết quả chạy thực tế

| Bộ kiểm tra | Kết quả cuối |
| --- | --- |
| Backend unit chọn lọc | 42/42 PASS |
| Progress/report/role/semantic integration + unit liên quan | 23/23 PASS |
| Security/email/wallet/QR/IPFS adapter/database safety | 32/32 PASS |
| Role/student workflow regression | 17/17 PASS |
| Frontend rubric/CV/time unit | 10/10 PASS |
| Python evidence unit | 3/3 PASS |
| Solidity SBT + Registry deadline | 12/12 PASS |
| API BERT theo vai trò | 6/6 PASS |
| Browser nghiệp vụ bốn vai trò | 8/8 PASS |
| Browser session/role/location/responsive | 5/5 PASS |
| Browser matching/security/modal | 7/7 PASS |
| Browser báo cáo hai task và đề xuất/duyệt rubric | 3/3 PASS |
| QA wallet/QR/receipt/hash/mint/verify | 5/5 PASS |
| Frontend lint/build | PASS, không warning/error lint |
| Main health/Frontend | HTTP200; 31 collection/index/hash không đổi sau reload |

Không cộng các dòng thành số bài duy nhất vì một số unit được chạy lại ở nhiều suite. Kết quả ở `../evidence/v3-20261107/`; log đầy đủ trong cache `progress-evaluation-runtime`.

Các lỗi/lần chạy trước không bị che: cold-load thiếu RAM (đã warm thật); harness kỳ vọng trường `score` trong khi API dùng raw_cosine (sửa assertion theo contract thật); legacy report test muốn bỏ qua rubric bị409 (đổi thành kiểm tra từ chối và company yêu cầu bổ sung, full mentor grading được test riêng); một unit DB chạy thiếu NODE_ENV bị guard chặn (rerun đúng fresh TEST32/32); Python cwd sai và PowerShell coi unittest stderr là lỗi (rerun đúng cwd/exit code0,3/3); Web3 legacy metadata/RPC mismatch5PASS8FAIL (giữ guard; QA script đúng5/5). Không sửa guard/mô hình/điểm để làm test PASS.

NOT TESTED/BLOCKED: Pinata readback thật; Maps SDK có key; thiết bị camera/GPS thực; pending mining suite legacy; full production rollout, toàn bộ benchmark độc lập mới, mọi nhánh UI/role/timezone/accessibility.

Bổ sung: test UI rubric ban đầu gửi hạn14/01/2027 ngoài kỳ kết thúc31/12/2026 bị Backend chặn đúng; sửa dữ liệu test thành30/12/2026 rồi chạy fixture mới3/3PASS, không nới validation.

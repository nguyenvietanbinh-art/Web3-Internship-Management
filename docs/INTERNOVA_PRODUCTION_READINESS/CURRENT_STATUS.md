# Trạng thái thực tế — 07/11/2026

**PARTIAL — chưa đạt toàn bộ Definition of Done của V3.** Luồng nghiệp vụ mới đã chạy trên TEST; IPFS thật, Google Maps nhúng và một số yêu cầu on-chain chưa hoàn tất.

| Dịch vụ | Địa chỉ | Kết quả |
| --- | --- | --- |
| Website đang dùng | http://localhost:5188 | HTTP 200; Backend đã nạp source mới |
| Backend đang dùng | http://localhost:57418/api/health | 200; database `internova_demo_cunhan_kysu_20261107` |
| Website kiểm thử | http://localhost:5189 | Bốn vai trò E2E PASS |
| Backend TEST | http://localhost:57419/api/health | 200; database `internova_role_qa_20261107` |
| MongoDB hiện tại | 127.0.0.1:27018, replicaSet internovaTestRs | Connected; không được tắt khi đang dùng web |
| MongoDB legacy TEST | 127.0.0.1:27017 | Các bài legacy tạo DB TEST riêng; không thay DB gốc |
| AI local | 127.0.0.1:8003 | Sentence-BERT ONNX CPU int8 **ready**, inference thật PASS |
| Hardhat QA | 127.0.0.1:18546, chain 31337 | Hash/giờ làm/completion/SBT có receipt thật |

Không cài/nâng dependency, train lại model, commit/push/reset/clean. Không dùng tài khoản/ví thật. BERT đã nạp thành công; trạng thái thiếu RAM ở checkpoint cũ đã được giải quyết mà không hạ guard.

Xem [kết quả nghiệm thu](FINAL_READINESS_REPORT.md), [hướng dẫn chạy](../RUN_V3_FULL_WORKFLOW.md) và [bằng chứng](../evidence/v3-20261107/).

## Hiệu năng đo tại máy

QA health10request tuần tự: p50=1.36ms,p95=56.90ms (có chi phí lần đầu). BERT model đã warm:3query khác nhau,2candidate, service19.92/6.51/7.66ms, wall27/11/11ms; candidate embedding có thể cache. Không phải load test hoặc SLA. Bundle chính316.24kB (gzip94.42), ethers379.90kB lazy, scanner436.68kB lazy. Số liệu trong performance.json. Working set tại thời điểm đo: Mongo27017≈141.7MiB, Mongo27018≈56.5MiB, AI≈62.2MiB; không đại diện peak/private memory. Không hạ guard hoặc tự đóng ứng dụng để đẹp số.

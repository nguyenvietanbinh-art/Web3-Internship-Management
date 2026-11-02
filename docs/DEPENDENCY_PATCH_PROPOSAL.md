# Cập nhật sau phê duyệt — Ba dependency đã vá và retest

Ngày 31/10/2026 (+07). Đã vá server body-parser1.20.9, qs6.16.1 và server/client follow-redirects1.16.2; chỉ bốn lock entries, không đổi package khác hoặc manifest. **Audit production server/client:0 advisory.** Backend122/122, corebrowser70/70, legacy39/39, QRbrowser7/7, Solidity9+3, QRunit2/2, Pythonunit16/16; lint0error/0warning/buildPASS.

Server dev còn2MODERATE (nodemon/minimatch); toolchain contracts chưa đổi, snapshot audit PHASE6 còn18HIGH+16MODERATE+14LOW affected packages. IPFS live/modelcoldtests vẫnBLOCKED, hardwareNOTTESTED. Không toàn bộ security/release PASS, chưa PHASE7. Ba DB gốc/demo hash/index nguyên vẹn, không commit/push. [Kết quả bản vá, TX thật, file và evidence](DEPENDENCY_PATCH_RESULT.md).

## Lịch sử trước bản vá — giữ để đối chiếu

# PHASE6 — Đề xuất vá dependency, CHƯA THỰC HIỆN

Ngày31/10/2026 (+07). `npm audit --json --omit=dev` chỉ đọc: server2HIGH+1MODERATE, client1HIGH, contracts0 (contracts chủ yếu devDependencies, không kết luận toàn bộ toolchain sạch). Chưa cài/nâng dependency, không audit fix.

| Package | Đã cài | Bản vá đã xác minh | Phạm vi dự kiến |
| --- | --- | --- | --- |
| body-parser |1.20.8|1.20.9|server/package-lock.json, node_modules |
| follow-redirects |1.16.1|1.16.2|server và client package-lock.json, node_modules |
| qs |6.16.0|6.16.1|server/package-lock.json, node_modules |

Advisories chính thức: [body-parser compressed-body DoS](https://github.com/advisories/GHSA-27r3-jxmh-p828), [follow-redirects cross-realm sensitive headers](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p), [qs comma stringify DoS](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw). Đây là advisory dependency, không khẳng định đã khai thác ứng dụng.

body-parser reachable qua express.json với inflate mặc định. Không gửi payload DoS vào service đang chạy. follow-redirects: IPFS/NLP đã đặt maxRedirects=0; browser fetch không sử dụng Node redirect adapter; legacy AI Axios còn default redirect nhưng không truyền private credentials/sensitiveHeaders cross-realm. qs advisory liên quan stringify/comma, chưa thấy call path đó từ input không tin cậy trong source. Các giảm thiểu này không làm npm audit PASS.

Ba bản vá tồn tại trên registry, engines tương thích Node22. Metadata không có preinstall/install/postinstall; qs có prepack/prepublish/test scripts nhưng không cần chạy. Nếu được duyệt: backup manifest/lock; resolve đúng patch vào các lock trên, `--ignore-scripts --no-audit --no-fund`; so diff chặn upgrade package ngoài kế hoạch; nếu transitives cần đổi ngoài phạm vi, báo cụ thể trước. Sau đó npm ci chỉ client/server đã được duyệt, hồi quy Backend/UI/build/audit lại trong TEST. Không đổi framework/Node/contracts/API/schema hoặc dữ liệu gốc/demo, không sửa .env.

Chờ phê duyệt riêng vì phạm vi cài trước chỉ cho phép dependency đã xác định và không nâng tự ý. QA/đo hiệu năng không phụ thuộc việc nâng cấp sẽ tiếp tục. Nếu chưa được duyệt, ghi OPEN/HIGH và không kết luận security hoặc production release PASS.

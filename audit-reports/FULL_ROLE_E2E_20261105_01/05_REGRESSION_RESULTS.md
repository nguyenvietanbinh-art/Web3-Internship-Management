# Regression thực tế

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| client-unit | PASS, exit0 | evidence/client-unit.txt |
| qr-code | PASS, exit0 | evidence/qr-code.txt |
| server-independent | PASS, exit0 | evidence/server-independent.txt |
| lint | PASS, exit0 | evidence/lint.txt |
| build | PASS, exit0 | evidence/build.txt |
| contracts-local | PASS, exit0 | evidence/contracts-local.txt |
| backend-all | PASS, exit0 | evidence/backend-all.txt |
| production-role-navigation | PASS, exit0 | evidence/production-role-navigation.txt |
| email-browser | PASS, exit0 | evidence/email-browser.txt |
| unified-business-browser | PASS, exit0 | evidence/unified-business-browser.txt |

AI pure16/16 PASS (`ai-pure-unit.txt`). Backend165/165 PASS, skip0. Client10/10, QR2/2 với40payload ngẫu nhiên, Solidity9/9. Browser6+6+9=21/21, exceptions0 và outbound blocked0. Preflight Backend14/14 được chạy lại trong165 nên không cộng trùng.

Build NODE_ENV=production, RAYON_NUM_THREADS=1, output ignored `client/dist/full-role-20261105`; entry301.71kB raw/90.29kB gzip. Có thông tin PLUGIN_TIMINGS, không build failure. Scanner lazy chunk436.68kB raw/115.59kB gzip; chưa benchmark startup/render trên thiết bị thật. Lint exit0; không thấy error/warning trong output.

Diagnostic fault FAIL không nằm trong165 test cũ: đây là lỗ hổng coverage được bổ sung, không đổi assertion/skip để PASS. Chưa áp dụng fix cần phê duyệt riêng.

Sau lần chạy chỉ bổ sung guard từ chối ghi đè artifact và truyền exit code FAIL cho harness; kiểm cú pháp3script PASS, không thay source được kiểm thử. Không chạy lại toàn bộ nghiệp vụ chỉ vì chỉnh guard output. Model lạnh chưa chạy do RAM; API SBERT dùng model nạp sẵn đã PASS thật.

Tính nguyên vẹn: `database-safety.json` protectedUnchanged=true. Các database TEST tạo được giữ làm bằng chứng, không drop. Các browser/vite test do harness tạo đã đóng; manual services và mongod phục hồi được giữ chạy.

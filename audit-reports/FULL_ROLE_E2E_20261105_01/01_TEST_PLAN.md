# Kế hoạch và phạm vi

1. Kiểm tra Git/tool/service; đọc script và guard trước khi thực thi.
2. Chạy unit độc lập, lint/build và Solidity EVM tạm trong process.
3. Sau phê duyệt phục hồi Mongo: snapshot readonly gốc/demo/TEST manual; từng suite dùng child DB ngẫu nhiên, exact allowlist và kiểm tra rỗng trước startup. Không seed/drop/delete/migrate dữ liệu cũ.
4. Regression API theo tài khoản → CV/JD/ứng tuyển → kỳ/phân công → task/log/time/report/KPI → AI/QR/Web3/security.
5. Browser đăng nhập bốn role, menu/navigation; đăng ký/hồ sơ/password; luồng dữ liệu liên kết từ CV/JD/application đến review/completion/SBT.
6. Fault injection insert báo cáo trên DB TEST riêng để kiểm bất biến current.
7. Đối chiếu hash/index sau test; xác minh receipt qua RPC readonly; báo cáo các phần chưa thể chạy.

Luồng phụ thuộc: Admin/provision company+mentor → student đăng ký → CV và JD → application → company duyệt → Admin tạo kỳ → company phân công → Admin duyệt → company kích hoạt → task/log/giờ → reviews/KPI → final report → completed → liên kết ví TEST → evidence/mint/verify. Các suite độc lập có thể bắt đầu bằng student; không tuyên bố đã click toàn bộ theo đúng thứ tự A–H trong một phiên duy nhất.

Các thao tác CV/JD/register/apply/AI/link wallet/verify có UI thật trong unified browser. Phân công/task/log/giờ/review/duyệt và gửi giao dịch dùng API thật trong cùng DB, sau đó kiểm UI theo vai trò. Không gọi đó là click-only E2E của mọi form.

Giờ hai phút là điều chỉnh TEST có lý do/audit, không chứng minh giờ lao động thực. Wallet transport là bridge EIP1193 TEST ký EIP191 thật, không popup MetaMask thật. QR unit decode PNG ngẫu nhiên và API policy dùng vị trí synthetic; không UAT camera/GPS vật lý.

Mỗi test PASS chỉ chứng minh assertion đã chạy. COMPLETE không được suy ra từ một test PASS. Không công bố metrics chất lượng AI từ dữ liệu synthetic.

Lệnh đã chạy và exit code: evidence/preflight-results.json, integration-results.json; `python -B -m unittest discover -s tests -p test_nlp.py -v` exit0; diagnostic `node scripts/demo/full-role-report-fault.cjs <report-dir>` exit1 vì tái hiện lỗi HIGH. Script kiểm tra cú pháp cuối đều exit0.

Scripts mới cần thư mục output mới; không ghi đè kết quả. Không tự chạy lại test trong DB manual. Không chạy migration/index rollout cho gốc/demo. Các harness gốc tạo indexes riêng trong DB TEST rỗng như đã được cho phép.

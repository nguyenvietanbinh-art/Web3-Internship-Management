# Bàn giao source cho nhóm — 02/11/2026

Branch phát hành: `branch_1`. Hướng dẫn clone/cài/chạy và tạo file email/password trên máy mới: [TEAM_QUICKSTART.md](TEAM_QUICKSTART.md). Hướng dẫn kiểm nghiệp vụ: [FULL_WEBSITE_TEST_GUIDE.md](FULL_WEBSITE_TEST_GUIDE.md).

## Có trong Git

Source client/server/ai-service/contracts; scripts triển khai local và kiểm thử; package manifests/lockfiles và Python requirements; tài liệu kỹ thuật, hướng dẫn, bằng chứng kiểm thử được rà soát. Đây là thay đổi tích lũy các phase đang ở working tree, không chỉ riêng lần viết hướng dẫn.

## Chỉ giữ trên máy

Database MongoDB, node_modules/cache/model tải về, Python venv/bytecode, real.env, mật khẩu/vault DPAPI/manual-login, archive và dự án ngoài phạm vi. Python venv từng bị track được bỏ khỏi index nhưng giữ nguyên trên ổ đĩa; không viết lại lịch sử Git cũ.

Không có mật khẩu chung hardcode. Mỗi máy mới khởi tạo database TEST và tài khoản riêng; script export-login chỉ xuất credentials đã có của đúng runtime TEST ra file Git ignore. Database cloud chưa tạo và dữ liệu giữa các máy chưa đồng bộ. Không chép runtime/deployment/vault từ máy tác giả.

## Kiểm tra khi đóng gói

- Rà353 tệp trước khi thêm note bàn giao: không phát hiện mật khẩu demo thật hoặc mẫu URI password/JWT/private-key trong tập chọn. Đây là rà theo mẫu, không thay kiểm toán bảo mật hoàn chỉnh.
- Frontend lint PASS. Build mặc định FAIL do RAM; retest RAYON_NUM_THREADS=1 PASS vào dist/team-release.
- Script export-login: syntax PASS, gọi thiếu flag/metadata bị từ chối; không ghi đè credentials. Không chạy lại full regression chỉ vì thêm tài liệu/script export. Kết quả164Backend/21browser là kết quả lần identity acceptance trước, có evidence.
- Chưa kiểm chứng cài toàn bộ trên máy thành viên mới. Python requirements nền chưa lock toàn bộ; Google/Pinata live BLOCKED, risk classifier NOT_TRAINED. Giữ các trạng thái này khi demo.
- Không cài thêm dependency, không chỉnh database/cloud, không reset chain và không chuyển secrets lên GitHub.

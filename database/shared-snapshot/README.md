# Snapshot database hiện có — không mã hóa

Theo yêu cầu của chủ dự án, bản JSON chứa nguyên dữ liệu database đã lưu, password hash và các file tài khoản đã biết. Không phải seed thay thế, không cần khóa giải mã.

- `main.snapshot.json`: 31 collections, 2.561 bản ghi.
- `qa.snapshot.json`: 32 collections, 3.812 bản ghi.
- `*.plain.manifest.json`: thời điểm chụp, checksum và số lượng từng collection.

Restore mặc định dùng JSON và từ chối database đích đã có collection. Không dùng Compass Import trực tiếp vì đây là gói nhiều collection với BSON Extended JSON và indexes; dùng script trong [hướng dẫn chạy](../../docs/TEAM_ACTUAL_DATABASE.md). Các bản mã hóa cũ vẫn được giữ, không bắt buộc dùng. GitHub không tự đồng bộ database giữa các máy.

Người xem repository đọc được dữ liệu và tài khoản đi kèm. `.env`, JWT signing secret, private key và khóa riêng của máy không được đưa lên Git.

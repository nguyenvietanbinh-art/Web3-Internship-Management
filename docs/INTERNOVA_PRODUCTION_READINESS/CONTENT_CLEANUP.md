# Nội dung hiển thị

Shared.History dùng `historyContent.js` chuyển action sang nhãn tiếng Việt, chỉ hiển thị comment/reason/feedback và decision được phép; không render JSON metadata, recipientUserId hay mã action thô. Không xóa lịch sử database.

Những trạng thái có ý nghĩa vẫn giữ: chưa liên kết ví, chưa sẵn sàng IPFS/RPC, thiếu căn cứ chấm điểm, chưa có dữ liệu. Không đổi lỗi thành success hoặc giấu công cụ thiếu cấu hình. Có badge nhỏ Môi trường thực hành trên runtime TEST để dữ liệu tổng hợp không bị hiểu thành thành tích thật; metadata nguồn vẫn giữ trong dataset/tài liệu.

Không thêm chat/nhắn tin giữa sinh viên và giảng viên. Không gỡ OAuth Backend đang được tài khoản cũ sử dụng. Không đổi tên kỹ thuật engine trong payload; FE dùng nhãn tiếng Việt.

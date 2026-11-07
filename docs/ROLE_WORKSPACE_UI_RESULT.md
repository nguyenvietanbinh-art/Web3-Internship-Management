# Nhãn và công cụ theo vai trò — 06/11/2026

Chỉ sửa Frontend và test liên quan; không thay quyền Backend, API payload, schema hoặc dữ liệu gốc/demo. Không commit/push.

## Thay đổi

- Doanh nghiệp xét duyệt: “Nhận xét / lý do xét duyệt”; sinh viên rút hồ sơ: “Lý do rút ứng tuyển”. Lời nhắn lúc ứng tuyển vẫn là trường riêng.
- Lịch sử ứng tuyển dùng nội dung tiếng Việt theo sự kiện/trạng thái thực. Không in application.submitted/application.state, recipientUserId, địa chỉ ví thiếu hoặc JSON. Lý do đã ghi vẫn hiển thị bằng text React; audit record trong MongoDB không thay đổi.
- Menu, breadcrumb, tiêu đề và document title dùng cùng nhãn theo vai trò. Doanh nghiệp có Tin tuyển dụng/Xét duyệt ứng viên; sinh viên có CV/Cơ hội thực tập/Hồ sơ đã ứng tuyển. Nhà trường không thấy công cụ xét duyệt ứng viên chỉ có quyền đọc; giảng viên không thấy công cụ phát hành/điểm danh Web3. Chặn render các công cụ bị loại ngay cả khi state điều hướng trỏ tới trang đó; không thay RBAC server.
- Công cụ chưa triển khai không hiện ở sidebar. Các trang giám sát hợp lệ được giữ và ghi rõ mục đích: giảng viên theo dõi giờ, nhà trường tổng hợp giờ/theo dõi tiến độ. Quyền đọc báo cáo/tiến độ không phải chức năng hỏng.
- Ẩn cột thao tác trong bảng khi vai trò không có thao tác tương ứng; bỏ placeholder “Chỉ xem” ở bảng kỳ/phân công, công việc/nhật ký, giờ làm và JD. Không mở thêm nút sửa/xóa cho người chỉ có quyền đọc.

## File

`client/src/components/navigation.js`, `AppShell.jsx`; business `CoreBusinessView.jsx`, `Recruitment.jsx`, `content.js`, `Shared.jsx`, `Placements.jsx`, `Work.jsx`, `Time.jsx`; test `ui-content.test.mjs`, selector trong `phase3-browser.cjs`.

## Kiểm thử thực tế

- Client unit12/12 PASS: trạng thái/lý do theo vai trò, không lộ recipient trong history text, không sửa record, unknown/prototype-key fallback, menu matrix, regression session và async form.
- Lint PASS, build PASS; output ignored `client/dist/role-cleanup-final`.
- Browser production6/6 PASS, exceptions0: đăng nhập bốn role, duyệt mọi menu được phép, không auto-write khi điều hướng, desktop/tablet/mobile và theme. DB mới `web3_internship_test_phase1_a0b1ae55_96de7502fb48`; không dùng DB manual/gốc/demo. [Kết quả browser](evidence/role-workspace-20261106/result.json).
- Browser production chạy trước thay đổi bổ sung nhỏ chống prototype-key cho history labels; unit/lint/build đã chạy lại sau thay đổi đó. Không gọi browser menu smoke là kiểm thử đầy đủ mutation xét duyệt/rút hồ sơ. Selector phase3 đã cập nhật, chưa chạy lại toàn suite phase3 hoặc Backend165 vì không sửa Backend.

Các component lịch sử khác vẫn giữ cơ chế cũ; đợt này sửa lịch sử ứng tuyển, không xóa dữ liệu audit toàn hệ thống. Chưa xử lý lỗi atomic report đã báo ở đợt kiểm định trước.

Mở website hiện hành, nhấn Ctrl+F5, đăng xuất/đăng nhập lại đúng vai trò để kiểm tra menu. Không cần restart Backend hoặc tạo lại tài khoản.

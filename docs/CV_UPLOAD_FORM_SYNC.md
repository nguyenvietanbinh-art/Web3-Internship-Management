# Đồng bộ thông tin từ tệp CV — 07/11/2026

## Xóa tệp đã tải lên

Đã thêm **Xóa tệp CV → Xác nhận xóa tệp**, có nút Hủy. API mới `DELETE /api/core/cv/file`, body `{version}`, yêu cầu student và CV thuộc chính tài khoản. Cập nhật atomic theo version, gỡ fileData/fileName/mime/sha256/extractedText/parser và ghi lịch sử `cv.file_removed`. Không xóa document CV, trường nhập tay, bản chụp hồ sơ ứng tuyển hoặc dữ liệu người khác. Không có thao tác xóa khi mở trang.

`server/test/cv-file-removal.integration.test.js`: 3/3 PASS trên QA riêng (auth/RBAC, stale version, chặn target ID, dữ liệu chủ sở hữu, tải tệp sau xóa trả 404). Browser cập nhật: 3/3 PASS, bao gồm hủy giữ tệp và xác nhận xóa rồi reload giữ thông tin CV. Bằng chứng local mới: `contracts/node_modules/.cache/cv-upload-prefill-1794030994280/`. Lint/build PASS. Hai Backend đã nạp lại bằng launcher hiện hữu; website giữ cổng 5188. Không xóa tệp người dùng khi kiểm thử; chỉ xóa tệp fixture tạo mới trong QA.

File bổ sung cho chức năng xóa: `server/src/core/cv.js`, `server/test/cv-file-removal.integration.test.js`; cập nhật `CvFile.jsx`, `CvPage.jsx` và browser test. Không sửa schema, không migration hoặc commit/push.

## Nguyên nhân

`saveCvFile` chỉ lưu tệp, nội dung trích xuất, tên tệp và hash, giữ nguyên các trường nhập tay. Vì vậy upload thành công vẫn hiện summary/skills/education/experience/university/GPA cũ. Đây không phải bằng chứng upload thất bại. Trước đây upload còn tải lại toàn bộ trang CV và có thể làm mất bản nháp nhập tay chưa lưu.

## Thay đổi

- Sau upload tệp từ máy hoặc URL, mở bước xem trước các mục nhận diện được từ nội dung thật đã trích xuất.
- Nhận diện tiêu đề mục tiếng Việt/Anh, đọc kỹ năng khai báo, tóm tắt, học vấn, kinh nghiệm/dự án. Chỉ lấy trường đại học có nhãn rõ; chỉ lấy GPA có ghi thang /4, không tự quy đổi /10.
- Chọn **Đưa vào thông tin CV** để thay các trường nhận diện được trong form. Giữ tên CV, trường không nhận diện được và bản nháp khác. Không tự ghi các trường nhập tay vào database.
- Nhấn **Lưu CV** để lưu bằng API hiện có, dùng đúng version sau upload.
- **Giữ thông tin đang nhập** đóng xem trước và giữ nguyên form; tệp vừa upload vẫn đã được lưu. Có thể mở lại bằng **Điền thông tin từ tệp CV**.
- Tệp không có tiêu đề mục rõ ràng chưa được tự điền. Nội dung trích xuất vẫn xem được để nhập thủ công; không suy đoán kỹ năng, GPA, trường hay tên người từ văn bản không rõ.

## File

`client/src/components/business/cv/CvPage.jsx`, `CvForm.jsx`, `CvFile.jsx`, `importCvFields.mjs`; test `client/test/cv-import-fields.test.mjs`, `cv-upload-prefill-browser.cjs`.

Không sửa Backend, API, schema, parser PDF/DOCX hoặc pipeline AI. Các trường đã lưu và extractedText tiếp tục được sử dụng như trước.

## Kết quả thực tế

- Unit: **3/3 PASS** (mẫu Backend thật, thiếu dữ liệu, tiếng Anh và GPA khác thang).
- Browser: **2/2 PASS** — upload `docs/sample-cvs/02-backend.docx` qua API thật; xem trước không sửa trường nhập tay; giữ bản nháp tên CV; áp dụng kỹ năng và GPA 3.05; lưu rồi reload đúng dữ liệu.
- Lint và build: **PASS**.
- Browser không có runtime exception. Bằng chứng local: `contracts/node_modules/.cache/cv-upload-prefill-1794030270807/results.json`, `saved-cv-from-docx.png`.
- Browser chỉ ghi fixture mới trên `internova_role_qa_20261107`, sau khi xác minh URI chính xác, replica set và marker. Giữ lại cả fixture thất bại ban đầu, không xóa dữ liệu. Hai lần chuẩn bị đầu chưa chạy UI do thiếu cờ TEST rồi thiếu cờ User ID; đã sửa cấu hình test, không nới guard.
- Không ghi database gốc/demo; không cài dependency, commit hoặc push.

## Cách kiểm tra

1. Tải lại localhost:5188, đăng nhập sinh viên, mở CV.
2. Upload PDF/DOCX, chờ hộp **Thông tin đọc từ tệp CV**.
3. Kiểm tra nội dung, nhấn **Đưa vào thông tin CV**.
4. Sửa thêm nếu cần, nhấn **Lưu CV**. Tải lại trang để kiểm tra.
5. Mở Đề tài phù hợp và chạy lại đối chiếu để lấy kết quả từ CV đã lưu.

URL và PDF dùng chung bước xem trước nhưng chưa chạy lại E2E hai luồng này trong lượt sửa; E2E hiện xác nhận DOCX. Chưa có bộ phân tích mọi kiểu bố cục CV.

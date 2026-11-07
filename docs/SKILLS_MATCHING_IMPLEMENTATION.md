# Gợi ý đề tài theo CV và yêu cầu kỹ năng

Cập nhật 07/11/2026. Mục tiêu: hoàn thiện luồng gợi ý thực sự có dữ liệu đầu vào, đối chiếu kỹ năng và inference thật. Không tuyên bố toàn hệ thống sẵn sàng production chỉ sau thay đổi này.

## Nguyên nhân đã sửa

`Topic.requiredSkills` đã có trong schema nhưng API workflow gửi `skills:[]` cho mọi đề tài. Do đó hệ thống không thể tìm giao kỹ năng dù CV có danh sách kỹ năng.

Hiện các API gợi ý sinh viên và xếp hạng doanh nghiệp đều đọc kỹ năng từ đề tài tương ứng, kiểm tra đề tài cùng doanh nghiệp với cơ hội đang xét, gửi danh sách thật sang dịch vụ xếp hạng và trả về:

- Kỹ năng yêu cầu.
- Kỹ năng CV đáp ứng.
- Kỹ năng yêu cầu chưa có trong CV.
- Số đáp ứng/tổng yêu cầu.
- Điểm tương đồng nội dung theo phương pháp người dùng chọn.

Kỹ năng được chuẩn hóa chữ hoa/thường, bỏ trùng và nhận các tên viết tắt phổ biến như JS/JavaScript, NodeJS/Node.js. Nhiều kỹ năng không liên quan không tự làm tăng số kỹ năng đáp ứng. Danh sách này phản ánh khai báo, không xác minh trình độ thực hành.

Không quy GPA, số lượng kỹ năng hoặc tỷ lệ đáp ứng thành xác suất trúng tuyển. Điểm cosine không bị gán lại, làm tròn lên mức đẹp hoặc đổi thành điểm đánh giá nghiệp vụ. Thứ hạng vẫn theo nội dung và kỹ năng đưa vào phương pháp xếp hạng hiện có.

## Đầu vào doanh nghiệp

- Tạo/sửa đề tài theo workflow có trường **Kỹ năng yêu cầu (cách nhau bằng dấu phẩy)**.
- Danh sách đề tài và cơ hội hiển thị kỹ năng, sinh viên cũng thấy khi xem đề tài còn tuyển.
- API tạo/sửa chấp nhận `requiredSkills` là danh sách theo validation hiện có. Client cũ không gửi trường này vẫn hoạt động; khi sửa mà bỏ qua trường sẽ không tự xóa kỹ năng.
- Dùng trường đã có, không đổi schema/index, không migration.
- Kỹ năng được đọc theo khai báo **hiện tại của Topic**. Mô tả/KPI theo kỳ và hồ sơ đã gửi vẫn giữ phạm vi riêng. Hiện chưa đóng băng kỹ năng yêu cầu theo từng phiên bản cơ hội; muốn lưu cả lịch sử yêu cầu cần thiết kế phiên bản riêng, không gọi đó là đã có.

## Dữ liệu được chuẩn bị

- Giữ 271 hồ sơ có GPA 2–4 và 2/4/7/10 kỹ năng đã bổ sung, không gán tất cả thành một chuyên môn hoặc nhiều năm kinh nghiệm không tồn tại.
- Bổ sung `requiredSkills` cho 60 đề tài do script tạo, chỉ khi còn nguyên mô tả gốc và chưa có thay đổi phiên bản.
- Cập nhật mô tả của 144 cơ hội sinh tự động còn khớp mô tả gốc: phạm vi công việc, đầu vào, sản phẩm cần bàn giao; không yêu cầu ứng viên thực tập đã làm việc nhiều năm.
- Đề tài giao diện web yêu cầu HTML/CSS/JavaScript/React; máy chủ Node.js yêu cầu JavaScript/Node.js/Express/MongoDB; nhân sự dùng Java/Spring Boot/SQL; dashboard dùng Python/SQL/Pandas; một số đề tài tập trung kiểm thử hoặc thiết kế.
- 73 hồ sơ ứng tuyển đã gửi được đối chiếu BSON trước/sau và giữ nguyên. Không sửa CV snapshot hoặc chuyển sinh viên đã nhận đề tài về chưa nhận để chạy gợi ý.
- Dữ liệu vẫn có nguồn gốc tổng hợp trong lịch sử và tài liệu. Tên công ty/tài khoản mẫu không chứng minh tổ chức hoặc năng lực người thật.

Chỉ ghi trong database `internova_demo_cunhan_kysu_20261107`, không tạo database khác hoặc đổi tên DB làm mất đường dẫn hiện tại.

## Kết quả thực tế qua Backend

| Email | Số kỹ năng CV | TF-IDF | BERT | Ví dụ kỹ năng đáp ứng |
| --- | ---: | --- | --- | --- |
| 2211000002@gmail.com | 2 | HTTP 200 | HTTP 200 | JavaScript/Node.js: 2/6 yêu cầu cổng tuyển dụng |
| 2211000009@gmail.com | 4 | HTTP 200 | HTTP 200 | HTML/CSS/JavaScript/React: 4/5 yêu cầu website |
| 2211000017@gmail.com | 7 | HTTP 200 | HTTP 200 | Vẫn 4/5 yêu cầu website, không cộng điểm vì kỹ năng thừa |
| 2211000027@gmail.com | 10 | HTTP 200 | HTTP 200 | Java/Spring Boot/SQL/MySQL/Git: 5/5 yêu cầu nhân sự |

Bốn tài khoản chưa được nhận đề tài ở kỳ cử nhân được xác minh trước khi chạy. Mật khẩu khởi tạo bằng MSSV, nếu chưa được người dùng đổi. Website http://localhost:5188/; Ctrl+F5, vào Gợi ý đề tài phù hợp và chọn kỳ.

- BERT sinh viên ít kỹ năng: cosine đầu danh sách 0,769515, đáp ứng 2/6. TF-IDF cùng CV: 0,206536. Đây là hai cách đo khác nhau, không phải tỷ lệ trúng tuyển.
- BERT CV Java: cosine đầu danh sách 0,840348, đáp ứng 5/5.
- Không sửa những số này để tạo kết quả đẹp; không suy ra BERT chính xác hơn từ vài ví dụ.
- Xếp hạng doanh nghiệp 1 qua API cũng HTTP 200 và có danh sách yêu cầu. Vẫn dùng CV snapshot đã nộp, không thay bằng CV hiện tại đã được làm phong phú.
- Kỹ năng đáp ứng/thiếu của từng kết quả được kiểm lại bằng tập hợp kỹ năng thực tế, không chỉ kiểm có chữ hiển thị.
- Vẫn giới hạn 50 cơ hội mỗi lần trên tổng 60 ở kỳ mẫu, UI hiển thị số đã xét. Chưa khẳng định xếp hạng toàn bộ cơ hội nếu tổng lớn hơn giới hạn.

## BERT và môi trường

RAM tăng đủ để một lần inference nhỏ nạp model thành công. Sau đó tám lượt matching (bốn TF-IDF, bốn SBERT) đều HTTP 200; SBERT báo model ready và inference performed. Không cài dependency, tải weights, chuyển sang API cloud hoặc hạ guard. Khả năng khởi động lạnh vẫn phụ thuộc RAM; các lỗi thiếu RAM đã ghi trước đó là sự kiện thực tế, không bị xóa.

## Kiểm tra mã nguồn

- 5 test kỹ năng/input, 2 guard database và 1 route phân quyền: PASS sau đợt thay đổi.
- Syntax check backend, Frontend lint/build PASS; output ignored `client/dist/skills-matching`.
- Không tự chạy seed/migration/test xóa dữ liệu. Không thay quyền, trạng thái tiếp nhận, điểm, ngày thực tập, danh sách tài khoản hay cơ chế xác thực.
- Browser E2E sau đợt thay đổi: NOT TESTED. Việc tạo/sửa đề tài mới qua giao diện chưa được chứng minh bởi các kiểm tra đọc và matching nói trên.

## Phục hồi thay đổi dữ liệu nếu cần

`topic-requirements-before.json` lưu trạng thái Topic trước bổ sung; `topic-requirements-result.json` và lịch sử `fixture.requirements_enriched` đánh dấu các bản ghi liên quan, trong cache đã ignore. Script `server/scripts/enrich-topic-requirements.cjs` từ chối chạy lại sau hoàn tất.

Không tự rollback. Nếu cần, phải kiểm tra phiên bản/nội dung còn khớp chính lần bổ sung này rồi mới khôi phục các trường mô tả/kỹ năng từ bản trước; không ghi đè thay đổi doanh nghiệp thực hiện sau đó hoặc chạm quota/admission/phân công. Không xóa collection/database để phục hồi.

## Giới hạn dự án còn lại

Chưa có bộ nhãn độc lập để nghiệm thu chất lượng gợi ý. Classifier báo cáo và chấm trước vẫn có giới hạn đã công bố. IPFS/blockchain của runtime này chưa được cấu hình đầy đủ. Đây là các hạng mục cần hoàn thiện riêng; không chỉ đổi nhãn thành "thật" để coi là đã đạt.

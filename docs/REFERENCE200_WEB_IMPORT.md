# Dùng200 CV và20 đề tài trên website — 07/11/2026

## Đã nhập và chạy được

Bộ `ai-service/datasets/cv-jd-reference-200-v1` đã được bổ sung vào cả TEST và website dữ liệu hiện có bằng script `server/scripts/import-cv-jd-reference.cjs`. Không thay thế CV/JD hoặc mật khẩu cũ. Đây là nhóm tài khoản tổng hợp mới, không phải dữ liệu chuyên gia đã xác nhận.

| Môi trường | Website | Database |
|---|---|---|
|Website hiện có|http://localhost:5188|`internova_demo_cunhan_kysu_20261107`|
|TEST|http://localhost:5189|`internova_role_qa_20261107`|

Mỗi database bổ sung đúng841 document:200 User,200 Student,200 CV,200 ghi danh,20 Topic,20 TopicOpportunity và1 kỳ. Không tạo bản ghi ứng tuyển/được nhận/phân công/giờ làm/điểm/chứng nhận giả.

Tên kỳ: **Thực tập cử nhân CNTT — Đợt tháng11, năm học2026–2027**. Đăng ký còn mở khi nhập; hết đăng ký21/11/2026, bắt đầu28/11/2026, kết thúc20/02/2027. Kỳ được tạo theo thời điểm nhập, lịch chi tiết trong `main-result.json` ở bằng chứng. Không chỉnh đồng hồ hoặc bỏ quy tắc thời gian; sau khi hết cửa sổ đăng ký vẫn tuân thủ quy trình hiện có.

20 đề tài thuộc10 hướng, mỗi hướng2 đề tài, nằm trong **đề tài tuyển theo kỳ** của doanh nghiệp hiện có. Đây là Topic/Opportunity của school workflow, không nhân đôi sang JD legacy đã ngừng dùng. Mỗi cơ hội10 chỗ, chưa nhận ai; không mở lại hoặc tăng chỉ tiêu của đề tài cũ. TEST dùng doanh nghiệp kiểm thử có sẵn; website5188 phân20 đề tài cho10 doanh nghiệp mẫu đang có.

CV nhập gồm mục tiêu, kỹ năng, cách phối hợp/lịch tham gia, học vấn/GPA và mô tả bài tập. User/Student/CV có cùng kỹ năng, mã sinh viên và GPA tương ứng nguồn. Không liên kết ví tự động. Các nhãn đánh giá tham chiếu4000 cặp vẫn ở file, không ghi thành điểm tuyển dụng/điểm học tập hoặc độ tin cậy đã xác minh.

## Đăng nhập và thử ngay

File tài khoản **website5188**:

`contracts/node_modules/.cache/cv-jd-reference-web-20261107/main-manual-login.txt`

File tài khoản **TEST5189**:

`contracts/node_modules/.cache/cv-jd-reference-web-20261107/test-manual-login.txt`

Mỗi file có đủ200 tài khoản, hướng kỹ năng và mật khẩu khởi tạo. Giữ ở cache local, không đưa file mật khẩu lên Git. Không đổi hoặc ghi đè các file login cũ.

Một số email để chọn nhanh:

| Email | Tình huống |
|---|---|
|`2699000004@gmail.com`|CV-004:giao diện web, có bài tập và6 kỹ năng khai báo; phù hợp để chạy gợi ý đầu tiên|
|`2699000001@gmail.com`|CV-001:mới học, chưa có bài tập hoàn chỉnh; có thể được gợi ý nhưng không mặc định đủ điều kiện|
|`2699000024@gmail.com`|CV-024:Backend Node.js|
|`2699000044@gmail.com`|CV-044:Java|
|`2699000084@gmail.com`|CV-084:dữ liệu|
|`2699000184@gmail.com`|CV-184:blockchain|

1. Mở **http://localhost:5188**, đăng xuất tài khoản hiện tại rồi dùng tài khoản trong file mới.
2. Vào **CV của tôi**, kiểm nội dung/kỹ năng được nhập. Không cần tải lại CV hoặc liên kết ví để chạy gợi ý.
3. Vào **Kỳ thực tập của tôi**, chọn kỳ mới; đã ghi danh tổng hợp, chưa được nhận đề tài, có20 cơ hội còn tuyển. Mỗi trang chỉ hiện một phần theo phân trang.
4. Vào **Gợi ý đề tài phù hợp**, chọn cùng kỳ; chọn **TF-IDF**, bấm **Tìm đề tài phù hợp**.
5. Đổi sang **Sentence-BERT**, bấm lại. Kiểm số đã xét20/20, kỹ năng đáp ứng/cần bổ sung và thứ hạng. Không so trực tiếp hai cosine như xác suất hoặc phần trăm chính xác.
6. Có thể thử ứng tuyển theo quy trình thông thường; thao tác ấy sẽ tạo hồ sơ thật trong môi trường local và ảnh hưởng điều kiện gợi ý. Để giữ bộ nghiệm thu nguyên trạng, thử ghi trên5189 trước.

Tài khoản cũ như `2211000002@gmail.com` vẫn thuộc những kỳ đã có; không tự thêm tài khoản đó vào kỳ mới. Để thử bộ200 CV, dùng tài khoản mới `2699...` trong file tương ứng. Tài khoản cũ, CV đã nộp và dữ liệu người dùng đã sửa giữ nguyên.

## BERT/TF-IDF có cần train lại?

**Không train trong lần nhập này.** Sentence-BERT đang dùng mô hình đã huấn luyện sẵn, đọc CV/JD mới để sinh embedding. TF-IDF tính trọng số trên tập đầu vào khi phân tích. Chỉ cân nhắc fine-tune BERT sau khi có dữ liệu và nhãn đủ tin cậy, tập kiểm tra độc lập và phân tích lỗi; không train rồi tuyên bố chất lượng trên cùng bộ tổng hợp.

Web dùng CV tách trường và JD có ID/công ty theo kỳ nên cách ghép văn bản không hoàn toàn giống đầu vào evaluator offline. Vì vậy cosine/thứ hạng có thể khác kết quả offline; không đổi số hiển thị để làm chúng trùng nhau. Các giới hạn nhãn tổng hợp trong [CV_JD_EVALUATION_200.md](CV_JD_EVALUATION_200.md) vẫn còn nguyên.

## Kết quả thực tế

- TEST:validate đủ200 CV/20 JD, kiểm transaction rollback trước nhập, nhập thành công và chạy lại không ghi trùng.
- MAIN:chỉ chạy sau bằng chứng TEST khớp hash script/dataset; nhập841 bản ghi mới trong transaction, xác minh200 CV/200 tài khoản/20 cơ hội và kiểm các trường nguồn.
- Mọi document và indexes có trước trong cả hai database được đối chiếu BSON SHA-256 trước/sau và giữ nguyên. Không seed reset, delete, migration hoặc ghi lại CV/JD/ứng tuyển cũ.
- API cả2 môi trường:tài khoản CV-004 đăng nhập HTTP200, đọc CV/kỳ/catalog HTTP200, TF-IDF/SBERT HTTP200 với `inference_performed=true`, `candidate_count=20`. Không có tuyên bố đã đăng nhập thủ công từng tài khoản trong cả200 tài khoản.
- Tài khoản CV-004 trên5188:đề tài đầu `JD-01-2 — Phát triển giao diện web — Tích hợp và kiểm thử`; TF-IDF0,316960, SBERT0,799235, đáp ứng4/4 kỹ năng khai báo, không phải năng lực đã xác minh/xác suất được nhận.
- Browser TEST3/3 và MAIN3/3 PASS,0 runtime exception. Chỉ mở trang, đọc và gọi matching; không tự ứng tuyển hoặc lưu bài.
- Lượt browser MAIN đầu giả định JD-01 luôn nằm trang đầu nên timeout; phân trang/nhiều doanh nghiệp có thứ tự khác. Đã sửa kiểm có đề tài nguồn trong trang và chạy lại3/3; API vẫn xác minh đủ20, không sửa dữ liệu hay bỏ phân trang để làm PASS.
- Lint0error/0warning và diff whitespace PASS. Không sửa Frontend/Backend runtime, model AI hoặc dependency, nên không rebuild ứng dụng cho tác vụ dữ liệu này.

## Bằng chứng và bảo toàn

Source mới: `server/scripts/import-cv-jd-reference.cjs`, `scripts/demo/verify-reference200-web.cjs`, `client/test/reference200-web-browser.cjs`.

Thư mục local `contracts/node_modules/.cache/cv-jd-reference-web-20261107` chứa kết quả import, file login, API runtime, kết quả browser và snapshot ID/hash/index của tất cả bản ghi cũ. Nếu script đã hoàn tất, chạy lại chỉ xác minh tồn tại200 ghi danh rồi báo `ALREADY_IMPORTED_NO_WRITES`; không reset mật khẩu hoặc hoàn nguyên người dùng đã chỉnh.

[Bằng chứng chia sẻ](evidence/reference200-web-20261107/main-result.json), [API MAIN](evidence/reference200-web-20261107/main-runtime.json), [Browser MAIN](evidence/reference200-web-20261107/main-browser.json), [ảnh TF-IDF](evidence/reference200-web-20261107/main-tfidf-recommendations.png), [ảnh BERT](evidence/reference200-web-20261107/main-sbert-recommendations.png). Không chép file login hoặc snapshot chứa dữ liệu cá nhân vào bằng chứng công khai.

Không chạy lại lệnh nhập để sửa lỗi đăng nhập. Nếu lỗi giữa chừng, kiểm result/checkpoint và database trước, không xóa batch hoặc các tài khoản. Mọi insert của một lượt ở trong transaction; rollback khi lỗi, không có bước xóa dữ liệu gốc để phục hồi. Không tự thực hiện xóa cohort đã nhập.

Không train model, dùng cloud, tạo `.env`, ví thật/giao dịch, deploy, commit hoặc push.

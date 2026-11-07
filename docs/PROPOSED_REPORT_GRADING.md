# Chấm trước báo cáo và giảng viên xác nhận

Ngày: 07/11/2026. Luồng này thay thế yêu cầu trước đó về việc giảng viên nhập toàn bộ phiếu chấm từ đầu.

## Cách dùng

1. Mở http://localhost:5188/, Ctrl+F5 và đăng nhập giảng viên 1.
2. Trong **Báo cáo & kết quả**, bấm **Xem bài báo cáo** để đọc toàn văn trong cửa sổ riêng. Mở/đóng không tạo hoặc sửa dữ liệu.
3. Trong **Phân tích báo cáo thực tập**, chọn một bài và bấm **Phân tích báo cáo**.
4. Kết quả có bảng **Điểm chấm trước**, bảy tiêu chí, điểm đề xuất và căn cứ nhận diện phần đã trình bày.
5. Với bài chưa chấm/chốt và còn được phép đánh giá, bấm **Kiểm tra và xác nhận điểm**. Phiếu mở với điểm và nhận xét đã điền sẵn. Giảng viên sửa những mục cần điều chỉnh, kiểm tra sản phẩm/bằng chứng, đánh dấu đã kiểm tra và lưu.
6. Chỉ bước lưu của giảng viên mới gọi API đánh giá chính thức. Không tự ghi điểm sau khi phân tích, không ghi đè bài đã chốt hoặc đánh giá đã lưu. Nếu phiên bản đã thay đổi, API hiện có tiếp tục từ chối yêu cầu cũ.

## Thang điểm và cách chấm trước

Giữ bảy tiêu chí tổng 100 điểm: mục tiêu 10; cách thực hiện 20; kết quả 25; bằng chứng 20; tiến độ 10; bài học/cải tiến 10; trình bày/nguồn 5.

Điểm tự động là **ước lượng mức độ trình bày đủ nội dung**, dựa trên các nhóm nội dung nhận diện trong văn bản và dữ liệu task/giờ làm. Không phải mô hình được huấn luyện bằng điểm giảng viên, không chứng minh đọc hiểu sâu, không xác minh nội dung đúng và không chấm được chất lượng sản phẩm. Một bài đủ từ khóa vẫn có thể được đề xuất điểm quá cao; cần người kiểm tra.

- Bài ngắn bị giảm phần điểm nội dung. Danh sách nêu rõ các phần chưa có không được dùng để cộng điểm các phần đó.
- Nội dung nói sản phẩm chưa hoàn thành bị giới hạn điểm kết quả.
- Bằng chứng chỉ tạm tính tối đa 10/20 vì chưa mở/xác minh tài liệu hay sản phẩm bên ngoài.
- Tiến độ dựa trên công việc đã hoàn thành, phút đã duyệt và nội dung nhật ký được nhắc tới; đây chưa phải kết luận về thái độ/chuyên cần.
- Không quy đổi cosine, confidence hoặc nhãn `needs_support` thành điểm.
- Phiếu hiện căn cứ và lưu ý bằng lời dễ hiểu. Chi tiết thang điểm chính thức của trường có thể khác; cần nhà trường nghiệm thu trước sử dụng thật.

## Hai nhóm bài để thử

Giữ 48 báo cáo mẫu; trong đó sáu báo cáo tuần chưa có nhận xét được chuyển thành bản cố ý thiếu, các bài khác được giữ nội dung đầy đủ đã chuẩn bị. Không reset điểm, nhận xét hoặc báo cáo của người dùng.

Giảng viên `lecturer-1@example.invalid`:

- **Báo cáo tuần — Nguyễn Hải Đăng — Cần bổ sung** (`2311000005@gmail.com`): thiếu cách thực hiện, sản phẩm, kiểm thử và kế hoạch cụ thể. API thực tế đề xuất **32,84/100**.
- **Báo cáo tổng kết — Nguyễn Hải Đăng**: nhiều mục được trình bày đầy đủ; API thực tế đề xuất **82,33/100**, bằng chứng vẫn chỉ tạm tính.
- Bài Nguyễn Thu Giang thuộc kỳ đã hoàn thành được giữ điểm/trạng thái cũ. Điểm phân tích nếu xem lại không thay điểm đã duyệt.

Các giảng viên 3,5,7,9,11 cũng có bản tuần thiếu nội dung; các giảng viên 2,4,6,8,10,12 giữ bộ bài đầy đủ. Tất cả là dữ liệu tổng hợp, không gán nhận xét cho người thật.

48 file toàn văn và danh mục lưu tại thư mục local được ignore:

```text
contracts/node_modules/.cache/workflow-combined-20261107/grading-report-examples/
```

Ví dụ `2311000005-weekly.md` và `2311000005-final.md`. Đây là file Markdown để đọc bài mẫu, không phải PDF đã upload hoặc sản phẩm thực tế.

## Kỹ thuật và kiểm thử

- `ai-service/nlp/report_grading.py` bổ sung `proposed_grading` vào phản hồi phân tích; không đổi request, schema MongoDB hoặc endpoint đánh giá chính thức.
- `AiPage.jsx` mở phiếu từ đúng báo cáo đã phân tích; đổi báo cáo xóa kết quả cũ; chỉ cho xác nhận khi bài đang ở trạng thái có thể đánh giá.
- `ReviewForm.jsx` nhận điểm đề xuất, cho sửa và yêu cầu xác nhận đã kiểm tra trước khi lưu qua API cũ. Chi tiết tiêu chí vẫn lưu cùng nhận xét, tổng /100 vẫn ở `score`.
- `Reports.jsx` thêm nút xem bài, không gọi API ghi khi đọc.
- Năm test chấm trước Python PASS, 16 NLP regression PASS, năm test phiếu chấm Frontend PASS. Lint/build PASS (output ignored `client/dist/proposed-report-grading`).
- Qua Backend/giảng viên thật: hai bài đầy đủ/thiếu trả đúng bảy tiêu chí, tổng bằng tổng các mục, `official:false`. Sau phân tích, toàn bộ dữ liệu danh sách báo cáo trước/sau bằng nhau; không tự ghi điểm.
- AI local 8003 đã restart có kiểm tra đúng tiến trình; MongoDB và Backend không bị đổi cấu hình.
- Browser E2E bấm xem bài/chỉnh điểm/xác nhận lưu: NOT TESTED trong đợt này. Không lưu điểm chính thức chỉ để tạo bằng chứng PASS.

Các script fixture có kiểm tra trùng/phiên bản và không được chạy lại khi output đã có. Không commit/push/merge.

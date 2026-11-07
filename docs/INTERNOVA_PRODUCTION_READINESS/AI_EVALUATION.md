# BERT hoạt động và phân quyền

Mô hình thật: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`; ONNX CPU int8, artifact pin/hash, không tải/train lại trong đợt này. Service8003 đã ready và có inference thật. Không gửi dữ liệu CV ra ngoài máy. Giữ TF-IDF làm baseline, không gọi TF-IDF là BERT.

| Vai trò | Công cụ | Quyền |
| --- | --- | --- |
| Sinh viên | `/core/school/ai/match` | CV của mình, enrollment được cấp, cơ hội còn tuyển; người khác404 |
| Nhà trường | `/core/school/ai/recommend-placement` | Sinh viên chưa có đề tài, giới hạn kỳ/cơ hội; không tự phân công |
| Giảng viên | `/core/ai/reports/:id/analyze` | Bài của sinh viên phụ trách; đọc bài đã nộp hoặc chọn rõ bài mẫu |
| Doanh nghiệp | Xác nhận công việc/tiêu chí, nhận xét bài trong doanh nghiệp | Không có công cụ xếp hạng/gợi ý ứng viên; API ranking403 |

API phân tích báo cáo cũng cho doanh nghiệp đọc/phân tích đúng báo cáo thuộc đơn vị khi tích hợp trong nghiệp vụ review; không mở menu gợi ý ứng viên cho doanh nghiệp. Điểm rubric cuối kỳ chỉ giảng viên có quyền xác nhận. Admin không gọi thay API phân tích riêng của giảng viên.

`nlp/evidence.py` chia đoạn nguyên văn, trả offset/nguồn/độ tương đồng thật, giới hạn 40 đoạn/10 tiêu chí/3 tệp. Nếu bị cắt, có coverage/truncated. Negation hoặc nhắc từ đúng không làm tiêu chí thành đạt. Không fetch link sản phẩm từ Internet. Không chuyển cosine thành % hoàn thành hay điểm học tập.

Bằng chứng mới: `ai-roles.json` 6/6, student hai kết quả cosine khoảng 0.586579 và0.509439; đề xuất phân công của trường có dữ liệu thật nhưng vẫn `automatic_assignment:false`; bài nộp giảng viên phân tích có contentHash. Đây là kết quả trên dữ liệu TEST, không chứng minh độ chính xác ngoài thực tế.

Kết quả lịch sử bộ 200CV/20JD/4.000 cặp tổng hợp được lưu trong `../SEMANTIC_MATCHING_REVIEW.md`: TF-IDF P@5=.333333, Recall@5=1, MAP=1, NDCG=.993910; BERT .32/.95/.802778/.861750. Không rerun toàn bộ benchmark trong đợt này, không gọi nhãn tự sinh là chuyên gia. Rủi ro TF-IDF+Logistic thử 1.000 báo cáo tổng hợp vẫn EXPERIMENTAL_SYNTHETIC; chưa fine-tune BERT chấm điểm, chưa hiệu chuẩn xác suất, chưa đủ dữ liệu để tuyên bố chấm như giảng viên thật.

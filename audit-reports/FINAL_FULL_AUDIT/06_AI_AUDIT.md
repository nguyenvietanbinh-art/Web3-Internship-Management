# KIỂM ĐỊNH AI

Ngày 30/10/2026 (Asia/Bangkok). Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Chỉ kiểm định; không sửa source, schema, dependency, .env hoặc dữ liệu nghiệp vụ. Kết quả đọc source không được coi là kiểm thử E2E.

## Thuật toán đang có

`ai-service/main.py:1` FastAPI; GET /health, POST /api/match, POST /api/analyze-report. BatchMatchRequest có schema nhưng chưa endpoint batch. TF-IDF bigram(1,2) được fit từng cặp text, cosine similarity; clean_text lowercase và bỏ ký tự không word. Matching =40% text similarity +60% exact skills overlap, clamp0..100, recommendation thresholds80/60. Đây là mô hình TF-IDF thực, không phải BERT. Chưa parse PDF/DOCX, chưa trích skills tự động, không dùng GPA, không có supervised ranking/corpus fit ổn định.

SentenceTransformer all-MiniLM-L6-v2 chỉ được import khi AI_ENGINE bật sbert/bert/sentence-transformers; requirements chưa khai báo sentence-transformers/torch. Nhánh code optional có thật nhưng model chưa tải/runtime chưa chạy và không được tuyên bố triển khai BERT hoàn chỉnh. Venv tracked trỏ Python310 máy cũ; dùng Python3.13.5 hiện tại để chạy test thuần, không kích hoạt/sửa venv. Cần môi trường tái lập riêng sau phê duyệt, không cài trong audit.

## Báo cáo KPI và lỗi điểm

Relevance cosine×100; suggested_score clamp(relevance×0.8 +5×keywords_found,50,98). Báo cáo trống và hoàn toàn không liên quan đều được50 điểm: đã tái hiện bằng gọi hàm thuần. Keyword substring không phân biệt từ/negation, duplicate keyword có thể tăng điểm; chưa test chất lượng dataset. clean_text C++/C# đều thành c; cần tokenizer bảo toàn tên kỹ năng. Empty matching trả0 tốt nhưng không đủ để khẳng định ranking chính xác.

## Tích hợp

Backend aiClient POST JSON timeout5s, dùng AI_SERVICE_URL mặc định localhost8000. Match-cv đọc JD và sort score, topics có thể tính matching theo profile; submit KPI lưu AIAnalysis. Nhật ký WorkLog chưa nối AI. Khi AI lỗi: matching fallback exact skills clamp20..95, yêu cầu trống ra70, không engine/fallback flag; report fallback có engine keyword-fallback và feedback nêu rõ. Frontend JD mặc định80 trước matching làm kết quả có vẻ đã tính. UI CV state không lưu hồ sơ nên topic matching và CV tab có thể dùng thông tin khác nhau.

Port8000 hiện không nghe; không start AI network service. Test thuần import module với AI_ENGINE=tfidf, -B không pycache, không model download, không network. Backend adapter được test bằng axios.post giả ném lỗi; không gọi downstream thật. Vì vậy **thuật toán TF-IDF đã thực thi, tích hợp Frontend→Backend→AI service chưa được xác minh runtime**.

## Kết quả test mới

| Test thuần | Kết quả | Chi tiết |
| --- | --- | --- |
| AI health TF-IDF | PASS | Đạt đúng assertion |
| AI empty similarity zero | PASS | Đạt đúng assertion |
| AI identical similarity near one | PASS | Đạt đúng assertion |
| AI unrelated similarity zero | PASS | Đạt đúng assertion |
| AI empty matching score zero | PASS | Đạt đúng assertion |
| AI exact skills overlap ratio | PASS | Đạt đúng assertion |
| AI blank report must not earn passing score | FAIL | actual=50; expected=0 |
| AI unrelated report must not earn passing score | FAIL | actual=50; expected=0 |
| AI C++ vs C# normalization preserves distinction | FAIL | Both normalize to c |
| AI HTTP schema rejects missing fields | PASS | Missing required fields rejected by Pydantic |
| AI fallback no-overlap gets zero score | FAIL | No-overlap fallback returns 20  20 !== 0  |
| AI fallback exposes provenance | FAIL | Matching fallback score 70 without engine/fallback flag |
| AI report fallback identifies keyword engine | PASS | Đạt |

## Còn thiếu và nghiệm thu

Các assertion yêu cầu điểm0 cho báo cáo trống hoặc matching không có skill trùng là tiêu chí kiểm định bảo thủ được đề xuất, chưa phải đặc tả rubric đã được chủ đồ án duyệt. Giá trị thực tế50/20/70 đã tái hiện; không suy ra hệ thống tự động duyệt báo cáo chỉ vì có50 điểm. Điểm AI là gợi ý, cần tách khỏi quyết định người chấm và thể hiện rõ fallback.

Chưa có dataset CV/JD gán nhãn, Precision@K/Recall@K/MAP/NDCG@K, classifier tiến độ/rủi ro, Accuracy/Precision/Recall/F1/confusion matrix, thông báo cảnh báo, drift/quality monitoring hoặc kiểm định tiếng Việt. Unit smoke không thay thế đánh giá mô hình. Cần chốt task/dataset/nhãn và baseline TF-IDF, so sánh SBERT thật, chống leakage, test empty/unrelated/duplicate/long input/timeout. Không dùng điểm sàn hoặc random/mock làm bằng chứng chất lượng. AI chỉ gợi ý, quyết định đánh giá cuối phải được người có quyền duyệt.

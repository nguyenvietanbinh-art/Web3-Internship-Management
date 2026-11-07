# AI — TÍCH HỢP TF-IDF ĐÃ CHẠY THỰC

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

AI được chạy bằng Python hiện có: `python -B -m uvicorn main:app --host 127.0.0.1 --port 8001`, AI_ENGINE=tfidf,không reload/không model download/không cài thưviện. Health 200 engine TF-IDF fallback,bert_active=false. “fallback”ở health là tên engine code; không có nghĩa service đang offline.

Đã kiểm 3 tầng: browser bấm matching→POST Backend match-cv 200→AIstdout có POST/api/match 200 cho từng JD. Trả semantic_affinity,skill_ratio,sortedscore;không chỉ thử hàm pure. Backend demo AI_SERVICE_URL8001, không timeout/unavailable warning trong calls đã chạy. Không tuyên bố matching chính xác chỉ vì HTTP 200.

| Test AI runtime | Kết quả | Chi tiết |
| --- | --- | --- |
| AI service runtime TF-IDF health | PASS | TF-IDF fallback |
| Frontend/Backend-facing match-cv reaches live AI | PASS | [{'title': 'Kỹ sư Thực tập Smart Contract & DeFi', 'score': 46.6}, {'title': 'Thực tập sinh Blockchain Frontend Developer', 'score': 12.7}, {'title': 'Thực tập sinh Full stack AI & Web3 Integration', 'score': 12.6}] |
| AI HTTP blank report should return 0 | FAIL | Actual 50  50 !== 0  |


POST/analyze-report report trống trả 50 điểm đã tái hiện qua HTTP. Assertion expected 0 là chính sách kiểm định bảo thủ,chưa được chốt rubric; không suy ra 50 điểm tự động approved. Foundation report analysis gọi AI thật khi submit nhưng IPFS stub, nên không phải bằng chứng upload/pinning.

Vẫn là TF-IDF bigram+cosine/exact skill overlap(40/60),không phải BERT. SBERT optional chưa đủ dependencies/model/dataset, không kích hoạt. CV form chưa lưu/parser/GPA; apply chưa thật; fallback matching 20/70 thiếu provenance; textC++/C#vẫn rủi ro đã unit xác nhận trước; chưa đánh giá lại bằng dataset. Không Precision@K/Recall@K/MAP/NDCG hoặcF 1/confusion matrix, risk classifier/notification vẫn thiếu. Chi tiết thuật toán/file/dòng và cách sửa ở [06 cũ](../FINAL_FULL_AUDIT/06_AI_AUDIT.md).

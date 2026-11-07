# Kết quả thực nghiệm 200 CV × 20 yêu cầu công việc

Đây là đối chiếu với nhãn tổng hợp theo thang tham chiếu, chưa có giảng viên xác nhận. Không phải độ chính xác trên người thật. Không huấn luyện hoặc thay model đang chạy.

Có 200 CV, 20 JD, 4000 cặp; 150 CV có ít nhất một đề tài đạt mức2/3, 50 CV chưa có đề tài đạt mức này.

| Phạm vi | Phương pháp | P@5 | R@5 | MAP | NDCG@5 | Thời gian trung bình (ms) |
|---|---|---:|---:|---:|---:|---:|
| all (150 CV có đề tài phù hợp) | tfidf | 0.3373 | 1.0000 | 1.0000 | 0.9938 | 19.51 |
| all (150 CV có đề tài phù hợp) | sbert | 0.3240 | 0.9467 | 0.8258 | 0.8754 | 68.04 |
| test (30 CV có đề tài phù hợp) | tfidf | 0.3333 | 1.0000 | 1.0000 | 0.9939 | 19.21 |
| test (30 CV có đề tài phù hợp) | sbert | 0.3200 | 0.9500 | 0.8028 | 0.8618 | 66.84 |

P@5 chia đúng5. Mỗi CV có thể chỉ có1–2 đề tài phù hợp nên P@5 thấp không đồng nghĩa mất các đề tài phù hợp; luôn đọc cùng Recall@5 và MAP. CV không có đề tài đạt mức2 không tính vào MAP/Recall vì mẫu số bằng0, nhưng vẫn được chạy đầy đủ và báo riêng. NDCG dùng mức0–3 để đo thứ tự; P/R/MAP chỉ coi mức2–3 là phù hợp.

TF-IDF tốt hơn Sentence-BERT trên bộ này. Không chỉnh nhãn để đảo kết quả: CV/JD được tạo từ cùng danh mục kỹ năng và mẫu câu nên có thiên lệch có lợi cho so từ khóa. Kết quả rất cao của TF-IDF không chứng minh hiệu quả thực tế. Chia nhóm CV120/40/40 tránh cùng family qua split, nhưng mẫu câu và catalog JD dùng chung, chưa độc lập về ngữ nghĩa. Không dùng tập test này để tinh chỉnh rồi báo lại như kiểm thử độc lập.

Đo trên service đã nạp model, gọi tuần tự; không phải benchmark khởi động lạnh hay nhiều người đồng thời. Model Sentence-BERT multilingual MiniLM-L12-v2, ONNX CPU int8; xem revision/coverage/error trong metrics.json và predictions.jsonl. Cosine không phải xác suất trúng tuyển.

## Ví dụ đối chiếu từng CV

| CV | Hướng | Số đề tài đạt mức2–3 | Top1 TF-IDF | Top1 Sentence-BERT |
|---|---|---:|---|---|
| CV-001 | frontend | 0 | JD-01-1 (mức 1) | JD-01-2 (mức 1) |
| CV-002 | frontend | 1 | JD-01-1 (mức 2) | JD-01-2 (mức 1) |
| CV-003 | frontend | 2 | JD-01-1 (mức 3) | JD-01-2 (mức 3) |
| CV-004 | frontend | 2 | JD-01-2 (mức 3) | JD-01-2 (mức 3) |
| CV-005 | frontend | 0 | JD-01-1 (mức 1) | JD-01-2 (mức 0) |
| CV-006 | frontend | 1 | JD-01-1 (mức 2) | JD-01-2 (mức 1) |
| CV-007 | frontend | 2 | JD-01-1 (mức 3) | JD-01-2 (mức 3) |
| CV-008 | frontend | 2 | JD-01-2 (mức 3) | JD-01-2 (mức 3) |
| CV-009 | frontend | 0 | JD-01-1 (mức 1) | JD-01-2 (mức 0) |
| CV-010 | frontend | 1 | JD-01-1 (mức 2) | JD-01-2 (mức 1) |
| CV-011 | frontend | 2 | JD-01-1 (mức 3) | JD-01-2 (mức 3) |
| CV-012 | frontend | 2 | JD-01-2 (mức 3) | JD-01-2 (mức 3) |
| CV-013 | frontend | 0 | JD-01-1 (mức 1) | JD-01-2 (mức 1) |
| CV-014 | frontend | 1 | JD-01-1 (mức 2) | JD-01-2 (mức 1) |
| CV-015 | frontend | 2 | JD-01-1 (mức 3) | JD-01-2 (mức 3) |
| CV-016 | frontend | 2 | JD-01-2 (mức 3) | JD-01-2 (mức 3) |
| CV-017 | frontend | 0 | JD-01-1 (mức 1) | JD-01-2 (mức 0) |
| CV-018 | frontend | 1 | JD-01-1 (mức 2) | JD-07-2 (mức 0) |
| CV-019 | frontend | 2 | JD-01-1 (mức 3) | JD-01-2 (mức 3) |
| CV-020 | frontend | 2 | JD-01-2 (mức 3) | JD-01-2 (mức 3) |
| CV-021 | backend | 0 | JD-02-1 (mức 1) | JD-03-2 (mức 0) |
| CV-022 | backend | 1 | JD-02-1 (mức 2) | JD-07-2 (mức 0) |
| CV-023 | backend | 2 | JD-02-1 (mức 3) | JD-02-2 (mức 3) |
| CV-024 | backend | 2 | JD-02-2 (mức 3) | JD-02-2 (mức 3) |
| CV-025 | backend | 0 | JD-02-1 (mức 1) | JD-02-2 (mức 0) |
| CV-026 | backend | 1 | JD-02-1 (mức 2) | JD-02-2 (mức 1) |
| CV-027 | backend | 2 | JD-02-1 (mức 3) | JD-02-2 (mức 3) |
| CV-028 | backend | 2 | JD-02-2 (mức 3) | JD-02-2 (mức 3) |
| CV-029 | backend | 0 | JD-02-1 (mức 1) | JD-02-2 (mức 0) |
| CV-030 | backend | 1 | JD-02-1 (mức 2) | JD-02-2 (mức 1) |
| CV-031 | backend | 2 | JD-02-1 (mức 3) | JD-02-2 (mức 3) |
| CV-032 | backend | 2 | JD-02-2 (mức 3) | JD-02-2 (mức 3) |
| CV-033 | backend | 0 | JD-02-1 (mức 1) | JD-02-2 (mức 0) |
| CV-034 | backend | 1 | JD-02-1 (mức 2) | JD-02-2 (mức 1) |
| CV-035 | backend | 2 | JD-02-1 (mức 3) | JD-02-2 (mức 3) |
| CV-036 | backend | 2 | JD-02-2 (mức 3) | JD-02-2 (mức 3) |
| CV-037 | backend | 0 | JD-02-1 (mức 1) | JD-02-2 (mức 0) |
| CV-038 | backend | 1 | JD-02-1 (mức 2) | JD-02-2 (mức 1) |
| CV-039 | backend | 2 | JD-02-1 (mức 3) | JD-02-2 (mức 3) |
| CV-040 | backend | 2 | JD-02-2 (mức 3) | JD-02-2 (mức 3) |
| CV-041 | java | 0 | JD-04-1 (mức 0) | JD-03-2 (mức 0) |
| CV-042 | java | 1 | JD-03-1 (mức 2) | JD-03-2 (mức 1) |
| CV-043 | java | 2 | JD-03-1 (mức 3) | JD-03-2 (mức 3) |
| CV-044 | java | 2 | JD-03-2 (mức 3) | JD-04-2 (mức 1) |
| CV-045 | java | 0 | JD-03-1 (mức 1) | JD-03-2 (mức 0) |
| CV-046 | java | 1 | JD-03-1 (mức 2) | JD-03-2 (mức 1) |
| CV-047 | java | 2 | JD-03-1 (mức 3) | JD-04-1 (mức 1) |
| CV-048 | java | 2 | JD-03-2 (mức 3) | JD-03-2 (mức 3) |
| CV-049 | java | 0 | JD-03-1 (mức 1) | JD-03-2 (mức 0) |
| CV-050 | java | 1 | JD-03-1 (mức 2) | JD-04-1 (mức 1) |
| CV-051 | java | 2 | JD-03-1 (mức 3) | JD-03-2 (mức 3) |
| CV-052 | java | 2 | JD-03-2 (mức 3) | JD-03-2 (mức 3) |
| CV-053 | java | 0 | JD-04-1 (mức 0) | JD-03-2 (mức 0) |
| CV-054 | java | 1 | JD-03-1 (mức 2) | JD-03-2 (mức 1) |
| CV-055 | java | 2 | JD-03-1 (mức 3) | JD-03-2 (mức 3) |
| CV-056 | java | 2 | JD-03-2 (mức 3) | JD-04-1 (mức 1) |
| CV-057 | java | 0 | JD-03-1 (mức 1) | JD-03-2 (mức 0) |
| CV-058 | java | 1 | JD-03-1 (mức 2) | JD-03-2 (mức 1) |
| CV-059 | java | 2 | JD-03-1 (mức 3) | JD-04-1 (mức 1) |
| CV-060 | java | 2 | JD-03-2 (mức 3) | JD-03-2 (mức 3) |
| CV-061 | qa | 0 | JD-04-1 (mức 1) | JD-04-1 (mức 1) |
| CV-062 | qa | 1 | JD-04-1 (mức 2) | JD-04-1 (mức 2) |
| CV-063 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-064 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-065 | qa | 0 | JD-04-1 (mức 1) | JD-04-1 (mức 1) |
| CV-066 | qa | 1 | JD-04-1 (mức 2) | JD-04-1 (mức 2) |
| CV-067 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-068 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-069 | qa | 0 | JD-04-1 (mức 1) | JD-04-1 (mức 1) |
| CV-070 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-071 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-072 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-073 | qa | 0 | JD-04-1 (mức 1) | JD-04-1 (mức 1) |
| CV-074 | qa | 1 | JD-04-1 (mức 2) | JD-04-1 (mức 2) |
| CV-075 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-076 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-077 | qa | 0 | JD-04-1 (mức 1) | JD-04-1 (mức 1) |
| CV-078 | qa | 1 | JD-04-1 (mức 2) | JD-04-1 (mức 2) |
| CV-079 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-080 | qa | 2 | JD-04-1 (mức 3) | JD-04-1 (mức 3) |
| CV-081 | data | 0 | JD-05-1 (mức 1) | JD-04-1 (mức 0) |
| CV-082 | data | 1 | JD-05-1 (mức 2) | JD-05-1 (mức 2) |
| CV-083 | data | 2 | JD-05-1 (mức 3) | JD-05-1 (mức 3) |
| CV-084 | data | 2 | JD-05-2 (mức 3) | JD-05-2 (mức 3) |
| CV-085 | data | 0 | JD-05-1 (mức 1) | JD-05-1 (mức 1) |
| CV-086 | data | 1 | JD-05-1 (mức 2) | JD-05-1 (mức 2) |
| CV-087 | data | 2 | JD-05-1 (mức 3) | JD-05-2 (mức 3) |
| CV-088 | data | 2 | JD-05-2 (mức 3) | JD-05-2 (mức 3) |
| CV-089 | data | 0 | JD-05-1 (mức 1) | JD-05-1 (mức 1) |
| CV-090 | data | 1 | JD-05-1 (mức 2) | JD-05-1 (mức 2) |
| CV-091 | data | 2 | JD-05-1 (mức 3) | JD-05-1 (mức 3) |
| CV-092 | data | 2 | JD-05-2 (mức 3) | JD-05-2 (mức 3) |
| CV-093 | data | 0 | JD-05-1 (mức 1) | JD-04-1 (mức 0) |
| CV-094 | data | 1 | JD-05-1 (mức 2) | JD-05-1 (mức 2) |
| CV-095 | data | 2 | JD-05-1 (mức 3) | JD-05-1 (mức 3) |
| CV-096 | data | 2 | JD-05-2 (mức 3) | JD-05-2 (mức 3) |
| CV-097 | data | 0 | JD-05-1 (mức 1) | JD-05-1 (mức 1) |
| CV-098 | data | 1 | JD-05-1 (mức 2) | JD-05-1 (mức 2) |
| CV-099 | data | 2 | JD-05-1 (mức 3) | JD-05-2 (mức 3) |
| CV-100 | data | 2 | JD-05-2 (mức 3) | JD-05-2 (mức 3) |
| CV-101 | mobile | 0 | JD-06-1 (mức 1) | JD-06-1 (mức 1) |
| CV-102 | mobile | 1 | JD-06-1 (mức 2) | JD-06-1 (mức 2) |
| CV-103 | mobile | 2 | JD-06-1 (mức 3) | JD-06-1 (mức 3) |
| CV-104 | mobile | 2 | JD-06-2 (mức 3) | JD-06-2 (mức 3) |
| CV-105 | mobile | 0 | JD-06-1 (mức 1) | JD-06-1 (mức 1) |
| CV-106 | mobile | 1 | JD-06-1 (mức 2) | JD-06-1 (mức 2) |
| CV-107 | mobile | 2 | JD-06-1 (mức 3) | JD-06-1 (mức 3) |
| CV-108 | mobile | 2 | JD-06-2 (mức 3) | JD-06-2 (mức 3) |
| CV-109 | mobile | 0 | JD-06-1 (mức 1) | JD-06-1 (mức 1) |
| CV-110 | mobile | 1 | JD-06-1 (mức 2) | JD-06-1 (mức 2) |
| CV-111 | mobile | 2 | JD-06-1 (mức 3) | JD-06-1 (mức 3) |
| CV-112 | mobile | 2 | JD-06-2 (mức 3) | JD-06-2 (mức 3) |
| CV-113 | mobile | 0 | JD-06-1 (mức 1) | JD-06-1 (mức 1) |
| CV-114 | mobile | 1 | JD-06-1 (mức 2) | JD-06-1 (mức 2) |
| CV-115 | mobile | 2 | JD-06-1 (mức 3) | JD-06-1 (mức 3) |
| CV-116 | mobile | 2 | JD-06-2 (mức 3) | JD-06-2 (mức 3) |
| CV-117 | mobile | 0 | JD-06-1 (mức 1) | JD-06-1 (mức 1) |
| CV-118 | mobile | 1 | JD-06-1 (mức 2) | JD-06-1 (mức 2) |
| CV-119 | mobile | 2 | JD-06-1 (mức 3) | JD-06-1 (mức 3) |
| CV-120 | mobile | 2 | JD-06-2 (mức 3) | JD-06-2 (mức 3) |
| CV-121 | devops | 0 | JD-07-1 (mức 1) | JD-07-2 (mức 1) |
| CV-122 | devops | 1 | JD-07-1 (mức 2) | JD-07-2 (mức 1) |
| CV-123 | devops | 2 | JD-07-1 (mức 3) | JD-07-2 (mức 3) |
| CV-124 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-125 | devops | 0 | JD-07-1 (mức 1) | JD-07-1 (mức 1) |
| CV-126 | devops | 1 | JD-07-1 (mức 2) | JD-07-2 (mức 1) |
| CV-127 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-128 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-129 | devops | 0 | JD-07-1 (mức 1) | JD-07-1 (mức 1) |
| CV-130 | devops | 2 | JD-07-1 (mức 2) | JD-07-2 (mức 2) |
| CV-131 | devops | 2 | JD-07-1 (mức 3) | JD-07-2 (mức 3) |
| CV-132 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-133 | devops | 0 | JD-07-1 (mức 1) | JD-07-2 (mức 1) |
| CV-134 | devops | 1 | JD-07-1 (mức 2) | JD-07-2 (mức 1) |
| CV-135 | devops | 2 | JD-07-1 (mức 3) | JD-07-2 (mức 3) |
| CV-136 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-137 | devops | 0 | JD-07-1 (mức 1) | JD-07-1 (mức 1) |
| CV-138 | devops | 1 | JD-07-1 (mức 2) | JD-07-2 (mức 1) |
| CV-139 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-140 | devops | 2 | JD-07-2 (mức 3) | JD-07-2 (mức 3) |
| CV-141 | security | 0 | JD-08-1 (mức 1) | JD-09-2 (mức 0) |
| CV-142 | security | 1 | JD-08-1 (mức 2) | JD-07-2 (mức 0) |
| CV-143 | security | 2 | JD-08-1 (mức 3) | JD-08-1 (mức 3) |
| CV-144 | security | 2 | JD-08-2 (mức 3) | JD-09-2 (mức 0) |
| CV-145 | security | 0 | JD-08-1 (mức 1) | JD-07-2 (mức 0) |
| CV-146 | security | 1 | JD-08-1 (mức 2) | JD-07-2 (mức 0) |
| CV-147 | security | 2 | JD-08-1 (mức 3) | JD-09-2 (mức 0) |
| CV-148 | security | 2 | JD-08-2 (mức 3) | JD-08-1 (mức 3) |
| CV-149 | security | 0 | JD-08-1 (mức 1) | JD-07-2 (mức 0) |
| CV-150 | security | 2 | JD-08-1 (mức 3) | JD-08-1 (mức 3) |
| CV-151 | security | 2 | JD-08-1 (mức 3) | JD-08-1 (mức 3) |
| CV-152 | security | 2 | JD-08-2 (mức 3) | JD-08-1 (mức 3) |
| CV-153 | security | 0 | JD-08-1 (mức 1) | JD-09-2 (mức 0) |
| CV-154 | security | 1 | JD-08-1 (mức 2) | JD-07-2 (mức 0) |
| CV-155 | security | 2 | JD-08-1 (mức 3) | JD-08-1 (mức 3) |
| CV-156 | security | 2 | JD-08-2 (mức 3) | JD-09-2 (mức 0) |
| CV-157 | security | 0 | JD-08-1 (mức 1) | JD-07-2 (mức 0) |
| CV-158 | security | 1 | JD-08-1 (mức 2) | JD-07-2 (mức 0) |
| CV-159 | security | 2 | JD-08-1 (mức 3) | JD-09-2 (mức 0) |
| CV-160 | security | 2 | JD-08-2 (mức 3) | JD-08-1 (mức 3) |
| CV-161 | nlp | 0 | JD-09-1 (mức 1) | JD-09-1 (mức 1) |
| CV-162 | nlp | 1 | JD-09-1 (mức 2) | JD-09-1 (mức 2) |
| CV-163 | nlp | 2 | JD-09-1 (mức 3) | JD-09-2 (mức 3) |
| CV-164 | nlp | 2 | JD-09-2 (mức 3) | JD-09-2 (mức 3) |
| CV-165 | nlp | 0 | JD-09-1 (mức 1) | JD-09-2 (mức 0) |
| CV-166 | nlp | 1 | JD-09-1 (mức 2) | JD-09-1 (mức 2) |
| CV-167 | nlp | 2 | JD-09-1 (mức 3) | JD-09-2 (mức 3) |
| CV-168 | nlp | 2 | JD-09-2 (mức 3) | JD-09-2 (mức 3) |
| CV-169 | nlp | 0 | JD-09-1 (mức 1) | JD-09-2 (mức 0) |
| CV-170 | nlp | 1 | JD-09-1 (mức 2) | JD-09-1 (mức 2) |
| CV-171 | nlp | 2 | JD-09-1 (mức 3) | JD-09-2 (mức 3) |
| CV-172 | nlp | 2 | JD-09-2 (mức 3) | JD-09-2 (mức 3) |
| CV-173 | nlp | 0 | JD-09-1 (mức 1) | JD-09-1 (mức 1) |
| CV-174 | nlp | 1 | JD-09-1 (mức 2) | JD-09-1 (mức 2) |
| CV-175 | nlp | 2 | JD-09-1 (mức 3) | JD-09-2 (mức 3) |
| CV-176 | nlp | 2 | JD-09-2 (mức 3) | JD-09-2 (mức 3) |
| CV-177 | nlp | 0 | JD-09-1 (mức 1) | JD-09-2 (mức 0) |
| CV-178 | nlp | 1 | JD-09-1 (mức 2) | JD-09-1 (mức 2) |
| CV-179 | nlp | 2 | JD-09-1 (mức 3) | JD-09-2 (mức 3) |
| CV-180 | nlp | 2 | JD-09-2 (mức 3) | JD-09-2 (mức 3) |
| CV-181 | blockchain | 0 | JD-10-1 (mức 1) | JD-01-2 (mức 0) |
| CV-182 | blockchain | 1 | JD-10-1 (mức 2) | JD-07-2 (mức 0) |
| CV-183 | blockchain | 2 | JD-10-1 (mức 3) | JD-10-2 (mức 3) |
| CV-184 | blockchain | 2 | JD-10-2 (mức 3) | JD-10-2 (mức 3) |
| CV-185 | blockchain | 0 | JD-10-1 (mức 1) | JD-10-2 (mức 0) |
| CV-186 | blockchain | 1 | JD-10-1 (mức 2) | JD-07-2 (mức 0) |
| CV-187 | blockchain | 2 | JD-10-1 (mức 3) | JD-10-2 (mức 3) |
| CV-188 | blockchain | 2 | JD-10-2 (mức 3) | JD-10-2 (mức 3) |
| CV-189 | blockchain | 0 | JD-10-1 (mức 1) | JD-10-2 (mức 0) |
| CV-190 | blockchain | 1 | JD-10-1 (mức 2) | JD-04-1 (mức 0) |
| CV-191 | blockchain | 2 | JD-10-1 (mức 3) | JD-10-2 (mức 3) |
| CV-192 | blockchain | 2 | JD-10-2 (mức 3) | JD-10-2 (mức 3) |
| CV-193 | blockchain | 0 | JD-10-1 (mức 1) | JD-01-2 (mức 0) |
| CV-194 | blockchain | 1 | JD-10-1 (mức 2) | JD-07-2 (mức 0) |
| CV-195 | blockchain | 2 | JD-10-1 (mức 3) | JD-10-2 (mức 3) |
| CV-196 | blockchain | 2 | JD-10-2 (mức 3) | JD-10-2 (mức 3) |
| CV-197 | blockchain | 0 | JD-10-1 (mức 1) | JD-10-1 (mức 1) |
| CV-198 | blockchain | 1 | JD-10-1 (mức 2) | JD-04-1 (mức 0) |
| CV-199 | blockchain | 2 | JD-10-1 (mức 3) | JD-10-2 (mức 3) |
| CV-200 | blockchain | 2 | JD-10-2 (mức 3) | JD-10-2 (mức 3) |

## Cách kiểm tra lại

Mở CV trong `cvs/`, yêu cầu công việc trong `jobs.jsonl`, phiếu tham chiếu trong `reviews/`, bảng điểm và thứ hạng đầy đủ trong `pair-comparison.csv`. Người đánh giá độc lập dùng `human-review.csv` (các ô điểm/người chấm để trống), không xem thứ hạng trước khi chấm. Sau khi có xác nhận thật mới tạo phiên bản nhãn độc lập để chạy evaluator nghiệm thu hiện có; không tự đổi provenance cho bộ này.

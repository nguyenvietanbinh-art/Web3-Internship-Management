# Đối chiếu CV/JD và giao diện gợi ý — 07/11/2026

Đã hoàn thành cải tiến trong phạm vi yêu cầu: suy luận thật bằng hai phương pháp, so sánh thứ hạng, phân loại kỹ năng và tinh gọn giao diện. Build, lint và browser tests đã PASS. Chất lượng dự đoán ngoài dữ liệu tổng hợp vẫn **PARTIAL**, chưa có nhãn do giảng viên độc lập xác nhận. Không huấn luyện lại mô hình.

## Pipeline đã xác minh

- Backend: `server/src/workflow/ai.js`. CV lấy từ tài khoản đang đăng nhập: tiêu đề, tóm tắt, học vấn, kinh nghiệm, nội dung trích xuất và kỹ năng. Văn bản tối đa 50.000 ký tự. Không dùng CV ID do client gửi để vượt quyền.
- JD lấy từ cơ hội còn hợp lệ trong kỳ sinh viên được tham gia; yêu cầu kỹ năng lấy từ đề tài thuộc đúng doanh nghiệp. Giữ nguyên điều kiện đã ứng tuyển, đã có nơi tiếp nhận, thời gian và chỉ tiêu. Lấy tối đa 50 cơ hội; UI báo số đã xét/tổng đủ điều kiện. Không có phân trang xếp hạng toàn bộ ngoài giới hạn này.
- CV chỉ có tiêu đề, không có nội dung/kỹ năng: từ chối 409. JD thiếu cả mô tả lẫn kỹ năng: loại khỏi lượt phân tích, báo số lượng loại; không xóa dữ liệu.
- AI: `ai-service/nlp/engine.py`. Chuẩn hóa Unicode NFC, khoảng trắng, ký tự NUL và tên kỹ năng theo `shared/skill-catalog.json`. Nội dung và kỹ năng đã chuẩn hóa được đưa vào vector.
- Sentence-BERT: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, revision `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX CPU int8, embedding 384 chiều. Kiểm tra manifest và SHA-256 artifact trước khi nạp. Chia tối đa 8 đoạn × 126 token nội dung, mean pooling, chuẩn hóa L2, cosine; báo khi cắt văn bản. Suy luận nội bộ, không gửi CV ra ngoài.
- TF-IDF: vectorizer unigram/bigram trên CV truy vấn và chính tập JD của lượt chạy, sau đó cosine. Điểm thay đổi theo tập tài liệu; không phải xác suất được tuyển.
- Cache embedding: SHA-256 nội dung chuẩn hóa và kỹ năng, TTL 600 giây, tối đa 128 mục; model được pin trong tiến trình. Kiểm thử đổi truy vấn đã xác nhận không dùng chung vector sai. Không tự fallback sang TF-IDF khi BERT lỗi.
- Trước đây `cosine` làm tròn 6 số được dùng để xếp hạng. Nay sắp theo `raw_cosine` đầy đủ độ chính xác, ID phân xử khi thực sự bằng nhau. Giữ `cosine` cũ để tương thích API. UI dùng raw score, hiển thị 10 chữ số có nghĩa; giá trị đầy đủ có trong API/tooltip.

## Kỹ năng và chế độ so sánh

Danh mục có phiên bản `controlled-skills-v1-20261107`. Chi tiết được tách thành bốn nhóm:

| Nhóm | Ví dụ | Tính vào số yêu cầu đáp ứng |
| --- | --- | --- |
| Trùng khớp | MongoDB ↔ MongoDB | Có, theo kỹ năng khai báo |
| Tương đương tên gọi | JS ↔ JavaScript; NodeJS ↔ Node.js; RESTful API ↔ REST API | Có |
| Liên quan | Express ↔ Node.js; React ↔ JavaScript; Spring Boot ↔ Java | Không |
| Chưa có bằng chứng trực tiếp | JD có MongoDB, CV không khai báo | Không |

Quan hệ liên quan chỉ trực tiếp, không suy diễn bắc cầu hay kết luận thành thạo. Không thêm trọng số kỹ năng vào cosine, không tự bịa năng lực hoặc kinh nghiệm.

Chế độ so sánh chụp một đầu vào chung và gắn SHA-256 `input_fingerprint`, chạy TF-IDF rồi BERT trên cùng tập. AI có thể trả toàn bộ điểm đã tính của tối đa 50 JD; `results` vẫn tuân thủ top-K tối đa 20. Backend hợp nhất top-K của hai phương pháp và giữ thứ hạng trong toàn tập đã xét. UI cho chọn sắp theo từng phương pháp. Chênh lệch thứ hạng = hạng TF-IDF − hạng BERT; số dương nghĩa là tăng hạng ở BERT. Không lấy hiệu cosine để kết luận phương pháp nào tốt hơn. Một phương pháp lỗi thì không tạo kết quả so sánh thành công giả.

Ví dụ thực tế CV-002 trên 20 JD tham chiếu: TF-IDF xếp JD-01-1 trước JD-01-2 (0.32741830313096326; 0.2884890942361317), BERT xếp JD-01-2 trước JD-01-1 (0.7743885378591707; 0.7681429703814318). Đây là khác biệt thứ hạng thật, không phải thay điểm để biểu diễn khác nhau.

## Vì sao điểm gần nhau

Đã đọc toàn bộ 152 cơ hội mở trong database đang chạy: 20 cơ hội tham chiếu mới và 132 cơ hội cũ; 12 cơ hội đóng không thuộc tập đang tuyển. Có 80 đầu vào mô hình khác nhau, 8 nhóm trùng mô tả và kỹ năng, phủ 132 cơ hội cũ. Nhiều bản chỉ khác tên công ty/kỳ; tên công ty trong văn bản vẫn có thể làm điểm khác nhẹ. Bản ở kỳ khác không nhất thiết cạnh tranh trong cùng lượt gợi ý.

Đối chiếu BERT thật trên 80 đầu vào: 3.160 cặp, **297 cặp cosine ≥ 0,95**, trong đó **162 cặp ≥ 0,99**; không lỗi và không cắt văn bản. TF-IDF trên riêng corpus audit có 222 cặp ≥ 0,95; không dùng điểm corpus này thay điểm gợi ý trực tiếp. Ngưỡng dùng để tìm dữ liệu gần trùng, không phải ngưỡng nhận sinh viên. Xem [danh sách nhóm và bằng chứng](JD_DUPLICATION_AUDIT.md).

Không ghi đè JD để ép điểm khác nhau. Các đề tài cùng họ công việc có yêu cầu gần nhau thì chấp nhận điểm gần nhau. Không chứng minh được BERT lỗi chỉ dựa vào việc các điểm gần nhau.

## Đánh giá thực tế trên tập tham chiếu

200 CV, 20 JD, 4.000 nhãn theo kịch bản tổng hợp; chia 120/40/40 CV, không huấn luyện hay chọn lại mô hình trong lượt này. Có 150 CV có ít nhất một JD phù hợp và 50 CV không có JD phù hợp. Mỗi phương pháp đã chạy 200 truy vấn thật, không lỗi, không cắt văn bản.

Tập mang tên test có 40 CV: 30 truy vấn có nhãn phù hợp mức ≥2 để tính ranking metrics, 10 truy vấn không có đề tài phù hợp được đếm riêng. Không diễn giải việc vẫn trả top-K cho 10 CV này là đã tìm được nơi thực tập phù hợp.

| Phương pháp | Precision@5 | Recall@5 | MAP | NDCG@5 | Trễ trung bình trên tập test |
| --- | ---: | ---: | ---: | ---: | ---: |
| TF-IDF | 0.333333 | 1.000000 | 1.000000 | 0.993910 | 19.623 ms |
| Sentence-BERT | 0.320000 | 0.950000 | 0.802778 | 0.861750 | 67.081 ms |

Trên 150 truy vấn có nhãn phù hợp của toàn bộ tập: TF-IDF P@5 0.337333, R@5 1, MAP 1, NDCG@5 0.993842; BERT lần lượt 0.324, 0.946667, 0.825850, 0.875442. Số liệu đầy đủ: [metrics.json](evidence/semantic-matching-20261107/metrics.json).

TF-IDF tốt hơn trên tập này. Nhãn và văn bản cùng thiết kế theo nhóm kỹ năng, template tương đồng nên có thiên lệch thuận lợi cho từ khóa. Chia CV chưa loại hết phụ thuộc template/JD giữa các tập; không gọi đây là kiểm định độc lập ngoài thực tế. Chưa có dữ liệu được giảng viên xác nhận để báo metrics riêng; không gán phần trăm tin cậy hoặc accuracy thật từ bộ tổng hợp.

## Giao diện trước/sau

Trước: danh sách dài, nhiều chú thích lặp, điểm 6 số và thiếu đối chiếu thứ hạng. Sau: card đề tài, công ty, điểm của phương pháp đang chọn, thứ hạng, số kỹ năng đáp ứng, kỹ năng phù hợp/còn thiếu. “Xem chi tiết” mở bảng bốn nhóm và chứng cứ CV. Chỉ có một ghi chú chung cuối danh sách; lỗi, giới hạn tập ứng viên và cảnh báo cắt văn bản vẫn được giữ. Responsive mobile đã kiểm thử.

Ảnh chạy thật: [TF-IDF](evidence/semantic-matching-20261107/tfidf-cards.png), [chi tiết kỹ năng](evidence/semantic-matching-20261107/skill-evidence-detail.png), [so sánh](evidence/semantic-matching-20261107/comparison.png), [mobile](evidence/semantic-matching-20261107/mobile-cards.png).

## Kiểm thử và giới hạn

| Nhóm | Kết quả |
| --- | --- |
| Node unit kỹ năng/so sánh | 11/11 PASS |
| API integration với fixture ghi trên TEST riêng | 3/3 PASS |
| Core AI regression, gồm BERT thật | 10/10 PASS, không skip |
| Python semantic ranking + NLP + tập tham chiếu | 5 + 16 + 4 PASS |
| Browser/API parity, chi tiết, so sánh, mobile | 4/4 PASS |
| Frontend lint/build cuối | PASS, không error/warning |
| Suy luận tình huống thật | Hai phương pháp × 5 kiểm tra PASS |
| Main/QA: mapping, scope, negative auth, so sánh | PASS cả TF-IDF/BERT/compare |
| Kỳ cũ có nhiều cơ hội | Đã xét 50/59, đủ điểm/hạng của cả hai phương pháp trên tập 50 |
| Chất lượng trên nhãn chuyên gia độc lập | NOT TESTED — chưa có nhãn |

Các tình huống gồm alias, liên quan chưa đáp ứng, CV/JD rỗng, sai kỳ, dữ liệu trùng, khác truy vấn/cache, không phù hợp, điểm gần nhau và mapping điểm API ↔ UI. Test giả lập vector chỉ kiểm tra quy tắc sắp xếp số gần nhau; không dùng nó làm bằng chứng inference. Có log fixture từng thất bại do thiếu companyName, sau khi bổ sung fixture bài test đã PASS; không xóa dữ liệu TEST để che lỗi.

Guard đã chặn cold load khi thiếu RAM. Sau khi người dùng đóng ứng dụng, đo được khoảng 1.332 MiB trống và nạp model thành công. Không hạ guard (cold load cần 1.024 MiB, inference cần 256 MiB). Các file BLOCKED cũ được giữ trong cache để làm lịch sử, không thay thế kết quả thành công cuối.

## Bảo toàn dữ liệu và Git

Database đang dùng `internova_demo_cunhan_kysu_20261107`; fixture ghi chỉ trong `internova_role_qa_20261107` có guard/marker, hoặc database TEST cô lập của harness hiện có. Đối chiếu hash trước/sau xác nhận **10 collection nghiệp vụ không đổi**: cvs, topics, topic_opportunities, job_descriptions, school_applications, assignments, business_reports, work_sessions, batch_enrollments, internship_batches. Index của cả 12 collection kiểm tra không đổi. 475 CV, 88 đề tài và 164 cơ hội vẫn giữ nguyên.

Hai collection `users`, `students` có thay đổi do đăng nhập kiểm thử được thực hiện qua API thật: thêm lịch sử password.login và cập nhật timestamp hồ sơ của ba tài khoản. Không sửa mật khẩu, vai trò hay dữ liệu CV/JD qua script. Đây là side effect hiện hữu của đăng nhập, không phải match API; không xóa lịch sử để giả vờ database hoàn toàn không đổi. Không có thao tác ghi nội dung CV/JD cần backup/phục hồi trong lượt này. Snapshot hash phục vụ kiểm chứng, không được gọi là backup có thể restore.

Git vẫn ở `branch_1`, HEAD `8aa463b`, chứa nhiều thay đổi có sẵn từ các nhiệm vụ trước; không hoàn tác chúng. `git diff --check` PASS; Git báo chuyển LF/CRLF ở một số file hiện hữu. Không commit, push, cài dependency, migration hoặc huấn luyện.

## File thuộc lượt cải tiến này

- Runtime: `shared/skill-catalog.json`; `ai-service/nlp/engine.py`, `schemas.py`; `server/src/workflow/skillComparison.js`, `matchingComparison.js`, `ai.js`; `client/src/components/business/RecommendationResults.jsx`, `MatchingDetails.jsx`, `AiPage.jsx`; `client/src/business.css`.
- Kiểm thử: `server/test/semantic-matching.unit.test.js`, `semantic-matching.integration.test.js`; `ai-service/tests/test_semantic_ranking.py`; `client/test/semantic-recommendations-browser.cjs`, cập nhật `reference200-web-browser.cjs`.
- Công cụ kiểm chứng: `scripts/demo/export-semantic-audit.cjs`, `check-semantic-runtime.cjs`; `ai-service/evaluation/audit_jd_similarity.py`, `audit_jd_lexical.py`, `check_semantic_cases.py`.
- Tài liệu: báo cáo này, `JD_DUPLICATION_AUDIT.md`, bằng chứng, và cập nhật tiến độ/test/ma trận/hướng dẫn chạy.

## Tự kiểm tra trên web

1. Truy cập **http://localhost:5188**. Dùng sinh viên tham chiếu `2699000004@gmail.com`; lấy mật khẩu trong file login local đã có, không đưa file mật khẩu lên Git.
2. Mở **Gợi ý đề tài phù hợp**, chọn kỳ tham chiếu và số kết quả 5. Chạy TF-IDF, mở chi tiết một card.
3. Chạy Sentence-BERT; kiểm tra tên công ty, điểm và kỹ năng. Không kỳ vọng mọi CV đều phải đổi top-1.
4. Chọn chế độ so sánh; lần lượt sắp theo TF-IDF và BERT, đối chiếu hai thứ hạng và chênh lệch.
5. Kiểm tra ở mobile; chuyển tab rồi quay lại. Nếu thấy kết quả cũ chưa có phân loại mới, chạy đối chiếu lại.
6. Khi BERT báo thiếu RAM, giải phóng tài nguyên và chạy lại; không lấy TF-IDF đổi nhãn thành BERT. Hiện FE, BE và AI được giữ chạy để nghiệm thu.

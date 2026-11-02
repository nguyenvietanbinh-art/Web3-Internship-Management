# Trạng thái AI mới nhất — Sentence-BERT đã inference thật

Ngày31/10/2026. MultilingualMiniLML12/ONNXint8 commit e8f8c211226b894fcb81acc59f3b34ba3efd5f42 đãnạp và thựcchạy CPU, embedding3×384, semanticranking/batch/longtext/report quaAPI/UI thật. Đã sửa tokenizer và cắtngầm128token; không thaymodel/dep/hash hoặc hạRAMguard.

22Python/92Backend/51browserCore+AI/39browserPHASE2/build/lintPASS. **Chưa có nhãnđộc lập; qualitymetricsnull, riskclassifierNOTTRAINED**, không đánhđồngsemanticrelevance với riskprediction. [Báo cáo inference và giới hạn hiện tại](AI_RUNTIME_INFERENCE_RESULT.md).

Các trạngthái chờRAM/chưa chạy model phía sau là lịch sử. Phươngpháp/provenance/API/quyền vẫn áp dụng, với specialtemplate thực<s>/</s> và `.no_truncation()`/`.no_padding()` đã kiểm trênartifactpin.

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# Cập nhật mới nhất — runtime/model đã được phê duyệt và cài/tải

Ngày31/10/2026. ONNX Runtime1.31.1/tokenizers0.23.3 và2dependency phụ đã cài **cô lập**; đúngmodelONNXint8+tokenizer121,59MiB đã tải, size/SHA256đúng. Người dùng xác nhận **chưa có dữ liệu gán nhãn**. Không còn chờ quyền cài/model; đang chờ đủRAM.

GọiSBERT local thật trả503/INSUFFICIENT_MEMORY_REQUIRE_1024_MIB, RAM~736,84MiB, configured=true/ready=false. **Chưa có embeddingSBERT/modelqualitymetrics**, classifierNOTTRAINED. Python16tests saucài và nativeimportPASS; không nhầmguardnegativePASS với modelinferencePASS. [Báo cáo cài đặt và bằng chứng](AI_RUNTIME_INSTALL_RESULT.md).

Các phần nói “chưa tải/cài, đang chờ phê duyệt” dưới đây là lịch sử trước câu trả lời mới; trạng thái hiện tại theo phần này. Phương pháp/modelpin/API/policy vẫn giữ. Chưa hoàn tất PHASE4, không chuyểnPHASE5.

---

## Lịch sử trước phê duyệt/cài ONNX — giữ để đối chiếu

# PHASE 4 — AI/NLP: triển khai, bằng chứng và giới hạn

Ngày31/10/2026, Asia/Bangkok. **Chưa đủ điều kiện nghiệm thu toàn PHASE4.** Pipeline/API/UI/TF-IDF đã kiểm thật; model SBERT chưa tải/nạp, chưa có inference SBERT để công bố. Đang chờ người dùng phê duyệt runtime/model cô lập và thông tin dataset có nhãn. Không chuyển PHASE5.

## Mô hình được chọn và mô hình thực sự đã chạy

| Hạng mục | Trạng thái thực tế |
| --- | --- |
| Baseline đã chạy | scikit-learn1.7.2, TF-IDF word unigram/bigram, cosine trên một corpus query+candidates |
| SBERT được chọn | sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2, multilingual BERT/Sentence-BERT,384dimensions, Apache2.0 |
| Commit pin | e8f8c211226b894fcb81acc59f3b34ba3efd5f42; đọc metadata chính thức tại thời điểm kiểm |
| Artifact dự kiến | onnx/model_qint8_avx512.onnx118.412.398bytes + tokenizer.json9.081.518bytes; tổng127.493.916bytes (~121,59MiB) |
| SHA256 ONNX | 783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672 |
| SHA256 tokenizer | 2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8 |
| Runtime dự kiến | ONNX Runtime CPU1.31.1 + tokenizers0.23.3; cp313Windows/ABI3 wheel có trên PyPI, chưa cài |
| SBERT inference | **NOT RUN**: không weights, không runtime, không embeddings SBERT thật trong báo cáo này |
| Risk classifier | **NOT TRAINED / NOT ACCEPTED**, risk_prediction=null, confidence=null |

Nguồn chính: [model card và license](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), [artifacts chính thức](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/tree/e8f8c211226b894fcb81acc59f3b34ba3efd5f42/onnx), [hướng dẫn ONNX/pooling/quantization](https://sbert.net/docs/sentence_transformer/usage/efficiency.html), [ONNX Runtime PyPI](https://pypi.org/project/onnxruntime/1.31.1/), [tokenizers PyPI](https://pypi.org/project/tokenizers/0.23.3/). Metadata nhỏ đã đọc, không tải weights. Không dùng all-MiniLM-L6-v2 English-only làm bằng chứng hỗ trợ CV/JD Việt. Multilingual support không chứng minh hiệu quả trên bài toán tuyển dụng, cần benchmark độc lập.

Tên avx512 là preset quantization artifact; graph ONNX không phải binary CUDA. CPU Ryzen5800H dùng CPUExecutionProvider; **khả năng thực chạy artifact trên máy này vẫn NOT TESTED**, không suy từ tên file. Nếu runtime không hỗ trợ, báo lỗi và đánh giá artifact khác trước tải, không tự kéo model lớn hơn.

## Tài nguyên và quyền cài đặt

Windows11, Ryzen7 5800H8core/16thread, RAM tổng7,39GiB, RX5500M4GiB+AMD integrated, không CUDA. Lúc đầu chỉ khoảng330MiB RAM trống; sau đóng đúng Edge TEST đã sở hữu, có lúc khoảng1,15GiB. Đây là snapshot, không phải RAM bảo đảm. Disk D còn khoảng173GiB. Không đóng ứng dụng người dùng, không cài CUDA/PyTorch, không sửa global Python/AI venv hoặc .env.

`LocalEncoder.load` yêu cầu available RAM>=1024MiB, unknown memory fail-closed; inference yêu cầu>=256MiB. ONNX threads2, interop1, tắt memory arena/pattern; batch từng chunk, timeout budget12s. Những ngưỡng này là guard dự kiến, **chưa thay phép đo peakRSS/p95 của model thật**. Chưa có model inference thì latency/RAM SBERT phải để null.

Đã gửi câu hỏi phê duyệt runtime/model cô lập; chưa nhận trả lời tại thời điểm ghi tài liệu. Việc phê duyệt pypdf trước đây chỉ áp dụng PHASE3, không được dùng thay phê duyệt runtime AI mới. Chưa chạy pip/npm install hoặc model download trong PHASE4.

## Pipeline đã viết

1. Backend lấy CV đã lưu của student; company chỉ dùng snapshot CV của người chủ động ứng tuyển JD do mình sở hữu. Không nhận arbitraryCV/studentWallet từ client. Text gồm các trường nghiệp vụ CV/JD, không gửi email/token/private key.
2. NFC Unicode, bỏ NUL/chuẩn whitespace; skill aliases JS→javascript, NodeJS→node.js, ReactJS→react. Không dịch/đoán thêm kinh nghiệm/GPA hoặc tự sinh kỹ năng.
3. TF-IDF fit chung query+candidates cho ranking, giữ legacy pairwise baseline API cũ. SBERT optional local-only, pin commit+hash hai artifact; không remote code/hub download từ import/request.
4. SBERT token chunks126content+CLS/SEP (128tokens), tối đa8chunk/document, mean pooling masked tokens rồi trung bình chunk và L2normalize. Trả total/used tokens/truncated; không âm thầm tuyên bố xét toàn CV50ktext. Encoder output phải384dimensions/finite.
5. Cosine [-1,1], sort descending với id tie-break; TopK1..20, pool tối đa50. Empty query422; candidate trống được loại có đếm; empty pool trảempty; duplicateid/badshape rejected. Cosine không confidence/probability/điểm tuyển dụng.
6. Giải thích chỉ gồm kỹ năng giao nhau/thiếu trong trường khai báo và provenance cosine; không bịa lý do nhân quả. Cache embedding local memory bằng SHA256text,128entries/TTL600s, không cache rawtext/disk; model process không giao tiếp dịch vụ inference bên ngoài.

Pipeline SBERT mới chỉ được kiểm soát shape/error/guard theo source và negative tests, chưa chứng minh inference thật. `evaluation/inference_check.py` chỉ tạo evidence nếu model thực chạy, không dùng stub để PASS.

## API và quyền

Service NLP mới chạy **127.0.0.1:8003**, không thay AI8001/8002 đang dùng cached source cũ. GET/api/v1/nlp/status; POST/api/v1/nlp/rank; POST/api/v1/nlp/report. Pydantic strict fields/types/bounds; raw request4MiB; `engine=tfidf|sbert` explicit. SBERT unavailable→503, không đổi sang TF-IDF ngầm. CORS chỉ local origin cấu hình, canonical launch bindloopback. Legacy/api/match và/api/analyze-report giữ TF-IDF contract, không tự tải all-MiniLM khi AI_ENGINE bật; CLI pythonmain bind127.0.0.1:8000/no-reload.

Express, dưới CORE_BUSINESS_ENABLED và JWT:

| API | Quyền / nguồn dữ liệu |
| --- | --- |
| GET/api/core/ai/status | Authenticated, status không chứa secret/text |
| POST/api/core/ai/match | Student, ownCV và tối đa50JDopen chưa hết hạn |
| POST/api/core/ai/rank-applicants | Company ownerJD; tối đa50application snapshot khôngwithdrawn của JD đó |
| POST/api/core/ai/reports/:id/analyze | Company/assignedmentor/Admin, kiểm Assignment scope trước gửi report |

Body `{engine,topK}`; rankingcompany thêm jdId; không cho client ghi đè observed task/hours/student. Cả POST analysis đều **không ghi DB**, không seed/AIAnalysis persistence, không audit giả. API trả catalog_total/catalog_limit/scope để không gọi TopK trên50record là ranking toàn hệ thống.

`NLP_SERVICE_URL` chỉ http127.0.0.1, cấm username/password/path/query/redirect/proxy; timeout15s, tối đa2request đồng thời, response1MiB. AI503 không block Backend health. Kiểm thử có service local thật cố tình không trả lời để chứng minh timeout và health vẫn200; không gọi Internet để thử lỗi. Không trả raw upstream exception/secrets.

## Báo cáo và risk

Semantic analysis đối chiếu reportcontent với rubric KPI snapshot Assignment: cosine relevance, không tự chấm điểm báo cáo, không riskprediction. Kết hợp taskstatus/dueDate, approved minutes, open/needs_adjustment sessions, count lịch sử reportversion. Rules riêng: OVERDUE_TASKS, MISSING_CHECKOUT, NO_APPROVED_HOURS. Có nguyên nhân cụ thể/observed/source=rule; mức review nghĩa cần người hướng dẫn xem xét. Không có giờ duyệt có thể do chưa bắt đầu/chưa duyệt, không suy thành vi phạm.

Classifier chưa có nhãn/huấn luyện/hiệu chuẩn: NOT_TRAINED, confidence/risk_prediction=null. Không đưa ra quyết định kỷ luật. Trường report_versions chỉ là quan sát sốphiên bản, chưa mô hình temporal reporthistory hoặc NLP classifier. Risk taxonomy/rubric/data split/adjudication cần chuyên gia duyệt, xem [evaluation](../ai-service/evaluation/README.md).

## Đánh giá và metrics

Chưa tìm được dataset có nhãn chuyên gia được phép dùng; đã hỏi người dùng đường dẫn. **Số mẫu nhãn nghiệm thu:0.** Precision@K=null, Recall@K=null, MAP=null, NDCG=null, riskF1/calibration=null. **Chưa có so sánh chất lượng BERT với TF-IDF**. Không điền số đơn vị test vào bảng quality.

Đã triển khai evaluator đọc nhãn độc lập, yêu cầu consent/annotators/provenance, kiểm group/query/text leakage xuyên train/validation/test, candidate đượcjudge đầy đủ. Hash không phát hiện mọi near-duplicate, vẫn cần review grouping theo người/company/template/time. AP tính fullrank, evaluator pool<=20, MAPmacro; P@K denominatorK, relevantgrade>0, NDCGgradedgain. Formula unit tests dùng ví dụ tính tay được ghi rõ UNIT-ONLY, không groundtruth sản phẩm. Chưa human labels thì evaluator fail, không tự tạo dataset để metrics đẹp.

Dataset/risk training/validation/test chưa có nên không fine-tune classifier hoặc gán confidence. Khi được cung cấp nhãn: freeze split trước tuning, inter-annotator agreement/adjudication, baseline và SBERT cùngcandidatepool, lưu revision/split/version/seed/latency/RAM và không quảng cáo tổng quát hóa ngoài mẫu nhỏ.

## UI đã tích hợp

Menu “AI matching & phân tích” theo bốn vai trò; studentmatch/companyranking, teacher/company/adminreportanalysis. Engine selector SBERT hoặcTF-IDF, TopK, JD/report picker trong scope. Mount chỉ GET; bấm mớiPOSTanalysis, không autowrite. Busy/error/unavailable/empty, actualcosine/engine, skilloverlap, truncation warning; classifier NOT_TRAINED rõ. Lỗi SBERT không hiển thị kết quả baseline giả; người dùng phải chủ động chọnTF-IDF. Không mở ví/gửi tx/publicCV.

Browser đã kiểm luồng TF-IDF và model unavailable; **chưa browser SBERT inference thật**. Chưa đồng nhất legacy matching endpoint thành SBERT; endpoint legacy còn baseline để giữ regression. Không gọi UI này là chức năng BERT đã nghiệm thu.

## Lệnh sau khi được duyệt — CHƯA chạy cài/tải

1. Kiểm lại RAM; chốt dependency lock/dry-run và dependency phụ trước cài isolated target trong ignored phase4 staging. Không cài vào Python global hoặc AI venv tracked. Optional pins tại ai-service/requirements-nlp.txt.
2. Download explicit: `python -B ai-service/evaluation/download_model.py --target contracts/node_modules/.cache/phase4-20261031/model --approved-public-artifacts`. Script chỉ2file/commit/hash/size pin, không ghi đè directory cũ, giữ partialfile nếu lỗi, không upload dữ liệu.
3. Set process PYTHONPATH tới runtime isolated; NLP_MODEL_DIR tới modeldir. Không .env/secrets. Chạy `python -B -m evaluation.inference_check --output NEW_EVIDENCE_PATH` từ ai-service. Script chỉ ghi output nếu inference thật, outputexclusive.
4. Khởi động service local sau resourcecheck: `python -B -m uvicorn main:app --host 127.0.0.1 --port 8003 --no-access-log`; encode lần đầu loadlocal, noautodownload.
5. Chạy dataset evaluator chỉ khi có labeledconsenteddata, ghi metrics thực và giới hạn mẫu. Không tuyên bố PASS fullPHASE4 nếu SBERT smoke hoặc benchmark chưa chạy.

Đọc [TEST_RESULTS](TEST_RESULTS.md), [tiến độ](IMPLEMENTATION_PROGRESS.md), [matrix](FEATURE_ACCEPTANCE_MATRIX.md). DỪNG trướcPHASE5; production rollout và bật model còn điều kiện duyệt, không tự dùng API trả phí hoặc dịch vụ ngoài.


## Bằng chứng kiểm thử cuối đợt

89/89Backend (có timeout thật15s),16/16Python,46/46browserPHASE3–4,39/39browserPHASE2,build/lintPASS. Đây không bao gồm modelinference/metricsquality. BenchmarkTF-IDF5request synthetic: meanwall5.35ms, meanNLP1.52ms; không modelbenchmark hoặc loadtest. ProcessNLPbaseline đo WorkingSet156.954.624bytes, PeakWorkingSet157.069.312bytes (khoảng150MiB), không RAMcủaSBERT. [Runtime](../contracts/node_modules/.cache/phase4-20261031/runtime-final.json), [processmemory](../contracts/node_modules/.cache/phase4-20261031/nlp-process-resource.json), [integrity](../contracts/node_modules/.cache/phase4-20261031/integrity-final.json).

# PHASE 4 — Kế hoạch triển khai và giới hạn nghiệm thu

Ngày31/10/2026. Người dùng đã nghiệm thu PHASE3 và phê duyệt PHASE4. Giữ TF-IDF baseline, API cũ và dữ liệu gốc/demo. Snapshot/hash nguồn trước sửa ở ignored contracts/node_modules/.cache/phase4-20261031.

## Điều kiện máy và mô hình

Windows11, Ryzen7 5800H8core/16thread, RAM7,39GiB; chỉ khoảng330MiB available lúc kiểm tra. AMD RX5500M không phải CUDA. Disk D còn khoảng173GiB. Chưa torch/transformers/sentence-transformers/onnxruntime. Không tải PyTorch/CUDA hoặc toàn bộ model repository. Đã hỏi người dùng phê duyệt ONNX int8 và runtime cô lập; phải chờ trả lời và kiểm RAM đạt trước tải/inference.

Ứng viên: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2, multilingual BERT encoder/Sentence-BERT384dimensions, Apache2.0; multilingual phù hợp hơn all-MiniLM-L6-v2 English-only hiện hardcode. Chọn bản quantized ONNX khoảng118MB, tokenizer riêng; pin commit và SHA256 sau kiểm metadata chính thức. Không khẳng định chất lượng CV/JD Việt khi chưa benchmark có nhãn. Nguồn: https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 và https://sbert.net/docs/sentence_transformer/usage/efficiency.html.

## Nhóm file và tác động trước sửa

| Nhóm | File | Tác động |
| --- | --- | --- |
| AI engine/pipeline | ai-service/nlp/{engine,schemas,metrics,risk,api}.py, main.py | Local-only ONNX, bounded token chunks/batch/cache, cosine ranking, explicit TF-IDF; giữ match/analyze-report legacy contract, bỏ implicit model network download |
| Evaluation | ai-service/evaluation/*, ai-service/tests/* | Human labels/provenance/group split validation; P@K/R@K/MAP/NDCG; chưa nhãn thì kết quả quality null, không tự gán nhãn nghiệm thu |
| Backend | services/nlpClient.js, core/ai.js, core/index.js | Read-only inference explicit POST, lấy own CV/JD/application/report theo quyền; loopback AI, timeout/error, không ghi DB/schema |
| Frontend | business/AiPage.jsx, CoreBusinessView.jsx, AppShell.jsx | Matching/ranking/risk UI thực; chỉ bấm mới inference, states/engine/limits rõ; không dữ liệu mẫu/auto-write |
| Tests/docs | server/test/core-ai.test.js, client/test/phase4-browser.cjs, docs4tài liệu | Regression1–3, negative/auth/zero-write, browser; lưu evidence/model/resource/metric provenance |
| Hướng dẫn chạy | README.md (chỉ đoạn AI) | Bỏ hướng dẫn bật auto-download qua AI_ENGINE, trỏ tài liệu AI và trạng thái thực tế |

## Rủi ro và dữ liệu đánh giá

Chưa tìm được tập CV/JD hay report có nhãn chuyên gia trong repository; đã hỏi người dùng. Không được tự gán nhãn để làm đẹp kết quả. Có thể unit-test công thức bằng số nhỏ có kết quả tính tay, nhưng không báo là model benchmark. Classifier risk chưa có nhãn/huấn luyện/hiệu chuẩn: báo NOT TRAINED, confidence null; rules dùng task/deadline/hours/report phải tách riêng. Semantic report relevance không phải risk classifier và không điểm học thuật tự động/kỷ luật.

Chỉ API local; không đưa CV cá nhân ra HuggingFace/inference API. Model artifacts public tải một chiều, inference offline; không secrets/.env/production migration. Không thay dữ liệu gốc/demo, không seed/drop/delete, không commit/push; dừng trước PHASE5.


## Kết quả đợt triển khai và file thực tế

Baseline/API/UI vàregression đã chạy;89Backend/16Python/46browserCore+AI/39browserPHASE2/build/lintPASS. BERTinference vàmetricsclassifier CHƯA nghiệmthu: đangchờphêduyệt isolatedruntime/model vànhãnđộc lập; RAM chưa bảo đảm. Không cài/tải model, không đổi DBschema/index, không chuyểnPHASE5. Cácfileđổi/thêm so snapshotPHASE4:

- [README.md](../README.md)
- [ai-service/evaluation/README.md](../ai-service/evaluation/README.md)
- [ai-service/evaluation/download_model.py](../ai-service/evaluation/download_model.py)
- [ai-service/evaluation/evaluate.py](../ai-service/evaluation/evaluate.py)
- [ai-service/evaluation/inference_check.py](../ai-service/evaluation/inference_check.py)
- [ai-service/main.py](../ai-service/main.py)
- [ai-service/nlp/__init__.py](../ai-service/nlp/__init__.py)
- [ai-service/nlp/api.py](../ai-service/nlp/api.py)
- [ai-service/nlp/engine.py](../ai-service/nlp/engine.py)
- [ai-service/nlp/metrics.py](../ai-service/nlp/metrics.py)
- [ai-service/nlp/risk.py](../ai-service/nlp/risk.py)
- [ai-service/nlp/schemas.py](../ai-service/nlp/schemas.py)
- [ai-service/requirements-nlp.txt](../ai-service/requirements-nlp.txt)
- [ai-service/tests/test_nlp.py](../ai-service/tests/test_nlp.py)
- [client/src/components/AppShell.jsx](../client/src/components/AppShell.jsx)
- [client/src/components/business/AiPage.jsx](../client/src/components/business/AiPage.jsx)
- [client/src/components/business/CoreBusinessView.jsx](../client/src/components/business/CoreBusinessView.jsx)
- [client/test/phase3-browser.cjs](../client/test/phase3-browser.cjs)
- [client/test/phase4-browser.cjs](../client/test/phase4-browser.cjs)
- [docs/AI_IMPLEMENTATION.md](../docs/AI_IMPLEMENTATION.md)
- [docs/ARCHITECTURE_UPDATED.md](../docs/ARCHITECTURE_UPDATED.md)
- [docs/FEATURE_ACCEPTANCE_MATRIX.md](../docs/FEATURE_ACCEPTANCE_MATRIX.md)
- [docs/IMPLEMENTATION_PROGRESS.md](../docs/IMPLEMENTATION_PROGRESS.md)
- [docs/PHASE4_IMPLEMENTATION_PLAN.md](../docs/PHASE4_IMPLEMENTATION_PLAN.md)
- [docs/TEST_RESULTS.md](../docs/TEST_RESULTS.md)
- [server/src/core/ai.js](../server/src/core/ai.js)
- [server/src/core/index.js](../server/src/core/index.js)
- [server/src/services/nlpClient.js](../server/src/services/nlpClient.js)
- [server/test/core-ai.test.js](../server/test/core-ai.test.js)


## Sau phê duyệt ONNX

Đã cài runtime/hash-locked và tải2artifactmodel, chưa inference vìRAM~737MiB<1GiB. Người dùng xácnhận chưanhãn; metricsnull. Bổ sungfile: [requirements-nlp-lock.txt](../ai-service/requirements-nlp-lock.txt), [AI_RUNTIME_INSTALL_RESULT.md](AI_RUNTIME_INSTALL_RESULT.md); sửa download_model.py thêmguard tài nguyênstreaming, không hạloadguard. Xem báo cáo mới, không dùng trạngthái “chờphêduyệt” cũ.


## Lần tiếp tục: inference/API/UI thật

Đã sửa6filecode/test và thêmtest_model_inference.py: engine.py specialtemplate/truncation; test_nlp negativefixture; core-ai.test positiveSBERT; AiPage statusGETrefresh; browserHarness injectednegativefault; phase4-browser positiveSBERT. Không đổiAPI/schema/authcontract. 22Python/92Backend/51Corebrowser/39P2browser/build/lintPASS; fullquality/risk vẫn thiếu nhãn. [Báo cáo mới và phạm vi file](AI_RUNTIME_INFERENCE_RESULT.md). Khôngphase5.

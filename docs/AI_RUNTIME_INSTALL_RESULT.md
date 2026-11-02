# Cập nhật sau cài đặt — inference đã thành công

Ngày31/10/2026. Saukhitáikhởiđộng đúngdịchvụđồán và đạtRAMguard, model đã thựcchạyCPU; lỗiTokenizer đầu tiên đã sửa bằngtemplatecủaartifactthật. **Không còn BLOCKED vìRAM trong phépkiểm hiện tại**, dù capacitymáy8GiB vẫn cần theo dõi. Không tải/cài thêm.

Embedding3×384,22Python/92Backend/51Corebrowser/39P2browser/build/lintPASS. Chưa nhãn nênqualitymetrics/riskclassifier vẫn chưa nghiệmthu. [Chi tiết mới nhất](AI_RUNTIME_INFERENCE_RESULT.md). Kết quả503thiếuRAM và hướngdẫnwaiting bên dưới được giữ làm lịch sử cài đặt, không mô tả runtimehiện tại.

---

## Lịch sử trước lần inference thành công — giữ để đối chiếu

# PHASE 4 — Runtime/model cô lập sau phê duyệt

Ngày31/10/2026, Asia/Bangkok. Người dùng đã phê duyệt **ONNX int8 cô lập** và xác nhận **chưa có dữ liệu gán nhãn**. Không cần xin lại quyền cài/tải đúng model đã duyệt. **Chưa hoàn tất inference/quality nghiệm thu: RAM chưa đủ.**

## Đã thực hiện

- Cài binary-only vào `contracts/node_modules/.cache/phase4-20261031/python-deps`, hash-locked từ PyPI: ONNX Runtime1.31.1, tokenizers0.23.3, flatbuffers25.12.19, protobuf7.36.2. Tổng wheel tải khoảng17,4MiB; không torch/CUDA/Sentence-Transformers hoặc dependency lớn khác.
- Giữ base Python3.13.5/NumPy2.2.6/packaging25.0/huggingface-hub1.2.1. Không cài/đổi Python global hoặc ai-service/venv. Kiểm global find_spec cho ONNX/tokenizers/flatbuffers vẫnfalse; import qua processPYTHONPATH đúng isolatedpath thành công. CPUExecutionProvider có sẵn, chưa chứng minh graphmodelinference.
- Tải đúng2artifact đã duyệt từ official sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 commit`e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, tổng127.493.916bytes (~121,59MiB), vào ignored `.../phase4-20261031/model`. Cảsize/hash khớp. Không tải toànrepo/PyTorch/FP32 hoặc modelthứhai.
- ModelSHA256 `783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672`; tokenizerSHA256 `2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8`. Kiểm bằng streamingfile_digest saudownload, không chỉ tinmanifest.
- Restart đúng serviceNLP TEST8003 sở hữu, bind127.0.0.1, processenvPYTHONPATH/NLP_MODEL_DIR; không tạo.env hoặc Windowsuservar. BackendTEST57404/Frontend5175 vẫn giữ. Không restartgốc/demo5000/5001/AI8001, không sửadatabase hoặc bật serviceWindows.

## Tài nguyên và kết quả gọi thật

Phân biệt ba thao tác: càiwheel cần>=512MiB RAM/disk500MiB; streamingdownload1MiB/chunk cần>=256MiB RAM/disk500MiB; **nạpmodel vẫn>=1024MiB**, inference sauload>=256MiB. Tại thời điểm thực hiện từng bước đều kiểm guard tương ứng; không hạ ngưỡng1024MiB hoặc nạp weights khi RAMthiếu. Download lưu file không đồng nghĩa loadmodel.

Gọi POST/api/v1/nlp/rank bằng textsynthetic thật qua localhost8003 lúc **13:59:23 +07 ngày31/10/2026**:

- HTTP503, `INSUFFICIENT_MEMORY_REQUIRE_1024_MIB`.
- RAM available~736,84MiB, configured=true, ready=false, revisionloaded=null.
- Hashes đã xác minh; **chưa có embedding/cosine SBERT**, chưa chạy graph trênRyzen, không có latency/peakRAM củamodel để công bố.
- TF-IDFbaseline vẫn chạy, Backendhealth không phụ thuộc modelready. Không dùngTF-IDF giả làm kết quảBERT.

Đã hỏi người dùng tự đóng bớt ứng dụng/tab không cần thiết rồi báo để kiểm RAM lại; không tự đóng app người dùng hoặc xin lại quyền model. Cần ít nhất1GiB available (nên có dư địa hơn); guard quyết định theo sốđo thực khi load. Mô hình chỉ tự nạp ở explicitrequest sau khi đủRAM.

## Dữ liệu và kiểm thử

Người dùng xác nhận chưa có dataset gán nhãn. P@K/R@K/MAP/NDCG, so sánh qualityBERT–TF-IDF và metricsriskclassifier vẫnnull; classifier NOT_TRAINED. Các textsynthetic chỉsmoke/validation, không đánhgiá chất lượngtuyểndụng.

Python16/16PASS saucài runtime; nativeimportPASS; modeldownloadsize/hashPASS; APIguard thiếuRAMPASS (đây là negativecase, **không modelinferencePASS**). Backend89/browser46+39/build/lint là bằngchứng đợttrước, không tuyên bố đã chạylại toànbộ sautải runtime vì không đổiAPI/UI/schema. Chưa chạy browserSBERT thật.

BaDB gốc/demo snapshot07:00:35UTC31/10 đối chiếu hash/index với đầuPHASE4 không đổi: root3docs/demo223/foundation66, mỗiDB14collections/36indexes. Không seed/migration/drop/delete/deploy/commit/push/merge/reset/clean.

## Bằng chứng và lệnh

- [Lockfile source](../ai-service/requirements-nlp-lock.txt), [metadata preflight](../contracts/node_modules/.cache/phase4-20261031/runtime-install-preflight.json), [installlog](../contracts/node_modules/.cache/phase4-20261031/runtime-install.log), [pipreport](../contracts/node_modules/.cache/phase4-20261031/runtime-install-report.json).
- [Nativeimport](../contracts/node_modules/.cache/phase4-20261031/runtime-import-check.json), [modelmanifest](../contracts/node_modules/.cache/phase4-20261031/model/manifest.json), [downloadlog](../contracts/node_modules/.cache/phase4-20261031/model-download.log).
- [Lần gọiSBERT/guardRAM](../contracts/node_modules/.cache/phase4-20261031/model-inference-attempt.json), [Python16tests](../contracts/node_modules/.cache/phase4-20261031/python-tests-runtime-installed.log), [snapshotDBsau](../contracts/node_modules/.cache/phase4-20261031/protected-after-model-install.json).

Cài thực tế dùng `python -B -m pip --isolated --disable-pip-version-check install --index-url https://pypi.org/simple --target ISOLATED_TARGET --no-deps --no-cache-dir --only-binary=:all: --require-hashes --report REPORT -r HASH_LOCK`; không `pip install` global. Bảnrequirements-nlp-lock choWindowsCP313; không khẳng địnhwheelhash chạy mọiOS.

Khi RAMđạt, không tải lại model: giữprocessenv đã cấu hình và gọi explicitSBERT hoặc chạy `python -B -m evaluation.inference_check --output NEW_EVIDENCE_PATH` trongai-service vớiisolatedPYTHONPATH/NLP_MODEL_DIR. Outputexclusive chỉ ghi khi inference thật; không ghiđè evidencecũ. Sau đó kiểm API/UI/batch/longtext/latency/peakRAM thực và cập nhật nghiệmthu. **Dừng trướcPHASE5.**

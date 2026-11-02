# PHASE 4 — Kết quả inference SBERT thật và tích hợp TEST

Ngày31/10/2026 (+07). **Sentence-BERT đã chạy thật trên CPU và API/UI đã được kiểm thử. Chưa nghiệm thu chất lượng ranking hoặc trained risk classifier vì người dùng xác nhận chưa có dữ liệu gán nhãn độc lập.** Không đánh dấu toàn bộ hai chức năng AI của đề cương DONE; dừng trước PHASE5.

## Mô hình thực sự sử dụng

`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, commit `e8f8c211226b894fcb81acc59f3b34ba3efd5f42`, ONNX int8 official artifact `model_qint8_avx512.onnx`, license Apache2.0; CPUExecutionProvider trên Ryzen7 5800H, Python3.13.5, ONNX Runtime1.31.1, tokenizers0.23.3. Đúng model/tokenizer đã được người dùng phê duyệt; không cài thêm dependency hoặc tải model khác trong lượt tiếp tục này. Hash/size pin ở [báo cáo cài đặt trước](AI_RUNTIME_INSTALL_RESULT.md).

Đã thực chạy graph trên CPU này, không còn chỉ suy đoán tương thích từ tên artifact. Inference offline; `network_inference=false`, không gửi CV/báo cáo cá nhân tới dịch vụ ngoài. Legacy API vẫn TF-IDF, API NLP versioned chọnengine explicit; không gắn nhãn BERT cho baseline.

## Lỗi được phát hiện và sửa bằng inference thật

Lần inference đầu sau khi đủRAM load được graph nhưng lỗi `UNEXPECTED_TOKENIZER`: code giả định [CLS]/[SEP], tokenizer artifact thực dùng template `<s>`/`</s>` (ids0/2). Filetokenizer còn lưu truncation128; nếu giữ nguyên thì text bị cắt trước lúc đếm token/chunk.

`ai-service/nlp/engine.py` nay tắt implicit truncation/padding, đọc cặp specialtoken từ `encode('',add_special_tokens=True)`, không hardcode tên token. Giữ chunk126content+2special=128, tối đa8chunk, trả total/used/truncated thật. Test model thật xác nhận text dài có total_tokens>1008, used1008, chunks8. Không sửa tokenizer/model đã pin hoặc hạ RAMguard.

`AiPage.jsx` làm mới status chỉ đọc sau mỗi action success/error, tránh trạng thái “chưa nạp” còn hiển thị sau khi lazyload đã thành công. Không thêm autowrite. Test âm tính absentmodel dùng fixture explicit, không conditional test rỗng bị tínhPASS; trường hợp modelready được kiểm bằng positiveAPI/UI riêng.

## Kiểm thử thực tế

| Nhóm | Kết quả cuối | Evidence |
| --- | --- | --- |
| Python unit/API/model | **22/22PASS**, fail0/skip0 | [Log](../contracts/node_modules/.cache/phase4-inference-20261031/python-model-tests.log) |
| Model trực tiếp | Embedding3×384 thật, finite/L2;6modeltests thực chạy | [Smoke JSON](../contracts/node_modules/.cache/phase4-inference-20261031/sbert-smoke.json) |
| NLPHTTP | Rankingmultilingual,50candidate, longtext, reportsemantic và negative422 | [HTTP results](../contracts/node_modules/.cache/phase4-inference-20261031/http-sbert-results.json) |
| Backend regressionPHASE1–4 | **92/92PASS**, fail0/skip0;65,62s | [Log](../contracts/node_modules/.cache/phase4-inference-20261031/backend-real-model.log) |
| BrowserPHASE3–4 | **51/51PASS**, uncaught0/externalblocked0 | [JSON](../contracts/node_modules/.cache/phase4-inference-20261031/browser-results.json), [log](../contracts/node_modules/.cache/phase4-inference-20261031/browser-real-model.log) |
| BrowserPHASE2 | **39/39PASS**, coreOFF, assertions không đổi | [Log](../contracts/node_modules/.cache/phase4-inference-20261031/compat/browser.log) |
| Frontend build/lint | PASS; lint0error0warning | [Build cuối](../contracts/node_modules/.cache/phase4-inference-20261031/build-final.log), [lint](../contracts/node_modules/.cache/phase4-inference-20261031/lint-final.log) |
| Phạm vi/Git/syntax/bundlepattern | Kiểm thực, xem chi tiết | [Integrity](../contracts/node_modules/.cache/phase4-inference-20261031/integrity-final.json), [Gitstatus](../contracts/node_modules/.cache/phase4-inference-20261031/git-final.txt) |

22Python=16unit/negative/metrics/rules+6inference thực, bật `NLP_INFERENCE_TESTS=true`; không skip. Các test gồm specialtemplate/thật, chunk/truncation, multilingualrelated/unrelated synthetic, cosine/tie/TopK/revision, reportsemantic khácclassifier và cachevectorhash. Mocks chỉ dùng cho negative memory/unconfigured conditions, không giả model success.

92Backend=89case trước +3positiveSBERT (ownCV, companyApplicationSnapshot, scopedreport). Mọi testghi dùng fresh exact-allowlistedTESTDB, snapshotSHA256collection nghiệp vụ không đổi quanh POSTanalysis. Role/ownership/disabled/validation/QR/race/runtime/timeout regressions giữ. Có serverlocal thực imlặng15s để chứng minh timeout nhưnghealth khôngblock.

51Browser=36regressionPHASE3 +10baseline/error/read-onlyPHASE4 +5SBERTpositive. Studentmatch/companyranking và company/mentor/adminreport đều qua form/click/API/native inference thật, modelrevision xác minh. Kiểm responsive320/768/1440, navigation/rules/classifierlabel, fingerprintzero-write. Case lỗi mạng dùng CDP **cố ý chặn transport** rồi retry API thật; đây là negative network injection công khai, không modelmock. Classifier luôn NOT_TRAINED/confidencenull, không chấm/kỷluật tự động.

Screenshots: [studentSBERT](../contracts/node_modules/.cache/phase4-inference-20261031/student-sbert-ranking.png), [companySBERT](../contracts/node_modules/.cache/phase4-inference-20261031/company-sbert-ranking.png), [mentorreport](../contracts/node_modules/.cache/phase4-inference-20261031/mentor-sbert-report.png), [adminreport](../contracts/node_modules/.cache/phase4-inference-20261031/admin-sbert-report.png). Tài khoản/ví/text là syntheticTEST, kýnonce/JWT thật; không ví/privatekey/funds thật, không transactionchain. Fixtures/database cũ được giữ, không drop/cleanup.

## Hiệu năng và tài nguyên — smoke nhỏ

| Phép đo | Kết quả | Giới hạn |
| --- | --- | --- |
| CLI coldload | 1424.12ms | Một lần, Windowscache/máy thực, khôngp95 |
| Encode3câu thực | 27.59ms |3×384, textsyntheticngắn |
| HTTP coldrequest | 1675.71ms | Bao gồm load+hash+tokenization+inference |
| HTTP longtext | 211.51ms | Chỉ xét8chunk, cócảnhbáo truncation |
| HTTP50candidate | 171.18ms |50textngắn, TopK5, khôngthroughputbenchmark |
| HTTP reportsemantic | 27.82ms | Không trainedriskprediction |
| HTTP5lần lặp đã cache | mean3.20ms/max4.09ms | **Cachehits**, không latency5lần chạygraph |
| NLPprocessRSS/peakWorkingSet | 552.97/634.64MiB | Bao gồm Python/sklearn/runtime/model, không chỉ weights |

Máy7,39GiB RAM; đạt ngưỡng khi load, guardload1024MiB/inference256MiB giữ nguyên. Khi đồng thời browser vàservice, có lúc còn494MiB, nên chạy browser tuần tự/đóngheadless sau test; không nhân đôiNLPmodel/AI8002. Không tự đóng appngườidùng, không thay Windowsstartup/service trong lượtđồán này. Đây không productionload/p95/RSSmọitìnhhuống. CacheTTL600s/128entry chỉ memoryembeddinghash, không rawCVdisk.

Build cuối538ms; entry292,74kB/gzip88,73kB; CoreBusinesslazy49,04kB/gzip12,28kB; ethers379,90kBlazy. Build trung gian khi chạy regression song song có warning PLUGIN_TIMINGS/callbacktiming, vẫn build thànhcông; giữ [log trung gian](../contracts/node_modules/.cache/phase4-inference-20261031/build.log). Build/lint cuối chạy khiidle khôngwarning này. Không nấp lỗi thànhPASS hoặc xóaFAILlog.

## Dữ liệu đánh giá và so sánh baseline

**Sốquery/pair nhãn độc lập được cung cấp:0** (người dùng đã xác nhận). Precision@K/Recall@K/MAP/NDCG, riskF1/calibration đều **null/NOT EVALUATED**. Chưa có benchmark chứng minh BERT tốt hơn TF-IDF trên CV/JD Việt hoặc riskmodel tổng quát hóa.

[Diagnostic cùngpoolsynthetic](../contracts/node_modules/.cache/phase4-inference-20261031/unlabeled-comparison.json): TF-IDFcosine(web3=0,074505; finance=0,033475), SBERT(web3=0,650674; finance=0,205765). Đây là output thật trên2candidate **không nhãn nghiệmthu**, không tỷ lệ chínhxác, không xác suất và không được so trực tiếp độlớn hai thangscore để tuyên bố “tốt hơn”. Không tínhP@K/MAP từ fixtures tựviết. Khác cache/coldpath cũng không cho kết luận latencyengine nào tốt hơn từ một lần này.

Evaluator/công thức/leakage/provenanceguards đãunit-test; cần nhãnchuyên gia cóconsent, split theo người/company/template/time, adjudication và heldoutkhóa trước tuning để hoàn tất đánhgiá. Riskclassifier chưa huấn luyện/hiệu chuẩn; reportSBERT relevance **không phải classifier rủi ro**. Rules taskdeadline/hours/reportversions cósource/observed riêng và chỉ đề nghị người hướng dẫn xem xét.

## Runtime review và dữ liệu bảo toàn

- Frontend **http://127.0.0.1:5175/** → BackendTEST **57404** PID17260 → DB `web3_internship_test_phase1_4b56d228_e8c3ff13704a`; NLP **8003** PID5092, SBERTready/revisionđúng; Mongo27017loopback. `/health`, `/ready`, capabilities và NLPstatus200.
- Sau reboot các service gốc5000/demo5001/AI8001/8002 đã không chạy; chỉ khôi phục Mongo đúng datadir đã duyệt và bộTEST mới. Legacy matching/report trong TEST dùng APIlegacyTF-IDF của8003; không bật lại các server cũ hoặc dịch vụWindows.
- Testcompat5176/57403 và cảEdgeheadless9225/9226 đã đóng sauPASS. Giữ primaryTEST cần thiết; không để trình duyệtdebug tồn tại chiếmRAM.
- Gốc`web3_internship`:14collections/36indexes/3docs; demo2340:14/36/223; foundation:14/36/66. Hashnội dung và toàn bộindexarray không đổi từ `2026-10-31T12:38:18.654Z` đến `2026-10-31T12:48:52.164Z`, và so vớiđầuPHASE4. [Trước](../contracts/node_modules/.cache/phase4-inference-20261031/protected-before.json), [sau](../contracts/node_modules/.cache/phase4-inference-20261031/protected-after.json).
- Không đổiDBschema/index source trong đợt này, không seed/migration/drop/delete/backfill/deploy/secrets/.env/dependencyupgrade. Chỉ dữ liệuTESTđượcwritebằngfixture/API cóýthức, không sửa root/demo.

## File sửa và giới hạn nghiệm thu

Source/test: ai-service/nlp/engine.py, tests/test_nlp.py, tests/test_model_inference.py(mới); server/test/core-ai.test.js; client/src/components/business/AiPage.jsx; client/test/browserHarness.cjs vàphase4-browser.cjs. READMEAIparagraph và docsprogress/test/matrix/architecture/AI/masterplan được cập nhật. Danh sách chính xác cuối ởintegrityfinal; gitdiff chứa cảphasecũ, không gán toàn bộ cho đợt này.

Branchbranch_1/HEADd11a1852c5f03963bbe260425a246b0e65fe1091 không đổi, không staged/commit/push/merge/reset/clean. Mọi filebaseline/untracked, venvtracked/ZIP/DOCX/audit gốc được bảo toàn. Ignoredstaging/evidence không thay sourcegốc.

**Sẵn sàng nghiệmthu kỹthuật SBERTlocal/API/UI, chưa fullnghiệmthuquality/risk.** Còn thiếu nhãnđộc lập, training/calibration/heldoutrisk, manualUAT/production/load/securityđầyđủ. Không tự sinh nhãn để làm đẹp metrics. Cần người dùng đánhgiá kếtquả và chốt dữliệu/nhãn trước phần cònthiếu; không tự chuyểnPHASE5.


## Danh sách file cuối đợt tiếp tục

So với snapshot trước lần tiếp tục PHASE4, không phải toàn bộ gitdiff từHEAD:

- [README.md](../README.md)
- [ai-service/nlp/engine.py](../ai-service/nlp/engine.py)
- [ai-service/tests/test_model_inference.py](../ai-service/tests/test_model_inference.py)
- [ai-service/tests/test_nlp.py](../ai-service/tests/test_nlp.py)
- [client/src/components/business/AiPage.jsx](../client/src/components/business/AiPage.jsx)
- [client/test/browserHarness.cjs](../client/test/browserHarness.cjs)
- [client/test/phase4-browser.cjs](../client/test/phase4-browser.cjs)
- [docs/AI_IMPLEMENTATION.md](../docs/AI_IMPLEMENTATION.md)
- [docs/AI_RUNTIME_INFERENCE_RESULT.md](../docs/AI_RUNTIME_INFERENCE_RESULT.md)
- [docs/AI_RUNTIME_INSTALL_RESULT.md](../docs/AI_RUNTIME_INSTALL_RESULT.md)
- [docs/ARCHITECTURE_UPDATED.md](../docs/ARCHITECTURE_UPDATED.md)
- [docs/FEATURE_ACCEPTANCE_MATRIX.md](../docs/FEATURE_ACCEPTANCE_MATRIX.md)
- [docs/IMPLEMENTATION_MASTER_PLAN.md](../docs/IMPLEMENTATION_MASTER_PLAN.md)
- [docs/IMPLEMENTATION_PROGRESS.md](../docs/IMPLEMENTATION_PROGRESS.md)
- [docs/PHASE4_IMPLEMENTATION_PLAN.md](../docs/PHASE4_IMPLEMENTATION_PLAN.md)
- [docs/TEST_RESULTS.md](../docs/TEST_RESULTS.md)
- [server/test/core-ai.test.js](../server/test/core-ai.test.js)

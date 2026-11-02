# Cập nhật sau ba bản vá dependency

Frontend build/lint sau npm ci PASS; entry và các lazy chunks giữ quy mô trước vá. E2E70/70 và đo latency API/AI mới được lưu ở ignored phase6-patch-20261031/performance-browser.json. Không dùng đợt này để khẳng định speedup; số liệu index/RAM dưới đây thuộc lần đo PHASE6 trước patch, vẫn giữ provenance. Không rerun cold model vì RAM, không giảm guard. [Kết quả bản vá](DEPENDENCY_PATCH_RESULT.md).

## Số đo trước bản vá dependency

# PHASE6 — Performance report

Ngày31/10/2026 (+07). Số đo thật trên Windows/local loopback/TEST tổng hợp, không benchmark production. Không tạo KPI/metrics giả. Thay đổi đã thực hiện:3tenant indexes của Assignment, không rewrite/cache/sửaAI/model hoặc tăngRAMguard.

## MongoDB — trước/sau tối ưu

Hai database TEST mới, mỗi DB1000Assignment fixture rõ làsynthetic, cùng phân bố1student/20company/10mentor matched. Truy vấn wallet equality +sortcreatedAt,20lần/group; query-before/after.json cówinningPlan/executionStats và rawtimings. Đây là queryprobe, không phải toàn bộ join/dashboard API hoặc production dataset. Index tự tạo chỉTEST; không dropindex hoặc sửaDBgốc/demo.

| Field |Docs examined trước→sau|Kết quả|P50ms trước→sau|
| --- | --- | --- | --- |
|studentWallet|1000→1|1|1.411→0.855|
|companyWallet|1000→20|20|2.010→1.126|
|mentorWallet|1000→10|10|1.300→0.741|

Đã thêm `{studentWallet:1,createdAt:-1}`, `{companyWallet:1,createdAt:-1}`, `{mentorWallet:1,createdAt:-1}` trong server/src/models/Assignment.js. Sauquery usesIXSCAN/FETCH, examined keys bằng số kết quả. Điểm chứng minh mạnh là giảm scan, không ngoại suy speedup từ vài ms với cache/máy nền khác thời điểm. Mỗi index thêm chi phí ghi/đĩa; gốc/demo autoIndex=false, rollout cần review riêng. Không thêm text index hoặc pagination/hardcodeddata để làm số đo đẹp.

## API latency

10GET sequential mỗi role/endpoint, warm local E2E dataset nhỏ, clientperformance.now bao gồmHTTP+parse; so snapshot bảo đảm khôngwrite. P95nearest-rank với10mẫu chính là gầnmax, chưa đủước lượngSLA/concurrency. Raw performance-browser.json.

|Role|Endpoint|N|P50ms|P95ms|
| --- | --- | --- | --- | --- |
|student|/core/dashboard|10|7.55|9.87|
|student|/core/placements|10|5.19|5.92|
|student|/core/time/totals|10|3.78|4.75|
|company|/core/dashboard|10|7.51|8.14|
|company|/core/placements|10|6.42|7.14|
|company|/core/time/totals|10|4.80|5.39|
|mentor|/core/dashboard|10|6.86|13.26|
|mentor|/core/placements|10|5.48|9.93|
|mentor|/core/time/totals|10|3.68|4.78|
|admin|/core/dashboard|10|10.64|13.09|
|admin|/core/placements|10|5.89|6.14|
|admin|/core/time/totals|10|4.55|5.54|

Không loadtest nhiều người, không chứng minh latencyởInternet hoặc dữliệu lớn. Dashboard vẫn tính theo scope thật, không thay dữ liệu bằngcache/mock.

## AI inference

Model `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, revision e8f8c211226b894fcb81acc59f3b34ba3efd5f42, ONNXCPUint8 đã hashverify từPHASE4. DirectAI endpoint,10candidate/n=5group/engine, cùngpayload được lặp lại; cache-miss dùngtextsynthetic mới. Cold ở đây là **embeddingcachemiss**, model vẫn hot; không phải thời gianloadmodel.

|Engine|MissP50ms|MissP95ms|RepeatP50ms|RepeatP95ms|
| --- | --- | --- | --- | --- |
|tfidf|7.29|13.99|7.88|8.47|
|sbert|120.22|198.13|4.81|6.26|

TF-IDF không dùngembeddingcache; repeat là lần gọi lại, khôngclaimcacheaccelerated. Backend companyrank cũng đo5mẫu mỗiengine trong performance-browser.json với nhỏcandidatepool E2E; không so sánhchất lượngranking từlatency. Labels/P@K/Recall/MAP/NDCG/riskconfidence vẫnthiếu. Không gửi CV ngoài máy. Model6cold tests chưa rerun vìRAM<1024MiB; giữmodelhot, khôngstophayduplicate/hạguard.

## Bundle và render

Build PASS client/dist/phase6-accepted. Đơn vịkB=1000bytes, gzip tính từartifact thật. Main entry giữkhoảng284,69kB; không thêmdependency frontend trongPHASE6.

|Chunk lớn|kB|gzipkB|
| --- | --- | --- |
|NativeQrScanner-6Uq8AQmK.js|436.67|113.02|
|lib.esm-DXGi7BZN.js|379.90|140.07|
|index-BGdulfhM.js|284.69|85.10|
|CoreBusinessView-B4ohdZ1B.js|49.67|12.38|
|QrCode-Dk9_6SuZ.js|24.24|9.20|
|AttendanceView-XzLiNR2F.js|16.53|4.56|
|CvJdView-BMFJ6Nx6.js|14.55|4.38|

Web3/QRdecoder/encoder vàethers tải lazy; scanner khoảng436,66kB, chưa cóchunk>500kB. PHASE6chỉ thêmtestfrontend, không thayproductionUIcode. Responsive/navigation/no-auto-write cóbrowserregression; **React component profiling/Lighthouse/FCP/LCP/CLS/longtask benchmark NOT TESTED**. Không công bốrenderperformancePASS dựa trênbundle/build. Server pagination đã có, không thêmmemoization vôcăn cứ.

## Bộ nhớ

12mẫu Windows cách~5giây trongE2E, chỉserviceđãxácđịnh vàEdgeheadlessTEST; rawresources.json. Đây là sampledmax, không phải peaklifetime/heapleakaudit. PrivateBytes khácWorkingSet, Windowscópageout; không diễn giảiresidentNLP thấp là modelchỉcần30MiB.

|Service|MaxWorkingSetMiB|MaxPrivateMiB|
| --- | --- | --- |
|MongoDB|214.8|436.8|
|NLP|30.1|608.9|
|Hardhat|45.5|161.2|
|BackendTEST|109.6|141.2|
|ViteTEST|98.0|184.6|

EdgeheadlessTEST sampledmaxWorkingSet khoảng1765.7MiB; RAMavailablemin675.1MiB trên máy~7,39GiB. Đã đóngEdge/helper tạm, không dừngứngdụngngười dùng. Guard sauđó~691.3MiB<1024 cho coldload nên **BLOCKED6coldmodeltests**; API/UI dùnghotmodel thật vẫnPASS. Khôngnạp thêm model hoặcđổiWindowsstartup/service. Python -m unittest16unit PASS.

## Transaction và giới hạn

Localautomine receiptđượcxácnhận; cótest tắt automine tạm, pending5giây, minevàreconcile actualevent/receipt không duplicate. Hashes/block22–25/token6 trongverified-transactions.json. Không đoSLA hoặcfinalitytestnet/mainnet; không suy thời gianHardhatlocal sangnetworkthật. Khôngresetchain. IPFS latencyreal **BLOCKED**, không lấytransportmocktiming làmcloudbenchmark.

Build trung gian có thể chịu CPU/memorycácapp nền; loggiữnguyên. PowerShell.ps1sampling bịExecutionPolicychặn ởlầnđầu; đãlấy mẫu bằnglệnhPowerShelltrựctiếp, khôngđổiExecutionPolicy. Chỉ ưu tiênindex đãcó sốđothực; phầnperformanceNOTTESTED vẫnđượcnêu rõ.

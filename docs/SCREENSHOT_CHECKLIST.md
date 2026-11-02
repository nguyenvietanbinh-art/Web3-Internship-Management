# Danh sách ảnh và bằng chứng cần chụp

Ngày 01/11/2026 (+07). Chỉ ảnh từ UI thật; dữ liệuTESTphảiđượcchúthích. Không dùngimagegen/mockup/thaytextoverlay đểlàmbằng chứng. Không chụpprivatekey, vault/JWTAuthorization/Pinata/key. QRbearerchỉlưu ảnhkhiđã hết hạn, khôngchia sẻtokenlive. MỗiảnhghiURL/role/dataset/thời gian/phiên bản vàthao tác.

## Ảnh đã lưu thật

11 ảnhkhôngchỉnhsửanội dung, SHA256 vàsource trong[evidence-index.json](evidence/phase7-20261101/evidence-index.json). Ảnh 01 làloginP 7 vớidatasetmanualmới; ảnh 02–08 làE2EPHASE 6 sau patch, **không đổingàychụpthànhP 7**, không phảidữ liệucủa 4 actor manualmới. Token 9 đãđọcRPCtrongP 7, không mintcho 4 actorđó.

| File | Chú thích / mục đích | Thời điểm nguồn UTC | Link |
| --- | --- | --- | --- |
|01-student-login.png|PHASE 7 actual signature login, fresh manual TEST account; profile only|`2026-10-31T19:04:02.120494+00:00`|[ảnh](evidence/phase7-20261101/01-student-login.png)|
|01-company-login.png|PHASE 7 actual signature login, fresh manual TEST account; profile only|`2026-10-31T19:00:54.371979+00:00`|[ảnh](evidence/phase7-20261101/01-company-login.png)|
|01-mentor-login.png|PHASE 7 actual signature login, fresh manual TEST account; profile only|`2026-10-31T19:00:57.307791+00:00`|[ảnh](evidence/phase7-20261101/01-mentor-login.png)|
|01-admin-login.png|PHASE 7 actual signature login, fresh manual TEST account; profile only|`2026-10-31T19:01:00.254159+00:00`|[ảnh](evidence/phase7-20261101/01-admin-login.png)|
|02-cv-parser.png|PHASE 6-patch real PDF upload/parser in synthetic E2E dataset|`2026-10-31T16:22:22.080579+00:00`|[ảnh](evidence/phase7-20261101/02-cv-parser.png)|
|03-sbert-ranking.png|PHASE 6-patch actual local SBERT result, not quality benchmark|`2026-10-31T16:24:35.694759+00:00`|[ảnh](evidence/phase7-20261101/03-sbert-ranking.png)|
|04-report-nlp.png|PHASE 6-patch actual semantic analysis; NOT_TRAINED classifier remains visible|`2026-10-31T16:24:41.556877+00:00`|[ảnh](evidence/phase7-20261101/04-report-nlp.png)|
|05-time-mobile.png|PHASE 6-patch actual TEST hours; correction is explicit synthetic human review|`2026-10-31T16:23:48.900119+00:00`|[ảnh](evidence/phase7-20261101/05-time-mobile.png)|
|06-completed-placement.png|PHASE 6-patch actual business approval/completed placement|`2026-10-31T16:23:01.179348+00:00`|[ảnh](evidence/phase7-20261101/06-completed-placement.png)|
|07-verified-sbt.png|PHASE 6-patch real Hardhat SBT 9; not a certificate for new manual accounts|`2026-10-31T16:25:04.411343+00:00`|[ảnh](evidence/phase7-20261101/07-verified-sbt.png)|
|08-web3-dark.png|PHASE 6-patch actual Web3 UI in Dark Mode|`2026-10-31T16:24:55.796383+00:00`|[ảnh](evidence/phase7-20261101/08-web3-dark.png)|

## Checklist chụp khi bạn tự demo

| Bước / tên file gợi ý | Thao tác / trang | Kết quả cần thấy | Chú thích bắt buộc |
| --- | --- | --- | --- |
|A 01-role-login|sessionhelper/student/company/mentor/admin, Hồsơ|Tên/vai trò đúng, walletpublic|ChữkýAPI thật; không phảiMetaMaskpopupUAT |
|A 02-cv-file|CVđã lưu, uploadPDFTEST|Text/parser/hash/saved|FileTEST; khôngCVcánhân |
|A 03-jd-apply|CompanyJD; Studentapplication|JDopen/Applicationmộtlần|DữliệudoUIghiTEST |
|A 04-sbert-ranking|AIpage chọnSBERT, bấm phân tích|Engine/modelready/cosine/rank|Khôngmetricsqualityhoặcconfidence giả |
|A 05-assignment|Companypropose/adminapprove/active|Đúngstudent/company/mentor/kỳ|Khôngđềtàigốc/demo |
|A 06-task-log|Taskprogress/log/mentorreview|History/status/version|Đãlưu, không ảnhformchưaSubmit |
|A 07-qr-session|CompanyQR/expiry|ẢnhQRthật/action/TTL|Tokenđã hết hạn trước lưu/chia sẻ |
|A 08-gps-checkin|Studentcamera/GPS/redeem|WorkSession/nonceconsumed|Ghi rõhardwarethật haySensors/CDPfixture |
|A 09-hours|Checkout/companyapprove/totals|Minutespositive/nềnguồnproof|NếuđiềuchỉnhTESTphải ghiđúng, khôngnóigiờthực |
|A 10-report-review|Submit/version/reviews/approve|Currentreport/điểmcompanymentor|Điểmngười chấm, khôngAItựchấm |
|A 11-risk|AIreportanalyze|Semantic/rules/NOT_TRAINED|Chưa trainedriskclassifier/metrics |
|A 12-ipfs-blocked|Web3 IPFS|BLOCKED/vắngCID|Chưauploadreadback thật |
|A 13-ipfs-live (chưa có)|Sauphê duyệtcredentials+securekey|RealCID/cipherreadbackhashmatch|Chưa đượcchụp/claimnếu chưa chạy |
|A 14-tx-receipt|Anchorreport/hours/completion|TXhash/confirmed/local 31337|Khônglấyhashtextlàbằng chứngđủ, kèmRPCrecord |
|A 15-sbt|Adminmint, studentverify|TokenId/owner/contract/chain/locked/liveverified|SBTlocalthật, issuerattested, khôngmainnet |
|A 16-negative|Foreignaccess/unknowncert/expiredQR|403/404/400/409 phùhợp|KếtquảtừAPI thật, khôngtoastfake |
|A 17-ui|320/768/1440, Light/Dark|Nooverflow/nav/focus/errors|Deviceemulationkhácđiện thoạithật |
|A 18-dashboard|4 rolesTổngquan|Counts/hoursđúng scope/empty|Sođốicác bảng, khôngKPIhardcode |

Lưuảnhmớitênkhác, không ghi đèảnhcũđểcheFAIL; kèmHTTPstatus/TX/receipt/vault-excludedmetadata. BổsungảnhPinatalive/hardwareUAT sau khiđượcthực hiện, khôngtôlạibằng chứng hiệncó.

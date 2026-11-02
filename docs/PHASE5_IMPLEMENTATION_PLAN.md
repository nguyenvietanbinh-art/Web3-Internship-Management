# PHASE 5 — Local Web3 integration

Ngày31/10/2026. Người dùng nghiệmthu PHASE4 và phêduyệt PHASE5; qualityAI/risklabels cònthiếu được giữ đúng trạngthái, không tự nângDONE. Chỉ Hardhatlocal chain31337/127.0.0.1, TESTMongoexactallowlist, khôngmainnet/testnet/cloudtrảphí/privatekey/víthật, khônggốc/demo/commit/push.

## Baseline và quyết định trước sửa

Đọc docs/audit/AIevidence vàhai contracthiệncó. Platform theo singletonTopic, Registry theoassignmentnhưng chưaERC721/5192. Giữ cảhai, thêm canonical Assignment evidence/SBTcontract và additive/core/web3API. Hardhat2.29.1+Solidity0.8.24; projecttypeESM cầnlocalCJSconfig riêng, không sửa ABI/địa chỉlegacy.

RAM trống~860MiB sauPHASE4; tránh nhân đôiAI/RPC/browser. PinataJWT user/process/sourceconfigđều thiếu; không hỏisecrettrongchat/ghi.env. IPFSliveBLOCKED; testadaptertransportđược côngkhai mock, không coiCIDfixture làuploadthật. QRlibapprovalđãhỏi, chưa cài khi chưa được duyệt.

## Nhóm thay đổi / ảnh hưởng

| Nhóm | File dự kiến | Kiểm tra / tác động |
| --- | --- | --- |
| Solidity | contracts/contracts/InternshipEvidenceSBT.sol; hardhat.local.cjs; test-local/*.cjs; scripts/deploy-local.cjs | ERC165/721metadata/5192locked; writerrole; report/attendance/completioncommitments; opnonce/chốngreplay; issuertrustedoffchain; mintunique; không sửa contractlegacy |
| Chain adapter / persistence | server/src/models/Web3Models.js; services/localWeb3.js; core/web3.js; core/index.js | TEST-only/chain31337/loopbackguards, localunlockedHardhatattestor không realkey; persistedoperation/CAS/outbox, receipt+event+stateverify, reconcileexplicitPOST, GETkhôngsyncwrites |
| IPFS riêng tư | services/privateIpfs.js; core/web3.js; tests/private-ipfs.test.js | AES256GCM/masterkeyconfig; validate/rawfilebounded; plaintext+cipherhash; PinataCID thật/readbackmatch; thiếuconfig503; khôngpublicplaintext; khôngclaimlivekhiadaptermock |
| QR/GPS/corehours | services/qrGps.js; Web3Models QRsession; core/web3.js; WorkSessionoptionalproof | CompanyissueJWTnonce expiry/scope; studentexplicitredeem; GPSradius/accuracy/freshness; dùng WorkSession businesshours cũ; replay/idempotent vàrecoverpartialfailure; manualflowcũgiữ |
| UI | business/Web3Page.jsx/scanner; CoreBusinessView/AppShell; tests | Explicitpermissions/buttons, wallet/network/tx/IPFS/QR/GPS/certificate, noautowrite; claimsGPS khôngabsolutefraudproof; lazyQRlibs nếuduyệt |
| Evidence/docs | contract/API/nativeblockchain/browser/regressions; docsprogress/test/matrix/architecture/Web3report | RealRPCtx/mintverify khác mockedIPFSadapter; publicIPFS/physicalcamera/GPS chưa đủbằngchứngphảighi rõ |

## Chính sách an toàn

Bổ sung trong nhóm QR sau phê duyệt: client/package.json + package-lock.json pin qrcode1.5.4/ZXingbrowser0.1.5, peer library0.21.3; không đổi phiên bản cũ. client/vite.config.js prebundle lazy QR dependencies để lần mở camera đầu tiên không reload form; không đổi API, xác thực hoặc database. QrCode/qrDecoder và test ảnh/video thật được bổ sung; scanner quản lý stream chờ quyền để tránh race React StrictMode.

Chain authority là **local attestor** đượcbackendJWT/RBACauthorize, không giả người dùng làtxsigner. Hardhatunlockedtestaccounts, RPCchỉ127.0.0.1:18545, chain31337; ngoàiTESTchặnwrite. Contractenforceswriterauthority/uniqueop vàcompletionprerequisites, không thể tự kiểmMongoacademicfacts; trustboundarynàykhôngđượcgiấu.

MetadataSBT onchainURI chỉgeneric/nonPII, không tên/GPA/báocáo/thôngtin vịtrí. BáocáoIPFS luônciphertext, masterkey32byte không đưaFrontend/Git/onchain; mấtkey/rotation làproductionconcern. Thiếukey/Pinata flags→503, không localCIDgiả. Proofhashonchain không thaydatabase/quyềngiảngviên.

QR mới theo Assignment+action checkin/checkout, không seedingGET và không sửa QRlegacyPHASE1. GPSclientclaimfresh+accuracybounded, không bằngchứngchốngspoofabsolut. Không âmthầm đổi WorkSessionmanualđãduyệt. Auditproofhash khôngpublicrawGPS. Cácschema/indexmới chỉTEST; nonTESTrollout còn cầnbackup/dryrun/migration/rollback riêng.

Retry/reconciliation chỉexplicitPOST cóquyền. Không resetdatabase/chain khi gặperror để cheFAIL; giữ logvàoperationstates. Onchainalreadymined nhưngDBupdatefail phảirecover từevent/operationID thật, khônggửi mintduplicate. Chainrestart/deploymentmismatch không VERIFIED.

Rollback: tắtcờWEB3local hoặcquaypatchtừsnapshotđãlưu, giữbằngchứng/collection, khôngdrop/reset/clean. ChỉdeployHardhatlocalđượcduyệt. Dừng trướcPHASE6.

# Web3 Cloud runtime — cập nhật 09/11/2026

**SOURCE ĐÃ NỐI RUNTIME; CHƯA NGHIỆM THU/KÍCH HOẠT CLOUD.** Worktree `contracts/node_modules/.cache/cloud-integration-20261109`, branchdeploy, base5e41f78; không commit/push.

## Module

| Module | Đã nối |
|---|---|
| cloudWeb3Runtime | localWeb3 metadata/context/send và API Web3 guard chọn Sepolia khi opt-in; xác minh manifest/deployment/confirmations/writer |
| cloudJournalStore/cloudTransactionGateway | Mongo majority, unique operation/nonce, lease/fencing; raw bền vững trước gửi; runtime dùng signer secret file riêng |
| cloudCustodialVault/cloudCustodialRuntime | Envelope v2 portable; mapping Sepolia riêng; kiểm địa chỉ bằng giải mã, không sửa envelope/mapping Windows |
| custodialRuntime/businessIdentity | Chọn Cloud service khi cấu hình đúng; không quay về yêu cầu MetaMask |
| certificateQueue qua Cloud wrapper | Collection Cloud riêng, enqueue chỉ outbox mới đúng policy và activation timestamp; không chạy pump lịch sử |
| reports approval | Outbox chỉ tạo khi đủ opt-in/write/custody/autoIssue và sự kiện chốt mới |
| cloud-sbt-once.cjs | One-shot explicit approval, không được server startup gọi; dispatch tối đa10outbox mới, xử lý1job |
| API operations / BlockchainHistory | Projection trạng thái journal/hash/block, không trả raw/privatekey; pending/confirmed/failed/recovery-required |

## Kết quả kiểm thử

| Kiểm thử | Kết quả |
|---|---|
| 40 unit/regression chọn lọc | PASS, gồm policy Cloud/QR/local vault/binding và14test Cloud preparation |
| 17 test tập trung sau chỉnh cuối | PASS; giao nhau với nhóm40, không cộng thành57test độc lập |
| Journal integration MongoDB thật | PASS trên internova_full_role_test_20261109, replica set hiện hữu; backup trước, index/lease/unique nonce/majority/crash-retry/readback; EVM provider kiểm soát, không gọi mạng |
| 7 HTTP/RBAC/IDOR thực + MongoDB TEST | PASS; snapshot không đổi, Admin READ_ONLY503, Student/Company/Mentor anchor403 |
| Portable AES restore trong bộ nhớ | PASS trong unit test: clone keyring JSON, IV riêng, sai key/user/chain bị từ chối; không phải DR nghiệm thu Cloud |
| Syntax toàn bộ Backend | PASS |
| Frontend lint + production build /api | PASS |
| Sepolia RPC/deployment/event/SBT thật | NOT TESTED/BLOCKED thiếu cấu hình và phê duyệt |
| Atlas production / full restart-redeploy worker Cloud | NOT TESTED; không gọi production |
| Queue Cloud và recipient Cloud E2E trên DB | NOT TESTED; chưa provision schema Cloud; không lấy nghiệm thu queue local làm Cloud PASS |

## Cấu hình và gate

Biến cần chuẩn bị, chưa nhập vào Render:

- Giữ APP_ENV=CLOUD_DEMO/NODE_ENV=production và cấu hình Atlas/marker/JWT hiện hữu.
- CLOUD_WEB3_ENABLED=false, CLOUD_WEB3_WRITE_ENABLED=false, WEB3_LOCAL_READ_ONLY=true; chỉ thay sau phê duyệt.
- CLOUD_WEB3_NETWORK=sepolia, CLOUD_WEB3_CHAIN_ID=11155111, CLOUD_WEB3_RPC_URL=<HTTPS RPC>, CLOUD_WEB3_RPC_HOST=<đúng hostname>, CLOUD_WEB3_CONFIRMATIONS=12 hoặc cao hơn.
- CLOUD_WEB3_MANIFEST_FILE=<file manifest đã xác minh>, CLOUD_WEB3_SIGNER_ADDRESS=<writer public>, CLOUD_WEB3_SIGNER_FILE=<secret file ngoài repo>.
- CLOUD_CUSTODY_ENABLED=false, CLOUD_CUSTODY_WRITE_ENABLED=false, CLOUD_CUSTODY_KEYRING_FILE=<portable keyring v2 ngoài repo>.
- CLOUD_SBT_AUTO_ISSUE_ENABLED=false, CLOUD_SBT_ACTIVATED_AT=<ISO thời điểm kích hoạt đã duyệt>.
- CLOUD_WORKER_ONCE_APPROVED không đặt mặc định; chỉ dùng khi operator đã phê duyệt chạy worker.
- WEB3_LOCAL_ENABLED=false, CUSTODIAL_LOCAL_TEST_ENABLED=false, CUSTODIAL_AUTO_ISSUE_ENABLED=false giữ nguyên trên Cloud.

Cần lập kế hoạch tạo trước các collection/index, không có auto-migration: blockchain_transaction_journal (unique issuer+operationId, issuer+nonce); blockchain_issuer_leases; cloud_custodial_wallets_v2 (unique chainId+userId, chainId+address); cloud_certificate_issuances_v1 (unique studentUserId+batchId); cloud_certificate_worker_leases_v1. Không tạo index trên Atlas trong lượt này.

## Việc còn cần trước nghiệm thu

1. Operator cung cấp RPC, manifest và địa chỉ signer public, testETH; không gửi khóa vào chat. Xin duyệt riêng deploy contract. Không dùng master key custody làm signer.
2. Review schema/index/backup/restore trên Atlas hiện hữu, duyệt thao tác hạ tầng trước khi provision. Thử Atlas thực hoặc môi trường replica tương đương được cấp phép; không bật ghi khi chưa có index.
3. Duyệt tạo/import keyring Cloud v2, thực hiện backup mã hóa portable và restore trên hạ tầng đích. Không dùng khóa TEST Windows, không chuyển mapping legacy tự động; tài khoản có lịch sử cần review riêng.
4. Kiểm thử recipient/queue runtime Cloud, lease hết hạn, replay, reorg và process restart/deploy trên môi trường được phép. Integration hiện dùng Mongo thật nhưng provider kiểm soát, chưa chứng minh mạng Sepolia.
5. Duyệt riêng một bằng chứng và một ca mint đủ điều kiện, kiểm receipt/event/ownerOf/locked và UI bốn vai trò. Không dùng bài thật hoặc cấp lại lịch sử để thử.
6. Chỉ sau nghiệm thu mới duyệt thay flags/worker. Không tự khởi chạy worker hoặc quét backlog. Mongo nghiệp vụ, QR/GPS, upload vẫn độc lập với blockchain.

Phạm vi dữ liệu thực tế: thêm2collection journal TEST và index theo script opt-in sau backup, giữ fixture TEST để kiểm tra. Mọi collection nghiệp vụ trước đó giữ hash. Source database/Atlas/Hardhat không đổi. Không gửi giao dịch, không mint hoặc tạo ví sinh viên; khóa ngẫu nhiên trong unit test chỉ ở bộ nhớ, không phải khóa Cloud thật.

Evidence: audit-reports/CLOUD_RUNTIME_20261109/api.json và cache/cloud-journal-integration-1794234563479/result.json. Runtime chính đang chạy chưa được restart/nạp source này. Không coi việc đặt flags là đủ để thay cho các kiểm thử chưa đạt.

## Bổ sung nghiệm thu custody/queue TEST — lượt tiếp theo

Các dòng NOT TESTED về custody/queue DB ở phần trên được cập nhật trong phạm vi sau, không đổi thành Cloud/Sepolia thật PASS:

| Kiểm tra mới | Bằng chứng và giới hạn |
|---|---|
| Recipient Cloud v2 | PASS với MongoDB thật trên internova_full_role_test_20261109: đúng1recipient TEST, gọi lại cùng địa chỉ, không tạo trùng |
| Backup/restore keyring portable | PASS: backupAES-GCM, sai wrap key bị từ chối; process Node mới phục hồi địa chỉ từ bản backup và envelope trongDB; không dùngDPAPI. Chưa thử Linux Render/khôi phục ngoài máy |
| Sai master key / chain | PASS với envelope của recipientTEST thực. Không đổi khóa/mapping legacy |
| Queue outbox mới | PASS persistence MongoDB, enqueue2lần cùngjob, backlog/policycũ bị từ chối |
| Hai worker | PASS tranh lease MongoDB:1worker xử lý, worker còn lại không xử lýjob |
| Pending/retry | PASS MongoDB job retry_wait và runtime tạo lại đi tiếp; receipt/mint do adapter EVM mô phỏng, không có transaction thực |
| Chống mint trùng | PASS duy nhất1lượt mint mô phỏng; KHÔNG phải SBT thật |
| Journal fencing | PASS MongoDB thật: token worker thay đổi thì fence/prepare của worker cũ bị từ chối,0stale write |
| Pending/failed/recovery-required/reorg | PASS test provider kiểm soát; chưa córeorg mạng thực |
| Regression |42test chọn lọc PASS trước chỉnhpending cuối;31test tập trung sau chỉnhpending PASS (có giao nhau); lint/buildPASS, BackendsyntaxPASS |
| RBAC/IDOR và UI | Giữ bằng chứng7HTTP/MongoDB thật ở lượt trước, handlerphânquyền không đổi; UIsống Sepolia/chứngnhận thật vẫnNOT TESTED |

Đã tách createService với dependency injection để test cùng factory Cloud bằng guard TEST rõ ràng; APIproduction vẫn chỉ dùng service có Atlasguard. Không có publicbypass hoặc đổi envCloud. Store/test/schema không tự chạy khi import hoặc startup.

Dữ liệu chỉ trên DBTEST hiện hữu:3collectionCloud custody/job/lease và cácfixture assignment/report/session mới được đánh dấu testFixture. Cácbản ghi cótrước được soBSON và giữnguyên; không sửa500sinhviênnguồn, báo cáo chốt, điểm/giờ/SBT lịch sử. Không tạo thêmwebsite/DB. Journalintegrationtrước giữ nguyên. Fixturejobissued có simulationOnly=true và không cótokenID/transactionhash thật.

Evidence riêng tư: `.team/cloud-custody-queue-test-20261109/result.json`, `restore-process-result.json`, backup BSONtrước test; `audit-reports/CLOUD_RUNTIME_20261109/fencing.json`. Keyring/wrapkey/encryptedbackup TEST có ACL dànhcho PC, owner kiểmthử vàSYSTEM, không nằm trongGit. Không gửi cácfile này lênCloud; productionloader từ chốiqa-/test-key IDs.

Không chạy lại fixtureissued: scriptdừng ALREADY_PASSED thay vì resetjob. Chưa kiểmthử workerprocess bịkill giữa giao dịch thực; đãkiểm tạo lại factoryqueue và phục hồi key bằngprocessmới. Không dùng kếtquả này đểclaim toànbộ redeployE2ECloud.

### Migration và rollback

`node server/scripts/cloud-web3-schema.cjs plan` chỉ inplan. Helper applyTest chỉ nhận đúng DBTEST/replicaset/marker và backupđãxácminh; không có CLIapplyproduction. Không tạoindexAtlas. Production cần reviewdups, backup/indexmanifest rồiphêduyệt từngthayđổi. Rollbackứngdụng/flags vềtắt, giữcollection/envelope/journal để phục hồi, khôngdropcollection/index códữliệu hoặc xóa ví/issuedjob.

### Render Free và kích hoạt

Journal/job trênAtlas cóthể bềnvững qua redeploy, nhưng phải nghiệmthu Atlas thực. Filesystem RenderFree không phùhợp lưu journal/keybackup hoặcworkerdaemonđángtin cậy; service cóthểsleep. Signer/keyring cóthể được cấp lại bằng secretfile dooperatorquảnlý, nhưng backupmãhóa độc lập và restoreLinux vẫn phải kiểm. Không tự tạo paidworker/disk hoặc đổisecret.

Trước Sepolia: xác nhận RPC/testETH/signerpublic và manifest; deploy cầnduyệtriêng. Trước evidencewrite: schemaAtlas, signerbackup, storeintegration/live receipt/confirmations/reorg và mộtcađượcduyệt. TrướcautoIssue: portablekeyDR, recipient/queue/API/UI trênmôi trườngđích, activationtimestamp, worker vận hành đượcduyệt, chỉeventmới và mộtminttestđượccấpquyền. Các cờ hiện vẫn tắt, main READ_ONLY. Không commit/push.

## Chốt release READ_ONLY

Worktree đã chuyển sang `.worktrees/cloud-integration-20261109`, base/remote5e41f78. Mẫu env đã chuyển sang `server/config-examples/sepolia.env.example`; Docker COPY thêm hai script Cloud.51regression/lint/build/syntax PASS; Dockerimage và liveRender/Atlas NOT TESTED. Chưa commit/push/deploy. Xem [checklist release và các gate](CLOUD_WEB3_READ_ONLY_RELEASE.md).

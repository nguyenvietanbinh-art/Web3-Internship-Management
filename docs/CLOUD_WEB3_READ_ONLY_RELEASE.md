# Chốt source Web3 Cloud — READ_ONLY release, 09/11/2026

## Trạng thái

**READY FOR REVIEW/STAGING cho release READ_ONLY. Không phải READY cho ghi Sepolia hoặc mint.**

Worktree ổn định: `D:\Web3-Internship-Management\.worktrees\cloud-integration-20261109`. Branch `deploy/internova-cloud-20261108`, base và remote đã fetch cùng `5e41f785ef480427dc500c091ce2f9976bebffb3`. Workspace gốc branch_1/6e29330 không chuyển branch hoặc xóa thay đổi. Không commit/push/deploy trong lượt chốt này.

Source trong worktree có Git riêng và không bị ignore do thư mục cha. Mẫu `server/.env.sepolia.example` đã chuyển thành `server/config-examples/sepolia.env.example` được Git theo dõi bình thường; chỉ placeholder/cờ tắt. `.worktrees/` được exclude cục bộ ở repo chính, không ảnh hưởng Git bên trong worktree. Các junction node_modules chỉ tái sử dụng dependency hiện hữu, không stage.

## Kiểm tra

| Mục | Kết quả |
|---|---|
| 51 regression bị ảnh hưởng | PASS, policy Cloud/Sepolia/QR/Render origin |
| Frontend lint và build /api | PASS |
| Syntax toàn server/src | PASS |
| Package/lock client+server | PASS, không đổi dependency |
| Worker không tự chạy ở startup | PASS, entrypoint index.js không gọi dispatch/runOne |
| Import và Docker COPY source/scripts/shared | PASS khi đối chiếu file; thêm hai script Cloud vào image |
| Docker image build thực | NOT TESTED, máy không có Docker CLI; không tự cài |
| MongoDB TEST custody/queue/journal | Giữ bằng chứng PASS trước, không chạy lại issued fixture |
| Render/Atlas live environment | NOT TESTED, thiếu bản env/operator access hiện hành tại máy |
| Giao dịch/mint/live Sepolia | NOT TESTED/BLOCKED, giữ tắt |

Không coi kiểm thử provider mô phỏng là on-chain PASS. Không reset hoặc rerun jobissued để tăng số test.

## Nội dung commit dự kiến

Tên: `Prepare fail-closed Sepolia runtime and durable journal for READ_ONLY cloud release`.

Phạm vi: Cloud runtime/policy/gateway/Mongo store; custody v2/queue/outbox; API/UI trạng thái; script preflight, schema plan và one-shot worker; test; Dockerfile/render.yaml; mẫu env không có giá trị thật; gitattributes LF; tài liệu/checkpoint. Bao gồm sửa nhỏ đã được yêu cầu: bỏ placeholder email và chấm công cập nhật mới lên đầu.

Không bao gồm DB dump, fixture dữ liệu TEST, private/master key, keyring, encrypted backup, raw transaction journal, cache, node_modules hoặc env thật. Secrets scan trước staging/commit phải sạch. Hash commit chỉ có sau khi thực sự tạo commit; chưa có hash release mới.

## Push sau khi được duyệt

Tại worktree ổn định:
```powershell
git status
git diff --cached --stat
git diff --cached --check
git fetch origin
git rev-list --left-right --count HEAD...origin/deploy/internova-cloud-20261108
```
Nếu remote không còn5e41f78 hoặc không còn fast-forward, dừng và review thay đổi nhóm; không force/reset.

Sau khi duyệt đúng staged list:
```powershell
git commit -m "Prepare fail-closed Sepolia runtime and durable journal for READ_ONLY cloud release"
git push origin HEAD:refs/heads/deploy/internova-cloud-20261108
```
Lệnh trên chưa chạy. Không push branch_1 hoặc main.

## Render READ_ONLY

Giữ service hiện hữu, Docker contextroot, Dockerfile `./Dockerfile`, health `/api/ready`, `PORT` của Render, frontend API `/api`, host0.0.0.0 và shared như hiện tại. Chỉ source/config mẫu đổi; không thay env đang chạy. Auto deploy tắt.

Giữ các flag Cloud false: CLOUD_WEB3_ENABLED, CLOUD_WEB3_WRITE_ENABLED, CLOUD_CUSTODY_ENABLED, CLOUD_CUSTODY_WRITE_ENABLED, CLOUD_SBT_AUTO_ISSUE_ENABLED. Giữ WEB3_LOCAL_READ_ONLY=true; WEB3_LOCAL_ENABLED, WEB3_JOURNAL_ENABLED, CUSTODIAL_LOCAL_TEST_ENABLED, CUSTODIAL_AUTO_ISSUE_ENABLED và CHAIN_LISTENER_ENABLED=false. Không tạo JWT secret mới hoặc thay URI/marker hiện có khi cập nhật service.

Sau khi người dùng duyệt push và deploy riêng: Render Manual Deploy đúng commit → kiểm health/ready/login/API, CRUD Admin được phép, QR/GPS HTTPS, source capability và Web3 unavailable/read-only; xem log không khởi động worker. Không gọi one-shot worker khi smoke test.

Rollback: redeploy image/commit trước đã biết hoạt động, giữ env/JWT/Atlas/storage; không drop/restore DB hoặc resetchain. Source schema additive, không auto migration. Nếu startup gặp sai identity/index, dừng deploy và báo; không bypass guard.

## Sepolia preflight

Contract source đã cố định LF để source bytes khớp build input. Solidity0.8.24, optimizer enabled/runs200. SHA256: `ca1163e4166daa147802c12359ea9a7474ba27b3a0c283ae068ca993b5fb565e`. ABI có owner/writers/recordEvidence/mintCertificate/ownerOf/locked; mint chỉ writer và yêu cầu hoàn tất, SBT không chuyển nhượng.

Operator cần: RPC HTTPS URL+hostname chính xác; signer public address có quyềnwriter và testETH; manifest Sepolia đã duyệt (chain11155111,address,deploytx,block/genesis/codehash,ABI); backup signer và custody portable riêng biệt. Không gửi privatekey vào chat; không dùng khóaTEST Windows hoặc signerHardhat công khai. Artifact/compiler/source phải kiểm lại trước deploy; không lấy contract address Hardhat làm địa chỉ Sepolia.

Chuẩn bị unsigned plan với script `contracts/scripts/sepolia-preflight.cjs prepare` và env SEPOLIA_ARTIFACT_FILE/SEPOLIA_UNSIGNED_PLAN_FILE; không broadcast.

Khi có manifest/RPC và chỉ cần kiểm đọc:
```powershell
node contracts/scripts/sepolia-preflight.cjs verify
```
Dùng env APP_ENV=CLOUD_DEMO,NODE_ENV=production,CLOUD_WEB3_NETWORK=sepolia,CLOUD_WEB3_CHAIN_ID=11155111,CLOUD_WEB3_RPC_URL,CLOUD_WEB3_RPC_HOST,CLOUD_WEB3_MANIFEST_FILE,CLOUD_WEB3_CONFIRMATIONS>=12. Công cụ chỉ đọc và không dùng signer privatekey. Chưa gọi liveRPC trong lượt này.

## Atlas preflight

Repo và fail-closed policy chỉ cho `internova_cloud_demo` trên đúng cluster/replica/marker được cấu hình. Đây là databaseCloud dự kiến đã ghi trong handoff trước; **không có dữ liệu env Render hiện hành tại máy để xác minh live database đang kết nối**. Operator phải kiểm namespace/cluster/replica/marker trước thay đổi. Không đưa localdump vào databaseCloud đang có dữ liệu để thay thế tùy tiện.

```powershell
node server/scripts/cloud-web3-schema.cjs plan
```
Plan gồm journal/issuer lease, custodyv2 và Cloudjob/workerlease. Unique journal:issuer+operationID,issuer+nonce; custody:chainID+userID,chainID+address; queue:studentUserID+batchID. Không có CLIapplyproduction; helperapplyTest chỉ nhận đúngDBTEST/marker saubackup.

Trước provisioning production: backup BSON+indexes+collectionoptions+marker, mã hóa và kiểm restore sang namespace được duyệt; kiểm duplicate/null trên các key; review tác động/dung lượng; duyệt index từng collection. Không thay marker Cloud bằng marker TEST. Không xóa index/collection chứa journal/recipient/job để rollback; rollback code/flags trước và giữ dữ liệu phục hồi.

## Các phê duyệt cần tiếp theo

1.Duyệt staged source/commit và push đúng branch.
2.Duyệt Render ManualDeploy READ_ONLY; operator xác minh env/DB hiện tại. Không đổi secrets.
3.Duyệt riêng Atlas provisioning và kế hoạch backup/restore; không tự migration.
4.Cung cấp cấu hình và duyệt secret management/portableDR trước signer/custody Cloud; không yêu cầu gửi key vào chat.
5.Duyệt riêng deploySepolia, một transaction bằng chứng, một ca SBT đủđiềukiện và nghiệmthu UI/restart/reorg.
6.Chỉ sau các bước trên mới duyệt write/autoIssue/worker, không chạy backlog hoặc cấp lại lịch sử.

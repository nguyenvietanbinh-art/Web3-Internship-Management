# Bàn giao source và database hiện có cho nhóm — 07/11/2026

Nhánh hiện hành branch_1 tại GitHub nguyenvietanbinh-art/Web3-Internship-Management. Source có luồng theo vai trò, CV/JD/AI/task/report/Web3 local và hướng dẫn; snapshot là nguyên database trên máy tác giả, không dữ liệu mẫu thay thế.

- Main:31collection/2.561bản ghi, QA:32collection/3.812bản ghi; snapshotsmãhóaAES256GCM trongdatabase/shared-snapshot. ĐãrestorehaiTESTmới, doc hash/index match; thửrestoremainđangcódữliệubịguardtừchối. Khôngxóadữliệugốc.
- Khóa giải mã chỉ ở `.team/database-password.txt` trên máy tác giả; gửi riêng cho nhóm. Không có key/JWT/privatekey/mật khẩuplaintext trênGit. Fileloginđãbiết được mãhóa trongbundle; restoregiảimãra`.team/login-main`hoặc`login-qa`. Không resetpasswordđểtiệnchạy.
- Nhóm thực hiện theo [TEAM_ACTUAL_DATABASE.md](TEAM_ACTUAL_DATABASE.md):clone→npmci→Mongolocal27018replSet→restore→AI/model→Backend→Frontend→login→nghiệpvụ→Web3localnếu cần. Website5188/QA5189.
- AI77.5/100choPhúc,self80,officialnull;29backendtests+10qualitycasesBERTthật,browser8/8+4/4,client10/10,lint/buildPASS. KhôngcoiquytắcchấmsơbộlàBERTfine-tunedgiámkhảochínhxác.
- ModelONNX121.6MiBđượctảibằngscriptnguồnchínhthức/hashpin,khôngGitbinary>100MB; khôngcài/tảithêmtrênmáytácgiảtronglượtbàngiao. ModelrủiroTFIDF95kBthửnghiệmđượckèmopt-in.
- Không có lịch sử EVM gốc trên node mới, không giả VERIFIED từ DB; IPFS/Maps cần credentials; clean installtrênmáykhác vàmemoryleakdàihạnNOTTESTED.

Cácfilecache/venv/node_modules/.env/rawDB/privatekeys/vaultkhôngcầnvàkhôngđượcđưaGit. CácbáocáoMarkdown vàdataset/tệpmẫutựtạođượcbàngiao;lograwruntimegiữlocal. Mỗi máy làbảnsao, chưa phải cloudDBđồngbộ.

Kiểm tra cuối trước commit: thêm10/10testAIlegacyPASS sau cập nhật đúng hành vi lưu snapshot; source Git whitespacecheckPASS. Các artifact docs/evidence giữ nguyênbyte theo .gitattributes để bảo toànSHA256, có thể có cảnh báoCRLFởgitdiffchecktoànrepo. Website5188health200 sau reload;31collectionhash/indexmainkhôngđổi. Team scriptsNode/PowerShellparsePASS; cleaninstallởmáykhácchưađượcchạy.

# Bằng chứng chạy thật — identity thống nhất

- [Tổng hợp acceptance](result.json): Backend164/164; protectedUnchangedtrue.
- [Backend log](backend.txt), [browser log lần acceptance](unified-browser.txt), [email](email-browser-regression.txt), [Google/wallet](google-browser-regression.txt).
- [Browser lần retest cuối](browser-result.json):8/8,0exception/blocked, request method/path và chainProof. Không token/password.
- [Frontend checks](frontend-checks.json), [Git/dependency](git-and-dependencies.json), [Git status](git-status.txt).
- [Protected before](protected-before.json), [after](protected-after.json): hashes/counts/indexes, không dump nội dung cá nhân.
- [Index TEST](index-applied.json), [dry-run mapping](mapping-plan.json), [bốn record cũ](preserved-users.json), [runtime](runtime.json).
- [Chứng cứ SBT](chain-proof.json): receipt thật local, không mainnet.

## Ảnh thật từ Edge automation

| Ảnh | Chứng minh | Giới hạn |
| --- | --- | --- |
| [Dashboard không ví](student-dashboard-walletless.png) | Register → role Dashboard | Dữ liệu TEST |
| [SBERT không ví](sbert-without-wallet.png) | Inference thật trong UI | Không metrics chất lượng độc lập |
| [SBT cùng tài khoản](verified-sbt-same-account.png) | Token/recipient/locked local | EIP1193 bridge, không extension popup thật |
| [Mobile Dark](unified-mobile-dark.png) | Responsive/theme | Không thay kiểm mọi thiết bị |

Giờ được điều chỉnh TEST có audit, không giờ lao động thật. Google/Pinata live BLOCKED. Không vault/DPAPI/private key trong evidence. SHA-256 trong artifact-sha256.json để đối chiếu các artifact tại thời điểm bàn giao.

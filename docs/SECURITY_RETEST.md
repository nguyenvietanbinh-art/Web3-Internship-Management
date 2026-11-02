# Cập nhật sau phê duyệt — Ba dependency đã vá và retest

Ngày 31/10/2026 (+07). Đã vá server body-parser1.20.9, qs6.16.1 và server/client follow-redirects1.16.2; chỉ bốn lock entries, không đổi package khác hoặc manifest. **Audit production server/client:0 advisory.** Backend122/122, corebrowser70/70, legacy39/39, QRbrowser7/7, Solidity9+3, QRunit2/2, Pythonunit16/16; lint0error/0warning/buildPASS.

Server dev còn2MODERATE (nodemon/minimatch); toolchain contracts chưa đổi, snapshot audit PHASE6 còn18HIGH+16MODERATE+14LOW affected packages. IPFS live/modelcoldtests vẫnBLOCKED, hardwareNOTTESTED. Không toàn bộ security/release PASS, chưa PHASE7. Ba DB gốc/demo hash/index nguyên vẹn, không commit/push. [Kết quả bản vá, TX thật, file và evidence](DEPENDENCY_PATCH_RESULT.md).

## Lịch sử trước bản vá — giữ để đối chiếu

# PHASE6 — Security retest

Ngày31/10/2026 (+07). **Functional security cases PASS; dependency audit FAIL. Chưa security acceptance/production release.** Không thực hiện exploit phá service, cloud pentest hoặc sử dụng credentials thật.

## Các kiểm tra thực

| Nhóm | Kết quả | Phạm vi |
| --- | --- | --- |
| RBAC/IDOR |PASS cases|4role+foreign tenants; profile/account/placement/CV/report/hour/chain/certificate/private IPFS artifact |
| JWT |PASS cases|missing/unsigned/malformed/expired/wrong-wallet/unknown-user; role claim không thắng role DB; disabled/role thay đổi có hiệu lực ngay |
| Wallet nonce/signature |PASS regression|ethers random TEST wallet ký thật; invalid signature không consume victim nonce, concurrent replay chỉ1success |
| QR |PASS regression|signature/expiry/student/action/nonce CAS, concurrent redemption/replay, GPS old/inaccurate/out-of-range |
| Upload |PASS cases|PDF/DOCX parser thật; MIME/magic/size/macros/external relationships/DDE/encrypted/scan/active PDF/decompression bounds |
| Validation/injection |PASS cases|operator query/body, prototype property, regex escaping, structured pagination, immutable ownership, version races |
| XSS |PASS browser case|stored img/onerror trong profile hiển thị text, không tạo img/execute; sau reload vẫn inert |
| CORS |PASS cases|denied Origin mutation không write/headerallow; allowed preflight204 đúng origin; không thay JWTauth |
| IPFS privacy |PASS fixture/code|AES-GCM/HKDF; artifactmetadata scoped không envelope/key; chưa credential/liveupload |
| Contract |PASS localEVM/RPC|writer/admin access, duplicate/replay/subject/prerequisites, locked SBT, receipt/event/state, no fallbackverified |
| Data isolation |PASS|exact TEST URI guards và3protected DB hashes/indexes nguyên vẹn |
| Secrets |PASS pattern scope|configpresence only, random TEST JWT/wallet, flagsblockcloud; build literalJWT/PEM scan; không so secret thật hoặc claimDLP |

119Backend+70coreBrowser+39legacy+7QRBrowser+12Solidity/legacy test groups có evidence trong ignored phase6-20261031. Không phải penetration test toàn diện. Session/logout revocation server-side, SIWE domain/chain binding, localStorageJWT/CSP, distributed rate limit và production security review vẫn là phần cần thiết trước public deployment; không tự đổi luồng auth trong QA.

## npm audit chỉ đọc — kết quả FAIL, chưa nâng package

| Workspace | Production (--omit=dev) | Bao gồm dev/toolchain |
| --- | --- | --- |
| server |2HIGH +1MODERATE|2HIGH +3MODERATE |
| client |1HIGH|1HIGH |
| contracts |0 (package chủ yếu dev)|18HIGH +16MODERATE +14LOW |

Đây là số package affected/effect chains do npm báo, **không phải số CVE độc lập**; cùng advisory có thể bị đếm ở nhiều workspace. Không có CRITICAL theo snapshot registry lúc audit, không bảo đảm tất cả ecosystem an toàn. Python/OS vulnerability scanning chưa thực hiện.

### Production dependency ưu tiên

1. **HIGH body-parser1.20.8** trong server/package-lock.json; express.json mặc địnhinflate=true có call path compressed-body. Advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828), bản vá1.20.9. Không chạy payloadDoS trên backend/Mongo. Cần vá dependency và kiểm request JSON/compression/limits/health trong childTEST.
2. **HIGH follow-redirects1.16.1** trong server/client lock; [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p), bản vá1.16.2. Tính khai thác phụ thuộc cross-realm sensitiveHeaders. IPFS/NLP cómaxRedirects=0; browserfetch không dùngNodeadapter; legacyAI không dùngcross-realmcustomcredentials. Đó là giảm exposure, không coi package đã được vá.
3. **MODERATE qs6.16.0** trong serverlock; [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw), bản vá6.16.1. Sourcekhông thấyuntrustedcomma stringifycall; không tự suy rộng sang NoSQL parse bypass đã test.

Đã xác minh registryversions/engines/lifecycle; chưa sửa manifest/lockfile hoặc cài. Người dùng đang được hỏi phê duyệt đúng3patch theo DEPENDENCY_PATCH_PROPOSAL.md. Không npm audit fix/--force.

### Toolchain

Full auditcontracts: các package trực tiếpHardhat/toolbox bị lantruyền advisory từundici/adm-zip/tmp/serialize-javascript/lodash/follow-redirects và dependency khác; rawaudit-all-contracts.log giữURLs/ranges/effectchains. Server devnodemon/minimatch cóMODERATE. CLI chỉlocaltrustedsource, RPCloopback, khôngrealkey/mainnet; không có nghĩa mọiadvisorykhôngảnhhưởng. npm đề xuấtHardhat3/toolbox7 hoặc thậmchínodemon1.0.2 ở một nhánh: **không áp tự động major/downgrade**. Cần kế hoạch compatibility riêng và phê duyệt trước, kiểm Solidity/config/plugins/fixtures/localdeployment/replay. Ba patch nhỏ không thể được trình bày là đã xử lý48package toolchain.

## Chưa kiểm / cổng nghiệm thu

NOT TESTED: exploitation theo advisory, production DAST/SAST toàn bộ, supply-chain attestations, mobile wallets/extensions thật, camera/GPS chống spoof ngoài thực địa, WCAG/screen reader và OS/Python advisory audit. BLOCKED: IPFS live/key-management thực tế, quality modelrisk labels. Không mở mạng công khai hoặc chấp nhận production release khi HIGH dependency còn mở. Các test mock chỉ transport/negative fixture được gắn nhãn; không dùng fake success để vượt gate.

# FRONTEND — ĐÃ RENDER VÀ THAO TÁC TRÌNH DUYỆT

Ngày 30/10/2026, Asia/Bangkok. Branch `branch_1`, HEAD `d11a1852c5f03963bbe260425a246b0e65fe1091`. Đánh giá lại bằng demo và test thực trên database riêng. Không sửa source, schema, manifest/lock file hoặc .env; không cài dependency, deploy hay giao dịch blockchain. Báo cáo cũ giữ nguyên tại [FINAL_FULL_AUDIT](../FINAL_FULL_AUDIT/00_EXECUTIVE_SUMMARY.md).

Edge headless với user profile kiểm định riêng, desktop 1440×1000 và mobile 320×800. CDPchỉchophép 127.0.0.1:5174/5001/8001; không ví MetaMask, không real chain, chặnexternalfonts/RPC 8545. KhôngcàiPlaywright/Selenium. Ứng dụng thật được render, không chỉ GET HTML.

| Test UI | Kết quả | Bằng chứng |
| --- | --- | --- |
| Initial React page renders populated topic list | PASS | {'headings': ['Web3 Internship Hub', 'DEMO REAUDIT controlled topic', 'Đề tài mẫu 24: Bộ công cụ kiểm thử Solidity', 'Đề tài mẫu 23: Ứng dụng lưu trữ IPFS', 'Đề tài mẫu 22: Quản lý danh tính phi tập trung', 'Đề tài mẫu 21: Marketplace tài sản số', 'Đề tài mẫu 20: Hệ thống staking token', 'Đề tài mẫu 19: Phát hiện giao dịch bất thường', 'Đề tài mẫu 18: Cổng tuyển dụng Web3', 'Đề tài mẫu 17: Ứng dụng NFT chứng nhận học tập', 'Đề tài mẫu 16: Smart Contract cho chuỗi cung ứng', 'Đề tài mẫu 15: Dashboard quản trị DAO', 'Đề tài mẫu 14: Phân tích dữ liệu giao dịch DeFi', 'Đề tài mẫu 13: Xây dựng ví Web3 đa chuỗi', 'Đề tài mẫu 12: Bộ công cụ kiểm thử Solidity', 'Đề tài mẫu 11: Ứng dụng lưu trữ IPFS', 'Đề tài mẫu 10: Quản lý danh tính phi tập trung', 'Đề tài mẫu 09: Marketplace tài sản số', 'Đề tài mẫu 08: Hệ thống staking token', 'Đề tài mẫu 07: Phát hiện giao dịch bất thường', 'Đề tài mẫu 06: Cổng tuyển dụng Web3', 'Đề tài mẫu 05: Ứng dụng NFT chứng nhận học tập', 'Đề tài mẫu 04: Smart Contract cho chuỗi cung ứng', 'Đề tài mẫu 03: Dashboard quản trị DAO', 'Đề tài mẫu 02: Phân tích dữ liệu giao dịch DeFi', 'Đề tài mẫu 01: Xây dựng ví Web3 đa chuỗi', 'Phát triển hệ thống quản trị DAO Web3', 'DEMO REAUDIT controlled topic', 'Tiến độ Thực tập & Tiêu chí KPI (2 mốc)']} |
| Demo company login through real UI | PASS | Demo only; not wallet-security proof |
| Dashboard tab renders using Backend | PASS | ['Web3 Internship Hub', 'Nexus Labs Blockchain', 'Tiến Độ Thực Tập & Trạng Thái KPI Các Đề Tài'] |
| CV/JD tab renders real JD data | PASS | ['Web3 Internship Hub', 'Hồ Sơ Năng Lực Ứng Viên (CV)', 'Vị Trí Thực Tập Đang Tuyển Dụng (4)'] |
| Company creates JD through browser form and persists | PASS |  |
| Browser -> Backend -> AI matching works | PASS | Browser request 200; AI access log corroborates live /api/match |
| Apply button persists an application (business) | FAIL | Toast only: no POST from apply click |
| Attendance management tab renders | PASS | ['Web3 Internship Hub'] |
| Task and worklog subtabs render | PASS | Both subtab buttons clicked and rendered |
| Web3 tab renders events view | PASS | ['Web3 Internship Hub', 'Tra Cứu Chứng Nhận Thực Tập Web3 On-Chain (SBT / NFT Explorer)'] |
| Web3 mount must not POST sync (business) | FAIL | Observed automatic POST sync-events  2 !== 0  |
| Unknown certificate never shows VERIFIED badge (business) | FAIL | Unknown query rendered ON-CHAIN VERIFIED / ERC-5192 badge |
| Mobile viewport 320 has no horizontal overflow | FAIL | scrollWidth=529 |
| Demo student login and restore through browser | PASS | Preset login and /auth/me restore; not MetaMask proof |
| Demo mentor login and restore through browser | PASS | Preset login and /auth/me restore; not MetaMask proof |
| No uncaught browser JavaScript exceptions | PASS |  |


Đã xem ảnh CV/JD desktop, không chỉ chụp file. Đủ 5 tab và 2 subtab task/worklog render; company/student/mentor login/restore qua 3 preset. Tạo JD form POST 201 và readback DB; matching POST 200 vàAIlogcorroboration. Chưatesttấtcảmodals/task create/score inputs qua UI, Metamask account change, navigation keyboard/ARIA, hoặc UAT thật.

Ứng tuyển bấm chỉ toast, không POST. Web3 mount POST sync 2 lần trong StrictMode. Unknown query UI hiện ON-CHAIN VERIFIED/ERC 5192 dù RPC không có. Mobile 320 horizontalscrollWidth 529:FAIL thực, nâng nhận định source“nguy cơ tràn”thành bằng chứng browser. KhônguncaughtJSexceptiontrong 16 test; console error/warning mà harness thu 0, nhưng các request bị chặn được tách riêng, không suy ra 0 mọi lỗi runtime.

Source form CV/GPA, role UI/mentor/company, fallback 80/88/85, loading/catch/toast,state/hooks,routing/upload/charts vẫn như [audit Frontend đầy đủ trước](../FINAL_FULL_AUDIT/03_FRONTEND_AUDIT.md); chưa sửa. Lint mới vẫn 32 warnings; build mới đạt và chunk>500 kB.

Ảnh bằng chứng: [Topics](screenshots/run2-01-topics-desktop.png), [CV/JD](screenshots/run2-03-cv-jd-desktop.png), [Web3](screenshots/run2-05-web3-desktop.png), [Mobile](screenshots/run2-06-mobile-web3.png). Các ảnh chứa dữ liệu mẫu, không phải chứng nhận/transaction thật.

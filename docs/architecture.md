# ĐỀ TÀI: NỀN TẢNG QUẢN LÝ THỰC TẬP SINH WEB3 DỰA TRÊN KPI & AI (BERT)

## 1. Kiến trúc tổng thể hệ thống

Hệ thống được thiết kế theo mô hình 4 phân hệ chính:

```
                  ┌──────────────────────────────────────────────┐
                  │             FRONTEND (CLIENT)                │
                  │   React + Vite + Modern UI + Netlify Deploy   │
                  │  (MetaMask Connect, Company & Intern Dashboards)
                  └───────┬───────────────────────────────┬──────┘
                          │ HTTP REST API                 │ Web3 Provider (RPC)
                          ▼                               ▼
       ┌──────────────────────────────────────┐   ┌──────────────────────────────┐
       │           BACKEND (SERVER)           │   │      BLOCKCHAIN NETWORK      │
       │        Node.js + Express + Mongoose   │   │  (Ethereum Sepolia / Polygon)│
       │         MongoDB Atlas Database       │   │  - Smart Contracts (Solidity)│
       └──────────────┬───────────────────────┘   │  - Transparent KPI Log       │
                      │                           │  - Internship Verification   │
                      │ HTTP (Internal)           └──────────────┬───────────────┘
                      ▼                                          │
       ┌──────────────────────────────────────┐                  │ Hash CID
       │          AI SERVICE (PYTHON)         │                  ▼
       │     FastAPI + BERT / Embeddings      │   ┌──────────────────────────────┐
       │   - Matching CV/Skill với Đề tài     │   │      DECENTRALIZED STORAGE   │
       │   - Phân tích báo cáo kết quả        │   │        IPFS (Pinata / File)  │
       └──────────────────────────────────────┘   └──────────────────────────────┘
```

## 2. Cấu trúc thư mục dự án

```
web3/
├── contracts/        # Smart Contracts (Solidity, Hardhat, Scripts, Tests)
├── server/           # Backend REST API (Node.js, Express, MongoDB, Ethers.js, IPFS)
├── client/           # Frontend Web Application (React, Vite, Dashboard UI)
├── ai-service/       # AI Microservice (Python, FastAPI, BERT Semantic Matching)
└── docs/             # Tài liệu kiến trúc, sơ đồ thực thể ERD, báo cáo KLTN
```

## 3. Các thực thể cốt lõi (Core Entities)

1. **User (Doanh nghiệp / Mentor & Sinh viên):**
   - Profile, Email, Role, Wallet Address (`0x...`), CV/Skills (cho sinh viên).
2. **Project / Internship Topic (Đề tài thực tập):**
   - Title, Description, Required Skills, Quota, Period, Company Wallet, IPFS Metadata Hash.
3. **KPI & Milestone (Mốc đánh giá):**
   - Milestone Index, Title, Criteria, Deadline, Weight (%), Status (Pending, Submitted, Approved, Rejected).
4. **Submission (Báo cáo sinh viên):**
   - Milestone ID, Student Address, IPFS Report Hash, Timestamp, Mentor Feedback, AI Analysis Score.
5. **On-chain Contract (Bảo chứng minh bạch):**
   - Ghi nhận trạng thái phân công, xác nhận mốc KPI, cấp chứng nhận NFT/SBT on-chain khi hoàn thành.

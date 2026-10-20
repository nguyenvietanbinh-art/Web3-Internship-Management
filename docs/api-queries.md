# API queries for the website

Base URL: `http://localhost:5000/api`. All list endpoints return `{ items, page, limit, total, pages }` and accept `page` and `limit` (maximum 100).

## Dashboard and profile queries

```http
GET /data/overview
GET /data/students?skill=Solidity&page=1&limit=20
GET /data/students/:studentId
GET /data/students/:walletAddress
PUT /data/students/:studentId
GET /data/companies?industry=Blockchain
GET /data/companies/:companyId
PUT /data/companies/:companyId
```

`/data/overview` returns counts for every collection and the number of unprocessed chain events. Profile `PUT` routes accept only the fields defined by that profile schema.

## Topics, assignments and evidence

```http
GET /data/topics?status=open&difficulty=intermediate&search=DAO&page=1&limit=20
GET /data/topics/:topicId
POST /topics
POST /topics/:topicId/assign
GET /data/assignments?studentId=:studentId&status=submitted
POST /topics/:topicId/kpis/:milestoneIndex/submit
GET /data/submissions?assignmentId=:assignmentId
POST /topics/:topicId/kpis/:milestoneIndex/evaluate
GET /data/evaluations?assignmentId=:assignmentId
POST /topics/:topicId/complete
```

The existing topic write endpoints preserve the current dashboard contract and also write to `assignments`, `submissions`, `ai_analyses`, and `kpi_evaluations`. KPI submission hashes report text with SHA-256; if Pinata is not configured, no IPFS CID is recorded.

## AI and blockchain audit queries

```http
GET /data/ai-analyses?submissionId=:submissionId
GET /data/chain-events?processed=false&page=1&limit=50
POST /topics/ai-match
GET /topics?studentWallet=0x...&status=open
```

AI analysis is stored with its engine name and remains advisory. `chain-events` contains only real logs when a chain listener is configured; the sample dataset does not invent blockchain records.

## Local demo accounts

- Company wallet: `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`
- Student wallet: `0x3c44cddbb6a900fa2b585dd299e03d12fa4293bc`

The current API has no verified signed-wallet session middleware. Wallet fields are used to connect demo records and are not sufficient authorization for production.

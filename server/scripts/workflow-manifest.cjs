const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const dir = path.resolve(process.argv[2] || '');
if (!dir.startsWith(path.join(root, 'contracts/node_modules/.cache') + path.sep)) throw Error('Manifest must be in ignored evidence cache');
const file = path.join(dir, 'workflow-plan.json');
if (fs.existsSync(file)) throw Error('Plan already exists; review it, do not overwrite');
const plan = { version: 1, createdAt: new Date().toISOString(), replicaSet: 'internovaTestRs', mongoPort: 27018, backendPort: 57418, frontendPort: 5188, chainPort: 18546, chainId: 31337,
  sourceProtected: 'mongodb://127.0.0.1:27017/web3_internship_test_phase1_khoa_20261106',
  demoUri: 'mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_20261106_a?replicaSet=internovaTestRs',
  qaUri: 'mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_qa_20261106_a?replicaSet=internovaTestRs',
  expected: { students: 200, companies: 8, mentors: 8, admins: 2, batches: 2, topics: 40, opportunities: 80 }, deploymentId: '0x' + crypto.randomBytes(32).toString('hex') };
fs.mkdirSync(dir, { recursive: true });fs.writeFileSync(file, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ plan: file, databasesPlanned: 2, databaseWrites: 0 }));

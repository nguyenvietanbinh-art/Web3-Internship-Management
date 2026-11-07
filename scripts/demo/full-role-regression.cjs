// Exact-allowlisted, fresh child TEST databases; protected databases are read-only.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(root, process.argv[2] || '');
if (!out.startsWith(path.join(root, 'audit-reports') + path.sep)) throw Error('Audit output required');
const { MongoClient } = require(path.join(root, 'server/node_modules/mongodb'));
const evidence = path.join(out, 'evidence');
fs.mkdirSync(evidence, { recursive: true });
if (fs.existsSync(path.join(evidence, 'integration-results.json'))) throw Error('Choose a fresh report directory; never overwrite prior test results');
const uri = 'mongodb://127.0.0.1:27017/web3_internship_test_phase1_role_' + crypto.randomBytes(5).toString('hex');
require('../../server/src/config/testDatabaseGuard').assertTestEnvironment({ nodeEnv: 'test', uri, allowlistedUri: uri });
const env = { ...process.env, NODE_ENV: 'test', MONGODB_URI_TEST: uri, MONGODB_URI_TEST_ALLOWLIST: uri,
  USER_ID_BUSINESS_ENABLED: 'false', EMAIL_AUTH_ENABLED: 'false', GOOGLE_AUTH_ENABLED: 'false',
  WEB3_INTEGRATION_TESTS: 'true', WEB3_TEST_DEPLOYMENT: path.join(root, 'contracts/node_modules/.cache/phase5-20261031/deployment.json'),
  AI_SERVICE_URL_TEST: 'http://127.0.0.1:8003', NLP_SERVICE_URL_TEST: 'http://127.0.0.1:8003',
  NLP_SERVICE_URL: 'http://127.0.0.1:8003', NLP_INFERENCE_TESTS: 'true',
  PINATA_JWT: '', REPORT_ENCRYPTION_KEY: '', IPFS_EXTERNAL_UPLOAD_ENABLED: 'false',
  CV_PARSER_MODULE_PATH: path.join(root, 'contracts/node_modules/.cache/phase3-20261031/python-deps'),
  RAYON_NUM_THREADS: '1' };
const results = [];
async function snapshot(client, names) {
  const databases = [];
  for (const name of names) {
    const collections = [];
    for (const { name: n } of (await client.db(name).listCollections().toArray()).sort((a,b) => a.name.localeCompare(b.name))) {
      const col = client.db(name).collection(n);
      const hash = crypto.createHash('sha256'); let count = 0;
      for await (const row of col.find().sort({ _id: 1 })) { hash.update(JSON.stringify(row)); count++; }
      collections.push({ name: n, count, sha256: hash.digest('hex'), indexes: await col.indexes() });
    }
    databases.push({ name, collections });
  }
  return databases;
}
function run(name, args, extra = {}) {
  const startedAt = new Date().toISOString();
  const child = spawnSync(process.execPath, args, { cwd: root, env: { ...env, ...extra }, encoding: 'utf8',
    windowsHide: true, timeout: 420000, maxBuffer: 18 * 1024 * 1024 });
  const log = (child.stdout || '') + (child.stderr || '');
  fs.writeFileSync(path.join(evidence, name + '.txt'), log);
  const directories = [...log.matchAll(/Evidence: (.+)/g)].map(m => m[1].trim());
  for (const [i, dir] of directories.entries()) {
    if (!path.resolve(dir).startsWith(path.join(root, 'contracts/node_modules/.cache') + path.sep)) continue;
    const target = path.join(evidence, name + '-browser-' + i); fs.mkdirSync(target, { recursive: true });
    for (const file of fs.readdirSync(dir)) if (/\.png$|^result\.json$|^production-build\.txt$|^build\.txt$/.test(file))
      fs.copyFileSync(path.join(dir, file), path.join(target, file));
  }
  results.push({ name, startedAt, endedAt: new Date().toISOString(), exit: child.status, error: child.error?.code,
    status: child.status === 0 ? 'PASS' : 'FAIL',
    summary: log.split('\n').filter(l => /^# (tests|pass|fail|skipped)|browser \d+\/|Production shell/.test(l)) });
  fs.writeFileSync(path.join(evidence, 'integration-results.json'), JSON.stringify(results, null, 2));
  console.log(name + ': ' + results.at(-1).status);
  if (child.status !== 0) process.exitCode = 1;
}
(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const beforeNames = (await client.db('admin').admin().listDatabases()).databases.map(d => d.name);
  const runtime = JSON.parse(fs.readFileSync(path.join(root, 'contracts/node_modules/.cache/unified-20261102/runtime.json')));
  const protectedNames = beforeNames.filter(n => !['admin', 'local', 'config'].includes(n)
    && (!n.startsWith('web3_internship_test_phase1_') || n === runtime.database));
  // Original/demo and the active manual TEST; historical disposable TEST databases are not queried.
  const before = await snapshot(client, protectedNames);
  fs.writeFileSync(path.join(evidence, 'protected-before.json'), JSON.stringify(before, null, 2));
  try {
    const files = fs.readdirSync(path.join(root, 'server/test')).filter(f => f.endsWith('.test.js')).map(f => 'server/test/' + f);
    run('backend-all', ['--test', '--test-concurrency=1', ...files]);
    run('production-role-navigation', ['client/test/production-shell.e2e.cjs']);
    run('email-browser', ['client/test/email-auth.e2e.cjs']);
    run('unified-business-browser', ['client/test/unified.e2e.cjs'], { PRODUCTION_UI_TEST: 'true' });
  } finally {
    const after = await snapshot(client, protectedNames);
    fs.writeFileSync(path.join(evidence, 'protected-after.json'), JSON.stringify(after, null, 2));
    const namesAfter = (await client.db('admin').admin().listDatabases()).databases.map(d => d.name);
    fs.writeFileSync(path.join(evidence, 'database-safety.json'), JSON.stringify({
      protectedUnchanged: JSON.stringify(before) === JSON.stringify(after), protectedNames,
      createdDatabases: namesAfter.filter(n => !beforeNames.includes(n)), allowlistedBase: uri,
      note: 'Baseline taken after authorized MongoDB recovery; no pre-recovery content hash available.'
    }, null, 2));
    if (JSON.stringify(before) !== JSON.stringify(after)) process.exitCode = 1;
    await client.close();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });

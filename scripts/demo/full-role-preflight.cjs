// Read-only service probes and database-independent regression checks.
// Never starts application services, installs packages, or connects to MongoDB.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const output = path.resolve(root, process.argv[2] || '');
if (!output.startsWith(path.join(root, 'audit-reports') + path.sep)) throw Error('Audit output required');
fs.mkdirSync(path.join(output, 'evidence'), { recursive: true });
if (fs.existsSync(path.join(output, 'evidence', 'preflight-results.json'))) throw Error('Choose a fresh report directory; never overwrite prior test results');
const results = [];
function run(name, executable, args, cwd = root, additions = {}) {
  const startedAt = new Date().toISOString();
  const child = spawnSync(executable, args, { cwd, windowsHide: true, encoding: 'utf8', timeout: 180000,
    maxBuffer: 10 * 1024 * 1024, env: { ...process.env, RAYON_NUM_THREADS: '1', ...additions } });
  const log = (child.stdout || '') + (child.stderr || '');
  fs.writeFileSync(path.join(output, 'evidence', name + '.txt'), log);
  results.push({ name, command: [executable, ...args], startedAt, finishedAt: new Date().toISOString(),
    exit: child.status, error: child.error?.code, status: child.status === 0 ? 'PASS' : 'FAIL',
    summary: log.split('\n').filter(line => /^# (tests|pass|fail|skipped)|Ran \d+ tests|\d+ passing|^OK$/.test(line)) });
  fs.writeFileSync(path.join(output, 'evidence', 'preflight-results.json'), JSON.stringify(results, null, 2));
  console.log(name + ': ' + results.at(-1).status);
  if (child.status !== 0) process.exitCode = 1;
}
run('client-unit', process.execPath, ['--test', 'client/test/production-safety.test.mjs', 'client/test/ui-content.test.mjs']);
run('qr-code', process.execPath, ['--test', 'client/test/qr-code.test.cjs']);
run('server-independent', process.execPath, ['--test', '--test-concurrency=1',
  ...['runtime-safety', 'ai-fallback', 'chain-adapter', 'private-ipfs', 'google-crypto', 'dependency-patches'].map(n => 'server/test/' + n + '.test.js')]);
run('lint', process.execPath, ['node_modules/oxlint/bin/oxlint'], path.join(root, 'client'));
run('build', process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist/full-role-20261105'], path.join(root, 'client'), { NODE_ENV: 'production' });
run('contracts-local', process.execPath, ['scripts/local-hardhat.cjs', 'test'], path.join(root, 'contracts'));
(async () => {
  const probes = [];
  for (const url of ['http://127.0.0.1:5182/', 'http://127.0.0.1:57407/api/health', 'http://127.0.0.1:8003/openapi.json']) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(4000) }); probes.push({ url, status: r.status,
      ...(url.endsWith('/health') ? { health: await r.json() } : {}) }); }
    catch (e) { probes.push({ url, status: 'UNREACHABLE', error: e.cause?.code || e.name }); }
  }
  fs.writeFileSync(path.join(output, 'evidence', 'http-readiness.json'), JSON.stringify(probes, null, 2));
})().catch(e => { console.error(e.name); process.exitCode = 1; });

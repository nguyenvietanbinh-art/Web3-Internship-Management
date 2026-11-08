// Read-only Atlas connectivity check. Credentials are never printed.
const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('../../server/node_modules/mongodb');
const dotenv = require('../../server/node_modules/dotenv');
const root = path.resolve(__dirname, '../..');
async function inspect() {
  const file = path.join(root, '.team/services.env');
  const env = fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
  if (!env.MONGODB_URI) throw Error('MONGODB_URI_MISSING');
  let uri;
  try { uri = new URL(env.MONGODB_URI); } catch { throw Error('MONGODB_URI_INVALID'); }
  if (uri.protocol !== 'mongodb+srv:' || !/^([a-z0-9-]+\.)+mongodb\.net$/.test(uri.hostname) || !uri.username || !uri.password) throw Error('ATLAS_URI_REQUIRED');
  if (uri.pathname !== '/' && uri.pathname !== '/internova_cloud_demo' && uri.pathname !== '') throw Error('UNEXPECTED_TARGET_DATABASE');
  uri.pathname = '/internova_cloud_demo';
  // Keep Atlas TLS validation on; never accept insecure transport options.
  const allowed = new Set(['retryWrites', 'w', 'appName', 'authSource', 'tls']);
  for (const [key] of uri.searchParams) if (!allowed.has(key)) throw Error('UNSUPPORTED_URI_OPTION');
  if (uri.searchParams.has('tls') && uri.searchParams.get('tls') !== 'true') throw Error('TLS_REQUIRED');
  uri.searchParams.set('retryWrites', 'true');
  uri.searchParams.set('w', 'majority');
  uri.searchParams.set('appName', 'InternovaCloudDemo');
  const client = new MongoClient(uri.href, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db('internova_cloud_demo');
    const hello = await db.command({ hello: 1 });
    if (!hello.isWritablePrimary || !hello.setName) throw Error('REPLICA_SET_NOT_READY');
    const collections = (await db.listCollections({}, {nameOnly: true}).toArray()).map(c => c.name);
    const report = { clusterHost: uri.hostname, database: db.databaseName, replicaSet: hello.setName, collections, checkedAt: new Date().toISOString(), writes: 0 };
    fs.writeFileSync(path.join(root, '.team/atlas-inspection.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await client.close(); }
}
if (require.main === module) inspect().catch(e => {
  // Error messages from drivers can include credentials/hostnames; only emit safe codes.
  const safe = ['MONGODB_URI_MISSING','MONGODB_URI_INVALID','ATLAS_URI_REQUIRED','UNEXPECTED_TARGET_DATABASE','UNSUPPORTED_URI_OPTION','TLS_REQUIRED','REPLICA_SET_NOT_READY'];
  console.error(safe.includes(e.message) ? e.message : 'ATLAS_CONNECTION_FAILED: check database user, password and IP access list.');
  process.exitCode = 1;
});

const crypto = require('node:crypto');

/** Fail closed before opening any socket. Never accept a development/demo URI. */
function assertTestEnvironment({ nodeEnv, uri, allowlistedUri }) {
  if (nodeEnv !== 'test') throw new Error('NODE_ENV=test is required');
  if (!uri || !allowlistedUri || uri !== allowlistedUri) throw new Error('Exact MONGODB_URI_TEST_ALLOWLIST is required');
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('Invalid test MongoDB URI'); }
  if (parsed.protocol !== 'mongodb:' || parsed.hostname !== '127.0.0.1' || parsed.port !== '27017' ||
      parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname.length > 64 || !/^\/web3_internship_test_phase1_[a-z0-9_]+$/.test(parsed.pathname)) {
    throw new Error('Only an explicit local PHASE1 TEST database is allowed');
  }
  return uri;
}

function testUriFromEnvironment(env = process.env) {
  const base = assertTestEnvironment({ nodeEnv: env.NODE_ENV, uri: env.MONGODB_URI_TEST, allowlistedUri: env.MONGODB_URI_TEST_ALLOWLIST });
  const run = crypto.createHash('sha256').update(base).digest('hex').slice(0, 8);
  return `mongodb://127.0.0.1:27017/web3_internship_test_phase1_${run}_${crypto.randomBytes(6).toString('hex')}`;
}

module.exports = { assertTestEnvironment, testUriFromEnvironment };

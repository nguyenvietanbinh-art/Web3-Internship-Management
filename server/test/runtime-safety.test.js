const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTestEnvironment, testUriFromEnvironment } = require('./testEnvironment');
const allowed = 'mongodb://127.0.0.1:27017/web3_internship_test_phase1_guard';
test('test guard accepts only exact local allowlist with NODE_ENV=test', () => {
  assert.equal(assertTestEnvironment({nodeEnv:'test',uri:allowed,allowlistedUri:allowed}),allowed);
  const a=testUriFromEnvironment({NODE_ENV:'test',MONGODB_URI_TEST:allowed,MONGODB_URI_TEST_ALLOWLIST:allowed});
  const b=testUriFromEnvironment({NODE_ENV:'test',MONGODB_URI_TEST:allowed,MONGODB_URI_TEST_ALLOWLIST:allowed});
  assert.notEqual(a,b);
  assert.ok(new URL(a).pathname.length <= 64, 'MongoDB database name stays within 63 characters');
});
test('test guard rejects DEV/demo/production, missing configuration and URI tricks before connect', () => {
  const cases = [undefined,'mongodb://127.0.0.1:27017/web3_internship','mongodb://127.0.0.1:27017/web3_internship_demo_20261030_2340',
    allowed+'?authSource=admin',allowed+'#suffix',allowed.replace('127.0.0.1','localhost'),allowed.replace('127.0.0.1','remote.example'),
    allowed.replace('mongodb:','mongodb+srv:'),allowed.replace('127.0.0.1','user:password@127.0.0.1')];
  for(const uri of cases) assert.throws(()=>assertTestEnvironment({nodeEnv:'test',uri,allowlistedUri:uri}));
  for(const nodeEnv of [undefined,'development','production']) assert.throws(()=>assertTestEnvironment({nodeEnv,uri:allowed,allowlistedUri:allowed}));
  assert.throws(()=>assertTestEnvironment({nodeEnv:'test',uri:allowed,allowlistedUri:allowed+'_other'}));
});

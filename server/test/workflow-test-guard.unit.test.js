const {test}=require('node:test'),assert=require('node:assert/strict');
const {assertWorkflowTest}=require('../src/config/workflowTestGuard');
const uri='mongodb://127.0.0.1:27018/internova_demo_cunhan_kysu_20261107?replicaSet=internovaTestRs';
const env={NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri};

test('administrator write regression has one exact TEST database and rejects neighboring names',()=>{
 const target='mongodb://127.0.0.1:27018/internova_admin_supervision_test_20261108?replicaSet=internovaTestRs';
 assert.equal(assertWorkflowTest({...env,MONGODB_URI:target,WORKFLOW_TEST_URI_ALLOWLIST:target}).database,'internova_admin_supervision_test_20261108');
 for(const bad of [target.replace('_test_','_production_'),target.replace('20261108','20261109'),target.replace('27018','27017')])assert.throws(()=>assertWorkflowTest({...env,MONGODB_URI:bad,WORKFLOW_TEST_URI_ALLOWLIST:bad}));
});
test('combined demo uses one explicit local replica set allowlist, not arbitrary database names',()=>{
 assert.equal(assertWorkflowTest(env).database,'internova_demo_cunhan_kysu_20261107');
 for(const bad of [uri.replace('27018','27017'),uri.replace('internova_demo_cunhan_kysu_20261107','production'),uri.replace('127.0.0.1','localhost'),uri.replace('internovaTestRs','otherRs'),uri+'&retryWrites=false'])assert.throws(()=>assertWorkflowTest({...env,MONGODB_URI:bad,WORKFLOW_TEST_URI_ALLOWLIST:bad}));
});
test('combined demo still rejects missing consent flags, mismatched exact URI and production mode',()=>{
 for(const override of [{NODE_ENV:'production'},{SCHOOL_WORKFLOW_ENABLED:'false'},{WORKFLOW_TEST_URI_ALLOWLIST:uri+'x'}])assert.throws(()=>assertWorkflowTest({...env,...override}));
});

test('large dataset admits only its exact isolated replica-set URI with consent flags',()=>{
 const large='mongodb://127.0.0.1:27018/internova_large_test_20261108?replicaSet=internovaTestRs';
 assert.equal(assertWorkflowTest({...env,MONGODB_URI:large,WORKFLOW_TEST_URI_ALLOWLIST:large}).database,'internova_large_test_20261108');
 for(const value of [large.replace('20261108','20261109'),large.replace('27018','27017'),large.replace('internovaTestRs','other')])assert.throws(()=>assertWorkflowTest({...env,MONGODB_URI:value,WORKFLOW_TEST_URI_ALLOWLIST:value}));
});

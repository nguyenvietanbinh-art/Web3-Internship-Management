const {test}=require('node:test'),assert=require('node:assert/strict');
const {assertWorkflowTest}=require('../src/config/workflowTestGuard');
const uri='mongodb://127.0.0.1:27018/internova_demo_cunhan_kysu_20261107?replicaSet=internovaTestRs';
const env={NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri};
test('combined demo uses one explicit local replica set allowlist, not arbitrary database names',()=>{
 assert.equal(assertWorkflowTest(env).database,'internova_demo_cunhan_kysu_20261107');
 for(const bad of [uri.replace('27018','27017'),uri.replace('internova_demo_cunhan_kysu_20261107','production'),uri.replace('127.0.0.1','localhost'),uri.replace('internovaTestRs','otherRs'),uri+'&retryWrites=false'])assert.throws(()=>assertWorkflowTest({...env,MONGODB_URI:bad,WORKFLOW_TEST_URI_ALLOWLIST:bad}));
});
test('combined demo still rejects missing consent flags, mismatched exact URI and production mode',()=>{
 for(const override of [{NODE_ENV:'production'},{SCHOOL_WORKFLOW_ENABLED:'false'},{WORKFLOW_TEST_URI_ALLOWLIST:uri+'x'}])assert.throws(()=>assertWorkflowTest({...env,...override}));
});

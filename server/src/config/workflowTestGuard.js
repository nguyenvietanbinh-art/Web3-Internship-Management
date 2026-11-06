const names = new Set(['web3_internship_test_phase1_workflow_20261106_a', 'web3_internship_test_phase1_workflow_qa_20261106_a']);
function assertWorkflowTest(env = process.env) {
  const uri = env.MONGODB_URI;
  if (env.NODE_ENV !== 'test' || env.SCHOOL_WORKFLOW_ENABLED !== 'true' || !uri || uri !== env.WORKFLOW_TEST_URI_ALLOWLIST) throw Error('Workflow requires exact TEST allowlist');
  const u = new URL(uri);
  if (u.protocol !== 'mongodb:' || u.hostname !== '127.0.0.1' || u.port !== '27018' || u.username || u.password || u.hash || !names.has(u.pathname.slice(1)) || u.search !== '?replicaSet=internovaTestRs') throw Error('Only approved isolated workflow TEST replica set is allowed');
  return { uri, database: u.pathname.slice(1), replicaSet: 'internovaTestRs' };
}
module.exports = { assertWorkflowTest };

const names = new Set(['internova_full_role_test_20261109','internova_custodial_test_cd_20261109','internova_admin_supervision_test_20261108', 'internova_large_test_20261108', 'internova_role_qa_20261107', 'web3_internship_test_phase1_workflow_20261106_a', 'web3_internship_test_phase1_workflow_qa_20261106_a', 'internova_demo_cunhan_kysu_20261107']);
function assertWorkflowTest(env = process.env) {
  const uri = env.MONGODB_URI;
  if (env.NODE_ENV !== 'test' || env.SCHOOL_WORKFLOW_ENABLED !== 'true' || !uri || uri !== env.WORKFLOW_TEST_URI_ALLOWLIST) throw Error('Workflow requires exact TEST allowlist');
  const u = new URL(uri);
  if (u.protocol !== 'mongodb:' || u.hostname !== '127.0.0.1' || u.port !== '27018' || u.username || u.password || u.hash || !names.has(u.pathname.slice(1)) || u.search !== '?replicaSet=internovaTestRs') throw Error('Only approved isolated workflow TEST replica set is allowed');
  return { uri, database: u.pathname.slice(1), replicaSet: 'internovaTestRs' };
}
module.exports = { assertWorkflowTest };

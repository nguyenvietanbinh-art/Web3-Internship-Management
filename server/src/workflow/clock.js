const { assertWorkflowTest } = require('../config/workflowTestGuard');
let override = null;
const now = () => override ? new Date(override) : new Date();
function setTestClock(value) {
  assertWorkflowTest();
  if (process.env.WORKFLOW_CLOCK_TESTS !== 'true') throw Error('Clock injection only in explicit test harness');
  if (value !== null && !Number.isFinite(new Date(value).getTime())) throw Error('Invalid clock');
  override = value === null ? null : new Date(value);
}
module.exports = { now, setTestClock };

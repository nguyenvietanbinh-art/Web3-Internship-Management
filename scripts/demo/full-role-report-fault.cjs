// Controlled failure injection on a fresh exact-allowlisted TEST database only.
// No successful write is fabricated: the second insert is deliberately rejected.
process.env.CORE_BUSINESS_ENABLED = 'true';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { setup, placement, h } = require('../../server/test/coreFixtures');
const { Report } = require('../../server/src/models/BusinessModels');
const out = path.resolve(process.argv[2] || '');
if (!out.startsWith(path.resolve('audit-reports') + path.sep)) throw Error('Audit output required');
if (fs.existsSync(path.join(out, 'evidence/report-insert-fault.json'))) throw Error('Refuse to overwrite prior diagnostic evidence');
(async () => {
  try {
    const f = await setup(), a = (await placement(f)).doc;
    const body = { assignmentId: String(a._id), kind: 'weekly', title: 'TEST fault injection', content: 'Synthetic report, no personal data.' };
    const first = await h.api('POST', '/core/reports', { token: f.student.token, body });
    assert.equal(first.status, 201);
    const original = Report.create;
    let response;
    try {
      Report.create = async () => { throw Error('CONTROLLED_TEST_INSERT_FAILURE'); };
      response = await h.api('POST', '/core/reports', { token: f.student.token, body });
    } finally { Report.create = original; }
    assert.equal(response.status, 500);
    const saved = await Report.findById(first.body._id).lean();
    const currentCount = await Report.countDocuments({ assignmentId: a._id, kind: 'weekly', current: true });
    const result = { id: 'ROLE-HIGH-01', database: require('../../server/node_modules/mongoose').connection.name,
      scenario: 'Second report insert fails after superseding first report', actualHttp: response.status,
      firstReportCurrent: saved.current, currentCount, expected: 'Previously submitted report remains current after failed replacement',
      status: saved.current && currentCount === 1 ? 'PASS' : 'FAIL',
      fault: 'Explicit model insert rejection in isolated TEST; real API and real prior MongoDB update',
      file: 'server/src/core/reports.js:12-13' };
    fs.writeFileSync(path.join(out, 'evidence/report-insert-fault.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    if (result.status === 'FAIL') process.exitCode = 1;
  } finally { await h.stop(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });

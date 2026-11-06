process.env.USER_ID_BUSINESS_ENABLED = 'true';
process.env.EMAIL_AUTH_ENABLED = 'true';
process.env.CORE_BUSINESS_ENABLED = 'true';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const User = require('../src/models/User');
const Assignment = require('../src/models/Assignment');
const Registration = require('../src/models/BatchRegistration');
const { signToken } = require('../src/services/authService');
let admin, company, mentor, student, other, batch, topic, request;
const call = (actor, method, path, body) =>
  h.api(method, '/core' + path, { token: actor.token, body });
const ok = (r, status = 200) => {
  assert.equal(r.status, status, JSON.stringify(r.body));
  return r.body;
};
async function actor(role, name) {
  const user = await User.create({
    role,
    name,
    loginEmail: `${name.toLowerCase()}@example.invalid`,
    email: `${name.toLowerCase()}@example.invalid`,
    passwordHash: 'TEST fixture only',
  });
  await require('../src/services/accountProfiles').ensureProfile(user);
  return { user, token: signToken(user) };
}
const dates = () => ({
  startDate: new Date(Date.now() - 864e5).toISOString(),
  endDate: h.futureDate(30),
});
before(async () => {
  await h.start();
  admin = await actor('admin', 'Admin');
  company = await actor('company', 'Company');
  mentor = await actor('mentor', 'Mentor');
  student = await actor('student', 'Student');
  other = await actor('student', 'Other');
  batch = ok(
    await call(admin, 'POST', '/batches', {
      code: 'REGISTRATION',
      name: 'Registration period',
      ...dates(),
      status: 'open',
    }),
    201
  );
  topic = ok(
    await call(company, 'POST', '/topics', {
      title: 'Build a website',
      description: 'Implement the internship project',
      kpis: [
        {
          title: 'Deliver',
          description: 'Run and document',
          weightPercent: 100,
          deadline: h.futureDate(14),
        },
      ],
    }),
    201
  );
});
after(h.stop);
test('placement validation explains reversed dates, batch boundaries, KPI deadlines and existing assignments', async () => {
  const fresh = await actor('student', 'Date validation');
  const body = {
    batchId: batch._id,
    topicId: topic._id,
    studentUserId: String(fresh.user._id),
    mentorUserId: String(mentor.user._id),
    startDate: batch.startDate,
    endDate: batch.endDate,
    approveImmediately: true,
    reason: 'Date validation',
  };
  for (const [changes, code] of [
    [{ startDate: batch.endDate }, 'PLACEMENT_DATE_ORDER'],
    [{ endDate: h.futureDate(35) }, 'PLACEMENT_OUTSIDE_BATCH'],
    [{ startDate: h.futureDate(20) }, 'KPI_OUTSIDE_PLACEMENT'],
    [{ endDate: h.futureDate(5) }, 'KPI_OUTSIDE_PLACEMENT'],
  ]) {
    const result = await call(admin, 'POST', '/placements', { ...body, ...changes });
    assert.equal(result.status, 400, JSON.stringify(result.body));
    assert.equal(result.body.code, code);
    if (code === 'KPI_OUTSIDE_PLACEMENT') {
      assert.ok(result.body.error.includes('Deliver'));
      assert.ok(result.body.error.includes('giờ Việt Nam'));
    }
  }
  assert.equal(await Assignment.countDocuments({ studentUserId: fresh.user._id }), 0);
});
test('student discovers topics and applies to a batch; duplicates and identity injection fail', async () => {
  const list = ok(await call(student, 'GET', `/batches/${batch._id}/opportunities`));
  assert.ok(list.items.some((t) => t._id === topic._id));
  request = ok(
    await call(student, 'POST', '/batch-registrations', {
      batchId: batch._id,
      topicId: topic._id,
      requestType: 'application',
      message: 'My preference',
    }),
    201
  );
  assert.equal(request.studentUserId, String(student.user._id));
  assert.equal(request.status, 'submitted');
  assert.equal(
    (
      await call(student, 'POST', '/batch-registrations', {
        batchId: batch._id,
        topicId: topic._id,
        requestType: 'application',
      })
    ).status,
    409
  );
  assert.equal(
    (
      await call(student, 'POST', '/batch-registrations', {
        batchId: batch._id,
        requestType: 'assistance',
        studentUserId: other.user._id,
      })
    ).status,
    400
  );
  const own = ok(await call(student, 'GET', '/batch-registrations'));
  assert.equal(own.total, 1);
  assert.equal(own.items[0].topic.title, topic.title);
  assert.equal(ok(await call(other, 'GET', '/batch-registrations')).total, 0);
  assert.equal(
    (
      await call(other, 'PATCH', `/batch-registrations/${request._id}`, {
        status: 'withdrawn',
        reason: 'steal',
        version: 0,
      })
    ).status,
    404
  );
  for (const who of [company, mentor])
    assert.equal((await call(who, 'GET', '/batch-registrations')).status, 403);
  assert.equal(
    (await call(company, 'DELETE', `/topics/${topic._id}`, { version: topic.__v })).status,
    409
  );
});
test('admin assigns a student application without prior JD acceptance and all participants see it', async () => {
  const input = {
    topicId: topic._id,
    mentorUserId: String(mentor.user._id),
    startDate: batch.startDate,
    endDate: batch.endDate,
    reason: 'Accepted school placement',
    version: request.__v,
  };
  assert.equal(
    (await call(student, 'POST', `/batch-registrations/${request._id}/assign`, input)).status,
    403
  );
  const result = ok(
    await call(admin, 'POST', `/batch-registrations/${request._id}/assign`, input),
    201
  );
  assert.equal(result.lifecycle, 'approved');
  assert.equal(result.studentUserId, String(student.user._id));
  const saved = await Registration.findById(request._id);
  assert.equal(saved.status, 'placed');
  assert.equal(String(saved.assignmentId), result._id);
  for (const who of [student, company, mentor, admin])
    assert.ok(ok(await call(who, 'GET', '/placements')).items.some((p) => p._id === result._id));
  assert.equal(
    (await call(admin, 'POST', `/batch-registrations/${request._id}/assign`, input)).status,
    409
  );
  assert.equal(
    (
      await call(student, 'POST', '/batch-registrations', {
        batchId: batch._id,
        requestType: 'assistance',
      })
    ).status,
    409
  );
});
test('assistance requests can be withdrawn, resubmitted, rejected with reason and resubmitted', async () => {
  let r = ok(
    await call(other, 'POST', '/batch-registrations', {
      batchId: batch._id,
      requestType: 'assistance',
      message: 'Please find a company',
    }),
    201
  );
  assert.equal(r.topicId, null);
  r = ok(
    await call(other, 'PATCH', `/batch-registrations/${r._id}`, {
      status: 'withdrawn',
      reason: 'Update preference',
      version: r.__v,
    })
  );
  assert.equal(r.status, 'withdrawn');
  r = ok(
    await call(other, 'POST', '/batch-registrations', {
      batchId: batch._id,
      requestType: 'assistance',
    }),
    201
  );
  assert.equal(
    (
      await call(admin, 'PATCH', `/batch-registrations/${r._id}`, {
        status: 'rejected',
        reason: '',
        version: r.__v,
      })
    ).status,
    400
  );
  r = ok(
    await call(admin, 'PATCH', `/batch-registrations/${r._id}`, {
      status: 'rejected',
      reason: 'Need more information',
      version: r.__v,
    })
  );
  r = ok(
    await call(other, 'POST', '/batch-registrations', {
      batchId: batch._id,
      requestType: 'assistance',
      message: 'Updated',
    }),
    201
  );
  assert.equal(r.status, 'submitted');
});
test('admin direct placement resolves pending assistance and concurrent duplicates are blocked', async () => {
  const input = {
    topicId: topic._id,
    batchId: batch._id,
    studentUserId: String(other.user._id),
    mentorUserId: String(mentor.user._id),
    startDate: batch.startDate,
    endDate: batch.endDate,
    approveImmediately: true,
    reason: 'School assistance',
  };
  const results = await Promise.all([
    call(admin, 'POST', '/placements', input),
    call(admin, 'POST', '/placements', input),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    await Assignment.countDocuments({ batchId: batch._id, studentUserId: other.user._id }),
    1
  );
  const row = await Registration.findOne({ batchId: batch._id, studentUserId: other.user._id });
  assert.equal(row.status, 'placed');
  assert.equal((await call(company, 'POST', '/placements', input)).status, 403);
});
test('closed or expired batches reject new registrations and applications require valid topics', async () => {
  const fresh = await actor('student', 'Fresh');
  assert.equal(
    (
      await call(fresh, 'POST', '/batch-registrations', {
        batchId: batch._id,
        requestType: 'application',
      })
    ).status,
    400
  );
  for (const data of [
    { code: 'CLOSED', status: 'draft', ...dates() },
    {
      code: 'EXPIRED',
      status: 'open',
      startDate: new Date(Date.now() - 30 * 864e5).toISOString(),
      endDate: new Date(Date.now() - 864e5).toISOString(),
    },
  ]) {
    const b = ok(await call(admin, 'POST', '/batches', { ...data, name: data.code }), 201);
    assert.equal(
      (
        await call(fresh, 'POST', '/batch-registrations', {
          batchId: b._id,
          requestType: 'assistance',
        })
      ).status,
      409
    );
  }
});
test('cancelled placement releases the student for a replacement topic in the same batch', async () => {
  const a = await Assignment.findOne({ batchId: batch._id, studentUserId: other.user._id });
  ok(
    await call(admin, 'PATCH', `/placements/${a._id}`, {
      lifecycle: 'cancelled',
      reason: 'Replace topic',
      version: a.__v,
    })
  );
  assert.equal((await Assignment.findById(a._id)).studentBatchKey, null);
  const t = ok(
    await call(company, 'POST', '/topics', {
      title: 'Replacement',
      description: 'Replacement project',
      kpis: [
        {
          title: 'Deliver',
          description: 'Implement',
          weightPercent: 100,
          deadline: h.futureDate(14),
        },
      ],
    }),
    201
  );
  const r = ok(
    await call(other, 'POST', '/batch-registrations', {
      batchId: batch._id,
      requestType: 'application',
      topicId: t._id,
    }),
    201
  );
  assert.equal(
    (
      await call(admin, 'POST', `/batch-registrations/${r._id}/assign`, {
        topicId: t._id,
        mentorUserId: String(mentor.user._id),
        startDate: batch.startDate,
        endDate: batch.endDate,
        reason: 'Replacement',
        version: r.__v - 1,
      })
    ).status,
    409
  );
  const placed = ok(
    await call(admin, 'POST', `/batch-registrations/${r._id}/assign`, {
      topicId: t._id,
      mentorUserId: String(mentor.user._id),
      startDate: batch.startDate,
      endDate: batch.endDate,
      reason: 'Replacement',
      version: r.__v,
    }),
    201
  );
  assert.equal(placed.lifecycle, 'approved');
  assert.notEqual(placed._id, String(a._id));
});

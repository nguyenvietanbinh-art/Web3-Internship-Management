// Pure business rules and schema validation. No connection, database, fixture writes or helper DBs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  assistanceAllowed,
  checkApplication,
  chooseAccepted,
  publicTopic,
  applicantKey,
} = require('../src/services/topicRecruitment');
const Registration = require('../src/models/BatchRegistration');
const { Types } = require('mongoose');
test('assistance opens exactly seven days before start and stops at batch end or close', () => {
  const batch = {
    status: 'open',
    startDate: new Date('2026-12-10T00:00:00Z'),
    endDate: new Date('2026-12-30T00:00:00Z'),
  };
  assert.equal(assistanceAllowed(batch, new Date('2026-12-02T23:59:59.999Z')), false);
  assert.equal(assistanceAllowed(batch, new Date('2026-12-03T00:00:00Z')), true);
  assert.equal(assistanceAllowed(batch, new Date('2026-12-20T00:00:00Z')), true);
  assert.equal(assistanceAllowed(batch, batch.endDate), false);
  assert.equal(assistanceAllowed({ ...batch, status: 'closed' }, batch.startDate), false);
});
test('a fourth choice and duplicate choice are rejected while three distinct choices fit', () => {
  const choices = [{ topicId: 'a' }, { topicId: 'b' }];
  assert.doesNotThrow(() => checkApplication(choices, 'c'));
  assert.throws(
    () => checkApplication(choices, 'a'),
    (e) => e.status === 409
  );
  assert.throws(
    () => checkApplication([...choices, { topicId: 'c' }], 'd'),
    (e) => e.code === 'APPLICATION_LIMIT'
  );
});
test('student can choose one accepted offer, never pending, rejected or another offer after selection', () => {
  const row = {
    status: 'submitted',
    selectedTopicId: null,
    choices: [
      { topicId: 'a', status: 'submitted' },
      { topicId: 'b', status: 'accepted' },
      { topicId: 'c', status: 'rejected' },
    ],
  };
  assert.equal(chooseAccepted(row, 'b').topicId, 'b');
  for (const id of ['a', 'c', 'unknown'])
    assert.throws(
      () => chooseAccepted(row, id),
      (e) => e.status === 409
    );
  assert.throws(
    () => chooseAccepted({ ...row, selectedTopicId: 'b' }, 'b'),
    (e) => e.status === 409
  );
});
test('public topic counters expose availability without exposing student reservation identities', () => {
  const key = applicantKey('batch', 'student');
  const result = publicTopic({ title: 'Topic', maxSlots: 2, applicantKeys: [key] });
  assert.equal(result.remainingSlots, 1);
  assert.equal(result.applicantCount, 1);
  assert.equal(result.applicantKeys, undefined);
  assert.equal(publicTopic({ maxSlots: 1, applicantKeys: ['a'] }).remainingSlots, 0);
});
test('registration schema prevents more than three or duplicate choices without using MongoDB', () => {
  const id = () => new Types.ObjectId(),
    companyUserId = id(),
    topicId = id();
  const base = { batchId: id(), studentUserId: id(), requestType: 'application' };
  const make = (topicId) => ({ topicId, companyUserId, status: 'submitted' });
  assert.equal(
    new Registration({ ...base, choices: [make(id()), make(id()), make(id())] }).validateSync(),
    undefined
  );
  assert.ok(
    new Registration({
      ...base,
      choices: [make(id()), make(id()), make(id()), make(id())],
    }).validateSync()?.errors.choices
  );
  assert.ok(
    new Registration({ ...base, choices: [make(topicId), make(topicId)] }).validateSync()?.errors
      .choices
  );
});

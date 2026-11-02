const {test}=require('node:test'),assert=require('node:assert/strict');const t=require('../src/services/timeTracking');
test('duration uses elapsed whole minutes, never invents a minimum credit',()=>{
 assert.equal(t.duration('2026-10-31T08:00:00Z','2026-10-31T10:05:59Z'),125);
 assert.equal(t.duration('2026-10-31T08:00:00Z','2026-10-31T08:00:05Z'),0);
 for(const end of ['2026-10-31T07:59:00Z','2026-10-31T08:00:00Z','2026-11-01T08:01:00Z','bad'])assert.throws(()=>t.duration('2026-10-31T08:00:00Z',end));
});
test('UTC day/month/week boundaries are deterministic and missing checkout view is read-only',()=>{
 assert.equal(t.periodKey('2026-11-01T23:00:00Z','week'),'2026-10-26');assert.equal(t.periodKey('2026-11-02T00:00:00Z','week'),'2026-11-02');assert.equal(t.periodKey('2026-11-01T00:00:00Z','month'),'2026-11');
 const doc={state:'open',checkInAt:'2026-10-30T00:00:00Z'};assert.equal(t.view(doc,new Date('2026-10-31T00:00:00Z')).requiresAttention,true);assert.equal(doc.requiresAttention,undefined);assert.deepEqual(t.manualProof(),{provider:'manual',verified:false});
});

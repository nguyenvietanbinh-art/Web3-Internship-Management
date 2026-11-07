const {test}=require('node:test'),assert=require('node:assert/strict');
const {state,suggest}=require('../src/workflow/allocationSuggestions');
test('viewing a recommendation does not bypass seven-day allocation window',()=>{
 const b={status:'open',startDate:new Date('2030-01-20T01:00:00Z'),endDate:new Date('2030-04-20T01:00:00Z')};
 assert.equal(state(b,{},new Date('2030-01-13T00:59:59Z')).allocation_available_now,false);
 assert.equal(state(b,{},new Date('2030-01-13T01:00:00Z')).allocation_available_now,true);
 assert.equal(state(b,{},b.endDate).allocation_available_now,false);
 assert.equal(state({...b,status:'closed'},{registeredAt:new Date()},new Date('2030-02-01')).allocation_available_now,false);
 assert.equal(state(b,{},new Date()).participation_confirmation_required,true);
});
test('non-admin roles cannot request allocation suggestions',async()=>{
 for(const role of ['student','company','mentor'])await assert.rejects(suggest({role},{}),e=>e.status===403);
});

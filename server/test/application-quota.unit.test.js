const {test}=require('node:test'),assert=require('node:assert/strict'),{quota}=require('../src/workflow/applicationQuota');
test('quota preserves lifetime submission history while counting only unrefunded opportunities',()=>{
 const history=['a','b','c','d'];const e={usedOpportunities:history,refundedOpportunities:['a','a']};
 assert.deepEqual(quota(e),{applicationCount:3,applicationLimit:3,refundedCount:1,remainingApplications:0});assert.deepEqual(e.usedOpportunities,history);
 assert.deepEqual(quota({usedOpportunities:['a']}),{applicationCount:1,applicationLimit:3,refundedCount:0,remainingApplications:2});
});
test('schema accepts extended history after refunds but rejects duplicate or unrelated refunds',()=>{
 const {Enrollment}=require('../src/workflow/models'),mongoose=require('mongoose'),ids=Array.from({length:6},()=>new mongoose.Types.ObjectId());
 const valid=new Enrollment({studentUserId:ids[0],batchId:ids[1],usedOpportunities:ids.slice(2),refundedOpportunities:[ids[2]]});assert.equal(valid.validateSync(),undefined);
 valid.refundedOpportunities=[ids[2],ids[2]];assert.ok(valid.validateSync()?.errors.refundedOpportunities);
 valid.refundedOpportunities=[ids[0]];assert.ok(valid.validateSync()?.errors.refundedOpportunities);
});

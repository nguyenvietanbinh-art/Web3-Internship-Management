function quota(e){const refunded=new Set((e.refundedOpportunities||[]).map(String)),used=(e.usedOpportunities||[]).filter(id=>!refunded.has(String(id))).length;return {applicationCount:used,applicationLimit:3,refundedCount:refunded.size,remainingApplications:Math.max(0,3-used)};}
const availableExpression={$lt:[{$size:{$setDifference:[{$ifNull:['$usedOpportunities',[]]},{$ifNull:['$refundedOpportunities',[]]}]}},3]};
module.exports={quota,availableExpression};

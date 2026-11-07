const {test}=require('node:test'),assert=require('assert/strict'),{officialProgress,criteriaInput}=require('../src/core/taskEvaluationService'),{validateRubric,proposal,defaults}=require('../src/core/reportEvaluation');
test('only explicitly confirmed met criteria count, independent of similarity and waiting submissions',()=>{
 const criteria=[{id:'a',weight:20},{id:'b',weight:30},{id:'c',weight:50}];assert.equal(officialProgress(criteria,[{criterionId:'a',state:'met'},{criterionId:'b',state:'pending_review'},{criterionId:'c',state:'need_revision',similarity:.99}]),20);assert.equal(officialProgress(criteria,[]),0);assert.equal(officialProgress([],[]),null);
});
test('criterion IDs, positive weights and required product are validated',()=>{
 const body={objective:'API',workItems:['Implement'],requiredProducts:['Source'],progressWeight:2,criteria:[{id:'c1',title:'API',description:'Login works',requiredProduct:'Source',weight:50}]};assert.equal(criteriaInput(body).acceptanceCriteria[0].weight,50);assert.throws(()=>criteriaInput({...body,criteria:[...body.criteria,...body.criteria]}));assert.throws(()=>criteriaInput({...body,criteria:[{...body.criteria[0],weight:0}]}));
});
test('rubric total and explicit school weighting policy are enforced',()=>{
 assert.equal(validateRubric({criteria:defaults.criteria}).criteria.reduce((n,c)=>n+c.max,0),100);assert.throws(()=>validateRubric({criteria:defaults.criteria,gradingPolicy:{method:'weighted',mentorWeight:80,companyWeight:30}}));assert.throws(()=>validateRubric({criteria:defaults.criteria.map((c,i)=>({...c,max:i?c.max:9}))}));
});
test('unverified prose and arbitrary cosine cannot produce a report grade',()=>{
 const report={content:'Đã hoàn thành mọi phần',version:1,evidenceChecks:[],similarity:1};const result=proposal(report,{rubric:defaults,progress:null});assert.equal(result.total,null);assert.ok(result.criteria.every(c=>c.score===null));assert.equal(result.status,'INSUFFICIENT_EVIDENCE');
});

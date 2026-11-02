const test=require('node:test'),assert=require('node:assert/strict');
const axios=require('axios');
const ai=require('../src/services/aiClient');
test('unavailable AI matching exposes provenance, no invented semantic score or minimum match',async()=>{
  const original=axios.post;axios.post=async()=>{throw new Error('Deliberately unavailable adapter fixture')};
  try{
    for(const input of [{studentSkills:[],requiredSkills:[]},{studentSkills:['cooking'],requiredSkills:['solidity']}]){
      const result=await ai.matchStudentWithTopic(input);assert.equal(result.similarity_score,0);assert.equal(result.semantic_affinity,null);assert.equal(result.fallback,true);assert.equal(result.engine,'skill-overlap-fallback');
    }
    const result=await ai.analyzeKpiReport({kpiTitle:'Solidity',reportContent:'',expectedKeywords:[]});assert.equal(result.suggestedScore,0);assert.equal(result.engine,'keyword-fallback');
  }finally{axios.post=original}
});
test('malformed AI adapter input is validation error, not a fabricated fallback result',async()=>{
  for(const args of [{studentSkills:[{}]},{requiredSkills:'Solidity'},{studentBio:{}},{topicTitle:123}])await assert.rejects(ai.matchStudentWithTopic(args),e=>e.status===400);
});

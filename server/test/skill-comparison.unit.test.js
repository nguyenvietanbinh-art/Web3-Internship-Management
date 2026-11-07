const {test}=require('node:test'),assert=require('node:assert/strict');
const {compare}=require('../src/workflow/skillComparison');
test('compare CV to required skills with aliases and deduplication',()=>{
 const r=compare(['JS','NodeJS','node.js','ReactJS'],['JavaScript','Node.js','MongoDB','Git']);
 assert.deepEqual(r.matched_skills,['javascript','node.js']);assert.deepEqual(r.missing_required_skills,['mongodb','git']);assert.equal(r.skill_match_count,2);assert.equal(r.required_skill_count,4);
});
test('missing skills are requirements absent in CV, not CV skills absent in a role',()=>{
 const r=compare(['Python','SQL','Excel'],['Java','SQL']);assert.deepEqual(r.missing_required_skills,['java']);assert.deepEqual(r.matched_skills,['sql']);
});
test('undeclared requirements are unknown, never a claim that student lacks skills',()=>{
 const r=compare(['React'],[]);assert.equal(r.requirements_declared,false);assert.equal(r.required_skill_count,0);assert.deepEqual(r.missing_required_skills,[]);
});
test('more unrelated CV skills do not increase the matched count',()=>{
 const short=compare(['Node.js'],['Node.js','SQL']),long=compare(['Python','Excel','Pandas','Power BI','Figma'],['Node.js','SQL']);assert.equal(short.skill_match_count,1);assert.equal(long.skill_match_count,0);
});
test('topic input validates the existing requiredSkills field without clearing omitted values',()=>{
 const {topicInput}=require('../src/core/unifiedPlacements');
 const input={title:'Đề tài',description:'Mô tả',maxSlots:3,kpis:[{title:'Bàn giao',description:'Tài liệu',weightPercent:100,deadline:'2080-01-01T00:00:00Z'}]};
 assert.ok(!Object.hasOwn(topicInput(input),'requiredSkills'));
 assert.deepEqual(topicInput({...input,requiredSkills:['JavaScript','Node.js','JavaScript']}).requiredSkills,['JavaScript','Node.js']);
 for(const bad of ['JavaScript',{},['x'.repeat(121)],Array.from({length:51},(_,i)=>'skill'+i)])assert.throws(()=>topicInput({...input,requiredSkills:bad}));
});

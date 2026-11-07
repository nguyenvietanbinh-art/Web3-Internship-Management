const {test}=require('node:test'),assert=require('node:assert/strict'),{compare,normalize}=require('../src/workflow/skillComparison'),{combine}=require('../src/workflow/matchingComparison');
test('exact, equivalent and related skills remain separate and related skills do not satisfy requirements',()=>{
 const r=compare(['JavaScript','NodeJS','Express','RESTful API','React','Spring Boot'],['JavaScript','Node.js','REST API','Java','MongoDB']);
 assert.equal(r.skill_match_count,3);assert.deepEqual(r.exact_matches.map(x=>x.canonical),['javascript']);assert.deepEqual(r.equivalent_matches.map(x=>x.canonical),['node.js','rest api']);assert.deepEqual(r.related_matches,[{required:'java',declared:'spring boot'}]);assert.deepEqual(r.missing_required_skills,['java','mongodb']);assert.deepEqual(r.no_direct_evidence_skills,r.missing_required_skills);
});
test('direct relationships are not treated as aliases or propagated transitively',()=>{
 for(const [own,required]of [['Express','Node.js'],['React','JavaScript'],['Spring Boot','Java']]){const r=compare([own],[required]);assert.equal(r.skill_match_count,0);assert.equal(r.related_matches.length,1);assert.equal(r.missing_required_skills.length,1);}
 assert.equal(compare(['Express'],['JavaScript']).related_matches.length,0);assert.deepEqual(normalize(['JS','javascript','RESTful API','REST API']),['javascript','rest api']);
});
test('empty declarations and unrelated CVs do not manufacture evidence',()=>{assert.equal(compare([],['MongoDB']).skill_match_count,0);assert.equal(compare(['Excel'],['Solidity']).related_matches.length,0);assert.equal(compare(['JavaScript'],[]).requirements_declared,false);});
test('comparison preserves both scores and real rank differences without forcing BERT superiority',()=>{
 const tf={results:[{id:'a',cosine:.5,raw_cosine:.50000004},{id:'b',cosine:.2,raw_cosine:.20000001}]},sb={results:[{id:'b',cosine:.8,raw_cosine:.80000002},{id:'a',cosine:.7,raw_cosine:.70000003}]};
 const r=combine(tf,sb,2);assert.equal(r.find(r=>r.id==='a').comparison.tfidf.raw_cosine,.50000004);assert.equal(r.find(r=>r.id==='b').comparison.rank_delta_tfidf_to_sbert,1);assert.equal(r.find(r=>r.id==='a').comparison.rank_delta_tfidf_to_sbert,-1);
});
test('unseen rank and score remain unknown rather than inferred outside returned pools',()=>{const r=combine({results:[{id:'a',cosine:.5}]},{results:[{id:'b',cosine:.8}]},1);assert.equal(r[0].comparison.sbert.rank,null);assert.equal(r[1].comparison.tfidf.raw_cosine,null);assert.ok(r.every(x=>x.comparison.rank_delta_tfidf_to_sbert===null));});
test('full score pools retain the actual rank beyond the displayed top K',()=>{const tf={results:[{id:'a',cosine:.9}],all_results:[{id:'a',cosine:.9},{id:'b',cosine:.1}]},sb={results:[{id:'b',cosine:.8}],all_results:[{id:'b',cosine:.8},{id:'a',cosine:.2}]};const rows=combine(tf,sb,1);assert.equal(rows.find(r=>r.id==='a').comparison.sbert.rank,2);assert.equal(rows.find(r=>r.id==='b').comparison.tfidf.cosine,.1);});

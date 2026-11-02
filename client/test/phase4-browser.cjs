const assert=require('node:assert/strict'),{pause}=require('./browserHarness.cjs');
// Opt-in extension after all36 Phase3 assertions on the same fresh guarded TEST.
exports.run=async({b,db,users,api,fingerprint,report,jd})=>{
 for(const role of ['student','company','mentor','admin']){
  await b.session(users[role].token);
  await b.check(`PHASE4 ${role}: NLP page mount only GET, responsive, no business writes`,async()=>{
   const before=await fingerprint(db),n=b.mutations();await b.nav('core-ai');await b.wait("document.querySelector('main').innerText.includes('NOT_TRAINED')");assert.equal(b.mutations(),n);
   for(const width of [320,768,1440]){await b.viewport(width);assert.ok(await b.ev('document.documentElement.scrollWidth<=innerWidth+1'));}assert.deepEqual(await fingerprint(db),before);
  });
  if(['student','company'].includes(role))await b.check(`PHASE4 ${role}: real TF-IDF matching/ranking via explicit UI, no invented confidence`,async()=>{
   const before=await fingerprint(db);await b.field('Engine NLP','tfidf');if(role==='company')await b.field('JD cần ranking',String(jd._id));await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Engine: tfidf')");assert.ok(await b.ev("document.querySelector('[data-testid=nlp-results]').innerText.includes('Cosine:')"));assert.deepEqual(await fingerprint(db),before);await b.screenshot(role+'-nlp-ranking');
  });
  if(role!=='student')await b.check(`PHASE4 ${role}: real report analysis shows separate rules and NOT_TRAINED classifier`,async()=>{
   const before=await fingerprint(db);await b.field('Engine NLP','tfidf');await b.field('Báo cáo cần phân tích NLP',String(report._id));await b.click('main button[type=submit]','Phân tích báo cáo NLP');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Classifier: NOT_TRAINED')");assert.ok(await b.ev("document.querySelector('[data-testid=nlp-results]').innerText.includes('Không phải dự đoán rủi ro')"));assert.deepEqual(await fingerprint(db),before);await b.screenshot(role+'-nlp-report');
  });
  if(process.env.PHASE4_REAL_MODEL==='true'&&['student','company'].includes(role))await b.check(`PHASE4 ${role}: actual SBERT matching/ranking displayed with live model status, zero writes`,async()=>{
   const before=await fingerprint(db);await b.field('Engine NLP','sbert');if(role==='company')await b.field('JD cần ranking',String(jd._id));await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Engine: sbert')");await b.wait("document.querySelector('main').innerText.includes('đã nạp mô hình')");const response=await api('GET','/core/ai/status',undefined,users[role].token);assert.equal(response.body.sbert.ready,true);assert.equal(response.body.sbert.revision,'e8f8c211226b894fcb81acc59f3b34ba3efd5f42');assert.deepEqual(await fingerprint(db),before);await b.screenshot(role+'-sbert-ranking');
  });
  if(process.env.PHASE4_REAL_MODEL==='true'&&role!=='student')await b.check(`PHASE4 ${role}: actual SBERT report relevance is not presented as trained risk prediction`,async()=>{
   const before=await fingerprint(db);await b.field('Engine NLP','sbert');await b.field('Báo cáo cần phân tích NLP',String(report._id));await b.click('main button[type=submit]','Phân tích báo cáo NLP');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Semantic relevance (sbert)')");assert.ok(await b.ev("document.querySelector('[data-testid=nlp-results]').innerText.includes('Classifier: NOT_TRAINED')"));assert.deepEqual(await fingerprint(db),before);await b.screenshot(role+'-sbert-report');
  });
 }
 await b.session(users.student.token);await b.nav('core-ai');
 if(process.env.PHASE4_REAL_MODEL==='true')await b.check('PHASE4 injected transport failure clears stale result; explicit baseline recovery uses actual API',async()=>{
  const before=await fingerprint(db);await b.field('Engine NLP','sbert');b.failNlp=true;await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('main .is-error')?.innerText.includes('Không kết nối')");assert.equal(await b.ev("Boolean(document.querySelector('[data-testid=nlp-results]'))"),false);await b.field('Engine NLP','tfidf');await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Engine: tfidf')");assert.deepEqual(await fingerprint(db),before);
 });
 else await b.check('PHASE4 unavailable SBERT fails clearly, explicit baseline recovery, no fake BERT result',async()=>{
  const status=await api('GET','/core/ai/status',undefined,users.student.token),before=await fingerprint(db);
  assert.equal(status.body.sbert.reason,'LOCAL_MODEL_NOT_CONFIGURED','This negative case requires the explicit unconfigured-model fixture');
  await b.field('Engine NLP','sbert');await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('main .is-error')?.innerText.includes('NLP')");assert.equal(await b.ev("Boolean(document.querySelector('[data-testid=nlp-results]'))"),false);await b.field('Engine NLP','tfidf');await b.click('main button[type=submit]','Phân tích matching');await b.wait("document.querySelector('[data-testid=nlp-results]')?.innerText.includes('Engine: tfidf')");assert.deepEqual(await fingerprint(db),before);
 });
 await pause(200);assert.deepEqual(b.exceptions,[]);assert.deepEqual(b.blocked,[]);
};

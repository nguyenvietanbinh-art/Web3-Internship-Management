const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process');
const {BrowserHarness,pause}=require('./browserHarness.cjs');
const cache=path.resolve('contracts/node_modules/.cache/role-workflow-qa-20261107'),fixture=JSON.parse(fs.readFileSync(path.join(cache,'accounts.json'),'utf8'));
assert.equal(fixture.database,'internova_role_qa_20261107');
const output=path.join(cache,'browser-'+Date.now());fs.mkdirSync(output,{recursive:true});let edge,b;
async function login(role){const a=fixture.accounts[role],r=await fetch('http://localhost:57419/api/auth/email/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});assert.equal(r.status,200);return (await r.json()).token;}
(async()=>{
 const port=9268;try{await fetch(`http://127.0.0.1:${port}/json/version`);throw Error('Port occupied; refuse user browser');}catch(e){if(e.message.startsWith('Port occupied'))throw e;}
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+path.join(output,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok){ready=true;break;}}catch{}await pause(200);}assert.ok(ready,'Edge debug server');
 b=new BrowserHarness({port,origin:'http://localhost:5189',api:'http://localhost:57419/api',output});await b.start();
 for(const role of ['student','company','mentor','admin']){
  await b.session(await login(role));if(await b.ev("Boolean(document.querySelector('[role=dialog]'))"))await b.click('button','OK');
  await b.check(role+' role menu, scoped reports and no automatic writes',async()=>{
   const before=b.mutations();await b.nav('core-reports');await b.wait("document.querySelector('.server-table tbody tr')");
   assert.ok(await b.ev("document.querySelector('main').innerText.includes('Giảng viên:')"));
   if(role==='company')assert.equal(await b.ev("Boolean(document.querySelector('[data-nav=core-ai]'))"),false);
   await b.click('button','Xem bài báo cáo');await b.wait("document.querySelector('[role=dialog] article')");await b.screenshot(role+'-report');await b.key('Escape');
   await b.nav('core-profile');if(['mentor','admin'].includes(role)){assert.equal(await b.ev("document.querySelector('main').innerText.includes('Phương thức đăng nhập')"),false);assert.equal(await b.ev("document.querySelector('main').innerText.includes('Kiểm tra mạng ví')"),false);}
   assert.equal(b.mutations(),before,'Rendering, navigation and report viewing must not write');
  });
  await b.check(role+' mobile, dark/light and overflow',async()=>{
   await b.viewport(390);assert.ok(await b.ev('document.documentElement.scrollWidth<=innerWidth+2'));await b.click('[aria-label="Bật Dark Mode"]');assert.equal(await b.ev('document.documentElement.dataset.theme'),'dark');await b.screenshot(role+'-mobile-dark');await b.click('[aria-label="Bật Light Mode"]');await b.viewport(1440);
  });
 }
 await b.session(await login('searchStudent'));
 await b.check('Student search and period survive navigation, Back/Forward and reload',async()=>{
  await b.nav('core-my-internship');await b.field('Kỳ thực tập được cấp',fixture.enrollmentId);await b.wait("document.querySelector('[aria-label=\"Tìm đề tài, nội dung hoặc doanh nghiệp\"]')");
  await b.field('Tìm đề tài, nội dung hoặc doanh nghiệp','searchable');await b.wait("document.querySelector('main').innerText.includes('searchable')");await b.nav('core-profile');await b.nav('core-my-internship');
  assert.equal(await b.ev("document.querySelector('[aria-label=\"Tìm đề tài, nội dung hoặc doanh nghiệp\"]').value"),'searchable');
  await b.ev('history.back();true');await b.wait("document.querySelector('main h1').textContent.includes('Hồ sơ cá nhân')");await b.ev('history.forward();true');await b.wait("document.querySelector('[aria-label=\"Tìm đề tài, nội dung hoặc doanh nghiệp\"]')");await b.reload();await b.wait("document.querySelector('[aria-label=\"Tìm đề tài, nội dung hoặc doanh nghiệp\"]')");
  assert.equal(await b.ev("document.querySelector('[aria-label=\"Kỳ thực tập được cấp\"]').value"),fixture.enrollmentId);await b.screenshot('student-search-restored');
 });
 await b.check('Logout clears private view state and next account cannot inherit it',async()=>{
  await b.click('#logout-btn');await b.wait("!document.querySelector('#logout-btn')");assert.equal(await b.ev("Object.keys(sessionStorage).filter(k=>k.startsWith('internova:view:v1:')).length"),0);await b.session(await login('company'));assert.equal(await b.ev("Boolean(document.querySelector('[data-nav=core-my-internship]'))"),false);assert.equal(await b.ev("document.querySelector('main').innerText.includes('searchable')"),false);
 });
 await b.session(await login('capabilityStudent'));
 await b.check('Student receives real semantic suggestions with two complete declared-skill matches',async()=>{
  await b.nav('core-ai');await b.field('Kỳ thực tập của tôi',fixture.capabilityEnrollmentId);await b.click('button[type=submit]','Tìm đề tài phù hợp');await b.wait("document.querySelector('[data-testid=nlp-results] ol li')");
  assert.ok(await b.ev("document.querySelector('[data-testid=nlp-results]').innerText.includes('sbert')"));assert.equal(await b.ev("[...document.querySelectorAll('[data-testid=nlp-results] ol li')].filter(e=>e.innerText.includes('Đã khai báo đủ các kỹ năng')).length"),2);await b.screenshot('student-real-semantic-matching');
 });
 await b.check('Analysis result and expanded explanation survive tab changes without repeating inference',async()=>{
  await b.click('main summary','Giới hạn kết quả');await pause(150);const count=b.mutations();await b.nav('core-profile');await b.nav('core-ai');
  assert.ok(await b.ev("Boolean(document.querySelector('[data-testid=nlp-results] ol li'))"));assert.ok(await b.ev("[...document.querySelectorAll('main details')].find(e=>e.querySelector('summary')?.textContent==='Giới hạn kết quả')?.open"));assert.equal(b.mutations(),count);
 });
 await b.session(await login('mentor'));
 await b.check('Completed report practice opens full text and proposes scores without official grade writes',async()=>{
  await b.nav('core-reports');await b.wait("[...document.querySelectorAll('button')].some(e=>e.textContent==='Đánh giá lại bài mẫu')");
  await b.click('button','Đánh giá lại bài mẫu');await b.wait("document.querySelector('[aria-label=\"Bài báo cáo ngắn theo kỳ thực tập\"]')");
  const before=b.requests.filter(r=>r.method==='POST'&&/\/(reviews|approve)$/.test(r.path)).length;await b.click('button','Chấm trước bài này');await b.wait("document.querySelector('.modal-content').innerText.includes('Điểm chấm trước:')");
  await b.click('button','Kiểm tra và chấm lại bài tập');assert.ok(await b.ev("Boolean(document.querySelector('[aria-label=\"Điểm: Mục tiêu và yêu cầu đề tài\"]'))"));
  assert.equal(b.requests.filter(r=>r.method==='POST'&&/\/(reviews|approve)$/.test(r.path)).length,before);await b.screenshot('mentor-practice-proposed');await b.key('Escape');
 });
 await b.check('Unsaved profile asks before leaving and never persists its draft or submits automatically',async()=>{
  await b.nav('core-profile');const before=b.mutations();await b.field('Họ tên / tên hiển thị','UNSAVED_PRIVATE_QA_SENTINEL');
  await b.ev("window.__confirmCount=0;window.confirm=()=>{window.__confirmCount++;return false;};true");await b.click('[data-nav=core-reports]');assert.equal(await b.ev("document.querySelector('[aria-label=\"Họ tên / tên hiển thị\"]').value"),'UNSAVED_PRIVATE_QA_SENTINEL');assert.equal(await b.ev('window.__confirmCount'),1);
  assert.equal(await b.ev("JSON.stringify(sessionStorage).includes('UNSAVED_PRIVATE_QA_SENTINEL')"),false);
  await b.ev('window.confirm=()=>true;true');await b.nav('core-reports');assert.equal(b.mutations(),before);await b.ev('delete window.confirm;true');
 });
 await b.session(await login('admin'));if(await b.ev("Boolean(document.querySelector('[role=dialog]'))"))await b.click('button','OK');
 await b.check('Admin verifies the real local SBT without connecting a personal wallet',async()=>{
  const proof=JSON.parse(fs.readFileSync(path.join(cache,'sbt-qa-result.json'),'utf8'));await b.nav('core-web3');await b.wait(`Boolean(document.querySelector('[aria-label="Phân công theo kỳ"] option[value="${proof.assignmentId}"]'))`);await b.field('Phân công theo kỳ',proof.assignmentId);await b.click('button','Xác minh chứng nhận trên blockchain');await b.wait("document.querySelector('[data-testid=live-sbt-certificate]')");
  assert.equal(await b.ev("Boolean(document.querySelector('main button')&&[...document.querySelectorAll('main button')].some(e=>e.textContent==='Kiểm tra mạng ví'))"),false);assert.ok(await b.ev(`document.querySelector('[data-testid=live-sbt-certificate]').innerText.includes(${JSON.stringify(proof.certificate.txHash)})`));await b.screenshot('admin-real-local-sbt');
 });
 await b.check('Browser console has no uncaught runtime exceptions',async()=>assert.deepEqual(b.exceptions,[]));
 const result=b.result();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({output,tests:result.tests,exceptions:result.exceptions}));if(result.tests.some(t=>t.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({message:e.message,tests:b?.tests,exceptions:b?.exceptions}));process.exitCode=1;}).finally(async()=>{if(b)try{await b.cdp('Browser.close');}catch{}if(edge)edge.kill();});

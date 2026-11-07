// Writes only a new fixture in the exact, marker-guarded QA database. No deletes.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{spawn}=require('child_process'),{BrowserHarness,pause}=require('./browserHarness.cjs');
const mongoose=require('../../server/node_modules/mongoose');
const uri='mongodb://127.0.0.1:27018/internova_role_qa_20261107?replicaSet=internovaTestRs';
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri});
const output=path.resolve('contracts/node_modules/.cache/cv-upload-prefill-'+Date.now()),api='http://localhost:57419/api';fs.mkdirSync(output,{recursive:true});let b,edge;
(async()=>{
 require('../../server/src/config/workflowTestGuard').assertWorkflowTest();mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false});assert.equal(mongoose.connection.name,'internova_role_qa_20261107');assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');assert.ok(await mongoose.connection.db.collection('qa_safety_marker').findOne({_id:'role-workflow'}));
 const email='cv-prefill-'+Date.now()+'@example.invalid',password=crypto.randomBytes(24).toString('hex'),User=require('../../server/src/models/User'),{CV}=require('../../server/src/models/BusinessModels');
 const student=await User.create({name:'TEST CV upload prefill',role:'student',loginEmail:email,email,passwordHash:await require('../../server/node_modules/bcryptjs').hash(password,12)});
 await CV.create({ownerUserId:student._id,title:'CV existing title',summary:'Old summary',skills:['Old skill'],education:'Old education',experience:'Old experience',university:'Existing university',gpa:2.13});
 const login=await fetch(api+'/auth/email/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});assert.equal(login.status,200);const {token}=await login.json();
 const getCv=async()=>{const r=await fetch(api+'/core/cv',{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,200);return r.json();};
 const port=9292;try{await fetch(`http://127.0.0.1:${port}/json/version`);throw Error('Debug port occupied');}catch(e){if(e.message==='Debug port occupied')throw e;}
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+path.join(output,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok)break;}catch{}await pause(200);}
 b=new BrowserHarness({port,origin:'http://localhost:5189',api,output});await b.start();await b.session(token);await b.nav('core-cv');await b.wait("document.querySelector('[aria-label=\"Tên CV\"]')");
 await b.field('Tên CV','Unsaved title to preserve');
 await b.check('Real DOCX upload opens a preview without saving structured fields',async()=>{
   await b.upload('input[type=file]',path.resolve('docs/sample-cvs/02-backend.docx'));await b.click('button[type=submit]','Tải CV từ máy lên');
   await b.wait("document.body.innerText.includes('Thông tin đọc từ tệp CV')");
   const cv=await getCv();assert.equal(cv.summary,'Old summary');assert.equal(cv.gpa,2.13);assert.ok(cv.extractedText.includes('Node.js'));
   await b.click('button','Giữ thông tin đang nhập');assert.equal(await b.ev("document.querySelector('[aria-label=\"Tên CV\"]').value"),'Unsaved title to preserve');
 });
 await b.check('Applying preview updates the form; save and reload persist actual document fields',async()=>{
   await b.click('button','Điền thông tin từ tệp CV');await b.click('button','Đưa vào thông tin CV');
   assert.equal(await b.ev("document.querySelector('[aria-label=\"Tên CV\"]').value"),'Unsaved title to preserve');
   assert.ok((await b.ev("document.querySelector('[aria-label=\"Kỹ năng CV, cách nhau dấu phẩy\"]').value")).includes('MongoDB'));
   await b.click('button[type=submit]','Lưu CV');await b.wait("document.body.innerText.includes('Đã lưu thông tin CV.')");
   const saved=await getCv();assert.equal(saved.title,'Unsaved title to preserve');assert.equal(saved.gpa,3.05);assert.equal(saved.university,'Existing university');assert.ok(saved.summary.includes('Tìm công việc'));assert.ok(saved.skills.includes('Node.js'));
   await b.cdp('Page.reload');await b.wait("document.querySelector('[aria-label=\"GPA (0–4, có thể để trống)\"]')?.value==='3.05'");await b.screenshot('saved-cv-from-docx');
 });
 await b.check('Cancel retains the uploaded file; confirmed removal keeps manual CV fields after reload',async()=>{
   await b.click('button','Xóa tệp CV');await b.click('.modal-content button','Hủy');assert.ok((await getCv()).fileName);
   await b.click('button','Xóa tệp CV');await b.click('.modal-content button[type=submit]','Xác nhận xóa tệp');
   await b.wait("document.body.innerText.includes('Đã xóa tệp CV.')");
   const saved=await getCv();assert.equal(saved.fileName,undefined);assert.equal(saved.extractedText,undefined);assert.equal(saved.gpa,3.05);assert.ok(saved.skills.includes('Node.js'));
   await b.reload();await b.wait("document.body.innerText.includes('Chưa có tệp CV được tải lên.')");assert.equal(await b.ev("[...document.querySelectorAll('button')].some(e=>e.textContent==='Xóa tệp CV')"),false);await b.screenshot('removed-file-keeps-manual-cv');
 });
 assert.deepEqual(b.exceptions,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({...b.result(),database:mongoose.connection.name,fixtureUserId:String(student._id)},null,2));console.log(JSON.stringify({output,tests:b.tests}));if(b.tests.some(t=>t.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(b)try{await b.cdp('Browser.close');}catch{}if(edge)edge.kill();await mongoose.disconnect();});

// Real browser, API, MongoDB, local upload and public HTTPS PDF import.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'contracts/node_modules/.cache/cv-import-browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
process.env.USER_ID_BUSINESS_ENABLED='true';process.env.EMAIL_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';
const h=require(path.join(root,'server/test/helpers')),origin='http://127.0.0.1:5187';process.env.CORS_ORIGIN=origin;
const {CV}=require(path.join(root,'server/src/models/BusinessModels')),{BrowserHarness,pause}=require('./browserHarness.cjs');
let b,vite,browser,student;
async function free(port){await new Promise((ok,no)=>{const s=net.createServer();s.on('error',no);s.listen(port,'127.0.0.1',()=>s.close(ok));});}
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(150);}throw Error('Not ready '+url);}
(async()=>{try{
 await free(5187);await free(9237);await h.start();const email='cv-browser@example.invalid',password='TEST CV upload password';
 const registration=await h.api('POST','/auth/email/register',{body:{name:'TEST CV student',email,password,confirmPassword:password}});assert.equal(registration.status,201);student=registration.body;
 vite=spawn(process.execPath,[path.join(root,'client/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5187','--strictPort'],{cwd:path.join(root,'client'),env:{...process.env,VITE_API_URL:h.baseURL},windowsHide:true,stdio:'ignore'});
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9237','--user-data-dir='+path.join(out,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 await ready(origin);await ready('http://127.0.0.1:9237/json/version');b=new BrowserHarness({port:9237,origin,api:h.baseURL,output:out});await b.start();await b.session(student.token);await b.wait("document.querySelector('[data-nav=core-cv]')");await b.nav('core-cv');
 await b.check('CV upload is immediately visible without manual CV; local PDF creates one private CV with Vietnamese filename',async()=>{
  assert.equal(await CV.countDocuments({ownerUserId:student.user._id}),0);await b.wait("document.querySelector('[aria-label=\"Chọn tệp CV\"]')");
  const file=path.join(out,'CV Sinh viên.pdf');fs.writeFileSync(file,require(path.join(root,'server/test/cvDocuments')).guardedPdf());await b.upload('[aria-label="Chọn tệp CV"]',file);await b.click('button','Tải CV từ máy lên');await b.wait("document.body.textContent.includes('Đã lưu tệp CV') && document.body.textContent.includes('CV Sinh viên.pdf')");
  const cv=await CV.findOne({ownerUserId:student.user._id}).select('+fileData');assert.equal(cv.fileName,'CV Sinh viên.pdf');assert.ok(cv.fileData);assert.ok(cv.extractedText.includes('TEST secure parser input'));assert.equal(await CV.countDocuments({ownerUserId:student.user._id}),1);await b.screenshot('cv-local-upload');
 });
 await b.check('Public HTTPS PDF import works through UI and preserves manually entered CV fields',async()=>{
  await b.field('Tên CV','TEST saved CV title');await b.field('Tóm tắt CV','TEST preserve my own summary');await b.field('Kỹ năng CV, cách nhau dấu phẩy','React, MongoDB');await b.click('button','Lưu CV');await b.wait("document.body.textContent.includes('Đã lưu thông tin CV.')");
  await b.click('button','Lấy CV từ đường dẫn');await b.field('Đường dẫn CV trực tiếp','https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');await b.click('button','Lấy và lưu CV từ đường dẫn');await b.wait("document.body.textContent.includes('Đã lưu tệp CV') && document.body.textContent.includes('dummy.pdf')");
  const cv=await CV.findOne({ownerUserId:student.user._id});assert.equal(cv.fileName,'dummy.pdf');assert.equal(cv.title,'TEST saved CV title');assert.equal(cv.summary,'TEST preserve my own summary');assert.deepEqual(cv.skills,['React','MongoDB']);assert.ok(cv.extractedText.includes('Dummy PDF file'));await b.click('summary','Xem nội dung đọc từ CV');await b.screenshot('cv-url-import');
 });
 await b.check('Private URL is rejected without replacing the saved CV; reload preserves uploaded data',async()=>{
  const before=await CV.findOne({ownerUserId:student.user._id});await b.click('button','Lấy CV từ đường dẫn');await b.field('Đường dẫn CV trực tiếp','https://127.0.0.1/cv.pdf');await b.click('button','Lấy và lưu CV từ đường dẫn');await b.wait("document.querySelector('.is-error')?.textContent.includes('công khai')");
  const after=await CV.findById(before._id);assert.equal(after.sha256,before.sha256);assert.equal(after.__v,before.__v);
  await b.reload();await b.wait("document.querySelector('[data-nav=core-cv]')");await b.nav('core-cv');await b.wait("document.querySelector('[aria-label=\"Tên CV\"]')?.value==='TEST saved CV title'");assert.ok(await b.ev("document.body.textContent.includes('dummy.pdf')"));await b.viewport(375);await b.screenshot('cv-mobile');assert.ok(await b.ev('document.documentElement.scrollWidth<=innerWidth+1'));
 });
 assert.equal(b.exceptions.length,0,JSON.stringify(b.exceptions));const result=b.result();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));if(result.tests.some(t=>t.status!=='PASS'))process.exitCode=1;console.log('Evidence: '+out);
 }finally{if(b)await b.close().catch(()=>{});vite?.kill();browser?.kill();await h.stop();}
})().catch(e=>{console.error(e.message);process.exitCode=1});

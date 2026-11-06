// Isolated real browser -> API -> MongoDB task delivery flow; no user/demo data writes.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'contracts/node_modules/.cache/task-submissions-browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
process.env.USER_ID_BUSINESS_ENABLED='true';process.env.EMAIL_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';
const h=require(path.join(root,'server/test/helpers'));const origin='http://127.0.0.1:5186';process.env.CORS_ORIGIN=origin;
const User=require(path.join(root,'server/src/models/User')),Task=require(path.join(root,'server/src/models/Task')),{ensureProfile}=require(path.join(root,'server/src/services/accountProfiles')),{signToken}=require(path.join(root,'server/src/services/authService'));
const {BrowserHarness,pause}=require('./browserHarness.cjs');let b,vite,browser,company,mentor,student,admin,placement,task;
async function actor(role){const user=await User.create({name:'TEST UI '+role,role,loginEmail:role+'@example.invalid',passwordHash:'TEST fixture only; never used for login'});await ensureProfile(user);return{user,token:signToken(user,'password')};}
async function api(method,url,body,who=company){const r=await h.api(method,url,{body,token:who.token});assert.ok(r.status>=200&&r.status<300,JSON.stringify(r));return r.body;}
async function free(port){await new Promise((ok,no)=>{const s=net.createServer();s.on('error',no);s.listen(port,'127.0.0.1',()=>s.close(ok));});}
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(150);}throw Error('Not ready '+url);}
async function login(who){await b.session(who.token);await b.wait("document.querySelector('[data-nav=core-work]')");await b.nav('core-work');}
(async()=>{try{
 await free(5186);await free(9236);await h.start();company=await actor('company');mentor=await actor('mentor');student=await actor('student');admin=await actor('admin');
 const topic=await api('POST','/core/topics',{title:'TEST UI topic',description:'TEST',kpis:[{title:'Delivery',description:'TEST',weightPercent:100,deadline:h.futureDate(5)}]});
 const batch=await api('POST','/core/batches',{code:'TEST_UI_TASK',name:'TEST UI batch',startDate:new Date(Date.now()-864e5).toISOString(),endDate:h.futureDate(20),status:'open'},admin);
 placement=await api('POST','/core/placements',{topicId:topic._id,batchId:batch._id,studentUserId:String(student.user._id),mentorUserId:String(mentor.user._id),startDate:new Date(Date.now()-60000).toISOString(),endDate:h.futureDate(10)},admin);
 placement=await api('PATCH','/core/placements/'+placement._id,{lifecycle:'approved',reason:'TEST',version:placement.__v},admin);
 vite=spawn(process.execPath,[path.join(root,'client/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5186','--strictPort'],{cwd:path.join(root,'client'),env:{...process.env,VITE_API_URL:h.baseURL},windowsHide:true,stdio:'ignore'});
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9236','--user-data-dir='+path.join(out,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 await ready(origin);await ready('http://127.0.0.1:9236/json/version');b=new BrowserHarness({port:9236,origin,api:h.baseURL,output:out});await b.start();
 await b.check('Admin can edit approved assignment dates through email-account UI',async()=>{
  await b.session(admin.token);await b.nav('core-placements');await b.click('button','Sửa giảng viên / ngày');
  const date=new Date(Date.now()-3600000),local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
  await b.field('Ngày bắt đầu mới (giờ máy)',local);await b.field('Lý do sửa phân công','TEST adjust date to start internship now');await b.submit('Lưu giảng viên / ngày phân công');
  const list=await api('GET','/core/placements',undefined,admin);placement=list.items.find(x=>x._id===placement._id);assert.equal(new Date(placement.startDate).getTime(),new Date(local).getTime());assert.equal(placement.lifecycle,'approved');
  placement=await api('PATCH','/core/placements/'+placement._id,{lifecycle:'active',reason:'TEST after admin date adjustment',version:placement.__v});
 });
 await b.check('Company opens assignment form without initial selection and creates priority/deadline task',async()=>{
  await login(company);await b.click('button','Giao công việc');await b.wait("document.querySelector('.modal-content')");
  assert.equal(await b.ev("document.querySelector('.modal-content button[type=submit]').disabled"),true);
  await b.fill('.modal-content select[aria-label="Phân công theo kỳ"]',placement._id);
  await b.field('Tên công việc','TEST UI React task');await b.field('Mô tả công việc','Implement the React screen and submit results');await b.field('Mức độ ưu tiên','urgent');
  const date=new Date(Date.now()+864e5),local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);await b.field('Hạn hoàn thành (giờ thiết bị)',local);
  await b.submit('Giao công việc');await b.wait("document.body.textContent.includes('TEST UI React task')");
  task=await Task.findOne({title:'TEST UI React task'}).lean();assert.equal(task.priority,'urgent');assert.ok(task.dueDate);await b.screenshot('company-task-created');
 });
 await b.check('Student submits content, link and private file through UI; late badge and review state persist',async()=>{
  assert.ok(task);await Task.updateOne({_id:task._id},{$set:{dueDate:new Date(Date.now()-1000)}});await login(student);
  await b.wait("document.body.textContent.includes('TEST UI React task')");await b.click('button','Nộp công việc');
  await b.field('Nội dung kết quả công việc','TEST React delivery from browser');await b.field('Liên kết kết quả (GitHub, Drive…)','https://github.com/example/project');
  const file=path.join(out,'Báo cáo buổi đầu tiên.txt');fs.writeFileSync(file,'Nội dung tiếng Việt nộp từ trình duyệt');await b.upload('[aria-label="Tệp kết quả công việc"]',file);
  await b.submit('Nộp công việc');await b.wait("document.body.textContent.includes('Nộp muộn')");
  task=await Task.findById(task._id).lean();assert.equal(task.status,'review');assert.equal(task.submission.content,'TEST React delivery from browser');assert.equal(task.submission.fileName,'Báo cáo buổi đầu tiên.txt');assert.equal(task.submission.late,true);
  await b.click('summary','Xem bài nộp gần nhất');await b.wait("document.body.textContent.includes('Báo cáo buổi đầu tiên.txt')");await b.click('button','Xem trực tiếp');await b.wait("document.querySelector('.submission-preview-text')?.textContent.includes('Nội dung tiếng Việt nộp từ trình duyệt')");await b.screenshot('student-file-preview');await b.click('button','Đóng bản xem');await b.screenshot('student-task-submitted');
 });
 await b.check('Company previews Vietnamese text in app without downloading or changing the task',async()=>{
  await login(company);await b.wait("document.body.textContent.includes('TEST UI React task')");await b.click('summary','Xem bài nộp gần nhất');await b.click('button','Xem trực tiếp');await b.wait("document.querySelector('.submission-preview-text')?.textContent.includes('Nội dung tiếng Việt nộp từ trình duyệt')");assert.equal(await b.ev("document.querySelector('.submission-preview-dialog h2').textContent"),'Báo cáo buổi đầu tiên.txt');await b.screenshot('company-file-preview');await b.click('button','Đóng bản xem');assert.equal((await Task.findById(task._id)).status,'review');
 });
 await b.check('Expired preview/download sessions open login instead of leaving stale task data on screen',async()=>{
  for(const label of ['Xem trực tiếp','Tải về']){
   await login(company);await b.wait("document.body.textContent.includes('TEST UI React task')");await b.click('summary','Xem bài nộp gần nhất');
   await b.ev("localStorage.setItem('w3i_token','TEST-invalid-file-token');true");await b.click('button',label);
   await b.wait("!localStorage.getItem('w3i_token') && document.querySelector('[aria-label=\"Email đăng nhập\"]') && !document.querySelector('.server-table')");
  }
 });
 await b.check('Company requests revision and student resubmits; mentor approves on same task',async()=>{
  await login(company);await b.wait("document.body.textContent.includes('TEST UI React task')");await b.click('button','Duyệt bài nộp');await b.field('Kết quả duyệt công việc','need_revision');await b.field('Nhận xét công việc','TEST improve the result');await b.submit('Lưu đánh giá công việc');
  await login(student);await b.wait("document.body.textContent.includes('TEST improve the result')");await b.click('button','Nộp lại công việc');await b.field('Nội dung kết quả công việc','TEST revised delivery from browser');await b.submit('Nộp lại công việc');
  await login(mentor);await b.wait("document.body.textContent.includes('TEST UI React task')");await b.click('button','Duyệt bài nộp');await b.field('Nhận xét công việc','TEST approved delivery');await b.submit('Lưu đánh giá công việc');
  task=await Task.findById(task._id).lean();assert.equal(task.status,'done');assert.equal(task.progress,100);assert.equal(task.review.decision,'approved');
  await b.reload();await b.wait("document.querySelector('[data-nav=core-work]')");await b.nav('core-work');await b.wait("document.body.textContent.includes('TEST approved delivery')");await b.screenshot('mentor-task-approved');await b.viewport(375);await b.screenshot('task-mobile');assert.ok(await b.ev('document.documentElement.scrollWidth<=innerWidth+1'));
 });
 await b.check('Report grading is visible; company and mentor score independently and student sees final result',async()=>{
  await b.viewport(1440);await login(company);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait("document.body.textContent.includes('Chưa có báo cáo để chấm điểm')");
  await b.wait("[...document.querySelectorAll('button')].some(x=>x.textContent.includes('Chấm điểm / nhận xét KPI 1') && x.disabled)");await b.screenshot('reports-before-student-submits');
  await api('POST','/core/tasks',{assignmentId:placement._id,title:'TEST not submitted yet',dueDate:h.futureDate(2)});
  await login(student);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.click('button','Nộp báo cáo theo kỳ');
  await b.wait(`document.querySelector('[aria-label="Chọn công việc đã làm / đã nộp"] option[value="${task._id}"]')`);
  assert.equal(await b.ev("[...document.querySelector('[aria-label=\"Chọn công việc đã làm / đã nộp\"]').options].some(o=>o.textContent.includes('TEST not submitted yet'))"),false);
  await b.field('Chọn công việc đã làm / đã nộp',String(task._id));
  assert.equal(await b.ev("document.querySelector('[aria-label=\"Tiêu đề báo cáo theo kỳ\"]').value"),'TEST UI React task');assert.ok((await b.ev("document.querySelector('[aria-label=\"Nội dung báo cáo theo kỳ\"]').value")).includes('TEST revised delivery from browser'));await b.screenshot('report-task-dropdown-filled');
  await b.field('Tiêu đề báo cáo theo kỳ','TEST UI weekly grading report');await b.field('Nội dung báo cáo theo kỳ','TEST report submitted separately from task delivery');
  await b.field('Chọn công việc đã làm / đã nộp','');await b.field('Chọn công việc đã làm / đã nộp',String(task._id));assert.equal(await b.ev("document.querySelector('[aria-label=\"Tiêu đề báo cáo theo kỳ\"]').value"),'TEST UI weekly grading report');
  await b.submit('Nộp phiên bản báo cáo');
  const Report=require(path.join(root,'server/src/models/BusinessModels')).Report;
  for(const [who,score,comment]of [[company,80,'TEST company report feedback'],[mentor,90,'TEST mentor report feedback']]){
   await login(who);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait("document.body.textContent.includes('TEST UI weekly grading report')");await b.click('button','Chấm điểm / nhận xét');await b.field('Điểm báo cáo (0–100)',String(score));await b.field('Nhận xét báo cáo theo kỳ',comment);await b.submit('Lưu đánh giá báo cáo');await b.wait(`document.body.textContent.includes(${JSON.stringify(comment)})`);
   const report=await Report.findOne({title:'TEST UI weekly grading report'}).lean();assert.ok(report.reviews.some(r=>r.role===who.user.role&&r.score===score&&r.comment===comment));
  }
  await b.screenshot('mentor-report-grading-complete');await b.session(admin.token);await b.wait("document.querySelector('[data-nav=core-reports]')");await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait("document.body.textContent.includes('TEST UI weekly grading report')");await b.click('button','Chốt kết quả báo cáo');await b.field('Lý do chốt kết quả','TEST approve both independent scores');await b.submit('Chốt kết quả');
  assert.equal((await Report.findOne({title:'TEST UI weekly grading report'})).finalScore,85);
  await login(student);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait("document.body.textContent.includes('85/100') && document.body.textContent.includes('TEST company report feedback') && document.body.textContent.includes('TEST mentor report feedback')");await b.screenshot('student-report-results');
 });
 await b.check('Company and mentor get three assessment choices; incorrect/revision outcomes remain distinct to student',async()=>{
  const Report=require(path.join(root,'server/src/models/BusinessModels')).Report;
  for(const [who,decision,label]of [[company,'incorrect','Sai'],[mentor,'need_revision','Cần chỉnh sửa lại']]){
   const report=await api('POST','/core/reports',{assignmentId:placement._id,kind:'weekly',title:'TEST three choices '+decision,content:'TEST content requiring a new assessment'},student);
   await login(who);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait(`document.body.textContent.includes(${JSON.stringify(report.title)})`);await b.click('button','Chấm điểm / nhận xét');
   assert.deepEqual(await b.ev("[...document.querySelector('[aria-label=\"Kết quả đánh giá báo cáo\"]').options].map(o=>o.textContent)"),['Đồng ý','Cần chỉnh sửa lại','Sai']);
   await b.field('Điểm báo cáo (0–100)','0');await b.field('Kết quả đánh giá báo cáo',decision);await b.field('Nhận xét báo cáo theo kỳ','TEST explain '+decision);await b.screenshot('report-assessment-'+decision);await b.submit('Lưu đánh giá báo cáo');
   const saved=await Report.findById(report._id).lean();assert.equal(saved.reviews[0].decision,decision);assert.equal(saved.state,'need_revision');assert.equal(saved.finalScore,null);
   await login(student);await b.nav('core-reports');await b.field('Phân công theo kỳ',placement._id);await b.wait(`document.querySelector('[data-status=${decision}]')?.textContent===${JSON.stringify(label)}`);
  }
 });
 assert.equal(b.exceptions.length,0,JSON.stringify(b.exceptions));const result=b.result();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));if(result.tests.some(t=>t.status!=='PASS'))process.exitCode=1;console.log('Evidence: '+out);
 }finally{if(b)await b.close().catch(()=>{});vite?.kill();browser?.kill();await h.stop();}
})().catch(e=>{console.error(e.message);process.exitCode=1});

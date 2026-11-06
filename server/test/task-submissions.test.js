process.env.USER_ID_BUSINESS_ENABLED='true';process.env.EMAIL_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers'),User=require('../src/models/User'),Task=require('../src/models/Task'),Assignment=require('../src/models/Assignment');
const {signToken}=require('../src/services/authService'),{ensureProfile}=require('../src/services/accountProfiles');
let company,mentor,student,foreignStudent,foreignCompany,admin,placement;
const api=(method,path,body,actor=company)=>h.api(method,path,{body,token:actor.token});
const ok=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r.body));return r.body;};
async function actor(role,label){const user=await User.create({name:'TEST '+label,role,loginEmail:label+'@example.invalid',passwordHash:'TEST fixture only; never used to log in'});await ensureProfile(user);return{user,token:signToken(user,'password')};}
before(async()=>{
 await h.start();company=await actor('company','company');mentor=await actor('mentor','mentor');student=await actor('student','student');foreignStudent=await actor('student','other');foreignCompany=await actor('company','other-company');admin=await actor('admin','admin');
 const topic=ok(await api('POST','/core/topics',{title:'TEST delivery topic',description:'TEST',kpis:[{title:'Deliver',description:'TEST',weightPercent:100,deadline:h.futureDate(5)}]}),201);
 const batch=ok(await api('POST','/core/batches',{code:'TEST_TASK_SUBMIT',name:'TEST batch',startDate:new Date(Date.now()-864e5).toISOString(),endDate:h.futureDate(20),status:'open'},admin),201);
 placement=ok(await api('POST','/core/placements',{topicId:topic._id,batchId:batch._id,studentUserId:String(student.user._id),mentorUserId:String(mentor.user._id),startDate:new Date(Date.now()-60000).toISOString(),endDate:h.futureDate(10)},admin),201);
 placement=ok(await api('PATCH','/core/placements/'+placement._id,{lifecycle:'approved',reason:'TEST',version:placement.__v},admin));placement=ok(await api('PATCH','/core/placements/'+placement._id,{lifecycle:'active',reason:'TEST',version:placement.__v}));
});after(h.stop);
async function task(){return ok(await api('POST','/core/tasks',{assignmentId:placement._id,title:'TEST assigned task',description:'Build a result',priority:'urgent',dueDate:h.futureDate(2)}),201);}
async function submit(t,body={},who=student){return api('POST','/core/tasks/'+t._id+'/submit',{content:'TEST completed work',version:t.__v,...body},who);}
async function upload(t,{name='result.txt',data='TEST file bytes',content='',version=t.__v,explicitName}={},who=student){
 const body=new FormData();body.set('version',String(version));body.set('content',content);body.set('file',new Blob([data],{type:'application/octet-stream'}),name);
 if(explicitName!==undefined)body.set('fileName',explicitName);
 const r=await fetch(h.baseURL+'/core/tasks/'+t._id+'/submit',{method:'POST',headers:{Authorization:'Bearer '+who.token},body});return{status:r.status,body:await r.json()};
}
test('task delivery retains priority/deadline; student submits early, company reviews and completion persists',async()=>{
 const t=await task();assert.equal(t.priority,'urgent');assert.ok(t.dueDate);
 let submitted=ok(await submit(t,{link:'https://github.com/example/project'}));assert.equal(submitted.status,'review');assert.equal(submitted.progress,100);assert.equal(submitted.submission.late,false);assert.ok(submitted.submission.submittedAt);assert.equal(submitted.submissionFileData,undefined);
 assert.equal((await submit(submitted)).status,409);
 assert.equal((await api('PATCH','/core/tasks/'+submitted._id,{status:'done',progress:100,version:submitted.__v},student)).status,409);
 const reviewed=ok(await api('POST','/core/tasks/'+t._id+'/review',{decision:'approved',comment:'TEST accepted',version:submitted.__v}));assert.equal(reviewed.status,'done');assert.equal(reviewed.review.comment,'TEST accepted');assert.ok(reviewed.completedAt);
 const list=ok(await api('GET','/core/tasks?assignmentId='+placement._id,undefined,student));assert.equal(list.items.find(x=>x._id===t._id).submission.content,'TEST completed work');
});
test('mentor requests revision, student resubmits, history retains previous delivery',async()=>{
 let t=ok(await submit(await task()));t=ok(await api('POST','/core/tasks/'+t._id+'/review',{decision:'need_revision',comment:'TEST improve',version:t.__v},mentor));assert.equal(t.status,'in_progress');assert.equal(t.progress,99);
 t=ok(await submit(t,{content:'TEST revised work'}));assert.equal(t.review,null);assert.equal(t.submission.content,'TEST revised work');assert.ok(t.history.some(e=>e.action==='task.submitted'&&e.data.previous?.content==='TEST completed work'));
});
test('late submission uses server time and cannot inject timestamp or late flag',async()=>{
 const t=await task();await Task.updateOne({_id:t._id},{$set:{dueDate:new Date(Date.now()-1000)}});
 assert.equal((await submit(t,{submittedAt:'2020-01-01',late:false})).status,400);const r=ok(await submit(t));assert.equal(r.submission.late,true);
});
test('foreign users cannot submit/review/read attachments; student cannot approve or bypass submission',async()=>{
 const t=await task();assert.equal((await submit(t,{},foreignStudent)).status,404);assert.equal((await submit(t,{},company)).status,403);
 assert.equal((await api('PATCH','/core/tasks/'+t._id,{status:'done',progress:100,version:t.__v},student)).status,400);
 const s=ok(await submit(t));for(const [who,status]of [[student,403],[foreignCompany,404]])assert.equal((await api('POST','/core/tasks/'+t._id+'/review',{decision:'approved',comment:'TEST',version:s.__v},who)).status,status);
 const file=await fetch(h.baseURL+'/core/tasks/'+t._id+'/submission/file',{headers:{Authorization:'Bearer '+foreignStudent.token}});assert.equal(file.status,404);
});
test('file upload stores private bytes, supports authorized download and excludes bytes from lists',async()=>{
 const t=await task(),s=ok(await upload(t));assert.equal(s.submission.fileName,'result.txt');assert.equal(s.submissionFileData,undefined);
 const list=ok(await api('GET','/core/tasks'));assert.equal(list.items.find(x=>x._id===t._id).submissionFileData,undefined);
 for(const who of [student,company,mentor]){const r=await fetch(h.baseURL+'/core/tasks/'+t._id+'/submission/file',{headers:{Authorization:'Bearer '+who.token}});assert.equal(r.status,200);assert.equal(await r.text(),'TEST file bytes');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('content-disposition'),/^attachment/);}
 const reviewed=ok(await api('POST','/core/tasks/'+t._id+'/review',{decision:'need_revision',comment:'TEST redo',version:s.__v}));const fresh=ok(await submit(reviewed));assert.equal(fresh.submission.fileName,'');assert.equal((await Task.findById(t._id).select('+submissionFileData')).submissionFileData,null);
});
test('invalid/oversized files, empty delivery, unsafe links and stale versions do not change the task',async()=>{
 const t=await task();assert.equal((await upload(t,{name:'result.exe'})).status,415);assert.equal((await upload(t,{data:Buffer.alloc(5*1024*1024+1)})).status,413);
 assert.equal((await submit(t,{content:'',link:''})).status,400);assert.equal((await submit(t,{link:'javascript:alert(1)'})).status,400);assert.equal((await submit(t,{version:5})).status,409);assert.equal((await Task.findById(t._id)).status,'todo');
 const results=await Promise.all([submit(t),submit(t)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});
test('assignment must be active for creation and submission',async()=>{
 const t=await task();await Assignment.updateOne({_id:placement._id},{$set:{lifecycle:'approved'}});
 assert.equal((await submit(t)).status,409);assert.equal((await api('POST','/core/tasks',{assignmentId:placement._id,title:'TEST blocked',priority:'high',dueDate:h.futureDate(1)})).status,409);
 await Assignment.updateOne({_id:placement._id},{$set:{lifecycle:'active'}});
});
test('Vietnamese filenames survive multipart decoding, explicit UTF-8 fields and download headers',async()=>{
 const name='Báo cáo buổi đầu tiên đi làm.txt';
 for(const explicitName of [undefined,name]){
  const t=await task(),s=ok(await upload(t,{name,explicitName,data:'Nội dung tiếng Việt'}));assert.equal(s.submission.fileName,name);
  const r=await fetch(h.baseURL+'/core/tasks/'+t._id+'/submission/file',{headers:{Authorization:'Bearer '+company.token}});assert.ok(r.headers.get('content-disposition').includes(encodeURIComponent(name)));
 }
});
test('authorized text/PDF/image previews work and foreign preview requests are blocked',async()=>{
 const t=await task();ok(await upload(t,{data:'Nội dung tiếng Việt <script>alert(1)</script>'}));
 let r=await api('GET','/core/tasks/'+t._id+'/submission/preview');const preview=ok(r);assert.equal(preview.kind,'text');assert.equal(preview.text,'Nội dung tiếng Việt <script>alert(1)</script>');
 assert.equal((await api('GET','/core/tasks/'+t._id+'/submission/preview',undefined,foreignCompany)).status,404);
 for(const [name,data,mime]of [['result.pdf',require('./cvDocuments').guardedPdf(),'application/pdf'],['result.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS8sAAAAASUVORK5CYII=','base64'),'image/png']]){
  const doc=await task();ok(await upload(doc,{name,data}));const response=await fetch(h.baseURL+'/core/tasks/'+doc._id+'/submission/preview',{headers:{Authorization:'Bearer '+company.token}});assert.equal(response.status,200);assert.ok(response.headers.get('content-type').startsWith(mime));assert.deepEqual(Buffer.from(await response.arrayBuffer()),data);
 }
 const fake=await task();ok(await upload(fake,{name:'fake.pdf',data:'<html>not a PDF</html>'}));assert.equal((await api('GET','/core/tasks/'+fake._id+'/submission/preview')).status,415);
 const zip=await task();ok(await upload(zip,{name:'source.zip'}));assert.equal((await api('GET','/core/tasks/'+zip._id+'/submission/preview')).status,415);
});
test('DOCX preview extracts actual private text without an external document viewer',async()=>{
 const program="import zipfile,io,sys\nb=io.BytesIO()\nwith zipfile.ZipFile(b,'w') as z:\n z.writestr('[Content_Types].xml','<Types/>')\n z.writestr('word/document.xml','<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>TEST private Word delivery</w:t></w:r></w:p></w:body></w:document>')\nsys.stdout.buffer.write(b.getvalue())";
 const generated=require('node:child_process').spawnSync(process.env.CV_PARSER_PYTHON||'python',['-B','-c',program],{windowsHide:true});assert.equal(generated.status,0);
 const t=await task();ok(await upload(t,{name:'report.docx',data:generated.stdout}));const preview=ok(await api('GET','/core/tasks/'+t._id+'/submission/preview'));assert.ok(preview.text.includes('TEST private Word delivery'));
});

process.env.CORE_BUSINESS_ENABLED='true';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {h,setup}=require('./coreFixtures');const {CV,Application,NotificationReceipt}=require('../src/models/BusinessModels');
let f,jd,application;
before(async()=>{f=await setup();});after(h.stop);
const cvBody={title:'TEST CV',skills:['React'],summary:'TEST actual profile',education:'TEST university',experience:'TEST experience',version:null};
test('CV owner CRUD has version validation, private storage and strict fields',async()=>{
 assert.equal((await h.api('PUT','/core/cv',{token:f.company.token,body:cvBody})).status,403);
 let r=await h.api('PUT','/core/cv',{token:f.student.token,body:cvBody});assert.equal(r.status,201);
 assert.equal((await h.api('GET','/core/cv',{token:f.foreignStudent.token})).body,null);
 assert.equal((await h.api('PUT','/core/cv',{token:f.student.token,body:{...cvBody,gpa:5,version:r.body.__v}})).status,400);
 assert.equal((await h.api('PUT','/core/cv',{token:f.student.token,body:{...cvBody,ownerWallet:f.foreignStudent.address,version:r.body.__v}})).status,400);
 r=await h.api('PUT','/core/cv',{token:f.student.token,body:{...cvBody,summary:'TEST saved revision',version:r.body.__v}});assert.equal(r.status,200);assert.equal(r.body.__v,1);
 assert.equal((await h.api('PUT','/core/cv',{token:f.student.token,body:{...cvBody,version:0}})).status,409);
});
async function upload(buffer,name,mime,token=f.student.token){const res=await fetch(h.baseURL+'/core/cv/file',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':mime,'X-CV-Filename':encodeURIComponent(name)},body:buffer});return{status:res.status,body:await res.json()};}
const docxMime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
function docx({external=false,macro=false,xml='TEST CV React developer'}={}){
 const program=`import zipfile,io,sys\nb=io.BytesIO()\nwith zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:\n z.writestr('[Content_Types].xml','<Types/>')\n z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${xml}</w:t></w:r></w:p></w:body></w:document>')\n ${external?"z.writestr('word/_rels/document.xml.rels','<Relationships><Relationship TargetMode=\"External\" Target=\"https://example.invalid/\"/></Relationships>')":"pass"}\n ${macro?"z.writestr('word/vbaProject.bin',b'blocked')":"pass"}\nsys.stdout.buffer.write(b.getvalue())`;
 const p=spawnSync(process.env.CV_PARSER_PYTHON||'python',['-B','-c',program],{windowsHide:true});assert.equal(p.status,0,p.stderr.toString());return p.stdout;
}
function pdf(){const stream='BT /F1 12 Tf 40 740 Td (TEST CV React developer) Tj ET';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let data='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(data));data+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}const start=Buffer.byteLength(data);data+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return Buffer.from(data);}
test('CV DOCX extractor returns actual text; rejects MIME/magic/external/macro/oversize without writes',async()=>{
 let r=await upload(docx(),'test.docx',docxMime);assert.equal(r.status,200);assert.ok(r.body.extractedText.includes('TEST CV React developer'));assert.equal(r.body.parser,'docx-stdlib-v1');assert.equal(r.body.fileData,undefined);
 const before=JSON.stringify(await CV.findOne({ownerWallet:f.student.address}).lean());
 for(const [buffer,name,mime,status]of [[Buffer.from('not PDF'),'fake.pdf','application/pdf',422],[docx({external:true}),'external.docx',docxMime,422],[docx({macro:true}),'macro.docx',docxMime,422],[docx({xml:'TEST</w:t></w:r><w:r><w:instrText>DDEAUTO cmd</w:instrText></w:r><w:r><w:t>END'}),'dde.docx',docxMime,422],[docx(),'a.docx','text/plain',415],[Buffer.alloc(2*1024*1024+1),'big.pdf','application/pdf',413]]){r=await upload(buffer,name,mime);assert.equal(r.status,status,JSON.stringify(r.body));}
 assert.equal(JSON.stringify(await CV.findOne({ownerWallet:f.student.address}).lean()),before);
 assert.equal((await fetch(h.baseURL+'/core/cv/file',{headers:{Authorization:'Bearer '+f.foreignStudent.token}})).status,404);
});
test('PDF parser extracts actual fixture text, without AI or mock success',async()=>{
 const r=await upload(pdf(),'actual.pdf','application/pdf');assert.equal(r.status,200,JSON.stringify(r.body));assert.match(r.body.parser,/^pypdf-/);assert.ok(r.body.extractedText.includes('TEST CV React developer'));assert.equal(r.body.sha256.length,64);
});
test('valid structured PDF active content/decompression bomb and encrypted/scan documents are rejected without writes',async()=>{
 const {guardedPdf}=require('./cvDocuments');const before=JSON.stringify(await CV.findOne({ownerWallet:f.student.address}).lean());
 for(const opts of [{javascript:true},{bomb:true}]){const r=await upload(guardedPdf(opts),'blocked.pdf','application/pdf');assert.equal(r.status,422,JSON.stringify(r.body));}
 for(const encrypted of [false,true]){
  const program=`from pypdf import PdfWriter\nimport sys\nw=PdfWriter();w.add_blank_page(width=72,height=72)\n${encrypted?"w.encrypt('TEST_ONLY_ENCRYPTION')":"pass"}\nw.write(sys.stdout.buffer)`;
  const p=spawnSync(process.env.CV_PARSER_PYTHON||'python',['-B','-c',program],{windowsHide:true,env:{...process.env,PYTHONPATH:process.env.CV_PARSER_MODULE_PATH}});assert.equal(p.status,0,p.stderr.toString());assert.equal((await upload(p.stdout,'blocked.pdf','application/pdf')).status,422);
 }
 assert.equal(JSON.stringify(await CV.findOne({ownerWallet:f.student.address}).lean()),before);
});
test('JD draft/edit/publish/close checks owner, dates, search and pagination',async()=>{
 const body={title:'TEST JD React',description:'Real TEST job record',requirements:['React'],deadline:h.futureDate(10),slots:2,status:'closed'};
 let r=await h.api('POST','/core/jds',{token:f.company.token,body});assert.equal(r.status,201);jd=r.body;
 assert.equal((await h.api('GET','/core/jds',{token:f.student.token})).body.total,0);
 assert.equal((await h.api('PATCH','/core/jds/'+jd._id,{token:f.foreignCompany.token,body:{status:'open',version:0}})).status,404);
 r=await h.api('PATCH','/core/jds/'+jd._id,{token:f.company.token,body:{status:'open',version:jd.__v}});assert.equal(r.status,200);jd=r.body;
 assert.equal((await h.api('GET','/core/jds?q=React&limit=1',{token:f.student.token})).body.total,1);
 assert.equal((await h.api('GET','/core/jds?limit=101',{token:f.student.token})).status,400);
 assert.equal((await h.api('GET','/core/jds?status=closed',{token:f.student.token})).status,403);
});
test('applications persist immutable CV snapshot; concurrent duplicate succeeds only once',async()=>{
 const results=await Promise.all([1,2].map(()=>h.api('POST','/core/applications',{token:f.student.token,body:{jdId:jd._id,message:'TEST application'}})));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);application=results.find(r=>r.status===201).body;
 const cv=(await h.api('GET','/core/cv',{token:f.student.token})).body;
 await h.api('PUT','/core/cv',{token:f.student.token,body:{...cvBody,summary:'Changed AFTER application',version:cv.__v}});
 assert.equal((await Application.findById(application._id)).cvSnapshot.summary,'TEST saved revision');
 assert.equal((await h.api('GET','/core/applications',{token:f.foreignCompany.token})).body.total,0);
 assert.equal((await h.api('GET','/core/applications',{token:f.foreignStudent.token})).body.total,0);
 assert.equal((await h.api('GET','/core/applications',{token:f.mentor.token})).status,403);
});
test('application review notifies only recipient; read GET zero writes and explicit mark-read persists',async()=>{
 assert.equal((await h.api('PATCH','/core/applications/'+application._id,{token:f.foreignCompany.token,body:{status:'accepted',version:0,reason:'spoof'}})).status,404);
 assert.equal((await h.api('PATCH','/core/applications/'+application._id,{token:f.student.token,body:{status:'accepted',version:0,reason:'self'}})).status,400);
 const r=await h.api('PATCH','/core/applications/'+application._id,{token:f.company.token,body:{status:'accepted',reason:'TEST accepted',version:application.__v}});assert.equal(r.status,200);
 let n=await h.api('GET','/core/notifications',{token:f.student.token});assert.equal(n.body.unread,1);const notice=n.body.items[0];
 assert.equal(await NotificationReceipt.countDocuments(),0);await h.api('GET','/core/notifications',{token:f.student.token});assert.equal(await NotificationReceipt.countDocuments(),0);
 assert.equal((await h.api('PATCH','/core/notifications/'+notice.id+'/read',{token:f.foreignStudent.token,body:{}})).status,404);
 assert.equal((await h.api('PATCH','/core/notifications/'+notice.id+'/read',{token:f.student.token,body:{}})).status,200);
 assert.equal((await h.api('GET','/core/notifications',{token:f.student.token})).body.unread,0);
 assert.equal((await h.api('PATCH','/core/applications/'+application._id,{token:f.company.token,body:{status:'rejected',reason:'terminal',version:r.body.__v}})).status,409);
});
test('closed JD blocks new applications, no implicit assignments or NFT',async()=>{
 let r=await h.api('PATCH','/core/jds/'+jd._id,{token:f.company.token,body:{status:'closed',version:jd.__v}});assert.equal(r.status,200);
 assert.equal((await h.api('POST','/core/applications',{token:f.foreignStudent.token,body:{jdId:jd._id}})).status,409);
 assert.equal(await require('../src/models/Assignment').countDocuments(),0);
});
module.exports={docx,pdf};

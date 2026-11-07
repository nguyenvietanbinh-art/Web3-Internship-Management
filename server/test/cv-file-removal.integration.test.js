Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',WEB3_LOCAL_ENABLED:'false',MONGODB_URI:'mongodb://127.0.0.1:27018/internova_role_qa_20261107?replicaSet=internovaTestRs',JWT_SECRET:require('crypto').randomBytes(32).toString('hex')});
process.env.WORKFLOW_TEST_URI_ALLOWLIST=process.env.MONGODB_URI;
const {test,before,after}=require('node:test'),assert=require('assert/strict'),mongoose=require('mongoose');
mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const User=require('../src/models/User'),{CV}=require('../src/models/BusinessModels'),{signToken}=require('../src/services/authService');
let student,other,company,cv,otherCv,server,base;
before(async()=>{
 require('../src/config/workflowTestGuard').assertWorkflowTest();await mongoose.connect(process.env.MONGODB_URI,{autoIndex:false,autoCreate:false});
 assert.equal(mongoose.connection.name,'internova_role_qa_20261107');assert.equal((await mongoose.connection.db.command({hello:1})).setName,'internovaTestRs');assert.ok(await mongoose.connection.db.collection('qa_safety_marker').findOne({_id:'role-workflow'}));
 const run=Date.now(),passwordHash=await require('bcryptjs').hash(require('crypto').randomBytes(24).toString('hex'),12);[student,other,company]=await User.create(['student','student','company'].map((role,i)=>({role,passwordHash,name:'TEST file removal '+run+' '+i,email:run+'-'+i+'-remove@example.invalid',loginEmail:run+'-'+i+'-remove@example.invalid'})));
 const file={title:'Existing CV',summary:'Keep summary',skills:['Node.js'],education:'Keep education',experience:'Keep experience',gpa:3.2,fileName:'test.docx',fileData:Buffer.from('TEST fixture bytes'),mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',sha256:'test-fixture-hash',extractedText:'Old extracted content',parser:'test-fixture'};
 cv=await CV.create({...file,ownerUserId:student._id});otherCv=await CV.create({...file,ownerUserId:other._id});
 await new Promise(resolve=>{server=require('../src/app').createApp().listen(0,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port+'/api/core/cv/file';
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await mongoose.disconnect();});
const remove=(user,body)=>fetch(base,{method:'DELETE',headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+signToken(user,'password')}:{})},body:JSON.stringify(body)});
test('authentication and student role required',async()=>{assert.equal((await remove(null,{version:0})).status,401);assert.equal((await remove(company,{version:0})).status,403);});
test('rejects stale version and arbitrary target ID without removing files',async()=>{
 assert.equal((await remove(student,{version:99})).status,409);assert.equal((await remove(student,{version:0,cvId:String(otherCv._id)})).status,400);
 assert.ok((await CV.findById(cv._id).select('+fileData')).fileData);
});
test('removes only owned file fields and preserves manual data and other student',async()=>{
 const response=await remove(student,{version:0});assert.equal(response.status,200);const saved=await response.json();assert.equal(saved.summary,'Keep summary');assert.deepEqual(saved.skills,['Node.js']);assert.equal(saved.gpa,3.2);assert.equal(saved.__v,1);assert.equal(saved.history.at(-1).action,'cv.file_removed');
 const stored=await CV.findById(cv._id).select('+fileData').lean();for(const key of ['fileData','fileName','mime','sha256','extractedText','parser'])assert.equal(stored[key],undefined,key);
 assert.ok((await CV.findById(otherCv._id).select('+fileData')).fileData);assert.equal((await fetch(base,{headers:{Authorization:'Bearer '+signToken(student,'password')}})).status,404);
 assert.equal((await remove(student,{version:1})).status,404);
});

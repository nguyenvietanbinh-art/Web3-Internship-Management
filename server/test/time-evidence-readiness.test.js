'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {configuration,failure}=require('../src/services/timeEvidenceReadiness');
const env={APP_ENV:'CLOUD_DEMO',CLOUD_WEB3_ENABLED:'true',CLOUD_WEB3_WRITE_ENABLED:'true',WEB3_LOCAL_READ_ONLY:'false',CLOUD_CUSTODY_ENABLED:'true'};
test('Cloud configuration gates never report missing recipient for disabled/read-only runtime',()=>{
 assert.equal(configuration({...env,CLOUD_WEB3_ENABLED:'false'},true).code,'CHAIN_NOT_CONFIGURED');
 assert.equal(configuration({...env,CLOUD_WEB3_WRITE_ENABLED:'false'},true).code,'CHAIN_READ_ONLY');
 assert.equal(configuration(env,false).code,'CHAIN_NOT_CONFIGURED');
 assert.equal(configuration({...env,CLOUD_CUSTODY_ENABLED:'false'},true).code,'CLOUD_CUSTODY_DISABLED');
 assert.equal(configuration(env,true).code,'READY');
});
test('recipient missing, mapping and key failures remain distinct without leaking error details',()=>{
 for(const code of ['CUSTODY_RECIPIENT_REQUIRED','CLOUD_STUDENT_MAPPING','CLOUD_RECIPIENT_CONFLICT','CLOUD_RECIPIENT_DECRYPT_REJECTED']){
  const result=failure({code,message:'secret-content'});assert.equal(result.code,code);assert.ok(!result.message.includes('secret-content'));
 }
 assert.notEqual(failure({code:'CLOUD_STUDENT_MAPPING'}).message,failure({code:'CUSTODY_RECIPIENT_REQUIRED'}).message);
});

test('public readiness exposes stable status names without changing detailed codes',()=>{
 assert.equal(configuration({...env,CLOUD_WEB3_ENABLED:'false'},true).status,'CLOUD_NOT_CONFIGURED');
 assert.equal(configuration({...env,WEB3_LOCAL_READ_ONLY:'true'},true).status,'READ_ONLY');
 assert.equal(failure({code:'CUSTODY_RECIPIENT_REQUIRED'}).status,'RECIPIENT_MISSING');
 assert.equal(configuration(env,true).status,'READY');
});

test('time evidence GET enforces role middleware and placement scope before reading sessions',async()=>{
 const {mock}=require('node:test'),express=require('express');
 const Assignment=require('../src/models/Assignment'),{WorkSession}=require('../src/models/BusinessModels');
 const identity=require('../src/services/businessIdentity'),{errorHandler}=require('../src/middleware/errorHandler');
 const handles=[];let queried=0,server;
 try{
  handles.push(mock.method(identity,'owned',(_u,idField)=>({[idField]:'company-scope'})));
  handles.push(mock.method(Assignment,'findOne',async filter=>{assert.equal(filter.companyUserId,'company-scope');return null;}));
  handles.push(mock.method(WorkSession,'find',()=>{queried++;throw Error('must not read sessions');}));
  const app=express();app.use((req,_res,next)=>{req.user={role:req.get('x-test-role')};next();});app.use('/core',require('../src/core/web3'));app.use(errorHandler);
  await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});
  for(const [role,status] of [['student',403],['mentor',403],['company',404]]){
   const r=await fetch('http://127.0.0.1:'+server.address().port+'/core/web3/placements/0123456789abcdef01234567/time-evidence',{headers:{'x-test-role':role}});assert.equal(r.status,status);const body=await r.text();assert.ok(!body.includes('privateKey'));
  }
  assert.equal(queried,0);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));for(const h of handles)h.mock.restore();}
});

// HTTP router unit tests: QR services are stubs here; no database is opened.
const {test,before,after,mock}=require('node:test'),assert=require('node:assert/strict');
Object.assign(process.env,{APP_ENV:'CLOUD_DEMO',NODE_ENV:'production',SCHOOL_WORKFLOW_ENABLED:'true',WEB3_LOCAL_ENABLED:'false'});
const express=require('express'),qr=require('../src/services/qrGps');
const {errorHandler,notFound}=require('../src/middleware/errorHandler');
let server,base,issued=0,redeemed=0;
before(async()=>{
 mock.method(qr,'issue',async()=>{issued++;return{sessionId:'unit-qr',token:'unit-token'};});
 mock.method(qr,'redeem',async()=>{redeemed++;return{qrVerified:true,chainStatus:'not_recorded'};});
 const app=express();app.use(express.json());app.use((req,_res,next)=>{req.user={role:req.get('x-test-role')||'company'};next();});
 app.use('/api/core',require('../src/core/web3'));app.use(notFound);app.use(errorHandler);
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port+'/api/core';
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));mock.restoreAll();});
async function post(path,role='company'){const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','x-test-role':role},body:'{}'});return{status:res.status,body:await res.json()};}
test('cloud QR issue/redeem dispatch independently of Hardhat guard and retain role middleware',async()=>{
 assert.equal((await post('/web3/qr/issue')).status,201);
 assert.equal((await post('/web3/qr/redeem','student')).status,200);
 assert.equal((await post('/web3/qr/issue','student')).status,403);
 assert.equal((await post('/web3/qr/redeem','company')).status,403);
 assert.equal(issued,1);assert.equal(redeemed,1);
});
test('every blockchain POST remains TEST-only on cloud before database or RPC calls',async()=>{
 const id='0123456789abcdef01234567';
 for(const path of [`/web3/reports/${id}/anchor`,`/web3/placements/${id}/time-evidence/anchor`,`/web3/time/${id}/anchor`,`/web3/placements/${id}/complete`,`/web3/placements/${id}/mint`,`/web3/operations/${id}/verify`,`/web3/operations/${id}/reconcile`]){
  const result=await post(path,'admin');assert.equal(result.status,503,path);assert.equal(result.body.code,'WEB3_TEST_ONLY',path);
 }
});
test('unrecognized web3 mutation is a 404, never a blanket exemption that dispatches business logic',async()=>{
 assert.equal((await post('/web3/qr/arbitrary-new-action')).status,404);assert.equal(issued,1);assert.equal(redeemed,1);
});

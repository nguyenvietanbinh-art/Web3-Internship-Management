const {test}=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),crypto=require('node:crypto'),path=require('node:path'),{spawn}=require('node:child_process');
const {MongoClient}=require('mongodb');const {testUriFromEnvironment,assertTestEnvironment}=require('./testEnvironment');
test('real src/index.js boots only after indexes ready on fresh exact-allowlisted TEST, loopback health/readiness pass',{timeout:20000},async()=>{
 const uri=testUriFromEnvironment();assertTestEnvironment({nodeEnv:'test',uri,allowlistedUri:uri});const probe=new MongoClient(uri);await probe.connect();assert.equal((await probe.db().listCollections().toArray()).length,0);await probe.close();
 const socket=net.createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
 const child=spawn(process.execPath,[path.join(__dirname,'../src/index.js')],{windowsHide:true,env:{...process.env,NODE_ENV:'test',MONGODB_URI:uri,MONGODB_URI_TEST_ALLOWLIST:uri,CORE_BUSINESS_ENABLED:'true',PORT:String(port),HOST:'127.0.0.1',JWT_SECRET:crypto.randomBytes(32).toString('hex'),PINATA_JWT:'',CHAIN_LISTENER_ENABLED:'false'}});let log='';child.stdout.on('data',c=>{log+=c.toString();});child.stderr.on('data',c=>{log+=c.toString();});
 try{
  const until=Date.now()+15000;let response;
  while(Date.now()<until){if(child.exitCode!==null)throw Error('Startup process exited: '+log);try{response=await fetch(`http://127.0.0.1:${port}/api/health`);if(response.ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(response?.ok,log);assert.equal((await response.json()).dbState,'connected');assert.equal((await fetch(`http://127.0.0.1:${port}/api/ready`)).status,200);assert.equal((await(await fetch(`http://127.0.0.1:${port}/api/core/capabilities`)).json()).enabled,true);assert.ok(log.includes('Connected to MongoDB successfully'));
 }finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,3000).unref();});}
});

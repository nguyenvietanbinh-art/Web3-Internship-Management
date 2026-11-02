const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/evidence/google-auth-20261101');fs.mkdirSync(out,{recursive:true});
const {MongoClient}=require(path.join(root,'server/node_modules/mongodb'));
async function snapshot(){const c=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:5000});try{await c.connect();const databases=[];for(const name of ['web3_internship','web3_internship_demo_20261030_2340','web3_internship_demo_20261030_2340_foundation']){const cols=[];for(const {name:n} of(await c.db(name).listCollections().toArray()).sort((a,b)=>a.name.localeCompare(b.name))){const col=c.db(name).collection(n),docs=await col.find().sort({_id:1}).toArray();cols.push({name:n,count:docs.length,sha256:crypto.createHash('sha256').update(JSON.stringify(docs)).digest('hex'),indexes:await col.indexes()});}databases.push({name,collections:cols});}return{at:new Date().toISOString(),databases};}finally{await c.close();}}
function run(name,args,env=process.env){const r=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024,timeout:180000});fs.writeFileSync(path.join(out,name+'.txt'),(r.stdout||'')+(r.stderr||''));console.log(name+': exit '+r.status);return{exit:r.status,...(name==='backend'?{summary:(r.stdout||'').split('\n').filter(x=>/^# (tests|pass|fail|skipped|duration_ms)/.test(x))}:{})};}
(async()=>{
 const before=await snapshot();fs.writeFileSync(path.join(out,'protected-before.json'),JSON.stringify(before,null,2));
 const uri='mongodb://127.0.0.1:27017/web3_internship_test_phase1_google_final';
 const env={...process.env,NODE_ENV:'test',MONGODB_URI_TEST:uri,MONGODB_URI_TEST_ALLOWLIST:uri,
 WEB3_INTEGRATION_TESTS:'true',WEB3_TEST_DEPLOYMENT:path.join(root,'contracts/node_modules/.cache/phase5-20261031/deployment.json'),AI_SERVICE_URL_TEST:'http://127.0.0.1:8003',NLP_SERVICE_URL:'http://127.0.0.1:8003',NLP_INFERENCE_TESTS:'true',CV_PARSER_MODULE_PATH:path.join(root,'contracts/node_modules/.cache/phase3-20261031/python-deps')};
 const tests=fs.readdirSync(path.join(root,'server/test')).filter(f=>f.endsWith('.test.js')).map(f=>path.join('server/test',f));
 const backend=run('backend',['--test','--test-concurrency=1',...tests],env);
 const browser=run('browser',['client/test/google-auth.e2e.cjs'],{...env,WEB3_INTEGRATION_TESTS:'false'});
 const after=await snapshot();fs.writeFileSync(path.join(out,'protected-after.json'),JSON.stringify(after,null,2));
 const unchanged=JSON.stringify(before.databases)===JSON.stringify(after.databases);
 const result={at:new Date().toISOString(),backend,browser,protectedUnchanged:unchanged,comparison:'Full collection hashes, document counts and index definitions for three protected databases',googleRealE2E:'BLOCKED_NO_CLIENT_ID',dependency:'google-auth-library@11.3.2'};
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(backend.exit!==0||browser.exit!==0||!unchanged)process.exitCode=1;
})().catch(e=>{console.error(e.name);process.exitCode=1;});

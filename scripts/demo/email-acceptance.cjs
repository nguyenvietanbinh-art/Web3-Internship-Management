const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/evidence/email-auth-20261102');fs.mkdirSync(out,{recursive:true});
const {MongoClient}=require(path.join(root,'server/node_modules/mongodb'));
async function snapshot(){const c=new MongoClient('mongodb://127.0.0.1:27017');try{await c.connect();const data=[];for(const name of ['web3_internship','web3_internship_demo_20261030_2340','web3_internship_demo_20261030_2340_foundation']){const collections=[];for(const{name:n}of(await c.db(name).listCollections().toArray()).sort((a,b)=>a.name.localeCompare(b.name))){const col=c.db(name).collection(n),docs=await col.find().sort({_id:1}).toArray();collections.push({name:n,count:docs.length,sha256:crypto.createHash('sha256').update(JSON.stringify(docs)).digest('hex'),indexes:await col.indexes()});}data.push({name,collections});}return{time:new Date().toISOString(),databases:data};}finally{await c.close();}}
function run(name,args,env){const r=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:10*1024*1024});fs.writeFileSync(path.join(out,name+'.txt'),(r.stdout||'')+(r.stderr||''));console.log(name+' exit '+r.status);return{exit:r.status,summary:(r.stdout||'').split('\n').filter(x=>/^# (tests|pass|fail|skipped|duration_ms)/.test(x))};}
(async()=>{
 const before=await snapshot();fs.writeFileSync(path.join(out,'protected-before.json'),JSON.stringify(before,null,2));
 const uri='mongodb://127.0.0.1:27017/web3_internship_test_phase1_email_final';
 const env={...process.env,NODE_ENV:'test',EMAIL_AUTH_ENABLED:'false',GOOGLE_AUTH_ENABLED:'false',MONGODB_URI_TEST:uri,MONGODB_URI_TEST_ALLOWLIST:uri,WEB3_INTEGRATION_TESTS:'true',WEB3_TEST_DEPLOYMENT:path.join(root,'contracts/node_modules/.cache/phase5-20261031/deployment.json'),AI_SERVICE_URL_TEST:'http://127.0.0.1:8003',NLP_SERVICE_URL:'http://127.0.0.1:8003',NLP_INFERENCE_TESTS:'true',CV_PARSER_MODULE_PATH:path.join(root,'contracts/node_modules/.cache/phase3-20261031/python-deps')};
 const files=fs.readdirSync(path.join(root,'server/test')).filter(f=>f.endsWith('.test.js')).map(f=>path.join('server/test',f));
 const backend=run('backend',['--test','--test-concurrency=1',...files],env);
 const browser=run('email-browser',['client/test/email-auth.e2e.cjs'],env);
 const googleRegression=run('google-browser-regression',['client/test/google-auth.e2e.cjs'],env);
 const after=await snapshot();fs.writeFileSync(path.join(out,'protected-after.json'),JSON.stringify(after,null,2));
 const unchanged=JSON.stringify(before.databases)===JSON.stringify(after.databases),result={time:new Date().toISOString(),backend,browser,googleRegression,protectedUnchanged:unchanged,googleRequired:false,liveEmailDelivery:'NOT_IMPLEMENTED',source:'Actual node:test and CDP browser runs; no success mocks in email E2E'};
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if([backend,browser,googleRegression].some(x=>x.exit!==0)||!unchanged)process.exitCode=1;
})().catch(e=>{console.error(e.name);process.exitCode=1;});

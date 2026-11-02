// Controlled TEST deployment onto one existing TEST database. No copy/merge, seed of business data or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[2]||''),cache=path.join(root,'contracts/node_modules/.cache');if(!dir.startsWith(cache+path.sep)||fs.existsSync(path.join(dir,'runtime.json')))throw Error('Use a new ignored runtime evidence directory');
const uri=process.env.MONGODB_URI_TEST;require('../src/config/testDatabaseGuard').assertTestEnvironment({nodeEnv:process.env.NODE_ENV,uri,allowlistedUri:process.env.MONGODB_URI_TEST_ALLOWLIST});
Object.assign(process.env,{MONGODB_URI:uri,NODE_ENV:'test',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',CHAIN_LISTENER_ENABLED:'false',CHAIN_VERIFICATION_ENABLED:'false',WEB3_LOCAL_ENABLED:'true',WEB3_LOCAL_DEPLOYMENT:path.join(cache,'phase5-20261031/deployment.json'),JWT_SECRET:crypto.randomBytes(32).toString('hex'),CORS_ORIGIN:'http://localhost:5182',PINATA_JWT:'',REPORT_ENCRYPTION_KEY:'',IPFS_EXTERNAL_UPLOAD_ENABLED:'false',AI_SERVICE_URL:'http://127.0.0.1:8003',NLP_SERVICE_URL:'http://127.0.0.1:8003',CV_PARSER_MODULE_PATH:path.join(cache,'phase3-20261031/python-deps'),DEMO_MODE:'false'});
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);const {createApp}=require('../src/app'),{verifyIndexes}=require('../src/services/databaseSafety'),User=require('../src/models/User');
(async()=>{
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false});await verifyIndexes(true);const app=createApp();await new Promise((ok,no)=>{const server=app.listen(57407,'127.0.0.1',ok);server.on('error',no);});fs.mkdirSync(dir,{recursive:true});
 const meta={createdAt:new Date().toISOString(),pid:process.pid,database:mongoose.connection.name,baseURL:'http://localhost:57407/api',origin:'http://localhost:5182',unified:true,indexWritesOnStartup:false,googleLiveConfigured:Boolean(require('../src/config/env').googleEnabled),staffFixtures:false};
 fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify(meta,null,2),{flag:'wx'});
 if(process.argv.includes('--test-staff')&&await User.countDocuments({role:'admin'})===0){
  const accounts={};for(const role of ['admin','company','mentor'])accounts[role]={email:'qa-'+role+'-'+crypto.randomBytes(4).toString('hex')+'@internova.example.invalid',password:crypto.randomBytes(24).toString('base64url')};
  const {vault}=require(path.join(root,'scripts/demo/common.cjs'));fs.writeFileSync(path.join(dir,'staff.dpapi'),vault('protect',JSON.stringify({database:meta.database,accounts})),{flag:'wx'});
  const admin=await User.create({name:'TEST unified admin',email:accounts.admin.email,loginEmail:accounts.admin.email,passwordHash:await require('bcryptjs').hash(accounts.admin.password,12),role:'admin',identityHistory:[{action:'controlled.TEST.admin_bootstrap',at:new Date()}]});
  const token=require('../src/services/authService').signToken(admin,'password');
  for(const role of ['company','mentor']){const response=await fetch(meta.baseURL+'/core/accounts/email',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({name:'TEST unified '+role,email:accounts[role].email,password:accounts[role].password,role,reason:'Explicit controlled TEST role provisioning; no original/demo changes'})});if(!response.ok)throw Error('TEST staff provisioning failed: '+response.status);}
  fs.writeFileSync(path.join(dir,'staff-public.json'),JSON.stringify({database:meta.database,accounts:Object.fromEntries(Object.entries(accounts).map(([role,a])=>[role,{email:a.email,name:'TEST unified '+role}]))},null,2),{flag:'wx'});
  meta.staffFixtures=true;fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify(meta,null,2));
  console.log('Three explicit TEST staff accounts prepared; passwords protected with Windows DPAPI, not printed.');
 }
 console.log('UNIFIED READY '+meta.origin+'; database '+meta.database+'; no index/data migration on startup.');
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});

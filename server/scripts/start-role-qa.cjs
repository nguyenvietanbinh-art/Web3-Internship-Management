// Starts only the previously prepared, exact isolated QA database. No seed or index creation.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=path.resolve(__dirname,'../../contracts/node_modules/.cache/role-workflow-qa-20261107');
const uri='mongodb://127.0.0.1:27018/internova_role_qa_20261107?replicaSet=internovaTestRs';
const parserModules=path.resolve(__dirname,'../../contracts/node_modules/.cache/phase3-20261031/python-deps');if(!process.env.CV_PARSER_MODULE_PATH&&fs.existsSync(path.join(parserModules,'pypdf')))process.env.CV_PARSER_MODULE_PATH=parserModules;
if(!fs.existsSync(path.join(dir,'accounts.json')))throw Error('Run role-workflow.integration.test.js first to prepare isolated fixtures');
const {vault}=require('../../scripts/demo/common.cjs'),secretFile=path.join(dir,'session.dpapi');
let secret;if(fs.existsSync(secretFile))secret=vault('unprotect',fs.readFileSync(secretFile,'utf8'));else{secret=crypto.randomBytes(32).toString('hex');fs.writeFileSync(secretFile,vault('protect',secret),{flag:'wx'});}
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',GOOGLE_AUTH_ENABLED:'false',WEB3_LOCAL_ENABLED:'false',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,JWT_SECRET:secret,CORS_ORIGIN:'http://localhost:5189',NLP_SERVICE_URL:'http://127.0.0.1:8003',CHAIN_LISTENER_ENABLED:'false',CHAIN_VERIFICATION_ENABLED:'false',PINATA_JWT:'',REPORT_ENCRYPTION_KEY:'',DEMO_MODE:'false'});
const expected=require('../src/config/workflowTestGuard').assertWorkflowTest(),mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const deployment=process.argv[2]?path.resolve(process.argv[2]):path.join(dir,'sbt-deployment.json');
if(!deployment.startsWith(path.resolve(dir,'..')+path.sep))throw Error('QA deployment metadata must remain in the local ignored cache');
if(process.argv[2]&&!fs.existsSync(deployment))throw Error('Explicit QA deployment metadata does not exist');if(fs.existsSync(deployment)){process.env.WEB3_LOCAL_ENABLED='true';process.env.WEB3_LOCAL_DEPLOYMENT=deployment;}
(async()=>{
 await mongoose.connect(uri,{autoIndex:false,autoCreate:false,serverSelectionTimeoutMS:5000});
 if(mongoose.connection.name!==expected.database||(await mongoose.connection.db.command({hello:1})).setName!==expected.replicaSet||!await mongoose.connection.db.collection('qa_safety_marker').findOne({_id:'role-workflow'}))throw Error('QA database safety check failed');
 const server=require('../src/app').createApp().listen(57419,'127.0.0.1',()=>{fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify({pid:process.pid,backend:'http://localhost:57419/api',frontend:'http://localhost:5189',database:expected.database,startedAt:new Date().toISOString()},null,2));console.log('ROLE QA READY http://localhost:57419/api');});server.on('error',e=>{console.error(e.code);process.exitCode=1;void mongoose.disconnect();});
})().catch(e=>{console.error(e.message);process.exitCode=1;void mongoose.disconnect();});

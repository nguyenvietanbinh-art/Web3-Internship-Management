// Repair the already-created empty periods only. New period creation populates atomically.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const mode=process.argv[2],root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[3]||'');
if(!dir.startsWith(path.join(root,'contracts/node_modules/.cache')+path.sep))throw Error('Use ignored evidence directory');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'workflow-plan.json'))),uri=manifest.demoUri;
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri,JWT_SECRET:crypto.randomBytes(32).toString('hex')});require('../src/config/workflowTestGuard').assertWorkflowTest();
if(!uri.includes('/web3_internship_test_phase1_workflow_20261106_a?'))throw Error('Only the existing workflow demo is allowed');
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const User=require('../src/models/User'),{InternshipBatch:Batch}=require('../src/models/BusinessModels'),{Opportunity}=require('../src/workflow/models'),svc=require('../src/workflow/service'),catalog=require('../src/workflow/batchCatalog');
const file=path.join(dir,'batch-catalog-repair-plan.json'),resultFile=path.join(dir,'batch-catalog-repair-result.json');
(async()=>{try{await mongoose.connect(uri,{autoIndex:false,autoCreate:false});if((await mongoose.connection.db.command({hello:1})).setName!=='internovaTestRs')throw Error('Wrong topology');
 if(mode==='plan'){const targets=[];for(const batch of await Batch.find({status:'open',endDate:{$gt:new Date()}}).sort({_id:1}).lean())if(!await Opportunity.exists({batchId:batch._id}))targets.push({batchId:String(batch._id),code:batch.code,name:batch.name});fs.writeFileSync(file,JSON.stringify({uri,at:new Date().toISOString(),targets},null,2),{flag:'wx'});console.log(JSON.stringify({planOnly:true,emptyPeriods:targets.length,writes:0}));return;}
 if(mode!=='apply'||fs.existsSync(resultFile))throw Error('Use plan then apply once; no result overwrite');const plan=JSON.parse(fs.readFileSync(file));if(plan.uri!==uri)throw Error('Wrong target');const actor=await User.findOne({email:'admin-1@example.invalid',role:'admin',disabled:{$ne:true}});if(!actor)throw Error('Demo admin unavailable');const results=[];
 for(const target of plan.targets)results.push(await svc.transaction(async session=>{const batch=await svc.batch(target.batchId,session),result=await catalog.populate(actor,batch,session);if(result.created){batch.history.push(svc.event(actor,'batch_catalog_synchronized',{...result,reason:'Owner requested topics in already-created empty periods'}));await batch.save({session});}return {...target,...result};}));
 fs.writeFileSync(resultFile,JSON.stringify({at:new Date().toISOString(),database:mongoose.connection.name,sourceWrites:0,results},null,2),{flag:'wx'});console.log(JSON.stringify({sourceWrites:0,results}));
 }finally{await mongoose.disconnect();}})().catch(e=>{console.error(e.code||e.message);process.exitCode=1});

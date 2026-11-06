const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(process.argv[3]||''),root=path.resolve(__dirname,'../..');
if(!dir.startsWith(path.join(root,'contracts/node_modules/.cache')+path.sep))throw Error('Evidence path must be ignored');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'workflow-plan.json'))),mode=process.argv[2],target=process.argv[4];
if(!['demo','qa'].includes(target))throw Error('Choose demo or qa');
Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',CORE_BUSINESS_ENABLED:'true',MONGODB_URI:manifest[target+'Uri'],WORKFLOW_TEST_URI_ALLOWLIST:manifest[target+'Uri'],JWT_SECRET:crypto.randomBytes(32).toString('hex'),WEB3_LOCAL_ENABLED:'false',CHAIN_LISTENER_ENABLED:'false'});
const expected=require('../src/config/workflowTestGuard').assertWorkflowTest(),mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();require('../src/workflow/models');
const file=path.join(dir,target+'-index-plan.json');
(async()=>{try{await mongoose.connect(expected.uri,{autoIndex:false,autoCreate:false});const collections=await mongoose.connection.db.listCollections().toArray();if(collections.length)throw Error('Refuse nonempty/nonfresh workflow target; no collections deleted');
const plan={database:expected.database,uri:expected.uri,replicaSet:expected.replicaSet,models:Object.values(mongoose.models).map(m=>({name:m.modelName,collection:m.collection.name,indexes:m.schema.indexes()}))};const digest=crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex');
if(mode==='plan'){fs.writeFileSync(file,JSON.stringify({...plan,digest},null,2),{flag:'wx'});console.log('Plan only: '+target+'; '+plan.models.length+' model definitions; database writes 0');}
else if(mode==='apply'){const approved=JSON.parse(fs.readFileSync(file));if(approved.digest!==digest)throw Error('Plan/source/target changed');for(const model of Object.values(mongoose.models)){await model.createCollection();await model.createIndexes();}fs.writeFileSync(path.join(dir,target+'-ready.json'),JSON.stringify({uri:expected.uri,database:expected.database,replicaSet:expected.replicaSet,digest,at:new Date().toISOString()},null,2),{flag:'wx'});console.log('Explicit TEST collections/indexes prepared: '+expected.database);}
else throw Error('Use plan or apply');}finally{await mongoose.disconnect();}})().catch(e=>{console.error(e.message);process.exitCode=1});

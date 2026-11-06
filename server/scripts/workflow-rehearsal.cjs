// Native BSON + Windows DPAPI recovery rehearsal, NOT a mongodump archive.
// Restore is restricted to prefixed collections in the one approved QA database.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{MongoClient,BSON}=require('mongodb');
const mode=process.argv[2],root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[3]||'');
if(!dir.startsWith(path.join(root,'contracts/node_modules/.cache')+path.sep))throw Error('Use ignored workflow evidence directory');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'workflow-plan.json'))),{vault}=require('../../scripts/demo/common.cjs'),file=path.join(dir,'source-recovery.dpapi');
const source='mongodb://127.0.0.1:27017/web3_internship_test_phase1_khoa_20261106',qa='mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_qa_20261106_a?replicaSet=internovaTestRs';
if(plan.sourceProtected!==source||plan.qaUri!==qa)throw Error('Target mismatch');
const digest=docs=>{const h=crypto.createHash('sha256');for(const d of docs)h.update(BSON.serialize(d));return h.digest('hex');};
(async()=>{
 if(mode==='backup'){
  if(fs.existsSync(file))throw Error('Backup already exists; no overwrite');const c=new MongoClient(source);try{await c.connect();const collections=[];for(const {name}of await c.db().listCollections().toArray()){const docs=await c.db().collection(name).find({}).sort({_id:1}).toArray();collections.push({name,docs,indexes:await c.db().collection(name).indexes(),digest:digest(docs)});}const data=BSON.serialize({source,at:new Date(),collections});fs.writeFileSync(file,vault('protect',data.toString('base64')),{flag:'wx'});console.log(JSON.stringify({backup:'DPAPI protected native BSON',collections:collections.length,sourceWrites:0}));}finally{await c.close();}return;
 }
 if(mode!=='restore')throw Error('Use backup then restore');
 const archive=BSON.deserialize(Buffer.from(vault('unprotect',fs.readFileSync(file,'utf8')),'base64'));if(archive.source!==source)throw Error('Wrong backup source');
 Object.assign(process.env,{NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:qa,WORKFLOW_TEST_URI_ALLOWLIST:qa});require('../src/config/workflowTestGuard').assertWorkflowTest();
 const c=new MongoClient(qa);try{await c.connect();if((await c.db().command({hello:1})).setName!=='internovaTestRs')throw Error('Wrong topology');const prefix='recovery_20261106_',names=new Set((await c.db().listCollections().toArray()).map(x=>x.name));if(archive.collections.some(x=>names.has(prefix+x.name)))throw Error('Refuse overwrite of recovery or application collections');
 const results=[];for(const row of archive.collections){const name=prefix+row.name,col=await c.db().createCollection(name);if(row.docs.length)await col.insertMany(row.docs);for(const idx of row.indexes.filter(x=>x.name!=='_id_')){const {key,v,ns,...options}=idx;await col.createIndex(key,options);}const docs=await col.find({}).sort({_id:1}).toArray(),indexes=await col.indexes();results.push({collection:name,count:docs.length,contentMatches:digest(docs)===row.digest,indexCountMatches:indexes.length===row.indexes.length});}
 const result={at:new Date().toISOString(),sourceWrites:0,restoreDatabase:new URL(qa).pathname.slice(1),format:'native BSON / DPAPI; not mongodump',results,passed:results.every(x=>x.contentMatches&&x.indexCountMatches)};fs.writeFileSync(path.join(dir,'recovery-result.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({passed:result.passed,collections:results.length,sourceWrites:0}));if(!result.passed)process.exitCode=1;
 }finally{await c.close();}
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1});

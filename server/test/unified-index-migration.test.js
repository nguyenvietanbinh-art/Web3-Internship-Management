const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),{MongoClient}=require('mongodb');
const {testUriFromEnvironment}=require('./testEnvironment'),root=path.resolve(__dirname,'../..'),script=path.join(root,'server/scripts/unified-index-migration.cjs');
function target(){const uri=testUriFromEnvironment(),dir=path.join(root,'contracts/node_modules/.cache/unified-index-test-'+crypto.randomBytes(6).toString('hex'));return{uri,dir};}
function run(mode,t,extra=[]){return spawnSync(process.execPath,[script,mode,t.dir,...extra],{cwd:root,env:{...process.env,NODE_ENV:'test',MONGODB_URI_TEST:t.uri,MONGODB_URI_TEST_ALLOWLIST:t.uri},encoding:'utf8',windowsHide:true,timeout:30000});}
test('TEST migration dry-run performs zero writes; applying fresh indexes creates zero documents',async()=>{
 const t=target(),c=new MongoClient(t.uri);await c.connect();try{
  const plan=run('plan',t);assert.equal(plan.status,0,plan.stderr);assert.equal((await c.db().listCollections().toArray()).length,0);
  const withoutMaintenance=run('apply',t);assert.equal(withoutMaintenance.status,1);
  const applied=run('apply',t,['--maintenance']);assert.equal(applied.status,0,applied.stderr);
  for(const{name}of await c.db().listCollections().toArray())assert.equal(await c.db().collection(name).countDocuments(),0);
  const indexes=await c.db().collection('cvs').indexes();assert.ok(indexes.some(i=>i.key.ownerUserId===1&&i.unique&&i.partialFilterExpression.ownerUserId.$type==='objectId'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(t.dir,'index-applied.json'))).documentsDeleted,0);
 }finally{await c.close();}
});
test('nonempty legacy collection conflict refuses plan without changing documents or indexes',async()=>{
 const t=target(),c=new MongoClient(t.uri);await c.connect();try{
  const col=c.db().collection('cvs');await col.createIndex({ownerWallet:1},{unique:true});await col.insertOne({title:'TEST legacy immutable fixture',ownerWallet:require('ethers').Wallet.createRandom().address.toLowerCase()});
  const before={rows:await col.find().toArray(),indexes:await col.indexes()},result=run('plan',t);assert.equal(result.status,1);assert.match(result.stderr,/Nonempty collection index conflict/);assert.deepEqual(await col.find().toArray(),before.rows);assert.deepEqual(await col.indexes(),before.indexes);
 }finally{await c.close();}
});
test('migration refuses original/demo URI before any connection or output',()=>{
 for(const db of ['web3_internship','web3_internship_demo_20261030_2340']){const t={...target(),uri:'mongodb://127.0.0.1:27017/'+db},result=run('plan',t);assert.equal(result.status,1);assert.equal(fs.existsSync(path.join(t.dir,'index-plan.json')),false);assert.match(result.stderr,/Only an explicit local PHASE1 TEST database/);}
});

const test=require('node:test'),assert=require('node:assert/strict'),policy=require('../src/config/cloudDemoPolicy');
const env={APP_ENV:'CLOUD_DEMO',NODE_ENV:'production',SCHOOL_WORKFLOW_ENABLED:'true',CLOUD_DEMO_DB_NAME:'internova_cloud_demo',CLOUD_DEMO_CLUSTER_HOST:'internova.unit.mongodb.net',CLOUD_DEMO_REPLICA_SET:'atlas-unit-shard-0',CLOUD_DEMO_INSTANCE_ID:'cloud-unit-instance-0001',MONGODB_URI:'mongodb+srv://unit:unit@internova.unit.mongodb.net/internova_cloud_demo?retryWrites=true&w=majority'};
const hello={setName:env.CLOUD_DEMO_REPLICA_SET,isWritablePrimary:true,hosts:['internova-shard-00-00.unit.mongodb.net:27017']};
const marker={_id:'internova-cloud-demo-v1',environment:'CLOUD_DEMO',database:env.CLOUD_DEMO_DB_NAME,clusterHost:env.CLOUD_DEMO_CLUSTER_HOST,replicaSet:env.CLOUD_DEMO_REPLICA_SET,instanceId:env.CLOUD_DEMO_INSTANCE_ID};
test('exact draft cloud identity passes without network or database writes',()=>assert.equal(policy.identity(env,{databaseName:env.CLOUD_DEMO_DB_NAME,hello,marker}).database,'internova_cloud_demo'));
for(const key of Object.keys(env))test('missing '+key+' fails closed',()=>{const e={...env};delete e[key];assert.throws(()=>policy.configuration(e),{code:'CLOUD_DEMO_POLICY_REJECTED'});});
for(const [key,value]of Object.entries({NODE_ENV:'test',APP_ENV:'production',CLOUD_DEMO_DB_NAME:'internova_large_test_20261108',CLOUD_DEMO_CLUSTER_HOST:'different.mongodb.net',WORKFLOW_TEST_URI_ALLOWLIST:'present',WEB3_LOCAL_ENABLED:'true',CHAIN_LISTENER_ENABLED:'true',DEMO_MODE:'true'}))test('wrong or mixed '+key+' refused',()=>assert.throws(()=>policy.configuration({...env,[key]:value})));
for(const suffix of ['&tls=false','&tlsAllowInvalidCertificates=true','&retryWrites=false','&w=1','&unknown=true'])test('unsafe query '+suffix+' refused',()=>assert.throws(()=>policy.configuration({...env,MONGODB_URI:env.MONGODB_URI+suffix})));
test('local URI and wrong database refused',()=>{for(const uri of ['mongodb://127.0.0.1:27018/internova_cloud_demo',env.MONGODB_URI.replace('/internova_cloud_demo','/production')])assert.throws(()=>policy.configuration({...env,MONGODB_URI:uri}));});
test('unverified live identity or missing marker refused',()=>{for(const evidence of [{databaseName:'wrong',hello,marker},{databaseName:env.CLOUD_DEMO_DB_NAME,hello:{...hello,setName:'wrong'},marker},{databaseName:env.CLOUD_DEMO_DB_NAME,hello,marker:null},{databaseName:env.CLOUD_DEMO_DB_NAME,hello,marker:{...marker,instanceId:'wrong'}}])assert.throws(()=>policy.identity(env,evidence));});
test('cloud startup disables automatic schema writes; local TEST guard still refuses Atlas',()=>{
 assert.deepEqual(require('../src/services/databaseSafety').connectionOptions(env,env.MONGODB_URI),{autoIndex:false,autoCreate:false});
 assert.throws(()=>require('../src/config/workflowTestGuard').assertWorkflowTest(env));
 assert.throws(()=>require('../src/services/databaseSafety').connectionOptions(env,env.MONGODB_URI+'x'));
});

test('startup reads live identity and refuses a missing or mismatched environment marker',async()=>{
 const {verifyDatabaseIdentity}=require('../src/services/databaseSafety');
 const connection=(value)=>({name:env.CLOUD_DEMO_DB_NAME,db:{command:async()=>hello,collection:()=>({findOne:async()=>value})}});
 assert.equal((await verifyDatabaseIdentity(env,connection(marker))).instanceId,env.CLOUD_DEMO_INSTANCE_ID);
 await assert.rejects(()=>verifyDatabaseIdentity(env,connection(null)),{code:'CLOUD_DEMO_POLICY_REJECTED'});
 await assert.rejects(()=>verifyDatabaseIdentity(env,connection({...marker,replicaSet:'other'})),{code:'CLOUD_DEMO_POLICY_REJECTED'});
});

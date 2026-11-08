const test = require('node:test');
const assert = require('node:assert/strict');
const { assertBusinessWriteEnvironment: check } = require('../src/services/businessWriteEnvironment');
const cloud = { APP_ENV:'CLOUD_DEMO', NODE_ENV:'production', SCHOOL_WORKFLOW_ENABLED:'true', CLOUD_DEMO_DB_NAME:'internova_cloud_demo', CLOUD_DEMO_CLUSTER_HOST:'internova.unit.mongodb.net', CLOUD_DEMO_REPLICA_SET:'atlas-unit-shard-0', CLOUD_DEMO_INSTANCE_ID:'cloud-unit-instance-0001', MONGODB_URI:'mongodb+srv://unit:unit@internova.unit.mongodb.net/internova_cloud_demo?retryWrites=true&w=majority' };
const hello = {setName:cloud.CLOUD_DEMO_REPLICA_SET,isWritablePrimary:true,hosts:['shard.unit.mongodb.net:27017']};
const marker = {_id:'internova-cloud-demo-v1',environment:'CLOUD_DEMO',database:cloud.CLOUD_DEMO_DB_NAME,clusterHost:cloud.CLOUD_DEMO_CLUSTER_HOST,replicaSet:cloud.CLOUD_DEMO_REPLICA_SET,instanceId:cloud.CLOUD_DEMO_INSTANCE_ID};
const connection = (overrides={}) => ({readyState:1,name:cloud.CLOUD_DEMO_DB_NAME,db:{command:async()=>hello,collection:()=>({findOne:async()=>marker})},...overrides});
test('cloud business writes require live identity but no Hardhat, wallet, AI or IPFS configuration', async()=>{
 await check(cloud,connection());
});
test('cloud rejects disconnected DB, wrong DB/cluster/replica/marker and unsafe TLS before mutations', async()=>{
 const bad = [
  [cloud,connection({readyState:0})], [cloud,connection({name:'other'})],
  [{...cloud,CLOUD_DEMO_CLUSTER_HOST:'other.mongodb.net'},connection()],
  [{...cloud,CLOUD_DEMO_INSTANCE_ID:'other-instance-000000'},connection()],
  [{...cloud,CLOUD_DEMO_REPLICA_SET:'other-set'},connection()],
  [{...cloud,MONGODB_URI:cloud.MONGODB_URI+'&tls=false'},connection()],
  [cloud,connection({db:{command:async()=>hello,collection:()=>({findOne:async()=>null})}})],
 ];
 for (const [env,conn] of bad) await assert.rejects(()=>check(env,conn),{code:'BUSINESS_ENVIRONMENT_REJECTED'});
});
test('local workflow exact allowlist is preserved and checks the connected DB/replica', async()=>{
 const uri='mongodb://127.0.0.1:27018/web3_internship_test_phase1_workflow_qa_20261106_a?replicaSet=internovaTestRs';
 const env={NODE_ENV:'test',SCHOOL_WORKFLOW_ENABLED:'true',MONGODB_URI:uri,WORKFLOW_TEST_URI_ALLOWLIST:uri};
 const conn={readyState:1,name:new URL(uri).pathname.slice(1),db:{command:async()=>({setName:'internovaTestRs'})}};
 await check(env,conn);
 for (const changed of [{NODE_ENV:'production'},{WORKFLOW_TEST_URI_ALLOWLIST:''},{APP_ENV:'unknown'},{MONGODB_URI:uri.replace('_qa_','_unknown_')}]) await assert.rejects(()=>check({...env,...changed},conn));
 await assert.rejects(()=>check(env,{...conn,name:'internova_cloud_demo'}));
 await assert.rejects(()=>check(env,{...conn,db:{command:async()=>({setName:'wrong'})}}));
});
test('legacy TEST exact allowlist still works and rejects non-TEST / disconnected / mismatched database', async()=>{
 const uri='mongodb://127.0.0.1:27017/web3_internship_test_phase1_qr_unit';
 const env={NODE_ENV:'test',MONGODB_URI:uri,MONGODB_URI_TEST_ALLOWLIST:uri},conn={readyState:1,name:new URL(uri).pathname.slice(1)};
 await check(env,conn);
 await assert.rejects(()=>check({...env,NODE_ENV:'production'},conn));
 await assert.rejects(()=>check({...env,MONGODB_URI_TEST_ALLOWLIST:''},conn));
 await assert.rejects(()=>check(env,{...conn,name:'other'}));
});

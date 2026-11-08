// Cloud startup validates configuration before connecting and live identity before listen.
// No automatic schema changes, provisioning, or local test-guard bypass.
const DATABASE='internova_cloud_demo';
function fail(){const error=new Error('CLOUD_DEMO identity configuration rejected');error.code='CLOUD_DEMO_POLICY_REJECTED';throw error;}
function configuration(env){
 if(env.APP_ENV!=='CLOUD_DEMO'||env.NODE_ENV!=='production'||env.SCHOOL_WORKFLOW_ENABLED!=='true')fail();
 if(env.WORKFLOW_TEST_URI_ALLOWLIST||env.MONGODB_URI_TEST_ALLOWLIST||env.DEMO_MODE==='true'||env.WEB3_LOCAL_ENABLED==='true'||env.CHAIN_LISTENER_ENABLED==='true')fail();
 if(env.CLOUD_DEMO_DB_NAME!==DATABASE)fail();
 const host=env.CLOUD_DEMO_CLUSTER_HOST,set=env.CLOUD_DEMO_REPLICA_SET,instance=env.CLOUD_DEMO_INSTANCE_ID;
 if(typeof host!=='string'||!/^([a-z0-9-]+\.)+mongodb\.net$/.test(host)||!set||!/^[-a-zA-Z0-9_]{3,120}$/.test(set)||!instance||!/^[-a-zA-Z0-9_]{16,120}$/.test(instance))fail();
 let uri;try{uri=new URL(env.MONGODB_URI);}catch{fail();}
 if(uri.protocol!=='mongodb+srv:'||uri.hostname!==host||uri.port||uri.pathname!=='/'+DATABASE||uri.hash||!uri.username||!uri.password)fail();
 const allowed={retryWrites:'true',w:'majority',tls:'true',authSource:'admin',appName:'InternovaCloudDemo'};
 for(const [key,value]of uri.searchParams)if(allowed[key]!==value||uri.searchParams.getAll(key).length!==1)fail();
 if(uri.searchParams.get('retryWrites')!=='true'||uri.searchParams.get('w')!=='majority')fail();
 return Object.freeze({database:DATABASE,clusterHost:host,replicaSet:set,instanceId:instance});
}
function identity(env,{databaseName,hello,marker}){
 const expected=configuration(env);
 if(databaseName!==expected.database||hello?.setName!==expected.replicaSet||hello?.isWritablePrimary!==true||!Array.isArray(hello.hosts)||!hello.hosts.length)fail();
 if(hello.hosts.some(value=>!String(value).replace(/:\d+$/,'').endsWith('.mongodb.net')))fail();
 if(marker?._id!=='internova-cloud-demo-v1'||marker.environment!=='CLOUD_DEMO'||marker.database!==expected.database||marker.clusterHost!==expected.clusterHost||marker.replicaSet!==expected.replicaSet||marker.instanceId!==expected.instanceId)fail();
 return expected;
}
module.exports={configuration,identity};

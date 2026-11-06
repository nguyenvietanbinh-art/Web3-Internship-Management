const {assertTestEnvironment}=require('../config/testDatabaseGuard');
function connectionOptions(env,uri){
 const test=env.NODE_ENV==='test';
 if(test)assertTestEnvironment({nodeEnv:env.NODE_ENV,uri,allowlistedUri:env.MONGODB_URI_TEST_ALLOWLIST});
 return{autoIndex:test,autoCreate:test};
}
const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
async function verifyIndexes(coreEnabled=false){
 const models=[require('../models/User'),require('../models/AuthNonce'),require('../models/Attendance')];
 if(coreEnabled){const {CV,Application,WorkSession,Report,NotificationReceipt}=require('../models/BusinessModels');models.push(CV,Application,WorkSession,Report,NotificationReceipt,require('../models/Assignment'),require('../models/WorkLog'),require('../models/BatchRegistration'));}
 if(coreEnabled&&process.env.WEB3_LOCAL_ENABLED==='true'){const {ChainOperation,PrivateReportArtifact}=require('../models/Web3Models');models.push(ChainOperation,PrivateReportArtifact);}
 for(const Model of models){
  let actual;try{actual=await Model.collection.indexes();}catch{const e=new Error(`Cần kiểm tra/migration đã duyệt cho collection ${Model.collection.name}`);e.code='INDEX_REVIEW_REQUIRED';throw e;}
  for(const[keys,options]of Model.schema.indexes().filter(([,options])=>options.unique)){
   if(!actual.some(index=>index.unique===true&&JSON.stringify(index.key)===JSON.stringify(keys)&&stable(index.partialFilterExpression||{})===stable(options.partialFilterExpression||{})&&Boolean(index.sparse)===Boolean(options.sparse))){const e=new Error(`Thiếu unique index đã xác minh cho ${Model.collection.name}: ${Object.keys(keys).join(',')}`);e.code='INDEX_REVIEW_REQUIRED';throw e;}
  }
 }
 return{verified:true,models:models.map(m=>m.modelName)};
}
module.exports={connectionOptions,verifyIndexes};

// Durable store candidate; explicit provisioning only, never creates indexes at startup.
'use strict';
const crypto=require('node:crypto');
const states=new Set(['PREPARED','BROADCAST','CONFIRMED','FAILED','RECOVERY_REQUIRED']);
const fail=code=>Object.assign(new Error(code),{code});
const indexPlan=Object.freeze([{key:{issuer:1,operationId:1},options:{unique:true,name:'issuer_operation_unique'}},{key:{issuer:1,nonce:1},options:{unique:true,name:'issuer_nonce_unique'}}]);
function createStore({db,client,issuer,guard}){
 const transactions=db.collection('blockchain_transaction_journal'),leases=db.collection('blockchain_issuer_leases');
 async function ready(){if(typeof guard!=='function')throw fail('CLOUD_JOURNAL_GUARD_REQUIRED');await guard();const indexes=await transactions.indexes();for(const p of indexPlan)if(!indexes.some(i=>i.unique&&JSON.stringify(i.key)===JSON.stringify(p.key)))throw fail('CLOUD_JOURNAL_INDEX_REQUIRED');if((await db.listCollections({name:'blockchain_issuer_leases'},{nameOnly:true}).toArray()).length!==1)throw fail('CLOUD_JOURNAL_LEASE_COLLECTION_REQUIRED');}
 async function withIssuer(action){
  await ready();const token=crypto.randomUUID(),now=new Date();let lease;
  try{lease=await leases.findOneAndUpdate({_id:issuer,$or:[{until:{$lt:now}},{until:{$exists:false}}]},{$set:{token,until:new Date(+now+30000)}},{upsert:true,returnDocument:'after',writeConcern:{w:'majority',j:true}});}catch(e){if(e.code===11000)throw fail('CLOUD_JOURNAL_BUSY');throw e;}
  if(!lease||lease.token!==token)throw fail('CLOUD_JOURNAL_BUSY');
  async function fenced(session){const r=await leases.updateOne({_id:issuer,token,until:{$gt:new Date()}},{$set:{until:new Date(Date.now()+30000)}},{session});if(r.matchedCount!==1)throw fail('CLOUD_JOURNAL_LEASE_LOST');}
  async function atomic(action){const session=client.startSession();try{let result;await session.withTransaction(async()=>{await fenced(session);result=await action(session);},{readConcern:{level:'snapshot'},writeConcern:{w:'majority',j:true},readPreference:'primary'});return result;}finally{await session.endSession();}}
  const store={
   all:()=>transactions.find({issuer}).sort({nonce:1}).toArray(),
   load:operationId=>transactions.findOne({issuer,operationId}),
   fence:()=>atomic(async()=>true),
   prepare:row=>atomic(async session=>{if(row.state!=='PREPARED')throw fail('CLOUD_JOURNAL_STATE');const value={...row,issuer,revision:0,history:[{state:'PREPARED',at:new Date()}]};await transactions.insertOne(value,{session});return value;}),
   transition:(row,state,extra={})=>atomic(async session=>{if(!states.has(state))throw fail('CLOUD_JOURNAL_STATE');const next=await transactions.findOneAndUpdate({issuer,operationId:row.operationId,revision:row.revision},{$set:{...extra,state,updatedAt:new Date()},$inc:{revision:1},$push:{history:{state,at:new Date()}}},{session,returnDocument:'after'});if(!next)throw fail('CLOUD_JOURNAL_STALE');return next;}),
  };
  try{return await action(store);}finally{await leases.updateOne({_id:issuer,token},{$unset:{token:1},$set:{until:new Date(0)}},{writeConcern:{w:'majority',j:true}});}
 }
 return{ready,withIssuer};
}
module.exports={createStore,indexPlan};

// Phase A/B only: no HTTP routes, no startup hooks, no blockchain adapter.
'use strict';
const crypto=require('node:crypto'),{ObjectId}=require('mongoose').Types,{computeAddress,hexlify}=require('ethers');
const {failure}=require('./custodialVault');
const DATABASE='internova_custodial_test_ab_20261109';
const URI=`mongodb://127.0.0.1:27018/${DATABASE}?replicaSet=internovaTestRs`;
const COLLECTION='custodial_test_recipients';
function addressOf(bytes){try{return computeAddress(hexlify(bytes)).toLowerCase();}catch{throw failure('CUSTODY_SECRET_INVALID');}}
function authorize(actor){if(actor?.role!=='admin'||!/^[a-f0-9]{24}$/.test(actor?.userId||''))throw failure('CUSTODY_FORBIDDEN');}
function safe(doc){return{userId:String(doc.userId),studentId:String(doc.studentId),chainId:doc.chainId,address:doc.address,keyId:doc.envelope.keyId,keyVersion:doc.envelope.keyVersion};}
function createStore({db,vault,env=process.env}){
 async function guard(){
  if(env.NODE_ENV!=='test'||env.CUSTODIAL_LOCAL_TEST_ENABLED!=='true'||env.CUSTODIAL_TEST_URI!==URI||env.CUSTODIAL_TEST_URI_ALLOWLIST!==URI||db.databaseName!==DATABASE)throw failure('CUSTODY_TEST_ONLY');
  if((await db.command({hello:1})).setName!=='internovaTestRs'||!await db.collection('qa_safety_marker').findOne({_id:'custodial-ab-v1',synthetic:true,scope:'custodial-ab-only'}))throw failure('CUSTODY_TEST_ONLY');
 }
 async function actorAllowed(actor){authorize(actor);await guard();if(!await db.collection('users').findOne({_id:new ObjectId(actor.userId),role:'admin',disabled:{$ne:true}}))throw failure('CUSTODY_FORBIDDEN');}
 async function identity(userId){
  if(!/^[a-f0-9]{24}$/.test(userId||''))throw failure('CUSTODY_STUDENT_INVALID');
  const uid=new ObjectId(userId),user=await db.collection('users').findOne({_id:uid,role:'student',disabled:{$ne:true}}),student=await db.collection('students').findOne({userId:uid});
  if(!user||!student)throw failure('CUSTODY_STUDENT_INVALID');
  // Legacy identities/evidence require separate manual review; never replace a recipient.
  if(user.walletAddress||user.walletVerified||await db.collection('assignments').findOne({studentUserId:uid})||await db.collection('chain_operations').findOne({studentUserId:uid}))throw failure('CUSTODY_LEGACY_REVIEW_REQUIRED');
  return{userId:String(uid),studentId:String(student._id),chainId:31337};
 }
 function verified(doc,binding){if(String(doc.studentId)!==binding.studentId||doc.chainId!==31337)throw failure('CUSTODY_MAPPING_MISMATCH');const bytes=vault.decrypt(doc.envelope,binding);try{if(addressOf(bytes)!==doc.address)throw failure('CUSTODY_MAPPING_MISMATCH');return safe(doc);}finally{bytes.fill(0);}}
 return{
  async initialize(actor){await actorAllowed(actor);await db.collection(COLLECTION).createIndex({userId:1},{unique:true});await db.collection(COLLECTION).createIndex({studentId:1},{unique:true});await db.collection(COLLECTION).createIndex({address:1},{unique:true});},
  async provision(actor,userId){
   await actorAllowed(actor);const binding=await identity(userId),collection=db.collection(COLLECTION);
   // Fail closed if unique indexes were not explicitly provisioned for this isolated TEST.
   const indexes=await collection.indexes();for(const field of ['userId','studentId','address'])if(!indexes.some(i=>i.unique&&Object.keys(i.key).length===1&&i.key[field]===1))throw failure('CUSTODY_INDEX_REQUIRED');
   const existing=await collection.findOne({userId:new ObjectId(userId)});if(existing)return verified(existing,binding);
   const bytes=crypto.randomBytes(32);let address,envelope;
   try{address=addressOf(bytes);envelope=vault.encrypt(bytes,binding);}finally{bytes.fill(0);}
   const now=new Date(),doc={userId:new ObjectId(userId),studentId:new ObjectId(binding.studentId),chainId:31337,address,envelope,createdAt:now,history:[{action:'custody.test.provisioned',actorUserId:new ObjectId(actor.userId),at:now}]};
   try{await collection.insertOne(doc);return safe(doc);}catch(e){if(e.code!==11000)throw failure('CUSTODY_STORE_FAILED');const winner=await collection.findOne({userId:doc.userId});if(!winner||String(winner.studentId)!==binding.studentId)throw failure('CUSTODY_MAPPING_CONFLICT');return verified(winner,binding);}
  },
  async rotate(actor,userId){await actorAllowed(actor);const binding=await identity(userId),c=db.collection(COLLECTION),doc=await c.findOne({userId:new ObjectId(userId)});if(!doc||String(doc.studentId)!==binding.studentId)throw failure('CUSTODY_MAPPING_MISMATCH');
   const bytes=vault.decrypt(doc.envelope,binding);let envelope;try{if(addressOf(bytes)!==doc.address)throw failure('CUSTODY_MAPPING_MISMATCH');envelope=vault.encrypt(bytes,binding);}finally{bytes.fill(0);}
   if(doc.envelope.keyId===vault.activeKeyId&&doc.envelope.keyVersion===vault.activeVersion)return safe(doc);
   const r=await c.updateOne({_id:doc._id,'envelope.ciphertext':doc.envelope.ciphertext,'envelope.iv':doc.envelope.iv},{$set:{envelope},$push:{history:{action:'custody.test.reencrypted',actorUserId:new ObjectId(actor.userId),at:new Date()}}});if(r.modifiedCount!==1)throw failure('CUSTODY_CONCURRENT_UPDATE');return safe({...doc,envelope});
  },
 };
}
module.exports={createStore,DATABASE,URI,COLLECTION};

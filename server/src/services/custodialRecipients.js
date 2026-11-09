'use strict';
const crypto=require('node:crypto'),{Types:{ObjectId}}=require('mongoose'),{computeAddress,hexlify,isAddress}=require('ethers');
const {HttpError}=require('../utils/http');
const CD='internova_custodial_test_cd_20261109',TARGET='internova_large_test_20261108',COLLECTION='custodial_recipients';
const fail=code=>new HttpError(409,code,code);
function addressOf(b){try{return computeAddress(hexlify(b)).toLowerCase();}catch{throw fail('CUSTODY_SECRET_INVALID');}}
function publicRow(r){return{userId:String(r.userId),studentId:String(r.studentId),chainId:r.chainId,address:r.address,mode:r.mode,keyId:r.envelope?.keyId||null,keyVersion:r.envelope?.keyVersion||null};}
function createRecipients({db,vault,env=process.env}){
 async function guard(write=false){
  const name=db.databaseName,uri=`mongodb://127.0.0.1:27018/${name}?replicaSet=internovaTestRs`;
  if(env.NODE_ENV!=='test'||env.CUSTODIAL_LOCAL_TEST_ENABLED!=='true'||![CD,TARGET].includes(name)||env.MONGODB_URI!==uri||env.CUSTODIAL_TEST_URI_ALLOWLIST!==uri)throw fail('CUSTODY_TEST_SCOPE_REQUIRED');
  if(write&&name!==CD)throw fail('CUSTODY_TARGET_WRITE_NOT_APPROVED');
  if((await db.command({hello:1})).setName!=='internovaTestRs')throw fail('CUSTODY_REPLICA_MISMATCH');
  const marker=name===CD?{_id:'custodial-cd-v1',synthetic:true}:{_id:'large-v1',synthetic:true};
  if(!await db.collection('qa_safety_marker').findOne(marker))throw fail('CUSTODY_MARKER_MISMATCH');
 }
 async function inspect(userId){
  await guard();if(!/^[a-f0-9]{24}$/.test(String(userId)))throw fail('CUSTODY_BAD_USER');const uid=new ObjectId(String(userId));
  const user=await db.collection('users').findOne({_id:uid,role:'student',disabled:{$ne:true}}),students=await db.collection('students').find({userId:uid}).limit(2).toArray();
  if(!user||students.length!==1)throw fail('CUSTODY_INVALID_STUDENT');
  const student=students[0],assignments=await db.collection('assignments').find({$or:[{studentUserId:uid},{studentId:student._id}]}).toArray();
  if(assignments.some(a=>a.studentUserId&&String(a.studentUserId)!==String(uid)))throw fail('CUSTODY_IDENTITY_CONFLICT');
  const ops=await db.collection('chain_operations').find({$or:[{studentUserId:uid},{assignmentId:{$in:assignments.map(a=>a._id)}}]}).toArray();
  const addresses=new Set(ops.map(o=>o.studentWallet?.toLowerCase()).filter(Boolean));
  if(ops.some(o=>!isAddress(o.studentWallet||''))||addresses.size>1)throw fail('CUSTODY_HISTORY_CONFLICT');
  if(user.walletAddress){if(!isAddress(user.walletAddress)||user.walletVerified!==true)throw fail('CUSTODY_LEGACY_UNVERIFIED');addresses.add(user.walletAddress.toLowerCase());}
  const row=await db.collection(COLLECTION).findOne({userId:uid});
  if(row)addresses.add(row.address);
  if(addresses.size>1)throw fail('CUSTODY_HISTORY_CONFLICT');
  return{uid,user,student,row,legacy:!row&&addresses.size?[...addresses][0]:null,binding:{userId:String(uid),studentId:String(student._id),chainId:31337}};
 }
 function verify(row,binding){
  if(String(row.studentId)!==binding.studentId||row.chainId!==31337||!isAddress(row.address))throw fail('CUSTODY_MAPPING_CONFLICT');
  if(row.mode!=='custodial'||!row.envelope)throw fail('CUSTODY_MAPPING_CONFLICT');
  const bytes=vault.decrypt(row.envelope,binding);try{if(addressOf(bytes)!==row.address)throw fail('CUSTODY_MAPPING_CONFLICT');}finally{bytes.fill(0);}return publicRow(row);
 }
 return{guard,inspect,
  async initialize(){await guard(true);for(const f of ['userId','studentId','address'])await db.collection(COLLECTION).createIndex({[f]:1},{unique:true});},
  async read(userId){const x=await inspect(userId);if(x.row)return verify(x.row,x.binding);if(x.legacy)return{userId:String(x.uid),studentId:String(x.student._id),chainId:31337,address:x.legacy,mode:'legacy',keyId:null,keyVersion:null};return null;},
  async provision(userId){await guard(true);const x=await inspect(userId);if(x.row)return verify(x.row,x.binding);if(x.legacy)return{userId:String(x.uid),studentId:String(x.student._id),chainId:31337,address:x.legacy,mode:'legacy'};
   const c=db.collection(COLLECTION),indexes=await c.indexes();if(!['userId','studentId','address'].every(f=>indexes.some(i=>i.unique&&Object.keys(i.key).length===1&&i.key[f]===1)))throw fail('CUSTODY_INDEX_REQUIRED');
   const bytes=crypto.randomBytes(32);let address,envelope;try{address=addressOf(bytes);envelope=vault.encrypt(bytes,x.binding);}finally{bytes.fill(0);}
   if(await db.collection('users').findOne({walletAddress:address},{projection:{_id:1}}))throw fail('CUSTODY_ADDRESS_CONFLICT');
   const row={userId:x.uid,studentId:x.student._id,chainId:31337,address,mode:'custodial',envelope,createdAt:new Date(),schemaVersion:1};
   try{await c.insertOne(row);return publicRow(row);}catch(e){if(e.code!==11000)throw fail('CUSTODY_STORE_FAILED');const prior=await c.findOne({userId:x.uid});if(!prior)throw fail('CUSTODY_ADDRESS_CONFLICT');return verify(prior,x.binding);}
  },
 };
}
module.exports={createRecipients,CD,TARGET,COLLECTION};

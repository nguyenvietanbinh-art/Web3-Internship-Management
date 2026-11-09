const config=require('../config/env'),{HttpError}=require('../utils/http');
const enabled=()=>config.userIdBusiness;
const validWallet=u=>typeof u.walletAddress==='string'&&/^0x[a-f0-9]{40}$/.test(u.walletAddress)&&(!enabled()||u.walletVerified===true);
function owned(user,idField,walletField){
 if(!enabled())return validWallet(user)?{[walletField]:user.walletAddress}:{_id:{$in:[]}};
 const alternatives=[{[idField]:user._id}];
 if(validWallet(user))alternatives.push({[idField]:{$exists:false},[walletField]:user.walletAddress});
 return{$and:[{$or:alternatives}]};
}
function refs(user,idField,walletField){return{...(enabled()?{[idField]:user._id}:{}),...(validWallet(user)?{[walletField]:user.walletAddress}:{})};}
function belongs(doc,user,idField,walletField){return enabled()&&doc[idField]?String(doc[idField])===String(user._id):validWallet(user)&&doc[walletField]===user.walletAddress;}
function participants(a){const out={};for(const role of ['student','company','mentor'])for(const suffix of ['UserId','Wallet'])if(a[role+suffix]!==undefined)out[role+suffix]=a[role+suffix];return out;}
function personKey(a){const value=enabled()?a.studentUserId:a.studentWallet;if(!value)throw new HttpError(409,'Thiếu danh tính sinh viên đã xác minh','IDENTITY_MAPPING_REQUIRED');return String(value);}
async function chainAssignment(a){
 if(!enabled()||!a.studentUserId)return a;
 if((require('./custodialRuntime').enabled()||require('./cloudWeb3Runtime').selected())){
  const recipient=await require('./custodialRuntime').service().recipients.read(String(a.studentUserId));
  if(!recipient)throw new HttpError(409,'Chưa có địa chỉ nhận chứng nhận do hệ thống quản lý','CUSTODY_RECIPIENT_REQUIRED');
  return Object.assign(a,{studentWallet:recipient.address});
 }
 const user=await require('../models/User').findById(a.studentUserId);
 if(!user||!validWallet(user))throw new HttpError(409,'Chưa có địa chỉ nhận chứng nhận được hệ thống xác minh; liên hệ nhà trường','WALLET_LINK_REQUIRED');
 return Object.assign(a,{studentWallet:user.walletAddress}); // In-memory projection only; never backfill/replace ownership on GET.
}
module.exports={enabled,validWallet,owned,refs,belongs,participants,personKey,chainAssignment};

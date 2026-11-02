const identity=require('./businessIdentity');
const crypto=require('node:crypto'),jwt=require('jsonwebtoken');
const config=require('../config/env'),{HttpError}=require('../utils/http');
const {CoreQrSession}=require('../models/Web3Models'),{WorkSession}=require('../models/BusinessModels');
const policy=require('../core/placementPolicy'),v=require('../core/shared'),time=require('./timeTracking');
function number(x,min,max,label){if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw new HttpError(400,label+' không hợp lệ');return x;}
function distance(lat1,lon1,lat2,lon2){const rad=x=>x*Math.PI/180;const a=Math.sin(rad(lat2-lat1)/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(rad(lon2-lon1)/2)**2;return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));}
function validatePosition(position,session,now=Date.now()){
 v.keys(position,['latitude','longitude','accuracy','timestamp']);const lat=number(position.latitude,-90,90,'Vĩ độ'),lon=number(position.longitude,-180,180,'Kinh độ'),accuracy=number(position.accuracy,0.1,1000,'Sai sốGPS'),timestamp=number(position.timestamp,0,Number.MAX_SAFE_INTEGER,'TimestampGPS');
 if(now-timestamp>30000||timestamp-now>5000)throw new HttpError(400,'GPS quá cũ hoặc ở tương lai','GPS_STALE');
 if(accuracy>session.maxAccuracyMeters)throw new HttpError(400,'GPS chưa đủ chính xác; thử ngoài trời/gần tâm hơn','GPS_INACCURATE');
 const meters=distance(lat,lon,session.centerLat,session.centerLon);if(meters+accuracy>session.radiusMeters)throw new HttpError(400,'GPS và vùng sai số nằm ngoài phạm vi cho phép','GPS_OUT_OF_RANGE');
 return{distanceMeters:Math.round(meters*10)/10,accuracyMeters:accuracy,capturedAt:new Date(timestamp),clientClaim:true,spoofResistant:false};
}
async function issue(user,body){
 v.keys(body,['assignmentId','action','ttlSeconds','centerLat','centerLon','radiusMeters','maxAccuracyMeters']);if(user.role!=='company')throw new HttpError(403,'Chỉ doanh nghiệp tạo QR');
 const a=await policy.load(user,body.assignmentId,{active:true}),action=v.choice(body.action,['checkin','checkout'],'Thao tácQR'),ttl=v.integer(body.ttlSeconds===undefined?120:body.ttlSeconds,15,300,'TTL');
 const centerLat=number(body.centerLat,-90,90,'Vĩ độ tâm'),centerLon=number(body.centerLon,-180,180,'Kinh độ tâm'),radiusMeters=number(body.radiusMeters,20,300,'Bán kính'),maxAccuracyMeters=number(body.maxAccuracyMeters===undefined?50:body.maxAccuracyMeters,1,100,'Sai số tối đa');
 if(maxAccuracyMeters>radiusMeters)throw new HttpError(400,'Sai số tối đa không được lớn hơn bán kính');
 const nonce=crypto.randomBytes(24).toString('hex'),session=await CoreQrSession.create({assignmentId:a._id,...identity.participants(a),action,nonceHash:crypto.createHash('sha256').update(nonce).digest('hex'),expiresAt:new Date(Date.now()+ttl*1000),centerLat,centerLon,radiusMeters,maxAccuracyMeters,history:[v.event(user,'qr.issued',{action})]});
 const token=jwt.sign({sid:String(session._id),nonce,assignmentId:String(a._id),studentWallet:a.studentWallet,...(identity.enabled()?{studentUserId:String(a.studentUserId)}:{}),action},config.jwtSecret,{algorithm:'HS256',audience:'core-qr',issuer:'web3-internship',expiresIn:ttl});
 return{sessionId:session._id,token,expiresAt:session.expiresAt,action,radiusMeters,maxAccuracyMeters,gpsIsClientClaim:true};
}
async function redeem(user,body){
 v.keys(body,['token','position']);if(user.role!=='student')throw new HttpError(403,'Chỉ sinh viên dùng QR');if(typeof body.token!=='string'||body.token.length>4096)throw new HttpError(400,'QR không hợp lệ');
 let claims;try{claims=jwt.verify(body.token,config.jwtSecret,{algorithms:['HS256'],audience:'core-qr',issuer:'web3-internship'});}catch{throw new HttpError(400,'QR sai hoặc hết hạn','INVALID_QR');}
 if(identity.enabled()&&claims.studentUserId?claims.studentUserId!==String(user._id):!identity.validWallet(user)||claims.studentWallet!==user.walletAddress)throw new HttpError(403,'QR không dành cho tài khoản này');
 const s=await CoreQrSession.findById(v.id(claims.sid)).select('+nonceHash');if(!s||s.expiresAt<=new Date()||s.nonceHash!==crypto.createHash('sha256').update(String(claims.nonce)).digest('hex')||String(s.assignmentId)!==claims.assignmentId||s.action!==claims.action)throw new HttpError(400,'PhiênQR không hợp lệ','INVALID_QR');
 if(s.usedAt)throw new HttpError(409,'QR đã dùng','QR_REPLAY');
 const a=await policy.load(user,String(s.assignmentId),{active:true}),gps=validatePosition(body.position,s),now=new Date(),requestKey='qr_'+crypto.createHash('sha256').update(body.token).digest('hex');
 let open;
 if(s.action==='checkin'){if(await WorkSession.exists({...identity.owned(user,'studentUserId','studentWallet'),day:now.toISOString().slice(0,10)}))throw new HttpError(409,'Đã có phiên giờ làm hôm nay');}
 else{open=await WorkSession.findOne({assignmentId:a._id,...identity.owned(user,'studentUserId','studentWallet'),state:'open'});if(!open)throw new HttpError(409,'Chưa có phiên mở đểcheckout');}
 const consumed=await CoreQrSession.findOneAndUpdate({_id:s._id,usedAt:null,expiresAt:{$gt:now}},{$set:{usedAt:now},$push:{history:v.event(user,'qr.consumed',{action:s.action})}},{new:true});if(!consumed)throw new HttpError(409,'QR đã dùng','QR_REPLAY');
 try{
  let work;
  if(s.action==='checkin')work=await WorkSession.create({assignmentId:a._id,batchId:a.batchId,...identity.participants(a),day:now.toISOString().slice(0,10),activeStudent:a.studentWallet,...(identity.enabled()?{activeStudentUserId:a.studentUserId}:{}),requestKey,checkInAt:now,proof:{provider:'qr-gps-client',verified:false,qrSessionId:String(s._id),gps,checks:{qrSignature:true,nonce:true,gpsWithinPolicy:true}},history:[v.event(user,'time.qr_checked_in',{sessionId:s._id})]});
  else{
   let minutes=null,state='pending',reason='';try{if(now.toISOString().slice(0,10)!==open.day)throw Error('cross-day');minutes=time.duration(open.checkInAt,now);}catch{state='needs_adjustment';reason='Khoảng giờ cần doanh nghiệp xử lý';}
   work=await WorkSession.findOneAndUpdate({_id:open._id,__v:open.__v,state:'open'},{$set:{checkOutAt:now,minutes,state,reason,'proof.checkoutSessionId':String(s._id),'proof.checkoutGps':gps},$unset:{activeStudent:1,activeStudentUserId:1},$inc:{__v:1},$push:{history:v.event(user,'time.qr_checked_out',{sessionId:s._id})}},{new:true,runValidators:true});if(!work)throw new HttpError(409,'Phiên vừa thay đổi');
  }
  return{workSession:time.view(work),qrVerified:true,gpsWithinPolicy:true,gpsIsClientClaim:true,chainStatus:'not_recorded'};
 }catch(error){
  const recovered=s.action==='checkin'?await WorkSession.findOne({requestKey}):await WorkSession.findOne({'proof.checkoutSessionId':String(s._id)});
  if(recovered)return{workSession:time.view(recovered),qrVerified:true,gpsWithinPolicy:true,gpsIsClientClaim:true,recovered:true,chainStatus:'not_recorded'};
  // Only unconsume after proving no business write committed; unknown DB errors leave nonce consumed.
  if(error instanceof HttpError||[11000].includes(error.code)||error.name==='ValidationError')await CoreQrSession.updateOne({_id:s._id,usedAt:now},{$set:{usedAt:null},$push:{history:v.event(user,'qr.business_write_rejected')}});
  throw error;
 }
}
module.exports={issue,redeem,validatePosition,distance};

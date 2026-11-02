const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Session = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const { HttpError, isWallet, normalizeWallet, isObjectId } = require('../utils/http');
const { relation } = require('../middleware/permissions');
const audience = 'attendance', issuer = 'web3-internship';
const day = (date = new Date()) => date.toISOString().slice(0, 10);
function response(session) {
  const hash=jwt.sign({sessionId:String(session._id),nonce:session.nonce,companyWallet:session.companyWallet,
    studentWallet:session.studentWallet,topicId:String(session.topicId),iat:Math.floor(session.createdAt.getTime()/1000),
    exp:Math.floor(session.expiresAt.getTime()/1000)},config.jwtSecret,{algorithm:'HS256',audience,issuer});
  return {session:String(session._id),date:day(session.createdAt),hash,validUntil:session.expiresAt.toISOString(),
    studentWallet:session.studentWallet,topicId:session.topicId,locationVerified:false,chainStatus:'not_recorded'};
}
async function issue(user, body) {
  if(user.role!=='company')throw new HttpError(403,'Chỉ công ty tạo phiên QR');
  if(!isWallet(body.studentWallet)||!isObjectId(body.topicId))throw new HttpError(400,'Cần sinh viên và đề tài hợp lệ');
  const topic=await relation({studentWallet:body.studentWallet,companyWallet:user.walletAddress,topicId:body.topicId,user});
  if(!['assigned','in_progress'].includes(topic.status))throw new HttpError(409,'Phân công không còn hoạt động');
  const ttl=body.ttlSeconds===undefined?120:Number(body.ttlSeconds);
  if(!Number.isInteger(ttl)||ttl<15||ttl>300)throw new HttpError(400,'Phiên QR phải có hạn từ 15 đến 300 giây');
  const session=await Session.create({companyWallet:user.walletAddress,studentWallet:normalizeWallet(body.studentWallet),
    topicId:topic._id,nonce:crypto.randomBytes(24).toString('hex'),expiresAt:new Date(Date.now()+ttl*1000)});
  return response(session);
}
async function current(user) {
  const session=await Session.findOne({companyWallet:user.walletAddress,usedAt:null,expiresAt:{$gt:new Date()},createdAt:{$gte:new Date(day()+'T00:00:00Z')}}).select('+nonce').sort({createdAt:-1});
  if(!session)throw new HttpError(404,'Chưa có phiên QR hợp lệ','QR_SESSION_NOT_FOUND');
  return response(session);
}
async function checkIn(user, token) {
  if(typeof token!=='string'||token.length>4096)throw new HttpError(400,'QR không hợp lệ','INVALID_QR');
  let p;
  try{p=jwt.verify(token,config.jwtSecret,{algorithms:['HS256'],audience,issuer});}
  catch{throw new HttpError(400,'QR sai chữ ký hoặc đã hết hạn','INVALID_QR');}
  if(!isObjectId(p.sessionId)||p.studentWallet!==user.walletAddress)throw new HttpError(403,'QR không dành cho sinh viên này');
  const session=await Session.findById(p.sessionId).select('+nonce');
  if(!session||session.expiresAt<=new Date()||day(session.createdAt)!==day()||session.nonce!==p.nonce||session.studentWallet!==user.walletAddress||session.companyWallet!==p.companyWallet||String(session.topicId)!==p.topicId)throw new HttpError(400,'Phiên QR không còn hợp lệ','INVALID_QR');
  if(session.usedAt)throw new HttpError(409,'QR đã được sử dụng','QR_REPLAY');
  const topic=await relation({studentWallet:user.walletAddress,companyWallet:session.companyWallet,topicId:session.topicId,user});
  if(!['assigned','in_progress'].includes(topic.status))throw new HttpError(409,'Phân công không còn hoạt động');
  if(await Attendance.exists({studentWallet:user.walletAddress,date:day()}))throw new HttpError(409,'Bạn đã điểm danh hôm nay','ALREADY_CHECKED_IN');
  const now=new Date();
  const consumed=await Session.findOneAndUpdate({_id:session._id,usedAt:null,expiresAt:{$gt:now}},{$set:{usedAt:now}},{new:true});
  if(!consumed)throw new HttpError(409,'QR đã được sử dụng','QR_REPLAY');
  try{
    const attendance=await Attendance.create({studentWallet:user.walletAddress,studentName:user.name,companyWallet:session.companyWallet,
      date:day(now),checkInTime:now,status:now.getHours()<=9?'on_time':'late',qrCodeHash:crypto.createHash('sha256').update(token).digest('hex'),
      note:'Phiên QR đã xác thực; chưa xác minh GPS hoặc blockchain'});
    return {success:true,message:'Đã ghi nhận điểm danh qua phiên QR',attendance,locationVerified:false,chainStatus:'not_recorded'};
  }catch(error){
    if(error.code===11000)throw new HttpError(409,'Bạn đã điểm danh hôm nay','ALREADY_CHECKED_IN');
    await Session.updateOne({_id:session._id,usedAt:now},{$set:{usedAt:null}});
    throw error;
  }
}
module.exports={issue,current,checkIn};

const crypto=require('node:crypto'),bcrypt=require('bcryptjs'),User=require('../models/User');
const {HttpError}=require('../utils/http'),v=require('../core/shared');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function configuration(){
 const origin=process.env.PASSWORD_RESET_PUBLIC_ORIGIN,key=process.env.RESEND_API_KEY,from=process.env.PASSWORD_RESET_FROM;
 let url;try{url=new URL(origin);}catch{throw new HttpError(503,'Chưa cấu hình địa chỉ đặt lại mật khẩu','RESET_EMAIL_UNAVAILABLE');}
 if(url.origin!==origin||url.username||url.password||!(url.protocol==='https:'||(process.env.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:'))||!key||!from||/[\r\n]/.test(from))throw new HttpError(503,'Chưa cấu hình dịch vụ email đặt lại mật khẩu','RESET_EMAIL_UNAVAILABLE');
 return {origin,key,from};
}
function recipient(user){
 if(!user.passwordHash)throw new HttpError(409,'Tài khoản không có mật khẩu nội bộ. Sử dụng phương thức đăng nhập đã liên kết.','NO_INTERNAL_PASSWORD');
 const email=user.loginEmail;
 if(!email||!user.passwordEmailVerifiedAt&&!(user.googleSubject&&user.googleEmail===email))throw new HttpError(409,'Email đăng nhập chưa được xác minh; chưa thể gửi liên kết đặt lại.','RESET_EMAIL_NOT_VERIFIED');
 return email;
}
async function sendMail({to,link},cfg){
 let response;try{response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'},body:JSON.stringify({from:cfg.from,to:[to],subject:'Đặt lại mật khẩu Internova',text:'Nhà trường đã khởi tạo yêu cầu đặt lại mật khẩu. Liên kết dùng một lần, hết hạn sau 15 phút:\n'+link+'\nNếu không mong đợi yêu cầu này, hãy liên hệ nhà trường.'})});}catch{throw new HttpError(503,'Không gửi được email. Hãy kiểm tra dịch vụ email.','RESET_EMAIL_UNAVAILABLE');}
 if(!response.ok)throw new HttpError(503,'Dịch vụ email chưa tiếp nhận yêu cầu.','RESET_EMAIL_UNAVAILABLE');
}
async function request(actor,id,{delivery=sendMail,config=configuration}={}){
 if(actor.role!=='admin')throw new HttpError(403,'Chỉ nhà trường được khởi tạo đặt lại mật khẩu');
 const user=await User.findById(v.id(id)).select('+passwordHash +loginEmail +googleSubject +googleEmail +passwordReset');
 if(!user)throw new HttpError(404,'Không có tài khoản');
 // Peer admins cannot reset another administrator. An admin can recover their own password only.
 if(user.role==='admin'&&String(user._id)!==String(actor._id))throw new HttpError(403,'Không được đặt lại mật khẩu quản trị viên khác','PROTECTED_ADMIN');
 if(user.disabled)throw new HttpError(409,'Tài khoản đang bị khóa');
 const to=recipient(user),cfg=config(),now=new Date(),token=crypto.randomBytes(32).toString('hex'),tokenHash=digest(token);
 const saved=await User.findOneAndUpdate({_id:user._id,role:user.role,authVersion:user.authVersion,passwordHash:user.passwordHash,disabled:{$ne:true},$or:[{'passwordReset.requestedAt':{$exists:false}},{'passwordReset.requestedAt':{$lte:new Date(now-60000)}}]},{$set:{passwordReset:{digest:tokenHash,requestedAt:now,expiresAt:new Date(+now+900000),requestedBy:actor._id,authVersion:user.authVersion,deliveryState:'pending'}},$push:{auditHistory:v.event(actor,'password.reset_requested',{targetUserId:String(user._id),result:'pending_delivery'})}},{new:true});
 if(!saved)throw new HttpError(429,'Vui lòng chờ ít nhất một phút trước khi gửi lại');
 try{
  await delivery({to,link:cfg.origin+'/#password-reset='+token},cfg);
  const delivered=await User.updateOne({_id:user._id,'passwordReset.digest':tokenHash,'passwordReset.deliveryState':'pending'},{$set:{'passwordReset.deliveryState':'sent'},$push:{auditHistory:v.event(actor,'password.reset_delivery',{targetUserId:String(user._id),result:'accepted_by_provider'})}});
  if(delivered.modifiedCount!==1)throw new HttpError(409,'Yêu cầu đã thay đổi; hãy thử lại');
 }catch(error){await User.updateOne({_id:user._id,'passwordReset.digest':tokenHash},{$set:{'passwordReset.deliveryState':'failed'},$unset:{'passwordReset.digest':1},$push:{auditHistory:v.event(actor,'password.reset_delivery',{targetUserId:String(user._id),result:'failed'})}});throw error;}
 return {message:'Dịch vụ email đã tiếp nhận liên kết đặt lại mật khẩu.',expiresInMinutes:15};
}
async function complete(body){
 v.keys(body,['token','newPassword','confirmPassword']);
 if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))throw new HttpError(400,'Liên kết không hợp lệ hoặc đã hết hạn');
 const password=require('../routes/email.routes').validatePassword(body.newPassword);
 if(password!==body.confirmPassword)throw new HttpError(400,'Mật khẩu xác nhận không khớp');
 const filter={'passwordReset.digest':digest(body.token),'passwordReset.deliveryState':'sent','passwordReset.expiresAt':{$gt:new Date()},disabled:{$ne:true},passwordHash:{$type:'string'}};
 const user=await User.findOne(filter).select('+passwordHash +passwordReset');
 if(!user||user.authVersion!==user.passwordReset.authVersion)throw new HttpError(400,'Liên kết đã hết hạn hoặc đã sử dụng');
 if(user.role==='admin'&&String(user.passwordReset.requestedBy)!==String(user._id))throw new HttpError(403,'Yêu cầu không còn được phép cho tài khoản quản trị');
 if(await bcrypt.compare(password,user.passwordHash))throw new HttpError(400,'Mật khẩu mới cần khác mật khẩu hiện tại');
 const changed=await User.updateOne({...filter,_id:user._id,authVersion:user.authVersion,passwordHash:user.passwordHash},{$set:{passwordHash:await bcrypt.hash(password,12)},$unset:{passwordReset:1},$inc:{authVersion:1},$push:{identityHistory:{action:'password.reset_completed',at:new Date()},auditHistory:v.event({_id:user._id,role:user.role},'password.reset_completed',{targetUserId:String(user._id),result:'success'})}});
 if(changed.modifiedCount!==1)throw new HttpError(400,'Liên kết đã hết hạn hoặc đã sử dụng');
 return {message:'Đã đặt lại mật khẩu. Hãy đăng nhập lại; các phiên cũ đã hết hiệu lực.'};
}
async function adminSet(actor,id,body){
 if(actor.role!=='admin')throw new HttpError(403,'Chỉ nhà trường được đặt lại mật khẩu');
 v.keys(body,['mode','newPassword','confirmPassword','version','reason','confirmed']);
 if(body.confirmed!==true)throw new HttpError(400,'Cần xác nhận đặt lại mật khẩu');
 const mode=v.choice(body.mode,['manual','convention'],'Cách đặt mật khẩu'),reason=v.text(body.reason,'Lý do',{required:false,max:1000});
 v.integer(body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
 const user=await User.findById(v.id(id)).select('+passwordHash');
 if(!user)throw new HttpError(404,'Không có tài khoản');
 if(user.role==='admin'&&String(user._id)!==String(actor._id))throw new HttpError(403,'Không được đặt lại mật khẩu quản trị viên khác','PROTECTED_ADMIN');
 if(!user.passwordHash)throw new HttpError(409,'Tài khoản không có mật khẩu nội bộ; sử dụng phương thức đăng nhập đã liên kết.','NO_INTERNAL_PASSWORD');
 if(user.disabled)throw new HttpError(409,'Tài khoản đang bị khóa');
 let next;
 if(mode==='manual'){
  next=require('../routes/email.routes').validatePassword(body.newPassword);
  if(next!==body.confirmPassword)throw new HttpError(400,'Mật khẩu xác nhận không khớp');
 }else{
  if(body.newPassword!==undefined||body.confirmPassword!==undefined)throw new HttpError(400,'Không gửi mật khẩu khi chọn quy ước');
  if(user.role==='student'){
   const student=await require('../models/Student').findOne({userId:user._id}).select('studentCode');
   if(!student?.studentCode)throw new HttpError(409,'Sinh viên chưa có mã số sinh viên; hãy nhập mật khẩu mới.');
   next=require('../routes/email.routes').validatePassword(student.studentCode);
  }else if(user.role==='company')next='12345678';
  else throw new HttpError(400,'Vai trò này cần nhập mật khẩu mới');
 }
 const saved=await User.updateOne({_id:user._id,role:user.role,...v.versionMatch(body.version),passwordHash:user.passwordHash,authVersion:user.authVersion,disabled:{$ne:true}},{$set:{passwordHash:await bcrypt.hash(next,12)},$unset:{passwordReset:1},$inc:{authVersion:1,__v:1},$push:{identityHistory:{action:'password.admin_reset',at:new Date()},auditHistory:v.event(actor,'password.admin_reset',{targetUserId:String(user._id),mode,reason,result:'success'})}});
 if(saved.modifiedCount!==1)throw new HttpError(409,'Tài khoản đã thay đổi; tải lại trước khi đặt mật khẩu','STALE_VERSION');
 return {message:'Đã đặt lại mật khẩu. Các phiên đăng nhập cũ của tài khoản đã hết hiệu lực.'};
}
module.exports={request,complete,recipient,configuration,adminSet};

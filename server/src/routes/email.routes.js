const router=require('express').Router(),bcrypt=require('bcryptjs'),crypto=require('node:crypto');
const User=require('../models/User'),Challenge=require('../models/IdentityChallenge'),config=require('../config/env');
const {requireAuth}=require('../middleware/auth'),{signToken}=require('../services/authService'),{ensureProfile}=require('../services/accountProfiles');
const {asyncHandler,HttpError,isWallet}=require('../utils/http'),{ethers}=require('ethers');
const {keys}=require('../core/shared');
const invalid=()=>new HttpError(401,'Email hoặc mật khẩu không đúng','INVALID_CREDENTIALS');
const dto=u=>({_id:u._id,name:u.name,email:u.email||'',role:u.role,walletAddress:u.walletAddress||null,emailVerified:false,passwordEnabled:true,authProvider:'password',__v:u.__v||0});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const dummy=bcrypt.hashSync(crypto.randomBytes(32).toString('hex'),12);
function email(value){if(typeof value!=='string'||value.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))throw new HttpError(400,'Email không hợp lệ');return value.trim().toLowerCase();}
function password(value){if(typeof value!=='string'||value.length<10||!value.trim()||value.includes('\0')||Buffer.byteLength(value,'utf8')>72)throw new HttpError(400,'Mật khẩu cần ít nhất 10 ký tự, tối đa 72 byte UTF-8','PASSWORD_INVALID');return value;}
function cookie(req){return(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('internova_email_bind='))?.slice(21)||'';}
async function proof(user,value){const u=await User.findById(user._id).select('+passwordHash');if(!u||typeof value!=='string'||Buffer.byteLength(value)>72||!await bcrypt.compare(value,u.passwordHash||dummy)||!u.passwordHash)throw invalid();return u;}
router.get('/email/status',(_req,res)=>res.json({enabled:config.emailEnabled,emailVerification:false,registrationRoles:['student']}));
router.use((req,_res,next)=>{if(!req.path.startsWith('/email/'))return next('router');if(!config.emailEnabled)return next(new HttpError(503,'Đăng nhập email chưa được bật trên môi trường này','EMAIL_AUTH_DISABLED'));next();});
router.use(asyncHandler(async(_req,_res,next)=>{
 const indexes=await User.collection.indexes();
 if(indexes.some(i=>i.unique&&i.key.walletAddress===1&&!i.partialFilterExpression)||!['walletAddress','loginEmail'].every(f=>indexes.some(i=>i.unique&&i.key[f]===1&&i.partialFilterExpression?.[f]?.$type==='string')))throw new HttpError(503,'Cần chuẩn bị identity indexes trên TEST mới; không tự thay index database cũ','IDENTITY_INDEX_REVIEW_REQUIRED');next();
}));
router.post('/email/register',asyncHandler(async(req,res)=>{
 keys(req.body,['name','email','password','confirmPassword']);const loginEmail=email(req.body.email),plain=password(req.body.password);
 if(req.body.confirmPassword!==plain)throw new HttpError(400,'Mật khẩu xác nhận không khớp');
 if(typeof req.body.name!=='string'||!req.body.name.trim()||req.body.name.length>200)throw new HttpError(400,'Tên cần từ 1 đến 200 ký tự');
 const escaped=loginEmail.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(await User.exists({$or:[{loginEmail},{email:new RegExp('^'+escaped+'$','i')},{googleEmail:loginEmail}]}))throw new HttpError(409,'Không thể đăng ký email này. Nếu đã có tài khoản, hãy dùng phương thức đăng nhập cũ.','EMAIL_UNAVAILABLE');
 const user=await User.create({loginEmail,email:loginEmail,passwordHash:await bcrypt.hash(plain,12),name:req.body.name.trim(),role:'student',identityHistory:[{action:'password.registered',at:new Date()}]});
 await ensureProfile(user);res.status(201).json({token:signToken(user,'password'),user:dto(user)});
}));
router.post('/email/login',asyncHandler(async(req,res)=>{
 keys(req.body,['email','password']);const loginEmail=email(req.body.email),plain=password(req.body.password),user=await User.findOne({loginEmail}).select('+passwordHash');
 const valid=await bcrypt.compare(plain,user?.passwordHash||dummy);
 if(!user||!valid||user.disabled)throw invalid();
 await User.updateOne({_id:user._id},{$push:{identityHistory:{action:'password.login',at:new Date()}}});await ensureProfile(user);
 res.json({token:signToken(user,'password'),user:dto(user)});
}));
router.post('/email/change-password',requireAuth,asyncHandler(async(req,res)=>{
 keys(req.body,['currentPassword','newPassword','confirmPassword']);const u=await proof(req.user,req.body.currentPassword),next=password(req.body.newPassword);
 if(next!==req.body.confirmPassword)throw new HttpError(400,'Mật khẩu xác nhận không khớp');
 if(await bcrypt.compare(next,u.passwordHash))throw new HttpError(400,'Mật khẩu mới cần khác mật khẩu hiện tại');
 const saved=await User.findOneAndUpdate({_id:u._id,passwordHash:u.passwordHash,authVersion:u.authVersion,disabled:{$ne:true}},{$set:{passwordHash:await bcrypt.hash(next,12)},$inc:{authVersion:1},$push:{identityHistory:{action:'password.changed',at:new Date()}}},{new:true});
 if(!saved)throw new HttpError(409,'Tài khoản đã thay đổi; hãy đăng nhập lại');res.json({token:signToken(saved,'password'),user:dto(saved)});
}));
router.post('/email/wallet-challenge',requireAuth,asyncHandler(async(req,res)=>{
 keys(req.body,['password','walletAddress']);await proof(req.user,req.body.password);
 if(req.user.walletAddress)throw new HttpError(409,'Tài khoản đã có ví; không tự đổi khóa sở hữu');
 if(!isWallet(req.body.walletAddress))throw new HttpError(400,'Địa chỉ ví không hợp lệ');
 if(!config.corsOrigin.split(',').map(x=>x.trim()).includes(req.headers.origin))throw new HttpError(403,'Origin không hợp lệ');
 const secret=crypto.randomBytes(32).toString('hex'),nonce=crypto.randomBytes(32).toString('hex'),id=crypto.randomBytes(32).toString('hex'),wallet=req.body.walletAddress.toLowerCase(),expiresAt=new Date(Date.now()+300000);
 const message=['Internova - Link wallet to email account',`User: ${req.user._id}`,`Wallet: ${wallet}`,`Nonce: ${nonce}`,`Origin: ${req.headers.origin}`,`Expires: ${expiresAt.toISOString()}`].join('\n');
 await Challenge.create({_id:id,nonce,purpose:'password-link-wallet',userId:req.user._id,browserHash:hash(secret),wallet,message,expiresAt});
 res.cookie('internova_email_bind',secret,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api/auth',maxAge:300000});res.json({challengeId:id,message,expiresAt});
}));
router.post('/email/link-wallet',requireAuth,asyncHandler(async(req,res)=>{
 keys(req.body,['password','challengeId','signature']);const u=await proof(req.user,req.body.password);
 if(typeof req.body.challengeId!=='string'||!/^[a-f0-9]{64}$/.test(req.body.challengeId))throw new HttpError(401,'Challenge không hợp lệ');
 const c=await Challenge.findOne({_id:req.body.challengeId,purpose:'password-link-wallet',userId:u._id,browserHash:hash(cookie(req)),usedAt:{$exists:false},expiresAt:{$gt:new Date()}});
 if(!c||u.walletAddress)throw new HttpError(401,'Phiên liên kết không hợp lệ hoặc đã hết hạn');
 let recovered;try{recovered=ethers.verifyMessage(c.message,req.body.signature).toLowerCase();}catch{throw new HttpError(401,'Chữ ký không hợp lệ');}
 if(recovered!==c.wallet)throw new HttpError(401,'Chữ ký không khớp ví');
 if(await User.exists({walletAddress:c.wallet}))throw new HttpError(409,'Ví đã thuộc tài khoản khác; không tự gộp','IDENTITY_CONFLICT');
 const consumed=await Challenge.updateOne({_id:c._id,usedAt:{$exists:false},expiresAt:{$gt:new Date()}},{$set:{usedAt:new Date()}});if(consumed.modifiedCount!==1)throw new HttpError(409,'Challenge đã được dùng');
 const saved=await User.findOneAndUpdate({_id:u._id,walletAddress:{$exists:false},passwordHash:u.passwordHash,authVersion:u.authVersion,disabled:{$ne:true}},{$set:{walletAddress:c.wallet,walletVerified:true,walletVerifiedAt:new Date()},$inc:{authVersion:1},$push:{identityHistory:{action:'password.wallet_linked',at:new Date()}}},{new:true,runValidators:true});
 if(!saved)throw new HttpError(409,'Tài khoản đã thay đổi');await ensureProfile(saved);res.json({token:signToken(saved,'password'),user:dto(saved)});
}));
module.exports=router;
module.exports.normalizeEmail=email;
module.exports.validatePassword=password;

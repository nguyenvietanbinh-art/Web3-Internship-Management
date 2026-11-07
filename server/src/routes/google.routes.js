const router=require('express').Router(),crypto=require('node:crypto');
const {ethers}=require('ethers');
const User=require('../models/User'),Challenge=require('../models/IdentityChallenge');
const config=require('../config/env');
const {requireAuth}=require('../middleware/auth');
const {asyncHandler,HttpError,isWallet}=require('../utils/http');
const {signToken}=require('../services/authService');
const {verifyGoogle}=require('../services/googleIdentity');
const {ensureProfile}=require('../services/accountProfiles');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const cookieName='internova_identity';
const identityDTO=u=>({_id:u._id,name:u.name,email:u.email||'',role:u.role,walletAddress:u.walletAddress||null,accountStatus:u.disabled?'disabled':'active',
  googleLinked:Boolean(u.googleSubject),emailVerified:Boolean(u.googleSubject&&u.googleEmail&&u.email?.toLowerCase()===u.googleEmail),authProviders:[...(u.walletAddress?['wallet']:[]),...(u.googleSubject?['google']:[])],__v:u.__v??0});
const fail=(code='IDENTITY_CHALLENGE_INVALID')=>new HttpError(401,'Phiên xác thực hết hạn hoặc không hợp lệ. Hãy bắt đầu lại.',code);
function browser(req){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
router.get('/google/status',(_req,res)=>res.json({enabled:config.googleEnabled,clientId:config.googleEnabled?config.googleClientId:null,passwordEnabled:config.emailEnabled,registrationRoles:['student']}));
router.get('/identities',requireAuth,asyncHandler(async(req,res)=>res.json({user:identityDTO(await User.findById(req.user._id).select('+googleSubject +googleEmail'))})));
router.use((req,_res,next)=>{
  if(!req.path.startsWith('/google/') && req.path!=='/wallet/link')return next('router');
  if(!config.googleEnabled)return next(new HttpError(503,'Google Login chưa được cấu hình','GOOGLE_NOT_CONFIGURED'));
  if(req.method==='POST' && (!req.headers.origin || !config.corsOrigin.split(',').map(x=>x.trim()).includes(req.headers.origin)))return next(new HttpError(403,'Origin không được phép','CORS_DENIED'));
  next();
});
router.use(asyncHandler(async(_req,_res,next)=>{
  const indexes=await User.collection.indexes();
  if(indexes.some(i=>i.unique && i.key.walletAddress===1 && !i.partialFilterExpression))throw new HttpError(503,'Index ví cũ chưa được chuyển theo kế hoạch đã duyệt','IDENTITY_INDEX_REVIEW_REQUIRED');
  for(const field of ['walletAddress','googleSubject','googleEmail'])if(!indexes.some(i=>i.unique && Object.keys(i.key).length===1 && i.key[field]===1 && i.partialFilterExpression?.[field]?.$type==='string'))throw new HttpError(503,'Cần phê duyệt và chuẩn bị identity indexes trước khi bật Google Login','IDENTITY_INDEX_REVIEW_REQUIRED');
  next();
}));
router.post('/google/challenge',asyncHandler(async(req,res,next)=>{
  const purpose=req.body.purpose||'login';
  if(!['login','link-google','link-wallet','unlink-google'].includes(purpose))throw new HttpError(400,'Mục đích không hợp lệ');
  if(purpose!=='login')return requireAuth(req,res,()=>issue(req,res,purpose).catch(next));
  await issue(req,res,purpose);
}));
async function issue(req,res,purpose){
  let secret=browser(req);if(!/^[a-f0-9]{64}$/.test(secret)){secret=crypto.randomBytes(32).toString('hex');res.cookie(cookieName,secret,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api/auth',maxAge:600000});}
  const nonce=crypto.randomBytes(32).toString('hex'),id=crypto.randomBytes(32).toString('hex');
  let wallet;
  if(purpose==='link-wallet'){
    if(req.user.walletAddress)throw new HttpError(409,'Tài khoản đã có ví; không đổi khóa sở hữu nghiệp vụ','WALLET_IMMUTABLE');
    if(!isWallet(req.body.walletAddress))throw new HttpError(400,'Địa chỉ ví không hợp lệ');
    wallet=req.body.walletAddress.toLowerCase();
  }
  const expiresAt=new Date(Date.now()+300000);
  let chainId;
  if(purpose==='link-wallet'){try{const raw=req.body.chainId||'31337';if(typeof raw!=='string'||!(/^(0x[0-9a-fA-F]+|[1-9][0-9]*)$/).test(raw))throw Error();const n=BigInt(raw);if(n<=0n||n>18446744073709551615n)throw Error();chainId=n.toString();}catch{throw new HttpError(400,'Chain ID không hợp lệ');}}
  const message=['Internova - Identity linking',`Purpose: ${purpose}`,`User: ${req.user?._id||'new'}`,`Wallet: ${wallet||req.user?.walletAddress||'none'}`,...(chainId?[`Chain ID: ${chainId}`]:[]),`Nonce: ${nonce}`,`Origin: ${req.headers.origin}`,`Expires: ${expiresAt.toISOString()}`].join('\n');
  await Challenge.create({_id:id,nonce,purpose,browserHash:hash(secret),userId:req.user?._id,wallet,message,chainId,expiresAt});
  res.json({challengeId:id,nonce,message,expiresAt});
}
async function challenge(req,purpose){
  if(typeof req.body.challengeId!=='string'||!/^[a-f0-9]{64}$/.test(req.body.challengeId))throw fail();
  const c=await Challenge.findOne({_id:req.body.challengeId,purpose,usedAt:{$exists:false},expiresAt:{$gt:new Date()},browserHash:hash(browser(req))});
  if(!c || (purpose!=='login' && String(c.userId)!==String(req.user._id)))throw fail();
  return c;
}
async function consume(c){const r=await Challenge.updateOne({_id:c._id,usedAt:{$exists:false},expiresAt:{$gt:new Date()}},{$set:{usedAt:new Date()}});if(r.modifiedCount!==1)throw fail();}
async function verify(req,c){return (req.app.locals.googleVerifier||verifyGoogle)(req.body.credential,c.nonce);}
function walletProof(c,signature,wallet){let recovered;try{recovered=ethers.verifyMessage(c.message,signature).toLowerCase();}catch{throw fail('BAD_SIGNATURE');}if(recovered!==wallet)throw fail('BAD_SIGNATURE');}
function audit(action){return{action,at:new Date()};}
router.post('/google/login',asyncHandler(async(req,res)=>{
  const c=await challenge(req,'login'),p=await verify(req,c);
  let user=await User.findOne({googleSubject:p.sub}).select('+googleSubject +googleEmail');
  if(!user){
    if(config.schoolWorkflowEnabled)throw new HttpError(403,'Tài khoản do nhà trường cấp','PUBLIC_REGISTRATION_DISABLED');
    if(req.body.role!==undefined && req.body.role!=='student')throw new HttpError(400,'Google tự đăng ký chỉ cấp vai trò sinh viên','REGISTRATION_ROLE_DENIED');
    const escaped=p.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(await User.exists({email:new RegExp('^'+escaped+'$','i')}))throw new HttpError(409,'Email đã tồn tại. Đăng nhập tài khoản hiện có và liên kết Google.','ACCOUNT_LINK_REQUIRED');
    await consume(c);
    try{user=await User.create({googleSubject:p.sub,googleEmail:p.email,email:p.email,name:p.name,role:'student',identityHistory:[audit('google.registered')]});}
    catch(error){if(error.code!==11000)throw error;throw new HttpError(409,'Tài khoản vừa được đăng ký; hãy đăng nhập lại','IDENTITY_CONFLICT');}
  }else{if(user.disabled)throw new HttpError(403,'Tài khoản đã bị khóa','ACCOUNT_DISABLED');await consume(c);user=await User.findOneAndUpdate({_id:user._id,disabled:{$ne:true}},{$set:{googleEmail:p.email},$push:{identityHistory:audit('google.login')}},{new:true}).select('+googleSubject +googleEmail');if(!user)throw new HttpError(403,'Tài khoản đã bị khóa','ACCOUNT_DISABLED');}
  await ensureProfile(user);
  res.json({success:true,token:signToken(user,'google'),user:identityDTO(user)});
}));
router.post('/google/link',requireAuth,asyncHandler(async(req,res)=>{
  const c=await challenge(req,'link-google'),p=await verify(req,c);
  if(req.user.walletAddress)walletProof(c,req.body.signature,req.user.walletAddress);
  else{
    const account=await User.findById(req.user._id).select('+passwordHash');
    if(!account.passwordHash||typeof req.body.password!=='string'||Buffer.byteLength(req.body.password)>72||!await require('bcryptjs').compare(req.body.password,account.passwordHash))throw new HttpError(401,'Cần xác thực lại bằng mật khẩu tài khoản','REAUTH_REQUIRED');
  }
  const current=await User.findById(req.user._id).select('+googleSubject +googleEmail');
  if(current.googleSubject && current.googleSubject!==p.sub)throw new HttpError(409,'Tài khoản đã liên kết Google khác','IDENTITY_CONFLICT');
  if(await User.exists({_id:{$ne:current._id},googleSubject:p.sub}))throw new HttpError(409,'Google đã thuộc tài khoản khác','IDENTITY_CONFLICT');
  const escaped=p.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(await User.exists({_id:{$ne:current._id},email:new RegExp('^'+escaped+'$','i')}))throw new HttpError(409,'Email đã thuộc tài khoản khác; không tự gộp','ACCOUNT_LINK_REQUIRED');
  await consume(c);
  const u=await User.findOneAndUpdate({_id:current._id,disabled:{$ne:true},$or:[{googleSubject:{$exists:false}},{googleSubject:p.sub}]},{$set:{googleSubject:p.sub,googleEmail:p.email},$inc:{__v:1},$push:{identityHistory:audit('google.linked')}},{new:true,runValidators:true}).select('+googleSubject +googleEmail');
  if(!u)throw new HttpError(409,'Tài khoản đã thay đổi');
  res.json({user:identityDTO(u)});
}));
router.post('/wallet/link',requireAuth,asyncHandler(async(req,res)=>{
  const c=await challenge(req,'link-wallet'),p=await verify(req,c),current=await User.findById(req.user._id).select('+googleSubject +googleEmail');
  if(current.googleSubject!==p.sub)throw fail();
  walletProof(c,req.body.signature,c.wallet);
  if(await User.exists({walletAddress:c.wallet}))throw new HttpError(409,'Ví đã thuộc tài khoản khác; không tự gộp','IDENTITY_CONFLICT');
  await consume(c);
  const u=await User.findOneAndUpdate({_id:current._id,walletAddress:{$exists:false},disabled:{$ne:true}},{$set:{walletAddress:c.wallet,walletVerified:true,walletVerifiedAt:new Date()},$inc:{__v:1,walletLinkVersion:1},$push:{identityHistory:audit('wallet.linked')}},{new:true,runValidators:true}).select('+googleSubject +googleEmail');
  if(!u)throw new HttpError(409,'Tài khoản đã thay đổi');
  await ensureProfile(u);
  res.json({token:signToken(u,'google'),user:identityDTO(u)});
}));
router.post('/google/unlink',requireAuth,asyncHandler(async(req,res)=>{
  const c=await challenge(req,'unlink-google'),p=await verify(req,c),current=await User.findById(req.user._id).select('+googleSubject +googleEmail');
  if(!current.walletAddress)throw new HttpError(409,'Không được xóa phương thức đăng nhập cuối cùng','LAST_AUTH_PROVIDER');
  if(current.googleSubject!==p.sub)throw fail();walletProof(c,req.body.signature,current.walletAddress);await consume(c);
  const u=await User.findOneAndUpdate({_id:current._id,googleSubject:p.sub,walletAddress:current.walletAddress,disabled:{$ne:true}},{$unset:{googleSubject:1,googleEmail:1},$inc:{__v:1},$push:{identityHistory:audit('google.unlinked')}},{new:true});
  if(!u)throw new HttpError(409,'Tài khoản đã thay đổi');
  res.json({user:identityDTO(u),token:signToken(u,'wallet')});
}));
module.exports={router,identityDTO};

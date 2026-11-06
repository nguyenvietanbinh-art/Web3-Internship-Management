const router=require('express').Router(),crypto=require('node:crypto'),{ethers}=require('ethers');
const User=require('../models/User'),Challenge=require('../models/IdentityChallenge'),{requireAuth}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http'),config=require('../config/env'),{signToken}=require('../services/authService');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
router.post('/wallet/unlink-challenge',requireAuth,asyncHandler(async(req,res)=>{
 if(!config.userIdBusiness)throw new HttpError(409,'Chức năng chỉ dùng trong hệ thống User ID thống nhất');
 if(!req.user.walletAddress)throw new HttpError(409,'Chưa liên kết ví');
 if(!config.corsOrigin.split(',').map(x=>x.trim()).includes(req.headers.origin))throw new HttpError(403,'Origin không hợp lệ');
 const nonce=crypto.randomBytes(32).toString('hex'),secret=crypto.randomBytes(32).toString('hex'),id=crypto.randomBytes(32).toString('hex'),expiresAt=new Date(Date.now()+300000);
 const message=['Internova - Unlink wallet',`User: ${req.user._id}`,`Wallet: ${req.user.walletAddress}`,`Origin: ${req.headers.origin}`,`Nonce: ${nonce}`,`Expires: ${expiresAt.toISOString()}`].join('\n');
 await Challenge.create({_id:id,nonce,purpose:'user-unlink-wallet',userId:req.user._id,wallet:req.user.walletAddress,browserHash:hash(secret),expiresAt,message});res.cookie('internova_unlink',secret,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api/auth',maxAge:300000});res.json({challengeId:id,message,expiresAt});
}));
router.post('/wallet/unlink',requireAuth,asyncHandler(async(req,res)=>{
 if(!config.userIdBusiness)throw new HttpError(409,'Chức năng chỉ dùng trong hệ thống thống nhất');
 const current=await User.findById(req.user._id).select('+passwordHash +googleSubject');if(!current.passwordHash&&!current.googleSubject)throw new HttpError(409,'Không được xóa phương thức đăng nhập cuối','LAST_AUTH_PROVIDER');
 if(typeof req.body.challengeId!=='string'||!/^[a-f0-9]{64}$/.test(req.body.challengeId))throw new HttpError(400,'Challenge không hợp lệ');
 const secret=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('internova_unlink='))?.slice(17)||'';
 const c=await Challenge.findOne({_id:req.body.challengeId,purpose:'user-unlink-wallet',userId:current._id,wallet:current.walletAddress,browserHash:hash(secret),usedAt:{$exists:false},expiresAt:{$gt:new Date()}});if(!c)throw new HttpError(401,'Challenge sai/hết hạn');
 let recovered;try{recovered=ethers.verifyMessage(c.message,req.body.signature).toLowerCase();}catch{throw new HttpError(401,'Chữ ký không hợp lệ');}if(recovered!==current.walletAddress)throw new HttpError(401,'Chữ ký không khớp');
 const {ChainOperation}=require('../models/Web3Models'),{WorkSession}=require('../models/BusinessModels');
 if(config.schoolWorkflowEnabled&&await require('../workflow/models').SupportPayment.exists({$or:[{companyUserId:current._id},{studentUserId:current._id}],state:{$in:['prepared','submitted','needs_reconciliation']}}))throw new HttpError(409,'Cần đối chiếu hoặc hủy ủy quyền hỗ trợ còn treo trước khi đổi ví','PAYMENT_UNRESOLVED');
 if(await ChainOperation.exists({$or:[{studentWallet:current.walletAddress},{actorWallet:current.walletAddress},{actorUserId:current._id}]}))throw new HttpError(409,'Ví đã gắn với operation/chứng nhận blockchain; không tự hủy','WALLET_IN_USE');
 if(await WorkSession.exists({studentUserId:current._id,state:'open'}))throw new HttpError(409,'Cần đóng phiên giờ làm trước','WALLET_IN_USE');
 for(const[name,id,wallet]of [['CV','ownerUserId','ownerWallet'],['JD','companyUserId','companyWallet'],['Topic','companyUserId','companyWallet'],['Assignment',current.role+'UserId',current.role+'Wallet']]){
  const Model=require('../models/'+(name==='CV'?'BusinessModels':name));const M=name==='CV'?Model.CV:Model;
  if(await M.exists({[id]:{$exists:false},[wallet]:current.walletAddress}))throw new HttpError(409,'Cần mapping dữ liệu legacy trước khi hủy','LEGACY_MAPPING_REQUIRED');
 }
 const consumed=await Challenge.updateOne({_id:c._id,usedAt:{$exists:false},expiresAt:{$gt:new Date()}},{$set:{usedAt:new Date()}});if(consumed.modifiedCount!==1)throw new HttpError(409,'Challenge đã dùng');
 const saved=await User.findOneAndUpdate({_id:current._id,walletAddress:c.wallet,authVersion:current.authVersion,disabled:{$ne:true},$or:[{passwordHash:{$type:'string'}},{googleSubject:{$type:'string'}}]},{$unset:{walletAddress:1,walletVerifiedAt:1},$set:{walletVerified:false},$inc:{authVersion:1,walletLinkVersion:1},$push:{identityHistory:{action:'wallet.unlinked',at:new Date()}}},{new:true});if(!saved)throw new HttpError(409,'Tài khoản vừa thay đổi');
 const provider=req.authProvider==='wallet'?(current.passwordHash?'password':'google'):req.authProvider;res.json({token:signToken(saved,provider),user:{_id:saved._id,walletAddress:null,walletVerified:false}});
}));
module.exports=router;

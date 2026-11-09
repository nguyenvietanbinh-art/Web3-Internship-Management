const router=require('express').Router();
const User=require('../models/User');
const {requireRole}=require('../middleware/auth');
const {asyncHandler,HttpError}=require('../utils/http');
const v=require('./shared');
const {profileFields:profile}=require('../services/profileService');
const roles=['student','company','mentor','admin'];
const resetAttempts=new Map();
router.post('/accounts/:id/password-reset',requireRole('admin'),asyncHandler(async(req,res)=>{
  const now=Date.now(),key=String(req.user._id);
  for(const [id,bucket]of resetAttempts)if(bucket.until<=now)resetAttempts.delete(id);
  const bucket=resetAttempts.get(key)||{until:now+600000,count:0};bucket.count++;resetAttempts.set(key,bucket);
  if(bucket.count>5){await User.updateOne({_id:req.user._id},{$push:{auditHistory:v.event(req.user,'password.reset_denied',{targetUserId:/^[a-f0-9]{24}$/i.test(req.params.id)?req.params.id:'invalid-id',result:'RATE_LIMITED'})}});throw new HttpError(429,'Đã gửi quá nhiều yêu cầu; thử lại sau 10 phút');}
  try{const reset=require('../services/passwordReset');if(req.body?.mode!==undefined)res.json(await reset.adminSet(req.user,req.params.id,req.body));else{v.keys(req.body,[]);res.json(await reset.request(req.user,req.params.id));}}
  catch(error){if(/^[a-f0-9]{24}$/i.test(req.params.id))await User.updateOne({_id:req.user._id},{$push:{auditHistory:v.event(req.user,'password.reset_denied',{targetUserId:req.params.id,result:error.code||'rejected'})}});throw error;}
}));
const dto=(user,authentication='wallet')=>({ _id:user._id,name:user.name,email:user.email||'',bio:user.bio||'',skills:user.skills||[],companyName:user.companyName||'',walletAddress:user.walletAddress||null,role:user.role,disabled:Boolean(user.disabled),__v:user.__v??0,authentication });
router.get('/profile',asyncHandler(async(req,res)=>res.json(dto(req.user,req.authProvider))));
router.patch('/profile',asyncHandler(async(req,res)=>{
  v.keys(req.body,['name','email','bio','skills','companyName','version']);
  if(req.body.companyName!==undefined&&req.user.role!=='company')throw new HttpError(403,'Chỉ doanh nghiệp sửa tên doanh nghiệp');
  const set=require('../services/profileService').profileUpdateFields(req.user,req.body);v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
  const user=await User.findOneAndUpdate({_id:req.user._id,...v.versionMatch(req.body.version)},{$set:set,$inc:{__v:1},$push:{auditHistory:v.event(req.user,'profile.updated',{fields:Object.keys(set)})}},{new:true,runValidators:true});
  if(!user)throw new HttpError(409,'Hồ sơ đã thay đổi; tải lại trước khi sửa','STALE_VERSION');res.json(dto(user,req.authProvider));
}));
router.get('/accounts',requireRole('admin'),asyncHandler(async(req,res)=>{
  const filter={};if(req.query.role)filter.role=v.choice(req.query.role,roles,'Vai trò');const q=v.personSearch(req.query.q);if(q){const coded=await require('../models/Student').find({studentCode:q}).distinct('userId');filter.$or=[{name:q},{walletAddress:q},{email:q},{_id:{$in:coded}}];}
  const data=await v.paged(User,filter,req.query,{select:'name email role walletAddress disabled companyName createdAt __v'});res.json(data);
}));
router.post('/accounts',requireRole('admin'),asyncHandler(async(req,res)=>{
  v.keys(req.body,['walletAddress','name','email','role','companyName']);const role=v.choice(req.body.role,roles,'Vai trò');
  const fields=profile(req.body);if(!fields.name)throw new HttpError(400,'Cần tên tài khoản');
  const user=await User.create({...fields,walletAddress:v.wallet(req.body.walletAddress),role,auditHistory:[v.event(req.user,'account.provisioned',{role})]});
  res.status(201).json(dto(user));
}));
router.patch('/accounts/:id',requireRole('admin'),asyncHandler(async(req,res)=>{
  v.keys(req.body,['role','disabled','reason','version']);const user=await User.findById(v.id(req.params.id));if(!user)throw new HttpError(404,'Không có tài khoản');
  if(String(user._id)===String(req.user._id)||user.role==='admin')throw new HttpError(403,'Không sửa quyền/trạng thái chính mình hoặc Admin qua thao tác này');
  const set={},reason=v.text(req.body.reason,'Lý do',{required:false,max:1000});
  if(req.body.role!==undefined)set.role=v.choice(req.body.role,roles,'Vai trò');
  if(req.body.disabled!==undefined){if(typeof req.body.disabled!=='boolean')throw new HttpError(400,'Trạng thái khóa không hợp lệ');set.disabled=req.body.disabled;}
  if(!Object.keys(set).length)throw new HttpError(400,'Chưa chọn thay đổi');v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
  if(require('../config/env').schoolWorkflowEnabled){
    if(set.role&&set.role!==user.role)throw new HttpError(409,'Tạo tài khoản đúng vai trò riêng; không chuyển vai trò có thể làm mất phạm vi lịch sử');
    if(set.disabled===true&&await require('../workflow/models').SupportPayment.exists({$or:[{companyUserId:user._id},{studentUserId:user._id}],state:{$in:['prepared','submitted','needs_reconciliation']}}))throw new HttpError(409,'Cần đối chiếu/hủy ủy quyền hỗ trợ còn treo trước khi khóa tài khoản');
  }
  const updated=await User.findOneAndUpdate({_id:user._id,...v.versionMatch(req.body.version),role:{$ne:'admin'}},{$set:set,$inc:{__v:1},$push:{auditHistory:v.event(req.user,'account.updated',{before:{role:user.role,disabled:Boolean(user.disabled)},after:set,reason})}},{new:true,runValidators:true});
  if(!updated)throw new HttpError(409,'Tài khoản đã thay đổi','STALE_VERSION');res.json(dto(updated));
}));
router.get('/accounts/:id/history',requireRole('admin'),asyncHandler(async(req,res)=>{
  const user=await User.findById(v.id(req.params.id)).select('+auditHistory');if(!user)throw new HttpError(404,'Không có tài khoản');res.json(user.auditHistory||[]);
}));
module.exports=router;

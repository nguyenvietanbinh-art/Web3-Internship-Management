const router=require('express').Router(),Company=require('../models/Company'),{requireRole}=require('../middleware/auth'),{asyncHandler,HttpError}=require('../utils/http'),v=require('./shared');
router.get('/company/locations',requireRole('company'),asyncHandler(async(req,res)=>{const company=await Company.findOne({userId:req.user._id}).lean();res.json({version:company?.__v??null,items:company?.locations||[]});}));
router.post('/company/locations',requireRole('company'),asyncHandler(async(req,res)=>{
 v.keys(req.body,['version','label','address','latitude','longitude','radiusMeters','maxAccuracyMeters','source','coordinatesConfirmed']);
 const finite=(value,min,max,label)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new HttpError(400,label+' không hợp lệ');return value;};
 if(req.body.coordinatesConfirmed!==true)throw new HttpError(400,'Cần xác nhận địa chỉ và tọa độ trước khi lưu');
 const location={id:require('crypto').randomUUID(),label:v.text(req.body.label,'Tên địa điểm',{required:true,max:160}),address:v.text(req.body.address,'Địa chỉ',{required:true,max:500}),latitude:finite(req.body.latitude,-90,90,'Vĩ độ'),longitude:finite(req.body.longitude,-180,180,'Kinh độ'),radiusMeters:finite(req.body.radiusMeters,20,300,'Bán kính'),maxAccuracyMeters:finite(req.body.maxAccuracyMeters,1,100,'Sai số tối đa'),source:v.choice(req.body.source||'manual',['manual','google-maps','device'],'Nguồn tọa độ'),confirmedBy:String(req.user._id),confirmedAt:new Date(),verification:'company-confirmed-coordinates'};
 if(location.maxAccuracyMeters>location.radiusMeters)throw new HttpError(400,'Sai số tối đa không được lớn hơn bán kính');
 const company=await Company.findOne({userId:req.user._id});if(!company){if(req.body.version!==null)throw new HttpError(409,'Hồ sơ doanh nghiệp đã thay đổi');const created=await Company.create({userId:req.user._id,name:req.user.name,locations:[location]});return res.status(201).json({version:created.__v,items:created.locations});}
 if((company.locations||[]).length>=30)throw new HttpError(409,'Đã đạt giới hạn 30 địa điểm; không xóa địa điểm đang có');
 v.integer(req.body.version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');const saved=await Company.findOneAndUpdate({_id:company._id,...v.versionMatch(req.body.version)},{$push:{locations:location},$inc:{__v:1}},{new:true,runValidators:true});if(!saved)throw new HttpError(409,'Danh sách địa điểm đã thay đổi; tải lại trước khi lưu','STALE_VERSION');res.status(201).json({version:saved.__v,items:saved.locations});
}));
module.exports=router;

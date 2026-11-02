const User=require('../models/User');
const {HttpError}=require('../utils/http');
const v=require('../core/shared');
function profileFields(body){
 const patch={};for(const key of ['name','email','bio','companyName'])if(body[key]!==undefined)patch[key]=v.text(body[key],key,{required:key==='name',max:key==='bio'?10000:200});
 if(patch.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email))throw new HttpError(400,'Email không hợp lệ');if(body.skills!==undefined)patch.skills=v.list(body.skills,'Kỹ năng');return patch;
}
async function legacyUpdate(actor,patch,action,details={}){
 const saved=await User.findOneAndUpdate({_id:actor._id,...v.versionMatch(actor.__v??0)},{$set:patch,$inc:{__v:1},$push:{auditHistory:v.event(actor,action,{fields:Object.keys(patch),...details})}},{new:true,runValidators:true});
 if(!saved)throw new HttpError(409,'Hồ sơ đã thay đổi; tải lại trước khi sửa','STALE_VERSION');return saved;
}
module.exports={profileFields,legacyUpdate};

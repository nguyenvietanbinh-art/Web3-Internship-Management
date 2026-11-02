const Student=require('../models/Student'),Company=require('../models/Company');
async function ensureProfile(user){
  if(user.role==='student')await Student.findOneAndUpdate({userId:user._id},{$setOnInsert:{userId:user._id,fullName:user.name,skills:user.skills||[]}},{upsert:true,setDefaultsOnInsert:true});
  if(user.role==='company')await Company.findOneAndUpdate({userId:user._id},{$setOnInsert:{userId:user._id,name:user.companyName||user.name}},{upsert:true,setDefaultsOnInsert:true});
}
module.exports={ensureProfile};

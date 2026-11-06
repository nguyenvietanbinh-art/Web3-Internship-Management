const Assignment=require('../models/Assignment');
const {HttpError}=require('../utils/http');
const v=require('./shared');
function scope(user){
 const base={batchId:{$type:'objectId'},...(require('../config/env').schoolWorkflowEnabled?{workflow:true,activePlacement:true}:{})};
 if(user.role==='admin')return base;
 const field={student:'studentWallet',company:'companyWallet',mentor:'mentorWallet'}[user.role];
 if(!field)throw new HttpError(403,'Vai trò không hợp lệ');return{...base,...require('../services/businessIdentity').owned(user,field.replace('Wallet','UserId'),field)};
}
async function load(user,value,{active=false}={}){
 const assignment=await Assignment.findOne({_id:v.id(value),...scope(user)});
 if(!assignment)throw new HttpError(404,'Không tìm thấy phân công trong phạm vi quyền');
 if(active&&(assignment.lifecycle!=='active'||assignment.startDate>new Date()||assignment.endDate<new Date()))throw new HttpError(409,'Phân công chưa hoạt động hoặc đã hết hạn');
 return assignment;
}
module.exports={scope,load};

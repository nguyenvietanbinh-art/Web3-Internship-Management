// Read-only projection of existing assignments and mint operations. Never creates notifications or tokens.
const Assignment=require('../models/Assignment'),{ChainOperation}=require('../models/Web3Models'),{NotificationReceipt}=require('../models/BusinessModels');
const policy=require('../core/placementPolicy'),v=require('../core/shared'),chain=require('./localWeb3'),{HttpError}=require('../utils/http');
const message='Chúc mừng! Bạn đã được cấp chứng nhận hoàn thành thực tập.';
async function list(user,query={},verifyCertificate=chain.certificate){
 if(user.role!=='student')throw new HttpError(403,'Chỉ sinh viên xem chứng nhận cá nhân');
 v.keys(query,['page','limit']);const data=await v.paged(Assignment,policy.scope(user),{...query,limit:query.limit||'10'});
 const ids=data.items.map(a=>a._id),ops=await ChainOperation.find({assignmentId:{$in:ids},kind:'mint'}).sort({createdAt:-1}).lean();
 const context=await require('../core/reportContext').contexts(data.items),receipts=await NotificationReceipt.find({userId:user._id,eventId:{$in:ops.map(op=>String(op._id))}}).select('eventId').lean(),read=new Set(receipts.map(r=>r.eventId));
 const items=[];for(const assignment of data.items){const op=ops.find(o=>String(o.assignmentId)===String(assignment._id)),row={assignmentId:assignment._id,context:context.get(String(assignment._id)),lifecycle:assignment.lifecycle,certificate:null,recorded:Boolean(op),verificationStatus:'not_issued',notification:null};
  if(op){try{const certificate=await verifyCertificate(assignment);if(certificate.verified!==true)throw new Error('Not verified');row.certificate=certificate;row.verificationStatus='verified';row.notification={id:certificate.mintOperationId||String(op._id),at:certificate.issuedAt||op.createdAt,title:'Chứng nhận hoàn thành thực tập',message,read:read.has(certificate.mintOperationId||String(op._id)),targetView:'core-web3',assignmentId:assignment._id};}catch{row.verificationStatus='unverifiable';row.message='Đã ghi nhận cấp chứng nhận nhưng hiện chưa xác minh được blockchain hoặc danh tính người nhận.';}}
  items.push(row);
 }
 return {...data,items};
}
async function notifications(user){if(user.role!=='student')return[];const all=[];for(let page=1;;page++){const data=await list(user,{page:String(page),limit:'20'});all.push(...data.items.flatMap(r=>r.notification?[r.notification]:[]));if(page>=data.pages)break;}return all;}
module.exports={list,notifications,message};

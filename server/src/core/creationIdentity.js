const {hash}=require('./taskEvaluationService'),{HttpError}=require('../utils/http'),mongoose=require('mongoose');
module.exports=async function creationIdentity(Model,req,scope){
 const key=req.get('Idempotency-Key');if(!key)return {};
 if(typeof key!=='string'||!/^[a-zA-Z0-9_:-]{8,120}$/.test(key))throw new HttpError(400,'Mã chống gửi trùng không hợp lệ');
 const _id=new mongoose.Types.ObjectId(hash(Model.modelName+':'+req.user._id+':'+scope+':'+key).slice(0,24)),creationRequestHash=hash(req.body),existing=await Model.findById(_id);
 if(existing&&existing.creationRequestHash!==creationRequestHash)throw new HttpError(409,'Mã yêu cầu đã dùng với nội dung khác');
 return{_id,creationRequestHash,existing};
};

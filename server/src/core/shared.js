const mongoose = require('mongoose');
const { HttpError } = require('../utils/http');

const HistorySchema = new mongoose.Schema({
  action: { type: String, required: true }, actorWallet: { type: String }, actorUserId: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
  actorRole: { type: String, required: true }, at: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
});
function event(user, action, data = {}) { return { _id: new mongoose.Types.ObjectId(), action, actorWallet:user.walletAddress, actorUserId:user._id, actorRole:user.role, at:new Date(), data }; }
function keys(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400,'Nội dung không hợp lệ');
  for (const key of Object.keys(body)) if (!allowed.includes(key)) throw new HttpError(400,`Trường không được phép: ${key}`);
}
function text(value, label, { required = false, max = 20000 } = {}) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new HttpError(400,`${label} không hợp lệ`);
  return value.trim();
}
function choice(value, values, label) { if (!values.includes(value)) throw new HttpError(400,`${label} không hợp lệ`); return value; }
function integer(value,min,max,label) { if (!Number.isInteger(value)||value<min||value>max) throw new HttpError(400,`${label} không hợp lệ`); return value; }
function id(value) { if (typeof value !== 'string'||!/^[a-f0-9]{24}$/i.test(value)) throw new HttpError(400,'ID không hợp lệ'); return value; }
function wallet(value) { if (typeof value !== 'string'||!/^0x[a-f0-9]{40}$/i.test(value)) throw new HttpError(400,'Địa chỉ ví không hợp lệ'); return value.toLowerCase(); }
function date(value,label) { if (typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)||!Number.isFinite(Date.parse(value))||(value.length>10&&!/(Z|[+-]\d{2}:\d{2})$/.test(value)))throw new HttpError(400,`${label} không hợp lệ; cần ngày hoặc ISO có múi giờ`);const calendar=new Date(value.slice(0,10)+'T00:00:00.000Z');if(!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,10)!==value.slice(0,10))throw new HttpError(400,`${label} không hợp lệ`);return new Date(value); }
function list(value,label,max=50) { if(!Array.isArray(value)||value.length>max)throw new HttpError(400,`${label} không hợp lệ`);return [...new Set(value.map(x=>text(x,label,{required:true,max:120})))]; }
function pagination(query) {
  for(const v of Object.values(query))if(typeof v!=='string')throw new HttpError(400,'Query phải là chuỗi đơn');
  const page=query.page===undefined?1:Number(query.page),limit=query.limit===undefined?20:Number(query.limit);
  integer(page,1,10000,'Trang');integer(limit,1,100,'Số bản ghi');return{page,limit,skip:(page-1)*limit};
}
function search(value) { const q=text(value,'Từ khóa',{max:120});return q?new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'):null; }
function personSearch(value) { return require('../services/personSearch').pattern(text(value,'Từ khóa',{max:120})); }
async function paged(Model,filter,query,{select,sort={createdAt:-1}}={}) {
  const {page,limit,skip}=pagination(query);let request=Model.find(filter).sort(sort).skip(skip).limit(limit);
  if(select)request=request.select(select);
  const[items,total]=await Promise.all([request.lean(),Model.countDocuments(filter)]);
  return{items:items.map(item=>({...item,__v:item.__v??0})),total,page,limit,pages:Math.max(1,Math.ceil(total/limit))};
}
async function updateVersion(Model,doc,version,set,entry,extra={}) {
  integer(version,0,Number.MAX_SAFE_INTEGER,'Phiên bản');
  const updated=await Model.findOneAndUpdate({_id:doc._id,...versionMatch(version),...extra},{$set:set,$inc:{__v:1},$push:{history:entry}},{new:true,runValidators:true});
  if(!updated)throw new HttpError(409,'Dữ liệu đã thay đổi; tải lại trước khi sửa','STALE_VERSION');return updated;
}
function versionMatch(version){return version===0?{$or:[{__v:0},{__v:{$exists:false}}]}:{__v:version};}
function optionalWeek(value){
 if(value===undefined)return undefined;
 if(typeof value!=='string'||!/^[1-9][0-9]{0,2}$/.test(value))throw new HttpError(400,'Tuần báo cáo không hợp lệ');
 return integer(Number(value),1,104,'Tuần báo cáo');
}
module.exports={HistorySchema,event,keys,text,choice,integer,id,wallet,date,list,pagination,search,personSearch,paged,updateVersion,versionMatch,optionalWeek};

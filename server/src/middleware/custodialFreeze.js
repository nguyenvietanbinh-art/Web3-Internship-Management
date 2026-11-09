// Prevent ordinary API writes to the snapshot while the explicitly enabled worker issues.
const mongoose=require('mongoose'),{HttpError}=require('../utils/http');
module.exports=async function custodialFreeze(req,_res,next){try{
 if(!require('../services/custodialRuntime').enabled()||!['POST','PATCH','PUT','DELETE'].includes(req.method)||req.path.startsWith('/custody/')||req.path.startsWith('/web3/'))return next();
 const ids=[...new Set((req.path.match(/[a-f0-9]{24}/gi)||[]).concat(Object.values(req.body||{}).filter(v=>typeof v==='string'&&/^[a-f0-9]{24}$/i.test(v))))].map(v=>new mongoose.Types.ObjectId(v));
 if(!ids.length)return next();const db=mongoose.connection.db,assignmentIds=[...ids];
 for(const name of ['business_reports','internship_tasks','work_logs','work_sessions']){const rows=await db.collection(name).find({_id:{$in:ids}},{projection:{assignmentId:1}}).toArray();assignmentIds.push(...rows.map(r=>r.assignmentId).filter(Boolean));}
 const allowed=await require('../models/Assignment').find({_id:{$in:assignmentIds},...require('../core/placementPolicy').scope(req.user)}).select('_id').lean();
 if(await db.collection(require('../services/cloudWeb3Runtime').selected()?'cloud_certificate_issuances_v1':'certificate_issuances').findOne({assignmentId:{$in:allowed.map(a=>a._id)},state:{$in:['processing','issued']}}))throw new HttpError(409,'Hồ sơ đang phát hành hoặc đã cấp chứng nhận; cần quy trình xử lý riêng','CERTIFICATE_SNAPSHOT_LOCKED');
 next();
}catch(e){next(e);}};

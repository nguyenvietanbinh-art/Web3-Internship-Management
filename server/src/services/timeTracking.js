const {HttpError}=require('../utils/http');
const MAX_MINUTES=16*60;
function duration(start,end){const milliseconds=new Date(end)-new Date(start);if(!Number.isFinite(milliseconds)||milliseconds<=0||milliseconds>MAX_MINUTES*60000)throw new HttpError(400,'Khoảng giờ phải dương và không vượt16giờ','UNREASONABLE_DURATION');return Math.floor(milliseconds/60000);}
function periodKey(date,kind){const d=new Date(date);if(kind==='day')return d.toISOString().slice(0,10);if(kind==='month')return d.toISOString().slice(0,7);if(kind==='week'){const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10);}throw new HttpError(400,'Kỳ tổng hợp không hợp lệ');}
function view(doc,now=new Date()){const obj=typeof doc.toObject==='function'?doc.toObject():{...doc};return{...obj,missingCheckout:obj.state==='open',requiresAttention:obj.state==='needs_adjustment'||obj.state==='open'&&now-new Date(obj.checkInAt)>MAX_MINUTES*60000};}
// Interface deliberately independent of QR/GPS/blockchain. Manual evidence is never verified proof.
function manualProof(){return{provider:'manual',verified:false};}
module.exports={duration,periodKey,view,manualProof,MAX_MINUTES};

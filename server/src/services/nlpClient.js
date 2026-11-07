const axios=require('axios');
const {HttpError}=require('../utils/http');
const url=()=>{
 const value=process.env.NLP_SERVICE_URL||'http://127.0.0.1:8003';let parsed;
 try{parsed=new URL(value);}catch{throw new HttpError(503,'NLP_SERVICE_URL không hợp lệ');}
 if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new HttpError(503,'NLP chỉ được gửi tới service loopback đã cấu hình');
 return parsed.origin;
};
let inflight=0;
async function request(path,body){
 if(inflight>=2)throw new HttpError(503,'NLP đang bận; thử lại sau');
 inflight++;
 try{const deadline=Date.now()+15000;for(let attempt=0;attempt<5;attempt++){
  try{const r=await axios({url:url()+'/api/v1/nlp'+path,method:body===undefined?'GET':'POST',data:body,timeout:Math.max(1,deadline-Date.now()),maxBodyLength:4*1024*1024,maxContentLength:1024*1024,proxy:false,maxRedirects:0});return r.data;}
  catch(error){if(error.response?.status!==503||error.response?.data?.detail!=='MODEL_BUSY_RETRY'||attempt===4||Date.now()+50*(attempt+1)>=deadline)throw error;await new Promise(resolve=>setTimeout(resolve,50*(attempt+1)));}
 }}
 catch(e){if(e instanceof HttpError)throw e;throw new HttpError(e.response?.status===422?422:503,e.response?.status===422?'Dữ liệu NLP không hợp lệ':'NLP chưa sẵn sàng hoặc quá thời gian; không tạo kết quả dự phòng giả');}
 finally{inflight--;}
}
module.exports={request};

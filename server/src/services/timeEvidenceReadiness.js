'use strict';
const state=(code,message)=>({code,status:code==='READY'?'READY':code==='CHAIN_READ_ONLY'?'READ_ONLY':code==='CUSTODY_RECIPIENT_REQUIRED'?'RECIPIENT_MISSING':/NOT_CONFIGURED|DISABLED|UNAVAILABLE/.test(code)?'CLOUD_NOT_CONFIGURED':'RECIPIENT_INVALID',message});
function configuration(env,configured){
 if(env.APP_ENV==='CLOUD_DEMO'){
  if(env.CLOUD_WEB3_ENABLED!=='true')return state('CHAIN_NOT_CONFIGURED','Chưa bật cấu hình blockchain Sepolia');
  if(env.WEB3_LOCAL_READ_ONLY!=='false'||env.CLOUD_WEB3_WRITE_ENABLED!=='true')return state('CHAIN_READ_ONLY','Blockchain đang chỉ đọc; chưa cho phép ghi bằng chứng');
  if(!configured)return state('CHAIN_NOT_CONFIGURED','Cấu hình manifest, chain hoặc địa chỉ signer chưa hợp lệ');
  if(env.CLOUD_CUSTODY_ENABLED!=='true')return state('CLOUD_CUSTODY_DISABLED','Chưa cấu hình dịch vụ người nhận Sepolia');
 }else{
  if(!configured)return state('CHAIN_NOT_CONFIGURED','Chưa cấu hình blockchain');
  if(env.WEB3_LOCAL_READ_ONLY==='true')return state('CHAIN_READ_ONLY','Blockchain đang chỉ đọc; chưa cho phép ghi bằng chứng');
 }
 return state('READY','');
}
function failure(error){
 const code=error.code||'RECIPIENT_UNVERIFIED';
 if(code==='CUSTODY_RECIPIENT_REQUIRED')return state(code,'Chưa có địa chỉ nhận chứng nhận Sepolia/hệ thống cho sinh viên');
 if(code==='CLOUD_CUSTODY_DISABLED'||code==='CUSTODY_UNAVAILABLE')return state(code,'Dịch vụ người nhận blockchain chưa được cấu hình');
 if(/KEY|VAULT|DECRYPT/.test(code))return state(code,'Không thể xác minh người nhận bằng khóa mã hóa đã cấu hình');
 if(/MAPPING|CONFLICT|LEGACY/.test(code))return state(code,'Ánh xạ sinh viên và người nhận không hợp lệ; cần quản trị kiểm tra');
 if(/CLOUD_|CHAIN_|DATABASE/.test(code))return state(code,'Cấu hình hoặc danh tính môi trường blockchain chưa được xác minh');
 return state(code,'Chưa xác minh được người nhận blockchain');
}
module.exports={configuration,failure};

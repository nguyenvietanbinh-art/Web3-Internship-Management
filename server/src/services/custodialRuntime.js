'use strict';
const mongoose=require('mongoose'),{HttpError}=require('../utils/http');
let instance=null,injected=null;
const enabled=()=>process.env.CUSTODIAL_LOCAL_TEST_ENABLED==='true'||(process.env.CLOUD_CUSTODY_ENABLED==='true'&&require('./cloudWeb3Runtime').selected());
function service(){
 if(require('./cloudWeb3Runtime').selected())return require('./cloudCustodialRuntime').service();
 if(!enabled()||mongoose.connection.readyState!==1)throw new HttpError(503,'Dịch vụ ví lưu ký chưa được cấu hình','CUSTODY_UNAVAILABLE');
 if(instance)return instance;
 const {loadVault}=require('./custodialVault'),{createRecipients}=require('./custodialRecipients'),chain=require('./localWeb3'),{ChainOperation}=require('../models/Web3Models');
 const vault=loadVault(),recipients=createRecipients({db:mongoose.connection.db,vault});
 const adapter={
  execute:(user,args)=>chain.execute(user,args),
  async verify(proof){const op=await ChainOperation.findOne({operationId:proof.operationId});const checked=await chain.verification(op);if(!checked.verified)throw new HttpError(503,'Giao dịch chưa xác minh',checked.errorCode||'CHAIN_UNAVAILABLE');return checked;},
  async certificateOrNull(a){try{return await chain.certificate(a);}catch(e){if(e.code==='CERTIFICATE_NOT_FOUND')return null;throw e;}},
 };
 const queue=require('./certificateQueue').createQueue({db:mongoose.connection.db,recipients,adapter});
 instance={vault,recipients,queue};return instance;
}
function testContext(){return injected;}
function installTestContext(factory,metadata){
 if(process.env.NODE_ENV!=='test'||process.env.CUSTODIAL_ISOLATED_TEST!=='true'||mongoose.connection.name!==require('./custodialRecipients').CD)throw Error('CUSTODY_TEST_CONTEXT_DENIED');
 factory.metadata=Object.freeze(metadata);injected=factory;
}
function close(){require('./cloudCustodialRuntime').close();instance?.vault.close();instance=null;injected=null;}
module.exports={enabled,service,testContext,installTestContext,close};

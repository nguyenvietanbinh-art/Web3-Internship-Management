'use strict';
const fs=require('node:fs'),path=require('node:path'),{ethers}=require('ethers');
const {HttpError}=require('../utils/http');
const {createGateway}=require('./transactionJournal');
async function send(c,op,verify){
 if(process.env.WEB3_LOCAL_READ_ONLY==='true')throw new HttpError(503,'Chain chỉ đọc','CHAIN_READ_ONLY');
 if(process.env.WEB3_JOURNAL_ENABLED!=='true')throw new HttpError(503,'Gateway journal chưa được bật','JOURNAL_NOT_CONFIGURED');
 const directory=process.env.WEB3_JOURNAL_DIRECTORY,keyFile=process.env.WEB3_JOURNAL_SIGNER_FILE;
 if(!directory||!keyFile||!path.isAbsolute(directory)||!path.isAbsolute(keyFile))throw new HttpError(503,'Thiếu cấu hình journal/khóa ký riêng','JOURNAL_NOT_CONFIGURED');
 const repository=path.resolve(__dirname,'../../..');
 const resolvedKey=fs.realpathSync(keyFile);if(resolvedKey.toLowerCase().startsWith(repository.toLowerCase()+path.sep))throw new HttpError(503,'Khóa ký phải nằm ngoài repository','JOURNAL_UNSAFE_KEY_PATH');
 // Never return/log file bytes or native ethers errors that may include RPC payload.
 let signer;try{signer=new ethers.Wallet(fs.readFileSync(resolvedKey,'utf8').trim());}catch{throw new HttpError(503,'Không đọc được khóa ký hợp lệ','JOURNAL_SIGNER_UNAVAILABLE');}
 const identity={chainId:c.d.chainId,address:c.d.address.toLowerCase(),signer:c.d.deployer.toLowerCase(),deploymentTx:c.d.deploymentTx,genesisHash:c.d.genesisHash,runtimeCodeHash:c.d.runtimeCodeHash,instanceId:c.d.hardhatInstanceId};
 const gateway=createGateway({directory,provider:c.provider,signer,identity,
  validateIdentity:async()=>{
   const [network,metadata,genesis,code,receipt,block]=await Promise.all([c.provider.getNetwork(),c.provider.send('hardhat_metadata',[]),c.provider.getBlock(0),c.provider.getCode(c.d.address),c.provider.getTransactionReceipt(c.d.deploymentTx),c.provider.getBlock(c.d.deploymentBlock)]);
   if(Number(network.chainId)!==identity.chainId||metadata.instanceId!==identity.instanceId||genesis?.hash!==identity.genesisHash||ethers.keccak256(code)!==identity.runtimeCodeHash||receipt?.status!==1||block?.hash!==c.d.deploymentBlockHash)throw new HttpError(503,'Chain deployment không khớp journal','JOURNAL_CHAIN_MISMATCH');
   if(!await c.contract.writers(identity.signer))throw new HttpError(403,'Signer không được ghi','CHAIN_WRITER_DENIED');
  },verifyReceipt:async(receipt,row)=>verify(c,op,row.hash),
 });
 const data=op.kind==='mint'?c.contract.interface.encodeFunctionData('mintCertificate',[op.operationId,op.assignmentKey,op.studentWallet]):c.contract.interface.encodeFunctionData('recordEvidence',[op.operationId,op.assignmentKey,{report:1,attendance:2,completion:3}[op.kind],op.digest,op.studentWallet,op.refURI]);
 return gateway.send({operationId:op.operationId,to:c.d.address,data});
}
module.exports={send};

// Explicitly selected Cloud adapter. No startup worker, indexes or provisioning.
'use strict';
const fs=require('node:fs'),path=require('node:path'),mongoose=require('mongoose'),{ethers}=require('ethers');
const {HttpError}=require('../utils/http');
const selected=()=>process.env.APP_ENV==='CLOUD_DEMO'&&process.env.CLOUD_WEB3_ENABLED==='true';
const error=(code)=>new HttpError(503,'Web3 Cloud chưa đáp ứng cấu hình hoặc xác minh',code);
function metadata(){
 let manifest;try{manifest=JSON.parse(fs.readFileSync(process.env.CLOUD_WEB3_MANIFEST_FILE,'utf8'));}catch{throw error('CLOUD_MANIFEST_REQUIRED');}
 let c;try{c=require('../config/sepoliaPolicy').configuration(process.env,manifest);}catch{throw error('CLOUD_CHAIN_POLICY_REJECTED');}
 const signer=process.env.CLOUD_WEB3_SIGNER_ADDRESS;if(!ethers.isAddress(signer||''))throw error('CLOUD_SIGNER_ADDRESS_REQUIRED');
 return{...manifest,rpcUrl:c.rpcUrl,confirmations:c.confirmations,signerAddress:signer,hardhatInstanceId:'sepolia:'+manifest.genesisHash+':'+manifest.deploymentTx,cloud:true};
}
async function guard(){if(!selected())throw error('CLOUD_WEB3_DISABLED');await require('./databaseSafety').verifyDatabaseIdentity(process.env,mongoose.connection);}
async function context(){await guard();const d=metadata(),request=new ethers.FetchRequest(d.rpcUrl);request.timeout=10000;const provider=new ethers.JsonRpcProvider(request,undefined,{batchMaxCount:1,cacheTimeout:-1});try{await require('../config/sepoliaPolicy').verifyDeployment(provider,{manifest:d,confirmations:d.confirmations});const contract=new ethers.Contract(d.address,d.abi,provider);if((await contract.owner()).toLowerCase()!==d.deployer.toLowerCase()||!await contract.writers(d.signerAddress))throw error('CLOUD_WRITER_DENIED');return{d,provider,contract,cloud:true};}catch{provider.destroy();throw error('CLOUD_DEPLOYMENT_UNVERIFIED');}}
async function writeGuard(){await guard();if(process.env.WEB3_LOCAL_READ_ONLY!=='false'||process.env.CLOUD_WEB3_WRITE_ENABLED!=='true')throw error('CHAIN_READ_ONLY');metadata();}
async function send(c,op,verify){
 await writeGuard();const file=process.env.CLOUD_WEB3_SIGNER_FILE;if(!file||!path.isAbsolute(file))throw error('CLOUD_SIGNER_FILE_REQUIRED');
 let signer;try{const resolved=fs.realpathSync(file),root=path.resolve(__dirname,'../../..');if(resolved.toLowerCase().startsWith(root.toLowerCase()+path.sep))throw error('CLOUD_SIGNER_PATH');signer=new ethers.Wallet(fs.readFileSync(resolved,'utf8').trim());}catch{throw error('CLOUD_SIGNER_UNAVAILABLE');}
 const identity={chainId:c.d.chainId,address:c.d.address.toLowerCase(),signer:c.d.signerAddress.toLowerCase(),genesisHash:c.d.genesisHash,deploymentTx:c.d.deploymentTx,runtimeCodeHash:c.d.runtimeCodeHash,confirmations:c.d.confirmations};
 const issuer=ethers.id(JSON.stringify(identity));const store=require('./cloudJournalStore').createStore({db:mongoose.connection.db,client:mongoose.connection.getClient(),issuer,guard});
 const gateway=require('./cloudTransactionGateway').createGateway({store,provider:c.provider,signer,identity,validateIdentity:async()=>{await guard();await require('../config/sepoliaPolicy').verifyDeployment(c.provider,{manifest:c.d,confirmations:c.d.confirmations});if(!await c.contract.writers(identity.signer))throw error('CLOUD_WRITER_DENIED');},verifyReceipt:async(receipt,row)=>{const height=await c.provider.getBlockNumber();if(height-receipt.blockNumber+1<c.d.confirmations)throw error('CLOUD_CONFIRMATIONS_PENDING');return verify(c,op,row.hash);}});
 const data=op.kind==='mint'?c.contract.interface.encodeFunctionData('mintCertificate',[op.operationId,op.assignmentKey,op.studentWallet]):c.contract.interface.encodeFunctionData('recordEvidence',[op.operationId,op.assignmentKey,{report:1,attendance:2,completion:3}[op.kind],op.digest,op.studentWallet,op.refURI]);
 return gateway.send({operationId:op.operationId,to:c.d.address,data});
}
async function publicTransaction(op){if(!selected())return{};try{const d=metadata();if(op.chainId!==11155111||op.deploymentTx!==d.deploymentTx)return{journalState:'LEGACY_CHAIN'};await guard();const row=await mongoose.connection.db.collection('blockchain_transaction_journal').findOne({operationId:op.operationId},{projection:{state:1,hash:1,blockNumber:1,blockHash:1}});return row?{journalState:row.state,txHash:row.hash,blockNumber:row.blockNumber,blockHash:row.blockHash}:{};}catch{return{journalState:'UNAVAILABLE'};}}
module.exports={selected,metadata,context,writeGuard,send,guard,publicTransaction};

const identity=require('./businessIdentity');
const fs=require('node:fs'),{ethers}=require('ethers');
const {HttpError}=require('../utils/http'),{assertTestEnvironment}=require('../config/testDatabaseGuard');
const {ChainOperation}=require('../models/Web3Models'),v=require('../core/shared');
const hash=text=>ethers.keccak256(ethers.toUtf8Bytes(text));
const kindId={report:1,attendance:2,completion:3};
function assertTest(){if(process.env.SCHOOL_WORKFLOW_ENABLED==='true')return require('../config/workflowTestGuard').assertWorkflowTest();assertTestEnvironment({nodeEnv:process.env.NODE_ENV,uri:process.env.MONGODB_URI,allowlistedUri:process.env.MONGODB_URI_TEST_ALLOWLIST});}
function metadata(){
 if(process.env.WEB3_LOCAL_ENABLED!=='true'||!process.env.WEB3_LOCAL_DEPLOYMENT)throw new HttpError(503,'Web3 local chưa bật/cấu hình','WEB3_NOT_CONFIGURED');
 assertTest();let d;try{d=JSON.parse(fs.readFileSync(process.env.WEB3_LOCAL_DEPLOYMENT,'utf8'));}catch{throw new HttpError(503,'Không đọc được metadata deployment local','WEB3_NOT_CONFIGURED');}
 const rpc=process.env.SCHOOL_WORKFLOW_ENABLED==='true'?'http://127.0.0.1:18546':'http://127.0.0.1:18545';
 if(d.chainId!==31337||d.rpcUrl!==rpc||!ethers.isAddress(d.address)||!ethers.isAddress(d.deployer)||d.localTestOnly!==true||!Array.isArray(d.abi)||!/^0x[a-f0-9]{64}$/i.test(d.deploymentTx))throw new HttpError(503,'Deployment không thuộc môi trường Hardhat local được phép','WEB3_UNSAFE_CONFIG');return d;
}
async function context(){
 const d=metadata(),request=new ethers.FetchRequest(d.rpcUrl);request.timeout=4000;
 const provider=new ethers.JsonRpcProvider(request,undefined,{batchMaxCount:1,cacheTimeout:-1,pollingInterval:100});
 try{
  const [network,genesis,code,receipt,block,hardhat]=await Promise.all([provider.getNetwork(),provider.getBlock(0),provider.getCode(d.address),provider.getTransactionReceipt(d.deploymentTx),provider.getBlock(d.deploymentBlock),provider.send('hardhat_metadata',[])]);
  if(network.chainId!==31337n||hardhat.instanceId!==d.hardhatInstanceId||genesis?.hash!==d.genesisHash||code==='0x'||ethers.keccak256(code)!==d.runtimeCodeHash||receipt?.status!==1||receipt.contractAddress?.toLowerCase()!==d.address.toLowerCase()||receipt.from.toLowerCase()!==d.deployer.toLowerCase()||block?.hash!==d.deploymentBlockHash)throw new HttpError(503,'Chain reset hoặc deployment/code không còn khớp; không xác minh','CHAIN_DEPLOYMENT_MISMATCH');
  const contract=new ethers.Contract(d.address,d.abi,provider);return{d,provider,contract};
 }catch(e){provider.destroy();if(e instanceof HttpError)throw e;throw new HttpError(503,'RPC Hardhat local không khả dụng','CHAIN_UNAVAILABLE');}
}
async function status(){let c;try{c=await context();return{enabled:true,available:true,chainId:31337,contractAddress:c.d.address,deploymentTx:c.d.deploymentTx,attestor:c.d.deployer,signerMode:'local-hardhat-attestor-not-user-wallet',network:'Hardhat local',certificateStandard:'ERC721/ERC5192',mainnetAllowed:false};}catch(e){return{enabled:process.env.WEB3_LOCAL_ENABLED==='true',available:false,verified:false,reason:e.code||'CHAIN_UNAVAILABLE',message:e instanceof HttpError?e.message:'Web3 local chưa sẵn sàng'};}finally{c?.provider.destroy();}}
function dto(op){const o=op.toObject?op.toObject():op;return{id:o._id,operationId:o.operationId,assignmentId:o.assignmentId,targetId:o.targetId,kind:o.kind,state:o.state,txHash:o.txHash||null,blockHash:o.blockHash||null,blockNumber:o.blockNumber??null,chainId:o.chainId,contractAddress:o.contractAddress,tokenId:o.tokenId||null,digest:o.digest,refURI:o.refURI,errorCode:o.errorCode,attempts:o.attempts,signerMode:'local-hardhat-attestor-not-user-wallet'};}
async function findMined(c,op){
 const iface=c.contract.interface;const name=op.kind==='mint'?'CertificateIssued':'EvidenceRecorded';
 const logs=await c.provider.getLogs({address:c.d.address,fromBlock:c.d.deploymentBlock,toBlock:'latest',topics:[iface.getEvent(name).topicHash,op.operationId]});
 if(logs.length!==1)throw new HttpError(409,'Chưa tìm được event duy nhất để reconciliation','CHAIN_PENDING');return logs[0].transactionHash;
}
async function verify(c,op,txHash){
 if(op.chainInstanceId!==c.d.hardhatInstanceId||op.deploymentTx!==c.d.deploymentTx||op.contractAddress!==c.d.address.toLowerCase()||op.chainId!==31337)throw new HttpError(409,'Operation thuộc chain instance/deployment khác','CHAIN_DEPLOYMENT_MISMATCH');
 const [receipt,transaction]=await Promise.all([c.provider.getTransactionReceipt(txHash),c.provider.getTransaction(txHash)]);
 if(!receipt)throw new HttpError(409,'Giao dịch chưa có receipt; cần đối chiếu lại','CHAIN_PENDING');
 if(receipt.status!==1)throw new HttpError(409,'Giao dịch đã thất bại on-chain','CHAIN_FAILED');
 if(receipt.hash.toLowerCase()!==txHash.toLowerCase()||receipt.to?.toLowerCase()!==c.d.address.toLowerCase()||receipt.from.toLowerCase()!==c.d.deployer.toLowerCase()||transaction?.to?.toLowerCase()!==c.d.address.toLowerCase())throw new HttpError(409,'Receipt/signer/address không khớp','RECEIPT_MISMATCH');
 const block=await c.provider.getBlock(receipt.blockNumber);if(block?.hash!==receipt.blockHash)throw new HttpError(503,'Receipt không ở canonical block','CHAIN_REORG');
 let input;try{input=c.contract.interface.parseTransaction({data:transaction.data,value:transaction.value});}catch{throw new HttpError(409,'Không đọc được calldata','RECEIPT_MISMATCH');}
 if(input.args[0]!==op.operationId||input.args[1]!==op.assignmentKey)throw new HttpError(409,'Operation/assignment khác calldata','RECEIPT_MISMATCH');
 const events=[];for(const log of receipt.logs){if(log.address.toLowerCase()!==c.d.address.toLowerCase())continue;try{events.push(c.contract.interface.parseLog(log));}catch{}}
 let tokenId;
 if(op.kind==='mint'){
  const event=events.find(e=>e?.name==='CertificateIssued'&&e.args.operationId===op.operationId&&e.args.assignment===op.assignmentKey&&e.args.student.toLowerCase()===op.studentWallet&&e.args.completionCommitment===op.digest);
  if(input.name!=='mintCertificate'||input.args[2].toLowerCase()!==op.studentWallet||!event)throw new HttpError(409,'Mint event/calldata không khớp','RECEIPT_MISMATCH');
  tokenId=String(event.args.tokenId);const [owner,locked,mapped,standard,commitment]=await Promise.all([c.contract.ownerOf(tokenId),c.contract.locked(tokenId),c.contract.tokenForAssignment(op.assignmentKey),c.contract.supportsInterface('0xb45a3c0e'),c.contract.completionHash(op.assignmentKey)]);
  if(owner.toLowerCase()!==op.studentWallet||!locked||String(mapped)!==tokenId||!standard||commitment!==op.digest)throw new HttpError(409,'Token không khớp người nhận/không soulbound','CERTIFICATE_MISMATCH');
 }else{
  const event=events.find(e=>e?.name==='EvidenceRecorded'&&e.args.operationId===op.operationId&&e.args.assignment===op.assignmentKey&&Number(e.args.kind)===kindId[op.kind]&&e.args.digest===op.digest&&e.args.subject.toLowerCase()===op.studentWallet&&e.args.refURI===op.refURI);
  if(input.name!=='recordEvidence'||Number(input.args[2])!==kindId[op.kind]||input.args[3]!==op.digest||input.args[4].toLowerCase()!==op.studentWallet||input.args[5]!==op.refURI||!event)throw new HttpError(409,'Evidence event/calldata không khớp','RECEIPT_MISMATCH');
  const stored=await c.contract.evidence(op.operationId);if(stored.digest!==op.digest||stored.assignment!==op.assignmentKey||stored.subject.toLowerCase()!==op.studentWallet||Number(stored.kind)!==kindId[op.kind])throw new HttpError(409,'Evidence state không khớp','RECEIPT_MISMATCH');
 }
 return{txHash:receipt.hash,blockHash:receipt.blockHash,blockNumber:receipt.blockNumber,...(tokenId?{tokenId}:{})};
}
let queue=Promise.resolve();
async function execute(user,{assignment,kind,targetId,digest,refURI=''}){
 assignment=await identity.chainAssignment(assignment);
 const c=await context();try{
  const assignmentKey=hash('core-assignment:'+String(assignment._id)),operationId=hash([c.d.hardhatInstanceId,c.d.deploymentTx,kind,String(targetId),digest].join(':'));
  let op;try{op=await ChainOperation.findOneAndUpdate({operationId},{$setOnInsert:{operationId,assignmentId:assignment._id,targetId,kind,actorUserId:user._id,actorWallet:user.walletAddress,studentWallet:assignment.studentWallet,assignmentKey,digest,refURI,chainId:31337,contractAddress:c.d.address.toLowerCase(),deploymentTx:c.d.deploymentTx,chainInstanceId:c.d.hardhatInstanceId,history:[v.event(user,'chain.prepared')]}},{upsert:true,new:true,runValidators:true});}catch(e){if(e.code!==11000)throw e;op=await ChainOperation.findOne({operationId});}
  if(op.refURI!==refURI||op.digest!==digest||op.assignmentKey!==assignmentKey)throw new HttpError(409,'Operation payload không còn khớp','OPERATION_MISMATCH');
  if(op.state==='confirmed'){await verify(c,op,op.txHash);return dto(op);}
  const lease=new Date(Date.now()+20000),now=new Date();op=await ChainOperation.findOneAndUpdate({_id:op._id,state:{$ne:'confirmed'},$or:[{leaseUntil:{$exists:false}},{leaseUntil:null},{leaseUntil:{$lt:now}}]},{$set:{leaseUntil:lease},$inc:{attempts:1}},{new:true});if(!op)throw new HttpError(409,'Operation đang được xử lý; không gửi trùng','OPERATION_BUSY');
  try{
   let txHash=op.txHash;
   if(await c.contract.usedOperations(op.operationId))txHash=await findMined(c,op);
   if(!txHash){
    const send=async()=>{const signer=await c.provider.getSigner(c.d.deployer);if(!await c.contract.writers(c.d.deployer))throw new HttpError(403,'Attestor không có quyền ghi','CHAIN_WRITER_DENIED');const writable=c.contract.connect(signer);return op.kind==='mint'?writable.mintCertificate(op.operationId,op.assignmentKey,op.studentWallet):writable.recordEvidence(op.operationId,op.assignmentKey,kindId[op.kind],op.digest,op.studentWallet,op.refURI);};
    const pending=queue.then(send,send);queue=pending.then(()=>{},()=>{});const tx=await pending;txHash=tx.hash;
    await ChainOperation.updateOne({_id:op._id},{$set:{txHash,state:'submitted',errorCode:''},$push:{history:v.event(user,'chain.submitted',{txHash})}});
   }
   const receipt=await c.provider.waitForTransaction(txHash,1,5000);if(!receipt)throw new HttpError(409,'Transaction pending','CHAIN_PENDING');
   const proof=await verify(c,op,txHash);const done=await ChainOperation.findByIdAndUpdate(op._id,{$set:{...proof,state:'confirmed',errorCode:''},$unset:{leaseUntil:1},$push:{history:v.event(user,'chain.confirmed',proof)}},{new:true});return dto(done);
  }catch(e){
   const code=e instanceof HttpError?e.code||'CHAIN_REJECTED':e.code==='TIMEOUT'?'CHAIN_PENDING':'CHAIN_WRITE_FAILED';
   await ChainOperation.updateOne({_id:op._id},{$set:{state:code==='CHAIN_PENDING'?'submitted':'failed',errorCode:code},$unset:{leaseUntil:1},$push:{history:v.event(user,'chain.not_confirmed',{code})}});
   if(e instanceof HttpError)throw e;if(code==='CHAIN_PENDING')throw new HttpError(409,'Giao dịch pending; dùng đối chiếu, không gửi lại mù quáng',code);throw new HttpError(503,'Giao dịch chưa được xác minh; dùng đối chiếu/retry, không tạo hash giả',code);
  }
 }finally{c.provider.destroy();}
}
async function reconcile(user,op){
 const c=await context();try{const txHash=await findMined(c,op),proof=await verify(c,op,txHash);return dto(await ChainOperation.findByIdAndUpdate(op._id,{$set:{...proof,state:'confirmed',errorCode:''},$unset:{leaseUntil:1},$push:{history:v.event(user,'chain.reconciled',proof)}},{new:true}));}finally{c.provider.destroy();}
}
async function certificate(assignment){
 assignment=await identity.chainAssignment(assignment);
 const c=await context();try{
  const op=await ChainOperation.findOne({assignmentId:assignment._id,kind:'mint',deploymentTx:c.d.deploymentTx,chainInstanceId:c.d.hardhatInstanceId,state:'confirmed'});if(!op)throw new HttpError(404,'Chưa có chứng nhận đã mint được xác nhận','CERTIFICATE_NOT_FOUND');
  const proof=await verify(c,op,op.txHash);return{verified:true,locked:true,standard:'ERC721/ERC5192',tokenId:proof.tokenId,owner:assignment.studentWallet,chainId:31337,contractAddress:c.d.address,txHash:proof.txHash,blockNumber:proof.blockNumber,blockHash:proof.blockHash,assignmentId:assignment._id,metadataURI:await c.contract.tokenURI(proof.tokenId),signerMode:'local-hardhat-attestor-not-user-wallet'};
 }finally{c.provider.destroy();}
}
module.exports={assertTest,metadata,context,status,dto,execute,reconcile,certificate,verify,hash};

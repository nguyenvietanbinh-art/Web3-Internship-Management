'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Transaction,keccak256}=require('ethers');
const fail=code=>Object.assign(new Error(code),{code});
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const states=new Set(['PREPARED','BROADCAST','CONFIRMED','FAILED','RECOVERY_REQUIRED']);

// One directory is one chain deployment and one issuer. No stale-lock auto removal.
function createGateway({directory,provider,signer,identity,validateIdentity,verifyReceipt,hooks={}}){
 if(!path.isAbsolute(directory)||!fs.statSync(directory).isDirectory())throw fail('JOURNAL_DIRECTORY_REQUIRED');
 const file=path.join(directory,'transactions.jsonl'),lock=path.join(directory,'issuer.lock');
 function read(){
  if(!fs.existsSync(file))return[];
  const data=fs.readFileSync(file,'utf8');if(data&&!data.endsWith('\n'))throw fail('JOURNAL_TORN_WRITE');
  let previous='GENESIS';const entries=[];
  for(const line of data.split('\n').filter(Boolean)){let row;try{row=JSON.parse(line);}catch{throw fail('JOURNAL_CORRUPT');}
   if(row.previous!==previous||row.hash!==sha({previous:row.previous,entry:row.entry})||!same(row.entry.identity,identity)||!states.has(row.entry.state))throw fail('JOURNAL_CORRUPT_OR_IDENTITY');
   try{const tx=Transaction.from(row.entry.raw);if(keccak256(row.entry.raw)!==row.entry.hash||tx.from?.toLowerCase()!==identity.signer.toLowerCase()||Number(tx.chainId)!==identity.chainId||tx.to?.toLowerCase()!==identity.address.toLowerCase()||tx.nonce!==row.entry.nonce||tx.value!==0n||sha({operationId:row.entry.operationId,to:tx.to.toLowerCase(),data:tx.data,value:'0'})!==row.entry.payloadHash)throw Error();}catch{throw fail('JOURNAL_SIGNATURE_MISMATCH');}
   previous=row.hash;entries.push(row.entry);
  }return entries;
 }
 function append(entry){
  const entries=read(),last=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').at(-1):null;
  const previous=last?JSON.parse(last).hash:'GENESIS';const row={previous,entry:{...entry,identity}};row.hash=sha(row);
  // O_APPEND + exclusive issuer lock; partial writes fail closed on next read.
  const fd=fs.openSync(file,'a',0o600);try{fs.writeFileSync(fd,JSON.stringify(row)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}return entries;
 }
 async function send({operationId,to,data,value='0'}){
  if(!/^0x[0-9a-f]{64}$/i.test(operationId)||to.toLowerCase()!==identity.address.toLowerCase()||value!=='0')throw fail('JOURNAL_PAYLOAD_INVALID');
  let fd;try{fd=fs.openSync(lock,'wx',0o600);}catch{throw fail('JOURNAL_ISSUER_LOCKED');}
  try{
   fs.writeFileSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString()}));fs.fsyncSync(fd);
   await validateIdentity();
   const address=(await signer.getAddress()).toLowerCase();if(address!==identity.signer.toLowerCase())throw fail('JOURNAL_SIGNER_MISMATCH');
   const entries=read(),latest=new Map(entries.map(e=>[e.operationId,e]));
   const payloadHash=sha({operationId,to:to.toLowerCase(),data,value}),old=latest.get(operationId);
   if(old&&old.payloadHash!==payloadHash)throw fail('JOURNAL_OPERATION_CONFLICT');
   if([...latest.values()].some(e=>e.operationId!==operationId&&!['CONFIRMED','FAILED'].includes(e.state)))throw fail('JOURNAL_PREVIOUS_UNRESOLVED');
   let row=old;
   if(!row){
    const [nonce,latestNonce]=await Promise.all([provider.getTransactionCount(address,'pending'),provider.getTransactionCount(address,'latest')]);
    if(nonce!==latestNonce)throw fail('JOURNAL_EXTERNAL_PENDING');
    const prior=[...latest.values()].at(-1);if(prior&&nonce!==prior.nonce+1)throw fail('JOURNAL_NONCE_DRIFT');
    const fee=await provider.getFeeData();if(fee.gasPrice==null)throw fail('JOURNAL_FEE_UNAVAILABLE');
    const gas=await provider.estimateGas({from:address,to,data,value:0});
    const raw=await signer.signTransaction({to,data,value:0,chainId:identity.chainId,nonce,type:0,gasPrice:fee.gasPrice,gasLimit:gas*12n/10n});
    row={operationId,payloadHash,nonce,raw,hash:keccak256(raw),state:'PREPARED',at:new Date().toISOString()};
    const parsed=Transaction.from(raw);if(parsed.from?.toLowerCase()!==address||Number(parsed.chainId)!==identity.chainId||parsed.to?.toLowerCase()!==to.toLowerCase()||parsed.data!==data||parsed.nonce!==nonce||parsed.value!==0n)throw fail('JOURNAL_SIGNATURE_MISMATCH');
    append(row);await hooks.afterPrepared?.(row.hash);
   }
   const transition=(state,extra={})=>{row={...row,...extra,state,at:new Date().toISOString()};append(row);};
   let receipt=await provider.getTransactionReceipt(row.hash);
   if(row.state==='CONFIRMED'&&!receipt){transition('RECOVERY_REQUIRED');throw fail('JOURNAL_CONFIRMED_RECEIPT_MISSING');}
   if(row.state==='FAILED')throw fail('JOURNAL_TRANSACTION_FAILED');
   if(!receipt){
    try{const pending=await provider.getTransaction(row.hash);if(!pending){const tx=await provider.broadcastTransaction(row.raw);if(tx.hash!==row.hash)throw fail('JOURNAL_BROADCAST_HASH_MISMATCH');}
     await hooks.afterBroadcast?.(row.hash);transition('BROADCAST');
     receipt=await provider.waitForTransaction(row.hash,1,5000);
    }catch{transition('RECOVERY_REQUIRED');throw fail('JOURNAL_RECOVERY_REQUIRED');}
   }
   if(!receipt){transition('RECOVERY_REQUIRED');throw fail('JOURNAL_RECEIPT_PENDING');}
   if(receipt.status!==1){transition('FAILED',{blockNumber:receipt.blockNumber});throw fail('JOURNAL_TRANSACTION_FAILED');}
   let proof;try{proof=await verifyReceipt(receipt,row);}catch{transition('RECOVERY_REQUIRED');throw fail('JOURNAL_PROOF_INVALID');} // canonical block, calldata and events.
   if(row.state!=='CONFIRMED')transition('CONFIRMED',{blockNumber:receipt.blockNumber,blockHash:receipt.blockHash});
   return{hash:row.hash,proof};
  }finally{if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(lock);}}
 }
 return{send,inspect:read};
}
module.exports={createGateway};

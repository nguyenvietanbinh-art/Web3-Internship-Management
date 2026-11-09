// Provider/store dependency injection; never starts a worker or discovers old jobs.
'use strict';
const {Transaction,keccak256}=require('ethers'),crypto=require('node:crypto');
const fail=code=>Object.assign(new Error(code),{code});
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function createGateway({store,provider,signer,identity,validateIdentity,verifyReceipt,hooks={}}){
 return{send:payload=>store.withIssuer(async journal=>{
  await validateIdentity();const address=(await signer.getAddress()).toLowerCase();
  if(identity.chainId!==11155111||address!==identity.signer.toLowerCase()||payload.to.toLowerCase()!==identity.address.toLowerCase()||!/^0x[0-9a-f]{64}$/i.test(payload.operationId)||!/^0x[0-9a-f]*$/i.test(payload.data))throw fail('CLOUD_TX_IDENTITY');
  const binding=hash(identity),payloadHash=hash({to:payload.to.toLowerCase(),data:payload.data,operationId:payload.operationId});
  let row=await journal.load(payload.operationId);if(row&&(row.binding!==binding||row.payloadHash!==payloadHash))throw fail('CLOUD_TX_CONFLICT');
  if(!row){
   const all=await journal.all();if(all.some(r=>!['CONFIRMED','FAILED'].includes(r.state)))throw fail('CLOUD_TX_UNRESOLVED');
   const [nonce,latest]=await Promise.all([provider.getTransactionCount(address,'pending'),provider.getTransactionCount(address,'latest')]);
   if(nonce!==latest||(all.length&&nonce!==all.at(-1).nonce+1))throw fail('CLOUD_TX_NONCE_DRIFT');
   const fee=await provider.getFeeData();if(fee.maxFeePerGas==null||fee.maxPriorityFeePerGas==null)throw fail('CLOUD_TX_FEES_REQUIRED');
   const gas=await provider.estimateGas({from:address,to:payload.to,data:payload.data,value:0n});
   const raw=await signer.signTransaction({chainId:11155111,nonce,to:payload.to,data:payload.data,value:0n,type:2,maxFeePerGas:fee.maxFeePerGas,maxPriorityFeePerGas:fee.maxPriorityFeePerGas,gasLimit:gas*12n/10n});
   row=await journal.prepare({operationId:payload.operationId,binding,payloadHash,nonce,raw,hash:keccak256(raw),state:'PREPARED'});await hooks.afterPrepared?.();
  }
  const parsed=Transaction.from(row.raw);if(keccak256(row.raw)!==row.hash||parsed.from?.toLowerCase()!==address||parsed.chainId!==11155111n||parsed.to?.toLowerCase()!==payload.to.toLowerCase()||parsed.data!==payload.data||parsed.value!==0n||parsed.nonce!==row.nonce)throw fail('CLOUD_TX_SIGNATURE');
  let receipt=await provider.getTransactionReceipt(row.hash);
  if(row.state==='FAILED')throw fail('CLOUD_TX_FAILED');
  if(!receipt&&row.state==='CONFIRMED'){await journal.transition(row,'RECOVERY_REQUIRED');throw fail('CLOUD_TX_REORG');}
  if(!receipt){
   await journal.fence();
   try{if(!await provider.getTransaction(row.hash)){const sent=await provider.broadcastTransaction(row.raw);if(sent.hash!==row.hash)throw fail('CLOUD_TX_HASH');}await hooks.afterBroadcast?.();row=await journal.transition(row,'BROADCAST');receipt=await provider.waitForTransaction(row.hash,identity.confirmations||12,15000);}catch{await journal.transition(row,'RECOVERY_REQUIRED');throw fail('CLOUD_TX_RECOVERY_REQUIRED');}
  }
  if(!receipt){await journal.transition(row,'RECOVERY_REQUIRED');throw fail('CLOUD_TX_PENDING');}
  if(receipt.status!==1){await journal.transition(row,'FAILED');throw fail('CLOUD_TX_FAILED');}
  // The injected verifier must recheck canonical confirmations, calldata, event and state.
  let proof;try{proof=await verifyReceipt(receipt,row);}catch(e){await journal.transition(row,'RECOVERY_REQUIRED');throw fail(e.code==='CLOUD_CONFIRMATIONS_PENDING'?'CLOUD_TX_PENDING':'CLOUD_TX_PROOF_INVALID');}
  if(row.state!=='CONFIRMED')await journal.transition(row,'CONFIRMED',{blockNumber:receipt.blockNumber,blockHash:receipt.blockHash});
  return{hash:row.hash,proof};
 })};
}
module.exports={createGateway};

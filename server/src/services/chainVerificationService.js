const { ethers } = require('ethers');
const metadata = require('../contracts/InternshipPlatform.json');
const { HttpError } = require('../utils/http');

/** Pure receipt validation: fixture tests are not evidence of a live chain. */
function validateReceipt({ receipt, networkId, topic, actorWallet, requestedId, address = metadata.address, abi = metadata.abi, expectedChainId = metadata.chainId }) {
  if (Number(networkId) !== Number(expectedChainId) || !Number.isSafeInteger(Number(expectedChainId)) || Number(expectedChainId)<1) throw new HttpError(400,'Sai mạng blockchain');
  if (!receipt || Number(receipt.status)!==1 || !address || receipt.to?.toLowerCase()!==address.toLowerCase() || receipt.from?.toLowerCase()!==actorWallet.toLowerCase()) throw new HttpError(400,'Receipt không xác minh được contract hoặc người ký');
  const iface=new ethers.Interface(abi); let matched;
  for (const log of receipt.logs || []) {
    if(log.address?.toLowerCase()!==address.toLowerCase())continue;
    let event;try{event=iface.parseLog(log)}catch{continue}
    if(!event || !['TopicCreated','TopicAssigned','KPISubmitted','KPIEvaluated','InternshipCompleted'].includes(event.name))continue;
    const id=Number(event.args.topicId);
    if(!Number.isSafeInteger(id)||id<1)continue;
    if(topic.onChainId!=null&&Number(topic.onChainId)!==id)continue;
    if(requestedId!=null&&Number(requestedId)!==id)continue;
    const isCompany=actorWallet.toLowerCase()===topic.companyWallet;
    if(['TopicCreated','TopicAssigned','InternshipCompleted'].includes(event.name)&&!isCompany)continue;
    if(event.name==='TopicCreated'&&(event.args.company?.toLowerCase()!==topic.companyWallet||event.args.title!==topic.title))continue;
    if(event.name!=='TopicCreated'&&topic.onChainId==null)continue;
    if(event.name==='TopicAssigned'&&event.args.student?.toLowerCase()!==topic.assignedStudentWallet)continue;
    if(event.name==='KPISubmitted'&&(actorWallet.toLowerCase()!==topic.assignedStudentWallet||event.args.student?.toLowerCase()!==topic.assignedStudentWallet))continue;
    if(event.name==='KPIEvaluated'&&!isCompany&&actorWallet.toLowerCase()!==topic.mentorWallet)continue;
    if(event.name==='TopicCreated'&&topic.ipfsDetailsHash&&event.args.ipfsDetailsHash!==topic.ipfsDetailsHash)continue;
    if(event.name==='KPISubmitted') {
      const kpi=topic.kpis?.find(k=>k.milestoneIndex===Number(event.args.milestoneIndex));
      if(!kpi||kpi.submissionIpfsHash!==event.args.submissionIpfsHash)continue;
    }
    if(event.name==='KPIEvaluated') {
      const kpi=topic.kpis?.find(k=>k.milestoneIndex===Number(event.args.milestoneIndex));
      if(!kpi||Number(kpi.score)!==Number(event.args.score)||({'approved':2,'rejected':3})[kpi.status]!==Number(event.args.status))continue;
    }
    if(event.name==='InternshipCompleted'&&(Number(event.args.finalScore)!==Number(topic.finalScore)||event.args.certificateIpfsHash!==topic.certificateIpfsHash))continue;
    matched={onChainId:id,eventName:event.name};break;
  }
  if(!matched)throw new HttpError(400,'Không có event hợp lệ thuộc đề tài này');
  return matched;
}
async function verifyTopicTransaction({txHash,topic,actorWallet,requestedId}) {
  if(process.env.CHAIN_VERIFICATION_ENABLED!=='true'||!process.env.BLOCKCHAIN_RPC_URL)throw new HttpError(503,'Chưa cấu hình xác minh receipt blockchain','CHAIN_UNAVAILABLE');
  const provider=new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  let timer;
  try{
    const [receipt,network]=await Promise.race([
      Promise.all([provider.getTransactionReceipt(txHash),provider.getNetwork()]),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('RPC timeout')),4000)})]);
    if(!receipt)throw new HttpError(409,'Giao dịch chưa được xác nhận','CHAIN_PENDING');
    if(receipt.hash?.toLowerCase()!==txHash.toLowerCase())throw new HttpError(400,'Receipt không khớp transaction hash');
    return {...validateReceipt({receipt,networkId:network.chainId,topic,actorWallet,requestedId}),txHash:receipt.hash,chainId:Number(network.chainId)};
  }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(503,'RPC không khả dụng','CHAIN_UNAVAILABLE')}
  finally{clearTimeout(timer);provider.destroy()}
}
module.exports={validateReceipt,verifyTopicTransaction};

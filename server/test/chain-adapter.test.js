const test=require('node:test'),assert=require('node:assert/strict');
const {ethers}=require('ethers');
const {validateReceipt,verifyTopicTransaction}=require('../src/services/chainVerificationService');
test('receipt adapter rejects wrong chain/signer/contract/status and unbound topic events',()=>{
  const company='0x0000000000000000000000000000000000000001',address='0x0000000000000000000000000000000000000002';
  const abi=['event TopicCreated(uint256 indexed topicId,address indexed company,string title)'];
  const iface=new ethers.Interface(abi),encoded=iface.encodeEventLog(iface.getEvent('TopicCreated'),[7,company,'Receipt fixture']);
  const receipt={status:1,to:address,from:company,logs:[{address,...encoded}]};
  const args={receipt,networkId:31337,expectedChainId:31337,address,abi,topic:{title:'Receipt fixture',companyWallet:company},actorWallet:company};
  assert.equal(validateReceipt(args).onChainId,7); // Explicit ABI fixture; no chain transaction occurred.
  for(const change of [{networkId:1},{actorWallet:address},{requestedId:8},{topic:{...args.topic,title:'Another title'}},{receipt:{...receipt,status:0}},{receipt:{...receipt,to:company}},{receipt:{...receipt,logs:[]}}])assert.throws(()=>validateReceipt({...args,...change}));
});
test('disabled verifier is unavailable rather than writing or fabricating receipt',async()=>{
  const previous=process.env.CHAIN_VERIFICATION_ENABLED;process.env.CHAIN_VERIFICATION_ENABLED='false';
  try{await assert.rejects(verifyTopicTransaction({}),e=>e.status===503&&e.code==='CHAIN_UNAVAILABLE')}
  finally{if(previous===undefined)delete process.env.CHAIN_VERIFICATION_ENABLED;else process.env.CHAIN_VERIFICATION_ENABLED=previous}
});

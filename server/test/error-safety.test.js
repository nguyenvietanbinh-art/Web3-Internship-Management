const test=require('node:test'),assert=require('node:assert/strict');
test('legacy public IPFS is privacy-blocked even with credentials; no private report or secret escapes',async()=>{
  const axios=require('axios'),ipfs=require('../src/services/ipfsService');
  const oldPost=axios.post,oldCredential=process.env.PINATA_JWT;process.env.PINATA_JWT='TEST_ONLY_NOT_A_REAL_TOKEN';
  axios.post=async()=>{const err=new Error('TEST-CREDENTIAL-IN-ERROR');err.response={data:{error:{details:'TEST-CREDENTIAL-IN-ERROR private report'}}};throw err};
  try{await assert.rejects(ipfs.uploadToIPFS({test:true}),err=>err.status===503&&err.code==='IPFS_PRIVACY_BLOCKED'&&!err.message.includes('TEST-CREDENTIAL-IN-ERROR')&&!err.message.includes('private report'))}
  finally{axios.post=oldPost;if(oldCredential===undefined)delete process.env.PINATA_JWT;else process.env.PINATA_JWT=oldCredential}
});
test('oversized/unknown errors do not leak payloads in client response or logs',()=>{
  const {errorHandler}=require('../src/middleware/errorHandler');let status,body,logged;
  const res={status(value){status=value;return this},json(value){body=value;return this}},old=console.error;
  console.error=(...args)=>{logged=args.join(' ')};
  try{
    errorHandler({type:'entity.too.large',body:'TEST-PRIVATE'},null,res,null);assert.equal(status,413);assert.equal(body.code,'PAYLOAD_TOO_LARGE');
    errorHandler(new Error('TEST-PRIVATE-CREDENTIAL'),null,res,null);assert.equal(status,500);assert.ok(!JSON.stringify(body).includes('TEST-PRIVATE'));assert.ok(!logged.includes('TEST-PRIVATE'));
  }finally{console.error=old}
});

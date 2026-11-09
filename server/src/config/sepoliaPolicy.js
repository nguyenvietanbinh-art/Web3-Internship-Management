// Separate read-only preflight policy. Never bypasses the existing Cloud database guard.
'use strict';
const {isAddress,ZeroAddress,keccak256}=require('ethers');
const {isIP}=require('node:net');
const fail=code=>{throw Object.assign(new Error(code),{code});};
const hash=x=>typeof x==='string'&&/^0x[0-9a-f]{64}$/i.test(x);
function configuration(env,manifest){
 if(env.APP_ENV!=='CLOUD_DEMO'||env.NODE_ENV!=='production'||env.CLOUD_WEB3_NETWORK!=='sepolia'||env.CLOUD_WEB3_CHAIN_ID!=='11155111')fail('SEPOLIA_ENV_REJECTED');
 let rpc;try{rpc=new URL(env.CLOUD_WEB3_RPC_URL);}catch{fail('SEPOLIA_RPC_REQUIRED');}
 if(rpc.protocol!=='https:'||rpc.username||rpc.password||rpc.hash||rpc.port||rpc.hostname!==env.CLOUD_WEB3_RPC_HOST||isIP(rpc.hostname)||!rpc.hostname.includes('.')||rpc.hostname.endsWith('.local')||rpc.hostname==='localhost')fail('SEPOLIA_RPC_REJECTED');
 if(!manifest||manifest.chainId!==11155111||!isAddress(manifest.address)||manifest.address===ZeroAddress||!isAddress(manifest.deployer)||manifest.deployer===ZeroAddress||!hash(manifest.deploymentTx)||!hash(manifest.genesisHash)||!hash(manifest.deploymentBlockHash)||!hash(manifest.runtimeCodeHash)||!Number.isSafeInteger(manifest.deploymentBlock)||manifest.deploymentBlock<1||!Array.isArray(manifest.abi)||!manifest.abi.length)fail('SEPOLIA_MANIFEST_REJECTED');
 const confirmations=Number(env.CLOUD_WEB3_CONFIRMATIONS||12);if(!Number.isSafeInteger(confirmations)||confirmations<12||confirmations>128)fail('SEPOLIA_CONFIRMATIONS_REJECTED');
 return Object.freeze({chainId:11155111,rpcUrl:rpc.href,confirmations,manifest});
}
async function verifyDeployment(provider,config){
 const d=config.manifest;
 const [network,genesis,code,receipt,block,height]=await Promise.all([provider.getNetwork(),provider.getBlock(0),provider.getCode(d.address),provider.getTransactionReceipt(d.deploymentTx),provider.getBlock(d.deploymentBlock),provider.getBlockNumber()]);
 if(Number(network.chainId)!==11155111||genesis?.hash!==d.genesisHash||code==='0x'||keccak256(code)!==d.runtimeCodeHash||receipt?.status!==1||receipt.hash?.toLowerCase()!==d.deploymentTx.toLowerCase()||receipt.contractAddress?.toLowerCase()!==d.address.toLowerCase()||receipt.from?.toLowerCase()!==d.deployer.toLowerCase()||receipt.blockHash!==d.deploymentBlockHash||receipt.blockNumber!==d.deploymentBlock||block?.hash!==d.deploymentBlockHash||height-d.deploymentBlock+1<config.confirmations)fail('SEPOLIA_DEPLOYMENT_UNVERIFIED');
 return{verified:true,chainId:11155111,contractAddress:d.address,deploymentTx:d.deploymentTx,confirmations:height-d.deploymentBlock+1};
}
module.exports={configuration,verifyDeployment};

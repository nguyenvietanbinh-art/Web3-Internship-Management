const fs=require('node:fs'),path=require('node:path');
const hre=require('hardhat');
(async()=>{
 if(hre.network.name!=='localhost')throw Error('Deploy only to explicit localhost network');
 const rpcUrl=hre.network.config.url;
 if(!['http://127.0.0.1:18545','http://127.0.0.1:18546'].includes(rpcUrl))throw Error('Unexpected local RPC');
 const output=path.resolve(process.env.LOCAL_DEPLOYMENT_OUTPUT||path.join(__dirname,'../node_modules/.cache/phase5-20261031/deployment.json'));
 const allowed=path.resolve(__dirname,'../node_modules/.cache')+path.sep;if(!output.startsWith(allowed)||fs.existsSync(output))throw Error('Refuse existing/out-of-cache deployment metadata before sending a transaction');
 const {ethers}=hre,network=await ethers.provider.getNetwork();if(network.chainId!==31337n)throw Error('Only Hardhat31337 allowed');
 const [signer]=await ethers.getSigners(),contract=await(await ethers.getContractFactory('InternshipEvidenceSBT')).deploy();await contract.waitForDeployment();
 const tx=contract.deploymentTransaction(),receipt=await tx.wait();if(receipt.status!==1)throw Error('Deployment failed');
 const address=await contract.getAddress(),code=await ethers.provider.getCode(address),genesis=await ethers.provider.getBlock(0),block=await ethers.provider.getBlock(receipt.blockNumber),artifact=await hre.artifacts.readArtifact('InternshipEvidenceSBT');
 const hardhat=await ethers.provider.send('hardhat_metadata',[]);
 const result={contract:'InternshipEvidenceSBT',chainId:31337,rpcUrl,address,deployer:signer.address,deploymentTx:receipt.hash,deploymentBlock:receipt.blockNumber,deploymentBlockHash:block.hash,genesisHash:genesis.hash,runtimeCodeHash:ethers.keccak256(code),hardhatInstanceId:hardhat.instanceId,abi:artifact.abi,solidity:'0.8.24',localTestOnly:true};
 fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({address,chainId:31337,deploymentTx:receipt.hash,block:receipt.blockNumber}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});

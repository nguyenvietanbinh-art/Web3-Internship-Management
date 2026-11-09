// Read-only / unsigned tools. Deliberately has no private-key or broadcast path.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{ContractFactory,JsonRpcProvider,Contract}=require('ethers');
(async()=>{let provider;try{
 const mode=process.argv[2];
 if(mode==='prepare'){
  const file=process.env.SEPOLIA_ARTIFACT_FILE;if(!file)throw Error('ARTIFACT_FILE_REQUIRED');
  const artifact=JSON.parse(fs.readFileSync(file));if(artifact.contractName!=='InternshipEvidenceSBT'||!artifact.bytecode?.startsWith('0x')||!Array.isArray(artifact.abi))throw Error('ARTIFACT_REJECTED');
  const output=process.env.SEPOLIA_UNSIGNED_PLAN_FILE;if(!output)throw Error('OUTPUT_FILE_REQUIRED');
  const tx=await new ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction();
  const source=fs.readFileSync(path.join(__dirname,'../contracts/InternshipEvidenceSBT.sol'));
  fs.writeFileSync(output,JSON.stringify({network:'sepolia',chainId:11155111,unsigned:true,broadcast:false,transaction:{chainId:11155111,data:tx.data,value:'0'},sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),compilerVerificationRequired:true},null,2),{flag:'wx'});
  console.log('UNSIGNED_PLAN_WRITTEN; no RPC, key or transaction sent');
 }else if(mode==='verify'){
  const policy=require('../../server/src/config/sepoliaPolicy'),d=JSON.parse(fs.readFileSync(process.env.CLOUD_WEB3_MANIFEST_FILE)),c=policy.configuration(process.env,d);
  const request=new (require('ethers').FetchRequest)(c.rpcUrl);request.timeout=10000;provider=new JsonRpcProvider(request,undefined,{batchMaxCount:1});
  const verified=await policy.verifyDeployment(provider,c),contract=new Contract(d.address,d.abi,provider);
  if((await contract.owner()).toLowerCase()!==d.deployer.toLowerCase()||!await contract.writers(d.deployer)||!await contract.supportsInterface('0xb45a3c0e'))throw Error('CONTRACT_OWNER_WRITER_STANDARD_REJECTED');
  console.log(JSON.stringify(verified));
 }else throw Error('USE_PREPARE_OR_VERIFY_ONLY');
 }finally{provider?.destroy();}})().catch(()=>{console.error('SEPOLIA_PREFLIGHT_BLOCKED: check configuration/artifact/manifest; no transaction sent');process.exitCode=1;});

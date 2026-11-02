const {root,load,vault,api}=require('./common.cjs'),fs=require('node:fs'),path=require('node:path');
const {Wallet}=require(path.join(root,'server/node_modules/ethers')),{MongoClient}=require(path.join(root,'server/node_modules/mongodb'));
(async()=>{
 const {meta,uri,dir}=load(process.argv[2]);
 if(fs.existsSync(path.join(dir,'accounts.dpapi')))throw Error('Accounts already prepared; never overwrite vault or delete data');
 const client=new MongoClient(uri);
 try{
  await client.connect();const db=client.db();
  for(const {name} of await db.listCollections().toArray())if(await db.collection(name).countDocuments())throw Error('Prepare requires an entirely empty TEST database');
  const accounts={};let companyToken;
  for(const role of ['admin','mentor','company','student']){
   const wallet=Wallet.createRandom();
   if(['admin','mentor'].includes(role))await db.collection('users').insertOne({walletAddress:wallet.address.toLowerCase(),name:'TEST DEMO '+role,role,disabled:false,skills:[],createdAt:new Date(),updatedAt:new Date(),__v:0});
   const n=await api(meta,'POST','/auth/nonce',{walletAddress:wallet.address}),login=await api(meta,'POST','/auth/login-wallet',{walletAddress:wallet.address,signature:await wallet.signMessage(n.message),role,name:'TEST DEMO '+role});
   if(login.user.role!==role)throw Error('Role mismatch');
   accounts[role]={privateKey:wallet.privateKey,address:wallet.address.toLowerCase()};if(role==='company')companyToken=login.token;
  }
  fs.writeFileSync(path.join(dir,'accounts.dpapi'),vault('protect',JSON.stringify({database:meta.database,accounts})),{flag:'wx'});
  const topic=await api(meta,'POST','/topics',{title:'TEST DEMO - React Solidity',description:'Synthetic local internship project, no on-chain creation claimed.',kpis:[{title:'React Solidity implementation',criteria:'Working task and report evidence',weightPercent:100,deadline:new Date(Date.now()+7*864e5).toISOString()}]},companyToken);
  fs.writeFileSync(path.join(dir,'DEMO-CV.pdf'),require(path.join(root,'client/test/phase3-fixtures.cjs')).pdf(),{flag:'wx'});
  fs.writeFileSync(path.join(dir,'accounts-public.json'),JSON.stringify({database:meta.database,fixtureProvenance:'Four TEST wallets; admin/mentor provisioned only in initially empty TEST; actual nonce signatures; one topic created through company API, not blockchain',topicId:topic.topic._id,accounts:Object.fromEntries(Object.entries(accounts).map(([role,a])=>[role,{address:a.address,name:'TEST DEMO '+role}]))},null,2),{flag:'wx'});
  console.log('Prepared four TEST accounts, one API-created topic and a synthetic CV PDF. Wallet material protected by Windows CurrentUser DPAPI; no private key/JWT printed.');
 }finally{await client.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});

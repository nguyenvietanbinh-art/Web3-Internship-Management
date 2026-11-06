// Explicit read-only inspection and local credential export; never a migration runner.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{MongoClient,BSON}=require('mongodb');
const mode=process.argv[2],root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[3]||'');
if(!dir.startsWith(path.join(root,'contracts/node_modules/.cache')+path.sep))throw Error('Use ignored workflow evidence directory');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'workflow-plan.json'))),{vault}=require('../../scripts/demo/common.cjs');
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
async function fingerprint(db){const out={};for(const {name}of await db.listCollections().toArray()){const hash=crypto.createHash('sha256');let count=0;for await(const d of db.collection(name).find({}).sort({_id:1})){hash.update(BSON.EJSON.stringify(d,{relaxed:false}));count++;}out[name]={count,contentDigest:hash.digest('hex'),indexes:await db.collection(name).indexes()};}return out;}
(async()=>{
 if(mode==='credentials'){
  const data=JSON.parse(vault('unprotect',fs.readFileSync(path.join(dir,'accounts.dpapi'),'utf8'))),file=path.join(dir,'manual-login-workflow.txt');
  const text=['INTERNOVA — SYNTHETIC TEST ONLY','URL http://localhost:5188','Không đưa file này vào Git. Không phải tài khoản database gốc.','',...data.accounts.map(a=>`${a.role}\t${a.email}\t${data.passwords[a.role]}`)].join('\r\n');fs.writeFileSync(file,text,{flag:'wx'});console.log('Local ignored credentials exported: '+file);return;
 }
 if(mode!=='verify-source')throw Error('Use credentials or verify-source');
 const source='mongodb://127.0.0.1:27017/web3_internship_test_phase1_khoa_20261106';if(plan.sourceProtected!==source)throw Error('Protected source mismatch');
 const client=new MongoClient(source);try{await client.connect();const before=JSON.parse(fs.readFileSync(path.join(dir,'source-before.json'))),collections=await fingerprint(client.db());const changed=[...new Set([...Object.keys(before.collections),...Object.keys(collections)])].filter(n=>stable(before.collections[n])!==stable(collections[n]));const result={at:new Date().toISOString(),database:before.database,collections,unchanged:changed.length===0,changed};fs.writeFileSync(path.join(dir,'source-after.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({database:before.database,unchanged:result.unchanged,collections:Object.keys(collections).length,changed}));if(changed.length)process.exitCode=1;}finally{await client.close();}
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1});

// Exact-allowlisted TEST only. Creates indexes; replaces conflicting indexes ONLY on empty collections.
// Never merges databases, changes ownership fields, deletes documents, or targets root/demo databases.
const fs=require('node:fs'),path=require('node:path'),{MongoClient}=require('mongodb');
const root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[3]||''),cache=path.join(root,'contracts/node_modules/.cache');
if(!dir.startsWith(cache+path.sep))throw Error('Migration evidence must be in ignored cache');
const uri=process.env.MONGODB_URI_TEST;
require('../src/config/testDatabaseGuard').assertTestEnvironment({nodeEnv:process.env.NODE_ENV,uri,allowlistedUri:process.env.MONGODB_URI_TEST_ALLOWLIST});
process.env.MONGODB_URI=uri;process.env.USER_ID_BUSINESS_ENABLED='true';process.env.EMAIL_AUTH_ENABLED='true';process.env.GOOGLE_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';process.env.WEB3_LOCAL_ENABLED='true';
const mongoose=require('mongoose');mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);require('../src/app').createApp();
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const shape=i=>({key:i.key,unique:Boolean(i.unique),sparse:Boolean(i.sparse),partialFilterExpression:i.partialFilterExpression||{}});
const options=i=>({name:i.name,...(i.unique?{unique:true}:{}),...(i.sparse?{sparse:true}:{}),...(i.partialFilterExpression?{partialFilterExpression:i.partialFilterExpression}:{})});
(async()=>{const c=new MongoClient(uri);await c.connect();try{
 const db=c.db(),mode=process.argv[2];fs.mkdirSync(dir,{recursive:true});
 if(mode==='plan'){
  const changes=[],counts={},names=new Set((await db.listCollections().toArray()).map(x=>x.name));
  for(const Model of Object.values(mongoose.models)){
   const name=Model.collection.name;counts[name]=names.has(name)?await db.collection(name).countDocuments():0;
   const indexes=names.has(name)?await db.collection(name).indexes():[];
   for(const[key,opt]of Model.schema.indexes()){
    const desired={key,...opt,name:opt.name||Object.entries(key).flat().join('_')},existing=indexes.find(i=>i.name===desired.name);
    if(existing&&stable(shape(existing))===stable(shape(desired)))continue;
    if(existing&&counts[name]!==0)throw Error('Nonempty collection index conflict requires separate review: '+name+'/'+desired.name);
    changes.push({collection:name,expectedCount:counts[name],previous:existing||null,desired});
   }
  }
  fs.writeFileSync(path.join(dir,'index-plan.json'),JSON.stringify({createdAt:new Date().toISOString(),database:db.databaseName,counts,changes},null,2),{flag:'wx'});console.log('Index plan only: '+changes.length+' changes; no database writes');
 }else if(mode==='apply'){
  if(!process.argv.includes('--maintenance'))throw Error('Stop application writes and pass --maintenance');
  const p=JSON.parse(fs.readFileSync(path.join(dir,'index-plan.json')));if(p.database!==db.databaseName)throw Error('Plan/database mismatch');
  // Validate every replacement before the first mutation. Maintenance prevents application writes.
  for(const x of p.changes)if(x.previous){const col=db.collection(x.collection),current=(await col.indexes()).find(i=>i.name===x.previous.name);if(await col.countDocuments()!==0||!current||stable(shape(current))!==stable(shape(x.previous)))throw Error('Preflight changed/nonempty collection; no indexes changed: '+x.collection);}
  const applied=[];
  for(const x of p.changes){const col=db.collection(x.collection),indexes=await col.indexes().catch(e=>{if(e.code===26)return[];throw e;}),current=indexes.find(i=>i.name===x.desired.name);
   if(current&&stable(shape(current))===stable(shape(x.desired)))continue;
   if(x.previous){if(await col.countDocuments()!==0||!current||stable(shape(current))!==stable(shape(x.previous)))throw Error('Refuse replacement on changed/nonempty collection: '+x.collection);await col.dropIndex(current.name);}
   try{await col.createIndex(x.desired.key,options(x.desired));}catch(e){if(x.previous)await col.createIndex(x.previous.key,options(x.previous));throw e;}applied.push(x);
  }
  fs.writeFileSync(path.join(dir,'index-applied.json'),JSON.stringify({at:new Date().toISOString(),database:db.databaseName,applied,documentsUpdated:0,documentsDeleted:0},null,2),{flag:'wx'});console.log('TEST indexes ready; documents updated/deleted: 0');
 }else throw Error('Use plan or apply');
}finally{await c.close();await mongoose.disconnect();}})().catch(e=>{console.error(e.message);process.exitCode=1;});

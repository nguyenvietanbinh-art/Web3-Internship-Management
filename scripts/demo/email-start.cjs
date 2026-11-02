// Isolated local email/password demo. No seed, migrations, Google or blockchain transactions.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[2]||''),cache=path.join(root,'contracts/node_modules/.cache');
if(!dir.startsWith(cache+path.sep)||fs.existsSync(path.join(dir,'email-runtime.json')))throw Error('Use a new ignored cache run directory; preserve existing data');
process.env.NODE_ENV='test';process.env.EMAIL_AUTH_ENABLED='true';process.env.GOOGLE_AUTH_ENABLED='false';process.env.CORE_BUSINESS_ENABLED='true';
const h=require(path.join(root,'server/test/helpers'));process.env.CORS_ORIGIN='http://localhost:5182';
const express=require(path.join(root,'server/node_modules/express')),listen=express.application.listen;
express.application.listen=function(port,host,callback){return listen.call(this,port===0?57407:port,host,callback);};
(async()=>{await h.start();fs.mkdirSync(dir,{recursive:true});const meta={createdAt:new Date().toISOString(),pid:process.pid,database:new URL(process.env.MONGODB_URI).pathname.slice(1),baseURL:'http://localhost:57407/api',origin:'http://localhost:5182',emailEnabled:true,googleEnabled:false};fs.writeFileSync(path.join(dir,'email-runtime.json'),JSON.stringify(meta,null,2),{flag:'wx'});console.log('Email TEST ready: '+meta.origin+'; backend '+meta.baseURL+'; database '+meta.database);})().catch(async e=>{console.error(e.code||e.name);await h.stop();process.exitCode=1;});

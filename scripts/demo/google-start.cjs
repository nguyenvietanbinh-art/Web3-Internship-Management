// Separate TEST runtime. No seeding, real credentials, deployment or changes to existing databases.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.resolve(process.argv[2]||'');
const cache=path.join(root,'contracts/node_modules/.cache');
if(!dir.startsWith(cache+path.sep)||fs.existsSync(path.join(dir,'google-runtime.json')))throw Error('Use a new directory under ignored contracts/node_modules/.cache');
process.env.NODE_ENV='test';process.env.GOOGLE_AUTH_ENABLED='true';process.env.CORE_BUSINESS_ENABLED='true';
// test/helpers enforces exact URI and creates a unique child before connecting.
const h=require(path.join(root,'server/test/helpers'));
process.env.CORS_ORIGIN='http://localhost:5178';
const express=require(path.join(root,'server/node_modules/express')),listen=express.application.listen;
express.application.listen=function(port,host,callback){return listen.call(this,port===0?57406:port,host,callback);};
(async()=>{
 await h.start();fs.mkdirSync(dir,{recursive:true});
 const meta={createdAt:new Date().toISOString(),pid:process.pid,database:new URL(process.env.MONGODB_URI).pathname.slice(1),baseURL:'http://localhost:57406/api',origin:'http://localhost:5178',googleRealE2E:'NOT_TESTED'};
 fs.writeFileSync(path.join(dir,'google-runtime.json'),JSON.stringify(meta,null,2),{flag:'wx'});
 console.log('Google TEST backend ready: '+meta.baseURL+'; database: '+meta.database+'; Google configured: '+Boolean(require(path.join(root,'server/src/config/env')).googleEnabled));
})().catch(async error=>{console.error(error.code||error.name);await h.stop();process.exitCode=1;});

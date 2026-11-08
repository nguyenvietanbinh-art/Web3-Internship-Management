const {test}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose');
mongoose.set('autoIndex',false);mongoose.set('autoCreate',false);
const {createApp}=require('../src/app');

test('Render same-origin CORS allows the configured site and denies other origins',async()=>{
 const names=['APP_ENV','RENDER','SERVE_CLIENT','RENDER_EXTERNAL_URL','CORS_ORIGIN'];
 const saved=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{APP_ENV:'CLOUD_DEMO',RENDER:'true',SERVE_CLIENT:'true',RENDER_EXTERNAL_URL:'https://internova-test.onrender.com'});
 delete process.env.CORS_ORIGIN;
 let server;
 try{
  server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const endpoint='http://127.0.0.1:'+server.address().port+'/api/health';
  const allowed=await fetch(endpoint,{headers:{Origin:'https://internova-test.onrender.com'}});
  assert.equal(allowed.status,200);assert.equal(allowed.headers.get('access-control-allow-origin'),'https://internova-test.onrender.com');
  for(const origin of ['https://attacker.example','https://other.onrender.com','http://localhost:5173']){
   const denied=await fetch(endpoint,{headers:{Origin:origin}});
   assert.equal(denied.status,403);assert.equal((await denied.json()).code,'CORS_DENIED');
  }
  const config=require('../src/config/env');
  process.env.RENDER_EXTERNAL_URL='https://internova-test.onrender.com.attacker.example';assert.equal(config.corsOrigin,'');
  process.env.RENDER_EXTERNAL_URL='http://internova-test.onrender.com';assert.equal(config.corsOrigin,'');
  process.env.CORS_ORIGIN='https://custom.example';assert.equal(config.corsOrigin,'https://custom.example');
 }finally{
  if(server)await new Promise(r=>server.close(r));
  for(const [k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});

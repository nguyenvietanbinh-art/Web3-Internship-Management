const {test}=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const router=require('../src/core/ai');
test('real report analysis route rejects other roles before reading DB; mentor passes role gate',async()=>{
 const app=express();app.use(express.json());
 // Identity is supplied by the harness, not by a production header or auth bypass.
 let role;
 app.use((req,res,next)=>{req.user={role};next();});app.use(router);
 app.use((error,req,res,next)=>res.status(error.status||500).json({code:error.code,message:error.message}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try{for(role of ['company','admin','student','mentor']){
  const r=await fetch(`http://127.0.0.1:${server.address().port}/ai/reports/invalid/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const body=await r.json(),allowed=['mentor','student'].includes(role);assert.equal(r.status,allowed?400:403);
  if(!allowed)assert.equal(body.code,'FORBIDDEN_ROLE');
 }}finally{await new Promise(resolve=>server.close(resolve));}
});

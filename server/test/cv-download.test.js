const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{PassThrough}=require('node:stream');
const {downloadCv,publicIpv4,parseUrl}=require('../src/services/cvDownload');
const lookup=async()=>[{address:'93.184.216.34',family:4}];
function transport(responses,seen=[]){return(url,options,callback)=>{
 seen.push({url,options});const req=new EventEmitter();req.destroy=()=>req.emit('error',new Error('destroyed'));req.end=()=>{
  const spec=responses.shift(),res=new PassThrough();res.statusCode=spec.status||200;res.headers=spec.headers||{'content-type':'application/pdf'};callback(res);queueMicrotask(()=>res.end(spec.body||Buffer.from('%PDF-TEST')));
 };return req;
};}
test('only public IPv4 targets and credential-free HTTPS URLs are accepted',async()=>{
 for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','0.0.0.0','198.18.0.1','203.0.113.1','224.0.0.1','::1','::ffff:127.0.0.1'])assert.equal(publicIpv4(ip),false,ip);
 assert.equal(publicIpv4('93.184.216.34'),true);
 for(const url of ['file:///etc/passwd','http://example.com/cv.pdf','https://user:pass@example.com/cv.pdf','https://example.com:8443/cv.pdf','https://[::1]/cv.pdf'])assert.throws(()=>parseUrl(url));
 let called=false;await assert.rejects(downloadCv('https://localhost/cv.pdf',{lookup:async()=>[{address:'127.0.0.1'}],request:()=>{called=true;}}),e=>e.status===400);assert.equal(called,false);
});
test('download pins validated DNS and keeps UTF-8 filenames without sending local auth',async()=>{
 const seen=[],name='CV Sinh viên.pdf';const file=await downloadCv('https://example.com/download',{lookup,request:transport([{headers:{'content-type':'application/pdf','content-disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(name)},body:Buffer.from('%PDF-CV')}],seen)});
 assert.equal(file.name,name);assert.equal(file.mime,'application/pdf');assert.equal(file.buffer.toString(),'%PDF-CV');assert.equal(seen[0].options.headers.Authorization,undefined);assert.equal(seen[0].options.headers.Cookie,undefined);
 await new Promise((ok,no)=>seen[0].options.lookup('example.com',{all:true},(err,result)=>{try{assert.ifError(err);assert.deepEqual(result,[{address:'93.184.216.34',family:4}]);ok();}catch(e){no(e);}}));
});
test('every redirect is revalidated; private and excessive redirects are rejected',async()=>{
 let calls=0;await assert.rejects(downloadCv('https://example.com/cv.pdf',{lookup:async host=>{calls++;return[{address:host==='169.254.169.254'?'169.254.169.254':'93.184.216.34'}];},request:transport([{status:302,headers:{location:'https://169.254.169.254/latest/meta-data'}}])}),e=>e.status===400);assert.equal(calls,2);
 const redirects=Array.from({length:4},()=>({status:302,headers:{location:'/again'}}));await assert.rejects(downloadCv('https://example.com/cv.pdf',{lookup,request:transport(redirects)}),e=>e.status===400);
 const file=await downloadCv('https://example.com/start',{lookup,request:transport([{status:302,headers:{location:'/actual.pdf'}},{body:Buffer.from('%PDF-actual')}])});assert.equal(file.name,'actual.pdf');
});
test('HTML pages and oversized declared/streamed bodies are rejected',async()=>{
 for(const [spec,status]of [[{headers:{'content-type':'text/html'},body:Buffer.from('<html>Login</html>')},415],[{headers:{'content-type':'application/pdf','content-length':String(2*1024*1024+1)}},413],[{body:Buffer.alloc(2*1024*1024+1)},413]])await assert.rejects(downloadCv('https://example.com/cv.pdf',{lookup,request:transport([spec])}),e=>e.status===status);
});

// Lightweight actual production-bundle QA; no AI model load and no external services.
const fs=require('fs'),path=require('path'),net=require('net'),assert=require('node:assert/strict'),{spawn,spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'contracts/node_modules/.cache/production-shell-'+Date.now());fs.mkdirSync(out,{recursive:true});
Object.assign(process.env,{USER_ID_BUSINESS_ENABLED:'true',EMAIL_AUTH_ENABLED:'true',GOOGLE_AUTH_ENABLED:'true',GOOGLE_CLIENT_ID:'',CORE_BUSINESS_ENABLED:'true',WEB3_LOCAL_ENABLED:'false',CORS_ORIGIN:'http://127.0.0.1:5186'});
const h=require(path.join(root,'server/test/helpers')),User=require(path.join(root,'server/src/models/User')),bcrypt=require(path.join(root,'server/node_modules/bcryptjs')),{BrowserHarness,pause}=require('./browserHarness.cjs');
const origin='http://127.0.0.1:5186',password='TEST production shell password';let b,vite,edge;
// helpers deliberately resets its default origin; opt this suite into its own exact origin.
process.env.CORS_ORIGIN=origin;
async function ready(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(150);}throw Error('Service unavailable');}
async function free(port){await new Promise((resolve,reject)=>{const socket=net.createServer();socket.on('error',reject);socket.listen(port,'127.0.0.1',()=>socket.close(resolve));});}
(async()=>{
 await free(5186);await free(9232);
 await h.start();for(const role of ['student','company','mentor','admin'])await User.create({name:'TEST '+role,email:role+'@shell.example.invalid',loginEmail:role+'@shell.example.invalid',passwordHash:await bcrypt.hash(password,12),role});
 const cli=path.join(root,'client/node_modules/vite/bin/vite.js'),buildDir=path.join(out,'dist'),build=spawnSync(process.execPath,[cli,'build','--outDir',buildDir],{cwd:path.join(root,'client'),env:{...process.env,NODE_ENV:'production',VITE_API_URL:h.baseURL,RAYON_NUM_THREADS:'1'},encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(path.join(out,'build.txt'),(build.stdout||'')+(build.stderr||''));assert.equal(build.status,0);
 vite=spawn(process.execPath,[cli,'preview','--outDir',buildDir,'--host','127.0.0.1','--port','5186','--strictPort'],{cwd:path.join(root,'client'),windowsHide:true,stdio:'ignore'});
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--disable-extensions','--renderer-process-limit=2','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9232','--user-data-dir='+path.join(out,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 await ready(origin);await ready('http://127.0.0.1:9232/json/version');b=new BrowserHarness({port:9232,origin,api:h.baseURL,output:out});await b.start();
 await b.check('Minimal login/register preserves labels, validation and has no wallet/role selector',async()=>{
  const writes=b.mutations();await b.click('#connect-wallet-btn');await b.wait("document.querySelector('[aria-label=\"Email đăng nhập\"]')");await pause(250);
  assert.equal(await b.ev("Boolean(document.querySelector('#metamask-native-login-btn') || document.querySelector('[aria-label=\"Loại tài khoản đăng ký ví\"]'))"),false);assert.equal(await b.ev("Boolean(document.querySelector('#register-password-hint'))"),false);assert.ok(!await b.ev("document.querySelector('[role=dialog]').textContent.includes('Tiếp tục với Google')"));await b.screenshot('auth-login-after');
  await b.click('button','Chưa có tài khoản? Đăng ký');await b.wait("document.querySelector('[aria-label=\"Họ tên đăng ký\"]')");assert.equal(await b.ev("Boolean(document.querySelector('[aria-label=\"Loại tài khoản email\"]'))"),false);assert.equal(await b.ev("document.querySelector('[aria-label=\"Mật khẩu Internova\"]').getAttribute('aria-describedby')"),'register-password-hint');assert.ok(await b.ev("document.querySelector('#register-password-hint').textContent.includes('10')"));await b.screenshot('auth-register-after');await b.key('Tab');assert.ok(await b.ev("Boolean(document.activeElement.closest('[role=dialog]'))"));await b.key('Escape');await b.wait("!document.querySelector('[role=dialog]')");assert.equal(await b.ev('document.activeElement.id'),'connect-wallet-btn');assert.equal(b.mutations(),writes);
 });
 for(const role of ['student','company','mentor','admin'])await b.check('Production email login, private menu and clean shell: '+role,async()=>{
  if(await b.ev("Boolean(document.querySelector('#logout-btn'))")){await b.click('#logout-btn');await b.wait("!document.querySelector('#logout-btn')");}
  await b.click('#connect-wallet-btn');await b.field('Email đăng nhập',role+'@shell.example.invalid');await b.field('Mật khẩu Internova',password);await b.click('button[type=submit]','Đăng nhập');await b.wait("document.querySelector('[aria-label=\"Thống kê nghiệp vụ theo kỳ\"]') && !document.querySelector('[role=dialog]')");
  assert.equal(await b.ev("Boolean(document.querySelector('[data-nav=core-accounts]'))"),role==='admin');assert.equal(await b.ev("Boolean(document.querySelector('[data-nav=core-cv]'))"),role==='student');
  assert.equal(await b.ev("Boolean(document.querySelector('.runtime-details'))"),false);assert.ok(!await b.ev("document.body.textContent.includes('Nguồn database')"));
  const writes=b.mutations();await b.nav('core-profile');await b.wait("document.querySelector('[aria-label=\"Họ tên / tên hiển thị\"]')");assert.equal(b.mutations(),writes);await b.screenshot(role+'-profile-after');
  const pages=await b.ev("[...document.querySelectorAll('.desktop-sidebar [data-nav]')].map(e=>e.dataset.nav).filter(id=>id.startsWith('core-')&&id!=='core-profile')");
  for(const page of pages){await b.nav(page);await b.screenshot(role+'-'+page+'-after');assert.equal(b.mutations(),writes,'Automatic mutation on '+page);}
  await b.nav('account-overview');await b.screenshot(role+'-account-overview-after');assert.equal(b.mutations(),writes);
  await b.click('[aria-label="Thông báo"]');await b.wait("document.querySelector('[role=dialog]')");await b.screenshot(role+'-notifications-after');await b.click('[aria-label="Đóng hộp thoại"]');assert.equal(b.mutations(),writes);
  await b.nav('dashboard');
 });
 await b.check('Production tablet/mobile, Light/Dark and no automatic mutations',async()=>{
  const writes=b.mutations();for(const width of [1440,768,375]){await b.viewport(width);assert.ok(await b.ev('document.documentElement.scrollWidth <= innerWidth + 1'));}
  await b.click('[aria-label="Bật Dark Mode"]');assert.equal(await b.ev('document.documentElement.dataset.theme'),'dark');await b.screenshot('production-admin-mobile-dark');assert.equal(b.mutations(),writes);
 });
 const result={...b.result(),environment:'Vite production build, Backend isolated TEST, no AI inference in this smoke suite'};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log('Evidence: '+out);console.log('Production shell '+result.tests.filter(x=>x.status==='PASS').length+'/'+result.tests.length+'; exceptions '+result.exceptions.length);if(result.tests.some(x=>x.status!=='PASS')||result.exceptions.length||result.blocked.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(b)try{await b.cdp('Browser.close');}catch{}if(vite)vite.kill();if(edge)edge.kill();await h.stop();});

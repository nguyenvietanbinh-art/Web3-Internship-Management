// UI/real API/JWT TEST fixtures only. No Google popup/provider success is simulated.
const path=require('node:path'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'contracts/node_modules/.cache/google-auth-browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
process.env.GOOGLE_AUTH_ENABLED='true';process.env.GOOGLE_CLIENT_ID='';process.env.CORE_BUSINESS_ENABLED='true';
const h=require(path.join(root,'server/test/helpers'));process.env.CORS_ORIGIN='http://127.0.0.1:5181';
const {BrowserHarness,pause}=require('./browserHarness.cjs'),User=require(path.join(root,'server/src/models/User')),{signToken}=require(path.join(root,'server/src/services/authService'));
let browser,vite,edge;
const origin='http://127.0.0.1:5181';
async function free(port){await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});}
async function waitHTTP(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(150);}throw Error('Runtime did not become ready');}
(async()=>{
 await free(5181);await free(9228);await h.start();
 vite=spawn(process.execPath,[path.join(root,'client/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5181','--strictPort'],{cwd:path.join(root,'client'),env:{...process.env,VITE_API_URL:h.baseURL},windowsHide:true,stdio:'ignore'});
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--disable-extensions','--disable-component-extensions-with-background-pages','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9228','--user-data-dir='+path.join(out,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 edge.on('error',()=>{});await waitHTTP(origin);await waitHTTP('http://127.0.0.1:9228/json/version');
 browser=new BrowserHarness({port:9228,origin,api:h.baseURL,output:out});await browser.start();
 await browser.check('Login opens method chooser without calling MetaMask or writing database',async()=>{
  const count=await User.countDocuments(),writes=browser.mutations();await browser.click('#connect-wallet-btn');await browser.wait("document.querySelector('[role=dialog]')");
  await browser.wait("document.body.textContent.includes('Tiếp tục với Google')");if(browser.mutations()!==writes||await User.countDocuments()!==count)throw Error('Unexpected writes');
 });
 await browser.check('Register explains student role, email form and optional Google BLOCKED; cancel closes dialog',async()=>{
  await browser.click('button','Chưa có tài khoản? Đăng ký');await browser.wait("document.body.textContent.includes('Tạo tài khoản Internova')");
  await browser.click('summary','Google OAuth');await browser.click('button','Tiếp tục với Google');await browser.wait("document.querySelector('[role=alert]')?.textContent.includes('BLOCKED')");
  await browser.screenshot('google-login-configuration-blocked');
  await browser.click('[aria-label="Đóng đăng nhập"]');await browser.wait("!document.querySelector('[role=dialog]')");
 });
 const fixture=await User.create({googleSubject:'TEST_BROWSER_NOT_GOOGLE_LOGIN',googleEmail:'browser@example.invalid',email:'browser@example.invalid',name:'TEST Google-only UI fixture',role:'student'});
 await browser.check('Google-only fixture session restores, shows account settings and no wallet-scoped navigation',async()=>{
  await browser.session(signToken(fixture,'google'));await browser.nav('core-profile');
  await browser.wait("document.body.textContent.includes('Liên kết ví MetaMask')");
  if(await browser.ev("Boolean(document.querySelector('[data-nav=core-cv]'))"))throw Error('Wallet scope visible');
  if((await h.api('GET','/core/cv',{token:signToken(fixture,'google')})).status!==403)throw Error('Missing API guard');
 });
 await browser.check('Profile form saves to isolated TEST database and preserves role',async()=>{
  await browser.field('Họ tên / tên hiển thị','TEST Google edited in browser');await browser.click('button','Lưu hồ sơ');
  const until=Date.now()+10000;while(Date.now()<until){const u=await User.findById(fixture._id);if(u.name==='TEST Google edited in browser'&&u.role==='student')return;await pause(150);}throw Error('Profile not saved');
 });
 await browser.check('Responsive mobile and Dark/Light settings stay usable without automatic mutations',async()=>{
  const writes=browser.mutations();await browser.viewport(375);await browser.click('[aria-label="Bật Dark Mode"]');await browser.wait("document.documentElement.dataset.theme==='dark'");await browser.screenshot('google-only-mobile-dark');
  await browser.viewport(1440);await browser.click('[aria-label="Bật Light Mode"]');await browser.wait("document.documentElement.dataset.theme==='light'");await browser.screenshot('google-only-desktop-light');if(browser.mutations()!==writes)throw Error('Theme/viewport mutation');
 });
 await browser.check('Logout clears JWT and authenticated account UI',async()=>{await browser.click('#logout-btn');await browser.wait("!localStorage.getItem('w3i_token') && document.querySelector('#connect-wallet-btn')");});
 await browser.check('All four existing wallet roles still log in through nonce/signature API and navigate profile/dashboard',async()=>{
  const {Wallet}=require(path.join(root,'server/node_modules/ethers'));
  for(const role of ['student','company','mentor','admin']){
   const wallet=Wallet.createRandom();if(['mentor','admin'].includes(role))await User.create({walletAddress:wallet.address,name:'TEST browser '+role,role});
   const actor=await h.loginAs(role,'TEST browser '+role,wallet);if(actor.res.status!==200)throw Error('Wallet regression '+role);
   await browser.session(actor.token);await browser.nav('core-profile');await browser.wait("document.body.textContent.includes('Phương thức đăng nhập')");await browser.nav('dashboard');
   const me=await h.api('GET','/auth/me',{token:actor.token});if(me.body.user.role!==role)throw Error('Role mismatch '+role);
  }
 });
 const result={...browser.result(),database:require(path.join(root,'server/node_modules/mongoose')).connection.name,googleRealE2E:'BLOCKED_NO_CLIENT_ID',verifierMocked:false,fixtureSession:'Explicit TEST User plus application JWT; not Google login'};
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
 console.log('Browser evidence: '+out);console.log('Browser assertions '+result.tests.filter(t=>t.status==='PASS').length+'/'+result.tests.length+'; exceptions '+result.exceptions.length+'; blocked external requests '+result.blocked.length);
 if(result.tests.some(t=>t.status==='FAIL')||result.exceptions.length||result.blocked.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(browser)try{await browser.cdp('Browser.close');}catch{}if(vite)vite.kill();if(edge)edge.kill();await h.stop();});

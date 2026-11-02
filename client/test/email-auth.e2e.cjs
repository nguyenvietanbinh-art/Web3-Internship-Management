// Real browser -> API -> MongoDB -> bcrypt/JWT. No auth success mocks or Google calls.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'contracts/node_modules/.cache/email-auth-browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
process.env.EMAIL_AUTH_ENABLED='true';process.env.GOOGLE_AUTH_ENABLED='false';process.env.CORE_BUSINESS_ENABLED='true';
const h=require(path.join(root,'server/test/helpers'));process.env.CORS_ORIGIN='http://127.0.0.1:5183';
const User=require(path.join(root,'server/src/models/User')),{BrowserHarness,pause}=require('./browserHarness.cjs');
let b,vite,edge;const email='browser.'+Date.now()+'@example.invalid',password='TEST-only-browser-password',origin='http://127.0.0.1:5183';
async function free(port){await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});}
async function ready(url){for(let n=0;n<100;n++){try{if((await fetch(url)).ok)return;}catch{}await pause(150);}throw Error('Runtime not ready');}
(async()=>{
 await free(5183);await free(9229);await h.start();
 vite=spawn(process.execPath,[path.join(root,'client/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5183','--strictPort'],{cwd:path.join(root,'client'),env:{...process.env,VITE_API_URL:h.baseURL},windowsHide:true,stdio:'ignore'});
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--disable-extensions','--disable-component-extensions-with-background-pages','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9229','--user-data-dir='+path.join(out,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});edge.on('error',()=>{});
 await ready(origin);await ready('http://127.0.0.1:9229/json/version');b=new BrowserHarness({port:9229,origin,api:h.baseURL,output:out});await b.start();
 await b.check('Guest desktop/mobile hides all workspace menus and business requests; login/register creates no account',async()=>{
  await b.wait("document.querySelector('#connect-wallet-btn')");
  const privateUI="Boolean(document.querySelector('aside, [data-nav], .mobile-menu, .runtime-details, .guest-banner'))";
  if(await b.ev(privateUI))throw Error('Guest workspace exposed');
  if(b.requests.some(r=>r.path==='/api/topics'))throw Error('Guest fetched business data');
  await b.screenshot('guest-desktop');await b.viewport(375);if(await b.ev(privateUI))throw Error('Guest mobile workspace exposed');await b.screenshot('guest-mobile');await b.viewport(1440);
  const count=await User.countDocuments(),writes=b.mutations();await b.click('#connect-wallet-btn');await b.click('button','Chưa có tài khoản? Đăng ký');if(await User.countDocuments()!==count||b.mutations()!==writes)throw Error('Auto-write');await b.wait("document.querySelector('[aria-label=\"Họ tên đăng ký\"]')");
 });
 await b.check('Browser registration persists real hashed student and signed JWT without Google/MetaMask',async()=>{
  await b.field('Họ tên đăng ký','TEST registered through UI');await b.field('Email đăng nhập',email);await b.field('Mật khẩu Internova',password);await b.field('Nhập lại mật khẩu',password);await b.click('button','Tạo tài khoản sinh viên');await b.wait("document.querySelector('#logout-btn') && !document.querySelector('[role=dialog]')");await b.wait("document.body.textContent.includes('Mật khẩu tài khoản')");const u=await User.findOne({loginEmail:email}).select('+passwordHash');if(!u||u.role!=='student'||u.walletAddress||u.passwordHash===password)throw Error('Invalid persistence');
 });
 await b.check('Save profile shows success only after actual persistence; reload preserves fields',async()=>{
  await b.wait("document.querySelector('[aria-label=\"Họ tên / tên hiển thị\"]')");await b.field('Họ tên / tên hiển thị','TEST saved profile');await b.field('Kỹ năng, cách nhau dấu phẩy','Python, React');await b.field('Giới thiệu bản thân','TEST profile content saved through UI');await b.click('button','Lưu hồ sơ');await b.wait("document.querySelector('[data-testid=account-overview]')?.textContent.includes('TEST saved profile')");
  const saved=await User.findOne({loginEmail:email});if(saved.name!=='TEST saved profile'||!saved.skills.includes('Python')||saved.bio!=='TEST profile content saved through UI')throw Error('Profile not actually persisted');
  await b.screenshot('profile-saved-overview');await b.click('button','Chỉnh sửa hồ sơ');await b.wait("document.querySelector('[aria-label=\"Họ tên / tên hiển thị\"]')?.value==='TEST saved profile'");await b.reload();await b.wait("document.querySelector('[aria-label=\"Họ tên / tên hiển thị\"]')?.value==='TEST saved profile'");
 });
 await b.check('Reload restores session, profile-only scope, mobile/Dark theme without auto-write',async()=>{
  await b.reload();await b.wait("document.body.textContent.includes('Mật khẩu tài khoản')");const writes=b.mutations();if(await b.ev("Boolean(document.querySelector('[data-nav=core-cv]'))"))throw Error('Wallet scope exposed');await b.viewport(375);await b.click('[aria-label="Bật Dark Mode"]');await b.screenshot('email-account-mobile-dark');await b.viewport(1440);await b.click('[aria-label="Bật Light Mode"]');await b.screenshot('email-account-desktop');if(b.mutations()!==writes)throw Error('Automatic mutation');
 });
 await b.check('Logout clears token; wrong password shows error and does not log in',async()=>{
  await b.click('#logout-btn');await b.wait("!localStorage.getItem('w3i_token') && document.querySelector('.auth-entry')");if(await b.ev("Boolean(document.querySelector('aside,[data-nav],.runtime-details'))"))throw Error('Private menus remained after logout');await b.click('#connect-wallet-btn');await b.wait("document.querySelector('[aria-label=\"Email đăng nhập\"]')");
  // Modal mode can persist after registration; explicitly choose login if needed.
  if(await b.ev("Boolean(document.querySelector('[aria-label=\"Họ tên đăng ký\"]'))"))await b.click('button','Đã có tài khoản? Đăng nhập');
  await b.field('Email đăng nhập',email);await b.field('Mật khẩu Internova','incorrect-password');await b.click('button','Đăng nhập bằng email');await b.wait("document.querySelector('[role=alert]')?.textContent.includes('không đúng')");if(await b.ev("Boolean(localStorage.getItem('w3i_token'))"))throw Error('Wrong password accepted');
 });
 await b.check('Correct email/password login returns same User; password change works from UI',async()=>{
  await b.field('Mật khẩu Internova',password);await b.click('button','Đăng nhập bằng email');await b.wait("document.querySelector('#logout-btn') && !document.querySelector('[role=dialog]')");await b.wait("document.body.textContent.includes('Mật khẩu tài khoản')");
  await b.field('Mật khẩu hiện tại',password);await b.field('Mật khẩu mới','TEST-new-browser-password');await b.field('Xác nhận mật khẩu mới','TEST-new-browser-password');await b.click('button','Đổi mật khẩu');await b.wait("document.body.textContent.includes('Các phiên cũ hết hiệu lực')");if(await User.countDocuments({loginEmail:email})!==1)throw Error('Duplicate user');
 });
 const result={...b.result(),database:require(path.join(root,'server/node_modules/mongoose')).connection.name,auth:'Real email/password via browser, bcrypt and JWT; no Google or mocked success'};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log('Evidence: '+out);console.log('Email browser '+result.tests.filter(t=>t.status==='PASS').length+'/'+result.tests.length+'; exceptions '+result.exceptions.length+'; blocked '+result.blocked.length);if(result.tests.some(t=>t.status!=='PASS')||result.exceptions.length||result.blocked.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(b)try{await b.cdp('Browser.close');}catch{}if(vite)vite.kill();if(edge)edge.kill();await h.stop();});

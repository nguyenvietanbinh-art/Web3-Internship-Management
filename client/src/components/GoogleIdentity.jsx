import {useEffect,useRef,useState} from 'react';
import {apiRequest,setToken} from '../api/client';
import MyWallet from './MyWallet';
import {Dialog} from './ui';
import {PasswordSettings} from './EmailIdentity';
let loadingScript;
function loadGIS(){
  if(window.google?.accounts?.id)return Promise.resolve();
  if(!loadingScript)loadingScript=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    const timer=setTimeout(()=>reject(Error('Google tải quá lâu. Kiểm tra kết nối hoặc trình chặn popup.')),12000);
    script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(Error('Không tải được Google Identity Services.'));};document.head.appendChild(script);
  }).catch(error=>{loadingScript=undefined;throw error;});
  return loadingScript;
}
export default function GoogleIdentity({purpose='login',onSession,user}){
  const [state,setState]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false),[pending,setPending]=useState(false),[reauth,setReauth]=useState('');
  const button=useRef(null),alive=useRef(true),busy=useRef(false),generation=useRef(0);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  async function begin(){
    if(busy.current)return;busy.current=true;setPending(true);setError('');setState('Đang chuẩn bị Google…');setReady(false);
    const run=++generation.current;
    try{
      let config;try{config=await apiRequest('/auth/google/status');}catch(e){if(e.status===404)throw Error('Đăng nhập Google hiện chưa khả dụng. Vui lòng dùng email hoặc phương thức đã liên kết.');throw e;}
      if(!config.enabled)throw Error('Đăng nhập Google chưa được cấu hình. Vui lòng dùng phương thức khác.');
      let signer,walletAddress,chainId;
      if(purpose==='link-wallet'||(purpose==='link-google'&&user.walletAddress)||purpose==='unlink-google'){
        if(!window.ethereum)throw Error('Cần cài MetaMask để ký xác nhận liên kết.');
        const {BrowserProvider}=await import('ethers'),provider=new BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts',[]);signer=await provider.getSigner();walletAddress=(await signer.getAddress()).toLowerCase();
        if(purpose!=='link-wallet'&&walletAddress!==user.walletAddress)throw Error('Chọn đúng ví đã liên kết với tài khoản hiện tại.');
      }
      if(purpose==='link-wallet')chainId=await window.ethereum.request({method:'eth_chainId'});
      const c=await apiRequest('/auth/google/challenge',{method:'POST',body:{purpose,...(purpose==='link-wallet'?{walletAddress,chainId}:{})}});
      const signature=signer?await signer.signMessage(c.message):undefined;
      await loadGIS();
      if(!alive.current||run!==generation.current)return;
      window.google.accounts.id.initialize({client_id:config.clientId,nonce:c.nonce,auto_select:false,ux_mode:'popup',
        callback:async({credential})=>{
          if(!alive.current||run!==generation.current||busy.current)return;
          busy.current=true;setPending(true);setState('Đang xác minh…');setError('');
          try{
            const endpoint={login:'/auth/google/login','link-google':'/auth/google/link','link-wallet':'/auth/wallet/link','unlink-google':'/auth/google/unlink'}[purpose];
            const result=await apiRequest(endpoint,{method:'POST',body:{credential,challengeId:c.challengeId,...(signature?{signature}:{}),...(purpose==='link-google'&&!user.walletAddress?{password:reauth}:{})}});
            if(!alive.current||run!==generation.current)return;
            if(result.token)setToken(result.token);await onSession(result);if(alive.current){setState('Đã xác thực');setReady(false);}
          }catch(e){if(alive.current){setError(e.message);setReady(false);setState('');}}
          finally{busy.current=false;if(alive.current)setPending(false);}
        }});
      window.google.accounts.id.renderButton(button.current,{type:'standard',theme:'outline',size:'large',text:purpose==='login'?'continue_with':'signin_with',locale:'vi',width:280});
      setReady(true);setState('Chọn tài khoản Google. Nếu hủy popup hoặc quá 5 phút, bấm bắt đầu lại.');
    }catch(e){if(alive.current)setError(e.code===-32002?'MetaMask đang có yêu cầu chờ; mở tiện ích để xử lý.':e.message);setState('');}
    finally{busy.current=false;if(alive.current)setPending(false);}
  }
  return <section className="google-identity">{purpose==='link-google'&&!user.walletAddress&&<label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={reauth} onChange={e=>setReauth(e.target.value)}/></label>}<button className="btn btn-secondary" type="button" onClick={begin} disabled={pending}>{ready?'Bắt đầu lại Google':'Tiếp tục với Google'}</button><div ref={button} />{state&&<p role="status">{state}</p>}{error&&<p className="inline-alert is-error" role="alert">{error}</p>}</section>;
}
export function IdentitySettings({user,onSession}){
  const [action,setAction]=useState('');
  if(['admin','mentor'].includes(user.role))return <section className="glass-panel identity-settings"><h2>Bảo mật tài khoản</h2><div className="account-security-grid account-security-single"><PasswordSettings user={user} onSession={onSession}/></div></section>;
  return <section className="glass-panel identity-settings">
    <h2>Bảo mật tài khoản</h2><div className="account-security-grid"><MyWallet user={user} onSession={onSession} onGoogleVerify={()=>setAction('link-wallet')}/><PasswordSettings user={user} onSession={onSession}/></div>
    {action&&<Dialog label="Xác minh danh tính để liên kết ví" onClose={()=>setAction('')}><div className="modal-content"><h2>Xác minh danh tính</h2><p>Tài khoản chưa có mật khẩu website. Xác minh lại bằng phương thức Google đã liên kết; không tạo hoặc bỏ phương thức đăng nhập hiện tại.</p><GoogleIdentity key={action} purpose={action} user={user} onSession={async result=>{await onSession(result);setAction('');}} /></div></Dialog>}
  </section>;
}

import {useEffect,useState,lazy,Suspense} from 'react';
import {Layers} from 'lucide-react';
import {Dialog} from './ui';
import {apiRequest} from '../api/client';
import EmailIdentity from './EmailIdentity';
import GoogleIdentity from './GoogleIdentity';
import './identity.css';
const LegacyAuthModal=import.meta.env.DEV?lazy(()=>import('./LegacyAuthModal')):null;

export default function AuthModal(props){
 const {isOpen,onClose,onGoogleSession,mode='login',onModeChange,schoolWorkflow=false}=props;
 const register=!schoolWorkflow&&mode==='register', [googleEnabled,setGoogleEnabled]=useState(false);
 useEffect(()=>{
  if(!isOpen)return undefined;
  let active=true;
  Promise.resolve().then(()=>{if(active)return apiRequest('/auth/google/status').then(config=>{if(active)setGoogleEnabled(config.enabled===true);}).catch(()=>{if(active)setGoogleEnabled(false);});});
  return()=>{active=false;};
 },[isOpen]);
 if(!isOpen)return null;
 // Preserve wallet-only legacy access through an explicit local opt-in.
 if(!schoolWorkflow&&import.meta.env.DEV&&import.meta.env.VITE_ENABLE_LEGACY_AUTH_UI==='true')return <Suspense fallback={null}><LegacyAuthModal {...props}/></Suspense>;
 return <Dialog label="Đăng nhập / đăng ký Internova" className="auth-dialog" closeLabel="Đóng đăng nhập" onClose={onClose}>
  <div className="modal-content auth-modal">
   <div className="auth-modal-heading"><span className="brand-mark"><Layers size={24}/></span><h3>{register?'Tạo tài khoản':'Đăng nhập Internova'}</h3></div>
   <EmailIdentity key={mode} register={register} onSession={onGoogleSession}/>
   {googleEnabled&&<GoogleIdentity onSession={onGoogleSession}/>}
   {schoolWorkflow?<p>Sử dụng tài khoản do nhà trường cấp. Liên hệ nhà trường nếu cần được cấp tài khoản.</p>:<button type="button" className="btn btn-secondary" onClick={()=>onModeChange?.(register?'login':'register')}>{register?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button>}
  </div>
 </Dialog>;
}

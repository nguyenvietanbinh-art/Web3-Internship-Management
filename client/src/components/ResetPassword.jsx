import {useState,useRef} from 'react';
import {apiRequest} from '../api/client';
import {Text,ErrorNotice} from './business/Shared';
export default function ResetPassword({token,onDone}){
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');const lock=useRef(false);
 return <form onSubmit={async e=>{e.preventDefault();if(lock.current)return;if(password!==confirm){setError('Mật khẩu xác nhận không khớp');return;}lock.current=true;setBusy(true);setError('');try{const r=await apiRequest('/auth/email/reset-password',{method:'POST',body:{token,newPassword:password,confirmPassword:confirm}});setPassword('');setConfirm('');setDone(r.message);}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}}>
 <h2>Đặt lại mật khẩu</h2><ErrorNotice message={error}/>{done?<><p role="status">{done}</p><button type="button" className="btn btn-primary" onClick={onDone}>Về đăng nhập</button></>:<><Text label="Mật khẩu mới" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={setPassword}/><Text label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={setConfirm}/><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu…':'Lưu mật khẩu mới'}</button></>}
 </form>;
}

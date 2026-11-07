import {useState,useRef} from 'react';
import {LockKeyhole,Eye,EyeOff} from 'lucide-react';
import {Dialog} from './ui';
import {apiRequest,setToken} from '../api/client';
function PasswordDialog({onClose,onSession,onComplete}){
 const [values,setValues]=useState({current:'',next:'',confirm:''}),[visible,setVisible]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),pending=useRef(false);
 const close=()=>{if(!pending.current){setValues({current:'',next:'',confirm:''});setVisible({});onClose();}};
 return <Dialog label="Đổi mật khẩu" onClose={close}><div className="modal-content security-modal"><h2>Đổi mật khẩu</h2>
  <form className="identity-credentials" onSubmit={async e=>{
   e.preventDefault();if(pending.current)return;setError('');
   if(values.next!==values.confirm){setError('Xác nhận mật khẩu mới chưa khớp.');return;}
   if(values.next.length<8||new TextEncoder().encode(values.next).length>72){setError('Mật khẩu mới cần ít nhất 8 ký tự, tối đa 72 byte UTF-8.');return;}
   pending.current=true;setBusy(true);
   try{const result=await apiRequest('/auth/email/change-password',{method:'POST',body:{currentPassword:values.current,newPassword:values.next,confirmPassword:values.confirm}});setValues({current:'',next:'',confirm:''});setVisible({});setToken(result.token);await onSession(result);onComplete();}
   catch(err){setError(err.message);}finally{pending.current=false;setBusy(false);}
  }}>
   {Object.entries({current:'Mật khẩu hiện tại',next:'Mật khẩu mới',confirm:'Xác nhận mật khẩu mới'}).map(([key,label])=><div key={key} className="security-password-field"><label htmlFor={'security-password-'+key}>{label}</label><div className="security-password-input"><input id={'security-password-'+key} aria-label={label} type={visible[key]?'text':'password'} autoComplete={key==='current'?'current-password':'new-password'} required minLength={key==='current'?undefined:8} value={values[key]} disabled={busy} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/><button type="button" className="icon-button" aria-label={(visible[key]?'Ẩn ':'Hiển thị ')+label.toLowerCase()} aria-pressed={Boolean(visible[key])} disabled={busy} onClick={()=>setVisible(v=>({...v,[key]:!v[key]}))}>{visible[key]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>)}
   <small className="muted">Ít nhất 8 ký tự, tối đa 72 byte UTF-8. Các phiên đăng nhập cũ sẽ hết hiệu lực.</small>
   {error&&<p role="alert" className="inline-alert is-error">{error}</p>}
   {busy&&<p role="status">Đang lưu mật khẩu. Vui lòng chờ xác nhận.</p>}
   <div className="business-actions"><button type="button" className="btn btn-secondary" disabled={busy} onClick={close}>Hủy</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy?'Đang lưu…':'Lưu mật khẩu'}</button></div>
  </form>
 </div></Dialog>;
}
export default function PasswordSettings({user,onSession}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState('');
 return <section className="security-card"><div className="security-card-heading"><span className="security-card-icon"><LockKeyhole size={22}/></span><h3>Mật khẩu</h3></div>
  <p className="muted">{user?.passwordEnabled?'Bảo vệ tài khoản bằng mật khẩu riêng của bạn.':'Tài khoản chưa thiết lập mật khẩu. Tiếp tục dùng phương thức đăng nhập đã liên kết; liên hệ quản trị viên nếu cần hỗ trợ.'}</p>
  <div className="security-card-actions">{user?.passwordEnabled&&<button type="button" className="btn btn-primary" onClick={()=>{setMessage('');setOpen(true);}}>Đổi mật khẩu</button>}</div>
  {message&&<p role="status">{message}</p>}
  {open&&<PasswordDialog onClose={()=>setOpen(false)} onSession={onSession} onComplete={()=>{setOpen(false);setMessage('Đã đổi mật khẩu. Các phiên cũ hết hiệu lực.');}}/>}
 </section>;
}

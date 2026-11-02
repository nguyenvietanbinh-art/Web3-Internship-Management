import {useState} from 'react';
import {apiRequest,setToken} from '../api/client';
export default function EmailIdentity({register,onSession}){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event){event.preventDefault();if(busy)return;setBusy(true);setError('');try{
  const r=await apiRequest('/auth/email/'+(register?'register':'login'),{method:'POST',body:{email,password,...(register?{name,confirmPassword:confirm}:{})}});setToken(r.token);await onSession(r);
 }catch(e){setError(e.status===404?'Backend này chưa có đăng nhập email; mở môi trường email TEST theo hướng dẫn.':e.message);}finally{setBusy(false);}}
 return <form className="identity-credentials" onSubmit={submit} aria-label={register?'Đăng ký email':'Đăng nhập email'}>
  {register&&<label>Họ tên<input aria-label="Họ tên đăng ký" autoComplete="name" required maxLength={200} value={name} onChange={e=>setName(e.target.value)} /></label>}
  {register&&<label>Loại tài khoản được tự đăng ký<select aria-label="Loại tài khoản email" defaultValue="student"><option value="student">Sinh viên</option></select></label>}
  <label>Email<input aria-label="Email đăng nhập" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="ten@gmail.com" /></label>
  <label>Mật khẩu Internova<input aria-label="Mật khẩu Internova" type="password" autoComplete={register?'new-password':'current-password'} required minLength={10} value={password} onChange={e=>setPassword(e.target.value)} /></label>
  {register&&<label>Nhập lại mật khẩu<input aria-label="Nhập lại mật khẩu" type="password" autoComplete="new-password" required minLength={10} value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>}
  <p className="muted">Dùng mật khẩu riêng cho Internova, không dùng mật khẩu Gmail. Tối thiểu 10 ký tự, tối đa 72 byte. Email chưa được xác minh; chưa có khôi phục mật khẩu qua email.</p>
  {error&&<p role="alert" className="inline-alert is-error">{error}</p>}
  <button className="btn btn-primary" type="submit" disabled={busy}>{busy?'Đang xử lý…':register?'Tạo tài khoản sinh viên':'Đăng nhập bằng email'}</button>
 </form>;
}
export function PasswordSettings({user,onSession}){
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function save(event){event.preventDefault();setBusy(true);setError('');try{const r=await apiRequest('/auth/email/change-password',{method:'POST',body:{currentPassword:current,newPassword:next,confirmPassword:confirm}});setToken(r.token);await onSession(r);setCurrent('');setNext('');setConfirm('');setMessage('Đã đổi mật khẩu. Các phiên cũ hết hiệu lực.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function link(){setBusy(true);setError('');try{
  if(!window.ethereum)throw Error('Cần MetaMask và ví TEST để ký liên kết. Đăng nhập email không cần MetaMask.');
  const {BrowserProvider}=await import('ethers'),provider=new BrowserProvider(window.ethereum);await provider.send('eth_requestAccounts',[]);const signer=await provider.getSigner();
  const c=await apiRequest('/auth/email/wallet-challenge',{method:'POST',body:{password:current,walletAddress:await signer.getAddress()}});
  const r=await apiRequest('/auth/email/link-wallet',{method:'POST',body:{password:current,challengeId:c.challengeId,signature:await signer.signMessage(c.message)}});setToken(r.token);await onSession(r);setCurrent('');setMessage('Đã liên kết ví bằng chữ ký.');
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="panel" style={{padding:20}}><h2>Mật khẩu tài khoản</h2><p>Email chưa xác minh. Chỉnh email hồ sơ không thay email đăng nhập.</p><form className="identity-credentials" onSubmit={save}>
  <label>Mật khẩu hiện tại<input aria-label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)} /></label>
  <label>Mật khẩu mới<input aria-label="Mật khẩu mới" type="password" autoComplete="new-password" required minLength={10} value={next} onChange={e=>setNext(e.target.value)} /></label>
  <label>Xác nhận mật khẩu mới<input aria-label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>
  <button className="btn btn-secondary" disabled={busy}>Đổi mật khẩu</button>
 </form>{!user.walletAddress&&<button className="btn btn-secondary" disabled={busy||!current} onClick={link}>Liên kết ví TEST bằng mật khẩu và chữ ký</button>}{error&&<p role="alert" className="inline-alert is-error">{error}</p>}{message&&<p role="status">{message}</p>}</section>;
}

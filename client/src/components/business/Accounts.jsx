import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History } from './Shared';
import { useResource } from './hooks';
import { EmptyState, LoadingSkeleton } from '../ui';
import { roleNames } from '../navigation';

const options=Object.entries(roleNames).map(([value,label])=>({value,label}));
export default function AccountsPage({user,unified=false}) {
  const [revision,setRevision]=useState(0),[editing,setEditing]=useState(null),[history,setHistory]=useState(null),[role,setRole]=useState(''),[reset,setReset]=useState(null),[resetMessage,setResetMessage]=useState('');
  return <Panel title="Tài khoản & phân quyền" description="Quản lý quyền và trạng thái tài khoản. Mọi thay đổi được lưu trong lịch sử." actions={<button className="btn btn-primary" onClick={()=>setEditing({})}>Cấp tài khoản</button>}>
    {resetMessage&&<p role="status">{resetMessage}</p>}
    <Select label="Lọc vai trò tài khoản" value={role} onChange={setRole} options={[{value:'',label:'Tất cả vai trò'},...options]} />
    <ServerTable key={role} path={'/core/accounts'+(role?'?role='+role:'')} revision={revision} label="Tài khoản" columns={[
      {key:'name',title:'Tài khoản',render:r=><div><strong>{r.name}</strong><small className="business-block muted">{r.email||'Chưa khai báo email'}</small>{r.walletAddress&&<small className="business-block muted">{r.walletAddress}</small>}</div>},
      {key:'role',title:'Vai trò',render:r=>roleNames[r.role]}, {key:'disabled',title:'Trạng thái',render:r=>r.disabled?'Đã khóa':'Hoạt động'},
      {key:'actions',title:'Thao tác',render:r=><div className="business-actions"><button className="btn btn-secondary" disabled={r.role==='admin'||r._id===user._id} onClick={()=>setEditing(r)}>Sửa quyền / khóa</button><button className="btn btn-secondary" onClick={()=>setHistory(r)}>Lịch sử tài khoản</button><button className="btn btn-secondary" disabled={r.disabled||(r.role==='admin'&&r._id!==user._id)} onClick={()=>setReset(r)}>Đặt lại mật khẩu</button></div>},
    ]} />
    {reset&&<MutationDialog title="Đặt lại mật khẩu tài khoản" onClose={()=>setReset(null)}><AdminResetForm key={reset._id} account={reset} onSaved={result=>{setResetMessage(result.message);setReset(null);setRevision(n=>n+1);}}/></MutationDialog>}
    {editing&&<MutationDialog title={editing._id?'Sửa tài khoản':'Cấp tài khoản'} onClose={()=>setEditing(null)}><AccountForm unified={unified} data={editing} onSaved={()=>{setEditing(null);setRevision(n=>n+1);}} /></MutationDialog>}
    {history&&<MutationDialog title={`Lịch sử ${history.name}`} onClose={()=>setHistory(null)}><AccountHistory id={history._id} /></MutationDialog>}
  </Panel>;
}
function AccountForm({data,onSaved,unified}) {
 if(unified&&!data._id)return <EmailProvisionForm onSaved={onSaved}/>;
 return <LegacyAccountForm data={data} onSaved={onSaved}/>;
}
function LegacyAccountForm({data,onSaved}) {
  const [form,setForm]=useState({walletAddress:'',name:'',email:'',role:data.role||'student',disabled:data.disabled?'true':'false',reason:''}),set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <ActionForm submit={data._id?'Lưu quyền / trạng thái':'Cấp tài khoản'} onSaved={onSaved} onSubmit={()=>apiRequest('/core/accounts'+(data._id?'/'+data._id:''),{method:data._id?'PATCH':'POST',body:data._id?{role:form.role,disabled:form.disabled==='true',reason:form.reason,version:data.__v}:{walletAddress:form.walletAddress,name:form.name,email:form.email,role:form.role}})}>
    {!data._id&&<><Text label="Địa chỉ ví tài khoản mới" required pattern="0x[a-fA-F0-9]{40}" value={form.walletAddress} onChange={v=>set('walletAddress',v)} /><Text label="Tên tài khoản mới" required value={form.name} onChange={v=>set('name',v)} /><Text label="Email tài khoản mới" type="email" value={form.email} onChange={v=>set('email',v)} /></>}
    <Select label="Vai trò tài khoản" value={form.role} onChange={v=>set('role',v)} options={options} />
    {data._id&&<><Select label="Trạng thái tài khoản" value={form.disabled} onChange={v=>set('disabled',v)} options={[{value:'false',label:'Hoạt động'},{value:'true',label:'Khóa tài khoản'}]} /><Area label="Lý do thay đổi tài khoản"  value={form.reason} onChange={v=>set('reason',v)} /></>}
  </ActionForm>;
}
function AccountHistory({id}) {const state=useResource('/core/accounts/'+id+'/history');return state.loading?<LoadingSkeleton />:state.error?<EmptyState error title="Không tải được lịch sử">{state.error}</EmptyState>:<History entries={state.data} />;}

function EmailProvisionForm({onSaved}){
 const [form,setForm]=useState({name:'',email:'',password:'',role:'company',reason:''}),set=(k,v)=>setForm(s=>({...s,[k]:v}));
 return <ActionForm submit="Cấp tài khoản email" onSaved={onSaved} onSubmit={()=>apiRequest('/core/accounts/email',{method:'POST',body:form})}><Text label="Tên tài khoản mới" required value={form.name} onChange={v=>set('name',v)}/><Text label="Email tài khoản mới" type="email" required value={form.email} onChange={v=>set('email',v)}/><Text label="Mật khẩu khởi tạo" type="password" required value={form.password} onChange={v=>set('password',v)}/><Select label="Vai trò cấp" value={form.role} onChange={v=>set('role',v)} options={['student','company','mentor'].map(x=>({value:x,label:roleNames[x]}))}/><Area label="Lý do cấp tài khoản"  value={form.reason} onChange={v=>set('reason',v)}/></ActionForm>;
}

function AdminResetForm({account,onSaved}){
 const [mode,setMode]=useState('manual'),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false);
 const convention=['student','company'].includes(account.role);
 return <><p><strong>{account.name}</strong> · {account.email} · {roleNames[account.role]}</p>
 <ActionForm submit="Xác nhận đặt lại mật khẩu" disabled={!confirmed} onSaved={onSaved} onSubmit={()=>{if(mode==='manual'&&password!==confirm)throw new Error('Mật khẩu xác nhận không khớp');return apiRequest('/core/accounts/'+account._id+'/password-reset',{method:'POST',body:{mode,version:account.__v,reason,confirmed,...(mode==='manual'?{newPassword:password,confirmPassword:confirm}:{})}});}}>
 <Select label="Cách đặt mật khẩu" value={mode} onChange={value=>{setMode(value);setPassword('');setConfirm('');setConfirmed(false);}} options={[{value:'manual',label:'Nhập mật khẩu mới'},...(convention?[{value:'convention',label:account.role==='student'?'Dùng mã số sinh viên':'Dùng mật khẩu 12345678'}]:[])]}/>
 {mode==='manual'?<><Text label="Mật khẩu mới" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={setPassword}/><Text label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={setConfirm}/></>:<p>{account.role==='student'?'Mật khẩu sẽ được đặt bằng mã số sinh viên đã lưu trong hồ sơ.':'Mật khẩu sẽ được đặt thành 12345678.'}</p>}
 <Area label="Lý do đặt lại mật khẩu"  maxLength={1000} value={reason} onChange={setReason}/>
 <label className="business-field"><span><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Tôi xác nhận đặt lại mật khẩu cho đúng tài khoản này và kết thúc các phiên đăng nhập cũ.</span></label>
 </ActionForm></>;
}

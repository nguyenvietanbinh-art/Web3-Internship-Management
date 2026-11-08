import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History } from './Shared';
import { useResource } from './hooks';
import { EmptyState, LoadingSkeleton } from '../ui';
import { roleNames } from '../navigation';

const options=Object.entries(roleNames).map(([value,label])=>({value,label}));
export default function AccountsPage({user,unified=false}) {
  const [revision,setRevision]=useState(0),[editing,setEditing]=useState(null),[history,setHistory]=useState(null),[role,setRole]=useState('');
  return <Panel title="Tài khoản & phân quyền" description="Quản lý quyền và trạng thái tài khoản. Mọi thay đổi được lưu trong lịch sử." actions={<button className="btn btn-primary" onClick={()=>setEditing({})}>Cấp tài khoản</button>}>
    <Select label="Lọc vai trò tài khoản" value={role} onChange={setRole} options={[{value:'',label:'Tất cả vai trò'},...options]} />
    <ServerTable key={role} path={'/core/accounts'+(role?'?role='+role:'')} revision={revision} label="Tài khoản" columns={[
      {key:'name',title:'Tài khoản',render:r=><div><strong>{r.name}</strong><small className="business-block muted">{r.email||'Chưa khai báo email'}</small>{r.walletAddress&&<small className="business-block muted">{r.walletAddress}</small>}</div>},
      {key:'role',title:'Vai trò',render:r=>roleNames[r.role]}, {key:'disabled',title:'Trạng thái',render:r=>r.disabled?'Đã khóa':'Hoạt động'},
      {key:'actions',title:'Thao tác',render:r=><div className="business-actions"><button className="btn btn-secondary" disabled={r.role==='admin'||r._id===user._id} onClick={()=>setEditing(r)}>Sửa quyền / khóa</button><button className="btn btn-secondary" onClick={()=>setHistory(r)}>Lịch sử tài khoản</button></div>},
    ]} />
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
    {data._id&&<><Select label="Trạng thái tài khoản" value={form.disabled} onChange={v=>set('disabled',v)} options={[{value:'false',label:'Hoạt động'},{value:'true',label:'Khóa tài khoản'}]} /><Area label="Lý do thay đổi tài khoản" required value={form.reason} onChange={v=>set('reason',v)} /></>}
  </ActionForm>;
}
function AccountHistory({id}) {const state=useResource('/core/accounts/'+id+'/history');return state.loading?<LoadingSkeleton />:state.error?<EmptyState error title="Không tải được lịch sử">{state.error}</EmptyState>:<History entries={state.data} />;}

function EmailProvisionForm({onSaved}){
 const [form,setForm]=useState({name:'',email:'',password:'',role:'company',reason:''}),set=(k,v)=>setForm(s=>({...s,[k]:v}));
 return <ActionForm submit="Cấp tài khoản email" onSaved={onSaved} onSubmit={()=>apiRequest('/core/accounts/email',{method:'POST',body:form})}><Text label="Tên tài khoản mới" required value={form.name} onChange={v=>set('name',v)}/><Text label="Email tài khoản mới" type="email" required value={form.email} onChange={v=>set('email',v)}/><Text label="Mật khẩu khởi tạo" type="password" required value={form.password} onChange={v=>set('password',v)}/><Select label="Vai trò cấp" value={form.role} onChange={v=>set('role',v)} options={['student','company','mentor'].map(x=>({value:x,label:roleNames[x]}))}/><Area label="Lý do cấp tài khoản" required value={form.reason} onChange={v=>set('reason',v)}/></ActionForm>;
}

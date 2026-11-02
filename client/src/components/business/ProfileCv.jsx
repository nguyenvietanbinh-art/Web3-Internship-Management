import { useState } from 'react';
import { apiRequest, API_BASE, getToken } from '../../api/client';
import { EmptyState, LoadingSkeleton } from '../ui';
import { useResource } from './hooks';
import { Panel, Text, Area, Field, ActionForm, History, ErrorNotice } from './Shared';

export function ProfilePage({ user, onProfileSaved }) {
  const [revision,setRevision] = useState(0), [saved,setSaved]=useState(false), state=useResource('/core/profile',revision);
  if(state.loading)return <LoadingSkeleton />;if(state.error)return <EmptyState error title="Không tải được hồ sơ">{state.error}</EmptyState>;
  return <Panel title="Hồ sơ cá nhân" description="Đăng nhập bằng email/mật khẩu Internova hoặc phương thức đã liên kết. Đổi email hồ sơ không đổi email đăng nhập và không xác minh email.">{saved&&<p role="status" data-testid="profile-save-success">Đã lưu hồ sơ thành công.</p>}<ProfileForm key={state.data.__v} data={state.data} user={user} onEdited={()=>setSaved(false)} onSaved={() => {setSaved(true);setRevision(n=>n+1);onProfileSaved?.();}} /></Panel>;
}
function ProfileForm({data,user,onSaved,onEdited}) {
  const [form,setForm]=useState({...data,skillsText:data.skills.join(', ')}),set=(key,value)=>{onEdited?.();setForm(current=>({...current,[key]:value}));};
  return <ActionForm submit="Lưu hồ sơ" onSaved={onSaved} onSubmit={()=>apiRequest('/core/profile',{method:'PATCH',body:{name:form.name,email:form.email,bio:form.bio,skills:form.skillsText.split(',').map(s=>s.trim()).filter(Boolean),...(user.role==='company'?{companyName:form.companyName}:{}),version:data.__v}})}>
    <p className="muted">Ví: {user.walletAddress} · Vai trò do Backend quản lý: {user.role}</p>
    <div className="business-grid"><Text label="Họ tên / tên hiển thị" required maxLength={200} value={form.name} onChange={v=>set('name',v)} /><Text label="Email" type="email" value={form.email} onChange={v=>set('email',v)} /></div>
    {user.role==='company'&&<Text label="Tên doanh nghiệp" value={form.companyName} onChange={v=>set('companyName',v)} />}
    <Text label="Kỹ năng, cách nhau dấu phẩy" value={form.skillsText} onChange={v=>set('skillsText',v)} /><Area label="Giới thiệu bản thân" maxLength={10000} value={form.bio} onChange={v=>set('bio',v)} />
  </ActionForm>;
}
export function CvPage() {
  const [revision,setRevision]=useState(0),state=useResource('/core/cv',revision);
  if(state.loading)return <LoadingSkeleton />;if(state.error)return <EmptyState error title="Không tải được CV">{state.error}</EmptyState>;
  return <div className="business-stack"><Panel title="CV đã lưu" description="CV riêng tư; doanh nghiệp chỉ xem snapshot của hồ sơ bạn đã ứng tuyển. Nội dung trích xuất dùng được cho AI ở PHASE4."><CvForm key={state.data?.__v ?? 'new'} data={state.data} onSaved={()=>setRevision(n=>n+1)} /></Panel>
    {state.data&&<Panel title="Tài liệu PDF / DOCX" description="Tối đa2MiB, PDF tối đa20trang; không OCR, macro, liên kết ngoài hoặc nội dung chủ động."><CvFile data={state.data} onSaved={()=>setRevision(n=>n+1)} /><History entries={state.data.history} /></Panel>}
  </div>;
}
function CvForm({data,onSaved}) {
  const [form,setForm]=useState({...{title:'',summary:'',skills:[],education:'',experience:'',university:'',gpa:null},...data,skillsText:(data?.skills||[]).join(', ')}),set=(key,value)=>setForm(current=>({...current,[key]:value}));
  return <ActionForm submit="Lưu CV" onSaved={onSaved} onSubmit={()=>apiRequest('/core/cv',{method:'PUT',body:Object.fromEntries(['title','summary','skills','education','experience','university','gpa'].map(k=>[k,k==='skills'?form.skillsText.split(',').map(s=>s.trim()).filter(Boolean):form[k]]) .concat([['version',data?.__v??null]]))})}>
    <Text label="Tên CV" required maxLength={200} value={form.title} onChange={v=>set('title',v)} />
    <Text label="Kỹ năng CV, cách nhau dấu phẩy" value={form.skillsText} onChange={v=>set('skillsText',v)} />
    <Area label="Tóm tắt CV" value={form.summary} onChange={v=>set('summary',v)} />
    <div className="business-grid"><Text label="Trường đại học" value={form.university} onChange={v=>set('university',v)} /><Text label="GPA (0–4, có thể để trống)" type="number" min="0" max="4" step="0.01" value={form.gpa} onChange={v=>set('gpa',v===''?null:Number(v))} /></div>
    <Area label="Học vấn" value={form.education} onChange={v=>set('education',v)} /><Area label="Kinh nghiệm" value={form.experience} onChange={v=>set('experience',v)} />
  </ActionForm>;
}
function CvFile({data,onSaved}) {
  const [file,setFile]=useState(null),[error,setError]=useState('');
  return <div className="business-stack"><ActionForm submit="Upload và trích xuất CV" onSaved={onSaved} onSubmit={async()=>{
    if(!file)throw new Error('Chọn PDF hoặc DOCX trước.');if(file.size>2*1024*1024)throw new Error('Tệp không được vượt2MiB.');return apiRequest('/core/cv/file',{method:'POST',body:file,headers:{'Content-Type':file.type||'application/octet-stream','X-CV-Filename':encodeURIComponent(file.name)}});
  }}><Field label="Chọn tệp CV"><input className="input-field" aria-label="Chọn tệp CV" type="file" accept=".pdf,.docx" required onChange={e=>setFile(e.target.files[0]||null)} /></Field></ActionForm>
    <p className="muted">{data.fileName?`${data.fileName} · ${data.parser} · SHA-256: ${data.sha256}`:'Chưa upload tài liệu.'}</p>
    {data.fileName&&<button className="btn btn-secondary" onClick={async()=>{setError('');try{const res=await fetch(`${API_BASE}/core/cv/file`,{headers:{Authorization:`Bearer ${getToken()}`}});if(!res.ok)throw new Error('Không tải được tệp CV');const url=URL.createObjectURL(await res.blob()),a=document.createElement('a');a.href=url;a.download=data.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e.message);}}}>Tải tệp CV của tôi</button>}
    <ErrorNotice message={error} />{data.extractedText&&<details><summary>Nội dung trích xuất thực tế</summary><pre className="business-content">{data.extractedText}</pre></details>}
  </div>;
}

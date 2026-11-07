import {cvDisplayText} from './cvPresentation';
import { displayLabel } from './content';
import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History, Status } from './Shared';
import { dateLabel, localInput, asIso } from './hooks';

export function JdPage({user}) {
  const [revision,setRevision]=useState(0),[editing,setEditing]=useState(null),[applying,setApplying]=useState(null),[statusFilter,setStatusFilter]=useState(''),mine=user.role==='company';
  const saved=()=>{setEditing(null);setApplying(null);setRevision(n=>n+1);};
  return <Panel title={mine?'JD của doanh nghiệp':'Cơ hội thực tập'} description="Tìm cơ hội phù hợp và theo dõi ứng viên. Sau khi nhận ứng tuyển, cần tạo phân công thực tập." actions={mine&&<button className="btn btn-primary" onClick={()=>setEditing({})}>Tạo JD</button>}>
    {mine&&<Select label="Lọc trạng thái JD" value={statusFilter} onChange={setStatusFilter} options={[{value:'',label:'Tất cả JD của tôi'},{value:'open',label:'Đang tuyển'},{value:'closed',label:'Đóng / bản nháp'}]} />}
    <ServerTable key={statusFilter} path={`/core/jds${mine?'?mine=true':''}${mine&&statusFilter?'&status='+statusFilter:''}`} revision={revision} label="JD tuyển dụng" columns={[
      {key:'title',title:'Vị trí',render:r=><div><strong>{r.title}</strong><small className="muted business-block">{r.companyName} · {r.location||'Chưa cung cấp địa điểm'}</small><details><summary>Nội dung JD</summary><p className="business-content">{r.description}</p><p>Kỹ năng: {r.requirements.join(', ')}</p></details></div>},
      {key:'slots',title:'Số vị trí'}, {key:'deadline',title:'Hạn nộp',render:r=>dateLabel(r.deadline)}, {key:'status',title:'Trạng thái',render:r=><Status value={r.status} />},
      {key:'action',title:'Thao tác',render:r=>mine?<button className="btn btn-secondary" onClick={()=>setEditing(r)}>Sửa / đăng / đóng JD</button>:user.role==='student'?<button className="btn btn-primary" onClick={()=>setApplying(r)}>Ứng tuyển</button>:<span>Chỉ xem</span>},
    ]} />
    {editing&&<MutationDialog title={editing._id?'Chỉnh sửa JD':'Tạo JD'} onClose={()=>setEditing(null)}><JdForm data={editing} onSaved={saved} /></MutationDialog>}
    {applying&&<MutationDialog title={`Ứng tuyển: ${applying.title}`} onClose={()=>setApplying(null)}><ApplyForm jd={applying} onSaved={saved} /></MutationDialog>}
  </Panel>;
}
function JdForm({data,onSaved}) {
  const [form,setForm]=useState({title:data.title||'',department:data.department||'',description:data.description||'',requirements:(data.requirements||[]).join(', '),benefits:(data.benefits||[]).join(', '),slots:data.slots||1,location:data.location||'',salary:data.salary||'',deadline:localInput(data.deadline),status:data.status||'closed'}),set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <ActionForm submit="Lưu JD" onSaved={onSaved} onSubmit={()=>apiRequest('/core/jds'+(data._id?'/'+data._id:''),{method:data._id?'PATCH':'POST',body:{...form,requirements:form.requirements.split(',').map(s=>s.trim()).filter(Boolean),benefits:form.benefits.split(',').map(s=>s.trim()).filter(Boolean),slots:Number(form.slots),deadline:asIso(form.deadline),...(data._id?{version:data.__v}:{})}})}>
    <Text label="Tên vị trí JD" required maxLength={200} value={form.title} onChange={v=>set('title',v)} /><Text label="Phòng ban" value={form.department} onChange={v=>set('department',v)} /><Area label="Mô tả JD" required value={form.description} onChange={v=>set('description',v)} />
    <Text label="Yêu cầu kỹ năng JD, cách nhau dấu phẩy" value={form.requirements} onChange={v=>set('requirements',v)} /><Text label="Quyền lợi, cách nhau dấu phẩy" value={form.benefits} onChange={v=>set('benefits',v)} />
    <div className="business-grid"><Text label="Số vị trí tuyển" type="number" min="1" max="100" required value={form.slots} onChange={v=>set('slots',v)} /><Text label="Hạn ứng tuyển (giờ máy)" type="datetime-local" required value={form.deadline} onChange={v=>set('deadline',v)} /></div>
    <Text label="Địa điểm" value={form.location} onChange={v=>set('location',v)} /><Text label="Mức hỗ trợ" value={form.salary} onChange={v=>set('salary',v)} /><Select label="Trạng thái JD" value={form.status} onChange={v=>set('status',v)} options={[{value:'closed',label:'Đóng / bản nháp'},{value:'open',label:'Đăng tuyển'}]} />
  </ActionForm>;
}
function ApplyForm({jd,onSaved}) {
  const [message,setMessage]=useState('');
  return <ActionForm submit="Nộp ứng tuyển" onSaved={onSaved} onSubmit={()=>apiRequest('/core/applications',{method:'POST',body:{jdId:jd._id,message}})}><p>Hồ sơ ứng tuyển sử dụng CV đã lưu tại thời điểm nộp.</p><Area label="Lời nhắn ứng tuyển" value={message} onChange={setMessage} maxLength={3000} /></ActionForm>;
}
export function ApplicationsPage({user}) {
  const [revision,setRevision]=useState(0),[editing,setEditing]=useState(null),[filter,setFilter]=useState('');
  return <Panel title={user.role==='company'?'Hồ sơ ứng viên':'Theo dõi ứng tuyển'} description="Mỗi sinh viên ứng tuyển một lần cho mỗi tin tuyển dụng. CV đã gửi được giữ nguyên.">
    <Select label="Lọc trạng thái ứng tuyển" value={filter} onChange={setFilter} options={[{value:'',label:'Tất cả trạng thái'},...['submitted','under_review','accepted','rejected','withdrawn'].map(value=>({value,label:displayLabel(value)}))]} />
    <ServerTable key={filter} path={'/core/applications'+(filter?'?status='+filter:'')} revision={revision} label="Ứng tuyển" columns={[
      {key:'jdTitle',title:'Vị trí',render:r=><div><strong>{r.jdTitle}</strong><small className="business-block muted">{r.companyName} · {r.studentName}</small></div>},
      {key:'cv',title:'Hồ sơ đã nộp',render:r=><details><summary>CV đã nộp</summary><strong>{r.cvSnapshot.title}</strong><p className="business-content">{cvDisplayText(r.cvSnapshot.summary)}</p><p>{r.cvSnapshot.skills.join(', ')}</p><p className="business-content">{cvDisplayText(r.cvSnapshot.education)}</p><p className="business-content">{cvDisplayText(r.cvSnapshot.experience)}</p>{r.cvSnapshot.extractedText&&<pre className="business-content">{cvDisplayText(r.cvSnapshot.extractedText)}</pre>}<small>Phiên bản CV {r.cvSnapshot.cvVersion} · {r.cvSnapshot.parser||'CV nhập tay'}</small></details>},
      {key:'status',title:'Trạng thái',render:r=><><Status value={r.status} /><History entries={r.history} /></>},
      {key:'actions',title:'Thao tác',render:r=>['submitted','under_review'].includes(r.status)&&user.role!=='admin'?<button className="btn btn-secondary" onClick={()=>setEditing(r)}>{user.role==='student'?'Rút ứng tuyển':'Xét duyệt hồ sơ'}</button>:<span>Đã chốt / chỉ xem</span>},
    ]} />
    {editing&&<MutationDialog title="Cập nhật ứng tuyển" onClose={()=>setEditing(null)}><ApplicationReview data={editing} user={user} onSaved={()=>{setEditing(null);setRevision(n=>n+1);}} /></MutationDialog>}
  </Panel>;
}
function ApplicationReview({data,user,onSaved}) {
  const [status,setStatus]=useState(user.role==='student'?'withdrawn':data.status==='submitted'?'under_review':'accepted'),[reason,setReason]=useState('');
  return <ActionForm submit="Xác nhận trạng thái ứng tuyển" onSaved={onSaved} onSubmit={()=>apiRequest('/core/applications/'+data._id,{method:'PATCH',body:{status,reason,version:data.__v}})}>
    <Select label="Trạng thái ứng tuyển" value={status} onChange={setStatus} options={user.role==='student'?[{value:'withdrawn',label:'Rút hồ sơ'}]:[{value:'under_review',label:'Đang xét'},{value:'accepted',label:'Chấp nhận'},{value:'rejected',label:'Từ chối'}]} /><Area label="Lý do ứng tuyển" required maxLength={2000} value={reason} onChange={setReason} />
  </ActionForm>;
}

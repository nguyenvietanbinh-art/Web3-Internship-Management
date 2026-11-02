import { displayLabel } from './content';
import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History, Status, ErrorNotice } from './Shared';
import { useResource, dateLabel, shortWallet, localInput, asIso } from './hooks';

export default function PlacementsPage({user,unified=false}) {
  const [revision,setRevision]=useState(0),[modal,setModal]=useState(null);
  return <div className="business-stack">{unified&&user.role==='company'&&<TopicCreator onSaved={()=>setRevision(n=>n+1)}/>}<Panel title="Đợt / kỳ thực tập" description="Nhà trường quản lý kỳ; không thể đóng kỳ còn phân công chưa kết thúc." actions={user.role==='admin'&&<button className="btn btn-primary" onClick={()=>setModal({type:'batch'})}>Tạo kỳ thực tập</button>}>
    <ServerTable path="/core/batches" revision={revision} label="Kỳ thực tập" columns={[{key:'code',title:'Mã kỳ'},{key:'name',title:'Tên kỳ'},{key:'dates',title:'Thời gian',render:r=><span>{dateLabel(r.startDate)} → {dateLabel(r.endDate)}</span>},{key:'status',title:'Trạng thái',render:r=><Status value={r.status} />},{key:'action',title:'Thao tác',render:r=>user.role==='admin'?<button className="btn btn-secondary" onClick={()=>setModal({type:'batch',data:r})}>Sửa kỳ / trạng thái</button>:<span>Chỉ xem</span>}]} />
  </Panel><Panel title="Phân công theo kỳ" description="Theo dõi phân công từ đề xuất đến hoàn tất." actions={['admin','company'].includes(user.role)&&<button className="btn btn-primary" onClick={()=>setModal({type:'placement'})}>Đề xuất phân công</button>}>
    <ServerTable path="/core/placements" revision={revision} label="Phân công" search={false} columns={[
      {key:'topic',title:'Đề tài / tiêu chí',render:r=><div><strong>{r.topic?.title||r.topicId}</strong><details><summary>Tiêu chí KPI</summary>{r.topic?.kpis?.map((k,i)=><p key={i}>{k.title} · {k.weightPercent}% · {k.description}</p>)}</details><small className="muted">ID: {r._id}</small></div>},
      {key:'people',title:'Thành viên',render:r=><div>SV: {r.participantNames?.student||shortWallet(r.studentWallet)}<br/>DN: {r.participantNames?.company||shortWallet(r.companyWallet)}<br/>GV: {r.participantNames?.mentor||shortWallet(r.mentorWallet)}</div>},
      {key:'dates',title:'Thời gian',render:r=><span>{dateLabel(r.startDate)}<br/>{dateLabel(r.endDate)}</span>},
      {key:'lifecycle',title:'Trạng thái',render:r=><><Status value={r.lifecycle} /><History entries={r.history} /></>},
      {key:'actions',title:'Thao tác',render:r=><div className="business-actions">{['admin','company'].includes(user.role)&&!['completed','cancelled'].includes(r.lifecycle)?<button className="btn btn-secondary" onClick={()=>setModal({type:'state',data:r})}>Cập nhật phân công</button>:<span>Chỉ xem</span>}{!unified&&user.role==='admin'&&['proposed','approved'].includes(r.lifecycle)&&<button className="btn btn-secondary" onClick={()=>setModal({type:'details',data:r})}>Sửa giảng viên / ngày</button>}</div>},
    ]} />
  </Panel>{modal&&<MutationDialog title={modal.type==='batch'?'Kỳ thực tập':modal.type==='placement'?'Đề xuất phân công':'Cập nhật phân công'} onClose={()=>setModal(null)}>
    {modal.type==='batch'?<BatchForm data={modal.data} onSaved={()=>{setModal(null);setRevision(n=>n+1);}} />:modal.type==='placement'?<PlacementForm user={user} unified={unified} onSaved={()=>{setModal(null);setRevision(n=>n+1);}} />:modal.type==='details'?<PlacementDetails unified={unified} data={modal.data} onSaved={()=>{setModal(null);setRevision(n=>n+1);}} />:<PlacementState user={user} data={modal.data} onSaved={()=>{setModal(null);setRevision(n=>n+1);}} />}
  </MutationDialog>}</div>;
}
function BatchForm({data,onSaved}) {
  const [form,setForm]=useState({code:data?.code||'',name:data?.name||'',startDate:localInput(data?.startDate),endDate:localInput(data?.endDate),status:data?.status||'draft'}),set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <ActionForm submit="Lưu kỳ thực tập" onSaved={onSaved} onSubmit={()=>apiRequest('/core/batches'+(data?'/' + data._id:''),{method:data?'PATCH':'POST',body:data?{name:form.name,status:form.status,version:data.__v}:{...form,startDate:asIso(form.startDate),endDate:asIso(form.endDate)}})}>
    {!data&&<Text label="Mã kỳ thực tập" required pattern="[A-Z0-9_-]+" maxLength={32} value={form.code} onChange={v=>set('code',v)} />}
    <Text label="Tên kỳ thực tập" required value={form.name} onChange={v=>set('name',v)} />
    {!data&&<div className="business-grid"><Text label="Bắt đầu kỳ (giờ máy)" type="datetime-local" required value={form.startDate} onChange={v=>set('startDate',v)} /><Text label="Kết thúc kỳ (giờ máy)" type="datetime-local" required value={form.endDate} onChange={v=>set('endDate',v)} /></div>}
    <Select label="Trạng thái kỳ" value={form.status} onChange={v=>set('status',v)} options={[{value:'draft',label:'Bản nháp'},{value:'open',label:'Mở kỳ'},...(data?[{value:'closed',label:'Đóng kỳ'}]:[])]} />
  </ActionForm>;
}
function PlacementForm({user,onSaved,unified}) {
 if(unified)return <UnifiedPlacementForm user={user} onSaved={onSaved}/>;
 return <LegacyPlacementForm user={user} onSaved={onSaved}/>;
}
function LegacyPlacementForm({user,onSaved}) {
  const [form,setForm]=useState({batchId:'',topicId:'',studentWallet:'',mentorWallet:'',startDate:'',endDate:''}),set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const batches=useResource('/core/batches?limit=100'),topics=useResource('/topics'+(user.role==='company'?`?companyWallet=${user.walletAddress}`:''));
  return <ActionForm submit="Gửi đề xuất phân công" onSaved={onSaved} onSubmit={()=>apiRequest('/core/placements',{method:'POST',body:{...form,startDate:asIso(form.startDate),endDate:asIso(form.endDate)}})}>
    <ErrorNotice message={batches.error||topics.error} />
    <Select label="Kỳ thực tập của phân công" required value={form.batchId} onChange={v=>set('batchId',v)} options={[{value:'',label:'Chọn kỳ đang mở'},...(batches.data?.items||[]).filter(b=>b.status==='open').map(b=>({value:b._id,label:b.name}))]} />
    <Select label="Đề tài phân công" required value={form.topicId} onChange={v=>set('topicId',v)} options={[{value:'',label:'Chọn đề tài'},...(topics.data||[]).map(t=>({value:t._id,label:t.title}))]} />
    <Text label="Ví sinh viên phân công" required pattern="0x[a-fA-F0-9]{40}" value={form.studentWallet} onChange={v=>set('studentWallet',v)} /><Text label="Ví giảng viên phụ trách" required pattern="0x[a-fA-F0-9]{40}" value={form.mentorWallet} onChange={v=>set('mentorWallet',v)} />
    <div className="business-grid"><Text label="Bắt đầu phân công (giờ máy)" type="datetime-local" required value={form.startDate} onChange={v=>set('startDate',v)} /><Text label="Kết thúc phân công (giờ máy)" type="datetime-local" required value={form.endDate} onChange={v=>set('endDate',v)} /></div>
    <p className="muted">Sinh viên phải có tài khoản ví và đã đăng nhập để tạo hồ sơ chuẩn hóa; giảng viên phải được Admin cấp. Thời gian nằm trong kỳ đã chọn.</p>
  </ActionForm>;
}
function PlacementState({data,user,onSaved}) {
  const transitions={proposed:user.role==='admin'?['approved','cancelled']:['cancelled'],approved:['active','cancelled'],active:user.role==='admin'?['completed','cancelled']:['cancelled']};
  const choices=transitions[data.lifecycle]||[],[lifecycle,setLifecycle]=useState(choices[0]||''),[reason,setReason]=useState('');
  return <ActionForm submit="Xác nhận phân công" onSaved={onSaved} onSubmit={()=>apiRequest('/core/placements/'+data._id,{method:'PATCH',body:{lifecycle,reason,version:data.__v}})}><Select label="Trạng thái phân công mới" value={lifecycle} onChange={setLifecycle} options={choices.map(value=>({value,label:displayLabel(value)}))} /><Area label="Lý do phân công" required value={reason} onChange={setReason} /><p className="muted">Kết thúc cần báo cáo cuối kỳ đã được Nhà trường chốt và không còn phiên giờ làm chưa xử lý.</p></ActionForm>;
}
function PlacementDetails({data,onSaved}) {
  const [mentor,setMentor]=useState(data.mentorWallet),[start,setStart]=useState(localInput(data.startDate)),[end,setEnd]=useState(localInput(data.endDate)),[reason,setReason]=useState('');
  return <ActionForm submit="Lưu giảng viên / ngày phân công" onSaved={onSaved} onSubmit={()=>apiRequest('/core/placements/'+data._id+'/details',{method:'PATCH',body:{mentorWallet:mentor,startDate:asIso(start),endDate:asIso(end),reason,version:data.__v}})}><Text label="Ví giảng viên thay đổi" required pattern="0x[a-fA-F0-9]{40}" value={mentor} onChange={setMentor} /><div className="business-grid"><Text label="Ngày bắt đầu mới (giờ máy)" type="datetime-local" required value={start} onChange={setStart} /><Text label="Ngày kết thúc mới (giờ máy)" type="datetime-local" required value={end} onChange={setEnd} /></div><Area label="Lý do sửa phân công" required value={reason} onChange={setReason} /></ActionForm>;
}

function TopicCreator({onSaved}){
 const [form,setForm]=useState({title:'',description:'',kpi:'',criteria:'',deadline:''}),set=(k,v)=>setForm(s=>({...s,[k]:v}));
 return <Panel title="Đề tài và tiêu chí thực tập" description="Xác định đề tài và tiêu chí đánh giá."><ActionForm submit="Tạo đề tài thực tập" onSaved={onSaved} onSubmit={()=>apiRequest('/core/topics',{method:'POST',body:{title:form.title,description:form.description,kpis:[{title:form.kpi,description:form.criteria,weightPercent:100,deadline:asIso(form.deadline)}]}})}><Text label="Tên đề tài" required value={form.title} onChange={v=>set('title',v)}/><Area label="Mô tả đề tài" required value={form.description} onChange={v=>set('description',v)}/><Text label="Tiêu chí KPI" required value={form.kpi} onChange={v=>set('kpi',v)}/><Area label="Yêu cầu hoàn thành KPI" required value={form.criteria} onChange={v=>set('criteria',v)}/><Text label="Hạn KPI" type="datetime-local" required value={form.deadline} onChange={v=>set('deadline',v)}/></ActionForm></Panel>;
}
function UnifiedPlacementForm({onSaved}){
 const [form,setForm]=useState({batchId:'',topicId:'',studentUserId:'',mentorUserId:'',startDate:'',endDate:''}),set=(k,v)=>setForm(s=>({...s,[k]:v}));
 const batches=useResource('/core/batches?limit=100'),topics=useResource('/core/topics?limit=100'),students=useResource('/core/directory?role=student&limit=100'),mentors=useResource('/core/directory?role=mentor&limit=100');
 const choose=(label,key,state,filter=()=>true)=><Select label={label} required value={form[key]} onChange={v=>set(key,v)} options={[{value:'',label:'Chọn'},...(state.data?.items||[]).filter(filter).map(x=>({value:x._id,label:x.name||x.title}))]}/>;
 return <ActionForm submit="Gửi đề xuất phân công" onSaved={onSaved} onSubmit={()=>apiRequest('/core/placements',{method:'POST',body:{...form,startDate:asIso(form.startDate),endDate:asIso(form.endDate)}})}><ErrorNotice message={batches.error||topics.error||students.error||mentors.error}/>{choose('Kỳ thực tập','batchId',batches,x=>x.status==='open')}{choose('Đề tài thực tập','topicId',topics)}{choose('Sinh viên đã chấp nhận','studentUserId',students)}{choose('Giảng viên phụ trách','mentorUserId',mentors)}<Text label="Ngày bắt đầu thực tập" type="datetime-local" required value={form.startDate} onChange={v=>set('startDate',v)}/><Text label="Ngày kết thúc thực tập" type="datetime-local" required value={form.endDate} onChange={v=>set('endDate',v)}/></ActionForm>;
}

import { useState } from 'react';
import {useViewState} from '../viewStateStore';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History, Status, AssignmentPicker, ErrorNotice } from './Shared';
import {checkInReason} from './timeEligibility.mjs';
import { useResource,dateLabel,localInput,asIso } from './hooks';

export default function TimePage({user}) {
  const [selectedStudent,setSelectedStudent]=useState(null);
  const [assignment,setAssignment]=useState(null),[revision,setRevision]=useState(0),[group,setGroup]=useViewState('approvedHoursGroup','batch'),[review,setReview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),suffix=assignment?`&assignmentId=${assignment._id}`:selectedStudent?'&studentUserId='+selectedStudent._id:'';
  const totals=useResource(`/core/time/totals?group=${group}${suffix}`,revision),refresh=()=>setRevision(n=>n+1);
  const recent=useResource(user.role==='student'?'/core/time/sessions?limit=100':null,revision);
  const blocked=checkInReason(assignment,recent.data?.items||[]);
  const action=async fn=>{if(busy)return;setBusy(true);setError('');try{await fn();refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="business-stack"><Panel title="Giờ làm theo kỳ" description="Chỉ giờ đã duyệt được tính vào tổng giờ làm."><AssignmentPicker onStudentChange={setSelectedStudent} userRole={user.role} value={assignment} onChange={setAssignment} /><ErrorNotice message={error} />{user.role==='student'&&<button className="btn btn-primary" disabled={busy||recent.loading||Boolean(recent.error)||Boolean(blocked)} onClick={()=>action(()=>apiRequest('/core/time/check-in',{method:'POST',body:{assignmentId:assignment._id,requestKey:crypto.randomUUID()}}))}>Vào ca</button>}{user.role==='student'&&<><ErrorNotice message={recent.error}/><p role="status">{recent.loading?'Đang kiểm tra phiên giờ làm…':blocked||'Bạn có thể vào ca. Chấm công thông thường không yêu cầu liên kết ví hoặc blockchain.'}</p></>}</Panel>
    <Panel title="Tổng giờ đã duyệt"><div style={{maxWidth:320}}><Select label="Tổng hợp giờ theo" value={group} onChange={setGroup} options={[{value:'batch',label:'Kỳ thực tập'},{value:'day',label:'Ngày UTC'},{value:'week',label:'Tuần UTC (thứ Hai)'},{value:'month',label:'Tháng UTC'}]}/></div>
      <ErrorNotice message={totals.error} /><p className="business-total" aria-live="polite">{totals.loading?'Đang tải…':totals.data?`${totals.data.totalMinutes} phút (${(totals.data.totalMinutes/60).toFixed(2)} giờ)`:'Chưa có tổng hợp'}</p>
      {totals.data?.items.map(r=><div className="total-row" key={r.period}><span>{r.period}</span><strong>{r.minutes} phút · {r.hours} giờ</strong></div>)}{!totals.loading&&totals.data?.items.length===0&&<p className="muted">Chưa có giờ làm được duyệt.</p>}
    </Panel><Panel title="Lịch sử phiên giờ làm" description="Sắp xếp từ ngày trước đến ngày sau theo giờ vào ca. Phiên thiếu giờ ra cần được xem xét trước khi duyệt.">
      <ServerTable key={assignment?._id||'all'} path={'/core/time/sessions'+(assignment?'?assignmentId='+assignment._id:'')} revision={revision} label="Phiên giờ làm" search={false} columns={[
        {key:'studentWallet',title:'Sinh viên'}, {key:'times',title:'Vào / ra',render:r=><div>{dateLabel(r.checkInAt)}<br/>{dateLabel(r.checkOutAt)}{r.missingCheckout&&<p>Thiếu giờ ra</p>}{r.requiresAttention&&<p className="is-error">Cần xử lý</p>}</div>},
        {key:'minutes',title:'Phút',render:r=>r.minutes===null?'Chưa tính':r.minutes}, {key:'state',title:'Trạng thái',render:r=><><Status value={r.state} /><p>{r.reason}</p><History entries={r.history} /></>},
        {key:'action',title:'Thao tác',render:r=>user.role==='student'&&r.state==='open'?<button className="btn btn-primary" disabled={busy} onClick={()=>action(()=>apiRequest('/core/time/'+r._id+'/check-out',{method:'POST',body:{version:r.__v}}))}>Kết thúc ca</button>:user.role==='company'?<button className="btn btn-secondary" onClick={()=>setReview(r)}>Duyệt / điều chỉnh giờ</button>:null},
      ].filter(column=>column.key!=='action'||['student','company'].includes(user.role))} />
    </Panel>{review&&<MutationDialog title="Duyệt / điều chỉnh giờ làm" onClose={()=>setReview(null)}><TimeReview data={review} onSaved={()=>{setReview(null);refresh();}} /></MutationDialog>}
  </div>;
}
function TimeReview({data,onSaved}) {
  const [decision,setDecision]=useState(data.state==='needs_adjustment'||data.state==='open'?'adjust':'approved'),[reason,setReason]=useState(''),[start,setStart]=useState(localInput(data.checkInAt)),[end,setEnd]=useState(localInput(data.checkOutAt));
  return <ActionForm submit="Lưu xử lý giờ làm" onSaved={onSaved} onSubmit={()=>apiRequest('/core/time/'+data._id+'/review',{method:'PATCH',body:{decision,reason,version:data.__v,...(decision==='adjust'?{checkInAt:asIso(start),checkOutAt:asIso(end)}:{})}})}>
    <Select label="Thao tác giờ làm" value={decision} onChange={setDecision} options={[{value:'approved',label:'Duyệt giờ'},{value:'rejected',label:'Từ chối'},{value:'adjust',label:'Điều chỉnh (cần duyệt lại)'}]} />
    {decision==='adjust'&&<div className="business-grid"><Text label="Giờ vào điều chỉnh (giờ máy)" required type="datetime-local" value={start} onChange={setStart} /><Text label="Giờ ra điều chỉnh (giờ máy)" required type="datetime-local" value={end} onChange={setEnd} /></div>}
    <Area label="Lý do xử lý giờ làm"  maxLength={2000} value={reason} onChange={setReason} /><p className="muted">Điều chỉnh trong đúng ngày UTC của phiên, không quá16giờ và không ở tương lai. Mọi trước/sau được lưu trong lịch sử.</p>
  </ActionForm>;
}

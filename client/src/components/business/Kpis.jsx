import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { EmptyState, LoadingSkeleton } from '../ui';
import { useResource, dateLabel } from './hooks';
import { Panel, MutationDialog, ActionForm, Area, Text, Select, Status, History } from './Shared';

export default function Kpis({assignment,user}) {
  const [revision,setRevision]=useState(0),[modal,setModal]=useState(null),state=useResource('/core/placements/'+assignment._id,revision);
  if(state.loading)return <LoadingSkeleton rows={1} />;if(state.error)return <EmptyState error title="Không tải được KPI">{state.error}</EmptyState>;
  const doc=state.data;
  return <Panel title="KPI riêng của phân công" description="Kết quả theo tiêu chí và trọng số của phân công.">
    <p className="business-total">{doc.kpiScore===null?'Chưa đủ KPI đã duyệt':`${doc.kpiScore}/100`}</p>
    <div className="business-stack">{(doc.kpis||[]).map((k,i)=><article className="notification-item" key={k._id||i}><div className="section-heading"><div><strong>{k.title} · {k.weightPercent}%</strong><p>{k.description}</p><small>Hạn: {dateLabel(k.deadline)}</small></div><Status value={k.status} /></div>
      <p>{k.score===null?'Chưa chấm':`Điểm: ${k.score}/100`}</p>{k.submittedLate&&<p className="is-error">Nộp sau hạn KPI</p>}{k.content&&<details><summary>Nội dung đã nộp</summary><pre className="business-content">{k.content}</pre></details>}{k.feedback&&<p>Nhận xét: {k.feedback}</p>}
      {user.role==='student'&&['pending','rejected'].includes(k.status)&&doc.lifecycle==='active'&&<button className="btn btn-primary" onClick={()=>setModal({index:i,type:'submit',kpi:k})}>Nộp nội dung KPI {i+1}</button>}
      {['company','mentor'].includes(user.role)&&k.status==='submitted'&&doc.lifecycle==='active'&&<button className="btn btn-primary" onClick={()=>setModal({index:i,type:'evaluate',kpi:k})}>Đánh giá KPI {i+1}</button>}
    </article>)}</div><History entries={doc.history} />
    {modal&&<MutationDialog title={modal.type==='submit'?'Nộp KPI theo kỳ':'Đánh giá KPI theo kỳ'} onClose={()=>setModal(null)}><KpiForm data={doc} modal={modal} onSaved={()=>{setModal(null);setRevision(n=>n+1);}} /></MutationDialog>}
  </Panel>;
}
function KpiForm({data,modal,onSaved}) {
  const [content,setContent]=useState(modal.kpi.content||''),[score,setScore]=useState(''),[status,setStatus]=useState('approved'),[feedback,setFeedback]=useState(''),submit=modal.type==='submit';
  return <ActionForm submit={submit?'Lưu bài nộp KPI':'Lưu đánh giá KPI'} onSaved={onSaved} onSubmit={()=>apiRequest(`/core/placements/${data._id}/kpis/${modal.index}/${submit?'submit':'evaluate'}`,{method:'POST',body:submit?{content,version:data.__v}:{status,score:Number(score),feedback,version:data.__v}})}>
    <p>{modal.kpi.title} · Trọng số{modal.kpi.weightPercent}%</p>{submit?<Area label="Nội dung KPI theo kỳ" required maxLength={20000} value={content} onChange={setContent} />:<><Select label="Kết quả KPI theo kỳ" value={status} onChange={setStatus} options={[{value:'approved',label:'Duyệt'},{value:'rejected',label:'Từ chối / nộp lại'}]} /><Text label="Điểm KPI theo kỳ (0–100)" type="number" required min="0" max="100" step="0.01" value={score} onChange={setScore} /><Area label="Nhận xét KPI theo kỳ" required maxLength={5000} value={feedback} onChange={setFeedback} /></>}
  </ActionForm>;
}

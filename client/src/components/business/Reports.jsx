import { displayLabel } from './content';
import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History, Status, AssignmentPicker } from './Shared';
import { active, dateLabel } from './hooks';
import Kpis from './Kpis';

export default function ReportsPage({user}) {
  const [assignment,setAssignment]=useState(null),[revision,setRevision]=useState(0),[modal,setModal]=useState(null),saved=()=>{setModal(null);setRevision(n=>n+1);};
  return <div className="business-stack"><Panel title="Báo cáo & đánh giá theo kỳ" description="Báo cáo được lưu riêng tư và giữ lịch sử phiên bản."><AssignmentPicker value={assignment} onChange={setAssignment} />{user.role==='student'&&<button className="btn btn-primary" disabled={!active(assignment)} onClick={()=>setModal({type:'submit'})}>Nộp báo cáo theo kỳ</button>}</Panel>
    {assignment&&<Kpis key={assignment._id} assignment={assignment} user={user} />}
    <Panel title="Phiên bản báo cáo"><ServerTable key={assignment?._id||'all'} path={'/core/reports'+(assignment?'?assignmentId='+assignment._id:'')} revision={revision} label="Báo cáo theo kỳ" search={false} columns={[
      {key:'title',title:'Báo cáo',render:r=><div><strong>{r.title}</strong><p>{r.current?'Hiện hành':'Bản cũ'} · {displayLabel(r.kind)} · phiên bản{r.version} · {dateLabel(r.createdAt)}</p><details><summary>Đọc báo cáo</summary><pre className="business-content">{r.content}</pre></details></div>},
      {key:'reviews',title:'Đánh giá',render:r=><div>{r.reviews.length?r.reviews.map(x=><p key={x._id}>{displayLabel(x.role)}: {x.score}/100 · {displayLabel(x.decision)}<br/>{x.comment}</p>):'Chưa có nhận xét'}<History entries={r.history} /></div>},
      {key:'state',title:'Kết quả',render:r=><><Status value={r.state} /><p>{r.finalScore===null?'Chưa chốt điểm':`${r.finalScore}/100`}</p></>},
      {key:'action',title:'Thao tác',render:r=>['company','mentor'].includes(user.role)?<button className="btn btn-secondary" disabled={!r.current||['approved','need_revision'].includes(r.state)||r.reviews.some(x=>x.role===user.role)} onClick={()=>setModal({type:'review',data:r})}>Nhận xét / chấm báo cáo</button>:user.role==='admin'?<button className="btn btn-primary" disabled={!r.current||r.state!=='reviewed'} onClick={()=>setModal({type:'approve',data:r})}>Chốt kết quả báo cáo</button>:<span>Nộp bản mới nếu cần chỉnh</span>},
    ]} /></Panel>
    {modal&&<MutationDialog title={modal.type==='submit'?'Nộp báo cáo theo kỳ':modal.type==='review'?'Đánh giá báo cáo':'Nhà trường chốt kết quả'} onClose={()=>setModal(null)}>{modal.type==='submit'?<ReportForm assignment={assignment} onSaved={saved} />:<ReviewForm data={modal.data} approve={modal.type==='approve'} onSaved={saved} />}</MutationDialog>}
  </div>;
}
function ReportForm({assignment,onSaved}) {
  const [kind,setKind]=useState('weekly'),[title,setTitle]=useState(''),[content,setContent]=useState('');return <ActionForm submit="Nộp phiên bản báo cáo" onSaved={onSaved} onSubmit={()=>apiRequest('/core/reports',{method:'POST',body:{assignmentId:assignment._id,kind,title,content}})}><Select label="Loại báo cáo" value={kind} onChange={setKind} options={[{value:'weekly',label:'Báo cáo tuần'},{value:'final',label:'Báo cáo cuối kỳ'}]} /><Text label="Tiêu đề báo cáo theo kỳ" required value={title} onChange={setTitle} /><Area label="Nội dung báo cáo theo kỳ" required maxLength={50000} value={content} onChange={setContent} /></ActionForm>;
}
function ReviewForm({data,approve,onSaved}) {
  const [score,setScore]=useState(''),[comment,setComment]=useState(''),[decision,setDecision]=useState('approved');
  return <ActionForm submit={approve?'Chốt kết quả':'Lưu đánh giá báo cáo'} onSaved={onSaved} onSubmit={()=>apiRequest('/core/reports/'+data._id+(approve?'/approve':'/reviews'),{method:'POST',body:approve?{reason:comment,version:data.__v}:{score:Number(score),comment,decision,version:data.__v}})}>
    {!approve&&<><Text label="Điểm báo cáo (0–100)" required type="number" min="0" max="100" step="0.01" value={score} onChange={setScore} /><Select label="Kết quả đánh giá báo cáo" value={decision} onChange={setDecision} options={[{value:'approved',label:'Đồng ý'},{value:'need_revision',label:'Cần nộp bản sửa'}]} /></>}
    <Area label={approve?'Lý do chốt kết quả':'Nhận xét báo cáo theo kỳ'} required maxLength={approve?2000:5000} value={comment} onChange={setComment} /><p className="muted">Nhà trường chốt sau khi doanh nghiệp và giảng viên đồng ý. Điểm cuối là trung bình hai đánh giá.</p>
  </ActionForm>;
}

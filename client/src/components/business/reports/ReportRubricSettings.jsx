import {useState} from 'react';
import {useResource} from '../hooks';
import {Text,Area,Select,ActionForm,ErrorNotice} from '../Shared';
import {apiRequest} from '../../../api/client';
function Editor({batch,rubric,onSaved}){
 const [proposalId,setProposalId]=useState('');
 const [method,setMethod]=useState(rubric.gradingPolicy?.method||''),[mentorWeight,setMentorWeight]=useState(String(rubric.gradingPolicy?.mentorWeight||70)),[companyWeight,setCompanyWeight]=useState(String(rubric.gradingPolicy?.companyWeight||30));
 const [criteria,setCriteria]=useState(rubric.criteria.map(c=>({...c,max:String(c.max)}))),[reason,setReason]=useState('');const total=criteria.reduce((n,c)=>n+Number(c.max||0),0);
 return <ActionForm submit="Lưu phiên bản rubric" onSaved={onSaved} disabled={total!==100||!method||(method==='weighted'&&Number(mentorWeight)+Number(companyWeight)!==100)} onSubmit={()=>apiRequest('/core/report-rubrics/'+batch._id,{method:'PUT',body:{version:batch.__v,...(proposalId?{proposalId}:{}),gradingPolicy:{method,...(method==='weighted'?{mentorWeight:Number(mentorWeight),companyWeight:Number(companyWeight)}:{})},criteria:criteria.map(c=>({...c,max:Number(c.max)})),reason}})}>
  <p>{batch.name} · Rubric hiện tại: {rubric.version}</p>
  {(rubric.proposals||[]).filter(p=>p.state==='proposed').map((p,i)=><div key={p.id} className="business-panel"><h4>Đề xuất từ giảng viên {i+1}</h4><p>{p.reason}</p><button type="button" className="btn btn-secondary" onClick={()=>{setCriteria(p.rubric.criteria.map(c=>({...c,max:String(c.max)})));setProposalId(p.id);}}>Dùng nội dung đề xuất này</button></div>)}
  {criteria.map((c,i)=><fieldset className="business-panel" key={c.id}><legend>{c.label}</legend><Text label={'Điểm tối đa: '+c.id} type="number" required min="1" max="100" step="1" value={c.max} onChange={v=>setCriteria(rows=>rows.map((row,j)=>j===i?{...row,max:v}:row))}/><Area label={'Yêu cầu đánh giá: '+c.id} required maxLength={1500} value={c.hint} onChange={v=>setCriteria(rows=>rows.map((row,j)=>j===i?{...row,hint:v}:row))}/></fieldset>)}
  <Select label="Quy định chốt điểm cuối kỳ" required value={method} onChange={setMethod} options={[{value:'',label:'Chọn quy định của nhà trường'},{value:'mentor',label:'Giảng viên xác nhận điểm; doanh nghiệp nhận xét độc lập'},{value:'weighted',label:'Kết hợp điểm theo trọng số được công bố'}]}/>
  {method==='weighted'&&<div className="business-grid"><Text label="Trọng số điểm giảng viên" type="number" min="1" max="99" required value={mentorWeight} onChange={setMentorWeight}/><Text label="Trọng số điểm doanh nghiệp" type="number" min="1" max="99" required value={companyWeight} onChange={setCompanyWeight}/></div>}
  <p role="status">Tổng điểm: {total}/100</p><Area label="Lý do cập nhật rubric" required maxLength={2000} value={reason} onChange={setReason}/><p>Các phân tích đã lưu giữ nguyên rubric tại thời điểm đánh giá. Điểm chưa xác nhận phải phân tích lại nếu rubric thay đổi.</p>
 </ActionForm>;
}
export default function ReportRubricSettings({batch,onSaved}){
 const state=useResource('/core/report-rubrics/'+batch._id);return state.loading?<p>Đang tải rubric…</p>:state.error?<ErrorNotice message={state.error}/>:<Editor batch={{...batch,__v:state.data.batchVersion}} rubric={state.data} onSaved={onSaved}/>;
}

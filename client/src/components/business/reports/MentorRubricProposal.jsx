import {useState} from 'react';
import {useResource,localInput,asIso} from '../hooks';
import {Select,Text,Area,ActionForm,ErrorNotice} from '../Shared';
import {apiRequest} from '../../../api/client';
function ProposalForm({period,onSaved}){
 const state=useResource('/core/report-rubrics/'+period._id),[criteria,setCriteria]=useState(null),[reason,setReason]=useState(''),[deadline,setDeadline]=useState(localInput(period.endDate));
 const rows=criteria||state.data?.criteria||[];
 return <ActionForm submit="Gửi nhà trường phê duyệt rubric" onSaved={onSaved} disabled={state.loading||Boolean(state.error)} onSubmit={()=>apiRequest('/core/report-rubrics/'+period._id+'/proposals',{method:'POST',body:{version:state.data.batchVersion,criteria:rows,reason,deadline:asIso(deadline)}})}>
  <ErrorNotice message={state.error}/>{rows.map((c,i)=><fieldset key={c.id} className="business-panel"><legend>{c.label} — {c.max} điểm</legend><Area label={'Yêu cầu học thuật '+(i+1)} required maxLength={1500} value={c.hint} onChange={v=>setCriteria(rows.map((row,j)=>j===i?{...row,hint:v}:row))}/></fieldset>)}
  <Text label="Hạn đánh giá học thuật" type="datetime-local" required value={deadline} onChange={setDeadline}/><Area label="Căn cứ và nội dung đề xuất" required maxLength={2000} value={reason} onChange={setReason}/><p>Đề xuất chỉ áp dụng sau khi nhà trường phê duyệt, không thay điểm hoặc rubric đã lưu trước đó.</p>
 </ActionForm>;
}
export default function MentorRubricProposal({onSaved}){
 const periods=useResource('/core/report-rubrics'),[period,setPeriod]=useState('');const selected=periods.data?.items.find(r=>r._id===period);
 return <div className="business-stack"><ErrorNotice message={periods.error}/><Select label="Kỳ phụ trách cần đề xuất rubric" value={period} onChange={setPeriod} options={[{value:'',label:'Chọn kỳ phụ trách'},...(periods.data?.items||[]).map(r=>({value:r._id,label:r.name}))]}/>{selected&&<ProposalForm key={period} period={selected} onSaved={onSaved}/>}</div>;
}

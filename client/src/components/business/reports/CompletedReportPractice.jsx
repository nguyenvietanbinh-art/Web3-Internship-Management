import {useState} from 'react';
import {apiRequest} from '../../../api/client';
import {useResource} from '../hooks';
import {Select,Area,ErrorNotice} from '../Shared';
import ReviewForm from './ReviewForm';

export default function CompletedReportPractice({report}){
 const state=useResource('/core/reports/'+report._id+'/practice');
 const [variant,setVariant]=useState('complete'),[edited,setEdited]=useState(null),[result,setResult]=useState(null),[reviewing,setReviewing]=useState(false),[grade,setGrade]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(state.loading)return <p>Đang chuẩn bị bài tập báo cáo…</p>;
 if(state.error)return <ErrorNotice message={state.error}/>;
 const data=state.data,content=edited??data.variants.find(v=>v.id===variant).content;
 const reset=()=>{setResult(null);setReviewing(false);setGrade(null);setError('');};
 const analyze=async()=>{if(busy)return;setBusy(true);setError('');try{setResult(await apiRequest('/core/ai/reports/'+report._id+'/practice-analyze',{method:'POST',body:{content,engine:'tfidf'}}));setReviewing(false);setGrade(null);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const download=()=>{const row={source_report_id:data.source_report_id,student_id:data.student_id,variant,report_text:content,features:data.observations,synthetic:true,label_source:'user-entered-practice-not-independently-verified',expert_label_verified:false,training_eligible:false,grading:grade,created_at:new Date().toISOString()};const blob=new Blob([JSON.stringify(row,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='phieu-cham-thu-'+report._id+'-'+variant+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <div className="business-stack">
  <p><strong>{data.context.student} · {data.context.batch}</strong></p>
  <p>Bài viết ngắn được tạo để luyện đánh giá. Báo cáo và điểm đã duyệt của sinh viên được giữ nguyên.</p>
  <Select label="Chọn bài để thử đánh giá" value={variant} onChange={v=>{setVariant(v);setEdited(null);reset();}} options={data.variants.map(v=>({value:v.id,label:v.label}))}/>
  <Area label="Bài báo cáo ngắn theo kỳ thực tập" maxLength={50000} value={content} onChange={v=>{setEdited(v);reset();}}/>
  <ErrorNotice message={error}/>
  <button type="button" className="btn btn-primary" disabled={busy||!content.trim()} onClick={analyze}>{busy?'Đang chấm trước…':'Chấm trước bài này'}</button>
  {result?.proposed_grading&&<section><h3>Điểm chấm trước: {result.proposed_grading.total}/100</h3><p>{result.proposed_grading.summary}</p><ul>{result.proposed_grading.criteria.map(i=><li key={i.id}>{i.label}: {i.score}/{i.max} — {i.basis}</li>)}</ul><button type="button" className="btn btn-secondary" onClick={()=>setReviewing(true)}>Kiểm tra và chấm lại bài tập</button></section>}
  {reviewing&&<ReviewForm key={variant} data={{...report,content}} reviewerRole="mentor" proposal={result.proposed_grading} practice onSaved={value=>{setGrade(value);setReviewing(false);}}/>}
  {grade&&<section><h3>Phiếu chấm thử đã hoàn tất: {grade.score}/100</h3><p className="business-content" style={{whiteSpace:'pre-wrap'}}>{grade.comment}</p><button type="button" className="btn btn-secondary" onClick={download}>Xuất bài và phiếu chấm thử</button><p>File dùng chuẩn bị dữ liệu gán nhãn; chưa tự đưa vào huấn luyện hoặc xác nhận thành nhãn chuyên gia.</p></section>}
 </div>;
}

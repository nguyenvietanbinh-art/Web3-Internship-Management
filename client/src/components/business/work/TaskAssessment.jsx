import {definitionState,definitionBody} from './taskCriteria.mjs';
import {Resource} from '../workflow/common';
import {useState} from 'react';
import {apiRequest} from '../../../api/client';
import {Panel,Text,Area,Select,ActionForm,ErrorNotice} from '../Shared';
import {useResource,dateLabel} from '../hooks';
import {downloadFile} from '../../../api/files';
export function CriteriaFields({value,onChange}){
 const set=(key,v)=>onChange({...value,[key]:v});
 return <div className="business-stack">
  <Area label="Mục tiêu cần đạt" required maxLength={2000} value={value.objective} onChange={v=>set('objective',v)}/>
  <Area label="Các công việc cần thực hiện, mỗi dòng một việc" required value={value.workItems} onChange={v=>set('workItems',v)}/>
  <Area label="Sản phẩm bắt buộc, mỗi dòng một sản phẩm" required value={value.requiredProducts} onChange={v=>set('requiredProducts',v)}/>
  <Text label="Trọng số nhiệm vụ" required type="number" min="1" max="1000" step="1" value={value.progressWeight} onChange={v=>set('progressWeight',v)}/>
  {value.criteria.map((c,i)=><fieldset key={c.id} className="business-panel"><legend>Tiêu chí {i+1}</legend>{[['title','Tên tiêu chí'],['description','Yêu cầu nghiệm thu'],['requiredProduct','Bằng chứng cần kiểm tra']].map(([key,label])=><Area key={key} label={label+' '+(i+1)} required maxLength={key==='title'?200:key==='description'?1500:1000} value={c[key]} onChange={v=>set('criteria',value.criteria.map((row,j)=>j===i?{...row,[key]:v}:row))}/>)}<Text label={'Trọng số tiêu chí '+(i+1)} required type="number" min="1" max="1000" step="1" value={c.weight} onChange={v=>set('criteria',value.criteria.map((row,j)=>j===i?{...row,weight:v}:row))}/>{value.criteria.length>1&&<button type="button" className="btn btn-secondary" onClick={()=>set('criteria',value.criteria.filter((_,j)=>j!==i))}>Bỏ tiêu chí {i+1}</button>}</fieldset>)}
  <button type="button" className="btn btn-secondary" disabled={value.criteria.length>=10} onClick={()=>set('criteria',[...value.criteria,{id:'c'+Date.now(),title:'',description:'',requiredProduct:'',weight:'1'}])}>Thêm tiêu chí</button>
 </div>;
}
export function CriteriaConfigurationForm({data,onSaved}){
 const [form,setForm]=useState(()=>definitionState(data));
 return <ActionForm submit="Xác nhận tiêu chí nghiệm thu" onSaved={onSaved} onSubmit={()=>apiRequest('/core/tasks/'+data._id+'/criteria',{method:'PUT',body:{...definitionBody(form),version:data.__v}})}><strong>{data.title}</strong><CriteriaFields value={form} onChange={setForm}/><p>Tiêu chí và trọng số được khóa sau khi đã có bài nộp.</p></ActionForm>;
}
export function TaskProgressSummary({assignmentId,revision}){
 const state=useResource('/core/tasks/progress/summary?assignmentId='+assignmentId,revision);
 return <Panel title="Tiến độ đã được xác nhận"><Resource state={state}>{state.data&&<><strong>{state.data.confirmedProgress===null?'Chưa có tiêu chí được xác nhận':state.data.confirmedProgress+'%'}</strong><p>{state.data.eligibleTasks}/{state.data.tasks} nhiệm vụ có tiêu chí hợp lệ.</p>{state.data.missingCriteria>0&&<p>Còn {state.data.missingCriteria} nhiệm vụ cần doanh nghiệp bổ sung tiêu chí; phần trăm hiện chỉ tính các nhiệm vụ đủ tiêu chí.</p>}</>}</Resource></Panel>;
}
const states={mentioned:'Có nội dung đề cập',related_evidence:'Có tài liệu liên quan, chưa xác minh',insufficient:'Chưa đủ bằng chứng'};
export function TaskEvaluationPanel({data,user,readOnly=false}){
 const [task,setTask]=useState(data),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <div className="business-stack"><h3>{task.title}</h3><p>Mã nhiệm vụ: {task._id}</p><strong>Tiến độ chính thức: {task.confirmedProgress==null?'Chưa xác nhận theo tiêu chí':task.confirmedProgress+'%'}</strong>
  {!task.criteriaApprovedAt&&<p>Doanh nghiệp cần bổ sung và xác nhận tiêu chí nghiệm thu.</p>}
  <ol>{task.acceptanceCriteria?.map(c=>{const review=task.criterionReviews?.find(r=>r.criterionId===c.id);return <li key={c.id}><strong>{c.title}</strong> · Trọng số {c.weight}<p>{c.description}</p><p>Sản phẩm: {c.requiredProduct}</p><p>{review?({met:'Đạt',not_met:'Không đạt',need_revision:'Cần bổ sung'}[review.state]):'Chưa được xác nhận'}</p>{review&&<p>{review.comment} · {review.evidence} · {dateLabel(review.confirmedAt)}</p>}</li>;})}</ol>
  {!readOnly&&task.submission?.submittedAt&&user.role!=='admin'&&<button type="button" className="btn btn-primary" disabled={busy||!task.criteriaApprovedAt||task.status==='done'} onClick={async()=>{setBusy(true);setError('');try{setTask(await apiRequest('/core/tasks/'+task._id+'/analyze',{method:'POST',body:{version:task.__v}}));}catch(e){setError(e.message);}finally{setBusy(false);}}}>{busy?'Đang đối chiếu bài nộp…':'Phân tích bài nộp'}</button>}
  <ErrorNotice message={error}/>
  {task.evidenceAnalysis&&<section><h3>Kết quả đối chiếu nội dung</h3>{task.evidenceAnalysis.criteria.map(c=><div className="business-panel" key={c.id}><strong>{task.acceptanceCriteria.find(r=>r.id===c.id)?.title}</strong><p>{states[c.evidence_state]}</p><p>{c.comment}</p>{c.matches.map((m,i)=><blockquote key={i}><p style={{whiteSpace:'pre-wrap'}}>{m.quote}</p><small>{m.source==='submission'?'Bài nộp':'Tài liệu đính kèm'} · Vị trí {m.start}–{m.end}</small></blockquote>)}</div>)}{task.evidenceAnalysis.attachmentError&&<p>{task.evidenceAnalysis.attachmentError}</p>}{task.evidenceAnalysis.coverage?.truncated&&<p>Nội dung dài; kết quả chưa bao phủ toàn bộ tài liệu.</p>}</section>}
  <details><summary>Lịch sử bài nộp ({task.submissionVersions?.length||0})</summary>{task.submissionVersions?.map(row=><article key={row.version}><h4>Phiên bản {row.version} · {dateLabel(row.submission?.submittedAt)}</h4><p style={{whiteSpace:'pre-wrap'}}>{row.submission?.content}</p><p>Kết quả: {row.submission?.result}</p><p>Khó khăn: {row.submission?.challenges}</p><p>Giải pháp: {row.submission?.solution}</p>{row.submission?.fileName&&<button type="button" className="btn btn-secondary" onClick={async()=>{try{await downloadFile('/core/tasks/'+task._id+'/submission/file?submissionVersion='+row.version,row.submission.fileName);}catch(e){setError(e.message);}}}>Tải minh chứng phiên bản {row.version}</button>}</article>)}</details>
 </div>;
}
export function TaskCriteriaReview({data,onSaved}){
 const [reviews,setReviews]=useState(()=>(data.acceptanceCriteria||[]).map(c=>({criterionId:c.id,state:'need_revision',comment:'',evidence:''}))),[comment,setComment]=useState('');
 return <ActionForm submit="Xác nhận từng tiêu chí" disabled={!data.criteriaApprovedAt||data.status!=='review'} onSaved={onSaved} onSubmit={()=>apiRequest('/core/tasks/'+data._id+'/criteria-review',{method:'POST',body:{version:data.__v,submissionVersion:data.submissionVersion,criteriaVersion:data.criteriaVersion,reviews,comment}})}>
  <h3>{data.title}</h3><details><summary>Xem bài nộp và đối chiếu</summary><TaskEvaluationPanel data={data} user={{role:'company'}} readOnly/></details>
  {reviews.map((r,i)=><fieldset className="business-panel" key={r.criterionId}><legend>{data.acceptanceCriteria[i].title} · Trọng số {data.acceptanceCriteria[i].weight}</legend><Select label={'Kết quả tiêu chí '+(i+1)} value={r.state} onChange={v=>setReviews(rows=>rows.map((row,j)=>j===i?{...row,state:v}:row))} options={[{value:'need_revision',label:'Cần bổ sung'},{value:'not_met',label:'Không đạt'},{value:'met',label:'Đạt'}]}/><Area label={'Nhận xét tiêu chí '+(i+1)} required maxLength={2000} value={r.comment} onChange={v=>setReviews(rows=>rows.map((row,j)=>j===i?{...row,comment:v}:row))}/><Area label={'Căn cứ đã kiểm tra '+(i+1)} required maxLength={2000} value={r.evidence} onChange={v=>setReviews(rows=>rows.map((row,j)=>j===i?{...row,evidence:v}:row))}/></fieldset>)}
  <Area label="Nhận xét chung" required maxLength={5000} value={comment} onChange={setComment}/>
 </ActionForm>;
}

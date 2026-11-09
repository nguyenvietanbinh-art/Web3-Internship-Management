import {useEffect} from 'react';
import {defaultAssignment} from './assignmentChoice.mjs';
import {displayLabel} from './content';
export default function AssignmentContext({items,selectedId='',preferredId='',onChange,loading=false,error=''}){
 const selected=items.find(a=>String(a._id)===String(selectedId));
 useEffect(()=>{
  if(loading||error||selected)return;
  let cancelled=false;queueMicrotask(()=>{if(cancelled)return;const next=items.find(a=>String(a._id)===String(preferredId))||defaultAssignment(items);if(next)onChange?.(String(next._id),next);else if(selectedId)onChange?.('',null);});
  return()=>{cancelled=true;};
 },[items,selected,selectedId,preferredId,onChange,loading,error]);
 const label=a=>[a.batch?.name||a.batchName,a.topicSnapshot?.title||a.topic?.title,a.company?.companyName||a.company?.name].filter(Boolean).join(' · ');
 return <div className="supervision-selection">
 {loading?<p role="status">Đang tải thông tin thực tập…</p>:selected?<><p><strong>{label(selected)||'Thông tin thực tập'}</strong></p><p>{displayLabel(selected.lifecycle)}</p></>:items.length>1?<p>Chưa xác định được một kỳ đang thực tập duy nhất. Mở hồ sơ kỳ cần xem bên dưới.</p>:null}
 {!loading&&items.length>1&&<details><summary>Các kỳ thực tập của sinh viên</summary><div className="business-stack">{items.map(a=><button type="button" className="btn btn-secondary" aria-pressed={String(a._id)===String(selectedId)} key={a._id} onClick={()=>onChange?.(String(a._id),a)}>{label(a)||'Thông tin thực tập'} · {displayLabel(a.lifecycle)}</button>)}</div></details>}
 </div>;
}

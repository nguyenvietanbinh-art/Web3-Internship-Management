import {useState,useRef,useEffect} from 'react';
import {Panel,Select,Text,ErrorNotice} from './Shared';
export default function StudentMatchingForm({periods,status,engine,topK,periodId,onEngine,onTopK,onPeriod,onSubmit,onResult,admitted}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const change=setter=>value=>{onResult(null);setError('');setter(value);};
 const unavailable=periods.loading||Boolean(periods.error)||!periods.data?.items?.length;
 return <Panel title="Tìm đề tài phù hợp với CV">
  <form className="student-matching-form" aria-label="Tìm đề tài phù hợp với CV" aria-busy={busy} onSubmit={async event=>{
   event.preventDefault();if(pending.current||unavailable||admitted)return;
   if(!Number.isInteger(Number(topK))||Number(topK)<1||Number(topK)>20){setError('Số đề tài phải là số nguyên từ 1 đến 20.');return;}
   pending.current=true;setBusy(true);setError('');
   try{const result=await onSubmit();if(alive.current)onResult(result);}catch(e){if(alive.current)setError(e.message);}finally{pending.current=false;if(alive.current)setBusy(false);}
  }}>
   <fieldset disabled={busy||unavailable} className="student-matching-fields">
    <Select label="Kỳ thực tập của tôi" required value={periodId} onChange={change(onPeriod)} options={[{value:'',label:'Chọn kỳ thực tập'},...(periods.data?.items||[]).map(e=>({value:e._id,label:e.batch.name}))]}/>
    <Select label="Phương pháp đối chiếu CV" value={engine} onChange={change(onEngine)} options={[{value:'tfidf',label:'Đối chiếu từ khóa'},{value:'sbert',label:'Đối chiếu ngữ nghĩa'},{value:'compare',label:'So sánh từ khóa và ngữ nghĩa'}]}/>
    <Text label="Số đề tài hiển thị" type="number" min="1" max="20" step="1" required value={topK} onChange={change(onTopK)}/>
    <button className="btn btn-primary" type="submit" disabled={busy||Boolean(admitted)}>{busy?'Đang đối chiếu…':'Tìm đề tài phù hợp'}</button>
   </fieldset>
   <div className="matching-form-status" role="status">{status.loading?'Đang kiểm tra công cụ…':status.error?'Chưa lấy được trạng thái công cụ.':status.data?.sbert.ready?'Đối chiếu ngữ nghĩa đã sẵn sàng':'Đối chiếu ngữ nghĩa chưa sẵn sàng'}</div>
   <ErrorNotice message={periods.error||status.error||error}/>
   {!periods.loading&&!periods.error&&!periods.data?.items?.length&&<p>Bạn chưa được cấp kỳ thực tập. Vui lòng liên hệ nhà trường.</p>}
   {admitted&&<div role="status"><strong>Bạn đã có đề tài trong kỳ này.</strong><p>{admitted.admission.title} · {admitted.admission.companyName}</p></div>}
  </form>
 </Panel>;
}

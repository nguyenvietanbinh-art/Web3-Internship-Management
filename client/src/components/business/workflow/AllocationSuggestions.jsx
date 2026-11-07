import {useState} from 'react';
import {apiRequest} from '../../../api/client';
import {Select,ActionForm,MutationDialog,ErrorNotice} from '../Shared';
import MatchingDetails from '../MatchingDetails';
import {vnDate} from './constants';

export default function AllocationSuggestions({row,batch,onClose,onPick}){
 const [engine,setEngine]=useState('sbert'),[result,setResult]=useState(null),[error,setError]=useState('');
 return <MutationDialog title="Đối chiếu đề tài để phân công" onClose={onClose}>
  <p><strong>{row.student?.name}</strong> · {batch.name}</p>
  <p>Chỉ đối chiếu đề tài đúng kỳ, còn chỗ và doanh nghiệp cho phép nhà trường phân bổ. Xem kết quả không tạo phân công hoặc giữ chỗ.</p>
  <ErrorNotice message={error}/>
  <ActionForm submit="Tìm đề tài để phân công" onSaved={setResult} onSubmit={()=>{setError('');setResult(null);return apiRequest('/core/school/ai/recommend-placement',{method:'POST',body:{enrollmentId:row._id,engine,topK:5}});}}>
   <Select label="Cách đối chiếu đề tài" value={engine} onChange={v=>{setEngine(v);setResult(null);}} options={[{value:'sbert',label:'Đối chiếu ý nghĩa nội dung'},{value:'tfidf',label:'Đối chiếu từ ngữ và kỹ năng'}]}/>
  </ActionForm>
  {result&&<section>
   {!result.allocation_available_now&&<p>Chưa đến thời gian phân bổ trực tiếp của nhà trường. Có thể thực hiện từ {vnDate(result.allocation_opens_at)}; hiện chỉ xem kết quả đối chiếu.</p>}
   {result.participation_confirmation_required&&<p>Sinh viên chưa đăng ký tham gia kỳ; nhà trường cần xác nhận riêng trước khi phân công.</p>}
   {!result.items.length&&<p>{result.reason==='ALREADY_ADMITTED'?'Sinh viên đã có đề tài trong kỳ.':'Chưa có đề tài hợp lệ để nhà trường phân bổ.'}</p>}
   <ol>{result.items.map(item=><li key={item.id}><h3>{item.title}</h3><p>{item.companyName} · Còn {item.remainingSlots} chỗ</p><MatchingDetails item={item} student={false}/>{result.allocation_available_now&&<button type="button" className="btn btn-secondary" onClick={()=>onPick(item)}>Chọn để lập phân công</button>}</li>)}</ol>
  </section>}
 </MutationDialog>;
}

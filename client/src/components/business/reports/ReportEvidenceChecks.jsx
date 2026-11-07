import {useState} from 'react';
import {Area,Select,ActionForm} from '../Shared';
import {apiRequest} from '../../../api/client';
export default function ReportEvidenceChecks({data,rubric,semantic,onSaved}){
 const [checks,setChecks]=useState(()=>rubric.criteria.filter(c=>c.id!=='progress').map(c=>({id:c.id,level:'',quote:semantic?.criteria.find(r=>r.id===c.id)?.matches.find(m=>m.source==='submission')?.quote||'',comment:'',productChecked:false})));
 const change=(id,key,value)=>setChecks(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
 return <ActionForm submit="Lưu kiểm tra bằng chứng" onSaved={onSaved} onSubmit={()=>apiRequest('/core/reports/'+data._id+'/evidence-checks',{method:'POST',body:{version:data.__v,checks:checks.filter(c=>c.level!=='').map(c=>({...c,level:Number(c.level)}))}})}>
  <p>Chọn mức đạt sau khi đọc bài và kiểm tra căn cứ. Các mục chưa được kiểm tra không được tự cho điểm.</p>
  {checks.map(c=><fieldset key={c.id} className="business-panel"><legend>{rubric.criteria.find(r=>r.id===c.id).label}</legend><Select label={'Mức đã kiểm tra: '+c.id} value={c.level} onChange={v=>change(c.id,'level',v)} options={[{value:'',label:'Chưa kiểm tra'},...rubric.levels.map(l=>({value:String(l.level),label:l.label+' — '+l.description}))]}/>{c.level!==''&&<><Area label={'Trích đoạn đã kiểm tra: '+c.id} maxLength={3000} required={Number(c.level)>0} value={c.quote} onChange={v=>change(c.id,'quote',v)}/><Area label={'Căn cứ xác minh: '+c.id} required maxLength={2000} value={c.comment} onChange={v=>change(c.id,'comment',v)}/>{['results','evidence'].includes(c.id)&&Number(c.level)>0&&<label><input type="checkbox" checked={c.productChecked} required onChange={e=>change(c.id,'productChecked',e.target.checked)}/> Tôi đã mở và kiểm tra sản phẩm/bằng chứng liên quan.</label>}</>}</fieldset>)}
 </ActionForm>;
}

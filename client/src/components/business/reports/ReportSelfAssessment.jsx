import {useResource} from '../hooks';
import {Text,ErrorNotice} from '../Shared';
export default function ReportSelfAssessment({batchId,value,onChange}){
 const rubric=useResource(batchId?'/core/report-rubrics/'+batchId:null);
 return <fieldset className="business-panel"><legend>Điểm tự đánh giá của sinh viên (tùy chọn)</legend><ErrorNotice message={rubric.error}/><p>Điểm bạn tự chấm được lưu riêng, không thay điểm AI hoặc điểm giảng viên. Để trống tất cả nếu chưa tự chấm.</p>{rubric.data?.criteria.map(c=><Text key={c.id} label={'Tự chấm: '+c.label} type="number" min="0" max={c.max} step="0.01" value={value?.scores?.find(r=>r.id===c.id)?.score??''} onChange={score=>onChange({rubricVersion:rubric.data.version,scores:[...(value?.scores||[]).filter(r=>r.id!==c.id),...(score===''?[]:[{id:c.id,score:Number(score)}])]})}/>)}</fieldset>;
}

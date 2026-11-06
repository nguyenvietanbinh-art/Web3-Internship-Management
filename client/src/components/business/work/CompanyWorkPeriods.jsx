import {Select,ErrorNotice} from '../Shared';
import {useSchoolResource} from '../workflow/useSchoolResource';
export default function CompanyWorkPeriods({value,onChange}){
 const data=useSchoolResource('/core/work/batches?limit=100');
 return <div><ErrorNotice message={data.error}/><Select label="Kỳ thực tập để giao công việc" value={value} onChange={onChange} disabled={data.loading} options={[{value:'',label:data.loading?'Đang tải kỳ thực tập…':'Chọn kỳ thực tập'},...(data.data?.items||[]).map(b=>({value:b._id,label:`${b.code} · ${b.name} · ${b.status==='closed'?'Đã đóng':'Đang mở'}`}))]}/><p className="muted">Chọn kỳ, sau đó chọn sinh viên / phân công trong kỳ để giao việc hoặc yêu cầu theo tuần.</p>{!data.loading&&!data.error&&!data.data?.items.length&&<p>Doanh nghiệp chưa có đề tài hoặc phân công trong kỳ nào.</p>}</div>;
}

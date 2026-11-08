import {useState} from 'react';
import {Panel,Resource,Rows,Pager,CommandDialog} from './common';
import {reasonField} from './constants';
import {useSchoolResource as useData} from './useSchoolResource';
export function EligibilityAction({row,onSaved}){
 const [open,setOpen]=useState(false);
 return <><button className="btn btn-secondary" onClick={()=>setOpen(true)}>Diện tham gia</button>{open&&<CommandDialog title="Điều chỉnh diện tham gia kỳ" path={`/core/admin/enrollments/${row._id}/eligibility`} method="PATCH" initial={{version:row.__v,eligibility:row.eligibility,reason:''}} fields={[{key:'eligibility',label:'Diện được tham gia',options:[{value:'eligible',label:'Đủ điều kiện'},{value:'suspended',label:'Tạm ngưng'},{value:'exempt',label:'Được miễn'},{value:'removed',label:'Không còn thuộc diện'}]},reasonField]} onClose={()=>setOpen(false)} onSaved={()=>{setOpen(false);onSaved();}}><p>Nếu đã nhận đề tài, cần xử lý hủy hoặc điều chuyển riêng trước. Thao tác này không xóa lịch sử hay hoàn lượt ứng tuyển.</p></CommandDialog>}</>;
}
export default function Exclusions({batchId,revision,onSaved}){
 const [page,setPage]=useState(1),data=useData(`/core/admin/batches/${batchId}/exclusions?page=${page}&limit=10`,revision);
 return <Panel title="Sinh viên tạm ngưng, được miễn hoặc không còn thuộc diện"><Resource state={data}><Rows items={data.data?.items} columns={[{key:'name',title:'Sinh viên',render:e=><>{e.student?.name}<p>{e.student?.email}</p></>},{key:'eligibility',title:'Diện tham gia'},{key:'action',title:'Thao tác',render:e=><EligibilityAction row={e} onSaved={onSaved}/>} ]}/><Pager data={data.data} page={page} onPage={setPage}/></Resource></Panel>;
}

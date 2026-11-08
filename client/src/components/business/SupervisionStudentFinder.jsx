import {useEffect,useState} from 'react';
import {useViewState} from '../viewStateStore';
import {useResource} from './hooks';
import {Text,ErrorNotice,Select} from './Shared';
import {displayLabel} from './content';
import {Resource,Pager} from './workflow/common';

export default function SupervisionStudentFinder({filters,selected,onSelect,onAssignment,showAssignments=true,apiBase='/core/admin/supervision/students',includeAdmissions=false}){
 const [input,setInput]=useViewState('supervision-student-search','');
 const [query,setQuery]=useState(input),[page,setPage]=useViewState('supervision-student-page',1);
 const [expanded,setExpanded]=useState(false);
 const showResults=!selected||expanded;
 const scope=new URLSearchParams(Object.fromEntries(['batchId','companyUserId','mentorUserId'].map(key=>[key,filters[key]||'']))).toString()+('&includeAdmissions='+includeAdmissions);
 useEffect(()=>{if(input===query)return;const timer=setTimeout(()=>{setQuery(input);setPage(1);},250);return()=>clearTimeout(timer);},[input,query,setPage]);
 const students=useResource(`${apiBase}?${scope}&q=${encodeURIComponent(query)}&page=${page}&limit=10`);
 return <section aria-label="Tìm sinh viên để giám sát" className="supervision-students">
 <Text onKeyDown={e=>{if(e.key==='Enter')e.preventDefault();}} label="Tìm sinh viên" placeholder="Họ tên, mã sinh viên hoặc email" value={input} onChange={value=>{setInput(value);setExpanded(Boolean(value));if(!value){onSelect(null);setQuery('');setPage(1);}}}/>
 {showResults&&<>
 <Resource state={{...students,loading:students.loading||input!==query}}><p role="status">Hiển thị {Math.min(students.data?.items.length||0,expanded?10:5)} / {students.data?.total||0} sinh viên trong phạm vi bộ lọc.</p>
 <ul className="supervision-student-list" aria-label="Kết quả tìm sinh viên">{students.data?.items.slice(0,expanded?10:5).map(s=><li key={s._id}><button type="button" className={`btn ${selected?._id===s._id?'btn-primary':'btn-secondary'}`} aria-pressed={selected?._id===s._id} onClick={()=>{onSelect(s);setExpanded(false);}}><strong>{s.name}</strong><span>{s.studentCode||'Chưa có mã sinh viên'} · {s.email}{s.disabled?' · Tài khoản đã khóa':''}</span><span>{s.assignmentCount? [...new Set(s.internshipStates||[])].map(value=>displayLabel(value)).join(' · '):'Chưa có phân công'}</span></button></li>)}</ul>
 {!students.data?.items.length&&<p>Không tìm thấy sinh viên khớp từ khóa và bộ lọc. Thử bỏ bớt điều kiện tìm kiếm.</p>}{expanded?<Pager data={students.data} page={page} onPage={setPage}/>:students.data?.total>5&&<button type="button" className="btn btn-secondary" onClick={()=>setExpanded(true)}>Xem thêm sinh viên</button>}</Resource></>}
 {selected&&<div className="supervision-selection"><p><strong>Đã chọn: {selected.name}</strong> · {selected.studentCode} · {selected.email}</p><div className="business-actions"><button type="button" className="btn btn-secondary" onClick={()=>setExpanded(value=>!value)}>{expanded?'Thu gọn danh sách':'Đổi sinh viên'}</button><button type="button" className="btn btn-secondary" onClick={()=>{onSelect(null);setInput('');setQuery('');setPage(1);setExpanded(false);}}>Bỏ chọn sinh viên</button></div>
 {showAssignments&&<StudentPlacements key={selected._id+scope} studentId={selected._id} scope={scope} apiBase={apiBase} value={filters.assignmentId||''} onChange={onAssignment}/>}</div>}
 </section>;
}

function StudentPlacements({studentId,scope,value,onChange,apiBase}){
 const data=useResource(`${apiBase}/${studentId}/placements?${scope}`);
 return <><ErrorNotice message={data.error}/>{data.loading?<p role="status">Đang tải thông tin thực tập…</p>:data.data?.items.length?<Select label="Kỳ / phân công cần xem" value={value} onChange={id=>onChange?.(id,data.data.items.find(a=>a._id===id)||null)} options={[{value:'',label:'Tất cả phân công của sinh viên'},...data.data.items.map(a=>({value:a._id,label:`${a.batch?.name||'Kỳ chưa có tên'} · ${a.topicSnapshot?.title||'Đề tài chưa có tên'} · ${a.company?.companyName||a.company?.name||'Chưa có doanh nghiệp'}`}))]}/>:!data.error&&<p role="status">Sinh viên chưa có phân công thực tập chính thức trong phạm vi bộ lọc. Chưa có công việc hoặc nhật ký thuộc phạm vi này.</p>}</>;
}

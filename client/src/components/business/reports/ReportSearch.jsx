import {useEffect,useState} from 'react';
import {useViewState} from '../../viewStateStore';
import {useResource,dateLabel} from '../hooks';
import {Text} from '../Shared';
import {Resource,Pager} from '../workflow/common';
import {displayLabel} from '../content';
export default function ReportSearch({selected,onSelect,revision=0}){
 const [input,setInput]=useViewState('report-search',''),[page,setPage]=useViewState('report-search-page',1),[query,setQuery]=useState(input),[expanded,setExpanded]=useState(false);
 useEffect(()=>{if(input===query)return;const timer=setTimeout(()=>setQuery(input),300);return()=>clearTimeout(timer);},[input,query]);
 const state=useResource('/core/reports?'+new URLSearchParams({q:query,page:String(page),limit:'10'}),revision);
 return <section aria-label="Tìm báo cáo thực tập">
 <Text label="Tìm báo cáo" placeholder="Tên sinh viên, MSSV hoặc tiêu đề báo cáo" value={input} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();setQuery(input);}}} onChange={value=>{setInput(value);setPage(1);setExpanded(true);}}/>
 {(!selected||expanded)&&<Resource state={{...state,loading:state.loading||input!==query}}>
 <ul className="supervision-student-list" aria-label="Kết quả tìm báo cáo">{state.data?.items.map(report=><li key={report._id}><button type="button" className="btn btn-secondary" onClick={()=>{onSelect(report);setExpanded(false);}}><strong>{report.context?.studentName||'Sinh viên'} · {report.context?.studentCode||'Chưa có MSSV'}</strong><span>{report.title} · v{report.version} · {displayLabel(report.state)}</span><span>{report.context?.batchName} · {dateLabel(report.createdAt)}</span></button></li>)}</ul>
 {!state.data?.items.length&&<p role="status">Không tìm thấy báo cáo trong phạm vi sinh viên bạn phụ trách.</p>}
 <Pager data={state.data} page={page} onPage={setPage}/>
 </Resource>}
 {selected&&<div className="supervision-selection"><p><strong>{selected.context?.studentName}</strong> · {selected.context?.studentCode}</p><p>{selected.title} · v{selected.version} · {displayLabel(selected.state)}</p><button type="button" className="btn btn-secondary" onClick={()=>setExpanded(value=>!value)}>{expanded?'Thu gọn kết quả':'Đổi báo cáo'}</button><button type="button" className="btn btn-secondary" onClick={()=>{onSelect(null);setInput('');setQuery('');setPage(1);setExpanded(false);}}>Bỏ chọn báo cáo</button></div>}
 </section>;
}

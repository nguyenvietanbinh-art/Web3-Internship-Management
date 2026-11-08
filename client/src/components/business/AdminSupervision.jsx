import {useViewState,useViewMemory} from '../viewStateStore';
import {useResource,dateLabel} from './hooks';
import {Panel,Select,Text,Status,ErrorNotice} from './Shared';
import {Resource,Rows,Pager} from './workflow/common';
import {useState} from 'react';
import {Dialog} from '../ui';
import {TaskSubmission} from './work/TaskSubmission';
import SupervisionStudentFinder from './SupervisionStudentFinder';

const states={tasks:[['todo','Chưa thực hiện'],['in_progress','Đang thực hiện'],['review','Chờ duyệt'],['done','Hoàn thành']],logs:[['pending_submission','Chưa nộp'],['submitted','Đã nộp'],['approved','Đã duyệt'],['need_revision','Cần bổ sung']],time:[['open','Đang trong ca'],['pending','Chờ duyệt'],['needs_adjustment','Cần điều chỉnh'],['approved','Đã duyệt'],['rejected','Từ chối']]};
export default function AdminSupervision({time=false}){
 const [kind,setKind]=useViewState('supervision-kind',time?'time':'tasks');
 const mode=time?'time':kind==='logs'?'logs':'tasks';
 const [filters,setFilters]=useViewMemory('supervision-filters',{batchId:'',companyUserId:'',studentUserId:'',mentorUserId:'',assignmentId:'',status:'',q:''});
 const [student,setStudent]=useViewMemory('supervision-student',null),[detail,setDetail]=useState(null);
 const [page,setPage]=useViewState('supervision-page',1);
 const options=useResource('/core/admin/supervision/filters');
 const validStatus=states[mode].some(([value])=>value===filters.status)?filters.status:'';
 const query=new URLSearchParams({...filters,status:validStatus,studentUserId:student?._id||'',assignmentId:student?filters.assignmentId:'',page:String(page),limit:'10'});
 const data=useResource(`/core/admin/supervision/${mode}?${query}`);
 const change=(key,value)=>{setFilters({...filters,[key]:value,...(['batchId','companyUserId','mentorUserId'].includes(key)?{assignmentId:''}:{})});setPage(1);setDetail(null);};
 const people=[['batchId','Kỳ thực tập','batches'],['companyUserId','Doanh nghiệp','companies'],['mentorUserId','Giảng viên','mentors']];
 const context=[{key:'student',title:'Sinh viên',render:r=>r.student?.name||'Chưa có thông tin'},{key:'context',title:'Kỳ / doanh nghiệp / giảng viên',render:r=><><strong>{r.batch?.name}</strong><p>{r.company?.companyName||r.company?.name}</p><p>Giảng viên: {r.mentor?.name||'Chưa phân công'}</p><p>{r.assignment?.topicSnapshot?.title}</p></>}];
 const columns=mode==='time'?[...context,{key:'times',title:'Giờ vào / ra',render:r=><>{dateLabel(r.checkInAt)}<p>{r.checkOutAt?dateLabel(r.checkOutAt):'Chưa kết thúc ca'}</p></>},{key:'minutes',title:'Số phút',render:r=>r.minutes??'Chưa tính'},{key:'state',title:'Trạng thái',render:r=><Status value={r.state}/>}]:[...context,{key:'title',title:mode==='logs'?'Nhật ký':'Công việc',render:r=><><strong>{r.title}</strong>{mode==='logs'&&<><p>Tuần {r.weekNumber}</p><p className="business-content">{r.tasksDone}</p><p>{r.mentorFeedback}</p></>}</>},{key:'status',title:'Trạng thái',render:r=><Status value={r.status}/>},...(mode==='tasks'?[{key:'progress',title:'Tiến độ đã xác nhận',render:r=>r.confirmedProgress==null?'Chưa xác nhận':`${r.confirmedProgress}%`},{key:'dueDate',title:'Hạn hoàn thành',render:r=>dateLabel(r.dueDate)}]:[])];
 return <div className="business-stack"><Panel title={time?'Thống kê chấm công':'Giám sát công việc & nhật ký'} description="Tra cứu trong phạm vi quản lý của nhà trường.">
 {!time&&<div className="business-actions">{[['tasks','Công việc'],['logs','Nhật ký']].map(([value,label])=><button key={value} type="button" className="btn btn-secondary" aria-pressed={mode===value} onClick={()=>{setKind(value);setFilters({...filters,status:'',q:''});setPage(1);setDetail(null);}}>{label}</button>)}</div>}
 <ErrorNotice message={options.error}/><div className="business-grid">{people.map(([key,label,source])=><Select key={key} label={label} value={filters[key]} onChange={value=>change(key,value)} options={[{value:'',label:'Tất cả'},...(options.data?.[source]||[]).map(x=>({value:x._id,label:x.name}))]}/>)}
 <Select label="Trạng thái giám sát" value={validStatus} onChange={value=>change('status',value)} options={[{value:'',label:'Tất cả'},...states[mode].map(([value,label])=>({value,label}))]}/>{!time&&<Text label="Tìm công việc hoặc nhật ký" value={filters.q} onChange={value=>change('q',value)}/>}</div>
 <SupervisionStudentFinder filters={filters} selected={student} onSelect={value=>{setStudent(value);setFilters({...filters,studentUserId:value?._id||'',assignmentId:''});setPage(1);setDetail(null);}} onAssignment={value=>change('assignmentId',value)}/>
 </Panel><Panel title={time?'Tổng hợp phiên giờ làm':mode==='tasks'?'Danh sách công việc':'Danh sách nhật ký'}><Resource state={data}><div className="business-grid"><p>Số bản ghi: <strong>{data.data?.total??0}</strong></p>{time?<p>Tổng giờ đã duyệt: <strong>{((data.data?.summary.approvedMinutes||0)/60).toFixed(2)} giờ</strong></p>:mode==='tasks'&&<p>Tiến độ trung bình đã xác nhận: <strong>{data.data?.summary.confirmedProgress==null?'Chưa có dữ liệu':`${data.data.summary.confirmedProgress.toFixed(1)}%`}</strong></p>}</div><Rows empty={student?(mode==='logs'?'Sinh viên này chưa có nhật ký trong phạm vi bộ lọc':mode==='time'?'Sinh viên này chưa có phiên chấm công trong phạm vi bộ lọc':'Sinh viên này chưa có công việc trong phạm vi bộ lọc'):'Không có dữ liệu phù hợp bộ lọc hiện tại; hãy thử bỏ bớt điều kiện'} items={data.data?.items} columns={[...columns,{key:'details',title:'Chi tiết',render:r=><button type="button" className="btn btn-secondary" onClick={()=>setDetail(r)}>Xem chi tiết</button>}]}/><Pager data={data.data} page={page} onPage={setPage}/></Resource></Panel>
 {detail&&<Dialog label="Chi tiết giám sát" onClose={()=>setDetail(null)}><div className="modal-content"><h2>{detail.title||'Phiên giờ làm'}</h2><p>{detail.student?.name} · {detail.batch?.name}</p><p>{detail.company?.companyName||detail.company?.name} · Giảng viên: {detail.mentor?.name||'Chưa phân công'}</p>{(time?['reason']:mode==='logs'?['requirement','tasksDone','challenges','nextPlan','mentorFeedback']:['description']).map((key,i)=><div key={key}><h3>{(time?['Ghi chú']:mode==='logs'?['Yêu cầu','Công việc đã làm','Khó khăn','Kế hoạch tiếp theo','Nhận xét']:['Nội dung công việc'])[i]}</h3><p className="business-content">{detail[key]||'Chưa có nội dung'}</p></div>)}{mode==='tasks'&&!time&&<TaskSubmission data={detail}/>}<button type="button" className="btn btn-secondary" onClick={()=>setDetail(null)}>Đóng</button></div></Dialog>}
 </div>;
}

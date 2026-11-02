import { displayLabel } from './content';
import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, ServerTable, Text, Area, Select, ActionForm, MutationDialog, History, Status, AssignmentPicker } from './Shared';
import { active, dateLabel,localInput,asIso } from './hooks';

export default function WorkPage({user}) {
  const [assignment,setAssignment]=useState(null),[tab,setTab]=useState('tasks'),[revision,setRevision]=useState(0),[modal,setModal]=useState(null);
  const selected=assignment?`?assignmentId=${assignment._id}`:'',isActive=active(assignment),manage=['company','mentor'].includes(user.role),saved=()=>{setModal(null);setRevision(n=>n+1);};
  return <div className="business-stack"><Panel title="Công việc / nhật ký theo kỳ" description="Theo dõi công việc và nhật ký thực tập."><AssignmentPicker value={assignment} onChange={a=>{setAssignment(a);setRevision(n=>n+1);}} /><div className="business-actions"><button className="btn btn-secondary" aria-pressed={tab==='tasks'} onClick={()=>setTab('tasks')}>Công việc</button><button className="btn btn-secondary" aria-pressed={tab==='logs'} onClick={()=>setTab('logs')}>Nhật ký theo kỳ</button></div></Panel>
    <Panel title={tab==='tasks'?'Công việc được giao':'Nhật ký tuần'} actions={tab==='tasks'&&manage?<button className="btn btn-primary" disabled={!isActive} onClick={()=>setModal({type:'task'})}>Giao công việc</button>:tab==='logs'&&user.role==='student'?<button className="btn btn-primary" disabled={!isActive} onClick={()=>setModal({type:'log'})}>Nộp nhật ký theo kỳ</button>:null}>
      {tab==='tasks'?<ServerTable key={`tasks-${assignment?._id||'all'}`} path={'/core/tasks'+selected} revision={revision} label="Công việc" columns={[
        {key:'title',title:'Công việc',render:r=><div><strong>{r.title}</strong><p className="business-content">{r.description}</p><History entries={r.history} /></div>},{key:'dueDate',title:'Hạn hoàn thành',render:r=>dateLabel(r.dueDate)},{key:'priority',title:'Ưu tiên',render:r=>displayLabel(r.priority)},{key:'progress',title:'Tiến độ',render:r=><span>{r.progress}% · <Status value={r.status} /></span>},
        {key:'actions',title:'Thao tác',render:r=>['student','company','mentor'].includes(user.role)?<button className="btn btn-secondary" onClick={()=>setModal({type:'task',data:r})}>Cập nhật công việc</button>:<span>Chỉ xem</span>},
      ]} />:<ServerTable key={`logs-${assignment?._id||'all'}`} path={'/core/worklogs'+selected} revision={revision} label="Nhật ký theo kỳ" columns={[
        {key:'title',title:'Nội dung',render:r=><div><strong>Tuần{r.weekNumber}: {r.title}</strong><p className="business-content">{r.tasksDone}</p><details><summary>Khó khăn / kế hoạch</summary><p>{r.challenges||'Không cung cấp'}</p><p>{r.nextPlan||'Không cung cấp'}</p></details><History entries={r.history} /></div>},
        {key:'status',title:'Trạng thái / nhận xét',render:r=><><Status value={r.status} /><p>{r.mentorFeedback||'Chưa có nhận xét'}</p></>},
        {key:'actions',title:'Thao tác',render:r=>user.role==='student'?<button className="btn btn-secondary" disabled={r.status==='approved'} onClick={()=>setModal({type:'log',data:r})}>Sửa nhật ký</button>:manage?<button className="btn btn-secondary" disabled={r.status!=='submitted'} onClick={()=>setModal({type:'reviewLog',data:r})}>Duyệt nhật ký</button>:<span>Chỉ xem</span>},
      ]} />}
    </Panel>{modal&&<MutationDialog title={modal.type==='task'?'Công việc':modal.type==='log'?'Nhật ký theo kỳ':'Duyệt nhật ký theo kỳ'} onClose={()=>setModal(null)}>
      {modal.type==='task'?<TaskForm user={user} data={modal.data} assignment={assignment} onSaved={saved} />:modal.type==='log'?<LogForm data={modal.data} assignment={assignment} onSaved={saved} />:<LogReview data={modal.data} onSaved={saved} />}
    </MutationDialog>}
  </div>;
}
function TaskForm({data,assignment,user,onSaved}) {
  const [form,setForm]=useState({title:data?.title||'',description:data?.description||'',priority:data?.priority||'medium',dueDate:localInput(data?.dueDate),status:data?.status||'todo',progress:data?.progress??0}),set=(k,v)=>setForm(f=>({...f,[k]:v})),student=user.role==='student';
  return <ActionForm submit={data?'Lưu công việc':'Giao công việc'} onSaved={onSaved} onSubmit={()=>{
    const info={title:form.title,description:form.description,priority:form.priority,dueDate:asIso(form.dueDate)};
    return apiRequest('/core/tasks'+(data?'/'+data._id:''),{method:data?'PATCH':'POST',body:data?{...(student?{}:info),status:form.status,progress:Number(form.progress),version:data.__v}:{...info,assignmentId:assignment._id}});
  }}>
    {!student&&<><Text label="Tên công việc" required value={form.title} onChange={v=>set('title',v)} /><Area label="Mô tả công việc" value={form.description} onChange={v=>set('description',v)} /><div className="business-grid"><Select label="Mức độ ưu tiên" value={form.priority} onChange={v=>set('priority',v)} options={['low','medium','high','urgent'].map(value=>({value,label:displayLabel(value)}))} /><Text label="Hạn hoàn thành (giờ thiết bị)" required type="datetime-local" value={form.dueDate} onChange={v=>set('dueDate',v)} /></div></>}
    {data&&<div className="business-grid"><Select label="Trạng thái công việc" value={form.status} onChange={v=>setForm(f=>({...f,status:v,progress:v==='done'?100:f.progress===100?99:f.progress}))} options={['todo','in_progress','review','done'].map(value=>({value,label:displayLabel(value)}))} /><Text label="Tiến độ (%)" type="number" required min="0" max="100" value={form.progress} onChange={v=>set('progress',v)} /></div>}
    <p className="muted">Hoàn thành khi tiến độ đạt 100%. Chỉ người giao được sửa tên và hạn công việc.</p>
  </ActionForm>;
}
function LogForm({data,assignment,onSaved}) {
  const [form,setForm]=useState({weekNumber:data?.weekNumber||1,title:data?.title||'',tasksDone:data?.tasksDone||'',challenges:data?.challenges||'',nextPlan:data?.nextPlan||''}),set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <ActionForm submit="Lưu nhật ký theo kỳ" onSaved={onSaved} onSubmit={()=>apiRequest('/core/worklogs'+(data?'/'+data._id:''),{method:data?'PATCH':'POST',body:{title:form.title,tasksDone:form.tasksDone,challenges:form.challenges,nextPlan:form.nextPlan,...(data?{version:data.__v}:{assignmentId:assignment._id,weekNumber:Number(form.weekNumber)})}})}>
    {!data&&<Text label="Tuần nhật ký theo kỳ" required type="number" min="1" max="104" value={form.weekNumber} onChange={v=>set('weekNumber',v)} />}<Text label="Tiêu đề nhật ký theo kỳ" required value={form.title} onChange={v=>set('title',v)} /><Area label="Công việc đã làm theo kỳ" required value={form.tasksDone} onChange={v=>set('tasksDone',v)} /><Area label="Khó khăn theo kỳ" value={form.challenges} onChange={v=>set('challenges',v)} /><Area label="Kế hoạch tiếp theo" value={form.nextPlan} onChange={v=>set('nextPlan',v)} />
  </ActionForm>;
}
function LogReview({data,onSaved}) {
  const [status,setStatus]=useState('approved'),[feedback,setFeedback]=useState('');return <ActionForm submit="Lưu đánh giá nhật ký" onSaved={onSaved} onSubmit={()=>apiRequest('/core/worklogs/'+data._id+'/review',{method:'PATCH',body:{status,mentorFeedback:feedback,version:data.__v}})}><Select label="Kết quả nhật ký" value={status} onChange={setStatus} options={[{value:'approved',label:'Duyệt'},{value:'need_revision',label:'Yêu cầu chỉnh sửa'}]} /><Area label="Nhận xét nhật ký theo kỳ" required value={feedback} onChange={setFeedback} /></ActionForm>;
}

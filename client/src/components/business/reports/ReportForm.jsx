import { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../../../api/client';
import { loadReportTasks, reportDraftFromTask } from '../../../api/reportTasks';
import { displayLabel } from '../content';
import { ActionForm, Select, Text, Area, ErrorNotice } from '../Shared';
import ReportSelfAssessment from './ReportSelfAssessment';
export default function ReportForm({ assignment, onSaved,fixedKind,previous }) {
  const creationKey=useRef(crypto.randomUUID());
  const [selfGrading,setSelfGrading]=useState(null);
  const [kind, setKind] = useState(fixedKind||'weekly'),
    [title, setTitle] = useState(previous?.title||''),
    [content, setContent] = useState(previous?.content||''),[weekNumber,setWeekNumber]=useState(String(previous?.weekNumber||1)),[selfAssessment,setSelfAssessment]=useState(previous?.selfAssessment||'');
  const [weekly,setWeekly]=useState({work:'',results:'',challenges:'',support:'',plan:''});
  const weeklyFields=[['work','Công việc đã làm'],['results','Kết quả đạt được'],['challenges','Khó khăn gặp phải'],['support','Phần cần doanh nghiệp hỗ trợ'],['plan','Kế hoạch tiếp theo']];
  const [tasks, setTasks] = useState({ loading: true, items: [], error: '' }),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState(''),[linkedTasks,setLinkedTasks]=useState(previous?.taskIds||[]),
    [lastFill, setLastFill] = useState(null),
    [needsFill, setNeedsFill] = useState(false);
  useEffect(() => {
    let current = true;
    loadReportTasks(assignment._id)
      .then((items) => {
        if (current) setTasks({ loading: false, items, error: '' });
      })
      .catch((error) => {
        if (current) setTasks({ loading: false, items: [], error: error.message });
      });
    return () => {
      current = false;
    };
  }, [assignment._id, retry]);
  const fill = (task) => {
    const draft = reportDraftFromTask(task);
    setTitle(draft.title);
    setContent(draft.content);
    if(fixedKind==='weekly')setWeekly(s=>({...s,work:task.title,results:draft.content}));
    setLastFill(draft);
    setNeedsFill(false);
  };
  const chooseTask = (id) => {
    setSelected(id);
    if(id)setLinkedTasks(items=>items.includes(id)?items:[...items,id]);
    setNeedsFill(false);
    const task = tasks.items.find((t) => t._id === id);
    if (!task) return;
    if (
      (!title && !content) ||
      (lastFill && title === lastFill.title && content === lastFill.content)
    )
      fill(task);
    else setNeedsFill(true);
  };
  return (
    <ActionForm
      submit={previous?'Nộp bổ sung':'Nộp phiên bản báo cáo'}
      onSaved={onSaved}
      onSubmit={async() => {
        const created=await apiRequest('/core/reports', {
          method: 'POST',
          headers:{'Idempotency-Key':creationKey.current},
          body: { assignmentId: assignment._id,...(previous?{previousReportId:previous._id,previousVersion:previous.__v}:{}),...((fixedKind||kind)==='weekly'?{weekNumber:Number(weekNumber),taskIds:linkedTasks}:linkedTasks.length?{taskIds:linkedTasks}:{}),selfAssessment,...(selfGrading?.scores?.length?{selfGrading}:{}), kind:fixedKind||kind, title, content:fixedKind==='weekly'&&!previous?weeklyFields.map(([key,label])=>label+'\n'+weekly[key].trim()).join('\n\n'):content },
        });
        if((fixedKind||kind)==='final'){try{await apiRequest('/core/ai/reports/'+created._id+'/analyze',{method:'POST',body:{engine:'sbert',reportSource:'submitted'}});}catch{/* The submitted report remains saved; its detail view offers a retry. */}}
        return created;
      }}
    >
      {previous&&<p>Đang bổ sung phiên bản {previous.version}. Nội dung và tệp của lần nộp trước được giữ nguyên; tệp mới được đính kèm vào phiên bản mới qua phần Lưu trữ báo cáo hiện có.</p>}
      {!fixedKind&&<Select
        label="Loại báo cáo"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'weekly', label: 'Báo cáo tuần' },
          { value: 'final', label: 'Báo cáo cuối kỳ' },
        ]}
      />}
      {(fixedKind||kind)==='weekly'&&<Text label="Tuần báo cáo" type="number" min="1" max="104" step="1" required value={weekNumber} onChange={setWeekNumber}/>}
      <Select
        label="Chọn công việc đã làm / đã nộp"
        value={selected}
        onChange={chooseTask}
        options={[
          {
            value: '',
            label: tasks.loading ? 'Đang tải công việc…' : 'Tự nhập báo cáo / chọn công việc',
          },
          ...tasks.items.map((task) => ({
            value: task._id,
            label: `${task.title} · ${displayLabel(task.status)}${
              task.submission?.submittedAt ? ' · Đã nộp bài' : ''
            }`,
          })),
        ]}
      />
      {!!tasks.items.length&&<fieldset className="business-field"><legend>Công việc liên quan trong báo cáo (có thể chọn nhiều)</legend>{tasks.items.map(task=><label key={task._id}><input type="checkbox" checked={linkedTasks.includes(task._id)} onChange={e=>setLinkedTasks(items=>e.target.checked?[...items,task._id]:items.filter(id=>id!==task._id))}/>{' '}{task.title}</label>)}</fieldset>}
      <ErrorNotice message={tasks.error} />
      {tasks.error && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setTasks({ loading: true, items: [], error: '' });
            setRetry((n) => n + 1);
          }}
        >
          Tải lại danh sách công việc
        </button>
      )}
      {!tasks.loading && !tasks.error && !tasks.items.length && (
        <p className="muted">
          Chưa có công việc hoàn thành hoặc đã nộp trong phân công này. Bạn vẫn có thể tự nhập báo
          cáo bên dưới.
        </p>
      )}
      {needsFill && (
        <div>
          <p>
            Báo cáo đang có nội dung bạn nhập. Bấm nút bên dưới nếu muốn thay bằng nội dung công
            việc đã chọn.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fill(tasks.items.find((t) => t._id === selected))}
          >
            Điền từ công việc đã chọn
          </button>
        </div>
      )}
      <p className="muted">
        Chọn công việc để điền tên và kết quả đã nộp; bạn có thể chỉnh sửa trước khi gửi. Tệp gốc
        vẫn được xem ở Công việc & nhật ký.
      </p>
      <Text
        label="Tiêu đề báo cáo theo kỳ"
        required
        maxLength={200}
        value={title}
        onChange={setTitle}
      />
      <Area label="Tự đánh giá và phần cần hỗ trợ" maxLength={5000} value={selfAssessment} onChange={setSelfAssessment}/>
      {(fixedKind||kind)==='final'&&<ReportSelfAssessment batchId={assignment.batchId||previous?.batchId} value={selfGrading} onChange={setSelfGrading}/>}
      {fixedKind==='weekly'&&!previous?weeklyFields.map(([key,label])=><Area key={key} label={label} required={key!=='support'} maxLength={8000} value={weekly[key]} onChange={value=>setWeekly(s=>({...s,[key]:value}))}/>):<Area
        label="Nội dung báo cáo theo kỳ"
        required
        maxLength={50000}
        value={content}
        onChange={setContent}
      />}
    </ActionForm>
  );
}

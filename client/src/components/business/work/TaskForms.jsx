import {definitionState,definitionBody} from './taskCriteria.mjs';
import { useState, useRef } from 'react';
import { apiRequest } from '../../../api/client';
import { displayLabel } from '../content';
import { active, dateLabel, localInput, asIso } from '../hooks';
import { Text, Area, Select, ActionForm, AssignmentPicker, Field } from '../Shared';
import AssignmentNotice from './AssignmentNotice';
import {CriteriaFields,TaskCriteriaReview} from './TaskAssessment';
export function TaskForm({ data, assignment, user, onAssignment, onSaved, batchId='' }) {
  const [criteria,setCriteria]=useState(()=>definitionState(data));
  const creationKey=useRef(crypto.randomUUID());
  const [startDate,setStartDate]=useState(localInput(data?.startDate||assignment?.startDate));
  const [form, setForm] = useState({
      title: data?.title || '',
      description: data?.description || '',
      priority: data?.priority || 'medium',
      dueDate: localInput(data?.dueDate),
      status: data?.status || 'todo',
      progress: data?.progress ?? 0,
    }),
    set = (k, v) => setForm((f) => ({ ...f, [k]: v })),
    student = user.role === 'student';
  return (
    <ActionForm
      submit={data ? 'Lưu công việc' : 'Giao công việc'}
      disabled={!data && !active(assignment)}
      onSaved={onSaved}
      onSubmit={() => {
        const info = {
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: asIso(form.dueDate),
        };
        return apiRequest('/core/tasks' + (data ? '/' + data._id : ''), {
          method: data ? 'PATCH' : 'POST',
          headers:data?{}:{'Idempotency-Key':creationKey.current},
          body: data
            ? {
                ...(student ? {} : info),
                version: data.__v,
              }
            : { ...info,...definitionBody(criteria),startDate:asIso(startDate), assignmentId: assignment._id },
        });
      }}
    >
      {!data && (
        <>
          <AssignmentPicker userRole={user.role} value={assignment} onChange={onAssignment} batchId={batchId} includeAdmissions={Boolean(batchId)}/>
          <AssignmentNotice assignment={assignment} />
          {assignment && (
            <p>
              Giao cho:{' '}
              <strong>
                {assignment.participantNames?.student ||
                  assignment.studentWallet ||
                  'Sinh viên theo phân công'}
              </strong>
            </p>
          )}
        </>
      )}
      {!student && (
        <>
          <Text
            label="Tên công việc"
            required
            value={form.title}
            onChange={(v) => set('title', v)}
          />
          <Area
            label="Mô tả công việc"
            value={form.description}
            onChange={(v) => set('description', v)}
          />
          <div className="business-grid">
            <Select
              label="Mức độ ưu tiên"
              value={form.priority}
              onChange={(v) => set('priority', v)}
              options={['low', 'medium', 'high', 'urgent'].map((value) => ({
                value,
                label: displayLabel(value),
              }))}
            />
            <Text
              label="Hạn hoàn thành (giờ thiết bị)"
              required
              type="datetime-local"
              value={form.dueDate}
              onChange={(v) => set('dueDate', v)}
            />
          </div>
        </>
      )}
      {!data&&<><Text label="Ngày bắt đầu công việc" type="datetime-local" required value={startDate} onChange={setStartDate}/><CriteriaFields value={criteria} onChange={setCriteria}/></>}
      <p className="muted">Tiến độ được tính từ các tiêu chí đã được doanh nghiệp xác nhận; nộp bài không tự xác nhận hoàn thành.</p>
    </ActionForm>
  );
}
export function TaskSubmitForm({ data, onSaved }) {
  const [content, setContent] = useState(data.draft?.content ?? data.submission?.content ?? ''),
    [link, setLink] = useState(data.draft?.link ?? data.submission?.link ?? ''),
    [file, setFile] = useState(null),[result,setResult]=useState(data.draft?.result??data.submission?.result??''),[challenges,setChallenges]=useState(data.draft?.challenges??data.submission?.challenges??''),[solution,setSolution]=useState(data.draft?.solution??data.submission?.solution??''),[draftBusy,setDraftBusy]=useState(false),[draftError,setDraftError]=useState('');
  const pending=useRef(false);
  return (
    <ActionForm
      submit={data.submission?.submittedAt ? 'Nộp lại công việc' : 'Nộp công việc'}
      onSaved={onSaved}
      disabled={draftBusy||!data.criteriaApprovedAt}
      onSubmit={async () => {
        if(pending.current)throw new Error('Đang lưu bài nộp.');
        if (!content.trim() && !link.trim() && !file)
          throw new Error('Cần nội dung, liên kết hoặc tệp kết quả.');
        if (file && file.size > 5 * 1024 * 1024) throw new Error('Tệp không được vượt quá 5 MiB.');
        const body = new FormData();
        body.set('content', content);
        body.set('link', link);body.set('result',result);body.set('challenges',challenges);body.set('solution',solution);
        body.set('version', String(data.__v));
        if (file) {
          body.set('fileName', file.name);
          body.set('file', file);
        }
        pending.current=true;try{return await apiRequest('/core/tasks/' + data._id + '/submit', { method: 'POST', body });}finally{pending.current=false;}
      }}
    >
      <strong>{data.title}</strong>
      {!data.criteriaApprovedAt&&<p>Doanh nghiệp cần bổ sung và xác nhận tiêu chí trước khi nộp bài. Bạn vẫn có thể lưu nháp.</p>}
      <button type="button" className="btn btn-secondary" disabled={draftBusy} onClick={async()=>{if(pending.current)return;pending.current=true;setDraftBusy(true);setDraftError('');try{await apiRequest('/core/tasks/'+data._id+'/draft',{method:'PUT',body:{version:data.__v,content,result,challenges,solution,link}});onSaved({draftSaved:true});}catch(e){setDraftError(e.message);}finally{pending.current=false;setDraftBusy(false);}}}>{draftBusy?'Đang lưu nháp…':'Lưu bản nháp'}</button>
      {draftError&&<p role="alert" className="is-error">{draftError}</p>}
      <p>Tệp đính kèm được lưu khi gửi bài nộp, không lưu cùng bản nháp.</p>
      <p>Hạn hoàn thành: {dateLabel(data.dueDate)}</p>
      <p className="muted">
        Có thể nộp trước hạn. Sau deadline, bài nộp được đánh dấu nộp muộn; phân công phải còn đang
        thực tập.
      </p>
      <Area
        label="Nội dung kết quả công việc"
        required
        maxLength={40000}
        value={content}
        onChange={setContent}
      />
      <Area label="Kết quả đạt được" required maxLength={15000} value={result} onChange={setResult}/>
      <Area label="Khó khăn gặp phải" required maxLength={10000} value={challenges} onChange={setChallenges}/>
      <Area label="Giải pháp đã áp dụng" required maxLength={10000} value={solution} onChange={setSolution}/>
      <Text
        label="Liên kết kết quả (GitHub, Drive…)"
        type="url"
        maxLength={2000}
        value={link}
        onChange={setLink}
      />
      <Field label="Tệp kết quả (tối đa 5 MiB)">
        <input
          className="input-field"
          type="file"
          aria-label="Tệp kết quả công việc"
          accept=".pdf,.docx,.zip,.txt,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Field>
      {data.submission?.fileName && (
        <small>Nếu nộp lại, hãy chọn lại tệp để đính kèm vào bài mới.</small>
      )}
      <p className="muted">
        Hỗ trợ PDF, DOCX, ZIP, TXT, PNG, JPG. Bài nộp được lưu riêng tư cho sinh viên và người phụ
        trách.
      </p>
    </ActionForm>
  );
}
export function TaskReviewForm(props){return <TaskCriteriaReview {...props}/>;}

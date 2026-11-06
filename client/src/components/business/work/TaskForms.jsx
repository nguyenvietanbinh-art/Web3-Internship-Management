import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { displayLabel } from '../content';
import { active, dateLabel, localInput, asIso } from '../hooks';
import { Text, Area, Select, ActionForm, AssignmentPicker, Field } from '../Shared';
import AssignmentNotice from './AssignmentNotice';
import { TaskSubmission } from './TaskSubmission';
export function TaskForm({ data, assignment, user, onAssignment, onSaved, batchId='' }) {
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
          body: data
            ? {
                ...(student ? {} : info),
                status: form.status,
                progress: Number(form.progress),
                version: data.__v,
              }
            : { ...info, assignmentId: assignment._id },
        });
      }}
    >
      {!data && (
        <>
          <AssignmentPicker value={assignment} onChange={onAssignment} batchId={batchId} includeAdmissions={Boolean(batchId)}/>
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
      {data && (
        <div className="business-grid">
          <Select
            label="Trạng thái công việc"
            value={form.status}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                status: v,
                progress: v === 'done' ? 100 : f.progress === 100 ? 99 : f.progress,
              }))
            }
            options={(student
              ? ['todo', 'in_progress']
              : ['todo', 'in_progress', 'review', 'done']
            ).map((value) => ({ value, label: displayLabel(value) }))}
          />
          <Text
            label="Tiến độ (%)"
            type="number"
            required
            min="0"
            max={student ? 99 : 100}
            value={form.progress}
            onChange={(v) => set('progress', v)}
          />
        </div>
      )}
      <p className="muted">
        Sinh viên dùng Nộp công việc để gửi kết quả ở mức 100% và chờ duyệt. Deadline phải nằm trong
        thời gian phân công.
      </p>
    </ActionForm>
  );
}
export function TaskSubmitForm({ data, onSaved }) {
  const [content, setContent] = useState(data.submission?.content || ''),
    [link, setLink] = useState(data.submission?.link || ''),
    [file, setFile] = useState(null);
  return (
    <ActionForm
      submit={data.submission?.submittedAt ? 'Nộp lại công việc' : 'Nộp công việc'}
      onSaved={onSaved}
      onSubmit={() => {
        if (!content.trim() && !link.trim() && !file)
          throw new Error('Cần nội dung, liên kết hoặc tệp kết quả.');
        if (file && file.size > 5 * 1024 * 1024) throw new Error('Tệp không được vượt quá 5 MiB.');
        const body = new FormData();
        body.set('content', content);
        body.set('link', link);
        body.set('version', String(data.__v));
        if (file) {
          body.set('fileName', file.name);
          body.set('file', file);
        }
        return apiRequest('/core/tasks/' + data._id + '/submit', { method: 'POST', body });
      }}
    >
      <strong>{data.title}</strong>
      <p>Hạn hoàn thành: {dateLabel(data.dueDate)}</p>
      <p className="muted">
        Có thể nộp trước hạn. Sau deadline, bài nộp được đánh dấu nộp muộn; phân công phải còn đang
        thực tập.
      </p>
      <Area
        label="Nội dung kết quả công việc"
        maxLength={40000}
        value={content}
        onChange={setContent}
      />
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
export function TaskReviewForm({ data, onSaved }) {
  const [decision, setDecision] = useState('approved'),
    [comment, setComment] = useState('');
  return (
    <ActionForm
      submit="Lưu đánh giá công việc"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/tasks/' + data._id + '/review', {
          method: 'POST',
          body: { decision, comment, version: data.__v },
        })
      }
    >
      <strong>{data.title}</strong>
      <TaskSubmission data={data} />
      <Select
        label="Kết quả duyệt công việc"
        value={decision}
        onChange={setDecision}
        options={[
          { value: 'approved', label: 'Duyệt hoàn thành' },
          { value: 'need_revision', label: 'Yêu cầu làm lại' },
        ]}
      />
      <Area
        label="Nhận xét công việc"
        required
        maxLength={5000}
        value={comment}
        onChange={setComment}
      />
    </ActionForm>
  );
}

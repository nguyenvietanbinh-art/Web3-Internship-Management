import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { Text, Area, Select, ActionForm, AssignmentPicker } from '../Shared';
import { active, asIso, dateLabel, localInput } from '../hooks';
import { displayLabel } from '../content';
import AssignmentNotice from './AssignmentNotice';
export function LogAssignmentForm({user, data, assignment, onAssignment, onSaved, batchId='' }) {
  const [form, setForm] = useState({
    weekNumber: data?.weekNumber || 1,
    title: data?.title || '',
    requirement: data?.requirement || '',
    priority: data?.priority || 'medium',
    dueDate: localInput(data?.dueDate),
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <ActionForm
      submit={data ? 'Lưu yêu cầu theo tuần' : 'Giao yêu cầu theo tuần'}
      disabled={!data && !active(assignment)}
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest(data ? `/core/worklogs/${data._id}/assignment` : '/core/worklogs/assign', {
          method: data ? 'PATCH' : 'POST',
          body: {
            title: form.title,
            requirement: form.requirement,
            priority: form.priority,
            dueDate: asIso(form.dueDate),
            ...(data
              ? { version: data.__v }
              : { assignmentId: assignment._id, weekNumber: Number(form.weekNumber) }),
          },
        })
      }
    >
      {!data && (
        <>
          <AssignmentPicker userRole={user.role} value={assignment} onChange={onAssignment} batchId={batchId} includeAdmissions={Boolean(batchId)}/>
          <AssignmentNotice assignment={assignment} />
        </>
      )}
      <p>
        Sinh viên nộp kết quả ngay tại yêu cầu của tuần này trong tab Nhật ký theo kỳ. Hạn nộp phải
        nằm trong thời gian thực tập.
      </p>
      <Text
        label="Tuần giao công việc"
        type="number"
        min="1"
        max="104"
        required
        disabled={Boolean(data)}
        value={form.weekNumber}
        onChange={(v) => set('weekNumber', v)}
      />
      <Text
        label="Tiêu đề yêu cầu theo tuần"
        required
        maxLength={200}
        value={form.title}
        onChange={(v) => set('title', v)}
      />
      <Area
        label="Yêu cầu công việc theo tuần"
        required
        value={form.requirement}
        onChange={(v) => set('requirement', v)}
      />
      <Select
        label="Ưu tiên công việc theo tuần"
        value={form.priority}
        onChange={(v) => set('priority', v)}
        options={['low', 'medium', 'high', 'urgent'].map((value) => ({
          value,
          label: displayLabel(value),
        }))}
      />
      <Text
        label="Hạn nộp nhật ký (giờ thiết bị)"
        type="datetime-local"
        required
        value={form.dueDate}
        onChange={(v) => set('dueDate', v)}
      />
    </ActionForm>
  );
}
export function LogForm({ data, assignment, onSaved }) {
  const [form, setForm] = useState({
      weekNumber: data?.weekNumber || 1,
      title: data?.title || '',
      tasksDone: data?.tasksDone || '',
      challenges: data?.challenges || '',
      nextPlan: data?.nextPlan || '',
      resultLink: data?.resultLink || '',
    }),
    set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <ActionForm
      submit={data?.status==='need_revision'?'Nộp bổ sung':data?.requirement ? 'Nộp kết quả theo tuần' : 'Lưu nhật ký theo kỳ'}
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/worklogs' + (data ? '/' + data._id : ''), {
          method: data ? 'PATCH' : 'POST',
          body: {
            title: form.title,
            tasksDone: form.tasksDone,
            challenges: form.challenges,
            nextPlan: form.nextPlan,
            resultLink: form.resultLink,
            ...(data
              ? { version: data.__v }
              : { assignmentId: assignment._id, weekNumber: Number(form.weekNumber) }),
          },
        })
      }
    >
      {data?.status==='need_revision'&&<div role="note"><p>Yêu cầu bổ sung: {data.mentorFeedback}</p><p>Người yêu cầu: {data.history?.filter(e=>e.action==='worklog.reviewed').at(-1)?.actorRole==='company'?'Doanh nghiệp phụ trách':'Giảng viên phụ trách'} · {dateLabel(data.reviewedAt)}</p>{data.dueDate&&<p>Hạn nộp theo tuần: {dateLabel(data.dueDate)}</p>}</div>}
      {data?.requirement && (
        <div>
          <p>
            <strong>
              Tuần {data.weekNumber}: {data.title}
            </strong>
          </p>
          <p className="business-content">{data.requirement}</p>
          <p>
            Hạn nộp: {dateLabel(data.dueDate)} · Ưu tiên: {displayLabel(data.priority)}
          </p>
        </div>
      )}
      {!data && (
        <Text
          label="Tuần nhật ký theo kỳ"
          required
          type="number"
          min="1"
          max="104"
          value={form.weekNumber}
          onChange={(v) => set('weekNumber', v)}
        />
      )}
      <Text
        label="Tiêu đề nhật ký theo kỳ"
        required
        disabled={Boolean(data?.requirement)}
        value={form.title}
        onChange={(v) => set('title', v)}
      />
      <Area
        label="Công việc đã làm theo kỳ"
        required
        value={form.tasksDone}
        onChange={(v) => set('tasksDone', v)}
      />
      <Area
        label="Khó khăn theo kỳ"
        value={form.challenges}
        onChange={(v) => set('challenges', v)}
      />
      <Area label="Kế hoạch tiếp theo" value={form.nextPlan} onChange={(v) => set('nextPlan', v)} />
      <Text
        label="Liên kết kết quả theo tuần (GitHub, Drive…)"
        type="url"
        value={form.resultLink}
        onChange={(v) => set('resultLink', v)}
      />
    </ActionForm>
  );
}
export function LogReview({ data, onSaved }) {
  const [status, setStatus] = useState('approved'),
    [feedback, setFeedback] = useState('');
  return (
    <ActionForm
      submit="Lưu đánh giá nhật ký"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/worklogs/' + data._id + '/review', {
          method: 'PATCH',
          body: { status, mentorFeedback: feedback, version: data.__v },
        })
      }
    >
      <Select
        label="Kết quả nhật ký"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'approved', label: 'Duyệt' },
          { value: 'need_revision', label: 'Yêu cầu chỉnh sửa' },
        ]}
      />
      <Area label="Nhận xét nhật ký theo kỳ" required value={feedback} onChange={setFeedback} />
    </ActionForm>
  );
}

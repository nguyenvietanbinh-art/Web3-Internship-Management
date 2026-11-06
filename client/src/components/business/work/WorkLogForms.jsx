import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { Text, Area, Select, ActionForm } from '../Shared';
export function LogForm({ data, assignment, onSaved }) {
  const [form, setForm] = useState({
      weekNumber: data?.weekNumber || 1,
      title: data?.title || '',
      tasksDone: data?.tasksDone || '',
      challenges: data?.challenges || '',
      nextPlan: data?.nextPlan || '',
    }),
    set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <ActionForm
      submit="Lưu nhật ký theo kỳ"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/worklogs' + (data ? '/' + data._id : ''), {
          method: data ? 'PATCH' : 'POST',
          body: {
            title: form.title,
            tasksDone: form.tasksDone,
            challenges: form.challenges,
            nextPlan: form.nextPlan,
            ...(data
              ? { version: data.__v }
              : { assignmentId: assignment._id, weekNumber: Number(form.weekNumber) }),
          },
        })
      }
    >
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

import { useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client';
import { loadReportTasks, reportDraftFromTask } from '../../../api/reportTasks';
import { displayLabel } from '../content';
import { ActionForm, Select, Text, Area, ErrorNotice } from '../Shared';
export default function ReportForm({ assignment, onSaved }) {
  const [kind, setKind] = useState('weekly'),
    [title, setTitle] = useState(''),
    [content, setContent] = useState('');
  const [tasks, setTasks] = useState({ loading: true, items: [], error: '' }),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState(''),
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
    setLastFill(draft);
    setNeedsFill(false);
  };
  const chooseTask = (id) => {
    setSelected(id);
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
      submit="Nộp phiên bản báo cáo"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/reports', {
          method: 'POST',
          body: { assignmentId: assignment._id, kind, title, content },
        })
      }
    >
      <Select
        label="Loại báo cáo"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'weekly', label: 'Báo cáo tuần' },
          { value: 'final', label: 'Báo cáo cuối kỳ' },
        ]}
      />
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
      <Area
        label="Nội dung báo cáo theo kỳ"
        required
        maxLength={50000}
        value={content}
        onChange={setContent}
      />
    </ActionForm>
  );
}

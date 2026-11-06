import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { asIso, localInput, useResource } from '../hooks';
import {
  Panel,
  ServerTable,
  MutationDialog,
  Select,
  Area,
  Text,
  ActionForm,
  ErrorNotice,
} from '../Shared';

const labels = {
  submitted: 'Chờ nhà trường xử lý',
  processing: 'Đang phân công',
  placed: 'Đã phân công',
  rejected: 'Không được chấp thuận',
  withdrawn: 'Đã rút đăng ký',
};
const choices = (rows, label) => [
  { value: '', label: 'Chọn' },
  ...(rows || []).map((r) => ({ value: r._id, label: label(r) })),
];

function RegistrationForm({ batch, onSaved }) {
  const [type, setType] = useState('application'),
    [topic, setTopic] = useState(''),
    [message, setMessage] = useState('');
  const topics = useResource(`/core/batches/${batch._id}/opportunities`);
  return (
    <ActionForm
      submit="Gửi đăng ký theo kỳ"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/batch-registrations', {
          method: 'POST',
          body: {
            batchId: batch._id,
            requestType: type,
            topicId: type === 'application' ? topic : null,
            message,
          },
        })
      }
    >
      <p>
        Kỳ: <strong>{batch.name}</strong>. Nhà trường sẽ xét nguyện vọng và phân công doanh nghiệp,
        giảng viên.
      </p>
      <Select
        label="Hình thức đăng ký"
        value={type}
        onChange={setType}
        options={[
          { value: 'application', label: 'Ứng tuyển đề tài trong kỳ' },
          { value: 'assistance', label: 'Chưa tìm được nơi thực tập — nhờ nhà trường phân công' },
        ]}
      />
      {type === 'application' && (
        <>
          <ErrorNotice message={topics.error} />
          <Select
            label="Đề tài muốn ứng tuyển"
            required
            value={topic}
            onChange={setTopic}
            options={choices(
              topics.data?.items,
              (t) => `${t.title} · ${t.companyName || 'Doanh nghiệp'}`
            )}
          />
          {!topics.loading && !topics.error && !topics.data?.items?.length && (
            <p className="muted">
              Chưa có đề tài phù hợp thời gian của kỳ này. Bạn có thể chọn nhờ nhà trường phân công.
            </p>
          )}
          {topics.data?.items?.find((t) => t._id === topic)?.description && (
            <p>{topics.data.items.find((t) => t._id === topic).description}</p>
          )}
        </>
      )}
      <Area label="Nguyện vọng / thông tin bổ sung" value={message} onChange={setMessage} />
    </ActionForm>
  );
}
export function BatchRegistrationAction({ batch, onChanged }) {
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  if (batch.status !== 'open' || new Date(batch.endDate).getTime() <= now)
    return <span>Đã ngừng đăng ký</span>;
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Ứng tuyển / đăng ký
      </button>
      {open && (
        <MutationDialog title="Đăng ký thực tập theo kỳ" onClose={() => setOpen(false)}>
          <RegistrationForm
            batch={batch}
            onSaved={() => {
              setOpen(false);
              onChanged();
            }}
          />
        </MutationDialog>
      )}
    </>
  );
}
function AssignmentForm({ row, onSaved }) {
  const [topic, setTopic] = useState(row.topicId || ''),
    [mentor, setMentor] = useState(''),
    [reason, setReason] = useState('Phân công theo đăng ký của sinh viên');
  const [start, setStart] = useState(
      localInput(new Date(Math.ceil(new Date(row.batch?.startDate).getTime() / 60000) * 60000))
    ),
    [end, setEnd] = useState(localInput(row.batch?.endDate));
  const topics = useResource(`/core/batches/${row.batchId}/opportunities`),
    mentors = useResource('/core/directory?role=mentor&limit=100');
  return (
    <ActionForm
      submit="Xác nhận phân công"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest(`/core/batch-registrations/${row._id}/assign`, {
          method: 'POST',
          body: {
            topicId: topic,
            mentorUserId: mentor,
            startDate: asIso(start),
            endDate: asIso(end),
            reason,
            version: row.__v,
          },
        })
      }
    >
      <p>
        <strong>{row.student?.name}</strong> · {row.batch?.name}
      </p>
      <p>
        {row.requestType === 'assistance'
          ? 'Sinh viên cần nhà trường hỗ trợ tìm nơi thực tập.'
          : `Nguyện vọng: ${row.topic?.title || 'Đề tài không còn khả dụng'}`}
      </p>
      {row.message && <p>{row.message}</p>}
      <ErrorNotice message={topics.error || mentors.error} />
      <Select
        label="Đề tài / doanh nghiệp tiếp nhận"
        required
        value={topic}
        onChange={setTopic}
        options={choices(
          topics.data?.items,
          (t) => `${t.title} · ${t.companyName || 'Doanh nghiệp'}`
        )}
      />
      <Select
        label="Giảng viên phụ trách"
        required
        value={mentor}
        onChange={setMentor}
        options={choices(mentors.data?.items, (m) => m.name)}
      />
      <Text
        label="Ngày bắt đầu thực tập"
        type="datetime-local"
        required
        value={start}
        onChange={setStart}
      />
      <Text
        label="Ngày kết thúc thực tập"
        type="datetime-local"
        required
        value={end}
        onChange={setEnd}
      />
      <Area label="Lý do phân công" required value={reason} onChange={setReason} />
      <p className="muted">
        Phân công được nhà trường phê duyệt ngay. Doanh nghiệp bắt đầu thực tập khi đến thời gian đã
        chọn.
      </p>
    </ActionForm>
  );
}
function DecisionForm({ row, admin, onSaved }) {
  const [reason, setReason] = useState('');
  return (
    <ActionForm
      submit={admin ? 'Không chấp thuận đăng ký' : 'Rút đăng ký'}
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest(`/core/batch-registrations/${row._id}`, {
          method: 'PATCH',
          body: { status: admin ? 'rejected' : 'withdrawn', reason, version: row.__v },
        })
      }
    >
      <Area label="Lý do" required value={reason} onChange={setReason} />
    </ActionForm>
  );
}
export function BatchRegistrationsPanel({ user, revision, onChanged }) {
  const [modal, setModal] = useState(null),
    admin = user.role === 'admin';
  const saved = () => {
    setModal(null);
    onChanged();
  };
  return (
    <Panel
      title={admin ? 'Đăng ký thực tập của sinh viên' : 'Đăng ký thực tập của tôi'}
      description={
        admin
          ? 'Tiếp nhận ứng tuyển và yêu cầu hỗ trợ; có thể đổi đề tài khi phân công.'
          : 'Theo dõi kết quả xét nguyện vọng và phân công của nhà trường.'
      }
    >
      <ServerTable
        path="/core/batch-registrations"
        revision={revision}
        label="Đăng ký thực tập"
        search={false}
        columns={[
          ...(admin
            ? [
                {
                  key: 'student',
                  title: 'Sinh viên',
                  render: (r) => (
                    <>
                      {r.student?.name}
                      <br />
                      <small>{r.student?.email}</small>
                    </>
                  ),
                },
              ]
            : []),
          { key: 'batch', title: 'Kỳ thực tập', render: (r) => r.batch?.name || '—' },
          {
            key: 'request',
            title: 'Nguyện vọng',
            render: (r) => (
              <>
                {r.requestType === 'assistance'
                  ? 'Nhờ nhà trường phân công'
                  : r.topic?.title || 'Ứng tuyển đề tài'}
                <p>{r.message}</p>
              </>
            ),
          },
          {
            key: 'status',
            title: 'Trạng thái',
            render: (r) => (
              <>
                {labels[r.status] || r.status}
                {r.reason && <p>{r.reason}</p>}
              </>
            ),
          },
          {
            key: 'actions',
            title: 'Thao tác',
            render: (r) =>
              r.status === 'submitted' ? (
                <div className="business-actions">
                  {admin && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setModal({ row: r, assign: true })}
                    >
                      Phân công sinh viên
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModal({ row: r, assign: false })}
                  >
                    {admin ? 'Không chấp thuận' : 'Rút đăng ký'}
                  </button>
                </div>
              ) : (
                <span>Chỉ xem</span>
              ),
          },
        ]}
      />
      {modal && (
        <MutationDialog
          title={modal.assign ? 'Phân công từ đăng ký' : admin ? 'Xét đăng ký' : 'Rút đăng ký'}
          onClose={() => setModal(null)}
        >
          {modal.assign ? (
            <AssignmentForm row={modal.row} onSaved={saved} />
          ) : (
            <DecisionForm row={modal.row} admin={admin} onSaved={saved} />
          )}
        </MutationDialog>
      )}
    </Panel>
  );
}

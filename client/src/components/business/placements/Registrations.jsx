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
  submitted: 'Chờ xét',
  accepted: 'Doanh nghiệp đã nhận',
  rejected: 'Không chấp thuận',
  declined: 'Đã bỏ nguyện vọng',
  processing: 'Đang phân công',
  placed: 'Đã phân công',
  withdrawn: 'Đã rút đăng ký',
};
const options = (rows, label) => [
  { value: '', label: 'Chọn' },
  ...(rows || []).map((r) => ({ value: r._id, label: label(r) })),
];
function RegistrationForm({ batch, onSaved }) {
  const [type, setType] = useState('application'),
    [company, setCompany] = useState(''),
    [topic, setTopic] = useState(''),
    [message, setMessage] = useState('');
  const topics = useResource(`/core/batches/${batch._id}/opportunities`);
  const available = (topics.data?.items || []).filter((t) => String(t.companyUserId) === company);
  return (
    <ActionForm
      submit="Gửi đăng ký theo kỳ"
      disabled={
        topics.loading ||
        Boolean(topics.error) ||
        topics.data?.hasSelection ||
        (type === 'application' && (topics.data?.applicationCount || 0) >= 3) ||
        (type === 'assistance' && !topics.data?.assistanceAllowed)
      }
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
        Kỳ: <strong>{batch.name}</strong>. Mỗi sinh viên được ứng tuyển tối đa 3 đề tài trong một
        kỳ. Sau khi doanh nghiệp nhận, chọn 1 đề tài để nhà trường phân công giảng viên.
      </p>
      <p>
        Đã ứng tuyển: <strong>{topics.data?.applicationCount || 0}/3</strong>. Đề tài đã ứng tuyển
        hoặc đủ chỉ tiêu không hiện trong danh sách mới.
      </p>
      <ErrorNotice message={topics.error} />
      <Select
        label="Hình thức đăng ký"
        value={type}
        onChange={setType}
        options={[
          { value: 'application', label: 'Ứng tuyển đề tài trong kỳ' },
          ...(topics.data?.assistanceAllowed
            ? [{ value: 'assistance', label: 'Nhờ nhà trường hỗ trợ phân công' }]
            : []),
        ]}
      />
      {!topics.data?.assistanceAllowed && (
        <p className="muted">
          Hỗ trợ phân công mở từ 7 ngày trước ngày bắt đầu kỳ, hoặc khi kỳ đã bắt đầu.
        </p>
      )}
      {type === 'application' && (
        <>
          <Select
            label="Doanh nghiệp muốn ứng tuyển"
            required
            value={company}
            onChange={(v) => {
              setCompany(v);
              setTopic('');
            }}
            options={options(topics.data?.companies, (c) => c.companyName || c.name)}
          />
          <Select
            label="Đề tài muốn ứng tuyển"
            required
            value={topic}
            onChange={setTopic}
            options={options(
              available,
              (t) => `${t.title} · còn ${t.remainingSlots}/${t.maxSlots} chỗ`
            )}
          />
          {company && !available.length && !topics.loading && (
            <p>Doanh nghiệp này không còn đề tài phù hợp đang nhận ứng tuyển trong kỳ.</p>
          )}
          {available.find((t) => t._id === topic)?.description && (
            <p>{available.find((t) => t._id === topic).description}</p>
          )}
        </>
      )}
      <Area label="Nguyện vọng / thông tin bổ sung" value={message} onChange={setMessage} />
    </ActionForm>
  );
}
export function BatchRegistrationAction({ batch, onChanged }) {
  const [open, setOpen] = useState(false),
    [now] = useState(() => Date.now());
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
  const [topic, setTopic] = useState(row.selectedTopicId || ''),
    [company, setCompany] = useState(''),
    [mentor, setMentor] = useState(''),
    [reason, setReason] = useState('Phân công theo đăng ký của sinh viên');
  const [start, setStart] = useState(
      localInput(new Date(Math.ceil(new Date(row.batch.startDate).getTime() / 60000) * 60000))
    ),
    [end, setEnd] = useState(localInput(row.batch.endDate));
  const topics = useResource(
      `/core/batches/${row.batchId}/opportunities?studentUserId=${row.studentUserId}`
    ),
    mentors = useResource('/core/directory?role=mentor&limit=100');
  const fixed = Boolean(row.selectedTopicId),
    selectedTopic = topics.data?.items?.find((t) => t._id === row.selectedTopicId);
  const companyId = fixed ? String(selectedTopic?.companyUserId || '') : company;
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
        {fixed
          ? 'Sinh viên đã chọn đề tài được doanh nghiệp nhận.'
          : 'Nhà trường hỗ trợ chọn doanh nghiệp và đề tài còn chỉ tiêu.'}
      </p>
      {row.message && <p>{row.message}</p>}
      <ErrorNotice message={topics.error || mentors.error} />
      <Select
        label="Doanh nghiệp tiếp nhận"
        required
        disabled={fixed}
        value={companyId}
        onChange={(v) => {
          setCompany(v);
          setTopic('');
        }}
        options={options(topics.data?.companies, (c) => c.companyName || c.name)}
      />
      <Select
        label="Đề tài / doanh nghiệp tiếp nhận"
        required
        disabled={fixed}
        value={topic}
        onChange={setTopic}
        options={options(
          (topics.data?.items || []).filter((t) => String(t.companyUserId) === companyId),
          (t) => t.title
        )}
      />
      <Select
        label="Giảng viên phụ trách"
        required
        value={mentor}
        onChange={setMentor}
        options={options(mentors.data?.items, (m) => m.name)}
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
        Nhà trường phê duyệt phân công; doanh nghiệp bắt đầu thực tập khi đến thời gian đã chọn.
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
function CompanyReview({ row, onSaved }) {
  const [topic, setTopic] = useState(''),
    [status, setStatus] = useState('accepted'),
    [reason, setReason] = useState('');
  return (
    <ActionForm
      submit="Lưu kết quả xét ứng tuyển"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest(`/core/batch-registrations/${row._id}/choices/${topic}`, {
          method: 'PATCH',
          body: { status, reason, version: row.__v },
        })
      }
    >
      <p>
        Sinh viên: {row.student?.name} · {row.student?.email}
      </p>
      <Select
        label="Đề tài cần xét ứng tuyển"
        required
        value={topic}
        onChange={setTopic}
        options={options(
          row.choices
            .filter((c) => c.status === 'submitted')
            .map((c) => ({ _id: c.topicId, title: c.topic?.title })),
          (t) => t.title
        )}
      />
      <Select
        label="Kết quả xét ứng tuyển"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'accepted', label: 'Chấp nhận' },
          { value: 'rejected', label: 'Không chấp nhận' },
        ]}
      />
      <Area label="Nhận xét kết quả ứng tuyển" required value={reason} onChange={setReason} />
    </ActionForm>
  );
}
export function BatchRegistrationsPanel({ user, revision, onChanged }) {
  const [modal, setModal] = useState(null),
    admin = user.role === 'admin',
    company = user.role === 'company';
  const saved = () => {
    setModal(null);
    onChanged();
  };
  return (
    <Panel
      title={
        admin
          ? 'Đăng ký thực tập của sinh viên'
          : company
          ? 'Ứng tuyển đề tài của doanh nghiệp'
          : 'Đăng ký thực tập của tôi'
      }
      description={
        company
          ? 'Xét các nguyện vọng của doanh nghiệp mình. Sinh viên chọn một đề tài đã được nhận, sau đó nhà trường phân công.'
          : 'Tối đa 3 nguyện vọng trong kỳ; chỉ chọn 1 đề tài đã được doanh nghiệp nhận.'
      }
    >
      <ServerTable
        path="/core/batch-registrations"
        revision={revision}
        label="Đăng ký thực tập"
        search={false}
        columns={[
          ...(admin || company
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
            title: 'Nguyện vọng / kết quả doanh nghiệp',
            render: (r) => (
              <>
                {r.requestType === 'assistance' && <p>Nhờ nhà trường phân công</p>}
                {r.choices?.map((c) => (
                  <div key={c.topicId}>
                    <strong>{c.topic?.title || 'Đề tài'}</strong>
                    <p>
                      {c.topic?.companyName} · {labels[c.status]}
                    </p>
                    {c.reason && <p>{c.reason}</p>}
                    {c.message && <p>{c.message}</p>}
                    {String(r.selectedTopicId) === String(c.topicId) && (
                      <p>
                        <strong>Đề tài đã chọn</strong>
                      </p>
                    )}
                    {user.role === 'student' &&
                      r.status === 'submitted' &&
                      !r.selectedTopicId &&
                      c.status === 'accepted' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setModal({ type: 'select', row: r, topicId: c.topicId })}
                        >
                          Chọn đề tài này
                        </button>
                      )}
                  </div>
                ))}
                {!r.choices?.length && <p>{r.message}</p>}
              </>
            ),
          },
          {
            key: 'status',
            title: 'Trạng thái',
            render: (r) => (
              <>
                {r.status === 'submitted' && r.selectedTopicId
                  ? 'Chờ nhà trường phân công'
                  : labels[r.status] || r.status}
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
                  {company ? (
                    !r.selectedTopicId &&
                    r.choices.some((c) => c.status === 'submitted') && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setModal({ type: 'review', row: r })}
                      >
                        Xét ứng tuyển đề tài
                      </button>
                    )
                  ) : (
                    <>
                      {admin && (r.selectedTopicId || r.assistanceAllowed) && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setModal({ type: 'assign', row: r })}
                        >
                          Phân công sinh viên
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setModal({ type: 'decision', row: r })}
                      >
                        {admin ? 'Không chấp thuận' : 'Rút đăng ký'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <span>Chỉ xem</span>
              ),
          },
        ]}
      />
      {modal && (
        <MutationDialog
          title={
            modal.type === 'assign'
              ? 'Phân công từ đăng ký'
              : modal.type === 'review'
              ? 'Xét ứng tuyển'
              : modal.type === 'select'
              ? 'Xác nhận chọn một đề tài'
              : 'Xử lý đăng ký'
          }
          onClose={() => setModal(null)}
        >
          {modal.type === 'assign' ? (
            <AssignmentForm row={modal.row} onSaved={saved} />
          ) : modal.type === 'review' ? (
            <CompanyReview row={modal.row} onSaved={saved} />
          ) : modal.type === 'select' ? (
            <ActionForm
              submit="Xác nhận chọn đề tài"
              onSaved={saved}
              onSubmit={() =>
                apiRequest(`/core/batch-registrations/${modal.row._id}/select`, {
                  method: 'PATCH',
                  body: { topicId: modal.topicId, version: modal.row.__v },
                })
              }
            >
              <p>
                Bạn chỉ chọn một đề tài. Các nguyện vọng còn lại sẽ được đóng và nhường chỉ tiêu cho
                sinh viên khác.
              </p>
            </ActionForm>
          ) : (
            <DecisionForm row={modal.row} admin={admin} onSaved={saved} />
          )}{' '}
        </MutationDialog>
      )}
    </Panel>
  );
}

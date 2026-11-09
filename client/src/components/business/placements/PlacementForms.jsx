import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { displayLabel } from '../content';
import { useResource, localInput, asIso, dateLabel } from '../hooks';
import { Text, Area, Select, ActionForm, ErrorNotice } from '../Shared';
export function BatchForm({ data, onSaved }) {
  const [form, setForm] = useState({
      code: data?.code || '',
      name: data?.name || '',
      startDate: localInput(data?.startDate),
      endDate: localInput(data?.endDate),
      status: data?.status || 'draft',
    }),
    set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <ActionForm
      submit="Lưu kỳ thực tập"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/batches' + (data ? '/' + data._id : ''), {
          method: data ? 'PATCH' : 'POST',
          body: data
            ? { name: form.name, status: form.status, version: data.__v }
            : { ...form, startDate: asIso(form.startDate), endDate: asIso(form.endDate) },
        })
      }
    >
      {!data && (
        <Text
          label="Mã kỳ thực tập"
          required
          pattern="[A-Z0-9_-]+"
          maxLength={32}
          value={form.code}
          onChange={(v) => set('code', v)}
        />
      )}
      <Text label="Tên kỳ thực tập" required value={form.name} onChange={(v) => set('name', v)} />
      {!data && (
        <div className="business-grid">
          <Text
            label="Bắt đầu kỳ (giờ máy)"
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(v) => set('startDate', v)}
          />
          <Text
            label="Kết thúc kỳ (giờ máy)"
            type="datetime-local"
            required
            value={form.endDate}
            onChange={(v) => set('endDate', v)}
          />
        </div>
      )}
      <Select
        label="Trạng thái kỳ"
        value={form.status}
        onChange={(v) => set('status', v)}
        options={[
          { value: 'draft', label: 'Bản nháp' },
          { value: 'open', label: 'Mở kỳ' },
          ...(data ? [{ value: 'closed', label: 'Đóng kỳ' }] : []),
        ]}
      />
    </ActionForm>
  );
}
export function PlacementForm({ user, onSaved, unified }) {
  if (unified) return <UnifiedPlacementForm user={user} onSaved={onSaved} />;
  return <LegacyPlacementForm user={user} onSaved={onSaved} />;
}
export function PlacementState({ data, user, onSaved }) {
  const transitions = {
    proposed: user.role === 'admin' ? ['approved', 'cancelled'] : ['cancelled'],
    approved: ['active', 'cancelled'],
    active: user.role === 'admin' ? ['completed', 'cancelled'] : ['cancelled'],
  };
  const choices = transitions[data.lifecycle] || [],
    [lifecycle, setLifecycle] = useState(choices[0] || ''),
    [reason, setReason] = useState('');
  return (
    <ActionForm
      submit="Xác nhận phân công"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/placements/' + data._id, {
          method: 'PATCH',
          body: { lifecycle, reason, version: data.__v },
        })
      }
    >
      <Select
        label="Trạng thái phân công mới"
        value={lifecycle}
        onChange={setLifecycle}
        options={choices.map((value) => ({ value, label: displayLabel(value) }))}
      />
      <Area label="Lý do phân công"  value={reason} onChange={setReason} />
      <p className="muted">
        Kết thúc cần báo cáo cuối kỳ đã được Nhà trường chốt và không còn phiên giờ làm chưa xử lý.
      </p>
    </ActionForm>
  );
}
export function PlacementDetails(props) {
  return props.unified ? (
    <UnifiedPlacementDetails {...props} />
  ) : (
    <LegacyPlacementDetails {...props} />
  );
}
function LegacyPlacementForm({ user, onSaved }) {
  const [form, setForm] = useState({
      batchId: '',
      topicId: '',
      studentWallet: '',
      mentorWallet: '',
      startDate: '',
      endDate: '',
    }),
    set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const batches = useResource('/core/batches?limit=100'),
    topics = useResource(
      '/topics' + (user.role === 'company' ? `?companyWallet=${user.walletAddress}` : '')
    );
  return (
    <ActionForm
      submit="Gửi đề xuất phân công"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/placements', {
          method: 'POST',
          body: {
            ...form,
            startDate: asIso(form.startDate),
            endDate: asIso(form.endDate),
          },
        })
      }
    >
      <ErrorNotice message={batches.error || topics.error} />
      <Select
        label="Kỳ thực tập của phân công"
        required
        value={form.batchId}
        onChange={(v) => set('batchId', v)}
        options={[
          { value: '', label: 'Chọn kỳ đang mở' },
          ...(batches.data?.items || [])
            .filter((b) => b.status === 'open')
            .map((b) => ({ value: b._id, label: b.name })),
        ]}
      />
      <Select
        label="Đề tài phân công"
        required
        value={form.topicId}
        onChange={(v) => set('topicId', v)}
        options={[
          { value: '', label: 'Chọn đề tài' },
          ...(topics.data || []).map((t) => ({ value: t._id, label: t.title })),
        ]}
      />
      <Text
        label="Ví sinh viên phân công"
        required
        pattern="0x[a-fA-F0-9]{40}"
        value={form.studentWallet}
        onChange={(v) => set('studentWallet', v)}
      />
      <Text
        label="Ví giảng viên phụ trách"
        required
        pattern="0x[a-fA-F0-9]{40}"
        value={form.mentorWallet}
        onChange={(v) => set('mentorWallet', v)}
      />
      <div className="business-grid">
        <Text
          label="Bắt đầu phân công (giờ máy)"
          type="datetime-local"
          required
          value={form.startDate}
          onChange={(v) => set('startDate', v)}
        />
        <Text
          label="Kết thúc phân công (giờ máy)"
          type="datetime-local"
          required
          value={form.endDate}
          onChange={(v) => set('endDate', v)}
        />
      </div>
      <p className="muted">
        Sinh viên phải có tài khoản ví và đã đăng nhập để tạo hồ sơ chuẩn hóa; giảng viên phải được
        Admin cấp. Thời gian nằm trong kỳ đã chọn.
      </p>
    </ActionForm>
  );
}
function UnifiedPlacementDetails({ data, onSaved }) {
  const [mentor, setMentor] = useState(data.mentorUserId || ''),
    [start, setStart] = useState(localInput(data.startDate)),
    [end, setEnd] = useState(localInput(data.endDate)),
    [reason, setReason] = useState('');
  const mentors = useResource('/core/directory?role=mentor&limit=100');
  const options = (mentors.data?.items || []).map((m) => ({ value: m._id, label: m.name }));
  if (mentor && !options.some((m) => m.value === mentor))
    options.unshift({
      value: mentor,
      label: data.participantNames?.mentor || 'Giảng viên hiện tại',
    });
  return (
    <ActionForm
      submit="Lưu giảng viên / ngày phân công"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/placements/' + data._id + '/details', {
          method: 'PATCH',
          body: {
            mentorUserId: mentor,
            startDate: asIso(start),
            endDate: asIso(end),
            reason,
            version: data.__v,
          },
        })
      }
    >
      <ErrorNotice message={mentors.error} />
      <Select
        label="Giảng viên phụ trách"
        required
        value={mentor}
        onChange={setMentor}
        options={[{ value: '', label: 'Chọn giảng viên' }, ...options]}
      />
      <div className="business-grid">
        <Text
          label="Ngày bắt đầu mới (giờ máy)"
          type="datetime-local"
          required
          value={start}
          onChange={setStart}
        />
        <Text
          label="Ngày kết thúc mới (giờ máy)"
          type="datetime-local"
          required
          value={end}
          onChange={setEnd}
        />
      </div>
      <Area label="Lý do sửa phân công"  value={reason} onChange={setReason} />
      <p className="muted">
        Ngày phân công phải nằm trong kỳ thực tập đang mở và bao gồm các hạn KPI. Nếu muốn bắt đầu
        ngay, chọn thời điểm bắt đầu không muộn hơn hiện tại.
      </p>
    </ActionForm>
  );
}
function LegacyPlacementDetails({ data, onSaved }) {
  const [mentor, setMentor] = useState(data.mentorWallet),
    [start, setStart] = useState(localInput(data.startDate)),
    [end, setEnd] = useState(localInput(data.endDate)),
    [reason, setReason] = useState('');
  return (
    <ActionForm
      submit="Lưu giảng viên / ngày phân công"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/placements/' + data._id + '/details', {
          method: 'PATCH',
          body: {
            mentorWallet: mentor,
            startDate: asIso(start),
            endDate: asIso(end),
            reason,
            version: data.__v,
          },
        })
      }
    >
      <Text
        label="Ví giảng viên thay đổi"
        required
        pattern="0x[a-fA-F0-9]{40}"
        value={mentor}
        onChange={setMentor}
      />
      <div className="business-grid">
        <Text
          label="Ngày bắt đầu mới (giờ máy)"
          type="datetime-local"
          required
          value={start}
          onChange={setStart}
        />
        <Text
          label="Ngày kết thúc mới (giờ máy)"
          type="datetime-local"
          required
          value={end}
          onChange={setEnd}
        />
      </div>
      <Area label="Lý do sửa phân công"  value={reason} onChange={setReason} />
    </ActionForm>
  );
}
function UnifiedPlacementForm({ user, onSaved }) {
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState({
      batchId: '',
      topicId: '',
      studentUserId: '',
      mentorUserId: '',
      startDate: '',
      endDate: '',
      ...(user.role === 'admin' ? { reason: 'Nhà trường phân công sinh viên' } : {}),
    }),
    set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const batches = useResource('/core/batches?limit=100'),
    topics = useResource(
      user.role === 'admin' && form.batchId && form.studentUserId
        ? `/core/batches/${form.batchId}/opportunities?studentUserId=${form.studentUserId}`
        : '/core/topics?limit=100'
    ),
    students = useResource('/core/directory?role=student&limit=100'),
    mentors = useResource('/core/directory?role=mentor&limit=100'),
    companies = useResource('/core/directory?role=company&limit=100');
  const choose = (label, key, state, filter = () => true) => (
    <Select
      label={label}
      required
      value={form[key]}
      onChange={(v) => set(key, v)}
      options={[
        { value: '', label: 'Chọn' },
        ...(state.data?.items || [])
          .filter(filter)
          .map((x) => ({ value: x._id, label: x.name || x.title })),
      ]}
    />
  );
  return (
    <ActionForm
      submit={user.role === 'admin' ? 'Xác nhận phân công' : 'Gửi đề xuất phân công'}
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/placements', {
          method: 'POST',
          body: {
            ...form,
            ...(user.role === 'admin' ? { approveImmediately: true } : {}),
            startDate: asIso(form.startDate),
            endDate: asIso(form.endDate),
          },
        })
      }
    >
      <ErrorNotice message={batches.error || topics.error || students.error || mentors.error} />
      {user.role === 'admin' && (
        <p>
          Nhà trường có thể phân công trực tiếp cho sinh viên chưa tìm được nơi thực tập. Phân công
          sẽ được phê duyệt ngay.
        </p>
      )}
      {choose('Kỳ thực tập', 'batchId', batches, (x) => x.status === 'open')}
      {batches.data?.items
        ?.filter((b) => b._id === form.batchId)
        .map((b) => (
          <p className="muted" key={b._id}>
            Thời gian của kỳ: {dateLabel(b.startDate)} → {dateLabel(b.endDate)}. Ngày phân công phải
            nằm trong khoảng này.
          </p>
        ))}
      {choose(
        user.role === 'admin' ? 'Sinh viên cần phân công' : 'Sinh viên đã chấp nhận',
        'studentUserId',
        students
      )}
      {user.role === 'admin' && (
        <Select
          label="Doanh nghiệp nhận phân công"
          required
          value={companyId}
          onChange={(value) => {
            setCompanyId(value);
            set('topicId', '');
          }}
          options={[
            { value: '', label: 'Chọn doanh nghiệp' },
            ...(companies.data?.items || []).map((c) => ({ value: c._id, label: c.name })),
          ]}
        />
      )}
      {choose('Đề tài thực tập', 'topicId', topics, (t) =>
        user.role !== 'admin'
          ? t.remainingSlots > 0
          : Boolean(form.batchId && form.studentUserId && String(t.companyUserId) === companyId)
      )}
      {topics.data?.items
        ?.filter((t) => t._id === form.topicId)
        .map((t) => (
          <div key={t._id}>
            <p>Thời gian phân công phải bao gồm tất cả hạn KPI của đề tài:</p>
            <ul>
              {t.kpis?.map((k) => (
                <li key={k._id || k.milestoneIndex}>
                  {k.title}: <strong>{dateLabel(k.deadline)}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      {choose('Giảng viên phụ trách', 'mentorUserId', mentors)}
      <Text
        label="Ngày bắt đầu thực tập"
        type="datetime-local"
        required
        value={form.startDate}
        onChange={(v) => set('startDate', v)}
      />
      <Text
        label="Ngày kết thúc thực tập"
        type="datetime-local"
        required
        value={form.endDate}
        onChange={(v) => set('endDate', v)}
      />
      {user.role === 'admin' && (
        <Area
          label="Lý do phân công"

          value={form.reason}
          onChange={(v) => set('reason', v)}
        />
      )}
    </ActionForm>
  );
}
export function PlacementDialog({ modal, user, unified, onSaved }) {
  switch (modal.type) {
    case 'batch':
      return <BatchForm data={modal.data} onSaved={onSaved} />;
    case 'placement':
      return <PlacementForm user={user} unified={unified} onSaved={onSaved} />;
    case 'details':
      return <PlacementDetails data={modal.data} unified={unified} onSaved={onSaved} />;
    default:
      return <PlacementState data={modal.data} user={user} onSaved={onSaved} />;
  }
}

import { useState } from 'react';
import { confirmLeave } from '../../viewStateStore';
import { apiRequest } from '../../../api/client';
import { dateLabel, localInput, asIso } from '../hooks';
import { Panel, ServerTable, Text, Area, ActionForm, MutationDialog } from '../Shared';
export function TopicsPanel({ user, revision = 0, createdTopic = null, onChanged }) {
  const [modal, setModal] = useState(null),
    [message, setMessage] = useState('');
  const saved = () => {
    setMessage(
      modal.type === 'delete' ? 'Đã xóa đề tài thành công.' : 'Đã cập nhật đề tài thành công.'
    );
    setModal(null);
    onChanged?.();
  };
  return (
    <Panel
      title="Danh sách đề tài thực tập"
      description="Các đề tài đã lưu, bao gồm đề tài chưa được phân công cho sinh viên."
    >
      {createdTopic && <p role="status">Đã tạo đề tài “{createdTopic.title}” thành công.</p>}
      {message && !createdTopic && <p role="status">{message}</p>}
      <ServerTable
        path="/core/topics"
        revision={revision}
        label="Đề tài thực tập"
        search={false}
        columns={[
          { key: 'title', title: 'Tên đề tài', render: (r) => <strong>{r.title}</strong> },
          { key: 'company', title: 'Doanh nghiệp', render: (r) => r.companyName },
          {
            key: 'capacity',
            title: 'Chỉ tiêu ứng tuyển',
            render: (r) => (
              <>
                {r.applicantCount || 0}/{r.maxSlots || 1} · còn {r.remainingSlots || 0} chỗ
              </>
            ),
          },
          {
            key: 'description',
            title: 'Mô tả',
            render: (r) => <p className="business-content">{r.description}</p>,
          },
          {
            key: 'kpis',
            title: 'Tiêu chí KPI',
            render: (r) => (
              <div>
                {r.kpis?.map((k, i) => (
                  <div key={k._id || i}>
                    <strong>
                      {k.title} · {k.weightPercent}%
                    </strong>
                    <p className="business-content">{k.description}</p>
                    <small>Hạn KPI: {dateLabel(k.deadline)}</small>
                  </div>
                ))}
              </div>
            ),
          },
          { key: 'createdAt', title: 'Ngày tạo', render: (r) => dateLabel(r.createdAt) },
          ...(user?.role === 'company'
            ? [
                {
                  key: 'actions',
                  title: 'Thao tác',
                  render: (r) => {
                    const locked =
                      r.hasAssignments ||
                      r.status !== 'open' ||
                      r.assignedCount > 0 ||
                      r.assignedStudentWallet ||
                      r.onChainId != null;
                    return (
                      <div>
                        <div className="business-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => setModal({ type: 'capacity', data: r })}
                          >
                            Chỉ tiêu
                          </button>
                          <button
                            className="btn btn-secondary"
                            disabled={!!locked}
                            onClick={() => {
                              setMessage('');
                              setModal({ type: 'edit', data: r });
                            }}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            className="btn btn-secondary"
                            disabled={!!locked}
                            onClick={() => {
                              setMessage('');
                              setModal({ type: 'delete', data: r });
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                        {locked && <small>Đề tài đã có phân công hoặc bằng chứng liên quan.</small>}
                      </div>
                    );
                  },
                },
              ]
            : []),
        ]}
      />
      {modal && (
        <MutationDialog
          title={modal.type === 'delete' ? 'Xác nhận xóa đề tài' : 'Chỉnh sửa đề tài'}
          onClose={() => setModal(null)}
        >
          {modal.type === 'capacity' ? (
            <CapacityForm data={modal.data} onSaved={saved} />
          ) : modal.type === 'edit' ? (
            <TopicEditForm data={modal.data} onSaved={saved} />
          ) : (
            <ActionForm
              submit="Xác nhận xóa đề tài"
              onSaved={saved}
              onSubmit={() =>
                apiRequest('/core/topics/' + modal.data._id, {
                  method: 'DELETE',
                  body: { version: modal.data.__v },
                })
              }
            >
              <p>Bạn muốn xóa đề tài “{modal.data.title}”? Thao tác này không thể hoàn tác.</p>
            </ActionForm>
          )}
          <button className="btn btn-secondary" onClick={() => setModal(null)}>
            Hủy
          </button>
        </MutationDialog>
      )}
    </Panel>
  );
}
function TopicEditForm({ data, onSaved }) {
  const [title, setTitle] = useState(data.title),
    [description, setDescription] = useState(data.description),
    [kpis, setKpis] = useState(
      data.kpis.map((k) => ({
        title: k.title,
        description: k.description,
        weightPercent: k.weightPercent,
        deadline: localInput(k.deadline),
      }))
    );
  const setKpi = (index, key, value) =>
    setKpis((items) => items.map((k, i) => (i === index ? { ...k, [key]: value } : k)));
  return (
    <ActionForm
      submit="Lưu chỉnh sửa đề tài"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/topics/' + data._id, {
          method: 'PATCH',
          body: {
            title,
            description,
            version: data.__v,
            kpis: kpis.map((k) => ({
              ...k,
              weightPercent: Number(k.weightPercent),
              deadline: asIso(k.deadline),
            })),
          },
        })
      }
    >
      <Text label="Tên đề tài" required maxLength={200} value={title} onChange={setTitle} />
      <Area label="Mô tả đề tài" required value={description} onChange={setDescription} />
      {kpis.map((k, i) => (
        <fieldset key={i}>
          <legend>Tiêu chí KPI {i + 1}</legend>
          <Text
            label={`Tên KPI ${i + 1}`}
            required
            maxLength={200}
            value={k.title}
            onChange={(v) => setKpi(i, 'title', v)}
          />
          <Area
            label={`Yêu cầu KPI ${i + 1}`}
            required
            maxLength={2000}
            value={k.description}
            onChange={(v) => setKpi(i, 'description', v)}
          />
          <Text
            label={`Trọng số KPI ${i + 1} (%)`}
            required
            type="number"
            min={1}
            max={100}
            step={1}
            value={k.weightPercent}
            onChange={(v) => setKpi(i, 'weightPercent', v)}
          />
          <Text
            label={`Hạn KPI ${i + 1}`}
            required
            type="datetime-local"
            value={k.deadline}
            onChange={(v) => setKpi(i, 'deadline', v)}
          />
        </fieldset>
      ))}
      <p className="muted">Tổng trọng số KPI phải bằng 100%.</p>
    </ActionForm>
  );
}
export function TopicCreator({ onSaved, endpoint="/core/topics" }) {
  const emptyForm = {
    title: '',
    description: '',
    requiredSkills: '',
    kpi: '',
    criteria: '',
    deadline: '',
    maxSlots: 3,
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm),
    set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const close = () => { setOpen(false); setForm(emptyForm); };
  return (
    <><div className="business-actions"><button type="button" className="btn btn-primary" onClick={()=>setOpen(true)}>Tạo đề tài</button></div>
    {open&&<MutationDialog title="Tạo đề tài thực tập" onClose={close}>
      <ActionForm
        submit="Tạo đề tài thực tập"
        onSaved={async (topic) => {
          await onSaved(topic);
          setForm(emptyForm);
          setOpen(false);
        }}
        onSubmit={() =>
          apiRequest(endpoint, {
            method: 'POST',
            body: {
              title: form.title,
              description: form.description,
              requiredSkills: form.requiredSkills.split(',').map(s=>s.trim()).filter(Boolean),
              maxSlots: Number(form.maxSlots),
              kpis: [
                {
                  title: form.kpi,
                  description: form.criteria,
                  weightPercent: 100,
                  deadline: asIso(form.deadline),
                },
              ],
            },
          })
        }
      >
        <Text
          label="Số lượng nhận ứng tuyển"
          type="number"
          required
          min="1"
          max="1000"
          value={form.maxSlots}
          onChange={(v) => set('maxSlots', v)}
        />
        <Text label="Tên đề tài" required value={form.title} onChange={(v) => set('title', v)} />
        <Text label="Kỹ năng yêu cầu (cách nhau bằng dấu phẩy)" value={form.requiredSkills} onChange={v=>set('requiredSkills',v)} hint="Ví dụ: JavaScript, Node.js, MongoDB. Dùng để đối chiếu với CV sinh viên."/>
        <p className="muted">Nêu mục tiêu, nhiệm vụ, kỹ năng bắt buộc/ưu tiên, cách phối hợp, trách nhiệm và đúng hạn, lịch thực tập và kết quả mong đợi. Phẩm chất tự khai báo cần được trao đổi và xác minh thêm.</p>
        <Area
          label="Mô tả đề tài"
          required
          value={form.description}
          onChange={(v) => set('description', v)}
        />
        <Text label="Tiêu chí KPI" required value={form.kpi} onChange={(v) => set('kpi', v)} />
        <Area
          label="Yêu cầu hoàn thành KPI"
          required
          value={form.criteria}
          onChange={(v) => set('criteria', v)}
        />
        <Text
          label="Hạn KPI"
          type="datetime-local"
          required
          value={form.deadline}
          onChange={(v) => set('deadline', v)}
        />
        <button type="button" className="btn btn-secondary" onClick={()=>{if(confirmLeave())close();}}>Hủy</button>
      </ActionForm>
    </MutationDialog>}</>
  );
}
function CapacityForm({ data, onSaved }) {
  const [maxSlots, setMaxSlots] = useState(data.maxSlots || 1);
  return (
    <ActionForm
      submit="Lưu chỉ tiêu ứng tuyển"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest(`/core/topics/${data._id}/capacity`, {
          method: 'PATCH',
          body: { maxSlots: Number(maxSlots), version: data.__v },
        })
      }
    >
      <p>
        {data.title} · đang giữ {data.applicantCount || 0} chỗ. Không thể giảm dưới số chỗ đã giữ.
      </p>
      <Text
        label="Chỉ tiêu ứng tuyển của đề tài"
        type="number"
        min={Math.max(1, data.applicantCount || 0)}
        max="1000"
        required
        value={maxSlots}
        onChange={setMaxSlots}
      />
    </ActionForm>
  );
}

import { useState } from 'react';
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
          {modal.type === 'edit' ? (
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
export function TopicCreator({ onSaved }) {
  const emptyForm = { title: '', description: '', kpi: '', criteria: '', deadline: '' };
  const [form, setForm] = useState(emptyForm),
    set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  return (
    <Panel title="Đề tài và tiêu chí thực tập" description="Xác định đề tài và tiêu chí đánh giá.">
      <ActionForm
        submit="Tạo đề tài thực tập"
        onSaved={async (topic) => {
          await onSaved(topic);
          setForm(emptyForm);
        }}
        onSubmit={() =>
          apiRequest('/core/topics', {
            method: 'POST',
            body: {
              title: form.title,
              description: form.description,
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
        <Text label="Tên đề tài" required value={form.title} onChange={(v) => set('title', v)} />
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
      </ActionForm>
    </Panel>
  );
}

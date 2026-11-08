import { useEffect, useState, useRef } from 'react';
import {useViewState,confirmLeave} from '../viewStateStore';
import { apiRequest } from '../../api/client';
import { EmptyState, LoadingSkeleton, Dialog } from '../ui';
import { useResource, shortWallet, dateLabel } from './hooks';
import { completeAction } from '../../api/formAction';
import { displayLabel } from './content';
import {historyContent} from './historyContent';
import AdminStudentPicker from './AdminStudentPicker';

export function Panel({ title, children, description, actions }) {
  return (
    <section className="glass-panel business-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="business-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Text({ label, value, onChange, type = 'text', required = false, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="input-field"
        aria-label={label}
        type={type}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </Field>
  );
}
export function Area({ label, value, onChange, required = false, ...props }) {
  return (
    <Field label={label}>
      <textarea
        className="input-field"
        aria-label={label}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        {...props}
      />
    </Field>
  );
}
export function Select({ label, value, onChange, options, required = false, disabled = false }) {
  return (
    <Field label={label}>
      <select
        className="input-field"
        aria-label={label}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function ErrorNotice({ message }) {
  return message ? (
    <div className="inline-alert is-error" role="alert">
      {message}
    </div>
  ) : null;
}
export function ActionForm({
  onSubmit,
  children,
  submit = 'Lưu thay đổi',
  onSaved,
  disabled = false,
}) {
  const formRef=useRef(null);
  useEffect(()=>{const guard=e=>{if(formRef.current?.dataset.unsaved==='true'){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="business-form" ref={formRef} onChange={e=>{if(e.currentTarget.querySelector('textarea,input[type=password],input[type=file]'))e.currentTarget.dataset.unsaved='true';}}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || disabled) return;
        setBusy(true);
        setError('');
        try {
          await completeAction(onSubmit, result=>{if(formRef.current)formRef.current.dataset.unsaved='false';return onSaved?.(result);});
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <ErrorNotice message={error} />
      <button className="btn btn-primary" disabled={busy || disabled} type="submit">
        {busy ? 'Đang xử lý…' : submit}
      </button>
    </form>
  );
}
export function MutationDialog({ title, onClose, children }) {
  return (
    <Dialog label={title} onClose={()=>{if(confirmLeave())onClose();}}>
      <div className="modal-content">
        <h2>{title}</h2>
        {children}
      </div>
    </Dialog>
  );
}
export function History({ entries = [] }) {
  return (
    <details className="history-details">
      <summary>Lịch sử ({entries.length})</summary>
      <ol>
        {entries.map((entry, i) => (
          <li key={entry._id || i}>
            <strong>{historyContent(entry).title}</strong> · {dateLabel(entry.at)}
            {entry.actorRole&&<p>{displayLabel(entry.actorRole)}</p>}
            {historyContent(entry).details.map((text,j)=><p key={j} className="business-content">{text}</p>)}
          </li>
        ))}
      </ol>
    </details>
  );
}
export function Status({ value, label }) {
  return (
    <span
      data-status={value}
      className={`badge ${
        ['approved', 'completed', 'accepted', 'done', 'active', 'confirmed'].includes(value)
          ? 'badge-approved'
          : ['rejected', 'cancelled', 'failed', 'incorrect'].includes(value)
          ? 'badge-rejected'
          : 'badge-pending'
      }`}
    >
      {label ?? displayLabel(value)}
    </span>
  );
}

export function ServerTable({
  path,
  columns,
  revision = 0,
  label,
  search = true,
  emptyTitle = 'Không tìm thấy kết quả',
  emptyDescription,
}) {
  const [page, setPage] = useViewState(`table:${path}:page`,1),
    [query, setQuery] = useViewState(`table:${path}:query`,''),
    [draft, setDraft] = useState(query),
    [retry, setRetry] = useState(0);
  const url = `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=10${
    query ? `&q=${encodeURIComponent(query)}` : ''
  }`;
  const state = useResource(url, `${revision}-${retry}`);
  useEffect(()=>{if(state.data&&page>state.data.pages)setPage(Math.max(1,state.data.pages));},[state.data,page,setPage]);
  return (
    <section className="server-table" aria-label={label}>
      {search && (
        <form
          className="table-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(draft);
          }}
        >
          <input
            className="input-field"
            aria-label={`Tìm ${label}`}
            placeholder="Nhập từ khóa…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-secondary">Tìm kiếm</button>
        </form>
      )}
      {state.loading ? (
        <LoadingSkeleton rows={2} />
      ) : state.error ? (
        <EmptyState
          error
          title="Không tải được dữ liệu"
          action={
            <button className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
              Thử lại
            </button>
          }
        >
          {state.error}
        </EmptyState>
      ) : (
        <>
          <div className="table-scroll" role="region" tabIndex={0} aria-label={label}>
            <table>
              <caption className="sr-only">{label}</caption>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th scope="col" key={c.key}>
                      {c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((row) => (
                  <tr key={row._id || row.id} data-record-id={row._id||row.id}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
                {!state.data.items.length && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EmptyState title={emptyTitle}>{emptyDescription}</EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-pagination">
            <span aria-live="polite">
              {state.data.total} bản ghi · Trang {state.data.page}/{state.data.pages || 1}
            </span>
            <div>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= state.data.pages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
export function AssignmentPicker(props){return props.userRole!=='student'?<AdminStudentPicker {...props}/>:<ScopedAssignmentPicker {...props}/>;}
function ScopedAssignmentPicker({ value, onChange, revision = 0, batchId='', requireBatch=false, includeAdmissions=false, userRole='' }) {
  const [remembered,setRemembered]=useViewState('assignment:'+batchId,'');
  const [selectionNotice,setSelectionNotice]=useState('');
  const personal=userRole==='student';
    const company=userRole==='company',mentor=userRole==='mentor';
  const path=includeAdmissions&&batchId?'/core/work/students?limit=100&batchId='+encodeURIComponent(batchId):'/core/placements?limit=100'+(batchId?'&batchId='+encodeURIComponent(batchId):'');
  const state = useResource(requireBatch&&!batchId?null:path, revision);
  const items=(state.data?.items||[]).filter(a=>!batchId||a.batchId===batchId);
  useEffect(()=>{if(state.loading||!state.data||state.error||!remembered||value)return;let cancelled=false;queueMicrotask(()=>{if(cancelled)return;const found=state.data.items.find(a=>a._id===remembered);if(found)onChange(found);else{setRemembered('');setSelectionNotice('Hồ sơ đã chọn không còn trong phạm vi truy cập. Vui lòng chọn lại.');}});return()=>{cancelled=true;};},[state.data,state.loading,state.error,remembered,value,onChange,setRemembered]);
  return (
    <div>
      <ErrorNotice message={state.error} />{selectionNotice&&<p role="status">{selectionNotice}</p>}
      <Select
          label={personal?'Thông tin thực tập của tôi':company?'Sinh viên thực tập tại doanh nghiệp':mentor?'Sinh viên tôi phụ trách':'Phân công theo kỳ'}
        disabled={requireBatch&&!batchId}
        value={value?._id || ''}
        onChange={(id) => {setRemembered(id);setSelectionNotice('');onChange(items.find((a) => a._id === id) || null);}}
        options={[
            { value: '', label: requireBatch&&!batchId?'Chọn kỳ thực tập trước':state.loading ? 'Đang tải…' : personal?'Chọn đề tài thực tập của tôi':company?'Chọn sinh viên thực tập':mentor?'Chọn sinh viên phụ trách':'Chọn sinh viên / phân công' },
          ...items.map((a) => ({
            value: a._id,
            label: `${a.topic?.title || (personal?'Đề tài chưa có tên':a._id)}${personal?'':' · '+(a.participantNames?.student || shortWallet(a.studentWallet))} · ${a.pendingAssignment?'Đã tiếp nhận · Chờ nhà trường phân công':displayLabel(a.lifecycle)}`,
          })),
        ]}
      />
      <small className="muted">
          {personal?'Chỉ hiển thị thông tin thực tập của bạn đã được nhà trường phân công.':company?'Chỉ hiển thị sinh viên có phân công thực tập chính thức tại doanh nghiệp của bạn.':mentor?'Chỉ hiển thị sinh viên có phân công do bạn phụ trách.':'Hiển thị tối đa 100 sinh viên/phân công. Thời gian theo múi giờ thiết bị.'}
      </small>
      {personal&&!state.loading&&!state.error&&!items.length&&<p role="status" className="muted">Bạn chưa có phân công thực tập chính thức để xem bằng chứng hoặc chứng nhận.</p>}
        {(company||mentor)&&!(requireBatch&&!batchId)&&!state.loading&&!state.error&&!items.length&&<p role="status" className="muted">{company?'Chưa có sinh viên được phân công chính thức trong phạm vi đang xem. Sinh viên mới được tiếp nhận sẽ xuất hiện sau khi nhà trường hoàn tất phân công giảng viên.':'Chưa có sinh viên được phân công cho bạn trong phạm vi đang xem.'}</p>}
      {batchId&&!state.loading&&!state.error&&!items.length&&<p className="muted">Chưa có sinh viên được phân công chính thức cho bạn trong kỳ này. Nhà trường cần hoàn tất phân công và giảng viên trước khi doanh nghiệp giao công việc.</p>}
      {items.some(a=>a.pendingAssignment)&&<p className="muted">Có sinh viên đã được doanh nghiệp tiếp nhận, đang chờ nhà trường phân công chính thức. Chọn sinh viên để xem trạng thái.</p>}
    </div>
  );
}
export function SaveButton({ endpoint, method = 'PATCH', body, children, onSaved }) {
  return (
    <ActionForm
      onSubmit={() => apiRequest(endpoint, { method, body })}
      onSaved={onSaved}
      submit={children}
    />
  );
}

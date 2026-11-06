import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { EmptyState, LoadingSkeleton, Dialog } from '../ui';
import { useResource, shortWallet, dateLabel } from './hooks';
import { completeAction } from '../../api/formAction';
import { displayLabel } from './content';

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
export function Select({ label, value, onChange, options, required = false }) {
  return (
    <Field label={label}>
      <select
        className="input-field"
        aria-label={label}
        value={value}
        required={required}
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
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="business-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || disabled) return;
        setBusy(true);
        setError('');
        try {
          await completeAction(onSubmit, onSaved);
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
    <Dialog label={title} onClose={onClose}>
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
            <strong>{entry.action}</strong> · {dateLabel(entry.at)} ·{' '}
            {shortWallet(entry.actorWallet)}
            <pre>{JSON.stringify(entry.data, null, 2)}</pre>
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
  const [page, setPage] = useState(1),
    [query, setQuery] = useState(''),
    [draft, setDraft] = useState(''),
    [retry, setRetry] = useState(0);
  const url = `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=10${
    query ? `&q=${encodeURIComponent(query)}` : ''
  }`;
  const state = useResource(url, `${revision}-${retry}`);
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
                  <tr key={row._id || row.id}>
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
export function AssignmentPicker({ value, onChange, revision = 0 }) {
  const state = useResource('/core/placements?limit=100', revision);
  return (
    <div>
      <ErrorNotice message={state.error} />
      <Select
        label="Phân công theo kỳ"
        value={value?._id || ''}
        onChange={(id) => onChange(state.data?.items.find((a) => a._id === id) || null)}
        options={[
          { value: '', label: state.loading ? 'Đang tải phân công…' : 'Chọn phân công' },
          ...(state.data?.items || []).map((a) => ({
            value: a._id,
            label: `${a.topic?.title || a._id} · ${
              a.participantNames?.student || shortWallet(a.studentWallet)
            } · ${displayLabel(a.lifecycle)}`,
          })),
        ]}
      />
      <small className="muted">
        Hiển thị tối đa 100 phân công. Thời gian theo múi giờ thiết bị.
      </small>
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

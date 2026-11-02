import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Inbox, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

export function EmptyState({ title = 'Chưa có dữ liệu', children, error = false, action }) {
  const Icon = error ? AlertCircle : Inbox;
  return <div className={`empty-state ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
    <span className="empty-icon"><Icon size={24} /></span><h3>{title}</h3>
    {children && <p>{children}</p>}{action}
  </div>;
}

export function LoadingSkeleton({ label = 'Đang tải dữ liệu', rows = 3 }) {
  return <div className="skeleton-stack" role="status" aria-busy="true" aria-label={label}>
    <span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" />)}
  </div>;
}

export function PageHeader({ eyebrow = 'KHÔNG GIAN THỰC TẬP', title, description, children }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}

export function StatCard({ icon: Icon, title, value, description, tone = 'indigo', testId }) {
  return <article className="stat-card"><span className={`stat-icon tone-${tone}`}><Icon size={21} /></span>
    <p>{title}</p><strong data-testid={testId}>{value ?? '—'}</strong><small>{description}</small></article>;
}

// A single dialog primitive owns Escape, focus containment and focus restoration.
export function Dialog({ children, onClose, label = 'Hộp thoại' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const node = ref.current;
    const focusables = () => [...node.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
    (focusables()[0] || node).focus();
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.(); }
      if (event.key !== 'Tab') return;
      const elements = focusables(), first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); node.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', keyboard);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { node.removeEventListener('keydown', keyboard); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="dialog-root">
      {children}<button type="button" className="icon-button dialog-close" aria-label="Đóng hộp thoại" onClick={onClose}><X size={18} /></button>
    </div>
  </div>;
}

// Search and pagination apply only to the records supplied by the scoped API.
export function DataTable({ rows, columns, rowKey = '_id', searchText = row => JSON.stringify(row), filters = [], filterValue = () => '', label = 'Bảng dữ liệu' }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState(''), [page, setPage] = useState(1);
  const id = useId(), size = 6;
  const matched = rows.filter(row => searchText(row).toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) && (!filter || filterValue(row) === filter));
  const pages = Math.max(1, Math.ceil(matched.length / size)), current = Math.min(page, pages);
  return <section className="data-table" aria-label={label}>
    <div className="table-toolbar"><div className="search-field"><Search size={17} /><label className="sr-only" htmlFor={id}>Tìm trong {label}</label>
      <input id={id} value={query} placeholder="Tìm trong dữ liệu đã tải…" onChange={e => { setQuery(e.target.value); setPage(1); }} /></div>
      {filters.length > 0 && <select aria-label={`Lọc ${label}`} className="input-field table-filter" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select>}
    </div>
    <div className="table-scroll" tabIndex={0} role="region" aria-label={`${label}, cuộn ngang nếu cần`}><table><caption className="sr-only">{label} — tìm kiếm và phân trang trên dữ liệu đã tải</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col">{c.title}</th>)}</tr></thead><tbody>
      {matched.slice((current - 1) * size, current * size).map(row => <tr key={row[rowKey]}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}</tr>)}
      {!matched.length && <tr><td colSpan={columns.length}><EmptyState title={query || filter ? 'Không có kết quả phù hợp' : 'Chưa có bản ghi trong phạm vi của bạn'} /></td></tr>}
    </tbody></table></div>
    <div className="table-pagination"><span aria-live="polite">{matched.length} bản ghi đã tải · Trang {current}/{pages}</span><div><button className="icon-button" aria-label="Trang trước" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Trang sau" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button></div></div>
  </section>;
}

export function UnavailableView({ title }) {
  return <article className="glass-panel unavailable-panel"><span className="badge badge-pending">NOT IMPLEMENTED · PHASE 3+</span><EmptyState title={title}>Chức năng này chưa có luồng Backend hoàn chỉnh. Giao diện không tạo dữ liệu hoặc thông báo thành công thay thế.</EmptyState></article>;
}

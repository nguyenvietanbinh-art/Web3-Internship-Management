import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { useResource, dateLabel } from './hooks';
import { EmptyState, LoadingSkeleton } from '../ui';
import { ErrorNotice } from './Shared';

export default function Notifications() {
  const [revision,setRevision]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(''),state=useResource('/core/notifications?limit=100',revision);
  if(state.loading)return <LoadingSkeleton />;if(state.error)return <EmptyState error title="Không tải được thông báo">{state.error}</EmptyState>;
  return <div className="business-stack"><p aria-live="polite">{state.data.unread} chưa đọc / {state.data.total} thông báo</p><ErrorNotice message={error} />{!state.data.items.length&&<EmptyState title="Chưa có thông báo" />}
    {state.data.items.map(n=><article className="notification-item" key={n.id}><strong>{n.title}</strong><p>{n.message}</p><small>{dateLabel(n.at)}</small>{!n.read&&<button className="btn btn-secondary" disabled={Boolean(busy)} onClick={async()=>{setBusy(n.id);setError('');try{await apiRequest('/core/notifications/'+n.id+'/read',{method:'PATCH',body:{}});setRevision(v=>v+1);}catch(e){setError(e.message);}finally{setBusy('');}}}>Đánh dấu đã đọc</button>}</article>)}
    {state.data.total>100&&<p className="muted">Đang hiển thị100 thông báo mới nhất.</p>}
  </div>;
}

import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Dialog, EmptyState, LoadingSkeleton } from '../ui';
import { useResource } from './hooks';
import { roleNames } from '../navigation';
import { Panel, Text, Area, ActionForm } from './Shared';
export { default as CvPage } from './cv/CvPage';
export function ProfilePage({ user, onProfileSaved }) {
  const [revision, setRevision] = useState(0),
    [saved, setSaved] = useState(false),
    state = useResource(user.role==='admin'?null:'/core/profile', revision);
  if(user.role==='admin')return null;
  if (state.loading) return <LoadingSkeleton />;
  if (state.error)
    return (
      <EmptyState error title="Không tải được hồ sơ">
        {state.error}
      </EmptyState>
    );
  return (
    <Panel title={user.role==='company'?'Hồ sơ doanh nghiệp':'Hồ sơ cá nhân'} description={user.role==='company'?'Cập nhật thông tin và giới thiệu doanh nghiệp.':'Cập nhật thông tin cá nhân của bạn.'}>
      <p>Vai trò: {roleNames[user.role]}</p>
      {saved && (
        <p role="status" data-testid="profile-save-success">
          Đã lưu hồ sơ thành công.
        </p>
      )}
      <ProfileForm
        key={state.data.__v}
        data={state.data}
        user={user}
        onEdited={() => setSaved(false)}
        onSaved={() => {
          setSaved(true);
          setRevision((n) => n + 1);
          onProfileSaved?.();
        }}
      />
    </Panel>
  );
}
function ProfileForm({ data, user, onSaved, onEdited }) {
  const [form, setForm] = useState({ ...data, skillsText: data.skills.join(', ') }),
    set = (key, value) => {
      onEdited?.();
      setForm((current) => ({ ...current, [key]: value }));
    };
  return (
    <ActionForm
      submit="Lưu hồ sơ"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/profile', {
          method: 'PATCH',
          body: {
            name: form.name,
            bio: form.bio,
            ...(user.role==='student'?{skills:form.skillsText.split(',').map(s=>s.trim()).filter(Boolean)}:{}),
            ...(user.role === 'company' ? { companyName: form.companyName } : {}),
            version: data.__v,
          },
        })
      }
    >
      <div className="business-grid">
        <Text
          label="Họ tên / tên hiển thị"
          required
          maxLength={200}
          value={form.name}
          onChange={(v) => set('name', v)}
        />
        <Text
          label="Email"
          type="email"
          disabled
          value={form.email}
          onChange={(v) => set('email', v)}
        />
      </div>
      {user.role === 'company' && (
        <Text
          label="Tên doanh nghiệp"
          value={form.companyName}
          onChange={(v) => set('companyName', v)}
        />
      )}
      {user.role==='student'&&<Text
        label="Kỹ năng, cách nhau dấu phẩy"
        value={form.skillsText}
        onChange={(v) => set('skillsText', v)}
      />}
      <Area
        label={user.role==='company'?'Giới thiệu doanh nghiệp':'Giới thiệu bản thân'}
        maxLength={10000}
        value={form.bio}
        onChange={(v) => set('bio', v)}
      />
    </ActionForm>
  );
}

// Keep editing explicit: opening the overview never submits a profile update.
export function OverviewProfile({user,onProfileSaved}) {
  const [open,setOpen]=useState(false);
  if(!user||user.role==='admin')return null;
  return <section className="glass-panel business-panel" aria-label={user.role==='company'?'Thông tin doanh nghiệp':'Thông tin cá nhân'} style={{marginBottom:24}}>
    <div className="section-heading"><h2>{user.role==='company'?'Hồ sơ doanh nghiệp':'Hồ sơ cá nhân'}</h2><button type="button" className="btn btn-primary" onClick={()=>setOpen(true)}>Cập nhật hồ sơ</button></div>
    <dl className="business-grid" style={{marginTop:16,overflowWrap:'anywhere'}}>
      <div><dt><strong>{user.role==='company'?'Tên doanh nghiệp':'Họ và tên'}</strong></dt><dd>{user.role==='company'?(user.companyName||user.name):user.name}</dd></div>
      <div><dt><strong>Email</strong></dt><dd>{user.email||'Chưa bổ sung'}</dd></div>
      {user.role==='student'&&<div><dt><strong>Kỹ năng</strong></dt><dd>{user.skills?.length?user.skills.join(', '):'Chưa bổ sung'}</dd></div>}
      <div><dt><strong>{user.role==='company'?'Giới thiệu doanh nghiệp':'Giới thiệu bản thân'}</strong></dt><dd style={{whiteSpace:'pre-wrap'}}>{user.bio||'Chưa bổ sung'}</dd></div>
    </dl>
    {open&&<Dialog label="Cập nhật hồ sơ" onClose={()=>setOpen(false)}><ProfilePage user={user} onProfileSaved={()=>{setOpen(false);onProfileSaved?.();}}/></Dialog>}
  </section>;
}

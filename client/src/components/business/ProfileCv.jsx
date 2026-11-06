import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { EmptyState, LoadingSkeleton } from '../ui';
import { useResource } from './hooks';
import { Panel, Text, Area, ActionForm } from './Shared';
export { default as CvPage } from './cv/CvPage';
export function ProfilePage({ user, onProfileSaved }) {
  const [revision, setRevision] = useState(0),
    [saved, setSaved] = useState(false),
    state = useResource('/core/profile', revision);
  if (state.loading) return <LoadingSkeleton />;
  if (state.error)
    return (
      <EmptyState error title="Không tải được hồ sơ">
        {state.error}
      </EmptyState>
    );
  return (
    <Panel title="Hồ sơ cá nhân" description="Cập nhật thông tin cá nhân của bạn.">
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
            email: form.email,
            bio: form.bio,
            skills: form.skillsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
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
          hint="Email hồ sơ không thay đổi email đăng nhập và chưa được xác minh."
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
      <Text
        label="Kỹ năng, cách nhau dấu phẩy"
        value={form.skillsText}
        onChange={(v) => set('skillsText', v)}
      />
      <Area
        label="Giới thiệu bản thân"
        maxLength={10000}
        value={form.bio}
        onChange={(v) => set('bio', v)}
      />
    </ActionForm>
  );
}

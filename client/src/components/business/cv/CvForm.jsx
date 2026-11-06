import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { ActionForm, Text, Area } from '../Shared';
export default function CvForm({ data, onSaved }) {
  const [form, setForm] = useState({
      ...{
        title: '',
        summary: '',
        skills: [],
        education: '',
        experience: '',
        university: '',
        gpa: null,
      },
      ...data,
      skillsText: (data?.skills || []).join(', '),
    }),
    set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <ActionForm
      submit="Lưu CV"
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/cv', {
          method: 'PUT',
          body: Object.fromEntries(
            ['title', 'summary', 'skills', 'education', 'experience', 'university', 'gpa']
              .map((k) => [
                k,
                k === 'skills'
                  ? form.skillsText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : form[k],
              ])
              .concat([['version', data?.__v ?? null]])
          ),
        })
      }
    >
      <Text
        label="Tên CV"
        required
        maxLength={200}
        value={form.title}
        onChange={(v) => set('title', v)}
      />
      <Text
        label="Kỹ năng CV, cách nhau dấu phẩy"
        value={form.skillsText}
        onChange={(v) => set('skillsText', v)}
      />
      <Area label="Tóm tắt CV" value={form.summary} onChange={(v) => set('summary', v)} />
      <div className="business-grid">
        <Text
          label="Trường đại học"
          value={form.university}
          onChange={(v) => set('university', v)}
        />
        <Text
          label="GPA (0–4, có thể để trống)"
          type="number"
          min="0"
          max="4"
          step="0.01"
          value={form.gpa}
          onChange={(v) => set('gpa', v === '' ? null : Number(v))}
        />
      </div>
      <Area label="Học vấn" value={form.education} onChange={(v) => set('education', v)} />
      <Area label="Kinh nghiệm" value={form.experience} onChange={(v) => set('experience', v)} />
    </ActionForm>
  );
}

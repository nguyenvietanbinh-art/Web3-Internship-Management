import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { ActionForm, Text, Area, MutationDialog } from '../Shared';
import { cvDisplayText, preserveCvSource } from '../cvPresentation';
import { importCvFields } from './importCvFields.mjs';
const fieldNames={summary:'Tóm tắt CV',skills:'Kỹ năng',education:'Học vấn',experience:'Kinh nghiệm / dự án',university:'Trường đại học',gpa:'GPA'};
export default function CvForm({ data, onSaved, importOpen=false, onImportOpen=()=>{} }) {
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
      summary: cvDisplayText(data?.summary) || '',
      education: cvDisplayText(data?.education) || '',
      experience: cvDisplayText(data?.experience) || '',
      skillsText: (data?.skills || []).join(', '),
    }),
    set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const imported=importCvFields(data?.extractedText),detected=Object.entries(imported);
  return <>
    {data?.extractedText&&<button type="button" className="btn btn-secondary" onClick={()=>onImportOpen(true)}>Điền thông tin từ tệp CV</button>}
    {importOpen&&<MutationDialog title="Thông tin đọc từ tệp CV" onClose={()=>onImportOpen(false)}>
      <p>{data?.fileName}</p>
      {detected.length?<><p>Các mục dưới đây sẽ thay nội dung tương ứng trong form. Mục chưa đọc được và tên CV được giữ nguyên. Kiểm tra lại rồi nhấn Lưu CV để lưu thông tin.</p>
        <div className="table-scroll"><table className="business-table"><thead><tr><th>Mục</th><th>Nội dung từ tệp</th></tr></thead><tbody>{detected.map(([key,value])=><tr key={key}><th scope="row">{fieldNames[key]}</th><td style={{whiteSpace:'pre-wrap'}}>{Array.isArray(value)?value.join(', '):cvDisplayText(value)}</td></tr>)}</tbody></table></div>
        <button type="button" className="btn btn-primary" onClick={()=>{setForm(current=>({...current,...Object.fromEntries(detected.map(([key,value])=>[key,typeof value==='string'?cvDisplayText(value):value])),...(imported.skills?{skillsText:imported.skills.join(', ')}:{})}));onImportOpen(false);}}>Đưa vào thông tin CV</button>
      </>:<p>Chưa nhận diện được các mục của tệp. Mở “Xem nội dung đọc từ CV” và điền các mục cần thiết; hệ thống chưa thay thông tin đang nhập.</p>}
      <button type="button" className="btn btn-secondary" onClick={()=>onImportOpen(false)}>Giữ thông tin đang nhập</button>
    </MutationDialog>}
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
                  : ['summary','education','experience'].includes(k)
                    ? preserveCvSource(form[k], data?.[k])
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
      <p className="muted">Trong tóm tắt, trình bày mục tiêu thực tập, định hướng, lịch có thể tham gia và cách phối hợp với nhóm. Những phẩm chất tự khai báo cần được kiểm tra thêm khi phỏng vấn hoặc thực tập.</p>
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
      <p className="muted">Mô tả dự án học tập, vai trò, việc đã làm, khó khăn và cách xử lý; phân biệt bài tập với kinh nghiệm làm việc chính thức.</p>
      <Area label="Kinh nghiệm" value={form.experience} onChange={(v) => set('experience', v)} />
    </ActionForm>
  </>;
}

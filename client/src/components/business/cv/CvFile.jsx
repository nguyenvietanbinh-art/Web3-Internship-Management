import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { downloadFile } from '../../../api/files';
import { ActionForm, Text, Field, ErrorNotice } from '../Shared';
export default function CvFile({ data, onSaved }) {
  const [file, setFile] = useState(null),
    [error, setError] = useState(''),
    [mode, setMode] = useState('local'),
    [cvUrl, setCvUrl] = useState('');
  return (
    <div className="business-stack">
      <div className="business-actions">
        <button
          type="button"
          className="btn btn-secondary"
          aria-pressed={mode === 'local'}
          onClick={() => setMode('local')}
        >
          Chọn file từ máy
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          aria-pressed={mode === 'url'}
          onClick={() => setMode('url')}
        >
          Lấy CV từ đường dẫn
        </button>
      </div>
      {mode === 'local' ? (
        <ActionForm
          submit="Tải CV từ máy lên"
          onSaved={onSaved}
          onSubmit={async () => {
            if (!file) throw new Error('Chọn PDF hoặc DOCX trước.');
            if (file.size > 2 * 1024 * 1024) throw new Error('Tệp không được vượt quá 2 MiB.');
            const extension = file.name.split('.').pop().toLowerCase(),
              mime = {
                pdf: 'application/pdf',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              }[extension];
            if (!mime) throw new Error('Chỉ nhận tệp PDF hoặc DOCX.');
            return apiRequest('/core/cv/file', {
              method: 'POST',
              body: file,
              headers: { 'Content-Type': mime, 'X-CV-Filename': encodeURIComponent(file.name) },
            });
          }}
        >
          <Field label="Chọn tệp CV">
            <input
              className="input-field"
              aria-label="Chọn tệp CV"
              type="file"
              accept=".pdf,.docx"
              required
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </Field>
        </ActionForm>
      ) : (
        <ActionForm
          submit="Lấy và lưu CV từ đường dẫn"
          onSaved={onSaved}
          onSubmit={() =>
            apiRequest('/core/cv/import-url', { method: 'POST', body: { url: cvUrl.trim() } })
          }
        >
          <Text
            label="Đường dẫn CV trực tiếp"
            type="url"
            required
            maxLength={2048}
            value={cvUrl}
            onChange={setCvUrl}
            placeholder="https://example.com/cv-cua-toi.pdf"
            hint="Dán link HTTPS công khai dẫn trực tiếp tới file PDF/DOCX. Link trang xem CV hoặc yêu cầu đăng nhập chưa được hỗ trợ."
          />
        </ActionForm>
      )}
      <p className="muted">
        Không cần lưu CV thủ công trước. Nếu đã có tệp CV, tải tệp mới sẽ thay tệp cũ và giữ phần
        thông tin CV bạn đã nhập.
      </p>
      <p className="business-content">
        {data?.fileName ? `Tệp CV hiện tại: ${data.fileName}` : 'Chưa có tệp CV được tải lên.'}
      </p>
      {data?.fileName && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            setError('');
            try {
              await downloadFile('/core/cv/file', data.fileName);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Tải tệp CV của tôi
        </button>
      )}
      <ErrorNotice message={error} />
      {data?.extractedText && (
        <details>
          <summary>Xem nội dung đọc từ CV</summary>
          <pre className="business-content">{data.extractedText}</pre>
        </details>
      )}
    </div>
  );
}

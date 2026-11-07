import { useState } from 'react';
import { EmptyState, LoadingSkeleton } from '../../ui';
import { useResource } from '../hooks';
import { Panel } from '../Shared';
import CvForm from './CvForm';
import CvFile from './CvFile';
export default function CvPage() {
  const [revision, setRevision] = useState(0),
    [uploadedCv, setUploadedCv] = useState(null),
    [importOpen, setImportOpen] = useState(false),
    [message, setMessage] = useState(''),
    state = useResource('/core/cv', revision);
  if (state.loading) return <LoadingSkeleton />;
  if (state.error)
    return (
      <EmptyState error title="Không tải được CV">
        {state.error}
      </EmptyState>
    );
  return (
    <div className="business-stack">
      {message && <p role="status">{message}</p>}
      <Panel
        title="Tải CV lên"
        description="Chọn file từ máy hoặc nhập link CV công khai. Hỗ trợ PDF/DOCX tối đa 2 MiB; PDF dạng văn bản tối đa 20 trang."
      >
        <CvFile
          data={uploadedCv || state.data}
          onRemoved={saved=>{
            setUploadedCv(saved);
            setImportOpen(false);
            setMessage('Đã xóa tệp CV. Thông tin CV nhập tay được giữ nguyên.');
          }}
          onSaved={(saved) => {
            setMessage(`Đã lưu tệp CV “${saved.fileName}”. Kiểm tra thông tin đọc được bên dưới trước khi lưu vào form.`);
            setUploadedCv(saved);
            setImportOpen(true);
          }}
        />
      </Panel>
      <Panel
        title="Thông tin CV"
        description="Bạn có thể tự nhập hoặc bổ sung thông tin sau khi tải file. CV riêng tư; doanh nghiệp chỉ xem bản hồ sơ bạn đã gửi khi ứng tuyển."
      >
        <CvForm
          key={state.data?.__v ?? 'new'}
          data={uploadedCv || state.data}
          importOpen={importOpen}
          onImportOpen={setImportOpen}
          onSaved={() => {
            setMessage('Đã lưu thông tin CV.');
            setUploadedCv(null);
            setImportOpen(false);
            setRevision((n) => n + 1);
          }}
        />
      </Panel>
    </div>
  );
}

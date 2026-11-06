import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '../../ui';
import { apiRequest } from '../../../api/client';
import { downloadFile } from '../../../api/files';
import { displayLabel } from '../content';
import { dateLabel } from '../hooks';
import { ErrorNotice } from '../Shared';
export function TaskHistory({ entries = [] }) {
  const labels = {
    'task.created': 'Giao công việc',
    'task.updated': 'Cập nhật công việc',
    'task.submitted': 'Nộp kết quả',
    'task.reviewed': 'Đánh giá bài nộp',
    'task.filename_encoding_repaired': 'Sửa tên tệp hiển thị',
  };
  return (
    <details className="history-details">
      <summary>Lịch sử ({entries.length})</summary>
      <ol>
        {entries.map((entry, i) => (
          <li key={entry._id || i}>
            <strong>{labels[entry.action] || 'Cập nhật công việc'}</strong> · {dateLabel(entry.at)}
            <p>{entry.actorRole === 'system' ? 'Hệ thống' : displayLabel(entry.actorRole)}</p>
            {entry.data?.submission && (
              <p>{entry.data.submission.late ? 'Nộp muộn' : 'Nộp đúng hạn'}</p>
            )}
            {entry.data?.comment && <p className="business-content">{entry.data.comment}</p>}
          </li>
        ))}
      </ol>
    </details>
  );
}
export function TaskSubmission({ data }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(null),
    submission = data.submission;
  useEffect(
    () => () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    },
    [preview]
  );
  async function openPreview() {
    setBusy(true);
    setError('');
    try {
      const response = await apiRequest(`/core/tasks/${data._id}/submission/preview`, {
        responseType: 'response',
      });
      const mime = response.headers.get('Content-Type') || '';
      if (mime.includes('application/json')) setPreview(await response.json());
      else
        setPreview({
          kind: mime.includes('application/pdf') ? 'pdf' : 'image',
          url: URL.createObjectURL(await response.blob()),
        });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError('');
    try {
      await downloadFile(`/core/tasks/${data._id}/submission/file`, submission.fileName);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {submission?.submittedAt ? (
        <>
          <strong>{submission.late ? 'Nộp muộn' : 'Nộp đúng hạn'}</strong>
          <p>{dateLabel(submission.submittedAt)}</p>
          <details>
            <summary>Xem bài nộp gần nhất</summary>
            <p className="business-content">{submission.content}</p>
            {submission.link && /^https?:\/\//i.test(submission.link) && (
              <p>
                <a href={submission.link} target="_blank" rel="noopener noreferrer">
                  Mở liên kết kết quả
                </a>
              </p>
            )}
            {submission.fileName && (
              <>
                <p className="business-content">
                  <strong>Tệp:</strong> {submission.fileName}
                </p>
                <div className="business-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={openPreview}
                  >
                    Xem trực tiếp
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={download}
                  >
                    Tải về
                  </button>
                </div>
              </>
            )}
          </details>
        </>
      ) : (
        <span>Chưa nộp bài</span>
      )}
      {data.review?.comment && (
        <p className="business-content">
          <strong>{displayLabel(data.review.decision)}:</strong> {data.review.comment}
        </p>
      )}
      <ErrorNotice message={error} />
      {preview &&
        createPortal(
          <Dialog
            label="Xem trực tiếp bài nộp"
            className="submission-preview-dialog"
            onClose={() => setPreview(null)}
          >
            <h2>{submission.fileName}</h2>
            {preview.note && <p>{preview.note}</p>}
            {preview.kind === 'text' ? (
              <pre className="submission-preview-text">{preview.text}</pre>
            ) : preview.kind === 'image' ? (
              <img
                className="submission-preview-image"
                src={preview.url}
                alt={submission.fileName}
              />
            ) : (
              <iframe
                className="submission-preview-pdf"
                src={preview.url}
                title="Nội dung PDF bài nộp"
              />
            )}
            <div className="business-actions">
              <button type="button" className="btn btn-secondary" onClick={download}>
                Tải về
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPreview(null)}>
                Đóng bản xem
              </button>
            </div>
          </Dialog>,
          document.body
        )}
    </div>
  );
}

import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { ActionForm, Text, Area, Select } from '../Shared';
import { REPORT_DECISIONS } from './reportDecisions';
export default function ReviewForm({ data, approve, onSaved }) {
  const [score, setScore] = useState(''),
    [comment, setComment] = useState(''),
    [decision, setDecision] = useState('approved');
  return (
    <ActionForm
      submit={approve ? 'Chốt kết quả' : 'Lưu đánh giá báo cáo'}
      onSaved={onSaved}
      onSubmit={() =>
        apiRequest('/core/reports/' + data._id + (approve ? '/approve' : '/reviews'), {
          method: 'POST',
          body: approve
            ? { reason: comment, version: data.__v }
            : { score: Number(score), comment, decision, version: data.__v },
        })
      }
    >
      <strong>{data.title}</strong>
      <details>
        <summary>Đọc nội dung báo cáo</summary>
        <pre className="business-content">{data.content}</pre>
      </details>
      {!approve && (
        <>
          <Text
            label="Điểm báo cáo (0–100)"
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={score}
            onChange={setScore}
          />
          <Select
            label="Kết quả đánh giá báo cáo"
            value={decision}
            onChange={setDecision}
            options={REPORT_DECISIONS}
          />
          {decision !== 'approved' && (
            <p className="muted">
              {decision === 'incorrect'
                ? 'Ghi rõ nội dung sai trong nhận xét. Sinh viên cần nộp phiên bản báo cáo mới.'
                : 'Ghi rõ phần cần chỉnh sửa. Sinh viên cần chỉnh lại và nộp phiên bản mới.'}
            </p>
          )}
        </>
      )}
      <Area
        label={approve ? 'Lý do chốt kết quả' : 'Nhận xét báo cáo theo kỳ'}
        required
        maxLength={approve ? 2000 : 5000}
        value={comment}
        onChange={setComment}
      />
      <p className="muted">
        Nhà trường chốt sau khi doanh nghiệp và giảng viên đồng ý. Điểm cuối là trung bình hai đánh
        giá.
      </p>
    </ActionForm>
  );
}

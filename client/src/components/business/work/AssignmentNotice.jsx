import { useEffect, useState } from 'react';
import { active, dateLabel } from '../hooks';
import { displayLabel } from '../content';
export default function AssignmentNotice({ assignment }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!assignment)
    return (
      <p className="muted">
        Chọn phân công để xác định sinh viên nhận việc. Chỉ phân công đang thực tập và còn trong
        thời gian thực tập mới được giao/nộp bài.
      </p>
    );
  const future = Date.parse(assignment.startDate) > now,
    ended = Date.parse(assignment.endDate) < now;
  let hint = '';
  if (assignment.lifecycle === 'proposed') hint = 'Cần Nhà trường duyệt phân công trước.';
  else if (['completed', 'cancelled'].includes(assignment.lifecycle))
    hint = 'Phân công đã kết thúc, không nhận công việc hoặc bài nộp mới.';
  else if (ended) hint = 'Đã hết thời gian thực tập của phân công này.';
  else if (future)
    hint = `Chưa đến ngày bắt đầu: ${dateLabel(
      assignment.startDate
    )}. Nếu ngày bị nhập nhầm, Nhà trường có thể sửa tại Kỳ & phân công → Sửa giảng viên / ngày.`;
  else if (assignment.lifecycle === 'approved')
    hint =
      'Nhà trường đã duyệt. Doanh nghiệp vào Kỳ & phân công → Cập nhật phân công → Đang thực tập để bắt đầu.';
  return (
    <p className={active(assignment) ? 'muted' : 'inline-alert is-error'}>
      Trạng thái: {displayLabel(assignment.lifecycle)} · {dateLabel(assignment.startDate)} →{' '}
      {dateLabel(assignment.endDate)}
      {hint && ` . ${hint}`}
    </p>
  );
}

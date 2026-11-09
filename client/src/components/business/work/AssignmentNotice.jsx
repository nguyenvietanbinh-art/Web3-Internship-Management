import { useEffect, useState } from 'react';
import { active, dateLabel } from '../hooks';
import { displayLabel } from '../content';
export default function AssignmentNotice({ assignment }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!assignment) return null;
  if(assignment.pendingAssignment)return <p className="inline-alert">{assignment.participantNames?.student||'Sinh viên'} đã được doanh nghiệp tiếp nhận, đang chờ nhà trường phân công chính thức và gắn giảng viên. Thời gian kỳ: {dateLabel(assignment.startDate)} → {dateLabel(assignment.endDate)}. Cần hoàn tất phân công trước khi giao công việc.{Date.parse(assignment.startDate)>now?' Kỳ thực tập cũng chưa đến ngày bắt đầu.':''}</p>;
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
      'Nhà trường đã duyệt. Doanh nghiệp cần chuyển phân công sang trạng thái Đang thực tập trước khi giao việc.';
  return (
    <p className={active(assignment) ? 'muted' : 'inline-alert is-error'}>
      Trạng thái: {displayLabel(assignment.lifecycle)} · {dateLabel(assignment.startDate)} →{' '}
      {dateLabel(assignment.endDate)}
      {hint && ` . ${hint}`}
    </p>
  );
}

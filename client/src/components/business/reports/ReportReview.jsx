import { Status } from '../Shared';
import { dateLabel } from '../hooks';
import { REPORT_DECISION_LABELS } from './reportDecisions';
export function ReportReview({ review }) {
  return review ? (
    <div>
      <strong>{review.score}/100</strong>
      <p>
        <Status value={review.decision} label={REPORT_DECISION_LABELS[review.decision]} />
      </p>
      <p className="business-content">{review.comment}</p>
      <small>{dateLabel(review.at)}</small>
    </div>
  ) : (
    <span>Chưa chấm điểm / nhận xét</span>
  );
}
export function ReportActions({ report: r, user, onReview, onApprove }) {
  const reviewer = ['company', 'mentor'].includes(user.role);
  const incorrect = r.reviews.some((x) => x.decision === 'incorrect');
  if (!reviewer && user.role !== 'admin')
    return (
      <span>
        {r.state === 'need_revision'
          ? incorrect
            ? 'Báo cáo được đánh giá Sai. Hãy đọc nhận xét và nộp phiên bản mới.'
            : 'Cần chỉnh sửa lại và nộp bản báo cáo mới.'
          : 'Theo dõi điểm và nhận xét của hai bên'}
      </span>
    );
  let reason = '';
  if (!r.current) reason = 'Bản cũ; hãy chấm phiên bản hiện hành.';
  else if (r.state === 'approved') reason = 'Báo cáo đã được Nhà trường chốt.';
  else if (r.state === 'need_revision')
    reason = incorrect
      ? 'Báo cáo được đánh giá Sai; đang chờ sinh viên nộp phiên bản mới.'
      : 'Đang chờ sinh viên chỉnh sửa và nộp bản mới.';
  else if (reviewer && r.reviews.some((x) => x.role === user.role))
    reason = 'Bạn đã chấm phiên bản này. Đang chờ bên còn lại hoặc Nhà trường.';
  else if (!reviewer && r.state !== 'reviewed')
    reason = 'Cần Doanh nghiệp và Giảng viên cùng đánh giá đồng ý.';
  return (
    <div>
      <button
        className="btn btn-primary"
        disabled={!!reason}
        onClick={reviewer ? onReview : onApprove}
      >
        {reviewer ? 'Chấm điểm / nhận xét' : 'Chốt kết quả báo cáo'}
      </button>
      {reason && <p className="muted">{reason}</p>}
    </div>
  );
}

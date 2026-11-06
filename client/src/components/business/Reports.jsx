import { useState } from 'react';
import { displayLabel } from './content';
import { Panel, ServerTable, MutationDialog, Status, AssignmentPicker } from './Shared';
import { active, dateLabel } from './hooks';
import Kpis from './Kpis';
import ReportForm from './reports/ReportForm';
import ReviewForm from './reports/ReviewForm';
import { ReportReview, ReportActions } from './reports/ReportReview';
export default function ReportsPage({ user }) {
  const [assignment, setAssignment] = useState(null),
    [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null),
    [message, setMessage] = useState('');
  const saved = () => {
    setMessage(
      modal.type === 'submit'
        ? 'Đã nộp báo cáo thành công.'
        : modal.type === 'review'
        ? 'Đã lưu điểm và nhận xét của bạn.'
        : 'Đã chốt kết quả báo cáo.'
    );
    setModal(null);
    setRevision((n) => n + 1);
  };
  return (
    <div className="business-stack">
      <Panel
        title="Báo cáo & đánh giá theo kỳ"
        description="Doanh nghiệp và Giảng viên chấm điểm, nhận xét độc lập cho báo cáo sinh viên đã nộp."
      >
        <AssignmentPicker
          value={assignment}
          onChange={(a) => {
            setAssignment(a);
            setMessage('');
          }}
        />
        <p className="muted">
          Sinh viên nộp báo cáo tuần hoặc cuối kỳ tại trang này. Bài nộp ở Công việc & nhật ký chưa
          phải báo cáo theo kỳ.
        </p>
        {user.role === 'student' && (
          <>
            <button
              className="btn btn-primary"
              disabled={!active(assignment)}
              onClick={() => setModal({ type: 'submit' })}
            >
              Nộp báo cáo theo kỳ
            </button>
            {!active(assignment) && (
              <p className="muted">Chọn phân công đang thực tập và còn thời gian để nộp báo cáo.</p>
            )}
          </>
        )}
      </Panel>
      {message && <p role="status">{message}</p>}
      <Panel
        title="Chấm điểm & nhận xét báo cáo"
        description="Mỗi bên chấm từ 0–100 và nhập nhận xét. Nhà trường chốt kết quả sau khi cả hai bên đồng ý."
      >
        <ServerTable
          key={assignment?._id || 'all'}
          path={'/core/reports' + (assignment ? '?assignmentId=' + assignment._id : '')}
          revision={revision}
          label="Báo cáo theo kỳ"
          search={false}
          emptyTitle="Chưa có báo cáo để chấm điểm"
          emptyDescription="Sinh viên cần chọn phân công và bấm Nộp báo cáo theo kỳ. Khi đã nộp, Doanh nghiệp và Giảng viên sẽ thấy nút Chấm điểm / nhận xét tại đây."
          columns={[
            {
              key: 'title',
              title: 'Báo cáo',
              render: (r) => (
                <div>
                  <strong>{r.title}</strong>
                  <p>
                    {r.current ? 'Hiện hành' : 'Bản cũ'} · {displayLabel(r.kind)} · phiên bản
                    {r.version} · {dateLabel(r.createdAt)}
                  </p>
                  <details>
                    <summary>Đọc báo cáo</summary>
                    <pre className="business-content">{r.content}</pre>
                  </details>
                </div>
              ),
            },
            {
              key: 'companyReview',
              title: 'Điểm / nhận xét Doanh nghiệp',
              render: (r) => <ReportReview review={r.reviews.find((x) => x.role === 'company')} />,
            },
            {
              key: 'mentorReview',
              title: 'Điểm / nhận xét Giảng viên',
              render: (r) => <ReportReview review={r.reviews.find((x) => x.role === 'mentor')} />,
            },
            {
              key: 'state',
              title: 'Kết quả',
              render: (r) => (
                <>
                  <Status value={r.state} />
                  <p>{r.finalScore === null ? 'Chưa chốt điểm' : `${r.finalScore}/100`}</p>
                </>
              ),
            },
            {
              key: 'action',
              title: 'Thao tác',
              render: (r) => (
                <ReportActions
                  report={r}
                  user={user}
                  onReview={() => setModal({ type: 'review', data: r })}
                  onApprove={() => setModal({ type: 'approve', data: r })}
                />
              ),
            },
          ]}
        />
      </Panel>
      {assignment && <Kpis key={assignment._id} assignment={assignment} user={user} />}
      {modal && (
        <MutationDialog
          title={
            modal.type === 'submit'
              ? 'Nộp báo cáo theo kỳ'
              : modal.type === 'review'
              ? `Chấm báo cáo · ${displayLabel(user.role)}`
              : 'Nhà trường chốt kết quả'
          }
          onClose={() => setModal(null)}
        >
          {modal.type === 'submit' ? (
            <ReportForm assignment={assignment} onSaved={saved} />
          ) : (
            <ReviewForm data={modal.data} approve={modal.type === 'approve'} onSaved={saved} />
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
            Đóng
          </button>
        </MutationDialog>
      )}
    </div>
  );
}

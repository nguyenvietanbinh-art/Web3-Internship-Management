import { useState } from 'react';
import { displayLabel } from './content';
import { Panel, ServerTable, MutationDialog, History, Status, AssignmentPicker } from './Shared';
import { active, dateLabel } from './hooks';
import AssignmentNotice from './work/AssignmentNotice';
import { TaskHistory, TaskSubmission } from './work/TaskSubmission';
import WorkDialog from './work/WorkDialog';
import { WORK_DIALOG_TITLES } from './work/constants';
import CompanyWorkPeriods from './work/CompanyWorkPeriods';
export default function WorkPage({ user, schoolWorkflow=false }) {
  const [assignment, setAssignment] = useState(null),
    [tab, setTab] = useState('tasks'),
    [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null);
  const [message, setMessage] = useState('');
  const [batchId,setBatchId]=useState('');
  const periodMode=schoolWorkflow&&user.role==='company';
  const selected = assignment&&!assignment.pendingAssignment ? `?assignmentId=${assignment._id}${periodMode?'&batchId='+batchId:''}` : periodMode&&batchId?'?batchId='+batchId:'',
    isActive = active(assignment),
    manage = ['company', 'mentor'].includes(user.role),
    saved = () => {
      setMessage(
        modal.type === 'submitTask'
          ? 'Đã nộp công việc thành công.'
          : modal.type === 'reviewTask'
          ? 'Đã lưu đánh giá công việc.'
          : 'Đã lưu thành công.'
      );
      setModal(null);
      setRevision((n) => n + 1);
    };
  return (
    <div className="business-stack">
      <Panel
        title="Công việc / nhật ký theo kỳ"
        description="Giao việc, theo dõi deadline, nộp kết quả và nhận xét."
      >
        {periodMode&&<CompanyWorkPeriods value={batchId} onChange={id=>{setBatchId(id);setAssignment(null);setModal(null);setMessage('');setRevision(n=>n+1);}}/>}
        <AssignmentPicker
          batchId={periodMode?batchId:''}
          requireBatch={periodMode}
          includeAdmissions={periodMode}
          value={assignment}
          onChange={(a) => {
            setAssignment(a);
            setRevision((n) => n + 1);
          }}
        />
        <AssignmentNotice assignment={assignment} />
        <div className="business-actions">
          <button
            className="btn btn-secondary"
            aria-pressed={tab === 'tasks'}
            onClick={() => setTab('tasks')}
          >
            Công việc
          </button>
          <button
            className="btn btn-secondary"
            aria-pressed={tab === 'logs'}
            onClick={() => setTab('logs')}
          >
            Nhật ký theo kỳ
          </button>
        </div>
      </Panel>
      {message && <p role="status">{message}</p>}
      <Panel
        title={tab === 'tasks' ? 'Công việc được giao' : 'Nhật ký tuần'}
        actions={
          tab === 'tasks' && manage ? (
            <button className="btn btn-primary" disabled={periodMode&&!isActive} onClick={() => setModal({ type: 'task' })}>
              Giao công việc
            </button>
          ) : tab === 'logs' && manage ? (
            <button className="btn btn-primary" disabled={periodMode&&!isActive} onClick={() => setModal({ type: 'assignLog' })}>
              Giao yêu cầu theo tuần
            </button>
          ) : tab === 'logs' && user.role === 'student' ? (
            <button
              className="btn btn-primary"
              disabled={!isActive}
              onClick={() => setModal({ type: 'log' })}
            >
              Nộp nhật ký theo kỳ
            </button>
          ) : null
        }
      >
        {periodMode&&!batchId?<p className="muted">Vui lòng chọn kỳ thực tập để xem và giao công việc.</p>:tab === 'tasks' ? (
          <ServerTable
            key={`tasks-${batchId}-${assignment?._id || 'all'}`}
            path={'/core/tasks' + selected}
            revision={revision}
            label="Công việc"
            columns={[
              {
                key: 'title',
                title: 'Công việc',
                render: (r) => (
                  <div>
                    <strong>{r.title}</strong>
                    <p className="business-content">{r.description}</p>
                    <TaskHistory entries={r.history} />
                  </div>
                ),
              },
              {
                key: 'dueDate',
                title: 'Hạn hoàn thành',
                render: (r) => (
                  <div>
                    {dateLabel(r.dueDate)}
                    {!['review', 'done'].includes(r.status) && new Date(r.dueDate) < new Date() && (
                      <p className="inline-alert is-error">Đã quá hạn nộp</p>
                    )}
                  </div>
                ),
              },
              { key: 'priority', title: 'Ưu tiên', render: (r) => displayLabel(r.priority) },
              {
                key: 'progress',
                title: 'Tiến độ',
                render: (r) => (
                  <span>
                    {r.progress}% · <Status value={r.status} />
                  </span>
                ),
              },
              {
                key: 'submission',
                title: 'Bài nộp / nhận xét',
                render: (r) => <TaskSubmission data={r} />,
              },
              {
                key: 'actions',
                title: 'Thao tác',
                render: (r) => (
                  <div className="business-actions">
                    {user.role === 'student' ? (
                      <>
                        <button
                          className="btn btn-primary"
                          disabled={['review', 'done'].includes(r.status)}
                          onClick={() => setModal({ type: 'submitTask', data: r })}
                        >
                          {r.review?.decision === 'need_revision'
                            ? 'Nộp lại công việc'
                            : 'Nộp công việc'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={['review', 'done'].includes(r.status)}
                          onClick={() => setModal({ type: 'task', data: r })}
                        >
                          Cập nhật tiến độ
                        </button>
                      </>
                    ) : manage ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setModal({ type: 'task', data: r })}
                        >
                          Chỉnh sửa công việc
                        </button>
                        <button
                          className="btn btn-primary"
                          disabled={r.status !== 'review' || !r.submission?.submittedAt}
                          onClick={() => setModal({ type: 'reviewTask', data: r })}
                        >
                          Duyệt bài nộp
                        </button>
                      </>
                    ) : (
                      <span>Chỉ xem</span>
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <ServerTable
            key={`logs-${batchId}-${assignment?._id || 'all'}`}
            path={'/core/worklogs' + selected}
            revision={revision}
            label="Nhật ký theo kỳ"
            columns={[
              {
                key: 'title',
                title: 'Nội dung',
                render: (r) => (
                  <div>
                    <strong>
                      Tuần {r.weekNumber}: {r.title}
                    </strong>
                    {r.requirement && (
                      <>
                        <p className="business-content">
                          <strong>Yêu cầu:</strong> {r.requirement}
                        </p>
                        <p>
                          Ưu tiên: {displayLabel(r.priority)} · Hạn nộp: {dateLabel(r.dueDate)}
                        </p>
                      </>
                    )}
                    {r.status === 'pending_submission' && <p>Chờ sinh viên nộp kết quả.</p>}
                    <p className="business-content">{r.tasksDone}</p>
                    {r.resultLink && /^https?:\/\//i.test(r.resultLink) && (
                      <a href={r.resultLink} target="_blank" rel="noopener noreferrer">
                        Xem liên kết kết quả
                      </a>
                    )}
                    <details>
                      <summary>Khó khăn / kế hoạch</summary>
                      <p>{r.challenges || 'Không cung cấp'}</p>
                      <p>{r.nextPlan || 'Không cung cấp'}</p>
                    </details>
                    <History entries={r.history} />
                  </div>
                ),
              },
              {
                key: 'status',
                title: 'Trạng thái / nhận xét',
                render: (r) => (
                  <>
                    <Status
                      value={r.status}
                      label={r.status === 'pending_submission' ? 'Chưa nộp' : undefined}
                    />
                    {r.submittedAt && (
                      <p>
                        {r.submittedLate ? 'Nộp muộn' : r.dueDate ? 'Nộp đúng hạn' : 'Đã nộp'} ·{' '}
                        {dateLabel(r.submittedAt)}
                      </p>
                    )}
                    <p>{r.mentorFeedback || 'Chưa có nhận xét'}</p>
                  </>
                ),
              },
              {
                key: 'actions',
                title: 'Thao tác',
                render: (r) =>
                  user.role === 'student' ? (
                    <button
                      className="btn btn-secondary"
                      disabled={r.status === 'approved'}
                      onClick={() => setModal({ type: 'log', data: r })}
                    >
                      {r.status === 'pending_submission'
                        ? 'Nộp kết quả theo tuần'
                        : r.status === 'need_revision'
                        ? 'Nộp lại nhật ký'
                        : 'Sửa nhật ký'}
                    </button>
                  ) : manage ? (
                    <div className="business-actions">
                      {r.requirement &&
                        ['pending_submission', 'need_revision'].includes(r.status) && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => setModal({ type: 'assignLog', data: r })}
                          >
                            Sửa yêu cầu theo tuần
                          </button>
                        )}
                      <button
                        className="btn btn-secondary"
                        disabled={r.status !== 'submitted'}
                        onClick={() => setModal({ type: 'reviewLog', data: r })}
                      >
                        Duyệt nhật ký
                      </button>
                    </div>
                  ) : (
                    <span>Chỉ xem</span>
                  ),
              },
            ]}
          />
        )}
      </Panel>
      {modal && (
        <MutationDialog title={WORK_DIALOG_TITLES[modal.type]} onClose={() => setModal(null)}>
          <WorkDialog
            modal={modal}
            user={user}
            assignment={assignment}
            batchId={periodMode?batchId:''}
            onAssignment={setAssignment}
            onSaved={saved}
          />
          <button className="btn btn-secondary" onClick={() => setModal(null)}>
            Đóng
          </button>
        </MutationDialog>
      )}
    </div>
  );
}

import {TaskProgressSummary} from './work/TaskAssessment';
import {useViewState} from '../viewStateStore';
import { useState } from 'react';
import { displayLabel } from './content';
import { Panel, ServerTable, MutationDialog, History, Status, AssignmentPicker } from './Shared';
import { active, dateLabel } from './hooks';
import AssignmentNotice from './work/AssignmentNotice';
import { TaskHistory, TaskSubmission } from './work/TaskSubmission';
import WorkDialog from './work/WorkDialog';
import { WORK_DIALOG_TITLES } from './work/constants';
import ReportsPage from './Reports';
import Kpis from './Kpis';
import CompanyWorkPeriods from './work/CompanyWorkPeriods';
export default function WorkPage({ user, schoolWorkflow=false }) {
  const [selectedStudent,setSelectedStudent]=useState(null);
  const [assignment, setAssignment] = useState(null),
    [tab,setTab]=useViewState('tab','tasks'),
    [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null);
  const [message, setMessage] = useState('');
  const [batchId,setBatchId]=useViewState('batchId','');
  const periodMode=schoolWorkflow&&user.role==='company';
  const selected = assignment&&!assignment.pendingAssignment ? `?assignmentId=${assignment._id}${periodMode?'&batchId='+batchId:''}` : selectedStudent?'?studentUserId='+selectedStudent._id+(periodMode&&batchId?'&batchId='+batchId:''):periodMode&&batchId?'?batchId='+batchId:'',
    isActive = active(assignment),
    manage = ['company', 'mentor'].includes(user.role),
    saved = (result) => {
      setMessage(
        result?.draftSaved?'Đã lưu bản nháp công việc.':modal.type === 'submitTask'
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
        title={user.role==='student'?'Công việc được giao':'Công việc / nhật ký theo kỳ'}
        description="Giao việc, theo dõi deadline, nộp kết quả và nhận xét."
      >
        {periodMode&&<CompanyWorkPeriods value={batchId} onChange={id=>{setBatchId(id);setAssignment(null);setModal(null);setMessage('');setRevision(n=>n+1);}}/>}
        <AssignmentPicker
          userRole={user.role}
          onStudentChange={setSelectedStudent}
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
            {user.role==='student'?'Báo cáo tuần':'Nhật ký theo kỳ'}
          </button>
        </div>
      </Panel>
      {message && <p role="status">{message}</p>}
      {user.role==='student'&&tab==='logs'&&<ReportsPage user={user} studentKind="weekly" embedded providedAssignment={assignment}/>}
      {user.role==='student'&&tab==='logs'&&<p className="muted">Nhật ký và yêu cầu theo tuần đã có được giữ bên dưới để tra cứu và phản hồi; báo cáo tuần chính thức nộp ở biểu mẫu phía trên.</p>}
      <Panel
        title={tab === 'tasks' ? 'Công việc được giao' : user.role==='student'?'Nhật ký công việc đã có':'Nhật ký tuần'}
        actions={
          tab === 'tasks' && manage ? (
            <button className="btn btn-primary" disabled={periodMode&&!isActive} onClick={() => setModal({ type: 'task' })}>
              Giao công việc
            </button>
          ) : tab === 'logs' && manage ? (
            <button className="btn btn-primary" disabled={periodMode&&!isActive} onClick={() => setModal({ type: 'assignLog' })}>
              Giao yêu cầu theo tuần
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
                    {r.confirmedProgress==null?'Chưa xác nhận theo tiêu chí':r.confirmedProgress+'%'} · <Status value={r.status} />
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
                    <button className="btn btn-secondary" onClick={()=>setModal({type:'evaluation',data:r})}>Tiến độ và bài nộp</button>
                    {user.role==='company'&&!r.submission?.submittedAt&&r.status!=='done'&&<button className="btn btn-secondary" onClick={()=>setModal({type:'criteria',data:r})}>Tiêu chí nghiệm thu</button>}
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
                          disabled={r.status !== 'review' || !r.submission?.submittedAt || user.role!=='company'}
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
      {tab==='tasks'&&assignment&&<TaskProgressSummary assignmentId={assignment._id} revision={revision}/>}
      {user.role==='student'&&tab==='tasks'&&assignment&&<Kpis assignment={assignment} user={user}/>}
      {modal && (
        <MutationDialog title={WORK_DIALOG_TITLES[modal.type]} onClose={() => {setModal(null);setRevision(n=>n+1);}}>
          <WorkDialog
            modal={modal}
            user={user}
            assignment={assignment}
            batchId={periodMode?batchId:''}
            onAssignment={setAssignment}
            onSaved={saved}
          />
          <button className="btn btn-secondary" onClick={() => {setModal(null);setRevision(n=>n+1);}}>
            Đóng
          </button>
        </MutationDialog>
      )}
    </div>
  );
}

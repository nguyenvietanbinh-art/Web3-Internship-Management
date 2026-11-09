import ReportAiEvaluation from './reports/ReportAiEvaluation';
import ReportAttachments from './reports/ReportAttachments';
import ReportEvidence from './reports/ReportEvidence';
import { useState } from 'react';
import { displayLabel } from './content';
import { Panel, ServerTable, MutationDialog, Status, AssignmentPicker, Select, ErrorNotice } from './Shared';
import WeekFilter from './WeekFilter';
import {useViewState,confirmLeave} from '../viewStateStore';
import { active, dateLabel, useResource } from './hooks';
import Kpis from './Kpis';
import ReportForm from './reports/ReportForm';
import ReviewForm from './reports/ReviewForm';
import CompletedReportPractice from './reports/CompletedReportPractice';
import { ReportReview, ReportActions } from './reports/ReportReview';
export default function ReportsPage({ user,studentKind='final',embedded=false,providedAssignment=null,unified=false }) {
  const [kind,setKind]=useViewState('reportKind',''),[state,setState]=useViewState('reportState',''),[batchId,setBatchId]=useViewState('reportBatch','');
  const batches=useResource(user.role==='admin'?'/core/admin/batches?limit=100':null);
  const placements=useResource(user.role==='mentor'?'/core/placements?limit=100':null);
  const completedIds=new Set((placements.data?.items||[]).filter(a=>a.lifecycle==='completed').map(a=>a._id));
  const student=user.role==='student',weekly=student&&studentKind==='weekly';
  const [reportWeek,setReportWeek]=useViewState('reportWeek','');
  const showWeekFilter=weekly||(!student&&kind==='weekly');
  const [adminStudent,setAdminStudent]=useState(null),[reviewStage,setReviewStage]=useViewState('reportReviewStage','');
  const [localAssignment, setAssignment] = useState(null),
    [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null),
    [message, setMessage] = useState('');
  const assignment=embedded?providedAssignment:localAssignment;
  const latestFinal=useResource(student&&!weekly&&assignment?'/core/reports?kind=final&limit=1&assignmentId='+assignment._id:null,revision);
  const finalLocked=student&&!weekly&&Boolean(latestFinal.data?.items[0])&&latestFinal.data.items[0].state!=='need_revision';
  const saved = () => {
    setMessage(
      ['submit','supplement'].includes(modal.type)
        ? 'Đã nộp báo cáo thành công.'
        : modal.type === 'review'
        ? 'Đã lưu điểm và nhận xét của bạn.'
        : 'Đã chốt kết quả báo cáo.'
    );
    setModal(null);
    setRevision((n) => n + 1);
  };
  const reportPath='/core/reports?'+new URLSearchParams({...(assignment?{assignmentId:assignment._id}:{}),...(!student&&adminStudent?{studentUserId:adminStudent._id}:{}),...(student?{kind:studentKind}:kind?{kind}:{}),...(showWeekFilter&&reportWeek?{weekNumber:reportWeek}:{}),...(state?{state}:{}),...(user.role==='admin'&&batchId?{batchId}:{}),...(user.role==='admin'&&reviewStage?{reviewStage}:{})});
  return (
    <div className="business-stack">
      <Panel
        title={student?(weekly?'Báo cáo tuần gửi doanh nghiệp':'Báo cáo kết quả gửi nhà trường'):user.role==='admin'?'Quản lý kết quả báo cáo thực tập':'Báo cáo sinh viên phụ trách'}
        description={student?(weekly?'Tổng hợp công việc, kết quả, khó khăn và kế hoạch; gửi doanh nghiệp tiếp nhận.':'Nộp báo cáo cuối kỳ cho nhà trường và xem lại bài, trạng thái, phản hồi. Quy trình đánh giá của doanh nghiệp và giảng viên vẫn được giữ.'):'Doanh nghiệp và Giảng viên chấm điểm, nhận xét độc lập cho báo cáo sinh viên đã nộp.'}
      >
        {!student&&<Select label="Loại báo cáo cần xem" value={kind} onChange={value=>{setKind(value);setReportWeek('');}} options={[{value:'',label:'Tất cả loại báo cáo'},{value:'weekly',label:'Báo cáo tuần'},{value:'final',label:'Báo cáo cuối kỳ'}]}/>}
        {showWeekFilter&&<WeekFilter value={reportWeek} onChange={setReportWeek}/>}
        <Select label="Trạng thái đánh giá báo cáo" value={state} onChange={setState} options={[{value:'',label:'Tất cả trạng thái'},{value:'submitted',label:'Đã nộp'},{value:'reviewed',label:'Đã có hai đánh giá'},{value:'need_revision',label:'Cần bổ sung'},{value:'approved',label:'Đã chốt kết quả'}]}/>
        {user.role==='admin'&&<Select label="Tình trạng chấm báo cáo" value={reviewStage} onChange={setReviewStage} options={[{value:'',label:'Tất cả tình trạng chấm'},{value:'unreviewed',label:'Chưa ai chấm'},{value:'company_only',label:'Chỉ doanh nghiệp đã chấm'},{value:'mentor_only',label:'Chỉ giảng viên đã chấm'},{value:'both',label:'Cả hai bên đã chấm, chưa chốt'},{value:'finalized',label:'Đã chốt kết quả'}]}/> }
        {user.role==='admin'&&<Select label="Kỳ của báo cáo" value={batchId} onChange={value=>{setBatchId(value);setAssignment(null);}} options={[{value:'',label:'Tất cả kỳ'},...(batches.data?.items||[]).map(b=>({value:b._id,label:b.name}))]}/>}
        {!embedded&&<AssignmentPicker
          userRole={user.role}
          batchId={user.role==='admin'?batchId:''}
          onStudentChange={setAdminStudent}
          value={assignment}
          onChange={(a) => {
            setAssignment(a);
            setMessage('');
          }}
        />}
        {user.role==='student'&&<p className="muted">
          {weekly?'Báo cáo tuần được gửi tới doanh nghiệp trong phân công của bạn.':'Báo cáo tuần nằm trong Công việc được giao. Trang này chỉ nộp và tra cứu báo cáo cuối kỳ.'}
        </p>}
        {user.role === 'student' && (
          <>
            <button
              className="btn btn-primary"
              disabled={!active(assignment)||finalLocked||(!weekly&&(latestFinal.loading||Boolean(latestFinal.error)))}
              onClick={() => setModal(latestFinal.data?.items[0]?.state==='need_revision'?{type:'supplement',data:latestFinal.data.items[0]}:{type:'submit'})}
            >
              {weekly?'Nộp báo cáo tuần':latestFinal.data?.items[0]?.state==='need_revision'?'Nộp bổ sung':'Nộp báo cáo kết quả'}
            </button>
            {!active(assignment) && (
              <p className="muted">Chọn phân công đang thực tập và còn thời gian để nộp báo cáo.</p>
            )}
            <ErrorNotice message={latestFinal.error}/>{finalLocked&&<p role="status">Đã nộp báo cáo cuối kỳ. Bạn có thể xem lại bài và phản hồi; chỉ nộp lại khi có yêu cầu bổ sung.</p>}
          </>
        )}
      </Panel>
      {message && <p role="status">{message}</p>}

      <Panel
        title={user.role==='student'?'Kết quả & nhận xét báo cáo':user.role==='admin'?'Duyệt kết quả báo cáo':'Chấm điểm & nhận xét báo cáo'}
      >
        <ServerTable
          key={reportPath}
          path={reportPath}
          revision={revision}
          label="Báo cáo theo kỳ"
          search={true}
          emptyTitle="Chưa có báo cáo trong phạm vi đang xem"
          emptyDescription={user.role==='student'?'Chọn hồ sơ đang thực tập để nộp báo cáo. Báo cáo của kỳ đã kết thúc được giữ để tra cứu.':'Báo cáo xuất hiện khi sinh viên trong phạm vi phụ trách đã nộp.'}
          columns={[
            {key:'context',title:'Thông tin thực tập',render:r=><><strong>{r.context?.studentName}</strong><p>MSSV: {r.context?.studentCode||'Chưa khai báo'}</p><p>{r.context?.batchName}</p><p>{r.context?.topicTitle}</p><p>{r.context?.companyName}</p><p>Giảng viên: {r.context?.mentorName}</p></>},
            {
              key: 'title',
              title: 'Báo cáo',
              render: (r) => (
                <div>
                  <strong>{r.title}</strong>
                  <p>
                    {r.kind==='weekly'&&r.weekNumber?`Tuần ${r.weekNumber} · `:''}{r.current ? 'Hiện hành' : 'Bản cũ'} · {displayLabel(r.kind)} · phiên bản
                    {r.version} · {dateLabel(r.createdAt)}
                  </p>
                  <button type="button" className="btn btn-secondary" onClick={()=>setModal({type:'view',data:r})}>Xem bài báo cáo</button>
                  {user.role==='mentor'&&r.kind==='final'&&r.state==='approved'&&completedIds.has(r.assignmentId)&&r.history?.some(e=>e.action==='fixture.report_prepared')&&<button type="button" className="btn btn-secondary" onClick={()=>setModal({type:'practice',data:r})}>Đánh giá lại bài mẫu</button>}
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
                <><ReportActions
                  report={r}
                  user={user}
                  onReview={() => setModal({ type: 'review', data: r })}
                  onApprove={() => setModal({ type: 'approve', data: r })}
                />{student&&r.current&&r.state==='need_revision'&&<><p>{r.revisionRequests?.at(-1)?.reason||r.reviews?.findLast(x=>x.decision!=='approved')?.comment||'Xem nhận xét để bổ sung báo cáo.'}</p><p>Người yêu cầu: {r.revisionRequests?.length?r.context?.mentorName:r.reviews?.findLast(x=>x.decision!=='approved')?.role==='company'?r.context?.companyName:r.context?.mentorName}</p><button type="button" className="btn btn-primary" onClick={()=>setModal({type:'supplement',data:r})}>Nộp bổ sung</button></>}</>
              ),
            },
          ]}
        />
      </Panel>
      {assignment && !embedded && !student && <Kpis key={assignment._id} assignment={assignment} user={user} />}
      {modal && (
        <MutationDialog
          title={
            ['submit','supplement'].includes(modal.type)
              ? 'Nộp báo cáo theo kỳ'
              : modal.type === 'review'
              ? `Chấm báo cáo · ${displayLabel(user.role)}`
              : modal.type==='view'?'Xem bài báo cáo':modal.type==='practice'?'Bài tập đánh giá báo cáo cuối kỳ':'Nhà trường chốt kết quả'
          }
          onClose={() => setModal(null)}
        >
          {modal.type==='practice'?<CompletedReportPractice report={modal.data}/>:modal.type==='view'?<article><h3>{modal.data.title}</h3><p>{displayLabel(modal.data.kind)} · Phiên bản {modal.data.version} · {displayLabel(modal.data.state)}</p><div className="business-content" style={{whiteSpace:'pre-wrap'}}>{modal.data.content}</div>{modal.data.selfAssessment&&<section><h4>Tự đánh giá của sinh viên</h4><p>{modal.data.selfAssessment}</p></section>}{modal.data.contentFeedback&&<details><summary>Nhận xét đối chiếu nội dung</summary>{modal.data.contentFeedback.criteria.map(c=><div key={c.id}><p>{c.comment}</p>{c.matches.map((m,i)=><blockquote key={i}>{m.quote}</blockquote>)}</div>)}</details>}{['student','mentor'].includes(user.role)&&<ReportAiEvaluation report={modal.data} user={user}/>}<ReportAttachments report={modal.data}/>{modal.data.kind==='final'&&<ReportEvidence key={modal.data._id} report={modal.data} user={user} unified={unified}/>}</article>:['submit','supplement'].includes(modal.type) ? (
            <ReportForm assignment={modal.data?{_id:modal.data.assignmentId,batchId:modal.data.context?.batchId}:assignment} previous={modal.data} fixedKind={modal.data?.kind||(student?studentKind:undefined)} onSaved={saved} />
          ) : (
            <ReviewForm data={modal.data} approve={modal.type === 'approve'} reviewerRole={user.role} onSaved={saved} />
          )}
          <button type="button" className="btn btn-secondary" onClick={() => {if(confirmLeave())setModal(null);}}>
            Đóng
          </button>
        </MutationDialog>
      )}
    </div>
  );
}

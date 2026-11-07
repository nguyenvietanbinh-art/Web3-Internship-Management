import ReportAiEvaluation from './reports/ReportAiEvaluation';
import ReportAttachments from './reports/ReportAttachments';
import ReportEvidence from './reports/ReportEvidence';
import { useState } from 'react';
import { displayLabel } from './content';
import { Panel, ServerTable, MutationDialog, Status, AssignmentPicker, Select, ErrorNotice } from './Shared';
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
  const [localAssignment, setAssignment] = useState(null),
    [revision, setRevision] = useState(0),
    [modal, setModal] = useState(null),
    [message, setMessage] = useState('');
  const assignment=embedded?providedAssignment:localAssignment;
  const latestFinal=useResource(student&&!weekly&&assignment?'/core/reports?kind=final&limit=1&assignmentId='+assignment._id:null,revision);
  const finalLocked=student&&!weekly&&Boolean(latestFinal.data?.items[0])&&latestFinal.data.items[0].state!=='need_revision';
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
  const reportPath='/core/reports?'+new URLSearchParams({...(assignment?{assignmentId:assignment._id}:{}),...(student?{kind:studentKind}:kind?{kind}:{}),...(state?{state}:{}),...(user.role==='admin'&&batchId?{batchId}:{})});
  return (
    <div className="business-stack">
      <Panel
        title={student?(weekly?'Báo cáo tuần gửi doanh nghiệp':'Báo cáo kết quả gửi nhà trường'):user.role==='admin'?'Quản lý kết quả báo cáo thực tập':'Báo cáo sinh viên phụ trách'}
        description={student?(weekly?'Tổng hợp công việc, kết quả, khó khăn và kế hoạch; gửi doanh nghiệp tiếp nhận.':'Nộp báo cáo cuối kỳ cho nhà trường và xem lại bài, trạng thái, phản hồi. Quy trình đánh giá của doanh nghiệp và giảng viên vẫn được giữ.'):'Doanh nghiệp và Giảng viên chấm điểm, nhận xét độc lập cho báo cáo sinh viên đã nộp.'}
      >
        {!student&&<Select label="Loại báo cáo cần xem" value={kind} onChange={setKind} options={[{value:'',label:'Tất cả loại báo cáo'},{value:'weekly',label:'Báo cáo tuần'},{value:'final',label:'Báo cáo cuối kỳ'}]}/>}
        <Select label="Trạng thái đánh giá báo cáo" value={state} onChange={setState} options={[{value:'',label:'Tất cả trạng thái'},{value:'submitted',label:'Đã nộp'},{value:'reviewed',label:'Đã có hai đánh giá'},{value:'need_revision',label:'Cần bổ sung'},{value:'approved',label:'Đã chốt kết quả'}]}/>
        {user.role==='admin'&&<Select label="Kỳ của báo cáo" value={batchId} onChange={setBatchId} options={[{value:'',label:'Tất cả kỳ'},...(batches.data?.items||[]).map(b=>({value:b._id,label:b.name}))]}/>}
        {!embedded&&<AssignmentPicker
          userRole={user.role}
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
              onClick={() => setModal({ type: 'submit' })}
            >
              {weekly?'Nộp báo cáo tuần':latestFinal.data?.items[0]?.state==='need_revision'?'Nộp lại báo cáo kết quả':'Nộp báo cáo kết quả'}
            </button>
            {!active(assignment) && (
              <p className="muted">Chọn phân công đang thực tập và còn thời gian để nộp báo cáo.</p>
            )}
            <ErrorNotice message={latestFinal.error}/>{finalLocked&&<p role="status">Đã nộp báo cáo cuối kỳ. Bạn có thể xem lại bài và phản hồi; chỉ nộp lại khi có yêu cầu bổ sung.</p>}
          </>
        )}
      </Panel>
      {message && <p role="status">{message}</p>}
      {user.role==='mentor'&&<Panel title="Báo cáo mẫu có nguồn công khai" description="Mở tài liệu gốc để tham khảo cách trình bày và đối chiếu thang chấm. Đây là tài liệu tham khảo, không phải bài nộp của sinh viên bạn phụ trách.">
        <ul>
          <li><strong>Xây dựng website MediaWiki cơ bản</strong><p>Vũ Minh Nguyên, 2023 · 35 trang · Giấy phép ghi công và chia sẻ tương tự được ghi trong tài liệu.</p><a className="btn btn-secondary" href="https://upload.wikimedia.org/wikipedia/commons/7/71/X%C3%A2y_d%E1%BB%B1ng_trang_web_MediaWiki_c%C6%A1_b%E1%BA%A3n_-_2023.pdf" target="_blank" rel="noopener noreferrer">Mở báo cáo mẫu về website</a></li>
          <li><strong>Báo cáo thực tập nhận thức về điều khiển LCD</strong><p>Nguyễn Anh Đức, Đại học Bách khoa Đà Nẵng, 2012 · Bản công khai tại Thư viện số HCMUTE · 10 trang.</p><a className="btn btn-secondary" href="https://thuvienso.hcmute.edu.vn/tailieu/2012/20121126/rklonely/baocao_ttnt_65.pdf" target="_blank" rel="noopener noreferrer">Mở báo cáo mẫu kỹ thuật</a></li>
        </ul>
        <p>Tài liệu mở trong thẻ mới. Điểm đánh giá sinh viên vẫn chỉ lưu cho đúng bài nộp trong danh sách bên dưới.</p>
      </Panel>}
      <Panel
        title={user.role==='student'?'Kết quả & nhận xét báo cáo':user.role==='admin'?'Duyệt kết quả báo cáo':'Chấm điểm & nhận xét báo cáo'}
        description="Mỗi bên chấm từ 0–100 và nhập nhận xét. Nhà trường chốt kết quả sau khi cả hai bên đồng ý."
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
                    {r.current ? 'Hiện hành' : 'Bản cũ'} · {displayLabel(r.kind)} · phiên bản
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
      {assignment && !embedded && !student && <Kpis key={assignment._id} assignment={assignment} user={user} />}
      {modal && (
        <MutationDialog
          title={
            modal.type === 'submit'
              ? 'Nộp báo cáo theo kỳ'
              : modal.type === 'review'
              ? `Chấm báo cáo · ${displayLabel(user.role)}`
              : modal.type==='view'?'Xem bài báo cáo':modal.type==='practice'?'Bài tập đánh giá báo cáo cuối kỳ':'Nhà trường chốt kết quả'
          }
          onClose={() => setModal(null)}
        >
          {modal.type==='practice'?<CompletedReportPractice report={modal.data}/>:modal.type==='view'?<article><h3>{modal.data.title}</h3><p>{displayLabel(modal.data.kind)} · Phiên bản {modal.data.version} · {displayLabel(modal.data.state)}</p><div className="business-content" style={{whiteSpace:'pre-wrap'}}>{modal.data.content}</div>{modal.data.selfAssessment&&<section><h4>Tự đánh giá của sinh viên</h4><p>{modal.data.selfAssessment}</p></section>}{modal.data.contentFeedback&&<details><summary>Nhận xét đối chiếu nội dung</summary>{modal.data.contentFeedback.criteria.map(c=><div key={c.id}><p>{c.comment}</p>{c.matches.map((m,i)=><blockquote key={i}>{m.quote}</blockquote>)}</div>)}</details>}{['student','mentor'].includes(user.role)&&<ReportAiEvaluation report={modal.data} user={user}/>}<ReportAttachments report={modal.data}/>{modal.data.kind==='final'&&<ReportEvidence key={modal.data._id} report={modal.data} user={user} unified={unified}/>}</article>:modal.type === 'submit' ? (
            <ReportForm assignment={assignment} fixedKind={student?studentKind:undefined} onSaved={saved} />
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

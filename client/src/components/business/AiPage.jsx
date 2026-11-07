import ReportAnalysisResult from './ReportAnalysisResult';
import RecommendationResults from './RecommendationResults';
import StudentMatchingForm from './StudentMatchingForm';
import MentorRubricProposal from './reports/MentorRubricProposal';
import { useState } from 'react';
import {useViewState,useViewMemory} from '../viewStateStore';
import { apiRequest } from '../../api/client';
import { Panel, Select, Text, ActionForm, ErrorNotice, MutationDialog } from './Shared';
import ReviewForm from './reports/ReviewForm';
import { useResource } from './hooks';

export default function AiPage({user,schoolWorkflow=false}) {
  const [engine,setEngine]=useViewState('engine','sbert'),[topK,setTopK]=useViewState('topK','5'),[jdId,setJdId]=useViewState('jdId',''),[reportId,setReportId]=useViewState('reportId',''),[result,setResult]=useViewMemory('analysisResult',null);
  const [statusRevision,setStatusRevision]=useState(0);
  const [reviewing,setReviewing]=useState(false);
  const [rubricOpen,setRubricOpen]=useState(false);
  const [reportSource,setReportSource]=useViewState('reportSource','submitted'),[reading,setReading]=useState(false);
  const status=useResource('/core/ai/status',statusRevision);
  const jds=useResource(schoolWorkflow?(user.role==='company'?'/core/school/opportunities?limit=100':user.role==='student'?'/core/my/internships':null):user.role==='company'?'/core/jds?mine=true&limit=50':'/core/jds?limit=1');
  const reportAnalysis=user.role==='mentor';
  const student=user.role==='student';
  const admittedInternship=schoolWorkflow&&student?jds.data?.items.find(e=>e._id===jdId&&e.admission?.state==='active'):null;
  const reports=useResource(reportAnalysis?'/core/reports?limit=50':null,statusRevision);
  const selectedReport=reports.data?.items.find(report=>report._id===reportId);
  const readingSample=useResource(reportAnalysis&&reportId&&reportSource==='sample'?'/core/reports/'+reportId+'/reading-sample':null);
  const readingDocument=reportSource==='sample'?(readingSample.data?.reportId===reportId?readingSample.data:null):selectedReport;
  const canReviewProposal=reportAnalysis&&result?.document?.source!=='sample'&&result?.reportId===reportId&&selectedReport?.current&&['submitted','reviewed'].includes(selectedReport.state)&&!selectedReport.reviews.some(review=>review.role===user.role);
  const matching=user.role==='student';
  const run=async path=>{setResult(null);const matching=path.endsWith('rank-applicants')||path.endsWith('/match');try{return await apiRequest(schoolWorkflow&&matching?path.replace('/core/ai/','/core/school/ai/'):path,{method:'POST',body:{engine,topK:Number(topK),...(reportAnalysis?{reportSource}:{}),...(matching?(schoolWorkflow?user.role==='company'?{opportunityId:jdId}:{enrollmentId:jdId}:user.role==='company'?{jdId}:{}):{})}});}finally{setStatusRevision(n=>n+1);}};
  if(!['student','mentor'].includes(user.role))return <Panel title="Công cụ theo vai trò"><p>Trang này dành cho sinh viên đối chiếu CV và giảng viên đọc báo cáo. Nhà trường dùng Gợi ý phân công; doanh nghiệp xét hồ sơ trong Hồ sơ ứng tuyển.</p></Panel>;
  return <div className="business-stack">
    {reportAnalysis&&<button type="button" className="btn btn-secondary" onClick={()=>setRubricOpen(true)}>Đề xuất yêu cầu đánh giá theo kỳ</button>}
    {rubricOpen&&<MutationDialog title="Rubric học thuật của giảng viên" onClose={()=>setRubricOpen(false)}><MentorRubricProposal onSaved={()=>setRubricOpen(false)}/></MutationDialog>}
    {schoolWorkflow&&student&&<StudentMatchingForm periods={jds} status={status} engine={engine} topK={topK} periodId={jdId} onEngine={setEngine} onTopK={setTopK} onPeriod={setJdId} onResult={setResult} admitted={admittedInternship} onSubmit={()=>run('/core/ai/match')}/>}
    {!(schoolWorkflow&&student)&&<Panel title={reportAnalysis?'Công cụ phân tích báo cáo thực tập':'Đối chiếu CV với yêu cầu đề tài'} description={reportAnalysis?'Phân tích nội dung báo cáo của sinh viên bạn phụ trách. Nội dung được xử lý nội bộ.':'Đối chiếu nội dung CV với yêu cầu đề tài. Nội dung được xử lý nội bộ.'}>
      <ErrorNotice message={status.error} /><p role="status">{status.loading?'Đang kiểm tra…':status.data?.sbert.ready?(reportAnalysis?'Công cụ đọc hiểu nội dung đã sẵn sàng':'Đối chiếu ngữ nghĩa đã sẵn sàng'):(reportAnalysis?'Công cụ đọc hiểu nội dung chưa sẵn sàng':'Đối chiếu ngữ nghĩa chưa sẵn sàng')}</p>
      <Select label={reportAnalysis?'Phương pháp đối chiếu báo cáo':'Phương pháp đối chiếu CV'} value={engine} onChange={v=>{setEngine(v);setResult(null);}} options={[{value:'sbert',label:reportAnalysis?'Đối chiếu ý nghĩa nội dung':'Đối chiếu ngữ nghĩa'},{value:'tfidf',label:reportAnalysis?'Đối chiếu từ ngữ trong báo cáo':'Đối chiếu từ khóa'},...(schoolWorkflow&&student?[{value:'compare',label:'So sánh từ khóa và ngữ nghĩa'}]:[])]} />
    </Panel>}
    {matching&&!(schoolWorkflow&&student)&&<Panel title={student?'Đề tài phù hợp với CV của tôi':'Xếp hạng ứng viên theo đề tài'} description={student?'Đối chiếu CV với tối đa 50 đề tài còn tuyển trong phạm vi kỳ thực tập.':'Đối chiếu tối đa 50 hồ sơ đã ứng tuyển vào đề tài của doanh nghiệp. Kết quả không tự loại ứng viên.'}>
      <ErrorNotice message={jds.error} /><ActionForm disabled={Boolean(admittedInternship)} submit={student?'Tìm đề tài phù hợp':'Xếp hạng ứng viên'} onSaved={setResult} onSubmit={()=>run(user.role==='student'?'/core/ai/match':'/core/ai/rank-applicants')}>
        <Text label={student?'Số đề tài hiển thị':'Số ứng viên hiển thị'} type="number" min="1" max="20" required value={topK} onChange={setTopK} />
        {user.role==='company'&&<Select label={schoolWorkflow?'Đề tài tuyển thực tập':'Tin tuyển thực tập'} required value={jdId} onChange={setJdId} options={[{value:'',label:schoolWorkflow?'Chọn đề tài của doanh nghiệp':'Chọn tin tuyển thực tập của doanh nghiệp'},...(jds.data?.items||[]).map(j=>({value:j._id,label:j.title}))]} />}
        {schoolWorkflow&&user.role==='student'&&<Select label="Kỳ thực tập của tôi" required value={jdId} onChange={id=>{setJdId(id);setResult(null);}} options={[{value:'',label:'Chọn kỳ thực tập'},...(jds.data?.items||[]).map(e=>({value:e._id,label:e.batch.name}))]}/>}
        {admittedInternship&&<div role="status"><strong>Bạn đã có đề tài trong kỳ này.</strong><p>{admittedInternship.admission.title} · {admittedInternship.admission.companyName}</p><p>Mở Kỳ thực tập của tôi để theo dõi phân công giảng viên và quá trình thực tập.</p></div>}
      </ActionForm>
    </Panel>}
    {reportAnalysis&&<Panel title="Báo cáo thực tập cần phân tích" description="Chỉ báo cáo của sinh viên bạn phụ trách; không chấm điểm hay kỷ luật tự động.">
      <ErrorNotice message={reports.error} /><ActionForm disabled={!selectedReport||(reportSource==='submitted'&&!['submitted','reviewed'].includes(selectedReport.state))||(reportSource==='sample'&&(!readingDocument||readingSample.loading||Boolean(readingSample.error)))} submit="Phân tích báo cáo" onSaved={setResult} onSubmit={()=>run('/core/ai/reports/'+reportId+'/analyze')}>
        <Select label="Báo cáo của sinh viên phụ trách" required value={reportId} onChange={id=>{setReportId(id);setResult(null);}} options={[{value:'',label:'Chọn báo cáo thực tập'},...(reports.data?.items||[]).map(r=>({value:r._id,label:r.title+' · v'+r.version}))]} />
        <Select label="Nội dung dùng để phân tích" value={reportSource} onChange={value=>{setReportSource(value);setResult(null);setReading(false);}} options={[{value:'submitted',label:'Bài báo cáo đã nộp'},{value:'sample',label:'Bài mẫu chi tiết theo đề tài'}]}/>
        {selectedReport&&reportSource==='submitted'&&!['submitted','reviewed'].includes(selectedReport.state)&&<p role="status">Bài đã chốt hoặc đang cần bổ sung. Bạn có thể đọc bài và xem kết quả đã lưu trong Báo cáo &amp; kết quả.</p>}<ErrorNotice message={readingSample.error}/>
        <button type="button" className="btn btn-secondary" disabled={!readingDocument} onClick={()=>setReading(true)}>Xem bài báo cáo</button>
        {readingDocument&&<p>{readingDocument.content.length.toLocaleString('vi-VN')} ký tự · {reportSource==='sample'?'Bài mẫu bổ sung':'Nội dung bài đã nộp'}</p>}
      </ActionForm>
    </Panel>}
    {result&&<Panel title={reportAnalysis?'Kết quả phân tích báo cáo':student?'Kết quả đối chiếu đề tài':'Kết quả xếp hạng ứng viên'}>
      {result.items?<RecommendationResults result={result} student={student}/>:<div data-testid="nlp-results">
        {reportAnalysis&&result.document&&<p role="status">Đang phân tích: {result.document.source==='sample'?'bài mẫu chi tiết, không phải bài nộp chính thức':'bài báo cáo đã nộp'} · {result.document.characters.toLocaleString('vi-VN')} ký tự.</p>}
        <ReportAnalysisResult result={result} sample={result.document?.source==='sample'} onReviewProposal={canReviewProposal?()=>setReviewing(true):null}/>
      </div>}
    </Panel>}
    {reviewing&&selectedReport&&<MutationDialog title="Kiểm tra điểm chấm trước" onClose={()=>setReviewing(false)}><ReviewForm data={{...selectedReport,__v:result?.reportInternalVersion??selectedReport.__v}} reviewerRole={user.role} proposal={{...result?.proposed_grading,analysisId:result?.analysisId}} onSaved={()=>{setReviewing(false);setResult(null);setStatusRevision(n=>n+1);}}/></MutationDialog>}
    {reading&&readingDocument&&<MutationDialog title={reportSource==='sample'?'Đọc bài mẫu chi tiết':'Đọc bài báo cáo đã nộp'} onClose={()=>setReading(false)}><article><h3>{readingDocument.title}</h3><div className="business-content" style={{whiteSpace:'pre-wrap'}}>{readingDocument.content}</div></article></MutationDialog>}
  </div>;
}

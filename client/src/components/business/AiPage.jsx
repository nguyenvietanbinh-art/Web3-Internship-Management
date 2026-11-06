import { displayLabel } from './content';
import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, Select, Text, ActionForm, ErrorNotice } from './Shared';
import { useResource } from './hooks';

export default function AiPage({user,schoolWorkflow=false}) {
  const [engine,setEngine]=useState('sbert'),[topK,setTopK]=useState('5'),[jdId,setJdId]=useState(''),[reportId,setReportId]=useState(''),[result,setResult]=useState(null);
  const [statusRevision,setStatusRevision]=useState(0);
  const status=useResource('/core/ai/status',statusRevision);
  const jds=useResource(schoolWorkflow?(user.role==='company'?'/core/school/opportunities?limit=100':user.role==='student'?'/core/my/internships':null):user.role==='company'?'/core/jds?mine=true&limit=50':'/core/jds?limit=1');
  const reports=useResource('/core/reports?limit=50');
  const matching=['student','company'].includes(user.role);
  const run=async path=>{setResult(null);const matching=path.endsWith('rank-applicants')||path.endsWith('/match');try{return await apiRequest(schoolWorkflow&&matching?path.replace('/core/ai/','/core/school/ai/'):path,{method:'POST',body:{engine,topK:Number(topK),...(matching?(schoolWorkflow?user.role==='company'?{opportunityId:jdId}:{enrollmentId:jdId}:user.role==='company'?{jdId}:{}):{})}});}finally{setStatusRevision(n=>n+1);}};
  return <div className="business-stack">
    <Panel title="Phân tích mức độ phù hợp" description="Nội dung CV và báo cáo được xử lý nội bộ, không gửi đến dịch vụ AI bên ngoài.">
      <ErrorNotice message={status.error} /><p role="status">{status.loading?'Đang kiểm tra…':status.data?.sbert.ready?'Sentence-BERT sẵn sàng':'Sentence-BERT chưa sẵn sàng'}</p>
      <details><summary>Giới hạn phân tích</summary><p>Độ tương đồng không phải xác suất tuyển dụng. Chưa có tập nhãn chuyên gia để công bố độ chính xác. Cảnh báo theo quy tắc không phải dự đoán của mô hình.</p></details>
      <Select label="Phương pháp phân tích" value={engine} onChange={v=>{setEngine(v);setResult(null);}} options={[{value:'sbert',label:'Sentence-BERT'},{value:'tfidf',label:'TF-IDF (đối chiếu từ khóa)'}]} />
    </Panel>
    {matching&&<Panel title={user.role==='student'?'Cơ hội phù hợp':'Xếp hạng ứng viên'} description="Tối đa50 ứng viên trong tập được phép. Không xét các CV ngoài ứng tuyển; không tự loại ứng viên.">
      <ErrorNotice message={jds.error} /><ActionForm submit="Phân tích độ phù hợp" onSaved={setResult} onSubmit={()=>run(user.role==='student'?'/core/ai/match':'/core/ai/rank-applicants')}>
        <Text label="Số kết quả" type="number" min="1" max="20" required value={topK} onChange={setTopK} />
        {user.role==='company'&&<Select label="Tin tuyển dụng" required value={jdId} onChange={setJdId} options={[{value:'',label:'Chọn JD của bạn'},...(jds.data?.items||[]).map(j=>({value:j._id,label:j.title}))]} />}
        {schoolWorkflow&&user.role==='student'&&<Select label="Kỳ được cấp để đối chiếu CV" required value={jdId} onChange={setJdId} options={[{value:'',label:'Chọn kỳ'},...(jds.data?.items||[]).map(e=>({value:e._id,label:e.batch.name}))]}/>}
      </ActionForm>
    </Panel>}
    {user.role!=='student'&&<Panel title="Phân tích báo cáo & yếu tố cần xem xét" description="Chỉ báo cáo trong phạm vi phụ trách; kết quả hỗ trợ người hướng dẫn, không chấm điểm hay kỷ luật tự động.">
      <ErrorNotice message={reports.error} /><ActionForm submit="Phân tích báo cáo" onSaved={setResult} onSubmit={()=>run('/core/ai/reports/'+reportId+'/analyze')}>
        <Select label="Báo cáo cần phân tích" required value={reportId} onChange={setReportId} options={[{value:'',label:'Chọn báo cáo được phép'},...(reports.data?.items||[]).map(r=>({value:r._id,label:r.title+' · v'+r.version}))]} />
      </ActionForm>
    </Panel>}
    {result&&<Panel title="Kết quả phân tích"><div data-testid="nlp-results">
      {result.items?<><p>Phương pháp: {result.engine} · Đã xét {result.candidate_count}/{result.catalog_total} hồ sơ. Độ tin cậy chưa được hiệu chuẩn.</p>{!result.items.length&&<p>Không có ứng viên hợp lệ để xếp hạng.</p>}<ol>{result.items.map(r=><li key={r.id}><strong>{r.title||r.id}</strong><p>Độ tương đồng: {r.cosine} · Kỹ năng phù hợp: {r.matched_skills.join(', ')||'chưa có'}</p><p>{r.explanation}</p>{r.coverage?.truncated&&<p className="is-error">Văn bản dài: chỉ xét {r.coverage.used_tokens}/{r.coverage.total_tokens} token.</p>}</li>)}</ol>{result.query_coverage?.truncated&&<p className="is-error">Nội dung quá dài; kết quả chưa bao phủ toàn bộ CV hoặc tin tuyển dụng.</p>}</>:<><p>Mức cảnh báo quy tắc: {displayLabel(result.rule_alert_level)}</p><ul>{result.rule_factors.map(f=><li key={f.code}>{f.description} ({f.observed})</li>)}</ul><p>Mô hình cảnh báo: {displayLabel(result.classifier.status)} · Chưa có độ tin cậy được xác minh</p><details><summary>Thông tin mô hình</summary><p>{result.classifier.reason}</p></details><p>Độ tương đồng với tiêu chí ({result.semantic_relevance?.engine||'không có tiêu chí'}): {result.semantic_relevance?.results[0]?.cosine??'chưa tính'}. Không phải dự đoán rủi ro.</p><p>{result.decision}</p></>}
    </div></Panel>}
  </div>;
}

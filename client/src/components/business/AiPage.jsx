import { useState } from 'react';
import { apiRequest } from '../../api/client';
import { Panel, Select, Text, ActionForm, ErrorNotice } from './Shared';
import { useResource } from './hooks';

export default function AiPage({user}) {
  const [engine,setEngine]=useState('sbert'),[topK,setTopK]=useState('5'),[jdId,setJdId]=useState(''),[reportId,setReportId]=useState(''),[result,setResult]=useState(null);
  const [statusRevision,setStatusRevision]=useState(0);
  const status=useResource('/core/ai/status',statusRevision);
  const jds=useResource(user.role==='company'?'/core/jds?mine=true&limit=50':'/core/jds?limit=1');
  const reports=useResource('/core/reports?limit=50');
  const matching=['student','company'].includes(user.role);
  const run=async path=>{setResult(null);try{return await apiRequest(path,{method:'POST',body:{engine,topK:Number(topK),...(user.role==='company'&&path.endsWith('rank-applicants')?{jdId}:{})}});}finally{setStatusRevision(n=>n+1);}};
  return <div className="business-stack">
    <Panel title="AI / NLP cục bộ" description="Chỉ phân tích khi bạn bấm nút. CV và báo cáo không gửi tới dịch vụ bên ngoài; không ghi database.">
      <ErrorNotice message={status.error} /><p role="status">{status.loading?'Đang kiểm tra service…':status.data?`SBERT: ${status.data.sbert.ready?'đã nạp mô hình':status.data.sbert.reason||'chưa nạp'} · classifier rủi ro: ${status.data.risk_classifier}`:'AI service chưa sẵn sàng.'}</p>
      <p className="muted">Cosine không phải xác suất tuyển dụng. Chưa có tập nhãn chuyên gia để công bố độ chính xác. Cảnh báo quy tắc không phải dự đoán classifier.</p>
      <Select label="Engine NLP" value={engine} onChange={v=>{setEngine(v);setResult(null);}} options={[{value:'sbert',label:'Sentence-BERT local (nếu đã cấu hình)'},{value:'tfidf',label:'TF-IDF baseline'}]} />
    </Panel>
    {matching&&<Panel title={user.role==='student'?'Top-K JD cho CV đã lưu':'Ranking hồ sơ đã ứng tuyển'} description="Tối đa50 ứng viên trong tập được phép. Không xét các CV ngoài ứng tuyển; không tự loại ứng viên.">
      <ErrorNotice message={jds.error} /><ActionForm submit="Phân tích matching" onSaved={setResult} onSubmit={()=>run(user.role==='student'?'/core/ai/match':'/core/ai/rank-applicants')}>
        <Text label="Top K NLP" type="number" min="1" max="20" required value={topK} onChange={setTopK} />
        {user.role==='company'&&<Select label="JD cần ranking" required value={jdId} onChange={setJdId} options={[{value:'',label:'Chọn JD của bạn'},...(jds.data?.items||[]).map(j=>({value:j._id,label:j.title}))]} />}
      </ActionForm>
    </Panel>}
    {user.role!=='student'&&<Panel title="Phân tích báo cáo & yếu tố cần xem xét" description="Chỉ báo cáo trong phạm vi phụ trách; kết quả hỗ trợ người hướng dẫn, không chấm điểm hay kỷ luật tự động.">
      <ErrorNotice message={reports.error} /><ActionForm submit="Phân tích báo cáo NLP" onSaved={setResult} onSubmit={()=>run('/core/ai/reports/'+reportId+'/analyze')}>
        <Select label="Báo cáo cần phân tích NLP" required value={reportId} onChange={setReportId} options={[{value:'',label:'Chọn báo cáo được phép'},...(reports.data?.items||[]).map(r=>({value:r._id,label:r.title+' · v'+r.version}))]} />
      </ActionForm>
    </Panel>}
    {result&&<Panel title="Kết quả phân tích thực tế"><div data-testid="nlp-results">
      {result.items?<><p>Engine: {result.engine} · {result.candidate_count}/{result.catalog_total} bản ghi trong tập xét · confidence: chưa hiệu chuẩn.</p>{!result.items.length&&<p>Không có ứng viên hợp lệ để xếp hạng.</p>}<ol>{result.items.map(r=><li key={r.id}><strong>{r.title||r.id}</strong><p>Cosine: {r.cosine} · Kỹ năng giao nhau: {r.matched_skills.join(', ')||'chưa có'}</p><p>{r.explanation}</p>{r.coverage?.truncated&&<p className="is-error">Văn bản dài: chỉ xét {r.coverage.used_tokens}/{r.coverage.total_tokens} token.</p>}</li>)}</ol>{result.query_coverage?.truncated&&<p className="is-error">Query vượt giới hạn token; kết quả không bao phủ toàn bộ CV/JD.</p>}</>:<><p>Mức cảnh báo quy tắc: {result.rule_alert_level}</p><ul>{result.rule_factors.map(f=><li key={f.code}>{f.code} ({f.observed}) — {f.description}</li>)}</ul><p>Classifier: {result.classifier.status} · confidence: chưa có</p><p>{result.classifier.reason}</p><p>Semantic relevance ({result.semantic_relevance?.engine||'không có tiêu chí'}): {result.semantic_relevance?.results[0]?.cosine??'chưa tính'}. Không phải dự đoán rủi ro.</p><p>{result.decision}</p></>}
    </div></Panel>}
  </div>;
}

import ReportEvidenceChecks from './ReportEvidenceChecks';
import {AiGradeTable} from './ReportAiEvaluation';
import { useState } from 'react';
import { apiRequest } from '../../../api/client';
import { ActionForm, Text, Area, Select } from '../Shared';
import { REPORT_DECISIONS } from './reportDecisions';
import { REPORT_RUBRIC, rubricTotal, rubricComment } from './gradingRubric.mjs';
export default function ReviewForm({ data, approve, onSaved, reviewerRole, proposal, practice=false }) {
  const [current,setCurrent]=useState(data),[analysis,setAnalysis]=useState(null),[analyzing,setAnalyzing]=useState(false),[analysisError,setAnalysisError]=useState('');
  const previous=current.evaluationHistory?.at(-1),initialDraft=data.reviewDrafts?.at(-1);
  const currentProposal=analysis?.proposed_grading||proposal||previous?.proposedGrading;
  const analysisId=analysis?.analysisId||proposal?.analysisId||previous?.id;
  const criteria=currentProposal?.rubric?.criteria||previous?.rubric?.criteria||REPORT_RUBRIC;
  const rubric=!approve&&reviewerRole==='mentor';
  const proposed=rubric&&currentProposal?.status==='PROPOSED_NOT_APPROVED';
  const [scores,setScores]=useState(()=>initialDraft?Object.fromEntries(initialDraft.scores.map(c=>[c.id,String(c.score)])):proposed?Object.fromEntries(currentProposal.criteria.map(item=>[item.id,String(item.score)])):{}),[notes,setNotes]=useState(()=>initialDraft?Object.fromEntries(initialDraft.scores.map(c=>[c.id,c.comment])):proposed?Object.fromEntries(currentProposal.criteria.map(item=>[item.id,item.basis.slice(0,250)])):{});
  let total=null;
  if(rubric){try{total=rubricTotal(scores,criteria);}catch{/* The teacher has not completed all criteria yet. */}}
  const [score, setScore] = useState(''),
    [comment, setComment] = useState(()=>initialDraft?initialDraft.comment:proposed?'Nhận xét chấm trước: '+currentProposal.summary+'\nCần kiểm tra: '+currentProposal.limitations.join(' '):''),
    [decision, setDecision] = useState('approved');
  return <>
    {rubric&&!practice&&analysis?.proposed_grading?.rubric&&<details><summary>Kiểm tra bằng chứng để tính điểm đề xuất</summary><ReportEvidenceChecks key={current.__v} data={current} rubric={analysis.proposed_grading.rubric} semantic={analysis.criterion_evidence} onSaved={saved=>{setCurrent(saved);setAnalysis(null);setScores({});setAnalysisError('Đã lưu căn cứ. Nhấn phân tích lại để cập nhật điểm đề xuất.');}}/></details>}
    <ActionForm
      disabled={analyzing}
      submit={practice?'Hoàn tất phiếu chấm thử':approve ? 'Chốt kết quả' : 'Lưu đánh giá báo cáo'}
      onSaved={onSaved}
      onSubmit={() => {
        const body=approve?{reason:comment,version:current.__v}:{score:rubric?rubricTotal(scores,criteria):Number(score),comment:rubric?rubricComment(scores,notes,comment,criteria):comment,decision,version:current.__v};
        if(practice)return Promise.resolve({...body,official:false});
        if(rubric&&analysisId)body.comment=comment;
        if(rubric&&analysisId)body.grading={analysisId,scores:criteria.map(c=>({id:c.id,score:Number(scores[c.id]),comment:notes[c.id]||comment})),adjustmentReason:comment};
        return apiRequest('/core/reports/' + data._id + (approve ? '/approve' : '/reviews'), {
          method: 'POST',
          body,
        })
      }}
    >
      <strong>{data.title}</strong>
      {rubric&&!practice&&<button type="button" className="btn btn-secondary" disabled={analyzing} onClick={async()=>{if(!comment.trim()){setAnalysisError('Nhập phần cần bổ sung trong ô nhận xét trước khi gửi yêu cầu.');return;}setAnalyzing(true);setAnalysisError('');try{const saved=await apiRequest('/core/reports/'+data._id+'/request-revision',{method:'POST',body:{version:current.__v,reason:comment}});onSaved(saved);}catch(e){setAnalysisError(e.message);}finally{setAnalyzing(false);}}}>Yêu cầu bổ sung, chưa chấm điểm</button>}
      {rubric&&currentProposal&&<><AiGradeTable proposal={currentProposal} selfGrading={data.selfGrading} mentorScores={criteria.filter(c=>scores[c.id]!==undefined&&scores[c.id]!=='').map(c=>({id:c.id,score:Number(scores[c.id])}))}/><button type="button" className="btn btn-secondary" disabled={analyzing||currentProposal.total===null} onClick={()=>{setScores(Object.fromEntries(currentProposal.criteria.map(c=>[c.id,String(c.score)])));setNotes(Object.fromEntries(currentProposal.criteria.map(c=>[c.id,c.basis.slice(0,250)])));}}>Dùng điểm AI đề xuất để kiểm tra</button></>}
      {rubric&&!practice&&<button type="button" className="btn btn-secondary" disabled={analyzing} onClick={async event=>{const form=event.currentTarget.closest('form');setAnalyzing(true);setAnalysisError('');try{const saved=await apiRequest('/core/reports/'+data._id+'/review-draft',{method:'PUT',body:{version:current.__v,scores:criteria.filter(c=>String(scores[c.id]??'').trim()!=='').map(c=>({id:c.id,score:Number(scores[c.id]),comment:notes[c.id]||''})),comment}});setCurrent(saved);if(form)form.dataset.unsaved='false';setAnalysisError('Đã lưu nháp đánh giá; chưa công bố điểm.');}catch(e){setAnalysisError(e.message);}finally{setAnalyzing(false);}}}>Lưu nháp đánh giá</button>}
      {rubric&&!practice&&<div className="business-stack"><button type="button" className="btn btn-secondary" disabled={analyzing} onClick={async()=>{setAnalyzing(true);setAnalysisError('');try{const result=await apiRequest('/core/ai/reports/'+data._id+'/analyze',{method:'POST',body:{engine:'sbert'}});setAnalysis(result);setCurrent(c=>({...c,__v:result.reportInternalVersion??c.__v}));setScores(Object.fromEntries(result.proposed_grading.criteria.filter(c=>c.score!==null).map(c=>[c.id,String(c.score)])));setNotes(Object.fromEntries(result.proposed_grading.criteria.map(c=>[c.id,c.basis.slice(0,250)])));}catch(e){setAnalysisError(e.message);}finally{setAnalyzing(false);}}}>{analyzing?'Đang đối chiếu báo cáo…':'Phân tích báo cáo trước khi chấm'}</button>{analysisError&&<p className="is-error" role="alert">{analysisError}</p>}{currentProposal&&<p>{currentProposal.total===null?'Chưa đủ cơ sở đề xuất tổng điểm':`Điểm đề xuất: ${currentProposal.total}/100`}</p>}</div>}
      {proposed&&<p>Đã điền điểm đề xuất. Bạn có thể sửa từng điểm và nhận xét trước khi xác nhận; kết quả này chưa được lưu.</p>}
      <details>
        <summary>Đọc nội dung báo cáo</summary>
        <pre className="business-content">{data.content}</pre>
      </details>
      {!approve && (
        <>
          {rubric?<>
            <p>Chấm theo nội dung báo cáo và bằng chứng đã kiểm tra. Nếu chưa đủ căn cứ, hãy xem thêm sản phẩm hoặc trao đổi với sinh viên trước khi nhập điểm.</p>
            <details><summary>Hướng dẫn cho điểm</summary><p>Tốt: 85–100% điểm tiêu chí. Đạt: 65–84%. Cần bổ sung: 40–64%. Chưa đạt: dưới 40%. Chọn điểm cụ thể dựa trên mức đáp ứng và bằng chứng của từng mục.</p></details>
            {criteria.map(item=><fieldset key={item.id} className="business-panel"><legend>{item.label} — tối đa {item.max} điểm</legend><p>{item.hint}</p><Text label={`Điểm: ${item.label}`} required type="number" min="0" max={item.max} step="0.01" value={scores[item.id]||''} onChange={v=>setScores(s=>({...s,[item.id]:v}))}/><Area label={`Căn cứ hoặc phần cần bổ sung: ${item.label}`} maxLength={250} value={notes[item.id]||''} onChange={v=>setNotes(s=>({...s,[item.id]:v}))}/></fieldset>)}
            <p role="status"><strong>{total===null?'Chưa nhập đủ điểm các tiêu chí':`Tổng điểm: ${total}/100 · Quy đổi: ${(total/10).toFixed(2)}/10`}</strong></p>
          </>:<Text
            label="Điểm báo cáo (0–100)"
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={score}
            onChange={setScore}
          />}
          <Select
            label="Kết quả đánh giá báo cáo"
            value={decision}
            onChange={setDecision}
            options={REPORT_DECISIONS}
          />
          {decision !== 'approved' && (
            <p className="muted">
              {decision === 'incorrect'
                ? 'Ghi rõ nội dung sai trong nhận xét. Sinh viên cần nộp phiên bản báo cáo mới.'
                : 'Ghi rõ phần cần chỉnh sửa. Sinh viên cần chỉnh lại và nộp phiên bản mới.'}
            </p>
          )}
        </>
      )}
      <Area
        label={approve ? 'Lý do chốt kết quả' : 'Nhận xét báo cáo theo kỳ'}
        required
        maxLength={approve ? 2000 : rubric?1500:5000}
        value={comment}
        onChange={setComment}
      />
      {practice?<p className="muted">Phiếu chấm thử chỉ hiển thị tại đây và có thể xuất thành file. Điểm báo cáo đã duyệt không bị thay đổi.</p>:<p className="muted">
        Nhà trường chốt sau khi doanh nghiệp và giảng viên đồng ý, theo quy định điểm đã công bố cho kỳ thực tập.
      </p>}
      {rubric&&!practice&&analysisId&&<label className="business-field"><span><input type="checkbox" required/> Tôi đã kiểm tra nội dung, bằng chứng và các điểm đề xuất trước khi lưu đánh giá.</span></label>}
    </ActionForm>
  </>;
}

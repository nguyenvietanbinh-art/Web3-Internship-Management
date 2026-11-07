import {AiGradeTable} from './reports/ReportAiEvaluation';
export default function ReportAnalysisResult({result,onReviewProposal,sample=false}) {
  const classifier=result.classifier,semantic=result.semantic_relevance;
  const coverage=semantic?.results?.[0]?.coverage;
  const experimental=classifier.status==='EXPERIMENTAL_SYNTHETIC';
  const prediction={needs_support:'Nên trao đổi thêm với sinh viên để làm rõ khó khăn và phần cần hỗ trợ.',on_track:'Chưa có nhận xét cần hỗ trợ thêm. Giảng viên vẫn cần đọc và kiểm tra báo cáo.'}[classifier.risk_prediction];
  const descriptions={OVERDUE_TASKS:'Có công việc chưa hoàn thành và đã quá hạn.',MISSING_CHECKOUT:'Có phiên giờ làm chưa kết thúc hoặc đang cần điều chỉnh. Hãy đối chiếu với doanh nghiệp.',NO_APPROVED_HOURS:'Chưa có giờ làm được duyệt. Cần kiểm tra việc xác nhận giờ trước khi nhận xét về quá trình thực tập.'};
  return <>
    {result.proposed_grading?.scoringEngineVersion&&<AiGradeTable proposal={result.proposed_grading} selfGrading={result.selfGrading}/>}
    {result.proposed_grading&&!result.proposed_grading.scoringEngineVersion&&<section className="business-panel">
      <h3>{result.proposed_grading.total===null?'Chưa đủ cơ sở đánh giá':`Điểm chấm trước: ${result.proposed_grading.total}/100`}</h3>
      <p>{result.proposed_grading.summary}</p>
      <table className="business-table"><thead><tr><th scope="col">Tiêu chí</th><th scope="col">Điểm đề xuất</th><th scope="col">Căn cứ chấm trước</th></tr></thead><tbody>{result.proposed_grading.criteria.map(item=><tr key={item.id}><th scope="row">{item.label}</th><td>{item.score===null?'Chưa đủ căn cứ':item.score+'/'+item.max}</td><td>{item.basis}</td></tr>)}</tbody></table>
      <ul>{result.proposed_grading.limitations.map(note=><li key={note}>{note}</li>)}</ul>
      {onReviewProposal?<button type="button" className="btn btn-primary" onClick={onReviewProposal}>Kiểm tra và xác nhận điểm</button>:<p>{sample?'Đây là điểm tham khảo của bài mẫu bổ sung, không được lưu vào bài nộp hoặc điểm đã chốt.':'Điểm đề xuất chỉ để tham khảo; bài chưa ở trạng thái cho phép bạn lưu đánh giá mới.'}</p>}
    </section>}
    {result.proposed_grading?.scoringEngineVersion&&onReviewProposal&&<button type="button" className="btn btn-primary" onClick={onReviewProposal}>Kiểm tra và xác nhận điểm</button>}
    {result.criterion_evidence&&<details><summary>Trích đoạn theo tiêu chí</summary>{result.criterion_evidence.criteria.map(c=><article key={c.id}><h4>{result.proposed_grading.criteria.find(r=>r.id===c.id)?.label}</h4><p>{c.comment}</p>{c.matches.map((m,i)=><blockquote key={i}>{m.quote}</blockquote>)}</article>)}{result.criterion_evidence.coverage.truncated&&<p>Nội dung dài; chưa đối chiếu hết toàn bộ báo cáo.</p>}</details>}
    <h3>Tiến độ cần xem xét</h3>
    <p>{result.rule_factors.length?'Có thông tin cần đối chiếu trước khi đánh giá.':'Chưa ghi nhận vấn đề từ công việc và giờ làm đang được theo dõi. Điều này chưa đủ để kết luận báo cáo đạt yêu cầu.'}</p>
    {result.rule_factors.length>0&&<ul>{result.rule_factors.map(f=><li key={f.code}>{descriptions[f.code]||f.description}</li>)}</ul>}
    <h3>Nhận xét tham khảo</h3>
    {experimental&&prediction?<p role="status">{prediction}</p>:<p role="status">{classifier.status==='UNAVAILABLE'?'Chưa lấy được nhận xét. Bạn vẫn có thể đọc và chấm báo cáo.':'Chưa có nhận xét bổ sung. Bạn có thể đọc và chấm báo cáo trực tiếp.'}</p>}
    <h3>Nội dung và yêu cầu đề tài</h3>
    <p>{semantic?'Đã đối chiếu nội dung báo cáo với các yêu cầu công việc. Kết quả chỉ giúp định hướng phần cần đọc lại, không thay thế việc kiểm tra sản phẩm và bằng chứng.':'Chưa đối chiếu được nội dung với yêu cầu đề tài. Hãy kiểm tra thủ công các mục sinh viên đã trình bày.'}</p>
    {coverage?.truncated&&<p className="is-error">Báo cáo dài nên công cụ chưa đọc hết toàn bộ nội dung. Bạn cần mở và đọc đủ báo cáo trước khi nhận xét.</p>}
    <h3>Cách hoàn tất đánh giá</h3>
    <p>Mở Báo cáo &amp; kết quả, chọn Chấm điểm / nhận xét. Chấm lần lượt mục tiêu, cách thực hiện, kết quả, bằng chứng, tiến độ, bài học và cách trình bày. Ghi rõ phần làm được và phần cần bổ sung; điểm chỉ được lưu khi bạn xác nhận.</p>
  </>;
}

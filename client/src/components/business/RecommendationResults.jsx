import {useState} from 'react';
import {useViewState} from '../viewStateStore';
import {Select} from './Shared';
import MatchingDetails from './MatchingDetails';
const names={tfidf:'Đối chiếu từ khóa',sbert:'Đối chiếu ngữ nghĩa',compare:'So sánh từ khóa và ngữ nghĩa'};
const raw=r=>r?.raw_cosine??r?.cosine;
function Card({item,engine,order,index}){
 const [expanded,setExpanded]=useState(false),selected=engine==='compare'?item.comparison?.[order]:item,value=raw(selected),rank=engine==='compare'?selected?.rank:item.rank||index+1;
 return <article className="recommendation-card" data-testid="recommendation-card" data-opportunity-id={item.id} data-score={value} data-rank={rank}>
  <div className="recommendation-heading"><span className="recommendation-rank" aria-label={'Thứ hạng '+rank}>#{rank}</span><div><h3>{item.title}</h3><p className="muted">{item.company_name||'Chưa khai báo doanh nghiệp'}</p></div></div>
  {engine==='compare'&&<div className="recommendation-comparison">{['tfidf','sbert'].map(method=><p key={method}>{names[method]}: <span data-method={method}>Hạng {item.comparison?.[method]?.rank??'ngoài tập xếp hạng'}</span></p>)}<p>Thay đổi hạng khi đối chiếu ngữ nghĩa: {item.comparison.rank_delta_tfidf_to_sbert==null?'Chưa đủ thứ hạng để đối chiếu':item.comparison.rank_delta_tfidf_to_sbert>0?'↑ '+item.comparison.rank_delta_tfidf_to_sbert:item.comparison.rank_delta_tfidf_to_sbert<0?'↓ '+Math.abs(item.comparison.rank_delta_tfidf_to_sbert):'Không đổi'}</p></div>}
  <p><strong>{item.requirements_declared?`${item.skill_match_count}/${item.required_skill_count} kỹ năng đáp ứng`:'Chưa có yêu cầu kỹ năng'}</strong></p>
  <p>Kỹ năng phù hợp: {item.matched_skills?.join(', ')||'Chưa tìm thấy'}</p>
  <p>Kỹ năng cần bổ sung: {item.requirements_declared?(item.missing_required_skills?.join(', ')||'Không thiếu theo danh sách khai báo'):'Chưa thể đối chiếu'}</p>
  <button type="button" className="btn btn-secondary" aria-expanded={expanded} aria-controls={'matching-detail-'+item.id} onClick={()=>setExpanded(v=>!v)}>{expanded?'Thu gọn':'Xem chi tiết'}</button>
  {expanded&&<div id={'matching-detail-'+item.id} className="recommendation-detail"><MatchingDetails item={item}/>{item.description&&<><h4>Yêu cầu công việc</h4><p className="business-content" style={{whiteSpace:'pre-wrap'}}>{item.description}</p></>}{item.duplicate_content_count>1&&<p>Có {item.duplicate_content_count} cơ hội trong tập đã xét dùng cùng mô tả và yêu cầu kỹ năng; điểm gần nhau có thể phản ánh nội dung giống nhau.</p>}</div>}
  {item.coverage?.truncated&&<p className="is-error">Mô tả dài: kết quả chưa bao phủ toàn bộ nội dung yêu cầu.</p>}
 </article>;
}
export default function RecommendationResults({result,student}){
 const [order,setOrder]=useViewState('comparisonOrder','sbert'),compare=result.engine==='compare';
 const items=compare?[...result.items].filter(r=>r.comparison?.[order]?.rank!=null&&r.comparison[order].rank<=result.comparison.requested_top_k).sort((a,b)=>a.comparison[order].rank-b.comparison[order].rank):result.items;
 return <div data-testid="nlp-results" data-engine={result.engine}>
  {result.inference_performed!==false&&<p>Phương pháp: {names[result.engine]||result.engine} · Đã xét {result.candidate_count}/{result.catalog_total} {student?'đề tài':'hồ sơ'}.</p>}
  {compare&&<><Select label="Sắp xếp kết quả so sánh theo" value={order} onChange={setOrder} options={[{value:'sbert',label:'Thứ hạng theo ngữ nghĩa'},{value:'tfidf',label:'Thứ hạng theo từ khóa'}]}/><p className="muted">So sánh thứ hạng đề tài theo từ khóa và ngữ nghĩa.</p></>}
  {!items.length&&<p>{result.reason==='ALREADY_ADMITTED'?'Bạn đã có đề tài trong kỳ này. Mở Kỳ thực tập của tôi để theo dõi quá trình thực tập.':'Chưa có đề tài còn tuyển với đủ thông tin trong phạm vi kỳ đang chọn. Đây không phải kết luận CV không phù hợp.'}</p>}
  {result.excluded_insufficient_job_content>0&&<p role="status">Có {result.excluded_insufficient_job_content} đề tài thiếu mô tả và yêu cầu kỹ năng nên chưa được đối chiếu.</p>}
  <div className="recommendation-grid">{items.map((item,index)=><Card key={item.id} item={item} engine={result.engine} order={order} index={index}/>)}</div>
  {result.query_coverage?.truncated&&<p className="is-error">CV quá dài; kết quả chưa bao phủ toàn bộ nội dung.</p>}
  {items.length>0&&<><p className="muted">Điểm đối chiếu phản ánh mức độ phù hợp của nội dung CV và yêu cầu công việc, không phải xác suất trúng tuyển.</p><details><summary>Cách đọc đối chiếu kỹ năng</summary><p>Trùng khớp và tên tương đương được tính vào số kỹ năng đáp ứng. Kỹ năng có liên quan vẫn cần bổ sung bằng chứng trực tiếp, không được xem là đã thành thạo. Các thông tin lấy từ CV và yêu cầu đã khai báo; không tự xác minh kinh nghiệm hoặc phẩm chất. Chưa có đánh giá độc lập để công bố độ chính xác trên người thật.</p>{compare&&result.candidate_count>result.comparison.ranked_pool_limit&&<p>Chỉ biết thứ hạng trong tập kết quả mỗi phương pháp trả về; ngoài phạm vi này không tự gán thứ hạng hoặc chênh lệch.</p>}</details></>}
 </div>;
}

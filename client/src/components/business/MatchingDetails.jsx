import {cvDisplayText} from './cvPresentation';
export default function MatchingDetails({item}) {
  const declared=item.requirements_declared??false;
  return <>
    {declared?<>
      <p>Yêu cầu của đề tài: {item.required_skills.join(', ')}.</p>
      {!item.skill_catalog_version&&<p>Chạy đối chiếu lại để cập nhật phân loại kỹ năng chi tiết.</p>}
      {item.skill_catalog_version&&<div className="table-scroll"><table><thead><tr><th>Loại đối chiếu</th><th>Yêu cầu ← CV</th></tr></thead><tbody>
       <tr><th>Trùng khớp</th><td>{item.exact_matches?.map(m=>`${m.required} ← ${m.declared}`).join('; ')||'Chưa có'}</td></tr>
       <tr><th>Tương đương</th><td>{item.equivalent_matches?.map(m=>`${m.required} ← ${m.declared}`).join('; ')||'Chưa có'}</td></tr>
       <tr><th>Có liên quan</th><td>{item.related_matches?.map(m=>`${m.required} ← ${m.declared}`).join('; ')||'Chưa có'}</td></tr>
       <tr><th>Chưa có bằng chứng trực tiếp</th><td>{item.no_direct_evidence_skills?.join(', ')||'Không thiếu theo danh sách khai báo'}</td></tr>
      </tbody></table></div>}
    </>:<p>Đề tài chưa khai báo danh sách kỹ năng yêu cầu, nên chưa thể đối chiếu từng kỹ năng.</p>}
    {item.cv_evidence&&<details><summary>Căn cứ từ CV đã nộp</summary><p>Điểm học tập: {item.cv_evidence.gpa==null?'Chưa khai báo':`${item.cv_evidence.gpa}/4`}. Điểm học tập không được dùng để tự loại ứng viên.</p><p>Học vấn: {cvDisplayText(item.cv_evidence.education)||'Chưa khai báo'}</p><p>Kinh nghiệm/đồ án: {cvDisplayText(item.cv_evidence.experience)||'Chưa khai báo'}</p><p>Nội dung do ứng viên khai báo, chưa thay thế bước phỏng vấn hoặc kiểm tra sản phẩm.</p></details>}
  </>;
}

import {Dialog} from '../ui';
import {cvDisplayText} from './cvPresentation';

export default function SubmittedCvDialog({application,onClose}) {
 const cv=application.cvSnapshot;
 return <Dialog label="CV đã nộp" onClose={onClose}>
  <div className="modal-content">
   <h2>CV đã nộp</h2>
   <p><strong>{application.studentName}</strong></p>
   <p className="muted">Đề tài: {application.title}</p>
   {!cv?<p>Chưa có thông tin CV trong hồ sơ này.</p>:<>
    <h3>{cv.title||'Thông tin CV'}</h3>
    {[['Tóm tắt',cv.summary],['Kỹ năng',cv.skills?.join(', ')],['Trường đại học',cv.university],['GPA',cv.gpa==null?null:`${cv.gpa}/4`],['Học vấn',cv.education],['Kinh nghiệm / dự án',cv.experience]].map(([label,value])=><section key={label}>
     <h4>{label}</h4><p className="business-content" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{cvDisplayText(value)||'Chưa khai báo'}</p>
    </section>)}
    {cv.extractedText&&<section><h4>Nội dung tệp CV</h4><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{cvDisplayText(cv.extractedText)}</p></section>}
   </>}
   <button type="button" className="btn btn-secondary" onClick={onClose}>Đóng</button>
  </div>
 </Dialog>;
}

import MyCertificates from '../MyCertificates';
import {OverviewProfile} from '../ProfileCv';
import {useResource} from '../hooks';
import {Panel} from '../Shared';
import {Resource} from './common';
export default function StudentOverview({user,internships,loading,error,onProfileSaved}){
 const placements=useResource('/core/placements?limit=100');
 return <div className="business-stack"><MyCertificates/><OverviewProfile user={user} onProfileSaved={onProfileSaved}/>
 <Panel title="Thực tập của tôi"><Resource state={{loading:loading||placements.loading,error:error||placements.error}}>{(internships||[]).map(e=>{const p=placements.data?.items.find(a=>a.enrollmentId===e._id);return <div key={e._id} className="business-panel"><h3>{e.batch?.name}</h3><p>{e.admission?.state==='active'?e.admission.title:'Chưa có đề tài tiếp nhận'}</p><p>Doanh nghiệp: {e.admission?.state==='active'?e.admission.companyName:'Chưa có'}</p><p>Giảng viên: {p?.participantNames?.mentor||'Chờ nhà trường phân công'}</p><p>{e.registeredAt?'Đã đăng ký tham gia':'Chưa đăng ký tham gia'} · {p?.lifecycle==='completed'?'Đã hoàn thành thực tập':p?.lifecycle==='active'?'Đang thực tập':e.assignmentId?'Đã được phân công':'Chưa có phân công chính thức'}</p></div>;})}{!internships?.length&&<p>Nhà trường chưa cấp kỳ thực tập cho bạn.</p>}</Resource></Panel>
 </div>;
}

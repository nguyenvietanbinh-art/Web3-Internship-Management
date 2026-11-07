import { EmptyState } from '../ui';
import { ProfilePage,CvPage } from './ProfileCv';
import { JdPage,ApplicationsPage } from './Recruitment';
import AccountsPage from './Accounts';
import PlacementsPage from './Placements';
import WorkPage from './Work';
import TimePage from './Time';
import ReportsPage from './Reports';
import AiPage from './AiPage';
import AdminPage from './workflow/AdminPage';
import ApplicationInbox from './workflow/ApplicationInbox';
import MyInternship from './workflow/MyInternship';
import {ApplicantPage,ScopedStudents,OpportunityPage} from './workflow/CompanyPages';
const Web3Page=lazy(()=>import('./Web3Page'));
import { lazy, Suspense } from 'react';

const access={profile:['student','company','mentor','admin'],cv:['student'],jds:['student','company','mentor','admin'],applications:['student','company','admin'],accounts:['admin'],placements:['student','company','mentor','admin'],work:['student','company','mentor','admin'],time:['student','company','mentor','admin'],reports:['student','company','mentor','admin']};
export default function CoreBusinessView({view,user,onProfileSaved,unified=false,schoolWorkflow=false,onNavigate}) {
  const page=view.replace('core-','');
  if(schoolWorkflow){
    if(page==='school-applications')return user?.role==='admin'?<div className="business-page"><ApplicationInbox/></div>:<EmptyState error title="Không có quyền truy cập trang này"/>;
    const special={placements:['admin'], 'my-internship':['student'], 'company-students':['company'], 'mentor-students':['mentor'], 'company-applicants':['company'], 'company-opportunities':['company']};
    if(['jds','applications'].includes(page))return <EmptyState title="Chức năng đang chuyển sang quy trình theo kỳ">Hãy sử dụng các mục nghiệp vụ theo phạm vi trong menu.</EmptyState>;
    if(page==='ai')return user&&['student','mentor'].includes(user.role)?<AiPage user={user} schoolWorkflow/>:<EmptyState title="Cần đăng nhập"/>;
    if(special[page]){
      if(!special[page].includes(user?.role))return <EmptyState error title="Không có quyền truy cập trang này"/>;
      const workflowViews={placements:<AdminPage/>, 'my-internship':<MyInternship user={user}/>, 'company-students':<ScopedStudents user={user}/>, 'mentor-students':<ScopedStudents user={user}/>, 'company-applicants':<ApplicantPage/>, 'company-opportunities':<OpportunityPage/>};
      return <div className="business-page">{workflowViews[page]}</div>;
    }
  }
  if(!unified&&user&&!user.walletAddress&&page!=='profile')return <EmptyState title="Cần liên kết ví">Mở Hồ sơ cá nhân để liên kết ví bằng chữ ký trước khi sử dụng nghiệp vụ này.</EmptyState>;
  if(page==='web3')return user?<Suspense fallback={<p>Đang tải Web3…</p>}><Web3Page key={user._id} user={user} unified={unified} onWalletSettings={()=>onNavigate('core-profile')} /></Suspense>:<EmptyState error title="Cần xác thực tài khoản" />;
  if(page==='ai')return user&&['student','mentor'].includes(user.role)?<AiPage key={user._id} user={user} />:<EmptyState error title="Cần xác thực tài khoản" />;
  if(!user||!access[page]?.includes(user.role))return <EmptyState error title="Không có quyền truy cập trang này">Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này.</EmptyState>;
  const views={profile:<ProfilePage user={user} onProfileSaved={onProfileSaved} />,cv:<CvPage />,jds:<JdPage user={user} />,applications:<ApplicationsPage user={user} />,accounts:<AccountsPage user={user} unified={unified} />,placements:<PlacementsPage user={user} unified={unified} />,work:<WorkPage user={user} schoolWorkflow={schoolWorkflow}/>,time:<TimePage user={user} />,reports:<ReportsPage user={user} unified={unified} />};
  return <div className="business-page">{views[page]}</div>;
}

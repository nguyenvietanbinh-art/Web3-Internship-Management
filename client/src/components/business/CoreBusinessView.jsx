import { EmptyState } from '../ui';
import { ProfilePage,CvPage } from './ProfileCv';
import { JdPage,ApplicationsPage } from './Recruitment';
import AccountsPage from './Accounts';
import PlacementsPage from './Placements';
import WorkPage from './Work';
import TimePage from './Time';
import ReportsPage from './Reports';
import AiPage from './AiPage';
const Web3Page=lazy(()=>import('./Web3Page'));
import { lazy, Suspense } from 'react';

const access={profile:['student','company','mentor','admin'],cv:['student'],jds:['student','company','mentor','admin'],applications:['student','company','admin'],accounts:['admin'],placements:['student','company','mentor','admin'],work:['student','company','mentor','admin'],time:['student','company','mentor','admin'],reports:['student','company','mentor','admin']};
export default function CoreBusinessView({view,user,onProfileSaved,unified=false,onNavigate}) {
  const page=view.replace('core-','');
  if(!unified&&user&&!user.walletAddress&&page!=='profile')return <EmptyState title="Cần liên kết ví">Mở Hồ sơ cá nhân để liên kết ví bằng chữ ký trước khi sử dụng nghiệp vụ này.</EmptyState>;
  if(page==='web3')return user?<Suspense fallback={<p>Đang tải Web3…</p>}><Web3Page key={user._id} user={user} unified={unified} onWalletSettings={()=>onNavigate('core-profile')} /></Suspense>:<EmptyState error title="Cần xác thực tài khoản" />;
  if(page==='ai')return user?<AiPage key={user._id} user={user} />:<EmptyState error title="Cần xác thực tài khoản" />;
  if(!user||!access[page]?.includes(user.role))return <EmptyState error title="Không có quyền truy cập trang này">Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này.</EmptyState>;
  const views={profile:<ProfilePage user={user} onProfileSaved={onProfileSaved} />,cv:<CvPage />,jds:<JdPage user={user} />,applications:<ApplicationsPage user={user} />,accounts:<AccountsPage user={user} unified={unified} />,placements:<PlacementsPage user={user} unified={unified} />,work:<WorkPage user={user} />,time:<TimePage user={user} />,reports:<ReportsPage user={user} />};
  return <div className="business-page">{views[page]}</div>;
}

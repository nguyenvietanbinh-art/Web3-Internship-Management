import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Layers, LayoutDashboard, BriefcaseBusiness, ClipboardList, BadgeCheck, Users, Building2, Bell, Moon, Sun, PanelLeftClose, PanelLeftOpen, Menu, Wallet, LogOut, ShieldCheck, GraduationCap } from 'lucide-react';
import { Dialog, PageHeader, EmptyState, LoadingSkeleton } from './ui';
const Notifications = lazy(() => import('./business/Notifications'));
import { DEMO_ENABLED } from '../api/client';

import { roleNames } from './navigation';
import './auth-entry.css';
const all = ['student', 'company', 'mentor', 'admin'];
const items = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: all, description: '' },
  { id: 'topics', label: 'Đề tài & đánh giá KPI', icon: Layers, roles: all, description: 'Phân công, báo cáo và theo dõi từng mốc công việc.' },
  { id: 'cv-jd', label: 'CV & cơ hội AI', companyLabel: 'JD & AI matching', icon: BriefcaseBusiness, roles: all, description: 'Đối chiếu kỹ năng với JD. Kết quả hiển thị đúng engine đang sử dụng.' },
  { id: 'attendance', label: 'Công việc & điểm danh', icon: ClipboardList, roles: all, description: 'Nhiệm vụ, nhật ký và phiên điểm danh có xác thực.' },
  { id: 'web3', label: 'Chứng nhận Web3', icon: BadgeCheck, roles: all, description: 'Tra cứu bằng chứng. Chỉ xác minh khi có dữ liệu on-chain hợp lệ.' },
  { id: 'unavailable-applications', label: 'Ứng tuyển', icon: Users, roles: ['student'], unavailable: true },
  { id: 'unavailable-candidates', label: 'Ứng viên', icon: Users, roles: ['company'], unavailable: true },
  { id: 'unavailable-alerts', label: 'Cảnh báo tiến độ', icon: Bell, roles: ['mentor'], unavailable: true },
  { id: 'unavailable-accounts', label: 'Tài khoản & phân quyền', icon: Users, roles: ['admin'], unavailable: true },
  { id: 'unavailable-companies', label: 'Quản lý doanh nghiệp', icon: Building2, roles: ['admin'], unavailable: true },
  { id: 'unavailable-students', label: 'Sinh viên phụ trách', icon: GraduationCap, roles: ['mentor', 'admin'], unavailable: true },
];

const coreItems = [
  {id:'account-overview',label:'Tổng quan tài khoản',icon:LayoutDashboard,roles:['student','company','mentor','admin']},
  {id:'core-web3',label:'Web3 theo kỳ',icon:BadgeCheck,roles:['student','company','mentor','admin']},
  {id:'core-ai',label:'Phân tích AI',icon:BriefcaseBusiness,roles:['student','company','mentor','admin']},
  {id:'core-profile',label:'Hồ sơ cá nhân',icon:Wallet,roles:['student','company','mentor','admin']},
  {id:'core-cv',label:'CV của tôi',icon:BriefcaseBusiness,roles:['student']},
  {id:'core-jds',label:'Cơ hội ứng tuyển',companyLabel:'Tin tuyển dụng',icon:BriefcaseBusiness,roles:['student','company']},
  {id:'core-applications',label:'Ứng tuyển',companyLabel:'Ứng viên',icon:Users,roles:['student','company','admin']},
  {id:'core-placements',label:'Kỳ & phân công',icon:GraduationCap,roles:['student','company','mentor','admin']},
  {id:'core-work',label:'Công việc & nhật ký',icon:ClipboardList,roles:['student','company','mentor','admin']},
  {id:'core-time',label:'Chấm công',icon:ClipboardList,roles:['student','company','mentor','admin']},
  {id:'core-reports',label:'Báo cáo & kết quả',icon:Layers,roles:['student','company','mentor','admin']},
  {id:'core-accounts',label:'Tài khoản & phân quyền',icon:Users,roles:['admin']},
];
export default function AppShell({ children, activeTab, onNavigate, user, unified=false, authReady = true, coreEnabled = false, walletAddress, networkName, onConnect, onDemo, onLogout, loading, roleChoice, onRoleChoice, transactionStatus, onCheckContract, contractConnected, contractAddress, error }) {
  const [collapsed, setCollapsed] = useState(false), [mobileOpen, setMobileOpen] = useState(false), [notifications, setNotifications] = useState(false);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('w3i_theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } });
  const main = useRef(null);
  const role = user?.role || 'guest', available = unified&&user?[items[0],...coreItems]:coreEnabled && user ? [...items.filter(item => !item.unavailable || item.id === 'unavailable-alerts'),...coreItems] : items, allowed = available.filter(item => item.roles.includes(role) && (unified || !user || user.walletAddress || ['core-profile','account-overview'].includes(item.id)));
  const fallbackCurrent={id:'core-profile',label:'Hồ sơ cá nhân'};
  const current = allowed.find(item => item.id === activeTab) || allowed[0] || fallbackCurrent;
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('w3i_theme', theme); } catch { /* Preference persistence is optional. */ } }, [theme]);
  useEffect(() => { document.title = `${user ? current.label : 'Đăng nhập'} · Internova`; }, [current.label,user]);
  const navigate = id => { onNavigate(id); setMobileOpen(false); requestAnimationFrame(() => main.current?.focus()); };
  if(!user || !authReady)return <div className="app-shell auth-entry">
    <a href="#main-content" className="skip-link">Đi tới nội dung chính</a>
    <header className="auth-entry-header"><div className="brand"><span className="brand-mark"><Layers size={24} /></span><div><strong>internova<span>®</span></strong><small>WEB3 INTERNSHIP</small></div></div><button className="icon-button" aria-label={theme==='light'?'Bật Dark Mode':'Bật Light Mode'} onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?<Moon size={19}/>:<Sun size={19}/>}</button></header>
    <main id="main-content" className="auth-entry-main" tabIndex={-1} ref={main}>
      {!authReady?<LoadingSkeleton label="Đang kiểm tra phiên đăng nhập" rows={2}/>:<section className="auth-entry-card"><span className="eyebrow">CHÀO MỪNG ĐẾN INTERNOVA</span><h1>Không gian thực tập của bạn</h1><p>Đăng nhập hoặc tạo tài khoản để truy cập hệ thống theo vai trò được cấp.</p><button id="connect-wallet-btn" className="btn btn-primary" disabled={loading} onClick={onConnect}>Đăng nhập / Đăng ký</button>{error&&<p role="alert" className="inline-alert is-error">{error}</p>}</section>}
    </main><footer className="auth-entry-footer">Internova · Web3 Internship Management</footer>
  </div>;
  const sidebar = <><div className="brand"><span className="brand-mark"><Layers size={24} /></span><div className="sidebar-label"><strong>internova<span>®</span></strong><small>WEB3 INTERNSHIP</small></div></div>
    <p className="nav-group sidebar-label">KHÔNG GIAN LÀM VIỆC</p><nav aria-label="Điều hướng chính">{allowed.filter(i => !i.unavailable).map(item => <button key={item.id} type="button" data-nav={item.id} aria-current={activeTab === item.id ? 'page' : undefined} title={item.label} onClick={() => navigate(item.id)}><item.icon size={20} /><span className="sidebar-label">{role === 'company' && item.companyLabel || item.label}</span>{activeTab === item.id && <span className="nav-dot" />}</button>)}</nav>
    {allowed.some(i => i.unavailable) && <><p className="nav-group sidebar-label">SẮP TRIỂN KHAI</p><nav aria-label="Chức năng chưa triển khai">{allowed.filter(i => i.unavailable).map(item => <button key={item.id} data-nav={item.id} aria-current={activeTab === item.id ? 'page' : undefined} title={`${item.label}: chưa triển khai`} onClick={() => navigate(item.id)}><item.icon size={20} /><span className="sidebar-label">{item.label}</span></button>)}</nav></>}
    <div className="sidebar-bottom"><div className="workspace-note sidebar-label"><ShieldCheck size={20} /><strong>Dữ liệu có phạm vi</strong><p>Chỉ bạn và người được cấp quyền có thể truy cập.</p></div><div className="account-card"><span className="avatar">{(user?.name || roleNames[role] || 'Khách').slice(0, 1).toUpperCase()}</span><div className="sidebar-label"><strong>{user?.name || 'Chưa đăng nhập'}</strong><small>{roleNames[role] || 'Chế độ xem công khai'}</small></div></div></div></>;
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <a href="#main-content" className="skip-link">Đi tới nội dung chính</a>
    <aside className="sidebar desktop-sidebar">{sidebar}<button className="sidebar-collapse icon-button" aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></aside>
    {mobileOpen && <Dialog label="Menu điều hướng" onClose={() => setMobileOpen(false)}><aside className="mobile-sidebar">{sidebar}</aside></Dialog>}
    <div className="workspace"><header className="topbar"><div className="header-context"><button className="icon-button mobile-menu" aria-label="Mở menu điều hướng" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="workspace-path">Internova <span>/</span> <strong>{current.label}</strong></span></div><div className="header-actions">
      {!user && DEMO_ENABLED && <button className="btn btn-secondary" onClick={onDemo}>Ví Demo</button>}
      <button className="icon-button" aria-label={theme === 'light' ? 'Bật Dark Mode' : 'Bật Light Mode'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
      <button className="icon-button" aria-label="Thông báo" disabled={Boolean(user&&!unified&&!user.walletAddress)} onClick={() => setNotifications(true)}><Bell size={19} /></button><span className="header-divider" />
      {user ? <><details className="wallet-summary"><summary>{user.name}</summary><p>{user.email||'Chưa có email'} · {roleNames[role]}</p><p>{walletAddress?`${walletAddress.slice(0,6)}…${walletAddress.slice(-4)}`:'Chưa liên kết ví'}</p><button className="btn btn-secondary" onClick={()=>navigate('core-profile')}>Hồ sơ & cài đặt tài khoản</button></details><button id="logout-btn" className="icon-button" title="Đăng xuất" aria-label="Đăng xuất" onClick={onLogout}><LogOut size={19} /><span className="sr-only">Đăng xuất</span></button></> : <button id="connect-wallet-btn" className="btn btn-primary" disabled={loading} onClick={onConnect}><Wallet size={17} /><span>{loading ? 'Đang xác thực…' : 'Đăng nhập / Đăng ký'}</span></button>}
    </div></header>
    <main id="main-content" className="main-content" tabIndex={-1} ref={main}><PageHeader eyebrow={user ? `${roleNames[role]} / KHÔNG GIAN LÀM VIỆC` : 'WEB3 INTERNSHIP MANAGEMENT'} title={current.id === 'dashboard' ? `Tổng quan${user?.name ? `, ${user.name}` : ''}` : current.label} description={current.description}><span className="workspace-pill"><span className="status-dot" />{user ? roleNames[role] : 'Công khai'}</span></PageHeader>
      {!user && <div className="guest-banner"><div><strong>Chọn vai trò để bắt đầu</strong><p>Xác thực bằng chữ ký ví; không gửi giao dịch blockchain.</p></div><div className="segmented" aria-label="Vai trò đăng ký">{[['company','Doanh nghiệp'],['student','Sinh viên']].map(([value,label]) => <button key={value} id={`role-${value}-btn`} aria-pressed={roleChoice === value} onClick={() => onRoleChoice(value)}>{label}</button>)}</div></div>}
      {error && <div role="alert" className="inline-alert is-error">{error}</div>}
      {children}
      <footer className="workspace-footer"><span>Internova · Web3 Internship Management</span></footer>
      {import.meta.env.DEV && import.meta.env.VITE_SHOW_DIAGNOSTICS==='true' && <details className="runtime-details"><summary>Trạng thái kết nối & blockchain</summary><button className="btn btn-secondary" onClick={onCheckContract}>Kiểm tra RPC (chỉ đọc)</button><p>{networkName || 'Chưa kiểm tra ví/mạng'} · Contract: {contractAddress || 'chưa cấu hình'} · {contractConnected ? 'RPC phản hồi (không đồng nghĩa chứng nhận hợp lệ)' : 'Chưa kết nối'}</p><p data-testid="transaction-status" role="status">Trạng thái blockchain: {transactionStatus}. Chứng nhận token chỉ được xác nhận khi có bằng chứng.</p></details>}
    </main></div>
    {notifications && <Dialog label="Thông báo" onClose={() => setNotifications(false)}><div className="modal-content"><h2>Thông báo</h2>{coreEnabled && user ? <Suspense fallback={<LoadingSkeleton />}><Notifications key={user.walletAddress} /></Suspense> : <><span className="badge badge-pending">Chưa khả dụng</span><EmptyState title="Chưa có dịch vụ thông báo">Thông báo hiện chưa khả dụng. Vui lòng thử lại sau.</EmptyState></>}</div></Dialog>}
  </div>;
}

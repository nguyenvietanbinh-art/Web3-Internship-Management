import { useState, useEffect } from 'react';
import { Layers, TrendingUp, Award, ShieldCheck, Users, ClipboardCheck, BookOpen, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '../api/client';
import { StatCard, LoadingSkeleton, EmptyState, DataTable } from './ui';
import { roleNames } from './navigation';
import CoreOverview from './business/CoreOverview';

const statusLabels = { open: 'Đang tuyển', assigned: 'Đã phân công', in_progress: 'Đang thực tập', completed: 'Hoàn thành' };
export default function DashboardView(props){return props.unified?<CoreOverview />:<LegacyDashboard {...props} />;}
function LegacyDashboard({ user, onSelectTopic, topics = [], coreEnabled = false }) {
  const [stats, setStats] = useState(null), [loading, setLoading] = useState(Boolean(user)), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    apiRequest(`/internship/dashboard?wallet=${user.walletAddress}&role=${user.role}`).then(data => {
      if (active) { setStats(data); setLoading(false); }
    }).catch(err => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [user, retry]);
  const reload = () => { setError(''); setLoading(true); setRetry(n => n + 1); };
  if (!user) return <div className="glass-panel"><EmptyState title="Không gian thực tập của bạn">Kết nối và xác thực ví để xem KPI, tiến độ và công việc theo đúng vai trò. Bạn vẫn có thể xem các đề tài và JD công khai.</EmptyState></div>;
  if (loading) return <LoadingSkeleton label="Đang tải thống kê" rows={4} />;
  if (error || !stats) return <div className="glass-panel"><EmptyState error title="Không tải được thống kê" action={<button className="btn btn-secondary" onClick={reload}>Thử lại</button>}>{error || 'Chưa có thống kê.'}</EmptyState></div>;
  const overview = stats.overview, roleStats = stats.roleStats || {};
  const scopedTopics = topics.filter(topic => user.role === 'admin' || user.role === 'company' && topic.companyWallet === user.walletAddress || user.role === 'student' && topic.assignedStudentWallet === user.walletAddress || user.role === 'mentor' && topic.mentorWallet === user.walletAddress);
  const breakdown = Object.entries(statusLabels).map(([key, label]) => ({ key, label, count: scopedTopics.filter(t => t.status === key).length }));
  const chartTotal = breakdown.reduce((sum, item) => sum + item.count, 0);
  return <div className="dashboard-page">
    {coreEnabled && <CoreOverview />}
    <section className="overview-banner"><div><span className="eyebrow">TIẾN ĐỘ CÓ THỂ THEO DÕI</span><h2>Mỗi cột mốc, một bước tiến.</h2><p>Kết nối công việc, đánh giá và minh chứng trong cùng một không gian.</p><button className="btn btn-primary" onClick={() => scopedTopics[0] && onSelectTopic(scopedTopics[0])} disabled={!scopedTopics.length}>Xem đề tài của bạn <ArrowUpRight size={16} /></button></div><div className="banner-art" aria-hidden="true"><span /><span /><span /><Layers size={42} /></div></section>
    <section className="stats-grid" aria-label="Chỉ số tổng quan">
      <StatCard icon={Layers} title="Đề tài trong phạm vi" value={overview.totalTopics} description={`${overview.openTopics} đề tài đang tuyển`} />
      <StatCard icon={TrendingUp} title="Tỷ lệ hoàn thành" value={`${overview.completionRate}%`} description={`${overview.completedTopics} đề tài hoàn thành`} tone="green" />
      <StatCard icon={Award} title={coreEnabled?'Điểm KPI luồng cũ':'Điểm KPI trung bình'} value={overview.avgScore == null ? 'Chưa có điểm' : `${overview.avgScore}/100`} description="Chỉ tính đề tài luồng cũ đã nghiệm thu" tone="violet" />
      <StatCard icon={ShieldCheck} title="Sự kiện chain đã lưu" value={overview.onChainEvents} description={user.role === 'admin' ? 'Bản ghi DB, không thay token verification' : 'Chỉ Admin được xem tổng hệ thống'} tone="blue" />
    </section>
    <div className="dashboard-secondary"><section className="glass-panel chart-card"><div className="section-heading"><div><p className="eyebrow">PHÂN BỐ ĐỀ TÀI</p><h2>Trạng thái thực tập</h2></div><span className="badge badge-open">{scopedTopics.length} đã tải</span></div>
      {chartTotal ? <div className="status-chart"><div className="chart-track" role="img" aria-label={breakdown.map(x => `${x.label}: ${x.count}`).join(', ')}>{breakdown.filter(x => x.count).map(x => <span key={x.key} className={`chart-segment chart-${x.key}`} style={{ width: `${x.count / chartTotal * 100}%` }} />)}</div><ul>{breakdown.map(x => <li key={x.key}><span className={`legend-dot chart-${x.key}`} /><span>{x.label}</span><strong>{x.count}</strong></li>)}</ul></div> : <EmptyState title="Chưa có dữ liệu biểu đồ">Biểu đồ được tính từ đề tài API đã tải; không dùng dữ liệu mẫu.</EmptyState>}
    </section><section className="glass-panel role-summary"><div className="section-heading"><div><p className="eyebrow">{roleNames[user.role]}</p><h2>Không gian của bạn</h2></div><Users size={20} /></div>
      <dl><div><dt>Đề tài của tôi</dt><dd data-testid="my-topics-count">{roleStats.myTopicsCount ?? '—'}</dd></div>
      {(user.role === 'company' || user.role === 'mentor') && <div><dt>Sinh viên được phân công</dt><dd data-testid="assigned-students-count">{roleStats.myStudentsAssigned ?? '—'}</dd></div>}
      <div><dt><ClipboardCheck size={15} /> Buổi điểm danh</dt><dd data-testid="attendance-days">{roleStats.attendanceDays ?? '—'}</dd></div><div><dt><BookOpen size={15} /> Nhật ký đã nộp</dt><dd data-testid="worklog-count">{roleStats.workLogsSubmitted ?? '—'}</dd></div>
      <div><dt>Điểm KPI hiện tại</dt><dd>{roleStats.currentScore == null ? 'Chưa có điểm' : `${roleStats.currentScore}/100`}</dd></div></dl><p className="muted">Dữ liệu theo danh tính JWT. Không suy ra chứng nhận từ trạng thái hoàn thành.</p>
    </section></div>
    <section className="glass-panel table-card"><div className="section-heading"><div><p className="eyebrow">THEO DÕI CỘT MỐC</p><h2>Tiến độ đề tài & KPI</h2><p>Dữ liệu đã tải trong phạm vi tài khoản; tìm kiếm và phân trang tại trình duyệt.</p></div></div>
      <DataTable label="Tiến độ đề tài" rows={scopedTopics} searchText={row => `${row.title} ${row.companyName} ${row.assignedStudentName || ''}`} filters={Object.entries(statusLabels).map(([value,label]) => ({value,label}))} filterValue={row => row.status} columns={[
        { key:'title',title:'Đề tài',render:row => <div className="table-title"><strong>{row.title}</strong><small>{row.onChainId ? `ID đã lưu #${row.onChainId} · chưa xác minh chain` : 'Chỉ có dữ liệu DB'}</small></div> },
        { key:'companyName',title:'Doanh nghiệp' }, { key:'assignedStudentName',title:'Sinh viên',render:row => row.assignedStudentName || 'Chưa phân công' },
        { key:'progress',title:'Tiến độ KPI',render:row => { const count=row.kpis?.length || 0, approved=row.kpis?.filter(k => k.status==='approved').length || 0; return <div className="progress-cell"><progress aria-label={`KPI ${row.title}`} value={approved} max={count || 1} /><span>{count ? Math.round(approved/count*100) : 0}%</span></div>; } },
        { key:'status',title:'Trạng thái',render:row => <span className={`badge badge-${row.status}`}>{statusLabels[row.status] || row.status}</span> },
        { key:'action',title:'Thao tác',render:row => <button className="btn btn-secondary" aria-label={`Chi tiết ${row.title}`} onClick={() => onSelectTopic(row)}>Chi tiết <ArrowUpRight size={14} /></button> },
      ]} />
    </section>
  </div>;
}

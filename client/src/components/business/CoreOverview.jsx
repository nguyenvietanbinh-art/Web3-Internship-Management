import { Layers, BriefcaseBusiness, ClipboardCheck, Clock, Users, Building2, Award } from 'lucide-react';
import { useResource } from './hooks';
import { StatCard, LoadingSkeleton, EmptyState } from '../ui';
export default function CoreOverview() {
  const state=useResource('/core/dashboard');
  if(state.loading)return <LoadingSkeleton rows={1} label="Đang tải thống kê theo kỳ" />;
  if(state.error)return <EmptyState error title="Không tải được thống kê theo kỳ">{state.error}</EmptyState>;
  const t=state.data.totals;
  return <section className="business-stack" aria-label="Thống kê nghiệp vụ theo kỳ"><div className="section-heading"><div><p className="eyebrow">CORE BUSINESS · THEO PHÂN CÔNG</p><h2>Thực tập theo kỳ</h2><p>Nguồn database theo vai trò; chỉ giờ đã duyệt, không cộng Attendance QR cũ thiếu checkout.</p></div></div><div className="stats-grid">
    <StatCard icon={Layers} title="Phân công theo kỳ" value={t.placements} description={`${t.activePlacements} đang hoạt động`} />
    <StatCard icon={BriefcaseBusiness} title="Hồ sơ ứng tuyển" value={t.applications} description="Theo phạm vi tài khoản" />
    <StatCard icon={ClipboardCheck} title="Task đã xong / tổng" value={`${t.doneTasks}/${t.tasks}`} description={`${t.worklogs} nhật ký · ${t.reports} phiên bản báo cáo`} />
    <StatCard icon={Clock} title="Giờ đã duyệt" value={(t.approvedMinutes/60).toFixed(2)} description={`${t.approvedMinutes} phút · ${t.openSessions} phiên mở`} />
    <StatCard icon={Award} title="Điểm báo cáo đã chốt" value={t.averageFinalScore===null?'Chưa chốt':`${Number(t.averageFinalScore.toFixed(2))}/100`} description={`${t.approvedFinalReports} báo cáo cuối kỳ được duyệt · chưa phải điểm on-chain`} />
    <StatCard icon={Award} title="Điểm KPI cuối kỳ" value={t.averageKpiScore==null?'Chưa chốt':`${Number(t.averageKpiScore.toFixed(2))}/100`} description="KPI có trọng số của phân công đã kết thúc; khác điểm nhận xét báo cáo" />
    {state.data.scope==='admin'&&<><StatCard icon={Users} title="Tài khoản hệ thống" value={t.accounts} description={`${t.students} SV · ${t.mentors} giảng viên`} /><StatCard icon={Building2} title="Doanh nghiệp / kỳ" value={`${t.companies}/${t.batches}`} description="Từ User và InternshipBatch" /></>}
  </div></section>;
}

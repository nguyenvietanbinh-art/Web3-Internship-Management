import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Award, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  Building2, 
  GraduationCap, 
  ExternalLink 
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function DashboardView({ user, onSelectTopic, topics = [] }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const query = user ? `?wallet=${user.walletAddress}&role=${user.role}` : '';
        const data = await apiRequest(`/internship/dashboard${query}`);
        setStats(data);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  const overview = stats?.overview || {
    totalTopics: topics.length,
    completedTopics: topics.filter(t => t.status === 'completed').length,
    inProgressTopics: topics.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
    openTopics: topics.filter(t => t.status === 'open').length,
    completionRate: topics.length ? Math.round((topics.filter(t => t.status === 'completed').length / topics.length) * 100) : 0,
    avgScore: 88,
    totalStudents: 16,
    totalCompanies: 6,
    onChainEvents: 12,
  };

  const roleStats = stats?.roleStats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '14px', borderRadius: '12px' }}>
            <Layers size={26} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng số Đề tài</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{overview.totalTopics}</div>
            <div style={{ fontSize: '0.72rem', color: '#10b981' }}>{overview.openTopics} đề tài đang tuyển</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '14px', borderRadius: '12px' }}>
            <TrendingUp size={26} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tỷ lệ Hoàn thành</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{overview.completionRate}%</div>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{overview.completedTopics} đề tài đã nghiệm thu</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '14px', borderRadius: '12px' }}>
            <Award size={26} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Điểm KPI Trung bình</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{overview.avgScore}/100</div>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Đánh giá nghiêm ngặt</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '14px', borderRadius: '12px' }}>
            <ShieldCheck size={26} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sự kiện On-Chain</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{overview.onChainEvents} Events</div>
            <div style={{ fontSize: '0.72rem', color: '#c084fc' }}>Lưu trữ IPFS & Smart Contract</div>
          </div>
        </div>
      </div>

      {/* Role Personalized Box */}
      {user && (
        <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.05))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: user.role === 'company' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #06b6d4, #0891b2)', padding: '14px', borderRadius: '14px' }}>
                {user.role === 'company' ? <Building2 size={28} color="#fff" /> : <GraduationCap size={28} color="#fff" />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{user.name}</h3>
                  <span className="badge badge-open">{user.role.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  Ví: {user.walletAddress}
                </div>
              </div>
            </div>

            {/* Quick Metrics for Current User */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {user.role === 'company' ? (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8' }}>{roleStats.myTopicsCount || 5}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Đề tài của tôi</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>{roleStats.myStudentsAssigned || 3}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SV đang hướng dẫn</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{roleStats.attendanceDays || 7}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Buổi điểm danh</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc' }}>{roleStats.workLogsSubmitted || 3}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Nhật ký đã nộp</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>{roleStats.currentScore || 90}/100</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Điểm KPI hiện tại</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Topics Progress Breakdown Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Tiến Độ Thực Tập & Trạng Thái KPI Các Đề Tài</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Theo dõi chi tiết tiến độ các mốc KPI, sinh viên phụ trách và tình trạng on-chain
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>ĐỀ TÀI</th>
                <th style={{ padding: '12px 14px' }}>DOANH NGHIỆP</th>
                <th style={{ padding: '12px 14px' }}>SINH VIÊN</th>
                <th style={{ padding: '12px 14px' }}>TIẾN ĐỘ KPI</th>
                <th style={{ padding: '12px 14px' }}>TRẠNG THÁI</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {topics.slice(0, 7).map((topic) => {
                const approvedCount = topic.kpis?.filter(k => k.status === 'approved').length || 0;
                const totalKpis = topic.kpis?.length || 1;
                const pct = Math.round((approvedCount / totalKpis) * 100);

                return (
                  <tr key={topic._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#f8fafc', maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        {topic.onChainId ? `On-chain #${topic.onChainId}` : 'Off-chain DB'}
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{topic.companyName}</td>
                    <td style={{ padding: '14px' }}>
                      {topic.assignedStudentName ? (
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{topic.assignedStudentName}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Chưa phân công</span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden', minWidth: '70px' }}>
                          <div style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#6366f1', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct === 100 ? '#10b981' : '#818cf8' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge badge-${topic.status}`}>{topic.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => onSelectTopic(topic)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

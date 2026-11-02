import { Dialog, EmptyState, LoadingSkeleton } from './ui';
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  Sparkles,
  MapPin,
  DollarSign,
  PlusCircle,
  FileText
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function CvJdView({ user, showToast, coreEnabled = false }) {
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [jdSearch, setJdSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreateJdModal, setShowCreateJdModal] = useState(false);

  // Student CV state
  const [cvForm, setCvForm] = useState({
    skills: user?.skills?.join(', ') || '',
    gpa: '',
    university: '',
    bio: user?.bio || '',
  });

  // JD Form state
  const [jdForm, setJdForm] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    benefits: '',
    slots: 2,
    location: '',
    salary: '',
  });

  const fetchJds = async () => {
    try {
      const data = await apiRequest('/internship/jds');
      setJds(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    let active = true;
    apiRequest('/internship/jds').then(data => { if (active) { setJds(data); setInitialLoading(false); } }).catch(err => { if (active) { setError(err.message); setInitialLoading(false); } });
    return () => { active = false; };
  }, []);

  // Run AI Matching CV with JDs
  const handleRunAiMatching = async () => {
    setLoading(true);
    try {
      const skillsArr = cvForm.skills.split(',').map((s) => s.trim()).filter(Boolean);
      const matchedData = await apiRequest('/internship/match-cv', {
        method: 'POST',
        body: { studentSkills: skillsArr, studentBio: cvForm.bio },
      });
      setJds(matchedData);
      showToast('Đã phân tích độ tương thích bằng AI NLP Microservice!');
    } catch (err) {
      showToast(`Lỗi phân tích AI: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/internship/jds', {
        method: 'POST',
        body: {
          title: jdForm.title,
          department: jdForm.department,
          description: jdForm.description,
          requirements: jdForm.requirements.split(',').map(s => s.trim()).filter(Boolean),
          benefits: jdForm.benefits.split(',').map(s => s.trim()).filter(Boolean),
          slots: Number(jdForm.slots),
          location: jdForm.location,
          salary: jdForm.salary,
        },
      });
      await fetchJds();
      setShowCreateJdModal(false);
      showToast('Đã đăng tin tuyển dụng JD thành công!');
    } catch (err) {
      showToast(`Không thể tạo JD: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and CV Banner */}
      {error && <EmptyState error title="Không tải được JD" action={<button className="btn btn-secondary" onClick={fetchJds}>Thử lại</button>}>{error}</EmptyState>}
      {initialLoading && <LoadingSkeleton />}
      {!initialLoading && !error && jds.length === 0 && <EmptyState title="Chưa có JD tuyển dụng">Không có dữ liệu trong nguồn hiện tại. Việc mở trang không tạo mẫu.</EmptyState>}
      <p>Biểu mẫu CV dưới đây chỉ dùng đối chiếu tạm; chưa lưu vào hồ sơ.</p>
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
        {/* CV Summary Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px' }}>
                <FileText size={22} color="var(--primary-light)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Hồ Sơ Năng Lực Ứng Viên (CV)</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Thông tin kỹ năng dùng để AI đối chiếu mức độ phù hợp với JD
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={loading || !user || !cvForm.skills.trim()}
              onClick={handleRunAiMatching}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              <Sparkles size={16} />
              {loading ? 'Đang so khớp AI...' : 'Chạy AI Matching CV-JD'}
            </button>
          </div>

          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Kỹ năng chuyên môn (cách nhau dấu phẩy):</label>
              <input aria-label="Kỹ năng chuyên môn"
                className="input-field"
                value={cvForm.skills}
                onChange={(e) => setCvForm({ ...cvForm, skills: e.target.value })}
                placeholder="Solidity, React, Node.js..."
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Trường đại học (chưa lưu):</label>
              <input aria-label="Trường đại học"
                className="input-field"
                value={cvForm.university}
                onChange={(e) => setCvForm({ ...cvForm, university: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Tóm tắt kinh nghiệm / Mục tiêu:</label>
            <textarea aria-label="Kinh nghiệm và mục tiêu"
              className="input-field"
              rows={2}
              value={cvForm.bio}
              onChange={(e) => setCvForm({ ...cvForm, bio: e.target.value })}
            />
          </div>
        </div>

        {/* Action Panel for Company */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Briefcase size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>Đăng Tin Tuyển Thực Tập (JD)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Dành cho Doanh nghiệp đăng thông báo tìm kiếm thực tập sinh Web3
            </p>
          </div>
          <button
            className="btn btn-emerald"
            disabled={user?.role !== 'company'} onClick={() => setShowCreateJdModal(true)}
            style={{ width: '100%' }}
          >
            <PlusCircle size={16} /> Tạo Tin Tuyển Dụng Mới
          </button>
        </div>
      </div>

<label className="search-label">Tìm vị trí trong JD đã tải<input className="input-field" aria-label="Tìm JD" placeholder="Tên vị trí, doanh nghiệp, địa điểm…" value={jdSearch} onChange={e => setJdSearch(e.target.value)} /></label>
      {/* JDs List with AI Matching Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Vị Trí Thực Tập Đang Tuyển Dụng ({jds.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Điểm phù hợp được hiển thị sau khi phân tích
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {jds.filter(jd => `${jd.title} ${jd.companyName} ${jd.location}`.toLocaleLowerCase('vi').includes(jdSearch.toLocaleLowerCase('vi'))).map((jd, idx) => {
            const matchScore = jd.matchResult?.similarity_score ?? null;
            const matchedSkills = jd.matchResult?.matched_skills || [];
            const missingSkills = jd.matchResult?.missing_skills || [];

            return (
              <div
                key={jd._id || idx}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: matchScore >= 80 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)'
                }}
              >
                {/* Header card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-open" style={{ marginBottom: '6px' }}>{jd.department}</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{jd.title}</h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Building2 size={14} /> {jd.companyName}
                    </div>
                  </div>

                  {/* AI Match Badge */}
                  <div style={{
                    textAlign: 'center',
                    background: matchScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    border: `1px solid ${matchScore >= 80 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                    borderRadius: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: matchScore >= 80 ? 'var(--accent-emerald)' : 'var(--primary-light)' }}>
                      {matchScore == null ? 'Chưa tính' : `${matchScore}%`}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                      AI Match
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {jd.description}
                </p>

                {/* Skills Match Details */}
                <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '6px' }}>{jd.matchResult ? `Nguồn: ${jd.matchResult.engine || 'nlp-service'}${jd.matchResult.fallback ? ' (dự phòng)' : ''}` : 'Chưa phân tích độ phù hợp.'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                    {matchedSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                        ✓ {sk}
                      </span>
                    ))}
                    {missingSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                        + {sk}
                      </span>
                    ))}
                  </div>
                  {jd.matchResult?.recommendation && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> {jd.matchResult.recommendation}
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', paddingTop: '6px', borderTop: '1px solid var(--border-glass)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {jd.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)' }}><DollarSign size={13} /> {jd.salary}</span>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.76rem' }} disabled={!coreEnabled || user?.role !== 'student' || loading} title={coreEnabled ? 'Sinh viên ứng tuyển bằng CV đã lưu; trạng thái xem ở mục Ứng tuyển' : 'Ứng tuyển chưa được bật ở môi trường này'} onClick={async () => { setLoading(true); try { await apiRequest('/core/applications',{method:'POST',body:{jdId:jd._id,message:''}}); showToast('Đã lưu hồ sơ ứng tuyển. Theo dõi tại mục Ứng tuyển.'); } catch (err) { showToast(`Không thể ứng tuyển: ${err.message}`); } finally { setLoading(false); } }}>
                    Ứng tuyển
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {jds.length > 0 && !jds.some(jd => `${jd.title} ${jd.companyName} ${jd.location}`.toLocaleLowerCase('vi').includes(jdSearch.toLocaleLowerCase('vi'))) && <EmptyState title="Không có JD phù hợp từ khóa">Thử từ khóa khác trong các JD đã tải.</EmptyState>}
      {/* Modal: Create JD */}
      {showCreateJdModal && (
        <Dialog label="Tạo tin tuyển dụng" onClose={() => setShowCreateJdModal(false)}>
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Đăng Tin Tuyển Dụng Mới (JD)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Tin tuyển dụng sẽ được nạp vào hệ thống để AI tự động đối chiếu năng lực sinh viên
            </p>

            <form onSubmit={handleCreateJd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tiêu đề vị trí tuyển dụng:</label>
                <input aria-label="Ví dụ: Kỹ sư Thực tập sinh Solidity / Fullstack Web3"
                  className="input-field"
                  required
                  placeholder="Ví dụ: Kỹ sư Thực tập sinh Solidity / Fullstack Web3"
                  value={jdForm.title}
                  onChange={(e) => setJdForm({ ...jdForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mô tả công việc:</label>
                <textarea aria-label="Mô tả các đầu việc chính thực tập sinh sẽ tham gia phát triển..."
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Mô tả các đầu việc chính thực tập sinh sẽ tham gia phát triển..."
                  value={jdForm.description}
                  onChange={(e) => setJdForm({ ...jdForm, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Yêu cầu Kỹ năng (cách nhau dấu phẩy):</label>
                <input aria-label="Solidity, React, Node.js, Web3.js"
                  className="input-field"
                  required
                  placeholder="Solidity, React, Node.js, Web3.js"
                  value={jdForm.requirements}
                  onChange={(e) => setJdForm({ ...jdForm, requirements: e.target.value })}
                />
              </div>

              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Địa điểm làm việc:</label>
                  <input aria-label="Địa điểm"
                    className="input-field"
                    value={jdForm.location}
                    onChange={(e) => setJdForm({ ...jdForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mức hỗ trợ / Lương:</label>
                  <input aria-label="Mức hỗ trợ"
                    className="input-field"
                    value={jdForm.salary}
                    onChange={(e) => setJdForm({ ...jdForm, salary: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateJdModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Đăng Tin JD'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

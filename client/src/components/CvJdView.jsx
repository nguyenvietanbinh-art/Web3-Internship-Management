import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  Sparkles, 
  MapPin, 
  DollarSign, 
  Users, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function CvJdView({ user, showToast }) {
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchingResults, setMatchingResults] = useState({});
  const [showCreateJdModal, setShowCreateJdModal] = useState(false);

  // Student CV state
  const [cvForm, setCvForm] = useState({
    skills: user?.skills?.join(', ') || 'Solidity, React, Node.js, Web3.js, TypeScript',
    gpa: '3.6',
    university: 'Đại học Bách Khoa / CNTT',
    bio: user?.bio || 'Sinh viên năm cuối đam mê nghiên cứu ứng dụng Smart Contract DeFi và công nghệ AI NLP.',
  });

  // JD Form state
  const [jdForm, setJdForm] = useState({
    title: '',
    department: 'Web3 & Blockchain Engineering',
    description: '',
    requirements: 'Solidity, React, Ethers.js, JavaScript',
    benefits: 'Trợ cấp 8,000,000 VNĐ/tháng, Cấp chứng nhận Web3 SBT',
    slots: 2,
    location: 'Hà Nội / TP.HCM / Remote',
    salary: '8,000,000 VNĐ/tháng',
  });

  const fetchJds = async () => {
    try {
      const data = await apiRequest('/internship/jds');
      setJds(data);
    } catch (err) {
      console.error("Fetch JDs error:", err);
    }
  };

  useEffect(() => {
    fetchJds();
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* CV Summary Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px' }}>
                <FileText size={22} color="#818cf8" />
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
              disabled={loading}
              onClick={handleRunAiMatching}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              <Sparkles size={16} />
              {loading ? 'Đang so khớp AI...' : 'Chạy AI Matching CV-JD'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Kỹ năng chuyên môn (cách nhau dấu phẩy):</label>
              <input 
                className="input-field" 
                value={cvForm.skills} 
                onChange={(e) => setCvForm({ ...cvForm, skills: e.target.value })} 
                placeholder="Solidity, React, Node.js..."
              />
            </div>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Điểm GPA & Trường Đại học:</label>
              <input 
                className="input-field" 
                value={`${cvForm.gpa} • ${cvForm.university}`} 
                onChange={(e) => setCvForm({ ...cvForm, university: e.target.value })} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Tóm tắt kinh nghiệm / Mục tiêu:</label>
            <textarea 
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
            <Briefcase size={24} color="#38bdf8" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>Đăng Tin Tuyển Thực Tập (JD)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Dành cho Doanh nghiệp đăng thông báo tìm kiếm thực tập sinh Web3
            </p>
          </div>
          <button 
            className="btn btn-emerald" 
            onClick={() => setShowCreateJdModal(true)}
            style={{ width: '100%' }}
          >
            <PlusCircle size={16} /> Tạo Tin Tuyển Dụng Mới
          </button>
        </div>
      </div>

      {/* JDs List with AI Matching Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Vị Trí Thực Tập Đang Tuyển Dụng ({jds.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Được sắp xếp theo độ tương thích AI Matching
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {jds.map((jd, idx) => {
            const matchScore = jd.matchResult?.similarity_score ?? 80;
            const matchedSkills = jd.matchResult?.matched_skills || jd.requirements?.slice(0, 3) || [];
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
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>{jd.title}</h4>
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
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: matchScore >= 80 ? '#34d399' : '#818cf8' }}>
                      {matchScore}%
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
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Kỹ năng khớp với CV của bạn:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                    {matchedSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                        ✓ {sk}
                      </span>
                    ))}
                    {missingSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                        + {sk}
                      </span>
                    ))}
                  </div>
                  {jd.matchResult?.recommendation && (
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> {jd.matchResult.recommendation}
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', paddingTop: '6px', borderTop: '1px solid var(--border-glass)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {jd.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}><DollarSign size={13} /> {jd.salary}</span>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.76rem' }} onClick={() => showToast(`Đã gửi hồ sơ ứng tuyển vị trí: ${jd.title}`)}>
                    Ứng tuyển
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Create JD */}
      {showCreateJdModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Đăng Tin Tuyển Dụng Mới (JD)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Tin tuyển dụng sẽ được nạp vào hệ thống để AI tự động đối chiếu năng lực sinh viên
            </p>

            <form onSubmit={handleCreateJd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tiêu đề vị trí tuyển dụng:</label>
                <input 
                  className="input-field" 
                  required 
                  placeholder="Ví dụ: Kỹ sư Thực tập sinh Solidity / Fullstack Web3"
                  value={jdForm.title}
                  onChange={(e) => setJdForm({ ...jdForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mô tả công việc:</label>
                <textarea 
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
                <input 
                  className="input-field" 
                  required 
                  placeholder="Solidity, React, Node.js, Web3.js"
                  value={jdForm.requirements}
                  onChange={(e) => setJdForm({ ...jdForm, requirements: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Địa điểm làm việc:</label>
                  <input 
                    className="input-field" 
                    value={jdForm.location}
                    onChange={(e) => setJdForm({ ...jdForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mức hỗ trợ / Lương:</label>
                  <input 
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
        </div>
      )}
    </div>
  );
}

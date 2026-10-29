import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Wallet, 
  Sparkles, 
  X, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onMetaMaskLogin, onDemoLogin, loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <Wallet size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Đăng Nhập Web3 Platform</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Xác thực phi tập trung an toàn qua chữ ký ví
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Option 1: MetaMask Native */}
        <div style={{ marginBottom: '20px' }}>
          <button
            id="metamask-native-login-btn"
            className="btn btn-primary"
            disabled={loading}
            onClick={onMetaMaskLogin}
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', gap: '10px' }}
          >
            <ShieldCheck size={20} />
            {loading ? 'Đang xác thực ví...' : 'Kết nối với Ví MetaMask của bạn'}
          </button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '6px' }}>
            Yêu cầu ký xác thực Nonce (EIP-191) an toàn, không tốn phí Gas.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOẶC TRẢI NGHIỆM TỨC THÌ</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
        </div>

        {/* Option 2: Quick Demo Wallets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#f59e0b" />
            <span>Chọn ví mẫu đã cấu hình sẵn trong Database (không cần cài MetaMask):</span>
          </div>

          {/* Company Preset */}
          <button
            id="demo-login-company-btn"
            onClick={() => onDemoLogin('company')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '8px' }}>
                <Building2 size={18} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>🏢 Nexus Labs Blockchain (Company)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0x70997970C51812dc3A010C7d01b50e0d17dc79C8</div>
              </div>
            </div>
            <span className="badge badge-open" style={{ fontSize: '0.7rem' }}>Chọn</span>
          </button>

          {/* Student Preset */}
          <button
            id="demo-login-student-btn"
            onClick={() => onDemoLogin('student')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#06b6d4'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '8px' }}>
                <GraduationCap size={18} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>🎓 Trần Minh Khoa (Student)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC</div>
              </div>
            </div>
            <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Chọn</span>
          </button>

          {/* Mentor Preset */}
          <button
            id="demo-login-mentor-btn"
            onClick={() => onDemoLogin('mentor')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '8px' }}>
                <UserCheck size={18} color="#34d399" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>👨‍🏫 TS. Nguyễn Văn A (Mentor)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65</div>
              </div>
            </div>
            <span className="badge badge-in_progress" style={{ fontSize: '0.7rem' }}>Chọn</span>
          </button>
        </div>
      </div>
    </div>
  );
}

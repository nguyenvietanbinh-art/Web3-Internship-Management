import { EmptyState, LoadingSkeleton } from './ui';
import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Hash,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function Web3CertificateView({ showToast, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState('');

  const fetchChainEvents = async () => {
    setLoadingEvents(true);
    try {

      const data = await apiRequest('/internship/chain-events');
      if (Array.isArray(data)) setEventsList(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    if (user?.role === 'admin') {
      apiRequest('/internship/chain-events').then(data => { if (active) setEventsList(Array.isArray(data) ? data : []); }).catch(err => { if (active) setError(err.message); });
    }
    return () => { active = false; };
  }, [user?.role]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true); setCertData(null); setError('');
    try {
      const data = await apiRequest(`/internship/certificate/${encodeURIComponent(searchQuery.trim())}`);
      if (data.verified !== true || data.onChain !== true || data.tokenId == null) throw new Error('Chưa có token on-chain được xác minh.');
      setCertData(data);
      showToast('Đã tra cứu dữ liệu chứng chỉ On-chain thành công!');
    } catch (err) {
      setError(err.message); showToast(`Chưa thể xác minh: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <EmptyState error title="Chưa thể xác minh">{error}</EmptyState>}
      {loading && <LoadingSkeleton label="Đang tra cứu chứng nhận" />}
      <div className="inline-alert"><strong>BLOCKED · Xác minh token chưa được cấu hình</strong><p>Không hiển thị chứng nhận hợp lệ khi thiếu bằng chứng on-chain. Nhật ký toàn hệ thống chỉ dành cho Admin.</p></div>
      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>
          Tra Cứu Chứng Nhận Thực Tập Web3 On-Chain (SBT / NFT Explorer)
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Nhập Topic ID, Địa chỉ Ví Sinh viên hoặc Transaction Hash để xác minh chứng nhận chống gian lận
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input aria-label="Nhập 0x... địa chỉ ví hoặc Topic ID..."
              className="input-field"
              placeholder="Nhập 0x... địa chỉ ví hoặc Topic ID..."
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang tra cứu...' : 'Tra Cứu On-Chain'}
          </button>
        </form>
      </div>

      {/* Certificate Display Card */}
      {certData?.verified === true && certData?.onChain === true && certData?.tokenId != null && (
        <div
          className="glass-panel"
          style={{
            padding: '36px',
            borderRadius: '20px',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), rgba(17, 24, 39, 0.95))',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Badge Verified Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '50%' }}>
                <ShieldCheck size={26} color="var(--accent-emerald)" />
              </div>
              <div>
                <span className="badge badge-completed">ON-CHAIN VERIFIED • {certData.standard || 'TOKEN'}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {certData.standard === 'ERC-5192' ? 'Token không chuyển nhượng (ERC-5192)' : 'Chỉ hiển thị chuẩn đã được verifier xác nhận'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>{certData.finalScore}/100</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Điểm Nghiệm Thu KPI</div>
            </div>
          </div>

          {/* Certificate Body */}
          <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              CHỨNG NHẬN HOÀN THÀNH THỰC TẬP WEB3
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.02em' }} className="text-gradient">
              {certData.studentName}
            </h2>
            <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Đã hoàn thành xuất sắc toàn bộ các mốc chỉ số KPI đề tài <strong>"{certData.title}"</strong> do doanh nghiệp <strong>{certData.companyName}</strong> hướng dẫn và đánh giá nghiệm thu.
            </p>
          </div>

          {/* Blockchain & IPFS Proofs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ background: 'var(--surface-muted)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Địa chỉ Ví Sinh viên (Recipient):</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                {certData.studentWallet}
              </div>
            </div>

            <div style={{ background: 'var(--surface-muted)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Smart Contract Address:</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--primary-light)', wordBreak: 'break-all' }}>
                {certData.contractAddress}
              </div>
            </div>

            <div style={{ background: 'var(--surface-muted)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Transaction Hash (Proof on-chain):</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--accent-emerald)', wordBreak: 'break-all' }}>
                {certData.txHash}
              </div>
            </div>

            <div style={{ background: 'var(--surface-muted)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>IPFS Metadata CID:</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--accent-amber)', wordBreak: 'break-all' }}>
                {certData.ipfsMetadataCid}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Live Events Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={18} color="var(--primary-light)" />
              Sổ Cái Sự Kiện On-Chain (Blockchain Events Ledger)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Listener mặc định tắt. Đồng bộ thủ công cần quyền Admin và RPC đã cấu hình.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={async () => { try { await apiRequest('/internship/sync-events', { method: 'POST' }); await fetchChainEvents(); } catch (err) { setError(err.message); } }}
            disabled={loadingEvents || user?.role !== 'admin'}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Sparkles size={14} color="var(--accent-amber)" />
            {loadingEvents ? 'Đang đồng bộ...' : 'Đồng Bộ Sự Kiện'}
          </button>
        </div>

        {eventsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Chưa có sự kiện khả dụng trong phạm vi tài khoản. Lưu đề tài trong DB không tự tạo bằng chứng on-chain.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Event</th>
                  <th style={{ padding: '10px 12px' }}>Block</th>
                  <th style={{ padding: '10px 12px' }}>Tx Hash</th>
                  <th style={{ padding: '10px 12px' }}>Chi Tiết Payload</th>
                  <th style={{ padding: '10px 12px' }}>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {eventsList.map((ev, idx) => (
                  <tr key={ev._id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary-light)' }}>
                      <span className="badge badge-open" style={{ fontSize: '0.72rem' }}>{ev.eventName}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>#{ev.blockNumber}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                      {ev.txHash ? `${ev.txHash.slice(0, 10)}...${ev.txHash.slice(-8)}` : '0x...'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(ev.payload || {})}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : 'Vừa xong'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract & Architecture Info Box */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px 0' }}>
          Kiến Trúc Blockchain & Tính Minh Bạch Bất Biến
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Hệ thống sử dụng Smart Contract <strong>InternshipPlatform.sol</strong> để ràng buộc quy tắc tổng trọng số KPI = 100%, khóa quyền sửa đổi báo cáo sau khi nghiệm thu, và tự động lưu vết sự kiện qua collection <code>chain_events</code> trên MongoDB. Toàn bộ file minh chứng được định danh phi tập trung qua IPFS CID.
        </p>
      </div>
    </div>
  );
}

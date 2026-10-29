import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Award, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Hash, 
  FileCheck2, 
  Sparkles 
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function Web3CertificateView({ showToast }) {
  const [searchQuery, setSearchQuery] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchChainEvents = async () => {
    setLoadingEvents(true);
    try {
      // Trigger sync if possible
      await apiRequest('/internship/sync-events', { method: 'POST' }).catch(() => null);
      const data = await apiRequest('/internship/chain-events');
      if (Array.isArray(data)) setEventsList(data);
      showToast('Đã đồng bộ danh sách Blockchain Events từ Smart Contract!');
    } catch (err) {
      console.warn("Lỗi load events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  React.useEffect(() => {
    fetchChainEvents();
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/internship/certificate/${encodeURIComponent(searchQuery.trim())}`);
      setCertData(data);
      showToast('Đã tra cứu dữ liệu chứng chỉ On-chain thành công!');
    } catch (err) {
      showToast(`Không tìm thấy chứng chỉ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            <input
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
      {certData && (
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
                <ShieldCheck size={26} color="#10b981" />
              </div>
              <div>
                <span className="badge badge-completed">ON-CHAIN VERIFIED • SOULBOUND TOKEN (SBT)</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Tiêu chuẩn ERC-5192 / Bất biến & Không thể chuyển nhượng
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{certData.finalScore}/100</div>
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
            <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Đã hoàn thành xuất sắc toàn bộ các mốc chỉ số KPI đề tài <strong>"{certData.title}"</strong> do doanh nghiệp <strong>{certData.companyName}</strong> hướng dẫn và đánh giá nghiệm thu.
            </p>
          </div>

          {/* Blockchain & IPFS Proofs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Địa chỉ Ví Sinh viên (Recipient):</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>
                {certData.studentWallet}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Smart Contract Address:</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#818cf8', wordBreak: 'break-all' }}>
                {certData.contractAddress}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Transaction Hash (Proof on-chain):</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#34d399', wordBreak: 'break-all' }}>
                {certData.txHash}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '4px' }}>IPFS Metadata CID:</div>
              <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#fbbf24', wordBreak: 'break-all' }}>
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
              <Hash size={18} color="#818cf8" />
              Sổ Cái Sự Kiện On-Chain (Blockchain Events Ledger)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Đồng bộ tự động từ Smart Contract vào MongoDB qua Event Listener
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={fetchChainEvents}
            disabled={loadingEvents}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Sparkles size={14} color="#f59e0b" />
            {loadingEvents ? 'Đang đồng bộ...' : 'Đồng Bộ Sự Kiện'}
          </button>
        </div>

        {eventsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Chưa có sự kiện nào được ghi nhận. Hãy tạo đề tài hoặc hoàn tất KPI để sinh event on-chain.
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
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#a5b4fc' }}>
                      <span className="badge badge-open" style={{ fontSize: '0.72rem' }}>{ev.eventName}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>#{ev.blockNumber}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>
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

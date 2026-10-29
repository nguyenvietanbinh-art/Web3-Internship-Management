import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  Sparkles, 
  PlusCircle, 
  FileCheck2, 
  Award, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  BrainCircuit, 
  Building2, 
  GraduationCap, 
  ExternalLink,
  Layers,
  Search,
  Filter,
  BarChart3,
  Briefcase,
  QrCode,
  FileBadge
} from 'lucide-react';
import { apiRequest, getToken, signInWithWallet, demoLoginWallet, restoreSession, logout } from './api/client';
import { 
  checkContractConnection, 
  CONTRACT_ADDRESS,
  createTopicOnChain, 
  assignStudentOnChain, 
  submitKpiOnChain, 
  evaluateKpiOnChain, 
  completeInternshipOnChain 
} from './api/web3Client';
import AuthModal from './components/AuthModal';
import DashboardView from './components/DashboardView';
import CvJdView from './components/CvJdView';
import AttendanceView from './components/AttendanceView';
import Web3CertificateView from './components/Web3CertificateView';

const isoDay = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const newKpiRow = (days = 14, weightPercent = '') => ({ title: '', criteria: '', weightPercent, deadline: isoDay(days) });

export default function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [roleChoice, setRoleChoice] = useState('company'); // 'company' | 'student'
  const userRole = user ? (user.role === 'student' ? 'student' : 'company') : roleChoice;
  const setUserRole = (role) => { if (!user) setRoleChoice(role); };
  const [contractConnected, setContractConnected] = useState(false);

  // Navigation Tabs: 'dashboard' | 'topics' | 'cv-jd' | 'attendance' | 'web3'
  const [activeTab, setActiveTab] = useState('topics');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showSubmitKPIModal, setShowSubmitKPIModal] = useState(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(null);

  // Topics & Data State
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Forms
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    description: '',
    requiredSkills: 'Solidity, React, Node.js',
    expectedKeywords: 'Smart Contract, IPFS, Web3',
  });
  const [kpiRows, setKpiRows] = useState([newKpiRow(15, 40), newKpiRow(45, 60)]);
  const kpiTotal = kpiRows.reduce((sum, row) => sum + (Number(row.weightPercent) || 0), 0);
  const updateKpiRow = (index, patch) => setKpiRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const [submissionText, setSubmissionText] = useState('');
  const [evalForm, setEvalForm] = useState({ score: 90, status: 'approved', feedback: 'Báo cáo nộp bài đạt tiêu chí đề ra.' });
  const [assigneeWallet, setAssigneeWallet] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  const requireLogin = () => {
    if (user) return true;
    setShowAuthModal(true);
    showToast('Hãy kết nối ví MetaMask hoặc chọn Ví mẫu để thực hiện thao tác.');
    return false;
  };

  // Restore session
  useEffect(() => {
    restoreSession()
      .then((restored) => {
        if (restored) {
          setUser(restored);
          setWalletAddress(restored.walletAddress);
          setNetworkName('Connected Web3');
        }
      })
      .catch((err) => setBackendError(err.message));
    checkContractConnection().then(setContractConnected).catch(() => setContractConnected(false));
  }, []);

  // MetaMask listener
  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const onAccountsChanged = () => {
      logout();
      setUser(null);
      setWalletAddress('');
      showToast('Địa chỉ ví đã thay đổi, hãy xác thực lại.');
    };
    window.ethereum.on('accountsChanged', onAccountsChanged);
    return () => window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
  }, []);

  // Connect MetaMask or open modal if missing
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    try {
      const session = await signInWithWallet(roleChoice);
      setUser(session.user);
      setWalletAddress(session.address);
      setNetworkName(session.networkName === 'unknown' ? `Chain ${session.chainId}` : session.networkName);
      setShowAuthModal(false);
      showToast(`Đã xác thực ví ${session.address.slice(0, 6)}...${session.address.slice(-4)} (${session.user.role})`);
    } catch (err) {
      showToast(`Đăng nhập thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Demo Login
  const handleDemoLogin = async (role) => {
    setLoading(true);
    try {
      const session = await demoLoginWallet(role);
      setUser(session.user);
      setWalletAddress(session.address);
      setNetworkName(session.networkName);
      setShowAuthModal(false);
      showToast(`Đã đăng nhập thành công: ${session.user.name} (${session.user.role})`);
    } catch (err) {
      showToast(`Đăng nhập demo thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    logout();
    setUser(null);
    setWalletAddress('');
    setNetworkName('');
    showToast('Đã đăng xuất tài khoản.');
  };

  // Fetch topics
  const fetchTopics = async () => {
    try {
      const query = user?.role === 'student' ? `?studentWallet=${user.walletAddress}` : '';
      const data = await apiRequest(`/topics${query}`);
      setBackendError('');
      if (Array.isArray(data)) {
        setTopics(data);
        setSelectedTopic((current) => data.find((topic) => topic._id === current?._id) || data[0] || null);
      }
    } catch (err) {
      setBackendError(err.message);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [user?.walletAddress]);

  const refreshTopic = async (id) => {
    const savedTopic = await apiRequest(`/topics/${id}`);
    setTopics((current) => current.map((topic) => (topic._id === id ? savedTopic : topic)));
    setSelectedTopic(savedTopic);
    return savedTopic;
  };

  const handleAssignStudent = async () => {
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    try {
      await apiRequest(`/topics/${selectedTopic._id}/assign`, { method: 'POST', body: { studentWallet: assigneeWallet.trim() } });
      
      // Nếu có MetaMask, đồng bộ lên Smart Contract
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          showToast('Đang gửi giao dịch phân công lên Blockchain...');
          const onChainRes = await assignStudentOnChain(selectedTopic.onChainId, assigneeWallet.trim());
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
        } catch (chainErr) {
          console.warn("Giao dịch on-chain phân công:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setAssigneeWallet('');
      showToast('Đã phân công sinh viên cho đề tài.');
    } catch (error) { 
      showToast(`Không thể phân công: ${error.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;
    if (kpiTotal !== 100) return showToast('Tổng trọng số KPI phải đúng bằng 100%.');
    setLoading(true);
    try {
      const toList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await apiRequest('/topics', { 
        method: 'POST', 
        body: {
          title: newTopicForm.title,
          description: newTopicForm.description,
          requiredSkills: toList(newTopicForm.requiredSkills),
          expectedKeywords: toList(newTopicForm.expectedKeywords),
          startDate: new Date().toISOString(),
          endDate: new Date(Math.max(...kpiRows.map((r) => new Date(r.deadline).getTime()))).toISOString(),
          kpis: kpiRows.map((r) => ({
            title: r.title, 
            criteria: r.criteria, 
            weightPercent: Number(r.weightPercent), 
            deadline: new Date(r.deadline).toISOString(),
          })),
        } 
      });

      // Nếu có MetaMask, gửi giao dịch createTopic lên Smart Contract
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress) {
        try {
          showToast('Đang gửi giao dịch khởi tạo lên Smart Contract...');
          const onChainRes = await createTopicOnChain({
            title: newTopicForm.title,
            ipfsHash: result.topic.ipfsDetailsHash,
            startDate: result.topic.startDate,
            endDate: result.topic.endDate,
            kpis: kpiRows
          });
          await apiRequest(`/topics/${result.topic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash, onChainId: onChainRes.onChainId }
          });
          result.topic.txHash = onChainRes.txHash;
          result.topic.onChainId = onChainRes.onChainId;
          showToast(`Đã ghi nhận đề tài on-chain (Tx: ${onChainRes.txHash.slice(0, 10)}...)`);
        } catch (chainErr) {
          console.warn("Giao dịch on-chain tạo đề tài:", chainErr.message);
        }
      }

      setTopics((current) => [result.topic, ...current]);
      setSelectedTopic(result.topic);
      setShowCreateTopicModal(false);
      setNewTopicForm({ title: '', description: '', requiredSkills: 'Solidity, React', expectedKeywords: 'Web3, KPI' });
      setKpiRows([newKpiRow(15, 40), newKpiRow(45, 60)]);
      showToast('Đã tạo đề tài thành công và lưu vết kiểm toán.');
    } catch (error) {
      showToast(`Không thể tạo đề tài: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmitKPI = async (e) => {
    e.preventDefault();
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/kpis/${showSubmitKPIModal.milestoneIndex}/submit`, {
        method: 'POST', 
        body: { submissionContent: submissionText },
      });

      // Nếu có MetaMask và đề tài có onChainId, gửi tx submitKPI lên blockchain
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          showToast('Đang gửi giao dịch nộp KPI lên Blockchain...');
          const onChainRes = await submitKpiOnChain(selectedTopic.onChainId, showSubmitKPIModal.milestoneIndex, result.ipfsHash);
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
        } catch (chainErr) {
          console.warn("Giao dịch on-chain nộp KPI:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setShowSubmitKPIModal(null); 
      setSubmissionText('');
      showToast(`Đã lưu báo cáo lên IPFS. AI (${result.aiAnalysis?.engine || 'NLP'}): liên quan ${result.aiAnalysis?.relevanceScore ?? '—'}%.`);
    } catch (error) { 
      showToast(`Không thể nộp KPI: ${error.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEvaluateKPI = async (e) => {
    e.preventDefault();
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    try {
      await apiRequest(`/topics/${selectedTopic._id}/kpis/${showEvaluateModal.milestoneIndex}/evaluate`, {
        method: 'POST', 
        body: { status: evalForm.status, score: Number(evalForm.score), mentorFeedback: evalForm.feedback },
      });

      // Nếu có MetaMask và có onChainId, gửi tx evaluateKPI lên blockchain
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          showToast('Đang gửi giao dịch nghiệm thu lên Blockchain...');
          const onChainRes = await evaluateKpiOnChain(
            selectedTopic.onChainId, 
            showEvaluateModal.milestoneIndex, 
            evalForm.status, 
            evalForm.score, 
            evalForm.feedback
          );
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
        } catch (chainErr) {
          console.warn("Giao dịch on-chain nghiệm thu:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setShowEvaluateModal(null);
      showToast(`Đã lưu kết quả nghiệm thu KPI: ${evalForm.score}/100.`);
    } catch (error) { 
      showToast(`Không thể đánh giá KPI: ${error.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCompleteAndCertify = async () => {
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/complete`, { method: 'POST', body: {} });

      // Nếu có MetaMask và có onChainId, gọi completeInternship mint SBT certificate
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          showToast('Đang mint Soulbound Token (SBT) chứng nhận on-chain...');
          const onChainRes = await completeInternshipOnChain(selectedTopic.onChainId, result.topic.certificateIpfsHash);
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
        } catch (chainErr) {
          console.warn("Giao dịch on-chain cấp chứng nhận:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      showToast(`Đã hoàn thành thực tập và cấp chứng nhận Soulbound Token! Điểm: ${result.topic.finalScore}/100.`);
    } catch (error) { 
      showToast(`Chưa thể cấp chứng nhận: ${error.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.requiredSkills && t.requiredSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid #6366f1',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          fontWeight: 500,
          animation: 'modalEnter 0.2s ease-out'
        }}>
          <Sparkles size={18} color="#818cf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal for Quick Demo or MetaMask */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onMetaMaskLogin={connectWallet}
        onDemoLogin={handleDemoLogin}
        loading={loading}
      />

      {/* Navigation Header */}
      <header style={{
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(10, 14, 23, 0.88)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              <span className="text-gradient">Web3 Internship</span> Hub
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nền Tảng Quản Lý Thực Tập Sinh • Minh Bạch KPI • AI Matching (BERT)
            </p>
          </div>
        </div>

        {/* Center Role Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-glass)'
        }}>
          <button
            id="role-company-btn"
            onClick={() => setUserRole('company')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: userRole === 'company' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: userRole === 'company' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Building2 size={15} />
            Doanh nghiệp / Mentor
          </button>
          <button
            id="role-student-btn"
            onClick={() => setUserRole('student')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: userRole === 'student' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'transparent',
              color: userRole === 'student' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <GraduationCap size={16} />
            Sinh viên thực tập
          </button>
        </div>

        {/* Right Wallet Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '6px 12px',
            borderRadius: '10px',
            background: contractConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            border: '1px solid var(--border-glass)',
            color: contractConnected ? '#34d399' : '#818cf8'
          }}>
            <ShieldCheck size={14} color={contractConnected ? '#34d399' : '#818cf8'} />
            <span>Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: contractConnected ? '#059669' : '#4f46e5', color: '#fff' }}>
              {contractConnected ? 'Active' : 'Hardhat'}
            </span>
          </div>

          {walletAddress ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-glass)',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: 'var(--text-muted)' }}>{networkName}</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
              </span>
              {user && <span style={{ color: '#a5b4fc', fontSize: '0.75rem' }}>({user.role})</span>}
              <button id="logout-btn" className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.75rem' }} onClick={disconnectWallet}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button id="connect-wallet-btn" className="btn btn-primary" disabled={loading} onClick={connectWallet}>
                <Wallet size={16} />
                {loading ? 'Đang xác thực...' : 'Kết nối Ví MetaMask'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAuthModal(true)} title="Đăng nhập nhanh với ví mẫu">
                <Sparkles size={16} color="#f59e0b" />
                Ví Demo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Backend Error Notice */}
      {backendError && (
        <div role="alert" style={{ background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '10px 28px', fontSize: '0.85rem' }}>
          {backendError}
        </div>
      )}

      {/* Main Tabs Navigation Bar */}
      <nav style={{
        background: 'rgba(15, 23, 42, 0.5)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 28px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '6px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'dashboard' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'dashboard' ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <BarChart3 size={17} /> Dashboard Tổng Quan
          </button>

          <button
            onClick={() => setActiveTab('topics')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'topics' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'topics' ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Layers size={17} /> Đề Tài & KPI Milestones ({topics.length})
          </button>

          <button
            onClick={() => setActiveTab('cv-jd')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'cv-jd' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'cv-jd' ? '2px solid #06b6d4' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Briefcase size={17} /> CV & JD Tuyển Dụng (AI Matching)
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'attendance' ? '#34d399' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'attendance' ? '2px solid #10b981' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <QrCode size={17} /> Nhiệm Vụ & QR Check-in
          </button>

          <button
            onClick={() => setActiveTab('web3')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'web3' ? '#c084fc' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'web3' ? '2px solid #a855f7' : '2px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <FileBadge size={17} /> Tra Cứu Chứng Chỉ On-Chain (SBT)
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '28px',
        flex: 1,
      }}>
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={user} 
            topics={topics} 
            onSelectTopic={(t) => { setSelectedTopic(t); setActiveTab('topics'); }} 
          />
        )}

        {/* VIEW 2: CV & JD MATCHING */}
        {activeTab === 'cv-jd' && (
          <CvJdView user={user} showToast={showToast} />
        )}

        {/* VIEW 3: ATTENDANCE & QR CHECK-IN */}
        {activeTab === 'attendance' && (
          <AttendanceView user={user} showToast={showToast} />
        )}

        {/* VIEW 4: WEB3 CERTIFICATE EXPLORER */}
        {activeTab === 'web3' && (
          <Web3CertificateView showToast={showToast} />
        )}

        {/* VIEW 5: TOPICS & KPI MILESTONES (PRIMARY WORKFLOW) */}
        {activeTab === 'topics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
            {/* Left Column: Topics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    id="search-topics-input"
                    className="input-field"
                    placeholder="Tìm đề tài, kỹ năng..."
                    style={{ paddingLeft: '36px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {userRole === 'company' && (
                  <button
                    id="create-topic-btn"
                    className="btn btn-primary"
                    onClick={() => { if (requireLogin()) setShowCreateTopicModal(true); }}
                    title="Tạo đề tài mới"
                  >
                    <PlusCircle size={18} /> Tạo
                  </button>
                )}
              </div>

              {/* Topic Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Danh Sách Đề Tài Thực Tập ({filteredTopics.length})
                </div>

                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopic?._id === topic._id;
                  return (
                    <div
                      key={topic._id}
                      id={`topic-item-${topic._id}`}
                      className="glass-panel"
                      onClick={() => setSelectedTopic(topic)}
                      style={{
                        padding: '18px',
                        cursor: 'pointer',
                        borderColor: isSelected ? '#818cf8' : 'var(--border-glass)',
                        boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className={`badge badge-${topic.status}`}>
                          {topic.status === 'open' ? 'Đang tuyển' : topic.status === 'in_progress' ? 'Đang thực tập' : 'Đã hoàn thành'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>
                          {topic.onChainId ? `On-chain #${topic.onChainId}` : 'Off-chain'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.35 }}>
                        {topic.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {topic.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>{topic.companyName}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#818cf8' }}>
                          {topic.kpis?.length || 0} mốc KPI <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Topic Detail & KPI Timeline */}
            {selectedTopic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Topic Header Card */}
                <div className="glass-panel" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className={`badge badge-${selectedTopic.status}`}>
                          {selectedTopic.onChainId ? `On-chain #${selectedTopic.onChainId}` : 'OFF-CHAIN (CHƯA GHI BLOCKCHAIN)'} • {selectedTopic.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building2 size={14} /> {selectedTopic.companyName}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                        {selectedTopic.title}
                      </h2>
                    </div>

                    {/* Status Action Buttons */}
                    {userRole === 'company' && selectedTopic.status === 'open' && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input 
                          className="input-field" 
                          aria-label="Ví sinh viên" 
                          placeholder="0x… ví sinh viên" 
                          value={assigneeWallet} 
                          onChange={(e) => setAssigneeWallet(e.target.value)} 
                          style={{ width: '220px' }} 
                        />
                        <button className="btn btn-primary" disabled={loading} onClick={handleAssignStudent}>
                          Phân công
                        </button>
                      </div>
                    )}
                    {userRole === 'company' && selectedTopic.status !== 'completed' && selectedTopic.status !== 'open' && (
                      <button
                        id="complete-internship-btn"
                        className="btn btn-emerald"
                        disabled={loading}
                        onClick={handleCompleteAndCertify}
                      >
                        <Award size={18} />
                        Nghiệm thu & Cấp Chứng Nhận
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {selectedTopic.description}
                  </p>

                  {/* Skills & Metadata Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', background: 'rgba(0, 0, 0, 0.25)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Yêu cầu Kỹ năng:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedTopic.requiredSkills?.map((skill, i) => (
                          <span key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Mã lưu metadata:</div>
                      {!selectedTopic.ipfsDetailsHash ? (
                        <span style={{ fontSize: '0.78rem', color: '#fbbf24', wordBreak: 'break-all' }}>
                          Chưa upload IPFS (cần cấu hình PINATA_JWT)
                        </span>
                      ) : (
                        <a href={`https://ipfs.io/ipfs/${selectedTopic.ipfsDetailsHash}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
                          {selectedTopic.ipfsDetailsHash} <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPI Milestones List */}
                <div className="glass-panel" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                        Tiến độ Thực tập & Tiêu chí KPI ({selectedTopic.kpis?.length || 0} mốc)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Tổng trọng số = 100%. Báo cáo được đối chiếu ngữ nghĩa bằng AI NLP Microservice.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedTopic.kpis?.map((kpi, idx) => (
                      <div
                        key={idx}
                        id={`kpi-card-${kpi.milestoneIndex}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '12px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{kpi.title}</span>
                              <span className={`badge badge-${kpi.status}`}>{kpi.status.toUpperCase()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{kpi.description}</p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Trọng số: <strong style={{ color: '#fff' }}>{kpi.weightPercent}%</strong></div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Hạn chót: {kpi.deadline ? new Date(kpi.deadline).toLocaleDateString('vi-VN') : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Submission Details */}
                        {kpi.submissionContent && (
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #6366f1' }}>
                            <div style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '4px' }}>
                              Báo cáo nộp bài:
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px' }}>
                              "{kpi.submissionContent}"
                            </div>

                            {/* AI NLP Analysis Card */}
                            {kpi.aiAnalysis && (
                              <div style={{
                                background: 'rgba(168, 85, 247, 0.08)',
                                border: '1px solid rgba(168, 85, 247, 0.25)',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <BrainCircuit size={18} color="#c084fc" />
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: '#c084fc' }}>AI tham khảo ({kpi.aiAnalysis.engine || 'BERT'}): </span>
                                    <span style={{ color: 'var(--text-muted)' }}>{kpi.aiAnalysis.feedbackSummary}</span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Độ bám sát: </span>
                                  <strong style={{ color: '#38bdf8' }}>{kpi.aiAnalysis.relevanceScore}%</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mentor Evaluation */}
                        {kpi.score > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            <CheckCircle2 size={16} color="#10b981" />
                            <span>Điểm nghiệm thu: <strong style={{ color: '#10b981' }}>{kpi.score}/100</strong></span>
                            {kpi.mentorFeedback && <span style={{ color: 'var(--text-muted)' }}>— Nhận xét: "{kpi.mentorFeedback}"</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          {userRole === 'student' && kpi.status !== 'approved' && (
                            <button
                              id={`submit-kpi-${kpi.milestoneIndex}-btn`}
                              className="btn btn-secondary"
                              onClick={() => {
                                if (requireLogin()) {
                                  setShowSubmitKPIModal(kpi);
                                  setSubmissionText(kpi.submissionContent || '');
                                }
                              }}
                            >
                              <FileCheck2 size={16} />
                              {kpi.status === 'submitted' ? 'Cập nhật Báo cáo' : 'Nộp Báo cáo KPI'}
                            </button>
                          )}

                          {userRole === 'company' && kpi.status === 'submitted' && (
                            <button
                              id={`evaluate-kpi-${kpi.milestoneIndex}-btn`}
                              className="btn btn-primary"
                              onClick={() => {
                                if (requireLogin()) {
                                  setShowEvaluateModal(kpi);
                                  setEvalForm({ score: kpi.aiAnalysis?.suggestedScore || 90, status: 'approved', feedback: 'Báo cáo đạt chuẩn tiêu chí KPI đề ra.' });
                                }
                              }}
                            >
                              <ShieldCheck size={16} />
                              Nghiệm thu & Chấm điểm
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Chọn một đề tài từ danh sách để xem chi tiết và quản lý KPI
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Create Topic */}
      {showCreateTopicModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Tạo Đề Tài Thực Tập Mới</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Quy tắc bắt buộc: Tổng trọng số tất cả KPI milestones phải bằng đúng 100%
            </p>

            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tiêu đề Đề tài:</label>
                <input
                  id="new-topic-title"
                  className="input-field"
                  required
                  placeholder="Ví dụ: Xây dựng Smart Contract DAO & DApp Voting"
                  value={newTopicForm.title}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mô tả chi tiết:</label>
                <textarea
                  id="new-topic-description"
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Mô tả mục tiêu và sản phẩm thực tập..."
                  value={newTopicForm.description}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Yêu cầu Kỹ năng (cách nhau dấu phẩy):</label>
                <input
                  id="new-topic-skills"
                  className="input-field"
                  value={newTopicForm.requiredSkills}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, requiredSkills: e.target.value })}
                />
              </div>

              {/* KPI Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>KPI milestones (bắt buộc tổng = 100%):</label>
                  <strong id="kpi-weight-total" style={{ fontSize: '0.85rem', color: kpiTotal === 100 ? '#34d399' : '#f87171' }}>
                    Tổng: {kpiTotal}%
                  </strong>
                </div>
                {kpiRows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 70px 140px auto', gap: '6px', marginBottom: '6px' }}>
                    <input className="input-field" placeholder="Tên KPI" required value={row.title} onChange={(e) => updateKpiRow(i, { title: e.target.value })} />
                    <input className="input-field" placeholder="Tiêu chí đánh giá" required value={row.criteria} onChange={(e) => updateKpiRow(i, { criteria: e.target.value })} />
                    <input className="input-field" type="number" min="1" max="100" required value={row.weightPercent} onChange={(e) => updateKpiRow(i, { weightPercent: e.target.value })} />
                    <input className="input-field" type="date" required value={row.deadline} onChange={(e) => updateKpiRow(i, { deadline: e.target.value })} />
                    <button type="button" className="btn btn-secondary" disabled={kpiRows.length <= 1} onClick={() => setKpiRows((rows) => rows.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={() => setKpiRows((rows) => [...rows, newKpiRow(30)])}>
                  + Thêm Mốc KPI
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTopicModal(false)}>Hủy</button>
                <button id="submit-new-topic-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo Đề Tài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit KPI */}
      {showSubmitKPIModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Nộp Báo Cáo Nghiệm Thu KPI</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Mốc: <strong>{showSubmitKPIModal.title}</strong>
            </p>

            <form onSubmit={handleSubmitKPI} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Nội dung Báo cáo & Minh chứng kết quả:
                </label>
                <textarea
                  id="kpi-submission-textarea"
                  className="input-field"
                  rows={5}
                  required
                  placeholder="Trình bày chi tiết kết quả đã hoàn thành, đường dẫn commit github, file kết quả..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitKPIModal(null)}>Hủy</button>
                <button id="confirm-submit-kpi-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang phân tích AI...' : 'Lưu Báo Cáo & Phân Tích'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Evaluate KPI */}
      {showEvaluateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Nghiệm Thu & Chấm Điểm KPI</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Đánh giá mốc: <strong>{showEvaluateModal.title}</strong>
            </p>

            <form onSubmit={handleEvaluateKPI} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Điểm số (Thang điểm 0 - 100):</label>
                <input
                  id="eval-score-input"
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  required
                  value={evalForm.score}
                  onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Trạng thái nghiệm thu:</label>
                <select
                  id="eval-status-select"
                  className="input-field"
                  value={evalForm.status}
                  onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value })}
                >
                  <option value="approved">Chấp thuận đạt yêu cầu (Approved)</option>
                  <option value="rejected">Yêu cầu chỉnh sửa nộp lại (Rejected)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nhận xét chi tiết của Mentor:</label>
                <textarea
                  id="eval-feedback-textarea"
                  className="input-field"
                  rows={3}
                  value={evalForm.feedback}
                  onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEvaluateModal(null)}>Hủy</button>
                <button id="confirm-eval-btn" type="submit" className="btn btn-emerald" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Xác Nhận Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '20px 28px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        background: 'rgba(10, 14, 23, 0.95)'
      }}>
        Nền tảng Quản lý Thực tập sinh Web3 dựa trên KPI & AI (BERT) • MERN Stack + Solidity + IPFS (Pinata)
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  ShieldCheck,
  Sparkles,
  PlusCircle,
  FileCheck2,
  Award,
  CheckCircle2,
  Clock,
  ChevronRight,
  BrainCircuit,
  Building2,
  ExternalLink,
  Search
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
import AccountOverview from './components/AccountOverview';
import {IdentitySettings} from './components/GoogleIdentity';
import AppShell from './components/AppShell';
import ViewBoundary from './components/ViewBoundary';
import { Dialog, EmptyState, LoadingSkeleton, UnavailableView } from './components/ui';
const DashboardView = lazy(() => import('./components/DashboardView'));
const CvJdView = lazy(() => import('./components/CvJdView'));
const AttendanceView = lazy(() => import('./components/AttendanceView'));
const Web3CertificateView = lazy(() => import('./components/Web3CertificateView'));
const CoreBusinessView = lazy(() => import('./components/business/CoreBusinessView'));

const isoDay = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const newKpiRow = (days = 14, weightPercent = '') => ({ title: '', criteria: '', weightPercent, deadline: isoDay(days) });

export default function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [roleChoice, setRoleChoice] = useState('company'); // 'company' | 'student'
  const setUserRole = (role) => { if (!user) setRoleChoice(role); };
  const [contractConnected, setContractConnected] = useState(false);

  // Navigation Tabs: 'dashboard' | 'topics' | 'cv-jd' | 'attendance' | 'web3'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [coreEnabled, setCoreEnabled] = useState(false);
  const [unifiedMode,setUnifiedMode]=useState(false);
  const [authMode,setAuthMode]=useState(location.pathname==='/register'?'register':'login');
  const [sessionReady, setSessionReady] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(['/login','/register'].includes(location.pathname));
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showSubmitKPIModal, setShowSubmitKPIModal] = useState(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(null);

  // Topics & Data State
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const isTopicOwner = user?.role === 'company' && selectedTopic?.companyWallet === user.walletAddress;
  const isAssignedStudent = user?.role === 'student' && selectedTopic?.assignedStudentWallet === user.walletAddress;
  const canEvaluateTopic = isTopicOwner || (user?.role === 'mentor' && selectedTopic?.mentorWallet === user.walletAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('unavailable');
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
  const [evalForm, setEvalForm] = useState({ score: '', status: 'approved', feedback: '' });
  const [assigneeWallet, setAssigneeWallet] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  const requireLogin = () => {
    if (user) return true;
    setShowAuthModal(true);
    showToast('Hãy kết nối và xác thực ví để thực hiện thao tác.');
    return false;
  };

  // Restore session
  useEffect(() => {
    let active = true;
    const initialToken = getToken();
    Promise.all([apiRequest('/core/capabilities').catch(()=>({enabled:false,unified:false})),restoreSession()])
      .then(([capabilities,restored]) => {
        if(!active)return;
        setCoreEnabled(capabilities.enabled===true);setUnifiedMode(capabilities.unified===true);
        if(getToken()===initialToken&&restored){
          setUser(restored);setWalletAddress(restored.walletAddress||'');setNetworkName('Chưa kiểm tra mạng ví');
          setActiveTab(capabilities.unified?'dashboard':restored.walletAddress?'dashboard':'core-profile');setShowAuthModal(false);
          if(['/login','/register'].includes(location.pathname))history.replaceState({},'', '/');
        }
      })
      .catch((err) => { if (active && getToken() === initialToken) setBackendError(err.message); })
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(()=>{const update=()=>{if(user&&['/login','/register'].includes(location.pathname)){history.replaceState({},'','/');setShowAuthModal(false);return;}setAuthMode(location.pathname==='/register'?'register':'login');setShowAuthModal(['/login','/register'].includes(location.pathname));};window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update);},[user]);

  // MetaMask listener
  useEffect(() => {
    if(['google','password'].includes(user?.authProvider))return undefined;
    if (!window.ethereum?.on) return undefined;
    const onAccountsChanged = () => {
      logout();
      setUser(null);
      setWalletAddress('');
      setNetworkName('');
      setTopics([]);
      setSelectedTopic(null);
      setShowCreateTopicModal(false);
      setShowSubmitKPIModal(null);
      setShowEvaluateModal(null);
      showToast('Địa chỉ ví đã thay đổi, hãy xác thực lại.');
    };
    window.ethereum.on('accountsChanged', onAccountsChanged);
    return () => window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
  }, [user]);

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
    setTopics([]);
    setSelectedTopic(null);
    setUser(null);
    setWalletAddress('');
    setNetworkName('');
    showToast('Đã đăng xuất tài khoản.');
  };

  const handleGoogleSession = async () => {
    const restored=await restoreSession();
    if(!restored)throw new Error('Không khôi phục được phiên; hãy đăng nhập lại.');
    setUser(restored);setWalletAddress(restored.walletAddress||'');setTopics([]);setSelectedTopic(null);
    setNetworkName(restored.walletAddress?'Đã xác thực; chưa kiểm tra mạng':'Tài khoản · Chưa liên kết ví');
    setShowAuthModal(false);history.replaceState({},'','/');setActiveTab(unifiedMode?'dashboard':'core-profile');setBackendError('');showToast('Đã cập nhật phiên đăng nhập.');
  };

  const handleProfileSaved = async () => {
    const token=getToken();
    try{
      const restored=await restoreSession();
      if(token!==getToken())return;
      if(!restored){setUser(null);return;}
      setUser(restored);setActiveTab('account-overview');setBackendError('');
      showToast('Đã lưu hồ sơ thành công.');
    }catch(error){if(token===getToken())setBackendError('Hồ sơ đã lưu nhưng chưa tải lại được tài khoản: '+error.message);}
  };

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    if(unifiedMode || !user || !user.walletAddress)return;
    const sessionToken = getToken();
    try {
      const query = user?.role === 'student' ? `?studentWallet=${user.walletAddress}` : '';
      const data = await apiRequest(`/topics${query}`);
      if (sessionToken !== getToken()) return;
      setBackendError('');
      if (Array.isArray(data)) {
        setTopics(data);
        setSelectedTopic((current) => data.find((topic) => topic._id === current?._id) || data[0] || null);
      }
    } catch (err) {
      setBackendError(err.message);
    }
  }, [user,unifiedMode]);

  useEffect(() => {
    if (!sessionReady) return undefined;
    // Scheduling avoids synchronous effect updates; the callback still performs GET only.
    const timer = setTimeout(() => { void fetchTopics(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchTopics, sessionReady]);

  const refreshTopic = async (id) => {
    const savedTopic = await apiRequest(`/topics/${id}`);
    setTopics((current) => current.map((topic) => (topic._id === id ? savedTopic : topic)));
    setSelectedTopic(savedTopic);
    return savedTopic;
  };

  const handleAssignStudent = async () => {
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    let chainResult = 'chưa ghi blockchain';
    setTransactionStatus('unavailable');
    try {
      await apiRequest(`/topics/${selectedTopic._id}/assign`, { method: 'POST', body: { studentWallet: assigneeWallet.trim() } });

      // Nếu có MetaMask, đồng bộ lên Smart Contract
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          setTransactionStatus('pending');
          showToast('Đang gửi giao dịch phân công lên Blockchain...');
          const onChainRes = await assignStudentOnChain(selectedTopic.onChainId, assigneeWallet.trim());
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
          setTransactionStatus('confirmed');
          chainResult = 'receipt đã được server xác minh';
        } catch (chainErr) {
          setTransactionStatus(chainErr.code === 'CHAIN_PENDING' ? 'pending' : 'failed');
          chainResult = `giao dịch chưa được xác minh: ${chainErr.message}`;
          console.warn("Giao dịch on-chain phân công:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setAssigneeWallet('');
      showToast(`Đã lưu phân công trong database; ${chainResult}.`);
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
    let chainResult = 'chưa ghi blockchain';
    setTransactionStatus('unavailable');
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
          setTransactionStatus('pending');
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
          setTransactionStatus('confirmed');
          chainResult = 'receipt đã được server xác minh';
        } catch (chainErr) {
          setTransactionStatus(chainErr.code === 'CHAIN_PENDING' ? 'pending' : 'failed');
          chainResult = `giao dịch chưa được xác minh: ${chainErr.message}`;
          console.warn("Giao dịch on-chain tạo đề tài:", chainErr.message);
        }
      }

      setTopics((current) => [result.topic, ...current]);
      setSelectedTopic(result.topic);
      setShowCreateTopicModal(false);
      setNewTopicForm({ title: '', description: '', requiredSkills: 'Solidity, React', expectedKeywords: 'Web3, KPI' });
      setKpiRows([newKpiRow(15, 40), newKpiRow(45, 60)]);
      showToast(`Đã lưu đề tài trong database; ${chainResult}.`);
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
    let chainResult = 'chưa ghi blockchain';
    setTransactionStatus('unavailable');
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/kpis/${showSubmitKPIModal.milestoneIndex}/submit`, {
        method: 'POST',
        body: { submissionContent: submissionText },
      });

      // Nếu có MetaMask và đề tài có onChainId, gửi tx submitKPI lên blockchain
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          setTransactionStatus('pending');
          showToast('Đang gửi giao dịch nộp KPI lên Blockchain...');
          const onChainRes = await submitKpiOnChain(selectedTopic.onChainId, showSubmitKPIModal.milestoneIndex, result.ipfsHash);
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
          setTransactionStatus('confirmed');
          chainResult = 'receipt đã được server xác minh';
        } catch (chainErr) {
          setTransactionStatus(chainErr.code === 'CHAIN_PENDING' ? 'pending' : 'failed');
          chainResult = `giao dịch chưa được xác minh: ${chainErr.message}`;
          console.warn("Giao dịch on-chain nộp KPI:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setShowSubmitKPIModal(null);
      setSubmissionText('');
      showToast(`Đã lưu báo cáo IPFS; AI ${result.aiAnalysis?.engine || 'không rõ engine'}; ${chainResult}.`);
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
    let chainResult = 'chưa ghi blockchain';
    setTransactionStatus('unavailable');
    try {
      await apiRequest(`/topics/${selectedTopic._id}/kpis/${showEvaluateModal.milestoneIndex}/evaluate`, {
        method: 'POST',
        body: { status: evalForm.status, score: Number(evalForm.score), mentorFeedback: evalForm.feedback },
      });

      // Nếu có MetaMask và có onChainId, gửi tx evaluateKPI lên blockchain
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          setTransactionStatus('pending');
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
          setTransactionStatus('confirmed');
          chainResult = 'receipt đã được server xác minh';
        } catch (chainErr) {
          setTransactionStatus(chainErr.code === 'CHAIN_PENDING' ? 'pending' : 'failed');
          chainResult = `giao dịch chưa được xác minh: ${chainErr.message}`;
          console.warn("Giao dịch on-chain nghiệm thu:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      setShowEvaluateModal(null);
      showToast(`Đã lưu kết quả KPI ${evalForm.score}/100; ${chainResult}.`);
    } catch (error) {
      showToast(`Không thể đánh giá KPI: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAndCertify = async () => {
    if (!requireLogin() || !selectedTopic) return;
    setLoading(true);
    let chainResult = 'chưa ghi blockchain';
    setTransactionStatus('unavailable');
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/complete`, { method: 'POST', body: {} });

      // Nếu có MetaMask và có onChainId, gọi completeInternship mint SBT certificate
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress && selectedTopic.onChainId) {
        try {
          setTransactionStatus('pending');
          showToast('Đang ghi nhận kết quả tổng kết trên contract...');
          const onChainRes = await completeInternshipOnChain(selectedTopic.onChainId, result.topic.certificateIpfsHash);
          await apiRequest(`/topics/${selectedTopic._id}/record-chain-tx`, {
            method: 'POST',
            body: { txHash: onChainRes.txHash }
          });
          setTransactionStatus('confirmed');
          chainResult = 'receipt đã được server xác minh';
        } catch (chainErr) {
          setTransactionStatus(chainErr.code === 'CHAIN_PENDING' ? 'pending' : 'failed');
          chainResult = `giao dịch chưa được xác minh: ${chainErr.message}`;
          console.warn("Giao dịch on-chain cấp chứng nhận:", chainErr.message);
        }
      }

      await refreshTopic(selectedTopic._id);
      showToast(`Đã lưu tổng kết ${result.topic.finalScore}/100; ${chainResult}. Chưa mint NFT/SBT.`);
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
        }} role="status" aria-live="polite" className="toast">
          <Sparkles size={18} color="var(--primary-light)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal for Quick Demo or MetaMask */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {setShowAuthModal(false);history.replaceState({},'','/');}}
        onMetaMaskLogin={connectWallet}
        onDemoLogin={handleDemoLogin}
        onGoogleSession={handleGoogleSession}
        mode={authMode}
        onModeChange={mode=>{setAuthMode(mode);history.pushState({},'',mode==='register'?'/register':'/login');}}
        roleChoice={roleChoice}
        onRoleChoice={setUserRole}
        loading={loading}
      />

      <AppShell unified={unifiedMode} authReady={sessionReady} coreEnabled={coreEnabled} activeTab={activeTab} onNavigate={setActiveTab} user={user} walletAddress={walletAddress}
        networkName={networkName} onConnect={() => {setAuthMode('login');history.pushState({},'','/login');setShowAuthModal(true);}} onDemo={() => setShowAuthModal(true)} onLogout={disconnectWallet} loading={loading}
        roleChoice={roleChoice} onRoleChoice={setUserRole} transactionStatus={transactionStatus}
        onCheckContract={() => checkContractConnection().then(setContractConnected).catch(() => setContractConnected(false))} contractConnected={contractConnected} contractAddress={CONTRACT_ADDRESS} error={backendError}>
      {user&&activeTab==='core-profile'&&<IdentitySettings user={user} onSession={handleGoogleSession} />}
      <ViewBoundary key={`${activeTab}-${user?._id || 'guest'}`}><Suspense fallback={<LoadingSkeleton label="Đang tải màn hình" />}>
        {user&&!unifiedMode&&!user.walletAddress&&!['core-profile','account-overview'].includes(activeTab)?<EmptyState title="Cần liên kết ví">Mở Hồ sơ cá nhân để liên kết ví trước khi sử dụng nghiệp vụ.</EmptyState>:<>
        {user&&activeTab==='account-overview'&&<AccountOverview user={user} onEdit={()=>setActiveTab('core-profile')} />}
        {activeTab.startsWith('unavailable-') && <UnavailableView title="Chức năng chưa triển khai" />}
        {coreEnabled && activeTab.startsWith('core-') && <CoreBusinessView key={`${activeTab}-${user?.walletAddress || 'guest'}`} view={activeTab} user={user} unified={unifiedMode} onNavigate={setActiveTab} onProfileSaved={handleProfileSaved} />}
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView
            unified={unifiedMode}
            coreEnabled={coreEnabled}
            user={user}
            topics={topics}
            onSelectTopic={(t) => { setSelectedTopic(t); setActiveTab('topics'); }}
          />
        )}

        {/* VIEW 2: CV & JD MATCHING */}
        {activeTab === 'cv-jd' && (
          <CvJdView coreEnabled={coreEnabled} key={user?.walletAddress || 'guest'} user={user} showToast={showToast} />
        )}

        {/* VIEW 3: ATTENDANCE & QR CHECK-IN */}
        {activeTab === 'attendance' && (
          <AttendanceView key={user?.walletAddress || 'guest'} user={user} showToast={showToast} />
        )}

        {/* VIEW 4: WEB3 CERTIFICATE EXPLORER */}
        {activeTab === 'web3' && (
          <Web3CertificateView showToast={showToast} user={user} />
        )}

        {/* VIEW 5: TOPICS & KPI MILESTONES (PRIMARY WORKFLOW) */}
        {activeTab === 'topics' && (
          <div className="topics-layout">
            {/* Left Column: Topics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    id="search-topics-input" aria-label="Tìm đề tài, kỹ năng"
                    className="input-field"
                    placeholder="Tìm đề tài, kỹ năng..."
                    style={{ paddingLeft: '36px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {user?.role === 'company' && (
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

                {!filteredTopics.length && <EmptyState title="Chưa có đề tài phù hợp">Thay đổi từ khóa hoặc chờ đề tài được công bố.</EmptyState>}
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopic?._id === topic._id;
                  return (
                    <div
                      key={topic._id}
                      id={`topic-item-${topic._id}`}
                      className="glass-panel topic-card"
                      role="button" tabIndex={0} aria-pressed={isSelected}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTopic(topic); } }}
                      onClick={() => setSelectedTopic(topic)}
                      style={{
                        padding: '18px',
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--primary-light)' : 'var(--border-glass)',
                        boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className={`badge badge-${topic.status}`}>
                          {topic.status === 'open' ? 'Đang tuyển' : topic.status === 'in_progress' ? 'Đang thực tập' : 'Đã hoàn thành'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-light)' }}>
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
                    {isTopicOwner && selectedTopic.status === 'open' && (
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
                    {isTopicOwner && selectedTopic.status !== 'completed' && selectedTopic.status !== 'open' && (
                      <button
                        id="complete-internship-btn"
                        className="btn btn-emerald"
                        disabled={loading}
                        onClick={handleCompleteAndCertify}
                      >
                        <Award size={18} />
                        Tổng kết thực tập (chưa mint token)
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {selectedTopic.description}
                  </p>

                  {/* Skills & Metadata Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', background: 'var(--surface-muted)', padding: '16px', borderRadius: '12px' }}>
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
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', wordBreak: 'break-all' }}>
                          Chưa upload IPFS · dịch vụ lưu trữ chưa khả dụng
                        </span>
                      ) : (
                        <a href={`https://ipfs.io/ipfs/${selectedTopic.ipfsDetailsHash}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Trọng số: <strong style={{ color: 'var(--text-main)' }}>{kpi.weightPercent}%</strong></div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Hạn chót: {kpi.deadline ? new Date(kpi.deadline).toLocaleDateString('vi-VN') : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Submission Details */}
                        {kpi.submissionContent && (
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #6366f1' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: '4px' }}>
                              Báo cáo nộp bài:
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>
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
                                  <BrainCircuit size={18} color="var(--accent-purple)" />
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>AI tham khảo ({kpi.aiAnalysis.engine || 'chưa rõ engine'}): </span>
                                    <span style={{ color: 'var(--text-muted)' }}>{kpi.aiAnalysis.feedbackSummary}</span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Độ bám sát: </span>
                                  <strong style={{ color: 'var(--accent-cyan)' }}>{kpi.aiAnalysis.relevanceScore}%</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mentor Evaluation */}
                        {['approved', 'rejected'].includes(kpi.status) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            <CheckCircle2 size={16} color="var(--accent-emerald)" />
                            <span>Điểm nghiệm thu: <strong style={{ color: 'var(--accent-emerald)' }}>{kpi.score}/100</strong></span>
                            {kpi.mentorFeedback && <span style={{ color: 'var(--text-muted)' }}>— Nhận xét: "{kpi.mentorFeedback}"</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          {isAssignedStudent && ['pending', 'rejected'].includes(kpi.status) && (
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

                          {canEvaluateTopic && kpi.status === 'submitted' && (
                            <button
                              id={`evaluate-kpi-${kpi.milestoneIndex}-btn`}
                              className="btn btn-primary"
                              onClick={() => {
                                if (requireLogin()) {
                                  setShowEvaluateModal(kpi);
                                  setEvalForm({ score: kpi.aiAnalysis?.suggestedScore ?? '', status: 'approved', feedback: '' });
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
      </>}
      </Suspense></ViewBoundary>
      </AppShell>

      {/* MODAL: Create Topic */}
      {showCreateTopicModal && (
        <Dialog label="Tạo đề tài" onClose={() => setShowCreateTopicModal(false)}>
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Tạo Đề Tài Thực Tập Mới</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Quy tắc bắt buộc: Tổng trọng số tất cả KPI milestones phải bằng đúng 100%
            </p>

            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tiêu đề Đề tài:</label>
                <input aria-label="Ví dụ: Xây dựng Smart Contract DAO & DApp Voting"
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
                <textarea aria-label="Mô tả mục tiêu và sản phẩm thực tập..."
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
                <input aria-label="Kỹ năng yêu cầu"
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
                  <strong id="kpi-weight-total" style={{ fontSize: '0.85rem', color: kpiTotal === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    Tổng: {kpiTotal}%
                  </strong>
                </div>
                {kpiRows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 70px 140px auto', gap: '6px', marginBottom: '6px' }}>
                    <label>Tên KPI<input aria-label="Tên KPI" className="input-field" placeholder="Tên KPI" required value={row.title} onChange={(e) => updateKpiRow(i, { title: e.target.value })} /></label>
                    <label>Tiêu chí<input aria-label="Tiêu chí đánh giá" className="input-field" placeholder="Tiêu chí đánh giá" required value={row.criteria} onChange={(e) => updateKpiRow(i, { criteria: e.target.value })} /></label>
                    <label>Trọng số (%)<input aria-label="Trọng số KPI (%)" className="input-field" type="number" min="1" max="100" required value={row.weightPercent} onChange={(e) => updateKpiRow(i, { weightPercent: e.target.value })} /></label>
                    <label>Hạn nộp<input aria-label="Hạn nộp KPI" className="input-field" type="date" required value={row.deadline} onChange={(e) => updateKpiRow(i, { deadline: e.target.value })} /></label>
                    <button type="button" aria-label="Xóa dòng KPI chưa lưu" className="btn btn-secondary" disabled={kpiRows.length <= 1} onClick={() => setKpiRows((rows) => rows.filter((_, idx) => idx !== i))}>✕</button>
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
        </Dialog>
      )}

      {/* MODAL: Submit KPI */}
      {showSubmitKPIModal && (
        <Dialog label="Nộp báo cáo KPI" onClose={() => setShowSubmitKPIModal(null)}>
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
                <textarea aria-label="Trình bày chi tiết kết quả đã hoàn thành, đường dẫn commit github, file kết quả..."
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
        </Dialog>
      )}

      {/* MODAL: Evaluate KPI */}
      {showEvaluateModal && (
        <Dialog label="Đánh giá KPI" onClose={() => setShowEvaluateModal(null)}>
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Nghiệm Thu & Chấm Điểm KPI</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Đánh giá mốc: <strong>{showEvaluateModal.title}</strong>
            </p>

            <form onSubmit={handleEvaluateKPI} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Điểm số (Thang điểm 0 - 100):</label>
                <input aria-label="eval-score-input"
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
                <select aria-label="eval-status-select"
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
                <textarea aria-label="eval-feedback-textarea"
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
        </Dialog>
      )}


    </div>
  );
}

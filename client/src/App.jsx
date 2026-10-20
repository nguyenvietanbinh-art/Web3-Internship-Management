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
  Filter
} from 'lucide-react';
import { ethers } from 'ethers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `API error (${response.status})`);
  return data;
}

// Initial Mock data so the UI is immediately alive and gorgeous even before database seed
const INITIAL_TOPICS = [
  {
    _id: "demo-topic-1",
    onChainId: 1,
    title: "Phát triển Hệ thống Quản trị Phi tập trung Web3 DAO",
    description: "Nghiên cứu cơ chế biểu quyết Snapshot, viết Smart Contract quản trị và xây dựng giao diện tích hợp ví Web3 cho doanh nghiệp.",
    requiredSkills: ["Solidity", "React", "Web3.js", "TypeScript"],
    expectedKeywords: ["Smart Contract", "Governance", "DAO", "Voting", "ERC-20"],
    companyWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    companyName: "Nexus Labs Blockchain",
    assignedStudentWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    assignedStudentName: "Trần Minh Khoa",
    status: "in_progress",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    ipfsDetailsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    kpis: [
      {
        milestoneIndex: 0,
        title: "Mốc 1: Khảo sát & Thiết kế Smart Contract DAO",
        description: "Hoàn thiện tài liệu kiến trúc kỹ thuật và viết hợp đồng thông minh quản trị đạt chuẩn OpenZeppelin.",
        deadline: "2026-09-20",
        weightPercent: 30,
        status: "approved",
        submissionIpfsHash: "QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1KsDwUuaWo",
        submissionContent: "Đã hoàn thành hợp đồng GovernToken.sol và DaoGovernor.sol, kiểm thử đạt 98% code coverage trên Hardhat.",
        score: 95,
        mentorFeedback: "Thiết kế chặt chẽ, tuân thủ đúng tiêu chuẩn an toàn bảo mật.",
        aiAnalysis: {
          relevanceScore: 92,
          suggestedScore: 94,
          feedbackSummary: "Báo cáo bám sát 100% tiêu chí mốc 1 và sử dụng đúng các thuật ngữ kỹ thuật chuyên sâu.",
          foundKeywords: ["Smart Contract", "Governance", "DAO"]
        }
      },
      {
        milestoneIndex: 1,
        title: "Mốc 2: Tích hợp Frontend Dashboard & Kết nối Ví",
        description: "Xây dựng giao diện bỏ phiếu đề xuất, kết nối MetaMask và kiểm thử trên Sepolia Testnet.",
        deadline: "2026-10-25",
        weightPercent: 40,
        status: "submitted",
        submissionIpfsHash: "QmZtmD2qtSYbRxkKJ5z987cR297v5BqW1zD8sL5vJ1pQe8",
        submissionContent: "Đã hoàn thiện giao diện bằng Vite React, tích hợp ethers.js cho phép kết nối ví và gửi giao dịch đề xuất biểu quyết thành công.",
        score: 0,
        mentorFeedback: "",
        aiAnalysis: {
          relevanceScore: 88,
          suggestedScore: 90,
          feedbackSummary: "Báo cáo nộp bài phản ánh đúng tiến độ, đã triển khai kiểm thử kết nối ví.",
          foundKeywords: ["Voting", "Web3.js", "MetaMask"]
        }
      },
      {
        milestoneIndex: 2,
        title: "Mốc 3: Triển khai Mainnet & Viết Báo cáo Khóa luận",
        description: "Tối ưu chi phí Gas, hoàn thiện tài liệu báo cáo nghiệm thu và chuẩn bị slide bảo vệ.",
        deadline: "2026-11-20",
        weightPercent: 30,
        status: "pending",
        submissionIpfsHash: "",
        submissionContent: "",
        score: 0,
        mentorFeedback: "",
        aiAnalysis: null
      }
    ],
    finalScore: 0,
    certificateIpfsHash: ""
  },
  {
    _id: "demo-topic-2",
    onChainId: 2,
    title: "Ứng dụng AI Phân Tích Dữ Liệu On-chain & Dự Báo Rủi Ro DeFi",
    description: "Huấn luyện mô hình Machine Learning nhận diện các giao dịch bất thường trong giao thức Lending/Borrowing và tích hợp cảnh báo.",
    requiredSkills: ["Python", "Machine Learning", "FastAPI", "Pandas", "Solidity"],
    expectedKeywords: ["DeFi", "Risk Analysis", "BERT", "On-chain data", "Machine Learning"],
    companyWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    companyName: "V-Fintech Solutions",
    assignedStudentWallet: null,
    assignedStudentName: "",
    status: "open",
    startDate: "2026-10-15",
    endDate: "2026-12-15",
    ipfsDetailsHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdUFIKEbcTDMrCiD",
    kpis: [
      {
        milestoneIndex: 0,
        title: "Mốc 1: Thu thập và tiền xử lý Dataset Giao dịch",
        description: "Thu thập tối thiểu 50,000 giao dịch từ Etherscan API và chuẩn hóa các trường dữ liệu.",
        deadline: "2026-11-05",
        weightPercent: 50,
        status: "pending",
        submissionIpfsHash: "",
        submissionContent: "",
        score: 0,
        mentorFeedback: "",
        aiAnalysis: null
      },
      {
        milestoneIndex: 1,
        title: "Mốc 2: Xây dựng Model & API Microservice",
        description: "Huấn luyện mô hình phân loại rủi ro và đóng gói API bằng FastAPI.",
        deadline: "2026-12-05",
        weightPercent: 50,
        status: "pending",
        submissionIpfsHash: "",
        submissionContent: "",
        score: 0,
        mentorFeedback: "",
        aiAnalysis: null
      }
    ],
    finalScore: 0,
    certificateIpfsHash: ""
  }
];

export default function App() {
  // Web3 state
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [userRole, setUserRole] = useState('company'); // 'company' | 'student'
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'my-projects' | 'ai-matcher'

  // Data state
  const [topics, setTopics] = useState(INITIAL_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState(INITIAL_TOPICS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Student Profile state
  const [studentSkills, setStudentSkills] = useState(['React', 'JavaScript', 'Solidity', 'Python']);
  const [studentBio, setStudentBio] = useState('Sinh viên năm cuối ngành Công nghệ thông tin, đam mê phát triển Smart Contract và ứng dụng AI.');

  // Modals state
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showSubmitKPIModal, setShowSubmitKPIModal] = useState(null); // kpi object
  const [showEvaluateModal, setShowEvaluateModal] = useState(null); // kpi object
  const [toastMessage, setToastMessage] = useState('');

  // Forms
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    description: '',
    requiredSkills: 'Solidity, React, Node.js',
    expectedKeywords: 'Smart Contract, IPFS, Web3',
  });
  const [submissionText, setSubmissionText] = useState('');
  const [evalForm, setEvalForm] = useState({ score: 90, status: 'approved', feedback: 'Báo cáo nộp bài đạt tiêu chí đề ra.' });
  const [assigneeWallet, setAssigneeWallet] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAssignStudent = async () => {
    if (!selectedTopic?._id?.match(/^[a-f\d]{24}$/i)) return showToast('Chỉ phân công đề tài đã lưu trên backend.');
    setLoading(true);
    try {
      await apiRequest(`/topics/${selectedTopic._id}/assign`, {
        method: 'POST', body: JSON.stringify({ studentWallet: assigneeWallet.trim(), studentName: 'Sinh viên thực tập' }),
      });
      await refreshTopic(selectedTopic._id);
      setAssigneeWallet('');
      showToast('Đã phân công sinh viên cho đề tài.');
    } catch (error) { showToast(`Không thể phân công: ${error.message}`); }
    finally { setLoading(false); }
  };

  // Connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const network = await provider.getNetwork();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setNetworkName(network.name === 'unknown' ? 'Local / Sepolia' : network.name);
          showToast(`Đã kết nối ví: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
        }
      } catch (err) {
        showToast('Kết nối ví thất bại: ' + err.message);
      }
    } else {
      // Mock wallet address for demo if MetaMask is not installed
      const mockAddr = userRole === 'company' 
        ? '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' 
        : '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      setWalletAddress(mockAddr);
      setNetworkName('Sepolia Testnet (Simulated)');
      showToast('Đã kích hoạt địa chỉ ví Web3 mô phỏng');
    }
  };

  // Fetch topics from backend
  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE}/topics?studentWallet=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTopics(data);
          setSelectedTopic((current) => data.find((topic) => topic._id === current?._id) || data[0] || null);
        }
      }
    } catch (e) {
      // Keep initial topics if backend is not started yet
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [walletAddress]);

  // Compute AI Match score for each topic locally or via AI service
  const getAIMatchScore = (topic) => {
    if (Number.isFinite(Number(topic.aiMatch?.similarity_score))) return Math.round(Number(topic.aiMatch.similarity_score));
    const sLower = studentSkills.map(s => s.toLowerCase().trim());
    const req = (topic.requiredSkills || []).map(s => s.toLowerCase().trim());
    const matched = req.filter(r => sLower.includes(r));
    const ratio = req.length > 0 ? (matched.length / req.length) : 0.7;
    return Math.round(ratio * 100);
  };

  // Handle Create Topic
  const refreshTopic = async (id) => {
    const data = await apiRequest(`/topics/${id}`);
    const savedTopic = data.topic || data;
    setTopics((current) => current.map((topic) => topic._id === id ? savedTopic : topic));
    setSelectedTopic(savedTopic);
    return savedTopic;
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!walletAddress) return showToast('H?y k?t n?i v? doanh nghi?p tr??c khi t?o ?? t?i.');
    setLoading(true);
    try {
      const skillsArr = newTopicForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const kwArr = newTopicForm.expectedKeywords.split(',').map((s) => s.trim()).filter(Boolean);
      const kpis = [
        { title: 'Milestone 1: Khảo sát và báo cáo kỹ thuật', description: 'Nghiên cứu tài liệu và hoàn thành báo cáo đặc tả yêu cầu.', deadline: new Date(Date.now() + 15 * 86400000).toISOString(), weightPercent: 40 },
        { title: 'Milestone 2: Lập trình và nghiệm thu sản phẩm', description: 'Triển khai mã nguồn và kiểm thử chức năng hoàn tất.', deadline: new Date(Date.now() + 45 * 86400000).toISOString(), weightPercent: 60 },
      ];
      const result = await apiRequest('/topics', { method: 'POST', body: JSON.stringify({
        title: newTopicForm.title, description: newTopicForm.description, requiredSkills: skillsArr,
        expectedKeywords: kwArr, companyWallet: walletAddress, companyName: 'Công ty Công nghệ số',
        startDate: new Date().toISOString(), endDate: new Date(Date.now() + 60 * 86400000).toISOString(), kpis,
      }) });
      const savedTopic = result.topic;
      setTopics((current) => [savedTopic, ...current]);
      setSelectedTopic(savedTopic);
      setShowCreateTopicModal(false);
      setNewTopicForm({ title: '', description: '', requiredSkills: 'Solidity, React', expectedKeywords: 'Web3, KPI' });
      showToast('Đề tài đã lưu vào backend. IPFS cần cấu hình Pinata.');
    } catch (error) {
      showToast(`Không thể tạo đề tài: ${error.message}`);
    } finally { setLoading(false); }
  };

  const handleSubmitKPI = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() || !selectedTopic?._id?.match(/^[a-f\d]{24}$/i)) return showToast('Cần đề tài đã lưu trên backend và nội dung báo cáo.');
    setLoading(true);
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/kpis/${showSubmitKPIModal.milestoneIndex}/submit`, {
        method: 'POST', body: JSON.stringify({ submissionContent: submissionText, studentWallet: walletAddress }),
      });
      const savedTopic = await refreshTopic(selectedTopic._id);
      setShowSubmitKPIModal(null); setSubmissionText('');
      showToast(`Đã lưu báo cáo. AI phân tích liên quan ${result.aiAnalysis?.relevanceScore ?? '—'}%.`);
      return savedTopic;
    } catch (error) { showToast(`Không thể nộp KPI: ${error.message}`); }
    finally { setLoading(false); }
  };

  const handleEvaluateKPI = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest(`/topics/${selectedTopic._id}/kpis/${showEvaluateModal.milestoneIndex}/evaluate`, {
        method: 'POST', body: JSON.stringify({ status: evalForm.status, score: Number(evalForm.score), mentorFeedback: evalForm.feedback }),
      });
      await refreshTopic(selectedTopic._id);
      setShowEvaluateModal(null);
      showToast(`Đã lưu kết quả nghiệm thu KPI: ${evalForm.score}/100.`);
    } catch (error) { showToast(`Không thể đánh giá KPI: ${error.message}`); }
    finally { setLoading(false); }
  };

  const handleCompleteAndCertify = async () => {
    setLoading(true);
    try {
      const result = await apiRequest(`/topics/${selectedTopic._id}/complete`, { method: 'POST', body: JSON.stringify({}) });
      await refreshTopic(selectedTopic._id);
      showToast(`Đã ghi nhận hoàn thành. Điểm tổng kết: ${result.topic.finalScore}/100.`);
    } catch (error) { showToast(`Chưa thể cấp chứng nhận: ${error.message}`); }
    finally { setLoading(false); }
  };

  // Filter topics
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

      {/* Navigation Header */}
      <header style={{
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
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
              Quản Lý Thực Tập Sinh • Minh Bạch KPI • AI Matching (BERT)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            </div>
          ) : (
            <button id="connect-wallet-btn" className="btn btn-primary" onClick={connectWallet}>
              <Wallet size={16} />
              Kết nối Ví MetaMask
            </button>
          )}
        </div>
      </header>

      {/* Hero Banner / KPI Summary Bar */}
      <section style={{
        padding: '24px 28px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(15, 23, 42, 0.4)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
              <Layers size={24} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng số Đề tài</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{topics.length} Đề tài</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px' }}>
              <ShieldCheck size={24} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hợp đồng Smart Contract</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fbbf24' }}>Blockchain chưa kết nối</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '12px' }}>
              <BrainCircuit size={24} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phân tích NLP</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c084fc' }}>TF-IDF mặc định</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '12px' }}>
              <Award size={24} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lưu trữ IPFS</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>Cần cấu hình Pinata</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '28px',
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: '24px'
      }}>
        {/* Left Column: Topics List & Student Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Bar */}
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
                onClick={() => setShowCreateTopicModal(true)}
                title="Tạo đề tài mới"
              >
                <PlusCircle size={18} />
                Tạo
              </button>
            )}
          </div>

          {/* Student Profile Card (visible in student mode) */}
          {userRole === 'student' && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <BrainCircuit size={20} color="#a855f7" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Hồ sơ Năng lực (AI Matching)</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Kỹ năng của bạn để hệ thống gợi ý đề tài phù hợp:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {studentSkills.map((sk, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topic Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Danh sách Đề tài ({filteredTopics.length})
            </div>

            {filteredTopics.map((topic) => {
              const isSelected = selectedTopic?._id === topic._id;
              const aiMatch = getAIMatchScore(topic);

              return (
                <div
                  key={topic._id}
                  id={`topic-item-${topic.onChainId}`}
                  className="glass-panel"
                  onClick={() => setSelectedTopic(topic)}
                  style={{
                    padding: '18px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary-light)' : 'var(--border-glass)',
                    boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className={`badge badge-${topic.status}`}>
                      {topic.status === 'open' ? 'Đang tuyển' : topic.status === 'in_progress' ? 'Đang thực tập' : 'Đã hoàn thành'}
                    </span>
                    {userRole === 'student' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#c084fc'
                      }}>
                        <Sparkles size={11} />
                        {topic.aiMatch ? `AI: ${aiMatch}% phù hợp` : `Khớp kỹ năng: ${aiMatch}%`}
                      </div>
                    )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className={`badge badge-${selectedTopic.status}`}>
                      ID #{selectedTopic.onChainId} • {selectedTopic.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={14} /> {selectedTopic.companyName}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                    {selectedTopic.title}
                  </h2>
                </div>

                {/* Status action buttons */}
                {userRole === 'company' && selectedTopic.status === 'open' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input-field" aria-label="Ví sinh viên" placeholder="0x… ví sinh viên" value={assigneeWallet} onChange={(e) => setAssigneeWallet(e.target.value)} style={{ width: '220px' }} />
                    <button className="btn btn-primary" disabled={loading} onClick={handleAssignStudent}>Phân công</button>
                  </div>
                )}
                {userRole === 'company' && selectedTopic.status !== 'completed' && selectedTopic.status !== 'open' && (
                  <button
                    id="complete-internship-btn"
                    className="btn btn-emerald"
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

              {/* Required Skills & Blockchain Info */}
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
                  {selectedTopic.ipfsDetailsHash?.startsWith('local-') ? (
                    <span style={{ fontSize: '0.78rem', color: '#fbbf24', wordBreak: 'break-all' }}>Chưa upload IPFS · {selectedTopic.ipfsDetailsHash}</span>
                  ) : (
                    <a href={`https://ipfs.io/ipfs/${selectedTopic.ipfsDetailsHash}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
                      {selectedTopic.ipfsDetailsHash} <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {selectedTopic.certificateIssued && (
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>
                      <Award size={18} /> Đã hoàn thành thực tập. Điểm: {selectedTopic.finalScore}/100
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Certificate IPFS CID: <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{selectedTopic.certificateIpfsHash}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KPI & Milestones Section */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    Tiến độ Thực tập & Tiêu chí KPI ({selectedTopic.kpis?.length || 0} mốc)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Báo cáo KPI được lưu qua backend và phân tích bởi AI service. Giao dịch blockchain cần được cấu hình riêng.
                  </p>
                </div>
              </div>

              {/* Milestones List */}
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
                          <Clock size={12} /> Hạn chót: {kpi.deadline}
                        </div>
                      </div>
                    </div>

                    {/* Submission content if submitted */}
                    {kpi.submissionContent && (
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #6366f1' }}>
                        <div style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '4px' }}>
                          Báo cáo Sinh viên nộp (IPFS: {kpi.submissionIpfsHash}):
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px' }}>
                          "{kpi.submissionContent}"
                        </div>

                        {/* AI BERT Analysis Card */}
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
                                <span style={{ fontWeight: 700, color: '#c084fc' }}>AI tham khảo: </span>
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

                    {/* Mentor Evaluation result if evaluated */}
                    {kpi.score > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span>Điểm nghiệm thu: <strong style={{ color: '#10b981' }}>{kpi.score}/100</strong></span>
                        {kpi.mentorFeedback && <span style={{ color: 'var(--text-muted)' }}>— Nhận xét: "{kpi.mentorFeedback}"</span>}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {userRole === 'student' && kpi.status !== 'approved' && (
                        <button
                          id={`submit-kpi-${kpi.milestoneIndex}-btn`}
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowSubmitKPIModal(kpi);
                            setSubmissionText(kpi.submissionContent || '');
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
                            setShowEvaluateModal(kpi);
                            setEvalForm({ score: kpi.aiAnalysis?.suggestedScore || 90, status: 'approved', feedback: 'Báo cáo nộp bài đạt tiêu chí đề ra.' });
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
      </main>

      {/* MODAL: Create Topic */}
      {showCreateTopicModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Tạo Đề Tài Thực Tập Mới</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Tạo đề tài trên backend; tích hợp IPFS và Smart Contract cần cấu hình dịch vụ tương ứng.
            </p>

            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tiêu đề Đề tài:</label>
                <input
                  id="new-topic-title"
                  className="input-field"
                  required
                  placeholder="Ví dụ: Xây dựng Smart Contract Staking Web3"
                  value={newTopicForm.title}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mô tả chi tiết:</label>
                <textarea
                  id="new-topic-description"
                  className="input-field"
                  rows={4}
                  required
                  placeholder="Mô tả mục tiêu, bài toán và kết quả cần đạt của đợt thực tập..."
                  value={newTopicForm.description}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Yêu cầu Kỹ năng (cách nhau bằng dấu phẩy):</label>
                <input
                  id="new-topic-skills"
                  className="input-field"
                  placeholder="Solidity, React, Node.js, Web3.js"
                  value={newTopicForm.requiredSkills}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, requiredSkills: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Từ khóa AI dùng để đối chiếu:</label>
                <input
                  id="new-topic-keywords"
                  className="input-field"
                  placeholder="Smart Contract, Unit Test, Sepolia, Gas Optimization"
                  value={newTopicForm.expectedKeywords}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, expectedKeywords: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTopicModal(false)}>Hủy</button>
                <button id="submit-new-topic-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo đề tài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit KPI Report */}
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
                  Nội dung Báo cáo & Minh chứng kết quả (Link GitHub / IPFS):
                </label>
                <textarea
                  id="kpi-submission-textarea"
                  className="input-field"
                  rows={6}
                  required
                  placeholder="Trình bày chi tiết công việc đã hoàn thành, kết quả đo lường, link commit mã nguồn hoặc kết quả kiểm thử..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitKPIModal(null)}>Hủy</button>
                <button id="confirm-submit-kpi-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang phân tích...' : 'Lưu báo cáo & Phân tích AI'}
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
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Nghiệm Thu KPI Trên Blockchain</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Đánh giá mốc: <strong>{showEvaluateModal.title}</strong>
            </p>

            <form onSubmit={handleEvaluateKPI} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Điểm số (Thang điểm 100):</label>
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
                  <option value="approved">Chấp thuận (Approved)</option>
                  <option value="rejected">Yêu cầu bổ sung (Rejected)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nhận xét của Mentor:</label>
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
                  {loading ? 'Đang ký giao dịch...' : 'Xác Nhận & Ghi Lên Blockchain'}
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
        Đề tài Khóa Luận Tốt Nghiệp: Nền tảng Web3 Quản lý Thực tập sinh dựa trên KPI & AI (BERT) • MERN Stack + Solidity + IPFS
      </footer>
    </div>
  );
}

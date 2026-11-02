import { getToken } from './client';
import contractArtifact from "../contracts/InternshipPlatform.json";

export const CONTRACT_ADDRESS = contractArtifact.address || '';
export const CONTRACT_ABI = contractArtifact.abi || [];

/**
 * Kiểm tra xem Smart Contract có đang khả dụng trên mạng không
 */
export async function checkContractConnection() {
  const ethers = await import('ethers');
  try {
    let provider;
    if (typeof window !== "undefined" && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    }
    const code = await provider.getCode(CONTRACT_ADDRESS);
    return code && code !== "0x";
  } catch {
    return false;
  }
}

/**
 * Lấy đối tượng Contract (có signer nếu cần ký giao dịch)
 */
export async function getInternshipContract(requireSigner = false) {
  const ethers = await import('ethers');
  if (!ethers.isAddress(CONTRACT_ADDRESS)) throw new Error('Chưa có địa chỉ contract hợp lệ.');
  if (requireSigner) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Cần kết nối tiện ích MetaMask để gửi giao dịch Blockchain.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    if (!contractArtifact.chainId || Number(network.chainId) !== Number(contractArtifact.chainId)) throw new Error('Ví đang ở sai mạng blockchain.');
    let session;
    try { session = JSON.parse(atob(getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
    catch { throw new Error('Cần xác thực ví trước khi gửi giao dịch.'); }
    if (!session.wallet || (await signer.getAddress()).toLowerCase() !== session.wallet.toLowerCase()) throw new Error('Ví ký không khớp tài khoản đã xác thực.');
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  // Read-only
  let provider;
  if (typeof window !== "undefined" && window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * 1. Ghi nhận đề tài mới on-chain
 */
export async function createTopicOnChain({ title, ipfsHash, startDate, endDate, kpis = [] }) {
  const contract = await getInternshipContract(true);
  const startSec = Math.floor(new Date(startDate || Date.now()).getTime() / 1000);
  const endSec = Math.floor(new Date(endDate || Date.now() + 30 * 86400000).getTime() / 1000);

  console.log(`[Web3] Đang gửi giao dịch createTopic("${title}")...`);
  const tx = await contract.createTopic(title, ipfsHash || "", startSec, endSec);
  const receipt = await tx.wait();

  // Tìm topicId từ event TopicCreated
  let onChainId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "TopicCreated") {
        onChainId = Number(parsed.args.topicId);
        break;
      }
    } catch {
      // Bỏ qua log không parse được
    }
  }

  // Thêm các KPI lên contract nếu có
  if (onChainId && Array.isArray(kpis) && kpis.length > 0) {
    for (const kpi of kpis) {
      const dlSec = Math.floor(new Date(kpi.deadline || Date.now() + 14 * 86400000).getTime() / 1000);
      try {
        const kpiTx = await contract.addKPI(
          onChainId,
          kpi.title || "KPI Milestone",
          kpi.criteria || kpi.description || "",
          dlSec,
          Number(kpi.weightPercent)
        );
        await kpiTx.wait();
      } catch (err) {
        throw new Error(`Đề tài đã gửi nhưng KPI "${kpi.title}" chưa hoàn tất: ${err.message}`);
      }
    }
  }

  if (!onChainId) throw new Error('Không tìm thấy TopicCreated trong receipt; chưa xác minh ID.');
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    onChainId,
  };
}

/**
 * 2. Phân công sinh viên on-chain
 */
export async function assignStudentOnChain(topicId, studentWallet) {
  const contract = await getInternshipContract(true);
  console.log(`[Web3] Đang gửi giao dịch assignStudent(topic #${topicId}, ${studentWallet})...`);
  const tx = await contract.assignStudent(topicId, studentWallet);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * 3. Sinh viên nộp báo cáo KPI on-chain kèm IPFS hash
 */
export async function submitKpiOnChain(topicId, milestoneIndex, ipfsHash) {
  const contract = await getInternshipContract(true);
  console.log(`[Web3] Đang gửi giao dịch submitKPI(topic #${topicId}, milestone #${milestoneIndex})...`);
  const tx = await contract.submitKPI(topicId, milestoneIndex, ipfsHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * 4. Mentor nghiệm thu KPI on-chain (status: 2=Approved, 3=Rejected)
 */
export async function evaluateKpiOnChain(topicId, milestoneIndex, statusStr, score, feedback) {
  const contract = await getInternshipContract(true);
  const statusNum = statusStr === "approved" ? 2 : 3;
  console.log(`[Web3] Đang gửi giao dịch evaluateKPI(topic #${topicId}, milestone #${milestoneIndex}, score: ${score})...`);
  const tx = await contract.evaluateKPI(topicId, milestoneIndex, statusNum, Number(score), feedback || "");
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * 5. Hoàn thành đề tài & cấp chứng nhận NFT/SBT on-chain
 */
export async function completeInternshipOnChain(topicId, certificateIpfsHash) {
  const contract = await getInternshipContract(true);
  console.log(`[Web3] Đang gửi giao dịch completeInternship(topic #${topicId})...`);
  const tx = await contract.completeInternship(topicId, certificateIpfsHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Lấy dữ liệu đề tài trực tiếp từ Blockchain
 */
export async function getTopicFromChain(topicId) {
  const contract = await getInternshipContract(false);
  const topic = await contract.topics(topicId);
  const kpis = await contract.getTopicKPIs(topicId);
  return {
    id: Number(topic.id),
    title: topic.title,
    company: topic.company,
    student: topic.student,
    status: Number(topic.status),
    finalScore: Number(topic.finalScore),
    certificateIssued: topic.certificateIssued,
    certificateIpfsHash: topic.certificateIpfsHash,
    kpis: kpis.map((k, i) => ({
      index: i,
      title: k.title,
      weightPercent: Number(k.weightPercent),
      score: Number(k.score),
      status: Number(k.status),
      submissionIpfsHash: k.submissionIpfsHash,
      mentorFeedback: k.mentorFeedback,
    })),
  };
}

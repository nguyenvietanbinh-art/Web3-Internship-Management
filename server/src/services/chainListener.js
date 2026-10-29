const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const ChainEvent = require("../models/ChainEvent");
const Topic = require("../models/Topic");

let listenerActive = false;
let contractInstance = null;
let providerInstance = null;

/**
 * Tải ABI và địa chỉ Contract từ file metadata được sinh ra khi deploy
 */
function getContractMetadata() {
  try {
    const contractPath = path.resolve(__dirname, "../contracts/InternshipPlatform.json");
    if (!fs.existsSync(contractPath)) return null;
    return JSON.parse(fs.readFileSync(contractPath, "utf8"));
  } catch (err) {
    console.warn("[ChainListener] Không thể đọc InternshipPlatform.json:", err.message);
    return null;
  }
}

/**
 * Xử lý lưu event vào MongoDB collection `chain_events` và cập nhật thực thể tương ứng
 */
async function processChainEvent(eventName, eventObj, payload) {
  try {
    const txHash = (eventObj.transactionHash || "").toLowerCase();
    const logIndex = Number(eventObj.index !== undefined ? eventObj.index : eventObj.logIndex || 0);
    const blockNumber = Number(eventObj.blockNumber || 0);

    // Upsert vào collection chain_events
    await ChainEvent.findOneAndUpdate(
      { txHash, logIndex },
      {
        $setOnInsert: {
          eventName,
          blockNumber,
          txHash,
          logIndex,
          payload,
          processed: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[ChainListener] Đã đồng bộ Event '${eventName}' (tx: ${txHash.slice(0, 10)}..., block: ${blockNumber})`);

    // Đồng bộ ngược lại vào MongoDB Topic nếu khớp
    if (payload.topicId !== undefined) {
      const onChainId = Number(payload.topicId);
      if (eventName === "TopicCreated") {
        await Topic.findOneAndUpdate(
          { $or: [{ onChainId }, { title: payload.title }] },
          { $set: { onChainId, txHash } }
        );
      } else if (eventName === "TopicAssigned") {
        await Topic.findOneAndUpdate(
          { onChainId },
          { $set: { status: "assigned", assignedStudentWallet: (payload.student || "").toLowerCase(), txHash } }
        );
      } else if (eventName === "KPISubmitted") {
        const milestoneIndex = Number(payload.milestoneIndex);
        await Topic.findOneAndUpdate(
          { onChainId, "kpis.milestoneIndex": milestoneIndex },
          {
            $set: {
              status: "in_progress",
              "kpis.$.status": "submitted",
              "kpis.$.submissionIpfsHash": payload.submissionIpfsHash || "",
              txHash,
            },
          }
        );
      } else if (eventName === "KPIEvaluated") {
        const milestoneIndex = Number(payload.milestoneIndex);
        const statusMap = { 2: "approved", 3: "rejected" };
        const statusStr = statusMap[payload.status] || "approved";
        await Topic.findOneAndUpdate(
          { onChainId, "kpis.milestoneIndex": milestoneIndex },
          {
            $set: {
              "kpis.$.status": statusStr,
              "kpis.$.score": Number(payload.score || 0),
              "kpis.$.mentorFeedback": payload.mentorFeedback || "",
              txHash,
            },
          }
        );
      } else if (eventName === "InternshipCompleted") {
        await Topic.findOneAndUpdate(
          { onChainId },
          {
            $set: {
              status: "completed",
              finalScore: Number(payload.finalScore || 0),
              certificateIpfsHash: payload.certificateIpfsHash || "",
              txHash,
            },
          }
        );
      }
    }
  } catch (error) {
    console.error(`[ChainListener] Lỗi khi xử lý event ${eventName}:`, error.message);
  }
}

/**
 * Quét toàn bộ events trong quá khứ từ block specified
 */
async function syncPastEvents(fromBlock = 0) {
  if (!contractInstance) return { synced: 0, message: "Contract chưa sẵn sàng" };

  try {
    const filter = {
      address: await contractInstance.getAddress(),
      fromBlock,
      toBlock: "latest",
    };

    const logs = await providerInstance.getLogs(filter);
    let count = 0;

    for (const log of logs) {
      try {
        const parsed = contractInstance.interface.parseLog(log);
        if (parsed) {
          const payload = {};
          for (const key of Object.keys(parsed.args)) {
            if (isNaN(Number(key))) {
              const val = parsed.args[key];
              payload[key] = typeof val === "bigint" ? Number(val) : val;
            }
          }
          await processChainEvent(parsed.name, log, payload);
          count++;
        }
      } catch (err) {
        // Bỏ qua log không thuộc interface
      }
    }

    return { synced: count, message: `Đã quét và đồng bộ ${count} events` };
  } catch (error) {
    console.warn("[ChainListener] Lỗi khi syncPastEvents:", error.message);
    return { synced: 0, error: error.message };
  }
}

/**
 * Khởi động listener thời gian thực
 */
async function startChainListener(rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545") {
  if (listenerActive) return;

  const metadata = getContractMetadata();
  if (!metadata || !metadata.address || !metadata.abi) {
    console.log("[ChainListener] Chưa tìm thấy file InternshipPlatform.json hoặc chưa deploy contract.");
    return;
  }

  try {
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);
    
    // Kiểm tra kết nối tới node
    const network = await providerInstance.getNetwork().catch(() => null);
    if (!network) {
      console.log(`[ChainListener] Node RPC (${rpcUrl}) chưa phản hồi. Listener sẽ thử lại khi có yêu cầu.`);
      return;
    }

    contractInstance = new ethers.Contract(metadata.address, metadata.abi, providerInstance);
    console.log(`[ChainListener] Đã kết nối contract ${metadata.address} trên mạng ${network.name} (ChainId: ${network.chainId})`);

    // Đồng bộ các events trước đó
    await syncPastEvents(0);

    // Lắng nghe sự kiện mới
    contractInstance.on("*", (event) => {
      try {
        const payload = {};
        if (event && event.args) {
          for (const key of Object.keys(event.args)) {
            if (isNaN(Number(key))) {
              const val = event.args[key];
              payload[key] = typeof val === "bigint" ? Number(val) : val;
            }
          }
        }
        processChainEvent(event.eventName || event.event || "UnknownEvent", event.log || event, payload);
      } catch (err) {
        console.error("[ChainListener] Lỗi parse event realtime:", err.message);
      }
    });

    listenerActive = true;
    console.log("[ChainListener] Trình lắng nghe Blockchain Event đang hoạt động.");
  } catch (err) {
    console.warn("[ChainListener] Không thể khởi động listener:", err.message);
  }
}

module.exports = {
  startChainListener,
  syncPastEvents,
  processChainEvent,
  getContractMetadata,
};

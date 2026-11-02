const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/env");
const { HttpError } = require("../utils/http");

/**
 * IPFS qua Pinata. KHÔNG bao giờ tạo CID giả: thiếu PINATA_JWT hoặc Pinata lỗi
 * đều ném HttpError để route trả lỗi rõ ràng cho client.
 */
function assertConfigured() {
  if (!config.pinataJwt) {
    throw new HttpError(503, "IPFS chưa được cấu hình: thiếu PINATA_JWT trong server/.env", "IPFS_NOT_CONFIGURED");
  }
  // Legacy callers submit unprotected JSON/files, including private reports.
  // Keep the API shape but fail closed; Phase5 encrypted core flow replaces it.
  throw new HttpError(503,'Luồng IPFS legacy chưa bảo vệ dữ liệu; dùng upload báo cáo mã hóa theo kỳ','IPFS_PRIVACY_BLOCKED');
}

const auth = () => ({ Authorization: `Bearer ${config.pinataJwt}` });

function wrapPinataError(err) {
  if (err instanceof HttpError) return err;
  // A provider may echo credentials or submitted content in its error details.
  return new HttpError(502, 'Upload IPFS thất bại; kiểm tra cấu hình hoặc thử lại sau.', 'IPFS_UPLOAD_FAILED');
}

/** Upload JSON lên IPFS. Trả { ipfsHash, url }. */
async function uploadToIPFS(data, name = "metadata.json") {
  assertConfigured();
  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      { pinataContent: data, pinataMetadata: { name } },
      { headers: { ...auth(), "Content-Type": "application/json" }, timeout: 30000 }
    );
    return { ipfsHash: res.data.IpfsHash, url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}` };
  } catch (err) {
    throw wrapPinataError(err);
  }
}

/** Upload file nhị phân (buffer) lên IPFS. Trả { ipfsHash, url }. */
async function uploadFileToIPFS(buffer, filename) {
  assertConfigured();
  try {
    const form = new FormData();
    form.append("file", buffer, { filename });
    form.append("pinataMetadata", JSON.stringify({ name: filename }));
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
      headers: { ...auth(), ...form.getHeaders() },
      maxBodyLength: Infinity,
      timeout: 60000,
    });
    return { ipfsHash: res.data.IpfsHash, url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}` };
  } catch (err) {
    throw wrapPinataError(err);
  }
}

module.exports = { uploadToIPFS, uploadFileToIPFS };

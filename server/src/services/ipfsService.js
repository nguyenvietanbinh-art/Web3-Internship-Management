const crypto = require("crypto");
const axios = require("axios");

const PINATA_JWT = process.env.PINATA_JWT || "";

/**
 * Upload JSON metadata hoặc văn bản lên IPFS
 */
async function uploadToIPFS(data, name = "metadata.json") {
  if (PINATA_JWT) {
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: data,
          pinataMetadata: { name },
        },
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        ipfsHash: res.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
      };
    } catch (err) {
      console.warn("Pinata upload failed, returning a local development marker:", err.message);
    }
  }

  // Development placeholder. A SHA-256 string is not an IPFS CID and must not
  // be advertised as content-addressed storage.
  const str = typeof data === "string" ? data : JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(str).digest("hex");
  const ipfsHash = `local-${hash}`;

  return {
    ipfsHash,
    url: null,
    isLocalMock: true,
  };
}

module.exports = {
  uploadToIPFS,
};

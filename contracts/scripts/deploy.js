import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Bat dau deploy InternshipPlatform Smart Contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const InternshipPlatform = await hre.ethers.getContractFactory("InternshipPlatform");
  const platform = await InternshipPlatform.deploy();
  await platform.waitForDeployment();

  const address = await platform.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  console.log("==========================================");
  console.log(`InternshipPlatform da deploy thanh cong!`);
  console.log(`Network: ${hre.network.name} (chainId: ${network.chainId})`);
  console.log(`Contract Address: ${address}`);
  console.log("==========================================");

  // Read Artifact ABI
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/InternshipPlatform.sol/InternshipPlatform.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deployData = {
    address: address,
    abi: artifact.abi,
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString()
  };

  // Export to client/src/contracts/InternshipPlatform.json
  const clientDir = path.resolve(__dirname, "../../client/src/contracts");
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(clientDir, "InternshipPlatform.json"),
    JSON.stringify(deployData, null, 2)
  );
  console.log(`Da xuat ABI & address vao: client/src/contracts/InternshipPlatform.json`);

  // Export to server/src/contracts/InternshipPlatform.json
  const serverDir = path.resolve(__dirname, "../../server/src/contracts");
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(serverDir, "InternshipPlatform.json"),
    JSON.stringify(deployData, null, 2)
  );
  console.log(`Da xuat ABI & address vao: server/src/contracts/InternshipPlatform.json`);
}

main().catch((error) => {
  console.error("Loi khi deploy:", error);
  process.exitCode = 1;
});

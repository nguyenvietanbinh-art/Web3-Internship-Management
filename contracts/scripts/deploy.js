import hre from "hardhat";

async function main() {
  console.log("Bat dau deploy InternshipPlatform Smart Contract...");

  const InternshipPlatform = await hre.ethers.getContractFactory("InternshipPlatform");
  const platform = await InternshipPlatform.deploy();

  await platform.waitForDeployment();
  const address = await platform.getAddress();

  console.log("==========================================");
  console.log(`InternshipPlatform da deploy thanh cong tai dia chi:`);
  console.log(address);
  console.log("==========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  // Base 上的 USDC 地址
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Circle 測試網 USDC
  
  const isTestnet = hre.network.name === "base-sepolia";
  const usdcAddress = isTestnet ? USDC_BASE_SEPOLIA : USDC_BASE;
  
  // 錢包地址（部署前需要設定）
  const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
  const communityWallet = process.env.COMMUNITY_WALLET || deployer.address;
  
  console.log("\n--- Deployment Config ---");
  console.log("Network:", hre.network.name);
  console.log("USDC:", usdcAddress);
  console.log("Treasury:", treasuryWallet);
  console.log("Community:", communityWallet);
  
  // 1. 部署 MoltVote Token
  console.log("\n1. Deploying MoltVote Token...");
  const MoltVote = await hre.ethers.getContractFactory("MoltVote");
  const token = await MoltVote.deploy(
    deployer.address,
    treasuryWallet,
    communityWallet
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MoltVote Token deployed to:", tokenAddress);
  
  // 2. 部署 Presale Contract
  console.log("\n2. Deploying Presale Contract...");
  const Presale = await hre.ethers.getContractFactory("MoltVotePresale");
  const presale = await Presale.deploy(
    tokenAddress,
    usdcAddress,
    deployer.address
  );
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();
  console.log("Presale Contract deployed to:", presaleAddress);
  
  // 3. 設定 Presale 合約並轉移代幣
  console.log("\n3. Setting presale contract in token...");
  const setTx = await token.setPresaleContract(presaleAddress);
  await setTx.wait();
  console.log("Presale contract set and tokens transferred!");
  
  // 輸出部署資訊
  console.log("\n========================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("\nContract Addresses:");
  console.log("- MoltVote Token:", tokenAddress);
  console.log("- Presale Contract:", presaleAddress);
  console.log("- USDC:", usdcAddress);
  console.log("\nNext Steps:");
  console.log("1. Verify contracts on Basescan");
  console.log("2. Start presale: presale.startPresale()");
  console.log("3. Add verified users: presale.verifyUser(address, handle)");
  console.log("========================================");
  
  // 保存部署地址
  const fs = require("fs");
  const deployments = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      MoltVote: tokenAddress,
      Presale: presaleAddress,
      USDC: usdcAddress
    },
    wallets: {
      deployer: deployer.address,
      treasury: treasuryWallet,
      community: communityWallet
    }
  };
  
  fs.writeFileSync(
    `deployments-${hre.network.name}.json`,
    JSON.stringify(deployments, null, 2)
  );
  console.log(`\nDeployment info saved to deployments-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

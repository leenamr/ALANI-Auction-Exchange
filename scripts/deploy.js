const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const initialSupply = hre.ethers.parseUnits("1000000", 18);

  console.log("Deploying with account:", deployer.address);

  const AuctionToken = await hre.ethers.getContractFactory("AuctionToken");
  const token = await AuctionToken.deploy(initialSupply);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("AuctionToken deployed to:", tokenAddress);

  const TokenAuctionHouse = await hre.ethers.getContractFactory("TokenAuctionHouse");
  const auctionHouse = await TokenAuctionHouse.deploy(tokenAddress);
  await auctionHouse.waitForDeployment();

  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log("TokenAuctionHouse deployed to:", auctionHouseAddress);
  console.log("");
  console.log("Verification commands:");
  console.log(`npx hardhat verify --network sepolia ${tokenAddress} ${initialSupply.toString()}`);
  console.log(`npx hardhat verify --network sepolia ${auctionHouseAddress} ${tokenAddress}`);
  console.log("");
  console.log("Frontend config:");
  console.log(`window.AUCTION_TOKEN_ADDRESS = "${tokenAddress}";`);
  console.log(`window.AUCTION_HOUSE_ADDRESS = "${auctionHouseAddress}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

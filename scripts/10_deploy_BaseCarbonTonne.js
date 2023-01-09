const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const BaseCarbonTonne = await hre.ethers.getContractFactory(
    "BaseCarbonTonne"
  );

  console.log("Deploying BaseCarbonTonne...");

  const baseCarbonTonne = await upgrades.deployProxy(BaseCarbonTonne, {
    kind: "uups",
    initializer: "initialize",
  });

  await baseCarbonTonne.deployed();

  console.log("BaseCarbonTonne deployed to:", baseCarbonTonne.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

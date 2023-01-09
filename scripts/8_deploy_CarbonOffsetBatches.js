const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonOffsetBatches = await hre.ethers.getContractFactory(
    "CarbonOffsetBatches"
  );
  let toucanContractRegistry = process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS;

  console.log("Deploying CarbonOffsetBatches...");

  const carbonOffsetBatches = await upgrades.deployProxy(
    CarbonOffsetBatches,
    [toucanContractRegistry],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await carbonOffsetBatches.deployed();

  console.log("CarbonOffsetBatches deployed to:", carbonOffsetBatches.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

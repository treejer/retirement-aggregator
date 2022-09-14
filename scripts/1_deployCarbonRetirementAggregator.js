const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementAggregator = await hre.ethers.getContractFactory(
    "CarbonRetirementAggregator",
  );

  console.log("Deploying carbonRetirementAggregator...");

  const carbonRetirementAggregator = await upgrades.deployProxy(
    CarbonRetirementAggregator,
    {
      kind: "uups",
      initializer: "initialize",
    },
  );

  await carbonRetirementAggregator.deployed();

  console.log(
    "carbonRetirementAggregator deployed to:",
    carbonRetirementAggregator.address,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

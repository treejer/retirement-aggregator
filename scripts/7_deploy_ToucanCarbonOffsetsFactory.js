const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const ToucanCarbonOffsetsFactory = await hre.ethers.getContractFactory(
    "ToucanCarbonOffsetsFactory"
  );

  const toucanContractRegistry = process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS;

  console.log("Deploying ToucanCarbonOffsetsFactory...");

  const toucanCarbonOffsetsFactory = await upgrades.deployProxy(
    ToucanCarbonOffsetsFactory,
    [toucanContractRegistry],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await toucanCarbonOffsetsFactory.deployed();

  console.log(
    "ToucanCarbonOffsetsFactory deployed to:",
    toucanCarbonOffsetsFactory.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const ToucanContractRegistry = await hre.ethers.getContractFactory(
    "ToucanContractRegistry"
  );

  let toucanContractRegistry = await ToucanContractRegistry.attach(
    process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS
  );

  //--------------------------------- run functions

  console.log(1);

  await toucanContractRegistry.setCarbonProjectsAddress(
    process.env.CARBON_PROJECTS_CONTRACT_ADDRESS
  );

  console.log(2);

  await toucanContractRegistry.setCarbonProjectVintagesAddress(
    process.env.CARBON_PROJECT_VINTAGES_CONTRACT_ADDRESS
  );

  console.log(3);

  await toucanContractRegistry.setToucanCarbonOffsetsFactoryAddress(
    process.env.TOUCAN_CARBON_OFFSETS_FACTORY_CONTRACT_ADDRESS
  );
  console.log(4);

  await toucanContractRegistry.setCarbonOffsetBatchesAddress(
    process.env.CARBON_OFFSET_BATCHES_CONTRACT_ADDRESS
  );

  console.log(5);

  await toucanContractRegistry.setCarbonOffsetBadgesAddress(
    process.env.RETIREMENT_CERTIFICATES_CONTRACT_ADDRESS
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

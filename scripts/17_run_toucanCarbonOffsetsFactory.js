const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const ToucanCarbonOffsetsFactory = await hre.ethers.getContractFactory(
    "ToucanCarbonOffsetsFactory"
  );

  let toucanCarbonOffsetsFactory = await ToucanCarbonOffsetsFactory.attach(
    process.env.TOUCAN_CARBON_OFFSETS_FACTORY_CONTRACT_ADDRESS
  );

  //--------------------------------- run functions

  await toucanCarbonOffsetsFactory.deployFromVintage(1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

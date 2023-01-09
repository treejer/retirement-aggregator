const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementsStorage = await hre.ethers.getContractFactory(
    "CarbonRetirementsStorage"
  );

  let retireToucanCarbonAddress = process.env.RETIRE_TOUCAN_CARBON_ADDRESS;
  let carbonRetirementsStorageAddress =
    process.env.CARBON_RETIREMENT_STORAGE_ADDRESS;

  let carbonRetirementsStorage = await CarbonRetirementsStorage.attach(
    carbonRetirementsStorageAddress
  );

  //----------->add helper
  await carbonRetirementsStorage.addHelperContract(retireToucanCarbonAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

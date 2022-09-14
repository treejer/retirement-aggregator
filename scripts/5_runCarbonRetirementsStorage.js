const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementsStorage = await hre.ethers.getContractFactory(
    "CarbonRetirementsStorage",
  );

  let retireToucanCarbonAddress;
  let carbonRetirementsStorageAddress;

  let carbonRetirementsStorage = await CarbonRetirementsStorage.attach(
    carbonRetirementsStorageAddress,
  );

  //----------->add helper
  await carbonRetirementsStorage
    .connect(account1)
    .addHelperContract(retireToucanCarbonAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

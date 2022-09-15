const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementAggregator = await hre.ethers.getContractFactory(
    "CarbonRetirementAggregator"
  );

  let carbonRetirementAggregatorAddress;
  let retireToucanCarbonAddress;
  let carbonRetirementStorageAddress;

  let usdcAddress;

  let treasuryAddress;

  let bctAddress;
  let nctAddress;

  let carbonRetirementAggregator = await CarbonRetirementAggregator.attach(
    carbonRetirementAggregatorAddress
  );

  //---------> USDC
  await carbonRetirementAggregator.setAddress(0, usdcAddress);

  //---------> treasury
  await carbonRetirementAggregator.setAddress(1, treasuryAddress);

  //---------> storage
  await carbonRetirementAggregator.setAddress(
    2,
    carbonRetirementStorageAddress
  );

  //-------->addPool
  await carbonRetirementAggratorInstance.addPool(
    bctAddress,
    retireToucanCarbonAddress
  );

  await carbonRetirementAggratorInstance.addPool(
    nctAddress,
    retireToucanCarbonAddress
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

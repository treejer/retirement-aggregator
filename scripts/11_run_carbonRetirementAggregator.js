const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementAggregator = await hre.ethers.getContractFactory(
    "CarbonRetirementAggregator"
  );

  let carbonRetirementAggregatorAddress =
    process.env.CARBON_RETIREMENT_AGGREGATOR_ADDRESS;

  let retireToucanCarbonAddress = process.env.RETIRE_TOUCAN_CARBON_ADDRESS;
  let carbonRetirementStorageAddress =
    process.env.CARBON_RETIREMENT_STORAGE_ADDRESS;

  const usdcAddress = process.env.USDC_TOKEN_ADDRESS;

  let treasuryAddress = process.env.FEE_TREASURY;

  let bctAddress = process.env.BCT_ADDRESS;
  // let nctAddress = process.env.NCT_ADDRESS;

  let carbonRetirementAggregator = await CarbonRetirementAggregator.attach(
    carbonRetirementAggregatorAddress
  );

  console.log(1);
  //---------> USDC
  await carbonRetirementAggregator.setAddress(0, usdcAddress);

  console.log(2);

  //---------> treasury
  await carbonRetirementAggregator.setAddress(1, treasuryAddress);

  console.log(3);

  //---------> storage
  await carbonRetirementAggregator.setAddress(
    2,
    carbonRetirementStorageAddress
  );

  console.log(4);

  //  -------->addPool
  await carbonRetirementAggregator.addPool(
    bctAddress,
    retireToucanCarbonAddress
  );

  // await carbonRetirementAggregator.addPool(
  //   nctAddress,
  //   retireToucanCarbonAddress
  // );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

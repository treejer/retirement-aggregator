const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const RetireToucanCarbon = await hre.ethers.getContractFactory(
    "RetireToucanCarbon"
  );

  let carbonRetirementAggregatorAddress =
    process.env.CARBON_RETIREMENT_AGGREGATOR_ADDRESS;
  let retireToucanCarbonAddress = process.env.RETIRE_TOUCAN_CARBON_ADDRESS;
  let bctPoolRouterAddress = process.env.UNISWAP_ROUTER_V2_ADDRESS;
  let nctPoolRouterAddress = process.env.UNISWAP_ROUTER_V2_ADDRESS;
  let bctAddress = process.env.BCT_ADDRESS;
  let nctAddress = process.env.NCT_ADDRESS;

  let toucanRegistryAddress = process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS;

  let retireToucanCarbon = await RetireToucanCarbon.attach(
    retireToucanCarbonAddress
  );

  //----------------> feeAmount
  await retireToucanCarbon.setFeeAmount(process.env.AGGREGATOR_FEE);
  //----------------> masterAggregator
  await retireToucanCarbon.setMasterAggregator(
    carbonRetirementAggregatorAddress
  );

  //-------------> add PoolRouter

  await retireToucanCarbon.addPool(bctAddress, bctPoolRouterAddress);
  // await retireToucanCarbon.addPool(nctAddress, nctPoolRouterAddress);

  //-------------> add ToucanRegistry

  await retireToucanCarbon.setToucanRegistry(toucanRegistryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

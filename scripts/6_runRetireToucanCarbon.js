const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const RetireToucanCarbon = await hre.ethers.getContractFactory(
    "RetireToucanCarbon",
  );

  let carbonRetirementAggregatorAddress;
  let retireToucanCarbonAddress;

  let bctPoolRouterAddress;
  let nctPoolRouterAddress;
  let bctAddress;
  let nctAddress;

  let toucanRegistryAddress;

  let retireToucanCarbon = await RetireToucanCarbon.attach(
    retireToucanCarbonAddress,
  );

  //----------------> feeAmount
  await retireToucanCarbon.setFeeAmount(100);

  //----------------> masterAggregator

  await retireToucanCarbon.setMasterAggregator(
    carbonRetirementAggregatorAddress,
  );

  //-------------> add PoolRouter

  await retireToucanCarbon.addPool(bctAddress, bctPoolRouterAddress);
  await retireToucanCarbon.addPool(nctAddress, nctPoolRouterAddress);

  //-------------> add ToucanRegistry

  await retireToucanCarbon.setToucanRegistry(toucanRegistryAddress.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

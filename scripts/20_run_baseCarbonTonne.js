const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

const MANAGER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("MANAGER_ROLE")
);

async function main() {
  const [account1] = await ethers.getSigners();

  const BaseCarbonTonne = await hre.ethers.getContractFactory(
    "BaseCarbonTonne"
  );

  let baseCarbonTonne = await BaseCarbonTonne.attach(process.env.BCT_ADDRESS);

  //--------------------------------- run functions

  console.log(1);

  await baseCarbonTonne.grantRole(MANAGER_ROLE, account1.address);

  console.log(2);

  await baseCarbonTonne.setFeeRedeemPercentage(2500);

  console.log(3);

  await baseCarbonTonne.setToucanContractRegistry(
    process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS
  );

  console.log(4);

  await baseCarbonTonne.setSupplyCap(
    ethers.utils.parseUnits("100000", "ether")
  );

  const ToucanCarbonOffsetsFactory = await hre.ethers.getContractFactory(
    "ToucanCarbonOffsetsFactory"
  );

  let toucanCarbonOffsetsFactory = await ToucanCarbonOffsetsFactory.attach(
    process.env.TOUCAN_CARBON_OFFSETS_FACTORY_CONTRACT_ADDRESS
  );

  let deployedErc20 = await toucanCarbonOffsetsFactory.pvIdtoERC20(1);

  console.log(5);

  await baseCarbonTonne.setTCO2Scoring([deployedErc20]);
  console.log(6);

  await baseCarbonTonne.deposit(
    deployedErc20,
    ethers.utils.parseUnits("10000", "ether")
  );

  console.log(7);

  await baseCarbonTonne.setFeeRedeemBurnAddress(account1.address);

  console.log(8);

  await baseCarbonTonne.setFeeRedeemReceiver(account1.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

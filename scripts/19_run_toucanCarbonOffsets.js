const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const [account1] = await ethers.getSigners();
  const ToucanCarbonOffsetsFactory = await hre.ethers.getContractFactory(
    "ToucanCarbonOffsetsFactory"
  );

  const ToucanCarbonOffsets = await hre.ethers.getContractFactory(
    "ToucanCarbonOffsets"
  );

  let toucanCarbonOffsetsFactory = await ToucanCarbonOffsetsFactory.attach(
    process.env.TOUCAN_CARBON_OFFSETS_FACTORY_CONTRACT_ADDRESS
  );

  let deployedErc20 = await toucanCarbonOffsetsFactory.pvIdtoERC20(1);
  console.log(deployedErc20);
  let tco2Instance = await ToucanCarbonOffsets.attach(deployedErc20);

  const balance = await tco2Instance.balanceOf(account1.address);

  //--------------------------------- run functions

  await tco2Instance.approve(process.env.BCT_ADDRESS, balance);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

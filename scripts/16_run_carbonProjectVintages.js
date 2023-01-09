const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const [account1] = await ethers.getSigners();

  const CarbonProjectVintages = await hre.ethers.getContractFactory(
    "CarbonProjectVintages"
  );

  let carbonProjectVintages = await CarbonProjectVintages.attach(
    process.env.CARBON_PROJECT_VINTAGES_CONTRACT_ADDRESS
  );

  //--------------------------------- run functions

  const now = parseInt(new Date().getTime() / 1000);

  const endDate = now + 100000;

  console.log(1);

  await carbonProjectVintages.setToucanContractRegistry(
    process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS
  );

  console.log(2);

  await carbonProjectVintages.addNewVintage(
    account1.address,
    1,
    "name",
    now,
    endDate,
    100000,
    false,
    false,
    "coBenefits",
    "correspAdjustment",
    "additionalCertification",
    "uri"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

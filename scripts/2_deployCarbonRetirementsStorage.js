const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonRetirementsStorage = await hre.ethers.getContractFactory(
    "CarbonRetirementsStorage",
  );

  console.log("Deploying carbonRetirementsStorage...");

  const carbonRetirementsStorage = await upgrades.deployProxy(
    CarbonRetirementsStorage,
    {
      kind: "uups",
      initializer: "initialize",
    },
  );

  await carbonRetirementsStorage.deployed();

  console.log(
    "carbonRetirementsStorage deployed to:",
    carbonRetirementsStorage.address,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

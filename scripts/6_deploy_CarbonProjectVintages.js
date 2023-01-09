const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonProjectVintages = await hre.ethers.getContractFactory(
    "CarbonProjectVintages"
  );

  console.log("Deploying CarbonProjectVintages...");

  const carbonProjectVintages = await upgrades.deployProxy(
    CarbonProjectVintages,
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await carbonProjectVintages.deployed();

  console.log(
    "CarbonProjectVintages deployed to:",
    carbonProjectVintages.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

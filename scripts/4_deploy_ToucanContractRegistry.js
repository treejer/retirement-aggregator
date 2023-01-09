const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const ToucanContractRegistry = await hre.ethers.getContractFactory(
    "ToucanContractRegistry"
  );

  console.log("Deploying ToucanContractRegistry...");

  const toucanContractRegistry = await upgrades.deployProxy(
    ToucanContractRegistry,
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await toucanContractRegistry.deployed();

  console.log(
    "ToucanContractRegistry deployed to:",
    toucanContractRegistry.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

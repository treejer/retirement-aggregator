const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonProjects = await hre.ethers.getContractFactory("CarbonProjects");

  console.log("Deploying CarbonProjects...");

  const carbonProjects = await upgrades.deployProxy(CarbonProjects, {
    kind: "uups",
    initializer: "initialize",
  });

  await carbonProjects.deployed();

  console.log("CarbonProjects deployed to:", carbonProjects.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

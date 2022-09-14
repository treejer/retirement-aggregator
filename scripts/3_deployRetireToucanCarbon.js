const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const RetireToucanCarbon = await hre.ethers.getContractFactory(
    "RetireToucanCarbon",
  );

  console.log("Deploying retireToucanCarbon...");

  const retireToucanCarbon = await upgrades.deployProxy(RetireToucanCarbon, {
    kind: "uups",
    initializer: "initialize",
  });

  await retireToucanCarbon.deployed();

  console.log("retireToucanCarbon deployed to:", retireToucanCarbon.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

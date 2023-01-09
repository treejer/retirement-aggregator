const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const RetirementCertificates = await hre.ethers.getContractFactory(
    "RetirementCertificates"
  );
  const toucanContractRegistry = process.env.TOUCAN_REGISTRY_CONTRACT_ADDRESS;
  console.log("Deploying RetirementCertificates...");

  const retirementCertificates = await upgrades.deployProxy(
    RetirementCertificates,
    [toucanContractRegistry, "http://example.com"],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await retirementCertificates.deployed();

  console.log(
    "RetirementCertificates deployed to:",
    retirementCertificates.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

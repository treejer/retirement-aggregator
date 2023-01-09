const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

async function main() {
  const CarbonProjects = await hre.ethers.getContractFactory("CarbonProjects");
  const [account1] = await ethers.getSigners();

  let carbonProjects = await CarbonProjects.attach(
    process.env.CARBON_PROJECTS_CONTRACT_ADDRESS
  );

  //--------------------------------- run functions

  console.log(1);

  await carbonProjects.addNewProject(
    account1.address,
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

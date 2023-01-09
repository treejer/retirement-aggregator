const hre = require("hardhat");

const { ethers, upgrades } = require("hardhat");

const VERIFIER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
);

async function main() {
  const [account1] = await ethers.getSigners();

  const CarbonOffsetBatches = await hre.ethers.getContractFactory(
    "CarbonOffsetBatches"
  );

  let carbonOffsetBatches = await CarbonOffsetBatches.attach(
    process.env.CARBON_OFFSET_BATCHES_CONTRACT_ADDRESS
  );

  //--------------------------------- run functions

  console.log(1);

  await carbonOffsetBatches.grantRole(VERIFIER_ROLE, account1.address);

  console.log(2);

  await carbonOffsetBatches.mintBatchWithData(
    account1.address,
    1,
    "12345",
    10000,
    "uri"
  );
  console.log(3);

  await carbonOffsetBatches.confirmRetirement(1);

  console.log(4);

  await carbonOffsetBatches.fractionalize(1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

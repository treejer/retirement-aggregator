const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const {
  OwnableErrorMsg,
  CarbonRetirementsStorageErrorMsg,
} = require("./enumes");

describe("CarbonRetirementsStorage", async () => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  async function handleDeploymentsAndSetAddress() {
    const [account1, account2, account3, account4, account5] =
      await ethers.getSigners();

    const CarbonRetirementsStorage = await ethers.getContractFactory(
      "CarbonRetirementsStorage",
      account1,
    );

    const carbonRetirementsStorageInstance = await upgrades.deployProxy(
      CarbonRetirementsStorage,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );
    await carbonRetirementsStorageInstance.initialize().should.be.rejected;

    return {
      account1,
      account2,
      account3,
      account4,
      account5,
      carbonRetirementsStorageInstance,
    };
  }

  it("test addHelperContract and removeHelperContract", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      carbonRetirementsStorageInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    //-------------reject(only Owner)

    await carbonRetirementsStorageInstance
      .connect(account2)
      .addHelperContract(account2.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    await carbonRetirementsStorageInstance
      .connect(account1)
      .addHelperContract(zeroAddress).should.be.rejected;

    //-------------work successfully
    let tx1 = await carbonRetirementsStorageInstance
      .connect(account1)
      .addHelperContract(account2.address);

    assert.equal(
      await carbonRetirementsStorageInstance.isHelperContract(account2.address),
      true,
      "addHelperContract func is incorrect",
    );

    await expect(tx1)
      .to.emit(carbonRetirementsStorageInstance, "HelperAdded")
      .withArgs(account2.address);

    await carbonRetirementsStorageInstance
      .connect(account1)
      .addHelperContract(account2.address)
      .should.be.rejectedWith(
        CarbonRetirementsStorageErrorMsg.CRS_HELPER_ALREADY_ADDED,
      );

    //-----------test removeHelperContract

    //-------------reject(only Owner)

    await carbonRetirementsStorageInstance
      .connect(account2)
      .removeHelperContract(account2.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //-------reject (Helper is not on the list)
    await carbonRetirementsStorageInstance
      .connect(account1)
      .removeHelperContract(account3.address)
      .should.be.rejectedWith(
        CarbonRetirementsStorageErrorMsg.CRS_HELPER_NOT_IN_LIST,
      );

    //-------------work successfully
    let tx2 = await carbonRetirementsStorageInstance
      .connect(account1)
      .removeHelperContract(account2.address);

    await expect(tx2)
      .to.emit(carbonRetirementsStorageInstance, "HelperRemoved")
      .withArgs(account2.address);

    assert.equal(
      await carbonRetirementsStorageInstance.isHelperContract(account2.address),
      false,
      "removeHelperContract func is incorrect",
    );
  });

  it("test carbonRetired", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      carbonRetirementsStorageInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    await carbonRetirementsStorageInstance
      .connect(account1)
      .addHelperContract(account2.address);

    //-------reject (caller not helper)
    await carbonRetirementsStorageInstance
      .connect(account3)
      .carbonRetired(account4.address, ethers.utils.parseUnits("1", "ether"))
      .should.be.rejectedWith(
        CarbonRetirementsStorageErrorMsg.CRS_CALLER_NOT_HELPER,
      );

    //-------reject (caller not helper)
    await carbonRetirementsStorageInstance
      .connect(account1)
      .carbonRetired(account4.address, ethers.utils.parseUnits("1", "ether"))
      .should.be.rejectedWith(
        CarbonRetirementsStorageErrorMsg.CRS_CALLER_NOT_HELPER,
      );

    //-------work successfully
    await carbonRetirementsStorageInstance
      .connect(account2)
      .carbonRetired(account4.address, ethers.utils.parseUnits("1", "ether"));

    assert.equal(
      Number(
        await carbonRetirementsStorageInstance.retirements(account4.address),
      ),
      Number(ethers.utils.parseUnits("1", "ether")),
      "carbonRetired func is not correct",
    );

    await carbonRetirementsStorageInstance
      .connect(account2)
      .carbonRetired(account4.address, ethers.utils.parseUnits(".5", "ether"));

    assert.equal(
      Number(
        await carbonRetirementsStorageInstance.retirements(account4.address),
      ),
      Number(ethers.utils.parseUnits("1.5", "ether")),
      "carbonRetired func is not correct",
    );
  });

  it("test _authorizeUpgrade", async () => {
    let { account1, account2, carbonRetirementsStorageInstance } =
      await loadFixture(handleDeploymentsAndSetAddress);

    //------------reject (only owner )

    await carbonRetirementsStorageInstance
      .connect(account2)
      .upgradeTo(zeroAddress)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    await carbonRetirementsStorageInstance
      .connect(account1)
      .upgradeTo(zeroAddress).should.be.rejected;
  });
});

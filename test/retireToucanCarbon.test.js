const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const { OwnableErrorMsg, RetireToucanCarbonErrorMsg } = require("./enumes");

describe("RetireToucanCarbon", async () => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  async function handleDeploymentsAndSetAddress() {
    const [account1, account2, account3, account4, account5] =
      await ethers.getSigners();

    const RetireToucanCarbon = await ethers.getContractFactory(
      "RetireToucanCarbon",
      account1,
    );

    const retireToucanCarbonInstance = await upgrades.deployProxy(
      RetireToucanCarbon,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    // const CarbonRetirementsStorage = await ethers.getContractFactory(
    //   "CarbonRetirementsStorage",
    //   account1,
    // );

    // const carbonRetirementsStorageInstance = await upgrades.deployProxy(
    //   CarbonRetirementsStorage,
    //   {
    //     kind: "uups",
    //     initializer: "initialize",
    //   },
    // );

    return {
      account1,
      account2,
      account3,
      account4,
      account5,
      retireToucanCarbonInstance,
    };
  }

  it("test setFeeAmount", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      retireToucanCarbonInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    //-------------reject(only Owner)

    await retireToucanCarbonInstance
      .connect(account2)
      .setFeeAmount(10)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //--------reject invalid amount

    await retireToucanCarbonInstance
      .connect(account1)
      .setFeeAmount(10001)
      .should.be.rejectedWith(RetireToucanCarbonErrorMsg.RTC_AMOUNT_INVALID);

    //---------- work successfully

    assert.equal(
      await retireToucanCarbonInstance.feeAmount(),
      0,
      "feeAmount is incorrect",
    );

    let tx1 = await retireToucanCarbonInstance
      .connect(account1)
      .setFeeAmount(10);

    await expect(tx1)
      .to.emit(retireToucanCarbonInstance, "FeeUpdated")
      .withArgs(0, 10);

    assert.equal(
      await retireToucanCarbonInstance.feeAmount(),
      10,
      "feeAmount is incorrect",
    );
  });

  it("test addPool and  removePool", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      retireToucanCarbonInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    //-------------reject(only Owner)

    await retireToucanCarbonInstance
      .connect(account2)
      .addPool(account2.address, account3.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //-------------reject(pool zeroAddress)

    await retireToucanCarbonInstance
      .connect(account1)
      .addPool(zeroAddress, account3.address)
      .should.be.rejectedWith(
        RetireToucanCarbonErrorMsg.RTC_POOL_ADDRESS_INVALID,
      );

    //-------------reject(Router zeroAddress)

    await retireToucanCarbonInstance
      .connect(account1)
      .addPool(account2.address, zeroAddress)
      .should.be.rejectedWith(
        RetireToucanCarbonErrorMsg.RTC_ROUTER_ADDRESS_INVALID,
      );

    //------------- must be work

    let tx1 = await retireToucanCarbonInstance
      .connect(account1)
      .addPool(account2.address, account3.address);

    await expect(tx1)
      .to.emit(retireToucanCarbonInstance, "PoolAdded")
      .withArgs(account2.address, account3.address);

    assert.equal(
      await retireToucanCarbonInstance.poolRouter(account2.address),
      account3.address,
      "addPool func is not correct",
    );

    //----------------test removePool

    //-------------reject(only Owner)

    await retireToucanCarbonInstance
      .connect(account2)
      .removePool(account2.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //---------------reject(pool not exist)

    await retireToucanCarbonInstance
      .connect(account1)
      .removePool(account3.address)
      .should.be.rejectedWith(RetireToucanCarbonErrorMsg.RTC_POOL_NOT_EXISTS);

    //------------- must be work

    let tx2 = await retireToucanCarbonInstance
      .connect(account1)
      .removePool(account2.address);

    await expect(tx2)
      .to.emit(retireToucanCarbonInstance, "PoolRemoved")
      .withArgs(account2.address);

    assert.equal(
      await retireToucanCarbonInstance.poolRouter(account2.address),
      zeroAddress,
      "removePool func is not correct",
    );
  });
});

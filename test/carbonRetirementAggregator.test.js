const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const Math = require("./math");

const {
  OwnableErrorMsg,
  CarbonRetirementAggregatorErrorMsg,
  RetireToucanCarbonErrorMsg,
} = require("./enumes");

describe("CarbonRetirementAggregator", async () => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const feeAmount = 100; //1%
  const toucanFee = 2500; //25%

  const MANAGER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MANAGER_ROLE")
  );
  const VERIFIER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
  );

  async function handleDeploymentsAndSetAddress() {
    const [
      account1,
      account2,
      account3,
      account4,
      account5,
      account6,
      account7,
      account8,
      account9,
      account10,
      account11,
      account12,
      account13,
      account14,
      account15,
      account16,
      account17,
      account18,
      account19,
      account20,
    ] = await ethers.getSigners();

    const deployerAccount = account1;
    const treasury = account20;
    const manager = account19;
    const verifier = account18;
    const feeRedeemRecieverAccount = account17;
    const feeRedeemBurnAccount = account16;

    //---------------------------------- uniswap deployment ----------------------------------

    const Token = await ethers.getContractFactory("Weth");
    const Factory = await ethers.getContractFactory("Factory");
    const UniswapV2Router02New = await ethers.getContractFactory(
      "UniswapV2Router02New"
    );

    const TestUniswap = await ethers.getContractFactory("TestUniswap");
    const wethDexInstance = await Token.deploy("WETH", "weth");
    const daiDexInstance = await Token.deploy("DAI", "dai");
    const usdcDexInstance = await Token.deploy("USDC", "usdc");
    const factoryInstance = await Factory.deploy(account2.address);
    const factoryAddress = factoryInstance.address;

    const dexRouterInstance = await UniswapV2Router02New.deploy(
      factoryAddress,
      wethDexInstance.address
    );

    const dexRouterAddress = dexRouterInstance.address;

    const testUniswapInstance = await TestUniswap.deploy(dexRouterAddress);
    const testUniswapAddress = testUniswapInstance.address;

    await wethDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("125000", "ether")
    );

    await daiDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("500000000", "ether")
    );

    await usdcDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("500000000", "ether")
    );

    await testUniswapInstance.addLiquidity(
      daiDexInstance.address,
      wethDexInstance.address,
      ethers.utils.parseUnits("250000000", "ether"),
      ethers.utils.parseUnits("125000", "ether")
    );

    await testUniswapInstance.addLiquidity(
      daiDexInstance.address,
      usdcDexInstance.address,
      ethers.utils.parseUnits("250000000", "ether"),
      ethers.utils.parseUnits("250000000", "ether")
    );

    //retirment deployment

    const BaseCarbonTonne = await ethers.getContractFactory("BaseCarbonTonne");
    const CarbonRetirementAggregator = await ethers.getContractFactory(
      "CarbonRetirementAggregator"
    );

    const CarbonRetirementsStorage = await ethers.getContractFactory(
      "CarbonRetirementsStorage"
    );
    const RetireToucanCarbon = await ethers.getContractFactory(
      "RetireToucanCarbon"
    );
    const ToucanContractRegistry = await ethers.getContractFactory(
      "ToucanContractRegistry"
    );
    const CarbonProjectVintages = await ethers.getContractFactory(
      "CarbonProjectVintages"
    );
    const CarbonProjects = await ethers.getContractFactory("CarbonProjects");

    const ToucanCarbonOffsetsFactory = await ethers.getContractFactory(
      "ToucanCarbonOffsetsFactory"
    );
    const ToucanCarbonOffsets = await ethers.getContractFactory(
      "ToucanCarbonOffsets"
    );
    const ToucanCarbonOffsetsBeacon = await ethers.getContractFactory(
      "ToucanCarbonOffsetsBeacon"
    );
    const CarbonOffsetBatches = await ethers.getContractFactory(
      "CarbonOffsetBatches"
    );
    const RetirementCertificates = await ethers.getContractFactory(
      "RetirementCertificates"
    );

    const baseCarbonTonneInstance = await upgrades.deployProxy(
      BaseCarbonTonne,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const carbonRetirementAggratorInstance = await upgrades.deployProxy(
      CarbonRetirementAggregator,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const carbonRetirementsStorageInstance = await upgrades.deployProxy(
      CarbonRetirementsStorage,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const retireToucanCarbonInstance = await upgrades.deployProxy(
      RetireToucanCarbon,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const toucanContractRegistryInstance = await upgrades.deployProxy(
      ToucanContractRegistry,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const carbonProjectVintagesInstance = await upgrades.deployProxy(
      CarbonProjectVintages,
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const carbonProjectsInstance = await upgrades.deployProxy(CarbonProjects, {
      kind: "uups",
      initializer: "initialize",
    });

    const toucanCarbonOffsetsFactoryInstance = await upgrades.deployProxy(
      ToucanCarbonOffsetsFactory,
      [toucanContractRegistryInstance.address],
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const toucanCarbonOffsetsInstance = await ToucanCarbonOffsets.deploy(
      "Toucan Protocol: TCO2",
      "TCO2",
      0,
      zeroAddress
    );

    const toucanCarbonOffsetsBeaconInstance =
      await ToucanCarbonOffsetsBeacon.deploy(
        toucanCarbonOffsetsInstance.address
      );

    const carbonOffsetBatchesInstance = await upgrades.deployProxy(
      CarbonOffsetBatches,
      [toucanContractRegistryInstance.address],
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    const retirementCertificatesInstance = await upgrades.deployProxy(
      RetirementCertificates,
      [toucanContractRegistryInstance.address, "baseURI"],
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    // /////////////////////////////////////////////////////////////////////////////////////////////

    // ///////////////////////////////////////////////////////////////////////////////////////////////
    //---------------- config CarbonRetirementsStorage
    await carbonRetirementsStorageInstance.addHelperContract(
      retireToucanCarbonInstance.address
    );

    //----------------- config carbonRetirementAggrator
    await carbonRetirementAggratorInstance.addPool(
      baseCarbonTonneInstance.address,
      retireToucanCarbonInstance.address
    );

    //set usdc address
    await carbonRetirementAggratorInstance.setAddress(
      0,
      usdcDexInstance.address
    );
    //set treasury address
    await carbonRetirementAggratorInstance.setAddress(1, treasury.address);

    //set carbon Retirements storage address
    await carbonRetirementAggratorInstance.setAddress(
      2,
      carbonRetirementsStorageInstance.address
    );

    //config retireToucanCarbon
    await retireToucanCarbonInstance.addPool(
      baseCarbonTonneInstance.address,
      dexRouterAddress
    );

    await retireToucanCarbonInstance.setMasterAggregator(
      carbonRetirementAggratorInstance.address
    );
    await retireToucanCarbonInstance.setToucanRegistry(
      toucanContractRegistryInstance.address
    );

    await retireToucanCarbonInstance.setFeeAmount(feeAmount);

    ////------------------------- config toucanContractRegistry

    await toucanContractRegistryInstance.setCarbonProjectsAddress(
      carbonProjectsInstance.address
    );

    await toucanContractRegistryInstance.setCarbonProjectVintagesAddress(
      carbonProjectVintagesInstance.address
    );

    await toucanContractRegistryInstance.setToucanCarbonOffsetsFactoryAddress(
      toucanCarbonOffsetsFactoryInstance.address
    );

    await toucanContractRegistryInstance.setCarbonOffsetBatchesAddress(
      carbonOffsetBatchesInstance.address
    );
    await toucanContractRegistryInstance.setCarbonOffsetBadgesAddress(
      retirementCertificatesInstance.address
    );

    ///// -------- config  carbonProjectVintages
    carbonProjectVintagesInstance.setToucanContractRegistry(
      toucanContractRegistryInstance.address
    );

    ///-------------------- config baseCarbonTonne
    await baseCarbonTonneInstance.setSupplyCap(
      ethers.utils.parseUnits("100000", "ether")
    );

    await baseCarbonTonneInstance.setToucanContractRegistry(
      toucanContractRegistryInstance.address
    );
    await baseCarbonTonneInstance.setFeeRedeemPercentage(toucanFee);

    await baseCarbonTonneInstance.grantRole(MANAGER_ROLE, manager.address);

    await carbonOffsetBatchesInstance.grantRole(
      VERIFIER_ROLE,
      verifier.address
    );

    /////////////////////////////////////////////////////////// factionlize

    let funder = account3;
    let planter = account4;

    const offsetAmount1 = ethers.utils.parseUnits("1", "ether");
    const approvedAmount = ethers.utils.parseUnits("3", "ether");
    const mintAmount1 = ethers.utils.parseUnits("10", "ether");

    const projectVintageTokenId1 = 1;

    ///////////////////////// config for toucan

    await carbonProjectsInstance.addNewProject(
      planter.address,
      "12",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    );

    const now = parseInt(new Date().getTime() / 1000);

    const endDate = now + 100000;

    await carbonProjectVintagesInstance.addNewVintage(
      planter.address,
      projectVintageTokenId1,
      "name",
      now,
      endDate,
      100000,
      false,
      false,
      "coBenefits",
      "correspAdjustment",
      "additionalCertification",
      "uri"
    );
    //      deployFromVintage

    await toucanCarbonOffsetsFactoryInstance.setBeacon(
      toucanCarbonOffsetsBeaconInstance.address
    );

    await toucanCarbonOffsetsFactoryInstance.deployFromVintage(1);

    let deployedErc20 = await toucanCarbonOffsetsFactoryInstance.pvIdtoERC20(1);

    await carbonOffsetBatchesInstance.mintBatchWithData(
      planter.address,
      1,
      "12345",
      10000,
      "uri"
    );

    await carbonOffsetBatchesInstance.connect(verifier).confirmRetirement(1);

    //caller must be owner of the minteed nft
    await carbonOffsetBatchesInstance.connect(planter).fractionalize(1);

    const tco2Instance = await ToucanCarbonOffsets.attach(deployedErc20);
    const balance = await tco2Instance.balanceOf(planter.address);

    await tco2Instance
      .connect(planter)
      .approve(baseCarbonTonneInstance.address, balance);

    await baseCarbonTonneInstance
      .connect(planter)
      .deposit(deployedErc20, balance);

    await baseCarbonTonneInstance
      .connect(manager)
      .setTCO2Scoring([deployedErc20]);

    await usdcDexInstance.setMint(
      testUniswapInstance.address,
      ethers.utils.parseUnits("20000", "ether")
    );

    await baseCarbonTonneInstance
      .connect(planter)
      .transfer(
        testUniswapInstance.address,
        ethers.utils.parseUnits("10000", "ether")
      );

    await testUniswapInstance.addLiquidity(
      usdcDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("20000", "ether"),
      ethers.utils.parseUnits("10000", "ether")
    );

    ///////////////////////////////////////////////////////////////////////////////////////

    return {
      dexRouterInstance,
      usdcDexInstance,
      testUniswapInstance,
      daiDexInstance,
      ToucanCarbonOffsets,
      baseCarbonTonneInstance,
      carbonRetirementAggratorInstance,
      carbonRetirementsStorageInstance,
      retireToucanCarbonInstance,
      toucanContractRegistryInstance,
      carbonProjectVintagesInstance,
      carbonProjectsInstance,
      toucanCarbonOffsetsFactoryInstance,
      toucanCarbonOffsetsInstance,
      toucanCarbonOffsetsBeaconInstance,
      carbonOffsetBatchesInstance,
      retirementCertificatesInstance,
      deployerAccount,
      verifier,
      manager,
      feeRedeemRecieverAccount,
      feeRedeemBurnAccount,
      account1,
      account2,
      account3,
      account4,
      account5,
      deployedErc20,
    };
  }

  describe("test owner function", function () {
    it("test getSourceAmount", async () => {
      const {
        daiDexInstance,
        usdcDexInstance,
        baseCarbonTonneInstance,
        carbonRetirementAggratorInstance,
        dexRouterInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      const amount1 = await ethers.utils.parseUnits("10", "ether");

      const sourceAmount1 =
        await carbonRetirementAggratorInstance.getSourceAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          false
        );

      const sourceAmount2 =
        await carbonRetirementAggratorInstance.getSourceAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          true
        );

      const sourceAmount3 =
        await carbonRetirementAggratorInstance.getSourceAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          false
        );
      const sourceAmount4 =
        await carbonRetirementAggratorInstance.getSourceAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          true
        );

      let expectedSwapTokenAmount1 = await dexRouterInstance.getAmountsIn(
        ethers.utils.parseUnits("10.1", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      assert.equal(
        Number(sourceAmount1),
        Number(amount1),
        "sourceAmount1 is incorrect"
      );

      assert.equal(
        Number(sourceAmount2),
        Number(expectedSwapTokenAmount1[0]),
        "sourceAmount2 is incorrect"
      );

      assert.equal(
        Number(sourceAmount3),
        Number(amount1),
        "sourceAmount1 is incorrect"
      );

      assert.equal(
        Number(sourceAmount4),
        Number(Math.add(amount1, Math.divide(Math.mul(amount1, 100), 10000))),
        "sourceAmount1 is incorrect"
      );
    });

    it("test getSourceAmountSpecific", async () => {
      const {
        daiDexInstance,
        usdcDexInstance,
        baseCarbonTonneInstance,
        carbonRetirementAggratorInstance,
        dexRouterInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      const amount1 = await ethers.utils.parseUnits("10", "ether");

      const sourceAmount1 =
        await carbonRetirementAggratorInstance.getSourceAmountSpecific(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          false
        );

      const sourceAmount2 =
        await carbonRetirementAggratorInstance.getSourceAmountSpecific(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          true
        );

      const sourceAmount3 =
        await carbonRetirementAggratorInstance.getSourceAmountSpecific(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          false
        );
      const sourceAmount4 =
        await carbonRetirementAggratorInstance.getSourceAmountSpecific(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          amount1,
          true
        );

      let exactToucanSwapping = Math.Big(amount1)
        .mul(100)
        .div(75)
        .add(Math.Big(amount1).mul(feeAmount).div(10000))
        .toString()
        .split(".")[0];

      let expectedSwapTokenAmount = await dexRouterInstance.getAmountsIn(
        ethers.utils.parseUnits(exactToucanSwapping, "wei"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      assert.equal(
        Number(sourceAmount1),
        Number(amount1),
        "sourceAmount1 is incorrect"
      );

      assert.equal(
        Number(sourceAmount2),
        Number(expectedSwapTokenAmount[0]),
        "sourceAmount2 is incorrect"
      );

      assert.equal(
        Number(sourceAmount3),
        Number(amount1),
        "sourceAmount1 is incorrect"
      );

      assert.equal(
        Number(sourceAmount4),
        Number(exactToucanSwapping),
        "sourceAmount1 is incorrect"
      );
    });

    it("Should retireCarbonSpecific (amountInCarbon=false)", async () => {
      let {
        usdcDexInstance,
        daiDexInstance,
        baseCarbonTonneInstance,
        carbonRetirementAggratorInstance,
        carbonRetirementsStorageInstance,
        retireToucanCarbonInstance,
        toucanCarbonOffsetsFactoryInstance,
        retirementCertificatesInstance,
        account3,
        manager,
        feeRedeemRecieverAccount,
        feeRedeemBurnAccount,
        deployedErc20,
        dexRouterInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      let funder = account3;

      const offsetAmount1 = ethers.utils.parseUnits("1", "ether");
      const approvedAmount = ethers.utils.parseUnits("3", "ether");
      const mintAmount1 = ethers.utils.parseUnits("10", "ether");

      const projectVintageTokenId1 = 1;

      const sourceToken = daiDexInstance.address;
      const poolToken = baseCarbonTonneInstance.address;
      const amountInCarbon = false;
      const beneficiaryAddress1 = funder.address;
      const retiringEntityString1 = "retiringEntityString";
      const beneficiaryString1 = "beneficiaryString";
      const retirementMessage1 = "beneficiaryString";
      const carbonList = [deployedErc20];

      await baseCarbonTonneInstance.setFeeRedeemBurnAddress(
        feeRedeemBurnAccount.address
      );

      await baseCarbonTonneInstance.setFeeRedeemReceiver(
        feeRedeemRecieverAccount.address
      );

      await daiDexInstance.setMint(funder.address, mintAmount1);

      await daiDexInstance
        .connect(funder)
        .approve(carbonRetirementAggratorInstance.address, approvedAmount);

      let expectedSwapTokenAmount = await dexRouterInstance.getAmountsOut(
        offsetAmount1,
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      await carbonRetirementAggratorInstance
        .connect(funder)
        .retireCarbonSpecific(
          sourceToken,
          poolToken,
          offsetAmount1,
          amountInCarbon,
          beneficiaryAddress1,
          retiringEntityString1,
          beneficiaryString1,
          retirementMessage1,
          carbonList
        );

      let certificateCreatedAt = await time.latest();

      const fee1 = Math.divide(
        Math.mul(expectedSwapTokenAmount[2], feeAmount),
        10000
      );

      const expectedRetirementAmount1 = Math.Big(
        expectedSwapTokenAmount[2]
      ).sub(fee1);

      const exactRetiredAmount1 = Math.Big(expectedRetirementAmount1)
        .mul(10000 - toucanFee)
        .div(10000);

      let retirements1 = await carbonRetirementsStorageInstance.retirements(
        beneficiaryAddress1
      );

      let certificateOwner = await retirementCertificatesInstance.ownerOf(1);

      const certificate = await retirementCertificatesInstance.getData(1);
      const retirementCertificatesRetirments =
        await retirementCertificatesInstance.retirements(1);
      let retirementEventIds = certificate.retirementEventIds;

      const totalRetiredToucanCarbonOffsetsFactory =
        await toucanCarbonOffsetsFactoryInstance.totalRetired();

      assert.equal(
        Number(retirementCertificatesRetirments.createdAt),
        certificateCreatedAt,
        "certificateCreatedAt is incorrect"
      );
      assert.equal(
        retirementCertificatesRetirments.retiringEntity,
        retireToucanCarbonInstance.address,
        "retiringEntity is incorrect"
      );
      assert.equal(
        Number(retirementCertificatesRetirments.amount),
        exactRetiredAmount1,
        "amount is incorrect"
      );
      assert.equal(
        Number(retirementCertificatesRetirments.projectVintageTokenId),
        projectVintageTokenId1,
        "projectVintageTokenId is incorrect"
      );

      assert.equal(
        Number(exactRetiredAmount1),
        Number(totalRetiredToucanCarbonOffsetsFactory),
        "totalRetiredToucanCarbonOffsetsFactory is not correct"
      );

      assert.equal(
        await retirementCertificatesInstance.claimedEvents(
          Number(retirementEventIds[0])
        ),
        true,
        "claimedEvents is not correct"
      );

      const eventsOfUser = await retirementCertificatesInstance.getUserEvents(
        retireToucanCarbonInstance.address
      );

      assert.equal(Number(eventsOfUser[0]), 1, "eventsOfUser is incorrect");

      assert.equal(
        Number(certificate.createdAt),
        certificateCreatedAt,
        "certificateCreatedAt is not correct"
      );

      assert.equal(
        certificate.beneficiary,
        beneficiaryAddress1,
        "beneficiaryAddress1 not correct"
      );
      assert.equal(
        certificate.beneficiaryString,
        beneficiaryString1,
        "beneficiaryString1 not correct"
      );
      assert.equal(
        certificate.retiringEntity,
        retireToucanCarbonInstance.address,
        "retiringEntity not correct"
      );
      assert.equal(
        certificate.retiringEntityString,
        retiringEntityString1,
        "retiringEntityString1 not correct"
      );
      assert.equal(
        certificate.retirementMessage,
        retirementMessage1,
        "retirementMessage1 not correct"
      );
      // assert.equal();

      //check _sendRetireCert
      assert.equal(
        certificateOwner,
        beneficiaryAddress1,
        "owner sent to incorrect address"
      );

      let treasury = await carbonRetirementAggratorInstance.treasury();

      const funderBalance = await daiDexInstance.balanceOf(funder.address);

      assert.equal(
        Number(funderBalance),
        Number(Math.subtract(mintAmount1, offsetAmount1)),
        "funder balance is incorrect"
      );

      assert.equal(
        Number(exactRetiredAmount1),
        Number(retirements1),
        "retirments1 is not correct"
      );

      assert.equal(
        Number(await baseCarbonTonneInstance.balanceOf(treasury)),
        Number(fee1),
        "fee1 is incorrect"
      );
    });
  });

  describe("test view function", function () {
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    it("write test for setAddress", async () => {
      let {
        account1,
        account2,
        account3,
        account4,
        account5,
        carbonRetirementAggratorInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      //------rejected(only owner can call setAddress)

      await carbonRetirementAggratorInstance
        .connect(account2)
        .setAddress(0, account2.address)
        .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

      //------rejected(_selection must be less than 2)

      await carbonRetirementAggratorInstance
        .connect(account1)
        .setAddress(3, account2.address)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_SELECTION_LIMIT
        );

      let USDCBeforeAddress = await carbonRetirementAggratorInstance.USDC();
      let treasuryBeforeAddress =
        await carbonRetirementAggratorInstance.treasury();
      let carbonRetirementStorageBeforeAddress =
        await carbonRetirementAggratorInstance.carbonRetirementStorage();

      //------change USDC

      assert.equal(
        (await carbonRetirementAggratorInstance.USDC()) != account2.address,
        true,
        "USDC address is incorrect"
      );

      let tx1 = await carbonRetirementAggratorInstance
        .connect(account1)
        .setAddress(0, account2.address);

      await expect(tx1)
        .to.emit(carbonRetirementAggratorInstance, "AddressUpdated")
        .withArgs(0, USDCBeforeAddress, account2.address);

      assert.equal(
        await carbonRetirementAggratorInstance.USDC(),
        account2.address,
        "USDC address is incorrect"
      );

      assert.equal(
        await carbonRetirementAggratorInstance.treasury(),
        treasuryBeforeAddress,
        "treasury address is incorrect"
      );

      //------change treasury

      assert.equal(
        (await carbonRetirementAggratorInstance.treasury()) != account3.address,
        true,
        "treasury address is incorrect"
      );

      let tx2 = await carbonRetirementAggratorInstance
        .connect(account1)
        .setAddress(1, account3.address);

      await expect(tx2)
        .to.emit(carbonRetirementAggratorInstance, "AddressUpdated")
        .withArgs(1, treasuryBeforeAddress, account3.address);

      assert.equal(
        await carbonRetirementAggratorInstance.treasury(),
        account3.address,
        "treasury address is incorrect"
      );

      assert.equal(
        await carbonRetirementAggratorInstance.carbonRetirementStorage(),
        carbonRetirementStorageBeforeAddress,
        "carbonRetirementStorage address is incorrect"
      );

      //------change carbonRetirementStorage

      assert.equal(
        (await carbonRetirementAggratorInstance.carbonRetirementStorage()) !=
          account4.address,
        true,
        "carbonRetirementStorage address is incorrect"
      );

      let tx3 = await carbonRetirementAggratorInstance
        .connect(account1)
        .setAddress(2, account4.address);

      await expect(tx3)
        .to.emit(carbonRetirementAggratorInstance, "AddressUpdated")
        .withArgs(2, carbonRetirementStorageBeforeAddress, account4.address);

      assert.equal(
        await carbonRetirementAggratorInstance.carbonRetirementStorage(),
        account4.address,
        "carbonRetirementStorage address is incorrect"
      );

      //-------change carbonRetirementStorage 2

      let tx4 = await carbonRetirementAggratorInstance
        .connect(account1)
        .setAddress(2, account5.address);

      await expect(tx4)
        .to.emit(carbonRetirementAggratorInstance, "AddressUpdated")
        .withArgs(2, account4.address, account5.address);
    });

    it("test addPool and removePool", async () => {
      let {
        account1,
        account2,
        account3,
        account4,
        carbonRetirementAggratorInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      //------------reject (only owner )
      await carbonRetirementAggratorInstance
        .connect(account2)
        .addPool(account2.address, account3.address)
        .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

      //------------reject (Pool cannot be zero address")
      await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(zeroAddress, account3.address)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_ADDRESS_ZERO
        );

      //------------reject (Bridge cannot be zero address")
      await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, zeroAddress)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_BRIDGE_ADDRESS_ZERO
        );

      //-----------------work successfully

      let tx1 = await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, account3.address);

      assert.equal(
        await carbonRetirementAggratorInstance.poolTokenTobridgeHelper(
          account2.address
        ),
        account3.address,
        "addPool is incorrect"
      );

      await expect(tx1)
        .to.emit(carbonRetirementAggratorInstance, "PoolAdded")
        .withArgs(account2.address, account3.address);

      //------------reject (Pool already added)
      await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, account4.address)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_ALREADY_ADDED
        );

      ///------------------------- test remove pool

      //------------reject (only owner )

      await carbonRetirementAggratorInstance
        .connect(account2)
        .removePool(account2.address)
        .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

      //------------reject (pool not added)

      await carbonRetirementAggratorInstance
        .connect(account1)
        .removePool(account3.address)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_NOT_ADDED
        );

      //-----------------work successfully

      let tx2 = await carbonRetirementAggratorInstance
        .connect(account1)
        .removePool(account2.address);

      assert.equal(
        await carbonRetirementAggratorInstance.poolTokenTobridgeHelper(
          account2.address
        ),
        zeroAddress,
        "removePool is incorrect"
      );

      await expect(tx2)
        .to.emit(carbonRetirementAggratorInstance, "PoolRemoved")
        .withArgs(account2.address);
    });

    it("write test for feeWithdraw", async () => {
      let {
        account1,
        account2,
        carbonRetirementAggratorInstance,
        daiDexInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      await daiDexInstance.setMint(
        carbonRetirementAggratorInstance.address,
        ethers.utils.parseUnits("1000", "ether")
      );

      //------------------------start test feeWithdraw

      //------------reject (only owner )
      await carbonRetirementAggratorInstance
        .connect(account2)
        .feeWithdraw(daiDexInstance.address, account2.address)
        .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

      //---------------reject
      await carbonRetirementAggratorInstance
        .connect(account1)
        .feeWithdraw(daiDexInstance.address, zeroAddress).should.be.rejected;

      //---------------reject
      await carbonRetirementAggratorInstance
        .connect(account1)
        .feeWithdraw(zeroAddress, account2.address).should.be.rejected;

      //------------work successfully
      await carbonRetirementAggratorInstance
        .connect(account1)
        .feeWithdraw(daiDexInstance.address, account2.address);

      assert.equal(
        Number(await daiDexInstance.balanceOf(account2.address)),
        Number(ethers.utils.parseUnits("1000", "ether")),
        "withdraw is incorrect"
      );

      assert.equal(
        await daiDexInstance.balanceOf(
          carbonRetirementAggratorInstance.address
        ),
        0,
        "withdraw is incorrect"
      );
    });

    it("write test for getCarbonRetirmentAmount (amoutInCarbon == true) ", async () => {
      let {
        account1,
        account2,
        carbonRetirementAggratorInstance,
        baseCarbonTonneInstance,
        retireToucanCarbonInstance,
        daiDexInstance,
        dexRouterInstance,
        usdcDexInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      //-----> test _specificRetire == false and poolToken == sourceToken

      let result =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("10", "ether"),
          false
        );

      assert.equal(
        Number(result),
        Number(ethers.utils.parseUnits("9.9", "ether")),
        "result is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(1000);

      let result2 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("100", "ether"),
          false
        );

      assert.equal(
        Number(result2),
        Number(ethers.utils.parseUnits("90", "ether")),
        "result2 is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(100);

      //-----> test _specificRetire == true and poolToken == sourceToken

      let result3 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("10", "ether"),
          true
        );

      assert.equal(
        Number(result3),
        Number(ethers.utils.parseUnits("7.425", "ether")),
        "result3 is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(1000);

      let result4 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          baseCarbonTonneInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("100", "ether"),
          true
        );

      assert.equal(
        Number(result4),
        Number(ethers.utils.parseUnits("67.5", "ether")),
        "result4 is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(100);

      //-----> test _specificRetire == false and poolToken != sourceToken

      let expectedSwapTokenAmount = await dexRouterInstance.getAmountsOut(
        ethers.utils.parseUnits("10", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      let result5 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("10", "ether"),
          false
        );

      assert.equal(
        Number(result5),
        Number(
          Math.subtract(
            Math.Big(expectedSwapTokenAmount[2]),
            Math.divide(Math.Big(expectedSwapTokenAmount[2]).mul(1), 100)
          )
        ),
        "result5 is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(1000);

      let expectedSwapTokenAmount2 = await dexRouterInstance.getAmountsOut(
        ethers.utils.parseUnits("100", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      let result6 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("100", "ether"),
          false
        );

      assert.equal(
        Number(result6),
        Number(
          Math.subtract(
            Math.Big(expectedSwapTokenAmount2[2]),
            Math.divide(Math.Big(expectedSwapTokenAmount2[2]).mul(1), 10)
          )
        ),
        "result6 is not correct"
      );
      await retireToucanCarbonInstance.setFeeAmount(100);

      //-----> test _specificRetire == true and poolToken != sourceToken

      let expectedSwapTokenAmount3 = await dexRouterInstance.getAmountsOut(
        ethers.utils.parseUnits("10", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      let result7 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("10", "ether"),
          true
        );

      assert.equal(
        Number(result7),
        Number(
          Math.divide(
            Math.mul(
              Math.subtract(
                Math.Big(expectedSwapTokenAmount3[2]),
                Math.divide(Math.Big(expectedSwapTokenAmount3[2]).mul(1), 100)
              ),
              3
            ),
            4
          )
        ),
        "result7 is not correct"
      );

      //-----> test _specificRetire == true and poolToken != sourceToken

      await retireToucanCarbonInstance.setFeeAmount(1000);

      let expectedSwapTokenAmount4 = await dexRouterInstance.getAmountsOut(
        ethers.utils.parseUnits("100", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ]
      );

      let result8 =
        await carbonRetirementAggratorInstance.getCarbonRetirmentAmount(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("100", "ether"),
          true
        );

      assert.equal(
        Number(result8),
        Number(
          Math.divide(
            Math.mul(
              Math.subtract(
                Math.Big(expectedSwapTokenAmount4[2]),
                Math.divide(Math.Big(expectedSwapTokenAmount4[2]).mul(1), 10)
              ),
              3
            ),
            4
          )
        ),
        "result8 is not correct"
      );

      await retireToucanCarbonInstance.setFeeAmount(100);
    });
  });

  describe("test main function", function () {
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    it.only("test retireCarbonFrom (amountInCarbon = false)", async () => {
      let {
        account1,
        account2,
        account3,
        account4,
        carbonRetirementAggratorInstance,
        carbonRetirementsStorageInstance,
        retirementCertificatesInstance,
        baseCarbonTonneInstance,
        retireToucanCarbonInstance,
        daiDexInstance,
        dexRouterInstance,
        usdcDexInstance,
      } = await loadFixture(handleDeploymentsAndSetAddress);

      let planter = account1;
      let planter2 = account2;
      let funder = account3;

      await daiDexInstance.setMint(
        funder.address,
        ethers.utils.parseUnits("10", "ether"),
      );

      await daiDexInstance.setMint(
        account4.address,
        ethers.utils.parseUnits("10", "ether"),
      );

      await retireToucanCarbonInstance.setFeeAmount(0);

      let expectedSwapTokenAmount = await dexRouterInstance.getAmountsOut(
        ethers.utils.parseUnits("3", "ether"),
        [
          daiDexInstance.address,
          usdcDexInstance.address,
          baseCarbonTonneInstance.address,
        ],
      );

      //------> reject(pool not accepted)

      await carbonRetirementAggratorInstance
        .connect(funder)
        .retireCarbonFrom(
          daiDexInstance.address,
          usdcDexInstance.address,
          ethers.utils.parseUnits("3", "ether"),
          false,
          zeroAddress,
          "TreejerDao address",
          "beneficiaryString",
          "retirementMessage",
        )
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRA_POOL_NOT_ACCEPTED,
        );

      //-------> reject(balance)

      await carbonRetirementAggratorInstance
        .connect(account1)
        .retireCarbonFrom(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("3", "ether"),
          false,
          zeroAddress,
          "TreejerDao address",
          "beneficiaryString",
          "retirementMessage",
        )
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRA_SOURCE_TRANSFERRED,
        );

      //--------------------------

      await daiDexInstance
        .connect(funder)
        .transfer(
          carbonRetirementAggratorInstance.address,
          ethers.utils.parseUnits("3", "ether"),
        );

      //----> founder buy tco2

      await carbonRetirementAggratorInstance
        .connect(funder)
        .retireCarbonFrom(
          daiDexInstance.address,
          baseCarbonTonneInstance.address,
          ethers.utils.parseUnits("3", "ether"),
          false,
          zeroAddress,
          "TreejerDao address",
          "beneficiaryString",
          "retirementMessage",
        );

      //---> check funder dai balance

      assert.equal(
        Number(await daiDexInstance.balanceOf(funder.address)),
        Number(ethers.utils.parseUnits("7", "ether")),
        "funder balance is incorrect",
      );

      //---> check funder bct balance

      assert.equal(
        await baseCarbonTonneInstance.balanceOf(funder.address),
        0,
        "funder balance is incorrect",
      );

      //--->check retirement funder

      assert.equal(
        Math.subtract(
          await carbonRetirementsStorageInstance.retirements(funder.address),
          expectedSwapTokenAmount[2],
        ),
        0,
        "funder retirement is incorrect",
      );

      //--->check certificate nft funder

      assert.equal(
        await retirementCertificatesInstance.ownerOf(1),
        funder.address,
        "owner certificate nft is incorrect",
      );

      //--->check treasury

      assert.equal(
        await baseCarbonTonneInstance.balanceOf(
          await carbonRetirementAggratorInstance.treasury(),
        ),
        0,
        "treasury must be zero",
      );

      //-----> check retirements

      let getData = await retirementCertificatesInstance.getData(1);

      assert.equal(getData[0][0], "1", "getData is incorrect");

      assert.equal(
        getData[2],
        retireToucanCarbonInstance.address,
        "retiringEntity is not correct",
      );

      assert.equal(getData[3], funder.address, "beneficiary is incorrect");

      assert.equal(
        getData[4],
        "TreejerDao address",
        "retiringEntityString is incorrect",
      );

      assert.equal(
        getData[5],
        "beneficiaryString",
        "beneficiaryString is incorrect",
      );

      assert.equal(
        getData[6],
        "retirementMessage",
        "retirementMessage is incorrect",
      );

      //------> reject(not a Toucan Carbon Token)

      await daiDexInstance
        .connect(account4)
        .transfer(
          carbonRetirementAggratorInstance.address,
          ethers.utils.parseUnits("3", "ether"),
        );

      await carbonRetirementAggratorInstance.addPool(
        usdcDexInstance.address,
        retireToucanCarbonInstance.address,
      );

      await carbonRetirementAggratorInstance
        .connect(account4)
        .retireCarbonFrom(
          daiDexInstance.address,
          usdcDexInstance.address,
          ethers.utils.parseUnits("3", "ether"),
          false,
          zeroAddress,
          "TreejerDao address",
          "beneficiaryString",
          "retirementMessage",
        )
        .should.be.rejectedWith(
          RetireToucanCarbonErrorMsg.RTC_NOT_TOUCAN_TOKEN,
        );
    });
  });
});

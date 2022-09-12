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

const Math = require("./math");

describe("RetireToucanCarbon", async () => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const feeAmount = 100; //1%
  const toucanFee = 2500; //25%

  const MANAGER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MANAGER_ROLE"),
  );
  const VERIFIER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("VERIFIER_ROLE"),
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
      "UniswapV2Router02New",
    );

    const TestUniswap = await ethers.getContractFactory("TestUniswap");
    const wethDexInstance = await Token.deploy("WETH", "weth");
    const daiDexInstance = await Token.deploy("DAI", "dai");
    const usdcDexInstance = await Token.deploy("USDC", "usdc");
    const factoryInstance = await Factory.deploy(account2.address);
    const factoryAddress = factoryInstance.address;

    const dexRouterInstance = await UniswapV2Router02New.deploy(
      factoryAddress,
      wethDexInstance.address,
    );

    const dexRouterAddress = dexRouterInstance.address;

    const testUniswapInstance = await TestUniswap.deploy(dexRouterAddress);
    const testUniswapAddress = testUniswapInstance.address;

    await wethDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("125000", "ether"),
    );

    await daiDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("500000000", "ether"),
    );

    await usdcDexInstance.setMint(
      testUniswapAddress,
      ethers.utils.parseUnits("500000000", "ether"),
    );

    await testUniswapInstance.addLiquidity(
      daiDexInstance.address,
      wethDexInstance.address,
      ethers.utils.parseUnits("250000000", "ether"),
      ethers.utils.parseUnits("125000", "ether"),
    );

    await testUniswapInstance.addLiquidity(
      daiDexInstance.address,
      usdcDexInstance.address,
      ethers.utils.parseUnits("250000000", "ether"),
      ethers.utils.parseUnits("250000000", "ether"),
    );

    //retirment deployment

    const BaseCarbonTonne = await ethers.getContractFactory("BaseCarbonTonne");
    const CarbonRetirementAggregator = await ethers.getContractFactory(
      "CarbonRetirementAggregator",
    );

    const CarbonRetirementsStorage = await ethers.getContractFactory(
      "CarbonRetirementsStorage",
    );
    const RetireToucanCarbon = await ethers.getContractFactory(
      "RetireToucanCarbon",
    );
    const ToucanContractRegistry = await ethers.getContractFactory(
      "ToucanContractRegistry",
    );
    const CarbonProjectVintages = await ethers.getContractFactory(
      "CarbonProjectVintages",
    );
    const CarbonProjects = await ethers.getContractFactory("CarbonProjects");

    const ToucanCarbonOffsetsFactory = await ethers.getContractFactory(
      "ToucanCarbonOffsetsFactory",
    );
    const ToucanCarbonOffsets = await ethers.getContractFactory(
      "ToucanCarbonOffsets",
    );
    const ToucanCarbonOffsetsBeacon = await ethers.getContractFactory(
      "ToucanCarbonOffsetsBeacon",
    );
    const CarbonOffsetBatches = await ethers.getContractFactory(
      "CarbonOffsetBatches",
    );
    const RetirementCertificates = await ethers.getContractFactory(
      "RetirementCertificates",
    );

    const baseCarbonTonneInstance = await upgrades.deployProxy(
      BaseCarbonTonne,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const carbonRetirementAggratorInstance = await upgrades.deployProxy(
      CarbonRetirementAggregator,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const carbonRetirementsStorageInstance = await upgrades.deployProxy(
      CarbonRetirementsStorage,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const retireToucanCarbonInstance = await upgrades.deployProxy(
      RetireToucanCarbon,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const toucanContractRegistryInstance = await upgrades.deployProxy(
      ToucanContractRegistry,
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const carbonProjectVintagesInstance = await upgrades.deployProxy(
      CarbonProjectVintages,
      {
        kind: "uups",
        initializer: "initialize",
      },
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
      },
    );

    const toucanCarbonOffsetsInstance = await ToucanCarbonOffsets.deploy(
      "Toucan Protocol: TCO2",
      "TCO2",
      0,
      zeroAddress,
    );

    const toucanCarbonOffsetsBeaconInstance =
      await ToucanCarbonOffsetsBeacon.deploy(
        toucanCarbonOffsetsInstance.address,
      );

    const carbonOffsetBatchesInstance = await upgrades.deployProxy(
      CarbonOffsetBatches,
      [toucanContractRegistryInstance.address],
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    const retirementCertificatesInstance = await upgrades.deployProxy(
      RetirementCertificates,
      [toucanContractRegistryInstance.address, "baseURI"],
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    // /////////////////////////////////////////////////////////////////////////////////////////////

    // ///////////////////////////////////////////////////////////////////////////////////////////////
    //---------------- config CarbonRetirementsStorage
    await carbonRetirementsStorageInstance.addHelperContract(
      retireToucanCarbonInstance.address,
    );

    //----------------- config carbonRetirementAggrator
    await carbonRetirementAggratorInstance.addPool(
      baseCarbonTonneInstance.address,
      retireToucanCarbonInstance.address,
    );

    //set usdc address
    await carbonRetirementAggratorInstance.setAddress(
      0,
      usdcDexInstance.address,
    );
    //set treasury address
    await carbonRetirementAggratorInstance.setAddress(1, treasury.address);

    //set carbon Retirements storage address
    await carbonRetirementAggratorInstance.setAddress(
      2,
      carbonRetirementsStorageInstance.address,
    );

    //config retireToucanCarbon
    await retireToucanCarbonInstance.addPool(
      baseCarbonTonneInstance.address,
      dexRouterAddress,
    );

    await retireToucanCarbonInstance.setMasterAggregator(
      carbonRetirementAggratorInstance.address,
    );
    await retireToucanCarbonInstance.setToucanRegistry(
      toucanContractRegistryInstance.address,
    );

    await retireToucanCarbonInstance.setFeeAmount(feeAmount);

    ////------------------------- config toucanContractRegistry

    await toucanContractRegistryInstance.setCarbonProjectsAddress(
      carbonProjectsInstance.address,
    );

    await toucanContractRegistryInstance.setCarbonProjectVintagesAddress(
      carbonProjectVintagesInstance.address,
    );

    await toucanContractRegistryInstance.setToucanCarbonOffsetsFactoryAddress(
      toucanCarbonOffsetsFactoryInstance.address,
    );

    await toucanContractRegistryInstance.setCarbonOffsetBatchesAddress(
      carbonOffsetBatchesInstance.address,
    );
    await toucanContractRegistryInstance.setCarbonOffsetBadgesAddress(
      retirementCertificatesInstance.address,
    );

    ///// -------- config  carbonProjectVintages
    carbonProjectVintagesInstance.setToucanContractRegistry(
      toucanContractRegistryInstance.address,
    );

    ///-------------------- config baseCarbonTonne
    await baseCarbonTonneInstance.setSupplyCap(
      ethers.utils.parseUnits("100000", "ether"),
    );

    await baseCarbonTonneInstance.setToucanContractRegistry(
      toucanContractRegistryInstance.address,
    );
    await baseCarbonTonneInstance.setFeeRedeemPercentage(toucanFee);

    await baseCarbonTonneInstance.grantRole(MANAGER_ROLE, manager.address);

    await carbonOffsetBatchesInstance.grantRole(
      VERIFIER_ROLE,
      verifier.address,
    );

    ///-----------------------------------------fractionals

    const projectVintageTokenId1 = 1;

    ///////////////////////// config for toucan

    await carbonProjectsInstance.addNewProject(
      account6.address,
      "12",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    );

    const now = parseInt(new Date().getTime() / 1000);

    const endDate = now + 100000;

    await carbonProjectVintagesInstance.addNewVintage(
      account6.address,
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
      "uri",
    );
    //      deployFromVintage

    await toucanCarbonOffsetsFactoryInstance.setBeacon(
      toucanCarbonOffsetsBeaconInstance.address,
    );

    await toucanCarbonOffsetsFactoryInstance.deployFromVintage(1);

    let deployedErc20 = await toucanCarbonOffsetsFactoryInstance.pvIdtoERC20(1);

    await carbonOffsetBatchesInstance.mintBatchWithData(
      account6.address,
      1,
      "12345",
      10000,
      "uri",
    );

    await carbonOffsetBatchesInstance.connect(verifier).confirmRetirement(1);

    //caller must be owner of the minteed nft
    await carbonOffsetBatchesInstance.connect(account6).fractionalize(1);

    const tco2Instance = await ToucanCarbonOffsets.attach(deployedErc20);
    const balance = await tco2Instance.balanceOf(account6.address);

    await tco2Instance
      .connect(account6)
      .approve(baseCarbonTonneInstance.address, balance);

    await baseCarbonTonneInstance
      .connect(account6)
      .deposit(deployedErc20, balance);

    await usdcDexInstance.setMint(
      testUniswapInstance.address,
      ethers.utils.parseUnits("20000", "ether"),
    );

    await baseCarbonTonneInstance
      .connect(account6)
      .transfer(
        testUniswapInstance.address,
        ethers.utils.parseUnits("10000", "ether"),
      );

    await testUniswapInstance.addLiquidity(
      usdcDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("20000", "ether"),
      ethers.utils.parseUnits("10000", "ether"),
    );

    await baseCarbonTonneInstance
      .connect(manager)
      .setTCO2Scoring([deployedErc20]);

    //-----------------------------------------------------------------

    return {
      dexRouterInstance,
      usdcDexInstance,
      testUniswapInstance,
      wethDexInstance,
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
    };
  }

  //------------------ownly 0wner
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
      feeAmount,
      "feeAmount is incorrect",
    );

    let tx1 = await retireToucanCarbonInstance
      .connect(account1)
      .setFeeAmount(10);

    await expect(tx1)
      .to.emit(retireToucanCarbonInstance, "FeeUpdated")
      .withArgs(feeAmount, 10);

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

  it("write test for setMasterAggregator", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      retireToucanCarbonInstance,
      carbonRetirementAggratorInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    //-------------reject(only Owner)

    await retireToucanCarbonInstance
      .connect(account2)
      .setMasterAggregator(account5.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //---------- work successfully

    assert.equal(
      await retireToucanCarbonInstance.masterAggregator(),
      carbonRetirementAggratorInstance.address,
      "masterAggregator is incorrect",
    );

    let tx1 = await retireToucanCarbonInstance
      .connect(account1)
      .setMasterAggregator(account5.address);

    await expect(tx1)
      .to.emit(retireToucanCarbonInstance, "MasterAggregatorUpdated")
      .withArgs(carbonRetirementAggratorInstance.address, account5.address);

    assert.equal(
      await retireToucanCarbonInstance.masterAggregator(),
      account5.address,
      "masterAggregator is incorrect",
    );
  });

  it("write setToucanRegistry test", async () => {
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
      .setToucanRegistry(account5.address)
      .should.be.rejectedWith(OwnableErrorMsg.CALLER_NOT_OWNER);

    //---------- work successfully

    let beforeToucanRegistry =
      await retireToucanCarbonInstance.toucanRegistry();

    let tx1 = await retireToucanCarbonInstance
      .connect(account1)
      .setToucanRegistry(account5.address);

    await expect(tx1)
      .to.emit(retireToucanCarbonInstance, "RegistryUpdated")
      .withArgs(beforeToucanRegistry, account5.address);

    assert.equal(
      await retireToucanCarbonInstance.toucanRegistry(),
      account5.address,
      "toucanRegistry is incorrect",
    );
  });

  //------------------- view func

  it("write test getSwapPath test", async () => {
    let {
      usdcDexInstance,
      wethDexInstance,
      daiDexInstance,
      retireToucanCarbonInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    ///----------work successfully path==2
    let result = await retireToucanCarbonInstance.getSwapPath(
      usdcDexInstance.address,
      daiDexInstance.address,
    );

    assert.equal(result.length == 2, true, "result length is not correct");

    assert.equal(
      result[0],
      usdcDexInstance.address,
      "result[0] is not correct",
    );
    assert.equal(result[1], daiDexInstance.address, "result[1] is not correct");

    ///----------work successfully path==3
    let result2 = await retireToucanCarbonInstance.getSwapPath(
      daiDexInstance.address,
      wethDexInstance.address,
    );

    assert.equal(result2.length == 3, true, "result2 length is not correct");

    assert.equal(
      result2[0],
      daiDexInstance.address,
      "result2[0] is not correct",
    );

    assert.equal(
      result2[1],
      usdcDexInstance.address,
      "result[1] is not correct",
    );

    assert.equal(result2[2], wethDexInstance.address, "result is not correct");
  });

  it("write test getSpecificCarbonFee", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      retireToucanCarbonInstance,
      baseCarbonTonneInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    let result = await retireToucanCarbonInstance.getSpecificCarbonFee(
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("150", "ether"),
    );

    assert.equal(
      Number(result),
      ethers.utils.parseUnits("50", "ether"),
      "result is not correct",
    );

    let result2 = await retireToucanCarbonInstance.getSpecificCarbonFee(
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("100", "ether"),
    );

    assert.equal(
      result2.toString(),
      "33333333333333333333",
      "result2 is not correct",
    );

    await baseCarbonTonneInstance.addRedeemFeeExemptedAddress(
      retireToucanCarbonInstance.address,
    );

    let result3 = await retireToucanCarbonInstance.getSpecificCarbonFee(
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("150", "ether"),
    );

    assert.equal(Number(result3), 0, "result3 is not correct");

    let result4 = await retireToucanCarbonInstance.getSpecificCarbonFee(
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("100", "ether"),
    );

    assert.equal(result4, 0, "result4 is not correct");
  });

  it("write test for getNeededBuyAmount", async () => {
    let {
      account1,
      account2,
      account3,
      account4,
      account5,
      usdcDexInstance,
      wethDexInstance,
      daiDexInstance,
      retireToucanCarbonInstance,
      baseCarbonTonneInstance,
      dexRouterInstance,
    } = await loadFixture(handleDeploymentsAndSetAddress);

    //---------------------------------------test sourceToken == poolToken and _specificRetire false

    //------------------ test 1

    let result1 = await retireToucanCarbonInstance.getNeededBuyAmount(
      baseCarbonTonneInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      false,
    );

    assert.equal(
      Number(result1[0]),
      Number(ethers.utils.parseUnits("15.15", "ether")),
      "result1 is not correct",
    );

    assert.equal(
      Number(result1[1]),
      Number(ethers.utils.parseUnits(".15", "ether")),
      "result1 is not correct",
    );

    //------------------ test 2

    await retireToucanCarbonInstance.setFeeAmount(0);

    let result2 = await retireToucanCarbonInstance.getNeededBuyAmount(
      baseCarbonTonneInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      false,
    );

    assert.equal(
      Number(result2[0]),
      Number(ethers.utils.parseUnits("15", "ether")),
      "result1 is not correct",
    );

    assert.equal(Number(result2[1]), 0, "result1 is not correct");

    await retireToucanCarbonInstance.setFeeAmount(100);

    //---------------------------------------test sourceToken == poolToken and _specificRetire true

    //------------------ test 3

    let result3 = await retireToucanCarbonInstance.getNeededBuyAmount(
      baseCarbonTonneInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      true,
    );

    assert.equal(
      Number(result3[0]),
      Number(ethers.utils.parseUnits("20.15", "ether")),
      "result3 is not correct",
    );

    assert.equal(
      Number(result3[1]),
      Number(ethers.utils.parseUnits(".15", "ether")),
      "result3 is not correct",
    );

    //------------------ test 4

    let result4 = await retireToucanCarbonInstance.getNeededBuyAmount(
      baseCarbonTonneInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("100", "ether"),
      true,
    );

    assert.equal(
      result4[0].toString(),
      ethers.utils.parseUnits("134.333333333333333333", "ether").toString(),
      "result4 is not correct",
    );

    assert.equal(
      Number(result4[1]),
      Number(ethers.utils.parseUnits("1", "ether")),
      "result4 is not correct",
    );

    //------------------ test 5

    await retireToucanCarbonInstance.setFeeAmount(0);

    let result5 = await retireToucanCarbonInstance.getNeededBuyAmount(
      baseCarbonTonneInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      true,
    );

    assert.equal(
      Number(result5[0]),
      Number(ethers.utils.parseUnits("20", "ether")),
      "result5 is not correct",
    );

    assert.equal(Number(result5[1]), 0, "result5 is not correct");

    await retireToucanCarbonInstance.setFeeAmount(100);

    //---------------------------------------test sourceToken != poolToken and _specificRetire false

    //------------------ test 6

    let expectedSwapTokenAmount = await dexRouterInstance.getAmountsIn(
      ethers.utils.parseUnits("15.15", "ether"),
      [
        daiDexInstance.address,
        usdcDexInstance.address,
        baseCarbonTonneInstance.address,
      ],
    );

    let result6 = await retireToucanCarbonInstance.getNeededBuyAmount(
      daiDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      false,
    );

    assert.equal(
      Number(result6[0]),
      Number(expectedSwapTokenAmount[0]),
      "result6 is not correct",
    );

    assert.equal(
      Number(result6[1]),
      Number(ethers.utils.parseUnits(".15", "ether")),
      "result6 is not correct",
    );

    //------------------ test 8

    let expectedSwapTokenAmount3 = await dexRouterInstance.getAmountsIn(
      ethers.utils.parseUnits("101", "ether"),
      [
        daiDexInstance.address,
        usdcDexInstance.address,
        baseCarbonTonneInstance.address,
      ],
    );

    let result8 = await retireToucanCarbonInstance.getNeededBuyAmount(
      daiDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("100", "ether"),
      false,
    );

    assert.equal(
      Number(result8[0]),
      Number(expectedSwapTokenAmount3[0]),
      "result8 is not correct",
    );

    assert.equal(
      Number(result8[1]),
      Number(ethers.utils.parseUnits("1", "ether")),
      "result8 is not correct",
    );

    //------------------ test 7

    await retireToucanCarbonInstance.setFeeAmount(0);

    let expectedSwapTokenAmount2 = await dexRouterInstance.getAmountsIn(
      ethers.utils.parseUnits("15", "ether"),
      [
        daiDexInstance.address,
        usdcDexInstance.address,
        baseCarbonTonneInstance.address,
      ],
    );

    let result7 = await retireToucanCarbonInstance.getNeededBuyAmount(
      daiDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      false,
    );

    assert.equal(
      Number(result7[0]),
      Number(expectedSwapTokenAmount2[0]),
      "result7 is not correct",
    );

    assert.equal(Number(result7[1]), 0, "result7 is not correct");

    await retireToucanCarbonInstance.setFeeAmount(100);

    //---------------------------------------test sourceToken != poolToken and _specificRetire true

    //------------------ test 9

    let expectedSwapTokenAmount4 = await dexRouterInstance.getAmountsIn(
      ethers.utils.parseUnits("20.15", "ether"),
      [
        daiDexInstance.address,
        usdcDexInstance.address,
        baseCarbonTonneInstance.address,
      ],
    );

    let result9 = await retireToucanCarbonInstance.getNeededBuyAmount(
      daiDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      true,
    );

    assert.equal(
      Number(result9[0]),
      Number(expectedSwapTokenAmount4[0]),
      "result9 is not correct",
    );

    assert.equal(
      Number(result9[1]),
      Number(ethers.utils.parseUnits(".15", "ether")),
      "result9 is not correct",
    );

    //---------------------------------------test sourceToken != poolToken and _specificRetire true

    await retireToucanCarbonInstance.setFeeAmount(0);

    let expectedSwapTokenAmount5 = await dexRouterInstance.getAmountsIn(
      ethers.utils.parseUnits("20", "ether"),
      [
        daiDexInstance.address,
        usdcDexInstance.address,
        baseCarbonTonneInstance.address,
      ],
    );

    let result10 = await retireToucanCarbonInstance.getNeededBuyAmount(
      daiDexInstance.address,
      baseCarbonTonneInstance.address,
      ethers.utils.parseUnits("15", "ether"),
      true,
    );

    assert.equal(
      Number(result10[0]),
      Number(expectedSwapTokenAmount5[0]),
      "result10 is not correct",
    );

    assert.equal(Number(result10[1]), 0, "result10 is not correct");

    await retireToucanCarbonInstance.setFeeAmount(100);
  });
});

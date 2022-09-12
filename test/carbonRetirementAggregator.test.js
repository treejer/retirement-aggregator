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
  CarbonRetirementAggregatorErrorMsg,
} = require("./enumes");

describe("CarbonRetirementAggregator", async () => {
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

    return {
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
    };
  }

  describe("with deploy toucan contrct", function () {
    it("Should set the right unlockTime", async function () {
      let {
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
        account3,
        account4,
        deployerAccount,
        verifier,
        manager,
        feeRedeemRecieverAccount,
        feeRedeemBurnAccount,
      } = await loadFixture(handleDeploymentsAndSetAddress);

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
        "",
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
        "uri",
      );
      //      deployFromVintage

      await toucanCarbonOffsetsFactoryInstance.setBeacon(
        toucanCarbonOffsetsBeaconInstance.address,
      );

      await toucanCarbonOffsetsFactoryInstance.deployFromVintage(1);

      let deployedErc20 = await toucanCarbonOffsetsFactoryInstance.pvIdtoERC20(
        1,
      );

      await carbonOffsetBatchesInstance.mintBatchWithData(
        planter.address,
        1,
        "12345",
        10000,
        "uri",
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

      await usdcDexInstance.setMint(
        testUniswapInstance.address,
        ethers.utils.parseUnits("20000", "ether"),
      );

      await baseCarbonTonneInstance
        .connect(planter)
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

      const sourceToken = daiDexInstance.address;
      const poolToken = baseCarbonTonneInstance.address;
      const amountInCarbon = true;
      const beneficiaryAddress1 = funder.address;
      const retiringEntityString1 = "retiringEntityString";
      const beneficiaryString1 = "beneficiaryString";
      const retirementMessage1 = "beneficiaryString";
      const carbonList = [deployedErc20];

      await baseCarbonTonneInstance.setFeeRedeemBurnAddress(
        feeRedeemBurnAccount.address,
      );

      await baseCarbonTonneInstance.setFeeRedeemReceiver(
        feeRedeemRecieverAccount.address,
      );

      await daiDexInstance.setMint(funder.address, mintAmount1);

      await daiDexInstance
        .connect(funder)
        .approve(carbonRetirementAggratorInstance.address, approvedAmount);

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
          carbonList,
        );
    });
  });

  describe("without deploy toucan contrct", function () {
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
          CarbonRetirementAggregatorErrorMsg.CRT_SELECTION_LIMIT,
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
        "USDC address is incorrect",
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
        "USDC address is incorrect",
      );

      assert.equal(
        await carbonRetirementAggratorInstance.treasury(),
        treasuryBeforeAddress,
        "treasury address is incorrect",
      );

      //------change treasury

      assert.equal(
        (await carbonRetirementAggratorInstance.treasury()) != account3.address,
        true,
        "treasury address is incorrect",
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
        "treasury address is incorrect",
      );

      assert.equal(
        await carbonRetirementAggratorInstance.carbonRetirementStorage(),
        carbonRetirementStorageBeforeAddress,
        "carbonRetirementStorage address is incorrect",
      );

      //------change carbonRetirementStorage

      assert.equal(
        (await carbonRetirementAggratorInstance.carbonRetirementStorage()) !=
          account4.address,
        true,
        "carbonRetirementStorage address is incorrect",
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
        "carbonRetirementStorage address is incorrect",
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
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_ADDRESS_ZERO,
        );

      //------------reject (Bridge cannot be zero address")
      await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, zeroAddress)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_BRIDGE_ADDRESS_ZERO,
        );

      //-----------------work successfully

      let tx1 = await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, account3.address);

      assert.equal(
        await carbonRetirementAggratorInstance.poolTokenTobridgeHelper(
          account2.address,
        ),
        account3.address,
        "addPool is incorrect",
      );

      await expect(tx1)
        .to.emit(carbonRetirementAggratorInstance, "PoolAdded")
        .withArgs(account2.address, account3.address);

      //------------reject (Pool already added)
      await carbonRetirementAggratorInstance
        .connect(account1)
        .addPool(account2.address, account4.address)
        .should.be.rejectedWith(
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_ALREADY_ADDED,
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
          CarbonRetirementAggregatorErrorMsg.CRT_POOL_NOT_ADDED,
        );

      //-----------------work successfully

      let tx2 = await carbonRetirementAggratorInstance
        .connect(account1)
        .removePool(account2.address);

      assert.equal(
        await carbonRetirementAggratorInstance.poolTokenTobridgeHelper(
          account2.address,
        ),
        zeroAddress,
        "removePool is incorrect",
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
        ethers.utils.parseUnits("1000", "ether"),
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
        "withdraw is incorrect",
      );

      assert.equal(
        await daiDexInstance.balanceOf(
          carbonRetirementAggratorInstance.address,
        ),
        0,
        "withdraw is incorrect",
      );
    });
  });
});

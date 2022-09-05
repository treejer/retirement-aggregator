const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { ethers, upgrades } = require("hardhat");

require("chai").use(require("chai-as-promised")).should();

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const feeAmount = 100; //1%
  const toucanFee = 2500; //25%

  const MANAGER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MANAGER_ROLE")
  );
  const VERIFIER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
  );

  async function handleUniswap() {}
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

    /////////////////////////////////////-------------------------------------- uniswap

    const Token = await ethers.getContractFactory("Weth");
    const Factory = await ethers.getContractFactory("Factory");

    const UniswapV2Router02New = await ethers.getContractFactory(
      "UniswapV2Router02New"
    );
    const TestUniswap = await ethers.getContractFactory("TestUniswap");

    const wethDexInstance = await Token.deploy("WETH", "weth");

    const WETHAddress = wethDexInstance.address;

    const daiDexInstance = await Token.deploy("DAI", "dai");

    const DAIAddress = daiDexInstance.address;

    const usdcDexInstance = await Token.deploy("USDC", "usdc");

    const USDCAddress = usdcDexInstance.address;

    const fakeTokenDexInstance = await Token.deploy("FAKETOKEN", "fake token");

    const FAKETOKENAddress = fakeTokenDexInstance.address;

    const factoryInstance = await Factory.deploy(account2.address);
    const factoryAddress = factoryInstance.address;

    const factoryInstance2 = await Factory.deploy(account2.address);
    const factoryAddress2 = factoryInstance2.address;

    const dexRouterInstance = await UniswapV2Router02New.deploy(
      factoryAddress,
      WETHAddress
    );

    const dexRouterAddress = dexRouterInstance.address;

    const testUniswapInstance = await TestUniswap.deploy(dexRouterAddress);
    const testUniswapAddress = testUniswapInstance.address;
    //--------------------------- token list ---------------

    //--------------------------- deploy factory ---------------

    //--------------------------- dex list ---------------

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

    //--------------------------- add liquidity for router 2 ---------------

    ///////////////////------------------------------------------------------

    //---------------------------------- uniswap deployment -------------------------------

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

    const baseCarbonTonneInstance = await upgrades.deployProxy(BaseCarbonTonne);

    const carbonRetirementAggratorInstance = await upgrades.deployProxy(
      CarbonRetirementAggregator
    );

    const carbonRetirementsStorageInstance =
      await CarbonRetirementsStorage.deploy();

    const retireToucanCarbonInstance = await upgrades.deployProxy(
      RetireToucanCarbon
    );

    const toucanContractRegistryInstance = await upgrades.deployProxy(
      ToucanContractRegistry
    );

    const carbonProjectVintagesInstance = await upgrades.deployProxy(
      CarbonProjectVintages
    );

    const carbonProjectsInstance = await upgrades.deployProxy(CarbonProjects);

    const toucanCarbonOffsetsFactoryInstance = await upgrades.deployProxy(
      ToucanCarbonOffsetsFactory,
      [toucanContractRegistryInstance.address]
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
      [toucanContractRegistryInstance.address]
    );

    const retirementCertificatesInstance = await upgrades.deployProxy(
      RetirementCertificates,
      [toucanContractRegistryInstance.address, "baseURI"]
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
    await carbonRetirementAggratorInstance.setAddress(0, USDCAddress);
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
      account3,
      account4,
      deployerAccount,
      verifier,
      manager,
      feeRedeemRecieverAccount,
      feeRedeemBurnAccount,
    };
  }

  describe("Deployment", function () {
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

      let deployedErc20 = await toucanCarbonOffsetsFactoryInstance.pvIdtoERC20(
        1
      );

      // address to,
      // uint256 projectVintageTokenId,
      // string memory _serialNumber,
      // uint256 quantity,
      // string memory uri

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
        feeRedeemBurnAccount.address
      );

      await baseCarbonTonneInstance.setFeeRedeemReceiver(
        feeRedeemRecieverAccount.address
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
          carbonList
        );

      let certificateOwner = await retirementCertificatesInstance.ownerOf(1);
    });
  });
});

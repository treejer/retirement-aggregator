// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/ICarbonRetirementsStorage.sol";
import "./interfaces/IToucanContractRegistry.sol";
import "./interfaces/IToucanPool.sol";
import "./interfaces/IToucanCarbonOffsets.sol";
import "./interfaces/ICarbonRetirementAggregator.sol";

contract RetireToucanCarbon is
    Initializable,
    ContextUpgradeable,
    OwnableUpgradeable,
    IERC721ReceiverUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function initialize() public initializer {
        __Ownable_init();
        __Context_init();
    }

    uint256 public feeAmount;
    address public masterAggregator;

    mapping(address => address) public poolRouter;
    address public toucanRegistry;
    uint256 public lastTokenId;

    event ToucanRetired(
        address indexed retiringAddress,
        address indexed beneficiaryAddress,
        string beneficiaryString,
        string retirementMessage,
        address indexed carbonPool,
        address carbonToken,
        uint256 retiredAmount
    );
    event PoolAdded(address indexed carbonPool, address indexed poolRouter);
    event PoolRemoved(address indexed carbonPool);
    event PoolRouterChanged(
        address indexed carbonPool,
        address indexed oldRouter,
        address indexed newRouter
    );
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event MasterAggregatorUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );
    event RegistryUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    function retire(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        string memory _retiringEntityString,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address _retiree
    ) public {
        require(
            poolRouter[_poolToken] != address(0),
            "Not a Toucan Carbon Token"
        );

        uint256 fee;
        (_amount, fee) = _prepareRetire(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiree
        );

        _retireCarbon(
            _amount,
            _retiringEntityString,
            _beneficiaryAddress,
            _beneficiaryString,
            _retirementMessage,
            _poolToken
        );

        if (feeAmount > 0) {
            IERC20Upgradeable(_poolToken).safeTransfer(
                ICarbonRetirementAggregator(masterAggregator).treasury(),
                fee
            );
        }
    }

    function _prepareRetire(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _retiree
    ) internal returns (uint256, uint256) {
        uint256 fee;
        uint256 sourceAmount;

        if (_amountInCarbon) {
            uint256 totalCarbon;

            (sourceAmount, totalCarbon, fee) = _transferSourceTokens(
                _sourceToken,
                _poolToken,
                _amount,
                false
            );

            if (_sourceToken != _poolToken) {
                _swapForExactCarbon(
                    _sourceToken,
                    _poolToken,
                    totalCarbon,
                    sourceAmount,
                    _retiree
                );
            }
        } else {
            sourceAmount = _amount;

            IERC20Upgradeable(_sourceToken).safeTransferFrom(
                _msgSender(),
                address(this),
                sourceAmount
            );

            if (_sourceToken != _poolToken) {
                (_amount, fee) = _swapExactForCarbon(
                    _sourceToken,
                    _poolToken,
                    sourceAmount
                );
            } else {
                fee = (_amount * feeAmount) / 10000;
                _amount = _amount - fee;
            }
        }

        return (_amount, fee);
    }

    function retireSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        string memory _retiringEntityString,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address _retiree,
        address[] memory _carbonList
    ) public {
        require(
            poolRouter[_poolToken] != address(0),
            "Not a Toucan Carbon Token"
        );

        uint256 fee;
        (_amount, fee) = _prepareRetireSpecific(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiree
        );

        _retireCarbonSpecific(
            _amount,
            _retiringEntityString,
            _beneficiaryAddress,
            _beneficiaryString,
            _retirementMessage,
            _poolToken,
            _carbonList
        );

        if (feeAmount > 0) {
            IERC20Upgradeable(_poolToken).safeTransfer(
                ICarbonRetirementAggregator(masterAggregator).treasury(),
                IERC20Upgradeable(_poolToken).balanceOf(address(this))
            );
        }
    }

    function _prepareRetireSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _retiree
    ) internal returns (uint256, uint256) {
        uint256 fee;
        uint256 sourceAmount;

        if (_amountInCarbon) {
            uint256 totalCarbon;

            (sourceAmount, totalCarbon, fee) = _transferSourceTokens(
                _sourceToken,
                _poolToken,
                _amount,
                true
            );

            if (_sourceToken != _poolToken) {
                uint256 specificCarbonFee = _getSpecificCarbonFee(
                    _poolToken,
                    _amount
                );

                totalCarbon += specificCarbonFee;
                _amount += specificCarbonFee;

                _swapForExactCarbon(
                    _sourceToken,
                    _poolToken,
                    totalCarbon,
                    sourceAmount,
                    _retiree
                );
            } else {
                _amount = sourceAmount - fee;
            }
        } else {
            sourceAmount = _amount;

            IERC20Upgradeable(_sourceToken).safeTransferFrom(
                _msgSender(),
                address(this),
                sourceAmount
            );

            if (_sourceToken != _poolToken) {
                (_amount, fee) = _swapExactForCarbon(
                    _sourceToken,
                    _poolToken,
                    sourceAmount
                );
            } else {
                fee = (_amount * feeAmount) / 10000;
                _amount = _amount - fee;
            }
        }

        return (_amount, fee);
    }

    function _retireCarbon(
        uint256 _totalAmount,
        string memory _retiringEntityString,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address _poolToken
    ) internal {
        if (_beneficiaryAddress == address(0)) {
            _beneficiaryAddress = _msgSender();
        }

        address retirementStorage = ICarbonRetirementAggregator(
            masterAggregator
        ).carbonRetirementStorage();

        (address[] memory listTCO2, uint256[] memory amounts) = IToucanPool(
            _poolToken
        ).redeemAuto2(_totalAmount);

        uint256 totalRetirmentAmount = _totalAmount;

        for (uint256 i = 0; i < listTCO2.length; i++) {
            if (amounts[i] == 0) {
                continue;
            }

            IToucanCarbonOffsets(listTCO2[i]).retireAndMintCertificate(
                _retiringEntityString,
                _beneficiaryAddress,
                _beneficiaryString,
                _retirementMessage,
                amounts[i]
            );

            _sendRetireCert(_beneficiaryAddress);

            emit ToucanRetired(
                msg.sender,
                _beneficiaryAddress,
                _beneficiaryString,
                _retirementMessage,
                _poolToken,
                listTCO2[i],
                amounts[i]
            );

            _totalAmount -= amounts[i];
        }

        ICarbonRetirementsStorage(retirementStorage).carbonRetired(
            _beneficiaryAddress,
            totalRetirmentAmount
        );

        require(_totalAmount == 0, "Total Retired != To Desired");
    }

    function _retireCarbonSpecific(
        uint256 _totalAmount,
        string memory _retiringEntityString,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address _poolToken,
        address[] memory _carbonList
    ) internal {
        if (_beneficiaryAddress == address(0)) {
            _beneficiaryAddress = _msgSender();
        }

        address retirementStorage = ICarbonRetirementAggregator(
            masterAggregator
        ).carbonRetirementStorage();

        uint256 totalRetirmentAmount;

        for (uint256 i = 0; i < _carbonList.length && _totalAmount > 0; i++) {
            uint256 poolBalance = IERC20Upgradeable(_carbonList[i]).balanceOf(
                _poolToken
            );

            if (poolBalance != 0) {
                address[] memory redeemERC20 = new address[](1);
                redeemERC20[0] = _carbonList[i];

                uint256[] memory redeemAmount = new uint256[](1);

                redeemAmount[0] = _totalAmount > poolBalance
                    ? poolBalance
                    : _totalAmount;

                IToucanPool(_poolToken).redeemMany(redeemERC20, redeemAmount);
                _totalAmount -= redeemAmount[0];

                redeemAmount[0] = IERC20Upgradeable(_carbonList[i]).balanceOf(
                    address(this)
                );

                IToucanCarbonOffsets(_carbonList[i]).retireAndMintCertificate(
                    _retiringEntityString,
                    _beneficiaryAddress,
                    _beneficiaryString,
                    _retirementMessage,
                    redeemAmount[0]
                );

                _sendRetireCert(_beneficiaryAddress);

                totalRetirmentAmount += redeemAmount[0];

                emit ToucanRetired(
                    msg.sender,
                    _beneficiaryAddress,
                    _beneficiaryString,
                    _retirementMessage,
                    _poolToken,
                    _carbonList[i],
                    redeemAmount[0]
                );
            }
        }

        ICarbonRetirementsStorage(retirementStorage).carbonRetired(
            _beneficiaryAddress,
            totalRetirmentAmount
        );

        require(_totalAmount == 0, "Not all pool tokens were burned.");
    }

    function _transferSourceTokens(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _specificRetire
    )
        internal
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 fee;
        uint256 sourceAmount;

        (sourceAmount, fee) = getNeededBuyAmount(
            _sourceToken,
            _poolToken,
            _amount,
            _specificRetire
        );

        IERC20Upgradeable(_sourceToken).safeTransferFrom(
            _msgSender(),
            address(this),
            sourceAmount
        );

        return (sourceAmount, _amount + fee, fee);
    }

    function getNeededBuyAmount(
        address _sourceToken,
        address _poolToken,
        uint256 _poolAmount,
        bool _specificRetire
    ) public view returns (uint256, uint256) {
        uint256 fee = (_poolAmount * feeAmount) / 10000;
        uint256 totalAmount = _poolAmount + fee;

        if (_specificRetire) {
            totalAmount =
                totalAmount +
                _getSpecificCarbonFee(_poolToken, _poolAmount);
        }

        if (_sourceToken != _poolToken) {
            address[] memory path = getSwapPath(_sourceToken, _poolToken);
            uint256[] memory amountIn = IUniswapV2Router02(
                poolRouter[_poolToken]
            ).getAmountsIn(totalAmount, path);
            // Account for .1% default AMM slippage.
            totalAmount = (amountIn[0] * 1001) / 1000;
        }

        return (totalAmount, fee);
    }

    function getSpecificCarbonFee(address _poolToken, uint256 _poolAmount)
        external
        view
        returns (uint256)
    {
        return _getSpecificCarbonFee(_poolToken, _poolAmount);
    }

    function _getSpecificCarbonFee(address _poolToken, uint256 _poolAmount)
        internal
        view
        returns (uint256)
    {
        uint256 poolFeeAmount;
        bool feeExempt;

        try
            IToucanPool(_poolToken).redeemFeeExemptedAddresses(address(this))
        returns (bool result) {
            feeExempt = result;
        } catch {
            feeExempt = false;
        }

        if (feeExempt) {
            poolFeeAmount = 0;
        } else {
            uint256 feeRedeemBp = IToucanPool(_poolToken)
                .feeRedeemPercentageInBase();
            uint256 feeRedeemDivider = IToucanPool(_poolToken)
                .feeRedeemDivider();
            poolFeeAmount =
                ((_poolAmount * feeRedeemDivider) /
                    (feeRedeemDivider - feeRedeemBp)) -
                _poolAmount;
        }

        return poolFeeAmount;
    }

    function getSwapPath(address _sourceToken, address _poolToken)
        public
        view
        returns (address[] memory)
    {
        address[] memory path;

        address USDC = ICarbonRetirementAggregator(masterAggregator).USDC();

        if (_sourceToken == USDC) {
            path = new address[](2);
            path[0] = _sourceToken;
            path[1] = _poolToken;
        } else {
            path = new address[](3);
            path[0] = _sourceToken;
            path[1] = USDC;
            path[2] = _poolToken;
        }

        return path;
    }

    function _swapForExactCarbon(
        address _sourceToken,
        address _poolToken,
        uint256 _carbonAmount,
        uint256 _amountIn,
        address _retiree
    ) internal {
        address[] memory path = getSwapPath(_sourceToken, _poolToken);

        IERC20Upgradeable(path[0]).safeIncreaseAllowance(
            poolRouter[_poolToken],
            _amountIn
        );

        uint256[] memory amounts = IUniswapV2Router02(poolRouter[_poolToken])
            .swapTokensForExactTokens(
                _carbonAmount,
                _amountIn,
                path,
                address(this),
                block.timestamp
            );

        _returnTradeDust(amounts, _sourceToken, _amountIn, _retiree);
    }

    function _swapExactForCarbon(
        address _sourceToken,
        address _poolToken,
        uint256 _amountIn
    ) internal returns (uint256, uint256) {
        address[] memory path = getSwapPath(_sourceToken, _poolToken);

        IERC20Upgradeable(_sourceToken).safeIncreaseAllowance(
            poolRouter[_poolToken],
            _amountIn
        );

        uint256[] memory amounts = IUniswapV2Router02(poolRouter[_poolToken])
            .swapExactTokensForTokens(
                _amountIn,
                0,
                path,
                address(this),
                block.timestamp
            );

        uint256 totalCarbon = amounts[amounts.length - 1];

        uint256 fee = (totalCarbon * feeAmount) / 10000;

        return (totalCarbon - fee, fee);
    }

    function _returnTradeDust(
        uint256[] memory _amounts,
        address _sourceToken,
        uint256 _amountIn,
        address _retiree
    ) internal {
        uint256 tradeDust = _amountIn - _amounts[0];
        IERC20Upgradeable(_sourceToken).safeTransfer(_retiree, tradeDust);
    }

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes memory
    ) external virtual override returns (bytes4) {
        lastTokenId = tokenId;

        return this.onERC721Received.selector;
    }

    function _sendRetireCert(address _beneficiary) internal {
        address retireCert = IToucanContractRegistry(toucanRegistry)
            .carbonOffsetBadgesAddress();

        IERC721Upgradeable(retireCert).safeTransferFrom(
            address(this),
            _beneficiary,
            lastTokenId
        );
    }

    function setFeeAmount(uint256 _amount) external onlyOwner {
        uint256 oldFee = feeAmount;
        feeAmount = _amount;

        emit FeeUpdated(oldFee, feeAmount);
    }

    function setPoolRouter(address _poolToken, address _router)
        external
        onlyOwner
    {
        require(poolRouter[_poolToken] != address(0), "Pool not added");

        address oldRouter = poolRouter[_poolToken];
        poolRouter[_poolToken] = _router;
        emit PoolRouterChanged(_poolToken, oldRouter, poolRouter[_poolToken]);
    }

    function setToucanRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Registry cannot be zero");

        address oldRegistry = toucanRegistry;
        toucanRegistry = _registry;
        emit RegistryUpdated(oldRegistry, _registry);
    }

    function addPool(address _poolToken, address _router) external onlyOwner {
        require(_poolToken != address(0), "Pool cannot be zero address");

        require(poolRouter[_poolToken] == address(0), "Pool already added");

        poolRouter[_poolToken] = _router;

        emit PoolAdded(_poolToken, _router);
    }

    function removePool(address _poolToken) external onlyOwner {
        require(poolRouter[_poolToken] != address(0), "Pool not added");

        poolRouter[_poolToken] == address(0);

        emit PoolRemoved(_poolToken);
    }

    function feeWithdraw(address _token, address _recipient) public onlyOwner {
        IERC20Upgradeable(_token).safeTransfer(
            _recipient,
            IERC20Upgradeable(_token).balanceOf(address(this))
        );
    }

    function setMasterAggregator(address _newAddress) external onlyOwner {
        address oldAddress = masterAggregator;
        masterAggregator = _newAddress;

        emit MasterAggregatorUpdated(oldAddress, _newAddress);
    }
}

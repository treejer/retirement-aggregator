// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IRetireBridgeCommon.sol";
import "./interfaces/IRetireCarbon.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CarbonRetirementAggregator is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init();
    }

    address public USDC;
    address public treasury;
    address public carbonRetirementStorage;

    mapping(address => address) public poolTokenTobridgeHelper;

    event AddressUpdated(
        uint256 addressIndex,
        address indexed oldAddress,
        address indexed newAddress
    );
    event PoolAdded(address poolToken, address bridge);
    event PoolRemoved(address poolToken);

    function retireCarbon(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage
    ) public {
        require(
            poolTokenTobridgeHelper[_poolToken] != address(0),
            "Pool Token Not Accepted."
        );

        uint256 sourceAmount = getSourceAmount(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon
        );

        IERC20Upgradeable(_sourceToken).safeTransferFrom(
            msg.sender,
            address(this),
            sourceAmount
        );

        IERC20Upgradeable(_sourceToken).safeIncreaseAllowance(
            poolTokenTobridgeHelper[_poolToken],
            sourceAmount
        );

        IRetireCarbon(poolTokenTobridgeHelper[_poolToken]).retire(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiringEntityString,
            _beneficiaryAddress != address(0)
                ? _beneficiaryAddress
                : msg.sender,
            _beneficiaryString,
            _retirementMessage
        );
    }

    function retireCarbonFrom(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage
    ) public {
        require(
            poolTokenTobridgeHelper[_poolToken] != address(0),
            "Pool Token Not Accepted."
        );

        uint256 sourceAmount = getSourceAmount(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon
        );

        require(
            IERC20Upgradeable(_sourceToken).balanceOf(address(this)) ==
                sourceAmount,
            "Source tokens not transferred."
        );

        IERC20Upgradeable(_sourceToken).safeIncreaseAllowance(
            poolTokenTobridgeHelper[_poolToken],
            sourceAmount
        );

        IRetireCarbon(poolTokenTobridgeHelper[_poolToken]).retire(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiringEntityString,
            _beneficiaryAddress != address(0)
                ? _beneficiaryAddress
                : msg.sender,
            _beneficiaryString,
            _retirementMessage
        );
    }

    function retireCarbonSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address[] memory _carbonList
    ) public {
        require(
            poolTokenTobridgeHelper[_poolToken] != address(0),
            "Pool Token Not Accepted."
        );

        uint256 sourceAmount = getSourceAmountSpecific(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon
        );

        IERC20Upgradeable(_sourceToken).safeTransferFrom(
            msg.sender,
            address(this),
            sourceAmount
        );

        IERC20Upgradeable(_sourceToken).safeIncreaseAllowance(
            poolTokenTobridgeHelper[_poolToken],
            sourceAmount
        );

        IRetireCarbon(poolTokenTobridgeHelper[_poolToken]).retireSpecific(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiringEntityString,
            _beneficiaryAddress != address(0)
                ? _beneficiaryAddress
                : msg.sender,
            _beneficiaryString,
            _retirementMessage,
            _carbonList
        );
    }

    function retireCarbonSpecificFrom(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address[] memory _carbonList
    ) public {
        require(
            poolTokenTobridgeHelper[_poolToken] != address(0),
            "Pool Token Not Accepted."
        );

        uint256 sourceAmount = getSourceAmountSpecific(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon
        );

        require(
            IERC20Upgradeable(_sourceToken).balanceOf(address(this)) ==
                sourceAmount,
            "Source tokens not transferred."
        );

        IERC20Upgradeable(_sourceToken).safeIncreaseAllowance(
            poolTokenTobridgeHelper[_poolToken],
            sourceAmount
        );

        IRetireCarbon(poolTokenTobridgeHelper[_poolToken]).retireSpecific(
            _sourceToken,
            _poolToken,
            _amount,
            _amountInCarbon,
            _retiringEntityString,
            _beneficiaryAddress != address(0)
                ? _beneficiaryAddress
                : msg.sender,
            _beneficiaryString,
            _retirementMessage,
            _carbonList
        );
    }

    function getSourceAmount(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon
    ) public view returns (uint256) {
        uint256 sourceAmount;

        if (_amountInCarbon) {
            (sourceAmount, ) = IRetireBridgeCommon(
                poolTokenTobridgeHelper[_poolToken]
            ).getNeededBuyAmount(_sourceToken, _poolToken, _amount, false);
        } else {
            sourceAmount = _amount;
        }

        return sourceAmount;
    }

    function getSourceAmountSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon
    ) public view returns (uint256) {
        uint256 sourceAmount;

        if (_amountInCarbon) {
            (sourceAmount, ) = IRetireBridgeCommon(
                poolTokenTobridgeHelper[_poolToken]
            ).getNeededBuyAmount(_sourceToken, _poolToken, _amount, true);
        } else {
            sourceAmount = _amount;
        }

        return sourceAmount;
    }

    function getCarbonRetirmentAmount(
        address _sourceToken,
        address _poolToken,
        uint256 _sourceAmount,
        bool _specificRetire
    ) external view returns (uint256) {
        uint256 totalCarbon;

        IRetireBridgeCommon retireBridgeCarbon = IRetireBridgeCommon(
            poolTokenTobridgeHelper[_poolToken]
        );

        if (_poolToken != _sourceToken) {
            address[] memory path = retireBridgeCarbon.getSwapPath(
                _sourceToken,
                _poolToken
            );

            uint256[] memory amounts = IUniswapV2Router02(
                retireBridgeCarbon.poolRouter(_poolToken)
            ).getAmountsOut(_sourceAmount, path);

            totalCarbon = amounts[amounts.length - 1];
        } else {
            totalCarbon = _sourceAmount;
        }

        uint256 fee = (totalCarbon * retireBridgeCarbon.feeAmount()) / 10000;

        totalCarbon = totalCarbon - fee;

        if (_specificRetire) {
            totalCarbon -= retireBridgeCarbon.getSpecificCarbonFee(
                _poolToken,
                totalCarbon
            );
        }

        return totalCarbon;
    }

    function setAddress(uint256 _selection, address _newAddress)
        external
        onlyOwner
    {
        address oldAddress;

        if (_selection == 0) {
            oldAddress = USDC;
            USDC = _newAddress;
        } else if (_selection == 1) {
            oldAddress = treasury;
            treasury = _newAddress;
        } else if (_selection == 2) {
            oldAddress = carbonRetirementStorage;
            carbonRetirementStorage = _newAddress;
        } else {
            revert("CRT:Selection must be less than 3");
        }

        emit AddressUpdated(_selection, oldAddress, _newAddress);
    }

    function addPool(address _poolToken, address _bridgeHelper)
        external
        onlyOwner
    {
        require(_poolToken != address(0), "CRT:Pool cannot be zero address");

        require(
            _bridgeHelper != address(0),
            "CRT:Bridge cannot be zero address"
        );

        require(
            poolTokenTobridgeHelper[_poolToken] == address(0),
            "CRT:Pool already added"
        );

        poolTokenTobridgeHelper[_poolToken] = _bridgeHelper;

        emit PoolAdded(_poolToken, _bridgeHelper);
    }

    function removePool(address _poolToken) external onlyOwner {
        require(
            poolTokenTobridgeHelper[_poolToken] != address(0),
            "CRT:Pool not added"
        );

        poolTokenTobridgeHelper[_poolToken] = address(0);

        emit PoolRemoved(_poolToken);
    }

    function feeWithdraw(address _token, address _recipient)
        external
        onlyOwner
        returns (bool)
    {
        IERC20Upgradeable(_token).safeTransfer(
            _recipient,
            IERC20Upgradeable(_token).balanceOf(address(this))
        );

        return true;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}

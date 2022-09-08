// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CarbonRetirementsStorage is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    mapping(address => uint256) public retirements;
    mapping(address => bool) public isHelperContract;

    event HelperAdded(address helper);
    event HelperRemoved(address helper);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init();
    }

    function carbonRetired(address _retiree, uint256 _amount) external {
        require(
            isHelperContract[msg.sender],
            "Caller is not a defined helper contract"
        );
        retirements[_retiree] += _amount;
    }

    function addHelperContract(address _helper) external onlyOwner {
        require(!isHelperContract[_helper], "Helper already added.");
        require(_helper != address(0));
        isHelperContract[_helper] = true;
        emit HelperAdded(_helper);
    }

    function removeHelperContract(address _helper) external onlyOwner {
        require(isHelperContract[_helper], "Helper is not on the list");
        isHelperContract[_helper] = false;
        emit HelperRemoved(_helper);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}

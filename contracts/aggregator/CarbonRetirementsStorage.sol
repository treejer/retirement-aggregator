// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonRetirementsStorage is Ownable {
    mapping(address => uint256) public retirements;
    mapping(address => bool) public isHelperContract;

    event HelperAdded(address helper);
    event HelperRemoved(address helper);

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
}

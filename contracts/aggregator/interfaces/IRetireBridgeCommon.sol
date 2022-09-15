// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface IRetireBridgeCommon {
    function getNeededBuyAmount(
        address _sourceToken,
        address _poolToken,
        uint256 _poolAmount,
        bool _retireSpecific
    ) external view returns (uint256, uint256);

    function getSwapPath(address _sourceToken, address _poolToken)
        external
        view
        returns (address[] memory);

    function poolRouter(address _poolToken) external view returns (address);

    function feeAmount() external view returns (uint256);

    function getCarbonRetirmentAmount(address _poolToken, uint256 _poolAmount)
        external
        view
        returns (uint256);
}

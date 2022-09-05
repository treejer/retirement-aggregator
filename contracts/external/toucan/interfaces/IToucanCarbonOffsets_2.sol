// SPDX-FileCopyrightText: 2022 Toucan Labs
//
// SPDX-License-Identifier: UNLICENSED

// If you encounter a vulnerability or an issue, please contact <security@toucan.earth> or visit security.toucan.earth
pragma solidity ^0.8.6;

import "../CarbonProjectVintageTypes.sol";
import "../CarbonProjectTypes.sol";

interface IToucanCarbonOffsets_2 {
    function burnFrom(address account, uint256 amount) external;

    function getAttributes()
        external
        view
        returns (
            CarbonProjectTypes.ProjectData memory,
            CarbonProjectVintageTypes.VintageData memory
        );
}

// SPDX-FileCopyrightText: 2021 Toucan Labs
//
// SPDX-License-Identifier: UNLICENSED

// If you encounter a vulnerability or an issue, please contact <security@toucan.earth> or visit security.toucan.earth

pragma solidity ^0.8.6;

library CarbonOffsetBatchesTypes {
    enum RetirementStatus {
        Pending, // 0
        Rejected, // 1
        Confirmed // 2
    }
}

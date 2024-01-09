// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {HypERC20} from "@hyperlane-xyz/core/contracts/token/HypERC20.sol";
import {TokenMessage} from "@hyperlane-xyz/core/contracts/token/libs/TokenMessage.sol";

contract MockHypERC20 is HypERC20 {
    constructor(
        uint8 __decimals,
        address _mailbox
    ) HypERC20(__decimals, _mailbox) {}

    function format(
        bytes32 _recipient,
        uint256 _amountOrId
    ) external returns (bytes memory) {
        return TokenMessage.format(_recipient, _amountOrId, "");
    }
}

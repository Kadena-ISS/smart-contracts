// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {TokenRouter} from "./TokenRouter.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Hyperlane ERC20 Token Collateral that wraps an existing ERC20 with remote transfer functionality.
 * @author Abacus Works
 */
contract HypERC20Collateral is TokenRouter {
    using SafeERC20 for IERC20;

    IERC20 public immutable wrappedToken;

    /**
     * @notice Constructor
     * @param erc20 Address of the token to keep as collateral
     */
    constructor(address erc20, address _mailbox) TokenRouter(_mailbox) {
        wrappedToken = IERC20(erc20);
    }

    function initialize(address _hook, address _interchainSecurityModule, address _owner) public virtual initializer {
        _MailboxClient_initialize(_hook, _interchainSecurityModule, _owner);
    }

    function balanceOf(address _account) external view override returns (uint256) {
        return wrappedToken.balanceOf(_account);
    }

    /**
     * @dev Transfers `_amount` of `wrappedToken` from `msg.sender` to this contract.
     * @inheritdoc TokenRouter
     */
    function _transferFromSender(uint256 _amount) internal virtual override returns (bytes memory) {
        wrappedToken.safeTransferFrom(msg.sender, address(this), _amount);
        return bytes(""); // no metadata
    }

    /**
     * @dev Transfers `_amount` of `wrappedToken` from this contract to `_recipient`.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _amount,
        bytes calldata // no metadata
    ) internal virtual override {
        wrappedToken.safeTransfer(_recipient, _amount);
    }

    // ============ KINESIS BRIDGE EXTENSION ============
    function _transferRemote(
        uint32 _destination,
        bytes calldata _recipient,
        uint256 _amount,
        uint16 _chainID,
        uint256 _gasPayment
    ) internal override returns (bytes32 messageId) {
        require(_amount > 0, "HypERC20Collateral: amount must be greater than 0");
        return super._transferRemote(_destination, _recipient, _amount, _chainID, _gasPayment);
    }
}

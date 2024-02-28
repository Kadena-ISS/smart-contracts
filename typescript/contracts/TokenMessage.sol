// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

library TokenMessage {
    function format(
        string calldata _recipient,
        uint256 _amount,
        uint8 _chainID
    ) internal pure returns (bytes memory) {
        return abi.encode(_recipient, _amount, _chainID);
    }

    function recipient(bytes calldata message) internal pure returns (bytes32) {
        return bytes32(message[0:32]);
    }

    function amount(bytes calldata message) internal pure returns (uint256) {
        return uint256(bytes32(message[32:64]));
    }

    // alias for ERC721
    function tokenId(bytes calldata message) internal pure returns (uint256) {
        return amount(message);
    }

    function metadata(
        bytes calldata message
    ) internal pure returns (bytes calldata) {
        return message[64:];
    }
}
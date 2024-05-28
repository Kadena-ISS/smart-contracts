// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestERC20Collateral is ERC20Upgradeable {
    function initialize(
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol
    ) external initializer {
        // Initialize ERC20 metadata
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, _totalSupply);
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}

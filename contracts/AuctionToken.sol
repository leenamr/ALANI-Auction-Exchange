// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionToken
 * @notice ERC-20 token used as the required payment currency for the auction platform.
 * @dev Built on OpenZeppelin ERC20 and Ownable for standard token behavior.
 */
contract AuctionToken is ERC20, Ownable {
    uint256 public faucetAmount = 1_000 ether;

    mapping(address => uint256) public lastClaimedAt;

    event FaucetAmountUpdated(uint256 oldAmount, uint256 newAmount);

    error FaucetCooldownActive();

    constructor(uint256 initialSupply) ERC20("Alani", "ALANI") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function claimFromFaucet() external {
        if (block.timestamp < lastClaimedAt[msg.sender] + 1 days) revert FaucetCooldownActive();
        lastClaimedAt[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }

    function setFaucetAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = faucetAmount;
        faucetAmount = newAmount;
        emit FaucetAmountUpdated(oldAmount, newAmount);
    }
}

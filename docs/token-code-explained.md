# Token Code Explained: AuctionToken

This document explains the OpenZeppelin-based `AuctionToken` contract used in Alani Auction Exchange.

File:

```text
contracts/AuctionToken.sol
```

## Big Picture

`AuctionToken` is the ERC-20 token used as the bidding currency in the auction platform.

The token is:

```text
Name: Alani
Symbol: ALANI
Decimals: 18
```

The contract now uses OpenZeppelin:

```solidity
contract AuctionToken is ERC20, Ownable
```

This means:

- `ERC20` gives the token standard ERC-20 behavior.
- `Ownable` gives admin/owner permissions.
- The project only adds custom features such as initial supply, faucet, owner minting, and faucet amount control.

## Imports

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
```

`ERC20.sol` provides:

- `name()`
- `symbol()`
- `decimals()`
- `totalSupply()`
- `balanceOf()`
- `transfer()`
- `approve()`
- `allowance()`
- `transferFrom()`
- internal `_mint()`
- internal `_transfer()`

`Ownable.sol` provides:

- `owner()`
- `onlyOwner`
- `transferOwnership()`
- `renounceOwnership()`

## Contract Declaration

```solidity
contract AuctionToken is ERC20, Ownable {
```

This makes `AuctionToken` both:

- an ERC-20 token
- an ownable/admin-controlled contract

## faucetAmount

```solidity
uint256 public faucetAmount = 1_000 ether;
```

The faucet gives `1000 ALANI`.

In Solidity, `1 ether` means `1 * 10^18`.

ERC-20 tokens usually use 18 decimals, so:

```solidity
1_000 ether
```

means:

```text
1000 * 10^18 token units
```

This is not real ETH. It is just a Solidity unit helper.

## lastClaimedAt

```solidity
mapping(address => uint256) public lastClaimedAt;
```

This stores the last time each wallet claimed from the faucet.

Example:

```text
0xABC... => 1777846368
0xDEF... => 0
```

If a wallet has never claimed, its value is `0`.

This mapping is used to enforce the 24-hour faucet cooldown.

## FaucetAmountUpdated Event

```solidity
event FaucetAmountUpdated(uint256 oldAmount, uint256 newAmount);
```

This event is emitted when the owner changes the faucet amount.

Events are useful because:

- front ends can listen to them
- Etherscan shows them
- they document important contract changes

## FaucetCooldownActive Error

```solidity
error FaucetCooldownActive();
```

This is a custom error.

Instead of writing:

```solidity
require(condition, "Faucet cooldown active");
```

the contract uses:

```solidity
revert FaucetCooldownActive();
```

Custom errors are cheaper in gas and easier for the front end to decode.

## Constructor

```solidity
constructor(uint256 initialSupply) ERC20("Alani", "ALANI") Ownable(msg.sender) {
    _mint(msg.sender, initialSupply);
}
```

The constructor runs once when the contract is deployed.

It does three things.

First:

```solidity
ERC20("Alani", "ALANI")
```

This calls OpenZeppelin's ERC-20 constructor.

It sets:

```text
name = Alani
symbol = ALANI
```

Second:

```solidity
Ownable(msg.sender)
```

This sets the owner.

`msg.sender` is the wallet that deploys the contract. If the contract is deployed from MetaMask, that MetaMask account becomes the owner.

Third:

```solidity
_mint(msg.sender, initialSupply);
```

This creates the initial token supply and gives it to the deployer.

For example:

```text
1000000000000000000000000
```

equals:

```text
1,000,000 ALANI
```

because ALANI has 18 decimals.

`_mint()` comes from OpenZeppelin ERC20. It increases:

- `totalSupply`
- deployer balance

It also emits a standard ERC-20 `Transfer` event from the zero address.

## mint

```solidity
function mint(address to, uint256 amount) external onlyOwner {
    _mint(to, amount);
}
```

This lets the owner mint more ALANI.

The important modifier is:

```solidity
onlyOwner
```

This comes from OpenZeppelin `Ownable`.

It means only the contract owner can call this function.

If a normal user tries to call it, the transaction reverts.

This is important because if anyone could mint, users could create unlimited ALANI and bid unfairly.

## claimFromFaucet

```solidity
function claimFromFaucet() external {
    if (block.timestamp < lastClaimedAt[msg.sender] + 1 days) revert FaucetCooldownActive();
    lastClaimedAt[msg.sender] = block.timestamp;
    _mint(msg.sender, faucetAmount);
}
```

This lets any user claim free ALANI for testing.

It is not `onlyOwner`, because normal bidders need to claim tokens.

Step by step:

```solidity
if (block.timestamp < lastClaimedAt[msg.sender] + 1 days)
```

`block.timestamp` is the current block time.

`lastClaimedAt[msg.sender]` is the last time this wallet claimed.

`1 days` is Solidity syntax for 86400 seconds.

So the condition means:

```text
If the current time is less than last claim time + 1 day, block the claim.
```

If the wallet claimed recently, it reverts:

```solidity
revert FaucetCooldownActive();
```

Then:

```solidity
lastClaimedAt[msg.sender] = block.timestamp;
```

This records the new claim time.

Then:

```solidity
_mint(msg.sender, faucetAmount);
```

This mints `1000 ALANI` to the user.

## setFaucetAmount

```solidity
function setFaucetAmount(uint256 newAmount) external onlyOwner {
    uint256 oldAmount = faucetAmount;
    faucetAmount = newAmount;
    emit FaucetAmountUpdated(oldAmount, newAmount);
}
```

This lets the owner change how much ALANI the faucet gives.

Only the owner can call it because of:

```solidity
onlyOwner
```

Step by step:

```solidity
uint256 oldAmount = faucetAmount;
```

Stores the old faucet amount.

```solidity
faucetAmount = newAmount;
```

Updates the faucet amount.

```solidity
emit FaucetAmountUpdated(oldAmount, newAmount);
```

Emits an event so the change is visible on-chain.

## What OpenZeppelin Handles

Because the contract inherits `ERC20`, it no longer needs to manually write:

```solidity
transfer()
approve()
transferFrom()
balanceOf()
allowance()
totalSupply()
```

OpenZeppelin already provides them.

For example, when a user approves the auction house:

```solidity
approve(auctionHouseAddress, amount)
```

that function comes from OpenZeppelin ERC20.

When the auction house takes the bid:

```solidity
transferFrom(bidder, auctionHouse, amount)
```

that also comes from OpenZeppelin ERC20.

OpenZeppelin also provides standard custom errors such as:

```solidity
ERC20InsufficientAllowance
ERC20InsufficientBalance
ERC20InvalidReceiver
ERC20InvalidSpender
```

That is why the front end error decoder was updated.

## Why Ownable Is Needed

`Ownable` is needed because some functions should not be available to everyone.

Only the owner should be able to:

- mint extra tokens manually
- change faucet settings

If anyone could call `mint`, users could create unlimited ALANI and bid unfairly.

If anyone could call `setFaucetAmount`, users could set the faucet to a huge amount and claim too many tokens.

So `Ownable` provides a clean access-control system:

- everyone can use normal ERC-20 functions
- everyone can claim from the faucet once per day
- only the owner can mint manually
- only the owner can change faucet amount

## Simple Explanation

You can explain the token like this:

> The token contract uses OpenZeppelin ERC20 and Ownable. ERC20 gives us standard token functions such as transfer, approve, allowance, balanceOf, and transferFrom. Ownable gives us access control so only the deployer can mint extra tokens or change the faucet amount. Normal users can transfer tokens, approve the auction contract, and claim test ALANI from the faucet once per day.

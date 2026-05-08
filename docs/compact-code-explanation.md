# Compact Code Explanation: Alani Auction Exchange

This file summarizes the two main smart contracts:

- `AuctionToken`: the OpenZeppelin-based ALANI ERC-20 token.
- `TokenAuctionHouse`: the auction contract that accepts ALANI bids.

## 1. AuctionToken

File:

```text
contracts/AuctionToken.sol
```

## Purpose

`AuctionToken` creates the project token:

```text
Name: Alani
Symbol: ALANI
Decimals: 18
```

It is used as the bidding currency in the auction platform.

## OpenZeppelin Usage

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionToken is ERC20, Ownable
```

`ERC20` gives the token standard functions:

- `transfer`
- `approve`
- `transferFrom`
- `balanceOf`
- `allowance`
- `totalSupply`
- `name`
- `symbol`
- `decimals`

`Ownable` gives owner/admin control:

- `owner`
- `onlyOwner`
- `transferOwnership`

## Constructor

```solidity
constructor(uint256 initialSupply) ERC20("Alani", "ALANI") Ownable(msg.sender) {
    _mint(msg.sender, initialSupply);
}
```

This runs once during deployment.

It:

1. Sets the token name to `Alani`.
2. Sets the symbol to `ALANI`.
3. Makes the deployer the owner.
4. Mints the initial supply to the deployer.

If deployed with:

```text
1000000000000000000000000
```

that equals:

```text
1,000,000 ALANI
```

because the token has 18 decimals.

## Faucet

```solidity
uint256 public faucetAmount = 1_000 ether;
mapping(address => uint256) public lastClaimedAt;
```

The faucet gives users `1000 ALANI`.

`lastClaimedAt` records when each wallet last claimed.

```solidity
function claimFromFaucet() external {
    if (block.timestamp < lastClaimedAt[msg.sender] + 1 days) revert FaucetCooldownActive();
    lastClaimedAt[msg.sender] = block.timestamp;
    _mint(msg.sender, faucetAmount);
}
```

This lets any user claim once every 24 hours.

If they try again too early, the contract reverts with:

```solidity
FaucetCooldownActive()
```

## Owner-Only Functions

```solidity
function mint(address to, uint256 amount) external onlyOwner
```

Only the owner can mint extra ALANI.

```solidity
function setFaucetAmount(uint256 newAmount) external onlyOwner
```

Only the owner can change the faucet amount.

## Why Ownable Is Needed

Without `Ownable`, anyone could:

- mint unlimited ALANI
- change the faucet amount
- break the auction economy

So `Ownable` protects sensitive admin functions.

## 2. TokenAuctionHouse

File:

```text
contracts/TokenAuctionHouse.sol
```

## Purpose

`TokenAuctionHouse` manages auctions.

It lets users:

- create auctions
- bid using ALANI
- refund previous bidders
- cancel auctions before bids
- finalize auctions after they end
- read auction details

## ERC-20 Interface

```solidity
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

The auction contract only needs two token functions:

- `transfer`
- `transferFrom`

Since `AuctionToken` uses OpenZeppelin ERC20, it supports both.

## Auction Status

```solidity
enum AuctionStatus {
    Active,
    Cancelled,
    Finalized
}
```

Auction states:

- `Active`: auction is running
- `Cancelled`: seller cancelled before bids
- `Finalized`: auction ended and was settled

## Auction Struct

```solidity
struct Auction {
    address seller;
    string title;
    string description;
    uint256 startingBid;
    uint256 minIncrement;
    uint256 endTime;
    address highestBidder;
    uint256 highestBid;
    AuctionStatus status;
}
```

Each auction stores seller info, item info, bid rules, deadline, highest bidder, highest bid, and status.

## Main State

```solidity
IERC20 public immutable bidToken;
uint256 public auctionCount;
mapping(uint256 => Auction) private auctions;
```

`bidToken` is the ALANI token contract.

`auctionCount` tracks how many auctions exist.

`auctions` maps auction IDs to auction data.

## Constructor

```solidity
constructor(address tokenAddress) {
    if (tokenAddress == address(0)) revert InvalidTokenAddress();
    bidToken = IERC20(tokenAddress);
}
```

The auction house is deployed with the ALANI token address.

This makes ALANI the required bidding token.

## createAuction

```solidity
function createAuction(
    string calldata title,
    string calldata description,
    uint256 startingBid,
    uint256 minIncrement,
    uint256 durationSeconds
) external returns (uint256 auctionId)
```

This creates a new auction.

It checks:

- title is not empty
- duration is at least 5 minutes
- minimum increment is greater than 0

Then it stores the auction and emits:

```solidity
AuctionCreated(...)
```

## placeBid

```solidity
function placeBid(uint256 auctionId, uint256 amount)
```

This places a bid using ALANI.

It checks:

- auction exists
- auction is active
- auction has not ended
- seller is not bidding on their own auction
- bid is high enough

The required bid is:

```solidity
startingBid
```

if there are no bids yet, or:

```solidity
highestBid + minIncrement
```

if a bid already exists.

Then the contract transfers ALANI from the bidder:

```solidity
bidToken.transferFrom(msg.sender, address(this), amount)
```

This only works if the bidder approved the auction house first.

If there was a previous highest bidder, they are refunded:

```solidity
bidToken.transfer(previousBidder, previousBid)
```

Then the new highest bidder and highest bid are saved.

## cancelAuction

```solidity
function cancelAuction(uint256 auctionId)
```

The seller can cancel only if:

- they are the seller
- the auction is active
- no bid exists yet

Once a bid exists, cancellation is blocked.

## finalizeAuction

```solidity
function finalizeAuction(uint256 auctionId)
```

This finalizes an auction after it ends.

It checks:

- auction is active
- current time is after `endTime`

Then it marks the auction finalized.

If there is a winner, the contract sends the winning ALANI bid to the seller:

```solidity
bidToken.transfer(auction.seller, auction.highestBid)
```

## Read Functions

```solidity
getAuction(uint256 auctionId)
```

Returns all auction details.

```solidity
getRequiredBid(uint256 auctionId)
```

Returns the minimum valid next bid.

```solidity
isActive(uint256 auctionId)
```

Returns whether the auction is active and not expired.

## Security Features

The auction house includes:

- reentrancy protection on token-transfer functions
- seller self-bidding prevention
- minimum bid enforcement
- deadline enforcement
- cancellation blocked after bids
- finalization blocked before end time
- ERC-20 transfer failure checks
- custom errors for clear failure reasons

## Full Bid Flow

Example: bidder wants to bid `100 ALANI`.

Because ALANI has 18 decimals:

```text
100 ALANI = 100000000000000000000
```

Step 1:

```solidity
AuctionToken.approve(auctionHouseAddress, 100 ether)
```

Step 2:

```solidity
TokenAuctionHouse.placeBid(auctionId, 100 ether)
```

Step 3:

The auction house transfers ALANI into escrow.

Step 4:

The auction state updates:

- highest bidder
- highest bid

## Simple Project Explanation

Alani Auction Exchange is a decentralized auction DApp. It uses an OpenZeppelin ERC-20 token called ALANI as the bidding currency. Sellers create auctions through the auction contract. Bidders first approve the auction contract to spend ALANI, then place bids. The auction contract escrows the current highest bid and refunds the previous highest bidder when they are outbid. Sellers cannot bid on their own auctions, auctions cannot be cancelled after bids exist, and finalization only happens after the auction deadline.

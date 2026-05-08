# Auction House Code Explained: TokenAuctionHouse

This document explains the `TokenAuctionHouse` contract used in Alani Auction Exchange.

File:

```text
contracts/TokenAuctionHouse.sol
```

## Big Picture

`TokenAuctionHouse` manages the auction system.

It does not create the token. Instead, it interacts with the `AuctionToken` ERC-20 contract.

The auction house lets users:

- create auctions
- bid using ALANI
- refund previous highest bidders
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

This is a small interface.

It tells the auction contract that it only needs two ERC-20 functions:

- `transfer`
- `transferFrom`

The Alani token uses OpenZeppelin ERC20, which implements both functions.

So the auction house can interact with the token without importing the full token contract.

## Contract Declaration

```solidity
contract TokenAuctionHouse {
```

The auction house is its own contract.

It does not inherit OpenZeppelin because it is not a token. It only needs to call an ERC-20 token.

## AuctionStatus Enum

```solidity
enum AuctionStatus {
    Active,
    Cancelled,
    Finalized
}
```

This represents the state of an auction.

Internally:

```text
Active = 0
Cancelled = 1
Finalized = 2
```

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

Each auction stores:

- `seller`: the account that created the auction
- `title`: auction item title
- `description`: auction item description
- `startingBid`: minimum first bid
- `minIncrement`: how much higher the next bid must be
- `endTime`: timestamp when auction ends
- `highestBidder`: current winner
- `highestBid`: current highest bid
- `status`: active, cancelled, or finalized

## bidToken

```solidity
IERC20 public immutable bidToken;
```

This stores the ALANI token contract.

`immutable` means it is set once in the constructor and cannot change later.

This is important because all auctions must use the same bidding token.

## auctionCount

```solidity
uint256 public auctionCount;
```

This counts auctions.

The first auction has ID `1`.

When a new auction is created:

```solidity
auctionId = ++auctionCount;
```

This increases the count and assigns the new auction ID.

## locked

```solidity
bool private locked;
```

This is used for the reentrancy guard.

Reentrancy protection is important because some functions transfer tokens.

## auctions Mapping

```solidity
mapping(uint256 => Auction) private auctions;
```

This maps an auction ID to its auction data.

Example:

```text
1 => Auction(...)
2 => Auction(...)
3 => Auction(...)
```

It is private, so users read auction details through:

```solidity
getAuction()
```

## Events

```solidity
event AuctionCreated(...)
event BidPlaced(...)
event PreviousBidRefunded(...)
event AuctionCancelled(...)
event AuctionFinalized(...)
```

Events are emitted when important actions happen.

They help:

- Etherscan show activity
- front ends track updates
- documentation prove actions happened
- users understand the transaction history

## Custom Errors

```solidity
error ReentrancyDetected();
error InvalidTokenAddress();
error EmptyTitle();
error InvalidDuration();
error InvalidIncrement();
error AuctionNotFound();
error AuctionNotActive();
error AuctionEnded();
error AuctionStillActive();
error SellerCannotBid();
error BidTooLow(uint256 requiredBid);
error OnlySeller();
error ExistingBid();
error TokenTransferFailed();
```

These are custom errors.

They replace long revert strings.

They are cheaper in gas and easier for the front end to decode.

Example:

```solidity
revert SellerCannotBid();
```

means the seller tried to bid on their own auction.

## nonReentrant Modifier

```solidity
modifier nonReentrant() {
    if (locked) revert ReentrancyDetected();
    locked = true;
    _;
    locked = false;
}
```

This prevents reentrancy attacks.

Step by step:

```solidity
if (locked) revert ReentrancyDetected();
```

If the function is already running, block reentry.

```solidity
locked = true;
```

Mark the contract as inside a protected function.

```solidity
_;
```

Run the function body.

```solidity
locked = false;
```

Unlock after the function finishes.

This modifier is used on:

- `placeBid`
- `finalizeAuction`

because both functions transfer tokens.

## auctionExists Modifier

```solidity
modifier auctionExists(uint256 auctionId) {
    if (auctionId == 0 || auctionId > auctionCount) revert AuctionNotFound();
    _;
}
```

This checks whether the auction ID is valid.

Auction IDs start at `1`.

So:

- `0` is invalid
- anything greater than `auctionCount` is invalid

## Constructor

```solidity
constructor(address tokenAddress) {
    if (tokenAddress == address(0)) revert InvalidTokenAddress();
    bidToken = IERC20(tokenAddress);
}
```

The auction house needs the ALANI token address.

First, it checks:

```solidity
tokenAddress != address(0)
```

The zero address is invalid.

Then it stores the token:

```solidity
bidToken = IERC20(tokenAddress);
```

This lets the auction contract call:

```solidity
bidToken.transferFrom(...)
bidToken.transfer(...)
```

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

The seller provides:

- title
- description
- starting bid
- minimum increment
- duration

### Validation

```solidity
if (bytes(title).length == 0) revert EmptyTitle();
```

The title cannot be empty.

```solidity
if (durationSeconds < 5 minutes) revert InvalidDuration();
```

The auction must last at least 5 minutes.

```solidity
if (minIncrement == 0) revert InvalidIncrement();
```

The minimum increment cannot be zero.

### Creating the ID

```solidity
auctionId = ++auctionCount;
```

This increments the auction count and assigns the new ID.

### End Time

```solidity
uint256 endTime = block.timestamp + durationSeconds;
```

This calculates when the auction ends.

### Storing the Auction

```solidity
auctions[auctionId] = Auction({
    seller: msg.sender,
    title: title,
    description: description,
    startingBid: startingBid,
    minIncrement: minIncrement,
    endTime: endTime,
    highestBidder: address(0),
    highestBid: 0,
    status: AuctionStatus.Active
});
```

The seller is:

```solidity
msg.sender
```

The initial highest bidder is:

```solidity
address(0)
```

because nobody has bid yet.

The initial highest bid is:

```solidity
0
```

The auction starts as:

```solidity
AuctionStatus.Active
```

### Event

```solidity
emit AuctionCreated(auctionId, msg.sender, title, startingBid, minIncrement, endTime);
```

This records the auction creation on-chain.

## placeBid

```solidity
function placeBid(uint256 auctionId, uint256 amount)
    external
    nonReentrant
    auctionExists(auctionId)
```

This lets a user place a bid.

It uses:

- `nonReentrant`
- `auctionExists`

### Load Auction

```solidity
Auction storage auction = auctions[auctionId];
```

This loads the auction from storage.

### Checks

```solidity
if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
```

Auction must be active.

```solidity
if (block.timestamp >= auction.endTime) revert AuctionEnded();
```

Cannot bid after the deadline.

```solidity
if (msg.sender == auction.seller) revert SellerCannotBid();
```

The seller cannot bid on their own auction.

### Required Bid Calculation

```solidity
uint256 requiredBid = auction.highestBid == 0
    ? auction.startingBid
    : auction.highestBid + auction.minIncrement;
```

If no one has bid yet:

```text
required bid = starting bid
```

If someone already bid:

```text
required bid = highest bid + minimum increment
```

Then:

```solidity
if (amount < requiredBid) revert BidTooLow(requiredBid);
```

This rejects low bids.

### Transfer Tokens Into Escrow

```solidity
if (!bidToken.transferFrom(msg.sender, address(this), amount)) revert TokenTransferFailed();
```

This transfers ALANI from the bidder to the auction contract.

This only works if the bidder already approved the auction house.

With the OpenZeppelin token, this uses OpenZeppelin's `transferFrom`.

### Store Previous Bidder

```solidity
address previousBidder = auction.highestBidder;
uint256 previousBid = auction.highestBid;
```

This saves the old highest bidder and old highest bid before updating.

### Update Highest Bid

```solidity
auction.highestBidder = msg.sender;
auction.highestBid = amount;
```

The new bidder becomes the highest bidder.

### Refund Previous Bidder

```solidity
if (previousBidder != address(0)) {
    if (!bidToken.transfer(previousBidder, previousBid)) revert TokenTransferFailed();
    emit PreviousBidRefunded(auctionId, previousBidder, previousBid);
}
```

If there was a previous bidder, they are refunded.

This means the auction contract only keeps the current highest bid in escrow.

### Bid Event

```solidity
emit BidPlaced(auctionId, msg.sender, amount);
```

This records the new bid on-chain.

## cancelAuction

```solidity
function cancelAuction(uint256 auctionId) external auctionExists(auctionId)
```

This lets the seller cancel an auction only before any bid exists.

### Checks

```solidity
if (msg.sender != auction.seller) revert OnlySeller();
```

Only the seller can cancel.

```solidity
if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
```

Auction must be active.

```solidity
if (auction.highestBidder != address(0)) revert ExistingBid();
```

The auction cannot be cancelled after a bid exists.

### Cancel

```solidity
auction.status = AuctionStatus.Cancelled;
emit AuctionCancelled(auctionId);
```

The auction is marked as cancelled.

## finalizeAuction

```solidity
function finalizeAuction(uint256 auctionId)
    external
    nonReentrant
    auctionExists(auctionId)
```

This finalizes an auction after it ends.

### Checks

```solidity
if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
```

Auction must be active.

```solidity
if (block.timestamp < auction.endTime) revert AuctionStillActive();
```

Cannot finalize before the deadline.

### Mark Finalized

```solidity
auction.status = AuctionStatus.Finalized;
```

The auction is now finalized.

### Pay Seller

```solidity
if (auction.highestBidder != address(0)) {
    if (!bidToken.transfer(auction.seller, auction.highestBid)) revert TokenTransferFailed();
}
```

If there is a winner, the winning ALANI bid is transferred to the seller.

### Event

```solidity
emit AuctionFinalized(auctionId, auction.highestBidder, auction.highestBid);
```

This records the finalization on-chain.

## getAuction

```solidity
function getAuction(uint256 auctionId)
    external
    view
    auctionExists(auctionId)
    returns (Auction memory)
```

This returns all auction details.

The front end uses it to display:

- seller
- title
- description
- highest bidder
- highest bid
- end time
- status

Because it returns a struct, the front-end ABI must decode it as a tuple.

## getRequiredBid

```solidity
function getRequiredBid(uint256 auctionId)
    external
    view
    auctionExists(auctionId)
    returns (uint256)
```

This returns the minimum valid next bid.

If no bids exist:

```solidity
return auction.startingBid;
```

If bids exist:

```solidity
return auction.highestBid + auction.minIncrement;
```

## isActive

```solidity
function isActive(uint256 auctionId)
    external
    view
    auctionExists(auctionId)
    returns (bool)
```

This returns true only if:

```solidity
auction.status == AuctionStatus.Active && block.timestamp < auction.endTime
```

So an auction is active only if:

- it is marked active
- it has not expired yet

## Full Bid Flow

Suppose a bidder wants to bid `100 ALANI`.

Because ALANI has 18 decimals:

```text
100 ALANI = 100000000000000000000
```

Step 1:

```solidity
AuctionToken.approve(auctionHouseAddress, 100 ether)
```

The bidder approves the auction house.

Step 2:

```solidity
TokenAuctionHouse.placeBid(1, 100 ether)
```

The bidder places the bid.

Step 3:

```solidity
bidToken.transferFrom(bidder, auctionHouse, 100 ether)
```

The auction house transfers ALANI into escrow.

Step 4:

OpenZeppelin ERC20 checks:

- bidder balance
- allowance
- valid addresses

Step 5:

The auction house updates:

- highest bidder
- highest bid

## Simple Explanation

You can explain the auction house like this:

> The auction house contract manages auctions and uses ALANI as the bidding token. Sellers create auctions with a starting bid, minimum increment, and duration. Bidders must approve the auction contract before bidding. When a bid is placed, the contract transfers ALANI from the bidder into escrow. If a new bidder outbids the previous bidder, the previous bidder is refunded. The seller cannot bid on their own auction, auctions cannot be cancelled after bids exist, and finalization can only happen after the auction ends.

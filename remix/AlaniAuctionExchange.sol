// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionToken
 * @notice ERC-20 token named Alani. It is the required bidding currency for the auction platform.
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

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title TokenAuctionHouse
 * @notice English auction platform where bids are paid with the Alani ERC-20 token.
 */
contract TokenAuctionHouse {
    enum AuctionStatus {
        Active,
        Cancelled,
        Finalized
    }

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

    IERC20 public immutable bidToken;
    uint256 public auctionCount;
    bool private locked;

    mapping(uint256 => Auction) private auctions;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string title,
        uint256 startingBid,
        uint256 minIncrement,
        uint256 endTime
    );
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event PreviousBidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint256 winningBid);

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

    modifier nonReentrant() {
        if (locked) revert ReentrancyDetected();
        locked = true;
        _;
        locked = false;
    }

    modifier auctionExists(uint256 auctionId) {
        if (auctionId == 0 || auctionId > auctionCount) revert AuctionNotFound();
        _;
    }

    constructor(address tokenAddress) {
        if (tokenAddress == address(0)) revert InvalidTokenAddress();
        bidToken = IERC20(tokenAddress);
    }

    function createAuction(
        string calldata title,
        string calldata description,
        uint256 startingBid,
        uint256 minIncrement,
        uint256 durationSeconds
    ) external returns (uint256 auctionId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (durationSeconds < 5 minutes) revert InvalidDuration();
        if (minIncrement == 0) revert InvalidIncrement();

        auctionId = ++auctionCount;
        uint256 endTime = block.timestamp + durationSeconds;

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

        emit AuctionCreated(auctionId, msg.sender, title, startingBid, minIncrement, endTime);
    }

    function placeBid(uint256 auctionId, uint256 amount) external nonReentrant auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
        if (block.timestamp >= auction.endTime) revert AuctionEnded();
        if (msg.sender == auction.seller) revert SellerCannotBid();

        uint256 requiredBid = auction.highestBid == 0
            ? auction.startingBid
            : auction.highestBid + auction.minIncrement;

        if (amount < requiredBid) revert BidTooLow(requiredBid);
        if (!bidToken.transferFrom(msg.sender, address(this), amount)) revert TokenTransferFailed();

        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        auction.highestBidder = msg.sender;
        auction.highestBid = amount;

        if (previousBidder != address(0)) {
            if (!bidToken.transfer(previousBidder, previousBid)) revert TokenTransferFailed();
            emit PreviousBidRefunded(auctionId, previousBidder, previousBid);
        }

        emit BidPlaced(auctionId, msg.sender, amount);
    }

    function cancelAuction(uint256 auctionId) external auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];

        if (msg.sender != auction.seller) revert OnlySeller();
        if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
        if (auction.highestBidder != address(0)) revert ExistingBid();

        auction.status = AuctionStatus.Cancelled;
        emit AuctionCancelled(auctionId);
    }

    function finalizeAuction(uint256 auctionId) external nonReentrant auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];

        if (auction.status != AuctionStatus.Active) revert AuctionNotActive();
        if (block.timestamp < auction.endTime) revert AuctionStillActive();

        auction.status = AuctionStatus.Finalized;

        if (auction.highestBidder != address(0)) {
            if (!bidToken.transfer(auction.seller, auction.highestBid)) revert TokenTransferFailed();
        }

        emit AuctionFinalized(auctionId, auction.highestBidder, auction.highestBid);
    }

    function getAuction(uint256 auctionId) external view auctionExists(auctionId) returns (Auction memory) {
        return auctions[auctionId];
    }

    function getRequiredBid(uint256 auctionId) external view auctionExists(auctionId) returns (uint256) {
        Auction storage auction = auctions[auctionId];
        if (auction.highestBid == 0) {
            return auction.startingBid;
        }
        return auction.highestBid + auction.minIncrement;
    }

    function isActive(uint256 auctionId) external view auctionExists(auctionId) returns (bool) {
        Auction storage auction = auctions[auctionId];
        return auction.status == AuctionStatus.Active && block.timestamp < auction.endTime;
    }
}

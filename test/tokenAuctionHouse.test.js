const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenAuctionHouse", function () {
  async function deployFixture() {
    const [owner, seller, bidderOne, bidderTwo] = await ethers.getSigners();
    const initialSupply = ethers.parseUnits("1000000", 18);
    const bidderFunds = ethers.parseUnits("10000", 18);

    const AuctionToken = await ethers.getContractFactory("AuctionToken");
    const token = await AuctionToken.deploy(initialSupply);

    const TokenAuctionHouse = await ethers.getContractFactory("TokenAuctionHouse");
    const auctionHouse = await TokenAuctionHouse.deploy(await token.getAddress());

    await token.transfer(bidderOne.address, bidderFunds);
    await token.transfer(bidderTwo.address, bidderFunds);

    return { owner, seller, bidderOne, bidderTwo, token, auctionHouse };
  }

  async function createAuction(auctionHouse, seller) {
    const startingBid = ethers.parseUnits("100", 18);
    const minIncrement = ethers.parseUnits("10", 18);
    const duration = 3600;

    const tx = await auctionHouse
      .connect(seller)
      .createAuction("Laptop Auction", "Lightly used laptop with off-chain delivery.", startingBid, minIncrement, duration);
    await tx.wait();

    return { auctionId: 1n, startingBid, minIncrement, duration };
  }

  it("creates an auction with seller-defined terms", async function () {
    const { seller, auctionHouse } = await deployFixture();
    const { startingBid, minIncrement } = await createAuction(auctionHouse, seller);

    const auction = await auctionHouse.getAuction(1);

    expect(auction.seller).to.equal(seller.address);
    expect(auction.title).to.equal("Laptop Auction");
    expect(auction.startingBid).to.equal(startingBid);
    expect(auction.minIncrement).to.equal(minIncrement);
    expect(auction.status).to.equal(0);
  });

  it("requires ERC-20 approval before bidding", async function () {
    const { seller, bidderOne, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    await expect(
      auctionHouse.connect(bidderOne).placeBid(1, ethers.parseUnits("100", 18))
    ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
  });

  it("accepts a valid bid and escrows the bid tokens", async function () {
    const { seller, bidderOne, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    const amount = ethers.parseUnits("100", 18);
    await token.connect(bidderOne).approve(await auctionHouse.getAddress(), amount);
    await expect(auctionHouse.connect(bidderOne).placeBid(1, amount))
      .to.emit(auctionHouse, "BidPlaced")
      .withArgs(1, bidderOne.address, amount);

    const auction = await auctionHouse.getAuction(1);
    expect(auction.highestBidder).to.equal(bidderOne.address);
    expect(auction.highestBid).to.equal(amount);
    expect(await token.balanceOf(await auctionHouse.getAddress())).to.equal(amount);
  });

  it("refunds the previous highest bidder when outbid", async function () {
    const { seller, bidderOne, bidderTwo, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    const firstBid = ethers.parseUnits("100", 18);
    const secondBid = ethers.parseUnits("125", 18);
    const bidderOneStart = await token.balanceOf(bidderOne.address);

    await token.connect(bidderOne).approve(await auctionHouse.getAddress(), firstBid);
    await auctionHouse.connect(bidderOne).placeBid(1, firstBid);

    await token.connect(bidderTwo).approve(await auctionHouse.getAddress(), secondBid);
    await expect(auctionHouse.connect(bidderTwo).placeBid(1, secondBid))
      .to.emit(auctionHouse, "PreviousBidRefunded")
      .withArgs(1, bidderOne.address, firstBid);

    expect(await token.balanceOf(bidderOne.address)).to.equal(bidderOneStart);
    expect(await token.balanceOf(await auctionHouse.getAddress())).to.equal(secondBid);
  });

  it("prevents the seller from bidding on their own auction", async function () {
    const { seller, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    const amount = ethers.parseUnits("100", 18);
    await token.transfer(seller.address, amount);
    await token.connect(seller).approve(await auctionHouse.getAddress(), amount);

    await expect(auctionHouse.connect(seller).placeBid(1, amount))
      .to.be.revertedWithCustomError(auctionHouse, "SellerCannotBid");
  });

  it("allows cancellation only before any bid exists", async function () {
    const { seller, bidderOne, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    const amount = ethers.parseUnits("100", 18);
    await token.connect(bidderOne).approve(await auctionHouse.getAddress(), amount);
    await auctionHouse.connect(bidderOne).placeBid(1, amount);

    await expect(auctionHouse.connect(seller).cancelAuction(1))
      .to.be.revertedWithCustomError(auctionHouse, "ExistingBid");
  });

  it("finalizes after the end time and pays the seller", async function () {
    const { seller, bidderOne, token, auctionHouse } = await deployFixture();
    await createAuction(auctionHouse, seller);

    const amount = ethers.parseUnits("100", 18);
    await token.connect(bidderOne).approve(await auctionHouse.getAddress(), amount);
    await auctionHouse.connect(bidderOne).placeBid(1, amount);

    const sellerStart = await token.balanceOf(seller.address);
    await time.increase(3601);

    await expect(auctionHouse.finalizeAuction(1))
      .to.emit(auctionHouse, "AuctionFinalized")
      .withArgs(1, bidderOne.address, amount);

    expect(await token.balanceOf(seller.address)).to.equal(sellerStart + amount);
    expect((await auctionHouse.getAuction(1)).status).to.equal(2);
  });
});

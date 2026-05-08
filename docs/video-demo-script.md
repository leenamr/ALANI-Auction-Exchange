# Video Demonstration Script

Target length: 10-20 minutes.

## 1. Project Introduction

State that the project is an ERC-20 based decentralized auction platform deployed on Sepolia. Mention that bids use the `ALANI` token.

## 2. Architecture Walkthrough

Show:

- `AuctionToken.sol`
- `TokenAuctionHouse.sol`
- `PSUT/index.html`
- `PSUT/app.js`
- `scripts/deploy.js`
- Test file

Explain why two contracts are used: one for the ERC-20 token and one for auction logic.

## 3. Smart Contract Explanation

Explain `AuctionToken`:

- ERC-20 metadata.
- Balances and allowances.
- `transfer`, `approve`, and `transferFrom`.
- Owner minting.
- Sepolia demo faucet.

Explain `TokenAuctionHouse`:

- Auction struct.
- Auction statuses.
- `createAuction`.
- `placeBid`.
- Refund of previous highest bidder.
- `cancelAuction`.
- `finalizeAuction`.
- Events.
- Reentrancy guard.

## 4. Tests

Run:

```bash
npm test
```

Explain each passing test and connect it to the grading rubric.

## 5. Deployment and Verification

Show:

- `.env` variable names without revealing secrets.
- Deployment command.
- Deployed token address.
- Deployed auction contract address.
- Sepolia Etherscan verification page.

## 6. Front-End Demo

Show:

1. Connect MetaMask on Sepolia.
2. Claim test `ALANI`.
3. Create an auction.
4. Load the auction by ID.
5. Approve bid amount.
6. Place a bid.
7. Use a second account to outbid.
8. Show first bidder refunded.
9. Finalize after auction end.
10. Show seller receives winning bid tokens.

## 7. Security Discussion

Mention:

- ERC-20 approvals are required.
- Contract checks token transfer success.
- Seller cannot bid.
- Auction cannot be cancelled after bids.
- Bids are blocked after end time.
- Reentrancy guard protects bid and finalize flows.
- Limitation: physical/off-chain item delivery still needs trust or a dispute process.

## 8. Closing

Summarize how the project satisfies the handout:

- Solidity smart contracts.
- Sepolia deployment.
- Verified source code.
- ERC-20 token usage.
- Front-end interaction.
- Events and transaction handling.
- Security analysis.

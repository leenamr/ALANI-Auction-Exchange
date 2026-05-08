# Research Paper Outline

Use this as the IEEE-format paper structure required by the handout. The final paper should be 6-7 pages and mostly written in the students' own words.

## 1. Abstract

Summarize the auction DApp, the ERC-20 bidding token, Sepolia deployment, front-end integration, and security goals.

## 2. Introduction

Explain why auctions benefit from blockchain properties such as transparency, non-repudiation, open participation, and tamper-resistant records.

## 3. Background and Related Work

Cover Ethereum, smart contracts, ERC-20 tokens, decentralized applications, wallet-based authentication, and existing auction mechanisms.

## 4. System Design and Architecture

Describe the two-contract architecture, the front end, MetaMask, Sepolia, and the user flow from auction creation to finalization.

## 5. Smart Contract Design and Implementation

Explain:

- `AuctionToken` as the ERC-20 token.
- `TokenAuctionHouse` as the auction controller.
- Auction creation.
- ERC-20 approval and bid escrow.
- Automatic refund on outbid.
- Cancellation and finalization rules.
- Events used by the front end.

## 6. Front-End Integration

Explain the Ethers.js integration:

- Wallet connection.
- Contract instances from ABI and address.
- Reading auction state.
- Sending approval, bid, create, cancel, and finalize transactions.
- Handling transaction logs and errors.

## 7. Security Analysis and Threat Model

Discuss:

- Reentrancy risk and guard.
- Seller self-bidding prevention.
- Bidding after deadline prevention.
- Cancellation after bids prevention.
- Token approval risk.
- Front-end phishing and wrong-network risk.
- Off-chain item delivery trust limitation.

## 8. Testing and Evaluation

Include unit tests:

- Auction creation.
- Approval requirement.
- Valid bidding.
- Outbid refund.
- Seller cannot bid.
- Cancellation blocked after bids.
- Finalization transfers tokens to seller.

Also include Sepolia manual testing with transaction hashes and screenshots.

## 9. Results and Discussion

Summarize observed behavior, gas usage if available, contract addresses, verified source code links, and limitations.

## 10. Conclusion and Future Work

Conclude that the DApp demonstrates a working ERC-20 auction system. Future work can include NFT escrow, dispute resolution, auction search, indexed event history, sealed-bid auctions, and DAO governance.

## 11. References

Include official sources such as Solidity documentation, Ethereum documentation, ERC-20 standard references, Hardhat documentation, Ethers.js documentation, and Sepolia/Etherscan documentation.

# Alani Auction Exchange

Alani Auction Exchange is a decentralized auction DApp deployed on the Ethereum Sepolia test network. It allows sellers to create English-style auctions and bidders to compete using **ALANI**, a custom ERC-20 token created for the project.

The system reduces reliance on a central auction operator by enforcing auction rules through smart contracts. Auction creation, bidding, refunds, cancellation, and finalization are handled on-chain, while the browser front end provides a user-friendly interface through MetaMask.

**Live Front End:**  
https://alani-auction-exchange.vercel.app/

---

## Project Overview

Traditional auction platforms store bids, select winners, and manage settlement through centralized systems. In contrast, Alani Auction Exchange uses smart contracts to make the auction process more transparent and auditable.

The project consists of three main components:

1. **AuctionToken** — an ERC-20 token contract for the ALANI bidding currency.
2. **TokenAuctionHouse** — the smart contract that manages auctions, bids, refunds, cancellation, and finalization.
3. **Front End** — a Vercel-hosted browser interface connected to Sepolia through MetaMask and Ethers.js.

---

## System Architecture

```text
User
 │
 ▼
Browser Front End
 │
 ▼
MetaMask Wallet
 │
 ▼
Ethereum Sepolia Test Network
 │
 ├── AuctionToken
 │     └── ALANI ERC-20 bidding token
 │
 └── TokenAuctionHouse
       └── Auction creation, bidding, escrow, refunds, and settlement
```

The browser does not store private keys. It only requests wallet access and asks MetaMask to sign transactions. MetaMask then submits the signed transactions to Sepolia.

---

## Smart Contracts

### AuctionToken

`AuctionToken` implements the ALANI ERC-20 style token used for bidding. It includes:

- Token balances
- Transfers
- Allowances
- `approve`
- `transferFrom`
- Owner minting
- Testnet faucet for demo tokens

The faucet allows each wallet to claim ALANI tokens for testing, making the DApp easier to demonstrate without manually distributing tokens.

### TokenAuctionHouse

`TokenAuctionHouse` manages the auction lifecycle. It supports:

- Creating auctions
- Loading auction details
- Calculating the required next bid
- Placing bids using ALANI
- Refunding the previous highest bidder
- Cancelling auctions before any bid is placed
- Finalizing auctions after the deadline

Main events include:

- `AuctionCreated`
- `BidPlaced`
- `PreviousBidRefunded`
- `AuctionCancelled`
- `AuctionFinalized`

---

## Deployed Sepolia Contracts

| Contract | Address | Etherscan |
|---|---|---|
| AuctionToken | `0x2f125Ff3a92E3418C03F79D07a054A5d8C781752` | [View](https://sepolia.etherscan.io/address/0x2f125Ff3a92E3418C03F79D07a054A5d8C781752) |
| TokenAuctionHouse | `0x8CD4B6e1b1b4acC15f8516719dd8a90415809D56` | [View](https://sepolia.etherscan.io/address/0x8CD4B6e1b1b4acC15f8516719dd8a90415809D56) |

Initial ALANI supply: **1,000,000 ALANI**  
Token decimals: **18**

---

## User Workflow


1. Open the live front end.
2. Connect MetaMask.
3. Switch MetaMask to Sepolia.
4. Claim ALANI test tokens.
5. Create or load an auction.
6. Approve ALANI spending.
7. Place a bid.
8. Confirm the transaction in MetaMask.
9. View the updated auction state.


Bidding requires two blockchain transactions:

1. **Approve ALANI spending** on the token contract.
2. **Place the bid** on the auction-house contract.

This is required because ERC-20 contracts use an allowance model. The auction house cannot transfer a bidder’s ALANI unless the bidder first approves the required amount.

---

## Security Features

The smart contracts include several protections:

- Reentrancy protection on bidding and finalization
- Seller self-bidding prevention
- Deadline checks to block late bids
- Cancellation blocked after a bid exists
- ERC-20 transfer return values checked
- Custom errors for clearer failure handling
- Front-end network checks for Sepolia

---

## Known Limitations

This project is a classroom DApp prototype. The main limitations are:

- The contract cannot enforce delivery of physical or off-chain items.
- The faucet is suitable for testing, not production.
- Auctions are loaded by ID instead of through a searchable marketplace.
- A production version would need event indexing, monitoring, and broader stress testing.

---


## Team

| Name | Email |
|---|---|
| Ismael Alhindi | ism20220379@std.psut.edu.jo |
| Leen Amro | lee20210258@std.psut.edu.jo |
| Saleh Alsaheb | sal20220045@std.psut.edu.jo |
| Dr. Haitham Alani | h.ani@psut.edu.jo |

Princess Sumaya University for Technology  
Computer Engineering Department  
Blockchain and Decentralized Applications Project

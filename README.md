# Alani Auction Exchange

A decentralized auction platform built on the Ethereum **Sepolia** testnet. Sellers list items, bidders compete in English-style auctions, and all bids are paid in **ALANI**, a custom ERC-20 token created specifically for the system. There is no central operator — auction rules are enforced by smart contracts that anyone can audit on-chain.

**Live front end:** https://alani-auction-exchange.vercel.app

---

## What this project is

Most online auction sites ask you to trust the operator. The operator stores the bids, picks the winner, and holds the money. You have to believe they won't tamper with anything.

Alani Auction Exchange replaces that trusted operator with a smart contract. Once the contract is deployed, the rules can't change. Anyone can inspect the bids, the highest bidder, the deadline, and the final settlement. The system is built on three pieces:

1. **A custom ERC-20 token (ALANI)** — the bidding currency.
2. **An auction-house contract** — runs the auctions, holds bids in escrow, and pays out winners.
3. **A web front end** — a browser dashboard that talks to the contracts via MetaMask.

---

## Architecture at a glance

```
+----------------+        +-------------------+        +----------------------+
|   Browser UI   | <----> |     MetaMask      | <----> |   Sepolia network    |
| (Vercel-hosted)|        | (signs as user)   |        |                      |
+----------------+        +-------------------+        +----------+-----------+
        |                                                          |
        |  Ethers.js calls                                         |
        +----------------------------------------------------------+
                                                                   |
                                                  +----------------+----------------+
                                                  |                                 |
                                            AuctionToken                   TokenAuctionHouse
                                            (ERC-20)                       (auction logic)
```

The browser never holds private keys. It builds transactions and asks MetaMask to sign them. MetaMask broadcasts to Sepolia, and Sepolia executes the contract code.

---

## The two smart contracts

### `AuctionToken` — the ALANI ERC-20 token

A compact ERC-20 implementation with the standard surface (`balanceOf`, `transfer`, `approve`, `transferFrom`, `allowance`) plus two additions:

- **Owner mint** — the deployer can mint new ALANI for testing.
- **Faucet** — any wallet can claim a fixed amount of ALANI once per day, so classmates can try the system without needing a hand-out.

### `TokenAuctionHouse` — the auction logic

Stores an `Auction` struct per listing (seller, title, description, starting bid, minimum increment, end time, highest bidder, highest bid, status). Exposes:

- `createAuction(...)` — opens a new auction. Validates non-empty title, minimum 5-minute duration, nonzero increment.
- `placeBid(auctionId, amount)` — escrows ALANI from the bidder, refunds the previous highest bidder, updates the leader.
- `cancelAuction(auctionId)` — seller-only, only allowed if no bid yet.
- `finalizeAuction(auctionId)` — callable after the deadline. Pays the seller and locks the auction.

Reads (free, no gas): `getAuction`, `getRequiredBid`, `auctionCount`.

Events emitted for every state change: `AuctionCreated`, `BidPlaced`, `PreviousBidRefunded`, `AuctionCancelled`, `AuctionFinalized`. Custom errors (`SellerCannotBid`, `BidTooLow`, `AuctionStillActive`, `ExistingBid`, `FaucetCooldownActive`) save gas and let the front end show meaningful messages.

---

## Deployed contract addresses (Sepolia)

| Contract | Address | Etherscan |
|---|---|---|
| `AuctionToken` (ALANI) | `0x2f125Ff3a92E3418C03F79D07a054A5d8C781752` | [View](https://sepolia.etherscan.io/address/0x2f125Ff3a92E3418C03F79D07a054A5d8C781752) |
| `TokenAuctionHouse` | `0x8CD4B6e1b1b4acC15f8516719dd8a90415809D56` | [View](https://sepolia.etherscan.io/address/0x8CD4B6e1b1b4acC15f8516719dd8a90415809D56) |

Initial token supply: **1,000,000 ALANI**. Token decimals: **18**.

---

## How a bid actually works

Bidding takes **two** transactions, not one. This trips up new users, but it's how every ERC-20 application works.

```
1. User clicks "Place Bid" in the UI
2. MetaMask pops up: APPROVE 100 ALANI for the auction house
3. User signs -> approval is on-chain
4. MetaMask pops up again: PLACE BID of 100 ALANI on auction #1
5. User signs -> the auction house pulls the tokens via transferFrom
6. If there was a previous highest bidder, their tokens are refunded automatically
7. UI updates: highest bid is now 100 ALANI, highest bidder is your address
```

Step 2 exists because of the ERC-20 security model: a contract is **not allowed** to move your tokens unless you've given it explicit permission first. The auction house cannot drain your wallet — it can only pull the exact amount you approved.

---

## Security rules baked into the contract

- **Reentrancy guard** (`nonReentrant`) on `placeBid` and `finalizeAuction`.
- **Sellers cannot bid on their own auctions** (`msg.sender != seller`).
- **No bids after the deadline** (`block.timestamp <= endTime`).
- **No cancellation once a bid exists** (`highestBidder == address(0)`).
- **Return values of ERC-20 transfers are checked** — silent failures rejected.
- **Front-end network detection** — warns if MetaMask is on the wrong chain.

Known limitations (called out honestly in the paper):
- The contract can't enforce off-chain item delivery. If you auction a physical object and don't ship it, the contract has no way to know.
- The faucet is fine for classroom demos but would need to come out for any real deployment.
- Auctions are loaded by ID — there's no marketplace browse view yet. A production version would need event indexing (e.g., The Graph).

---

## Repository layout

```
.
├── contracts/             Solidity source for AuctionToken and TokenAuctionHouse
├── test/                  Hardhat unit tests (7 tests, all passing)
├── frontend/              Static site (HTML, CSS, JS, Ethers.js)
│   ├── index.html
│   ├── app.js
│   └── config.js          contract addresses and ABIs
├── README.md              this file
└── paper/                 IEEE LaTeX writeup (main.tex, references.bib, figures/)
```

(Adjust the paths above to match your actual repo structure if it differs.)

---

## Running locally

### Prerequisites

- Node.js 18+
- A MetaMask browser extension
- A Sepolia wallet with some test ETH (free from any Sepolia faucet)

### Smart contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test          # runs the 7 unit tests
```

To deploy your own copy of the contracts to Sepolia, use Remix IDE with MetaMask as the injected provider. Deploy `AuctionToken` first, copy its address, then deploy `TokenAuctionHouse` passing that address to the constructor.

### Front end

```bash
cd frontend
# put your deployed contract addresses in config.js
# then open index.html locally, or push to Vercel
```

If you redeploy contracts, update `config.js` with the new addresses **and** redeploy the front end. Otherwise the website will keep talking to the old contracts.

---

## Demo flow (what to show in the video)

1. **Open the live site**, connect MetaMask on Sepolia, show the ALANI balance.
2. **Claim from the faucet** — first transaction, easy way to introduce gas and signing.
3. **Switch accounts in MetaMask** to a "seller" wallet, **create an auction**.
4. **Switch back** to the bidder wallet, **load the auction by ID**.
5. **Approve** the auction house for the bid amount (transaction 1).
6. **Place the bid** (transaction 2). Show the UI update.
7. **Open Etherscan** on the auction house contract and point out the new transactions appearing in real time.
8. **Try to bid as the seller** to demonstrate the `SellerCannotBid` rule firing.

Have screenshots from the paper ready as a backup if Sepolia is slow.

---

## Team

| Name | Role |
|---|---|
| Ismael Alhindi | Developer |
| Leen Amro | Developer |
| Saleh Alsaheb | Developer |
| Dr. Haitham Alani | Supervisor |

Princess Sumaya University for Technology (PSUT) — Computer Engineering Department — Blockchain and Decentralized Applications Project.

---

## License

Add a license file (MIT is a common choice for student projects) before publishing the repo publicly.

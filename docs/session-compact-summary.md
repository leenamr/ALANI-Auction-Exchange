# Alani Auction Exchange - Compact Session Summary

This file is a compact memory of the full project session so future work can continue without keeping the whole chat context.

## Project Goal

Build a blockchain DApp project for an **auction platform** called **Alani Auction Exchange**.

The project uses:

- A custom ERC-20 token named `Alani`
- Token symbol `ALANI`
- A smart contract auction house
- A frontend website for wallet connection, token actions, and auction interaction
- Sepolia testnet deployment
- Documentation and IEEE-style paper support

The user wants maximum compliance with the original project handout/PDF and wants step-by-step explanations for screenshots and documentation.

## Main Website

Current working public website:

```text
https://alani-auction-exchange.netlify.app
```

Local website target:

```text
http://127.0.0.1:5173/PSUT/index.html
```

If the local server is not running, restart it from:

```powershell
Start-Process -WindowStyle Hidden -FilePath 'C:\Users\Ismael\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -ArgumentList '-m','http.server','5173','--bind','127.0.0.1' -WorkingDirectory 'C:\Users\Ismael\OneDrive\Documents\Codex'
```

Vercel was attempted, but the `*.vercel.app` subdomain was timing out/resetting from the local network, so Netlify became the working public deployment.

## Current Important Addresses

User Sepolia wallet:

```text
0x5a5669Bd30e9128573A1d21015cE9DE529BdBd38
```

Current contract addresses configured in `PSUT/config.js`:

```text
AuctionToken:       0x2f125Ff3a92E3418C03F79D07a054A5d8C781752
TokenAuctionHouse: 0x8CD4B6e1b1b4acC15f8516719dd8a90415809D56
```

These are the Remix-deployed contracts currently used by the website.

Earlier Hardhat-deployed verified contracts, not the current website config:

```text
AuctionToken:       0x8f13c388f387cD42A5fB6C1186d52C931a025afb
TokenAuctionHouse: 0x535bd59Cb1272Fe416ec38493334b580A807C62d
```

## Secret Handling

The user pasted an Etherscan API key during the session. It was added to `.env`.

Important:

- Do not print `.env`.
- Do not reveal the API key.
- Do not reveal any private key.
- If deployment or verification needs secrets, use `.env` locally without displaying it.

## Smart Contracts

Main contracts folder:

```text
contracts/
```

### `contracts/AuctionToken.sol`

Current token contract uses OpenZeppelin.

Core design:

- Inherits `ERC20`
- Inherits `Ownable`
- Token name: `Alani`
- Token symbol: `ALANI`
- Deployer becomes owner through `Ownable(msg.sender)`
- Constructor mints the initial supply to the deployer
- Owner can mint more tokens with `mint`
- Users can claim free tokens from the faucet with `claimFromFaucet`
- Faucet has a one-day cooldown per address
- Owner can update `faucetAmount`

Important OpenZeppelin imports:

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
```

Important functions:

```text
constructor(uint256 initialSupply)
mint(address to, uint256 amount)
claimFromFaucet()
setFaucetAmount(uint256 newAmount)
```

OpenZeppelin provides the standard ERC-20 behavior:

```text
transfer
approve
transferFrom
balanceOf
allowance
totalSupply
name
symbol
decimals
```

### `contracts/TokenAuctionHouse.sol`

The auction contract lets users create auctions and bid using ALANI tokens.

Core design:

- Stores the ALANI token address as `bidToken`
- Uses an `Auction` struct for auction data
- Uses `AuctionStatus` enum with `Active`, `Cancelled`, and `Finalized`
- Uses `auctionCount` to assign auction IDs
- Uses `mapping(uint256 => Auction)` to store auctions
- Has a manual `nonReentrant` guard using a `locked` boolean

Important functions:

```text
createAuction(title, description, startingBid, minIncrement, duration)
placeBid(auctionId, amount)
cancelAuction(auctionId)
finalizeAuction(auctionId)
getAuction(auctionId)
getRequiredBid(auctionId)
isActive(auctionId)
```

Important auction flow:

1. Seller creates an auction.
2. Bidder approves the auction house to spend ALANI.
3. Bidder places a bid.
4. If a higher bid arrives, the previous highest bidder is refunded.
5. After the auction ends, anyone can finalize it.
6. The highest bid is transferred to the seller.

Security features:

- Cannot create auction with invalid duration or zero starting bid.
- Seller cannot bid on their own auction.
- Bid must meet required price.
- Previous highest bidder is refunded.
- Auction cannot be cancelled after bids exist.
- Reentrancy is blocked around token transfers.

## Remix File

There is a Remix-friendly combined contract file:

```text
remix/AlaniAuctionExchange.sol
```

It contains the OpenZeppelin token and auction house in one file for easier Remix usage.

There is a separate Hardhat config for compiling the Remix source:

```text
remix.hardhat.config.js
```

It compiles from:

```text
./remix
```

and outputs to:

```text
artifacts-remix/
cache-remix/
```

## Frontend

Main frontend folder:

```text
PSUT/
```

Important frontend files:

```text
PSUT/index.html
PSUT/styles.css
PSUT/app.js
PSUT/config.js
PSUT/assets/alani-logo.svg
PSUT/assets/psut-logo.png
```

Frontend changes already done:

- Added dark mode and light mode switch.
- Made the UI more futuristic.
- Added PSUT logo.
- Added custom Alani logo.
- Changed name to `Alani Auction Exchange`.
- Added modal/toast style interactions.
- Improved deployed contract config.
- Added Sepolia chain checks.
- Fixed `getAuction` ABI return type.
- Added custom error decoding for auction and OpenZeppelin ERC-20 errors.

The frontend expects MetaMask and Sepolia testnet.

## Deployment Notes

Netlify deploy command, if needed from inside `PSUT/`:

```powershell
$env:Path='C:\Program Files\nodejs;C:\Users\Ismael\AppData\Roaming\npm;' + $env:Path
& 'C:\Users\Ismael\AppData\Roaming\npm\netlify.cmd' deploy --prod --dir .
```

Vercel CLI and Node.js were discussed/installed, but Netlify is the currently reliable public link.

## Testing

The smart contract tests passed after the OpenZeppelin refactor.

Command:

```powershell
npm test
```

Latest known result:

```text
7 passing
```

Important updated test behavior:

- OpenZeppelin allowance errors now use `ERC20InsufficientAllowance`.

## Documentation Files

Important docs folder:

```text
docs/
```

Existing documentation files:

```text
docs/architecture.md
docs/auction-house-code-explained.md
docs/compact-code-explanation.md
docs/remix-deployment-guide.md
docs/research-paper-outline.md
docs/security-analysis.md
docs/token-code-explained.md
docs/video-demo-script.md
docs/walkthrough-and-screenshot-checklist.md
```

The user asked for detailed explanations of:

- The OpenZeppelin token code
- The auction house code

Those were saved in:

```text
docs/token-code-explained.md
docs/auction-house-code-explained.md
```

A shorter combined code explanation exists in:

```text
docs/compact-code-explanation.md
```

## IEEE Paper

Paper file:

```text
Paper/Alani_Auction_Exchange_IEEE_Paper.docx
```

The user said they can export it to PDF manually.

Note:

- The paper was written before the OpenZeppelin refactor.
- If the paper is finalized later, update the token section to mention OpenZeppelin `ERC20` and `Ownable`.

Photos/screenshots folder:

```text
Photos/
```

It includes screenshots and a contact sheet:

```text
Photos/contact-sheet.png
```

## Common User Questions Already Answered

### Is Etherscan the same as MetaMask?

No.

- MetaMask is the wallet.
- Etherscan is the blockchain explorer.
- MetaMask signs and sends transactions.
- Etherscan lets users view transactions, contracts, balances, and verification.

### What does Ownable mean?

`Ownable` means the contract has an owner/admin address.

It gives:

```text
owner()
onlyOwner
transferOwnership()
renounceOwnership()
```

In this project, `Ownable` protects admin-only token functions like minting and faucet configuration.

### Why does the project need Ownable?

It prevents random users from minting unlimited ALANI tokens or changing faucet settings.

Only the owner can:

- Mint more tokens
- Change the faucet amount
- Transfer ownership if needed

This protects the token economy and makes the project easier to explain as a controlled class DApp.

## Known Troubleshooting

### MetaMask says not enough ETH

Check that MetaMask is on **Sepolia**, not Ethereum mainnet.

If MetaMask shows `Network: Ethereum`, switch to Sepolia before sending.

### Frontend says `could not decode result data`

Common causes:

- Wrong contract address in `PSUT/config.js`
- Wrong ABI return type
- Connected to the wrong network
- Contract not deployed at that address on Sepolia

The `getAuction` ABI was fixed to return a tuple.

### Transaction reverted with unknown custom error

Likely one of the auction validations failed.

Common causes:

- Bid amount too low
- Auction ended
- Seller tried to bid on own auction
- User did not approve enough ALANI
- Auction ID does not exist
- Auction has been cancelled/finalized

### Need to approve before bidding

Before bidding with ALANI, the user must approve the auction house to spend their tokens.

Flow:

```text
claim/get ALANI -> approve auction house -> place bid
```

## Best Explanation of Whole Project

Alani Auction Exchange is a decentralized auction platform on Sepolia. It has two main smart contracts. The first contract creates the ALANI ERC-20 token using OpenZeppelin, which gives the project a standard and secure token implementation. The second contract is the auction house, where users create auctions and place bids using ALANI. The frontend connects to MetaMask, checks Sepolia, reads contract data, and sends transactions for claiming tokens, approving the auction house, creating auctions, bidding, cancelling, and finalizing.

The token contract handles the currency of the platform. The auction house contract handles the auction rules. The frontend makes the blockchain functions usable through a website. MetaMask is used to sign transactions, and Etherscan can be used to inspect deployed contracts and transaction history.

## Best Short Professor Explanation

This project is a decentralized auction DApp called Alani Auction Exchange. It uses an OpenZeppelin ERC-20 token named ALANI as the bidding currency. Users connect with MetaMask on Sepolia, claim or receive ALANI tokens, approve the auction contract, and then create or bid on auctions. The auction contract stores auction data, validates bids, refunds previous highest bidders, prevents unsafe actions such as seller self-bidding, and finalizes auctions by transferring the winning bid to the seller. The frontend provides a user-friendly interface for interacting with these smart contracts.

## Suggested Next Steps

1. If using the OpenZeppelin contracts for final submission, redeploy both contracts to Sepolia.
2. Update `PSUT/config.js` with the new deployed OpenZeppelin contract addresses.
3. Redeploy the frontend to Netlify.
4. Update the IEEE paper token section to mention OpenZeppelin.
5. Take screenshots for:
   - Website home/interface
   - MetaMask wallet connection
   - Sepolia selected
   - Token claim or balance
   - Token approval
   - Auction creation
   - Bid placement
   - Auction loading
   - Finalization
   - Etherscan contract/transaction pages


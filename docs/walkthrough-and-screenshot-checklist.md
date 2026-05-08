# Walkthrough and Screenshot Checklist

Use this file while preparing documentation and the video demonstration. Capture screenshots in the same order so the project story feels clear.

## 1. Assignment Requirements

Screenshot:

- `DApp_Project_Instructions.docx`, especially the project overview, technical requirements, ERC-20 note, submission requirements, and grading rubric.

Explain:

- We chose the auction platform option.
- The project must include Solidity smart contracts, Sepolia deployment, a web front end, blockchain interaction, events, transaction handling, and ERC-20 token usage.

## 2. Project Folder Structure

Screenshot:

- The root project folder showing `contracts`, `PSUT`, `frontend`, `scripts`, `test`, `docs`, `README.md`, `package.json`, and `hardhat.config.js`.

Explain:

- `contracts/` contains Solidity code.
- `PSUT/` contains the browser DApp used for screenshots and demos.
- `scripts/` contains deployment automation.
- `test/` contains smart contract tests.
- `docs/` contains architecture, security, paper, and video support material.

## 3. ERC-20 Token Contract

Screenshot:

- `contracts/AuctionToken.sol`, especially `name = "Alani"` and `symbol = "ALANI"`.
- `transfer`, `approve`, `transferFrom`, and `claimFromFaucet`.

Explain:

- `Alani` is the project ERC-20 token.
- Bidders use `ALANI` to bid in auctions.
- `approve` lets the auction contract spend a bidder's token amount.
- `transferFrom` moves the approved bid amount into auction escrow.
- The faucet is only for Sepolia/testing convenience.

## 4. Auction Contract

Screenshot:

- `contracts/TokenAuctionHouse.sol`, especially the `Auction` struct and events.
- `createAuction`, `placeBid`, `cancelAuction`, and `finalizeAuction`.

Explain:

- The seller creates an auction with title, description, starting bid, minimum increment, and duration.
- `placeBid` checks that the auction is active, the bid is high enough, and the seller is not bidding on their own auction.
- The highest bid is escrowed inside the contract.
- If a new bidder outbids the previous bidder, the previous bid is refunded.
- `finalizeAuction` transfers the winning bid to the seller after the deadline.

## 5. Security Design

Screenshot:

- `docs/security-analysis.md`.

Explain:

- Reentrancy is guarded.
- Seller self-bidding is blocked.
- Late bids are blocked.
- Cancellation after bids is blocked.
- ERC-20 transfer results are checked.
- Off-chain item delivery is listed as a limitation.

## 6. Tests

Screenshot:

- `test/tokenAuctionHouse.test.js`.
- Terminal output after running `npm test`.

Explain:

- The tests cover auction creation, ERC-20 approval, valid bidding, outbid refunds, seller restrictions, cancellation rules, and finalization.

Command:

```bash
npm install
npm test
```

## 7. Deployment Setup

Screenshot:

- `.env.example`.
- `scripts/deploy.js`.
- `hardhat.config.js`.

Explain:

- `.env` stores Sepolia RPC URL, deployer private key, and Etherscan API key.
- The deployment script deploys `AuctionToken` first, then deploys `TokenAuctionHouse` with the token address.
- The script prints verification commands and front-end addresses.

Commands:

```bash
npm run compile
npm run deploy:sepolia
```

## 8. Etherscan Verification

Screenshot:

- Sepolia Etherscan verified contract page for `AuctionToken`.
- Sepolia Etherscan verified contract page for `TokenAuctionHouse`.

Explain:

- Verification proves the deployed bytecode matches the Solidity source.
- This satisfies the handout requirement that the smart code is verified on Sepolia.

Commands:

```bash
npx hardhat verify --network sepolia TOKEN_ADDRESS INITIAL_SUPPLY
npx hardhat verify --network sepolia AUCTION_HOUSE_ADDRESS TOKEN_ADDRESS
```

## 9. Front-End Configuration

Screenshot:

- `PSUT/config.js` after adding deployed addresses.

Explain:

- The front end needs deployed contract addresses so Ethers.js knows which Sepolia contracts to call.

Example:

```js
window.AUCTION_TOKEN_ADDRESS = "DEPLOYED_TOKEN_ADDRESS";
window.AUCTION_HOUSE_ADDRESS = "DEPLOYED_AUCTION_HOUSE_ADDRESS";
```

## 10. Front-End UI

Screenshot:

- `http://127.0.0.1:5173/PSUT/index.html`.
- Wallet connected.
- ALANI balance visible.
- Create Auction form.
- Auction Browser panel.
- Transaction Log.

Explain:

- The UI connects to MetaMask.
- Users can claim test `ALANI`, create auctions, approve bid amounts, place bids, cancel auctions before bids, and finalize ended auctions.

## 11. Live DApp Transaction Flow

Screenshots:

- MetaMask wallet connection.
- Claim test tokens transaction.
- Create auction transaction.
- Loaded auction details.
- Approve bid transaction.
- Place bid transaction.
- Second account outbid transaction.
- Finalize auction transaction.
- Seller token balance after finalization.

Explain:

- Every important user action is a blockchain transaction.
- Read-only actions, such as loading auction details, do not cost gas.
- ERC-20 approval and auction bidding are separate transactions.

## 12. Final Paper and Video

Screenshot:

- `docs/research-paper-outline.md`.
- `docs/video-demo-script.md`.

Explain:

- The paper follows the required IEEE sections from the handout.
- The video script follows a logical 10-20 minute demonstration order.

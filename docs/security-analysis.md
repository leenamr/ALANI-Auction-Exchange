# Security Analysis and Threat Model

## Assets

| Asset | Why It Matters |
| --- | --- |
| Bidder ERC-20 tokens | Users deposit tokens when bidding. |
| Seller payment | The seller must receive the winning bid after finalization. |
| Auction state | Highest bidder, bid amount, status, and deadline must remain correct. |
| User wallet | Transactions must be signed knowingly by the user. |

## Attacker Capabilities

- A malicious bidder can attempt low bids, late bids, repeated outbids, or reentrant token callbacks.
- A malicious seller can try to cancel after a bid or bid on their own auction.
- A confused user can approve too many tokens or interact with the wrong contract address.
- A front-end attacker can try to trick users into signing unexpected transactions if they host a modified UI.

## Controls

| Threat | Control |
| --- | --- |
| Reentrancy during bid or finalize | `nonReentrant` modifier. |
| Seller self-bidding | `SellerCannotBid` check. |
| Low bid | `BidTooLow` with required bid calculation. |
| Late bid | `AuctionEnded` check. |
| Early finalization | `AuctionStillActive` check. |
| Seller cancels after a bid | `ExistingBid` check. |
| Silent ERC-20 transfer failure | Return value checked and reverted. |
| Accidental spending | User must explicitly call `approve`. |

## Residual Risks

- The item being auctioned is represented by text metadata, so delivery is off-chain.
- The faucet is for testnet demonstration only and should not exist in a production token.
- The front end depends on the user verifying contract addresses.
- Immediate refund works for standard ERC-20 tokens, but a malicious token could create unusual behavior; this project uses its own known ERC-20 token.

## Future Improvements

- Use ERC-721 escrow for digital assets.
- Add indexed event history with The Graph or a backend indexer.
- Add dispute resolution for physical item delivery.
- Add role-based platform moderation.
- Add sealed-bid or commit-reveal auction mode.

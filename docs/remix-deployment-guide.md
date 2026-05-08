# Remix Deployment Guide

Use this guide when you want to compile and deploy the Alani Auction Exchange smart contracts manually from Remix.

## Files

Use this Remix-ready file:

```text
remix/AlaniAuctionExchange.sol
```

It contains both contracts:

- `AuctionToken`
- `TokenAuctionHouse`

The token uses OpenZeppelin:

- `@openzeppelin/contracts/token/ERC20/ERC20.sol`
- `@openzeppelin/contracts/access/Ownable.sol`

## Before You Start

You need:

- MetaMask installed.
- MetaMask connected to Sepolia.
- SepoliaETH in the deployer wallet.
- The deployer account selected in MetaMask.

Do not paste your private key into Remix.

## Step 1: Open Remix

Open:

```text
https://remix.ethereum.org
```

Create a new file named:

```text
AlaniAuctionExchange.sol
```

Copy the full contents of:

```text
remix/AlaniAuctionExchange.sol
```

into that Remix file.

If Remix asks to resolve dependencies, allow it to load the OpenZeppelin imports. The imported files should appear under the Remix dependency/import area automatically.

## Step 2: Compile

Open the Solidity Compiler tab.

Use:

```text
Compiler: 0.8.28
```

OpenZeppelin Contracts 5.x requires Solidity `^0.8.20`, and this project is compiled with `0.8.28`.

If Remix does not show `0.8.28`, choose the closest `0.8.x` compiler that is equal to or newer than `0.8.28`.

Click:

```text
Compile AlaniAuctionExchange.sol
```

## Step 3: Deploy AuctionToken

Open the Deploy & Run Transactions tab.

Set Environment to:

```text
Injected Provider - MetaMask
```

Confirm MetaMask is on:

```text
Sepolia
```

Select contract:

```text
AuctionToken
```

Constructor input:

```text
1000000000000000000000000
```

This mints `1,000,000 ALANI`, because the token has 18 decimals.

Click Deploy and confirm in MetaMask.

After deployment, copy the deployed `AuctionToken` address.

## Step 4: Deploy TokenAuctionHouse

In the contract dropdown, select:

```text
TokenAuctionHouse
```

Constructor input:

```text
PASTE_AUCTION_TOKEN_ADDRESS_HERE
```

Click Deploy and confirm in MetaMask.

After deployment, copy the deployed `TokenAuctionHouse` address.

## Step 5: Update Front End

Put the two Remix-deployed addresses into:

```text
PSUT/config.js
```

Example:

```js
window.AUCTION_TOKEN_ADDRESS = "YOUR_REMIX_TOKEN_ADDRESS";
window.AUCTION_HOUSE_ADDRESS = "YOUR_REMIX_AUCTION_HOUSE_ADDRESS";
```

Then redeploy the front end:

```bash
cd PSUT
vercel --prod
```

## Step 6: Basic Remix Test Flow

After both contracts are deployed:

1. Open the deployed `AuctionToken`.
2. Call `name`; it should return `Alani`.
3. Call `symbol`; it should return `ALANI`.
4. Call `claimFromFaucet` from a bidder account if needed.
5. Call `approve` on `AuctionToken`.
   - `spender`: `TokenAuctionHouse` address.
   - `amount`: bid amount in wei units, for example `100000000000000000000`.
6. Open the deployed `TokenAuctionHouse`.
7. Call `createAuction`.
8. Call `placeBid`.
9. Call `getAuction` to inspect the auction state.

## Useful Values

| Human Amount | Solidity Amount |
| --- | --- |
| 1 ALANI | `1000000000000000000` |
| 10 ALANI | `10000000000000000000` |
| 100 ALANI | `100000000000000000000` |
| 1,000 ALANI | `1000000000000000000000` |
| 1,000,000 ALANI | `1000000000000000000000000` |

## Screenshot Checklist

Capture:

- Remix compiler success.
- MetaMask on Sepolia.
- `AuctionToken` deployment transaction.
- `TokenAuctionHouse` deployment transaction.
- Deployed contract addresses in Remix.
- `name` returning `Alani`.
- `symbol` returning `ALANI`.
- `createAuction` transaction.
- `approve` transaction.
- `placeBid` transaction.
- Front end using the Remix-deployed addresses.

const tokenAddress = window.AUCTION_TOKEN_ADDRESS || "";
const auctionHouseAddress = window.AUCTION_HOUSE_ADDRESS || "";

const tokenAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function claimFromFaucet()",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed tokenOwner, address indexed spender, uint256 value)",
  "error NotOwner()",
  "error ZeroAddress()",
  "error InsufficientBalance()",
  "error InsufficientAllowance()",
  "error FaucetCooldownActive()"
];

const auctionAbi = [
  "function auctionCount() view returns (uint256)",
  "function createAuction(string title,string description,uint256 startingBid,uint256 minIncrement,uint256 durationSeconds) returns (uint256)",
  "function placeBid(uint256 auctionId,uint256 amount)",
  "function cancelAuction(uint256 auctionId)",
  "function finalizeAuction(uint256 auctionId)",
  "function getAuction(uint256 auctionId) view returns (tuple(address seller,string title,string description,uint256 startingBid,uint256 minIncrement,uint256 endTime,address highestBidder,uint256 highestBid,uint8 status))",
  "function getRequiredBid(uint256 auctionId) view returns (uint256)",
  "event AuctionCreated(uint256 indexed auctionId,address indexed seller,string title,uint256 startingBid,uint256 minIncrement,uint256 endTime)",
  "event BidPlaced(uint256 indexed auctionId,address indexed bidder,uint256 amount)",
  "event AuctionFinalized(uint256 indexed auctionId,address indexed winner,uint256 winningBid)",
  "error ReentrancyDetected()",
  "error InvalidTokenAddress()",
  "error EmptyTitle()",
  "error InvalidDuration()",
  "error InvalidIncrement()",
  "error AuctionNotFound()",
  "error AuctionNotActive()",
  "error AuctionEnded()",
  "error AuctionStillActive()",
  "error SellerCannotBid()",
  "error BidTooLow(uint256 requiredBid)",
  "error OnlySeller()",
  "error ExistingBid()",
  "error TokenTransferFailed()"
];

const state = {
  provider: null,
  signer: null,
  account: null,
  token: null,
  auctionHouse: null,
  chainId: null,
  theme: "dark"
};

const $ = (id) => document.getElementById(id);

function shortAddress(address) {
  if (!address || address === ethers.ZeroAddress) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAlani(value) {
  return `${Number(ethers.formatUnits(value || 0n, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 4
  })} ALANI`;
}

function parseAlani(value) {
  return ethers.parseUnits(String(value || "0"), 18);
}

function log(message) {
  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  $("logList").prepend(item);
  showToast(message, message.startsWith("Error:") ? "error" : "info");
}

function showToast(message, type = "info") {
  const stack = $("toastStack");
  if (!stack) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`.trim();
  toast.innerHTML = `
    <span class="toast-icon"></span>
    <span>
      <strong>${type === "error" ? "Action blocked" : "Console update"}</strong>
      <span></span>
    </span>
  `;
  toast.querySelector("span span").textContent = message;
  stack.prepend(toast);
  setTimeout(() => toast.remove(), type === "error" ? 6500 : 4200);
}

function confirmAction({ title, message, details = [], confirmText = "Continue" }) {
  const modal = $("actionModal");
  if (!modal) return Promise.resolve(true);

  $("modalTitle").textContent = title;
  $("modalMessage").textContent = message;
  $("modalConfirm").lastChild.textContent = ` ${confirmText}`;

  const detailsList = $("modalDetails");
  detailsList.innerHTML = "";
  details.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const desc = document.createElement("dd");
    term.textContent = label;
    desc.textContent = value;
    row.append(term, desc);
    detailsList.append(row);
  });

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (window.lucide) window.lucide.createIcons();

  return new Promise((resolve) => {
    const close = (result) => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      $("modalConfirm").removeEventListener("click", onConfirm);
      $("modalCancel").removeEventListener("click", onCancel);
      modal.querySelector(".modal-backdrop").removeEventListener("click", onCancel);
      resolve(result);
    };
    const onConfirm = () => close(true);
    const onCancel = () => close(false);

    $("modalConfirm").addEventListener("click", onConfirm);
    $("modalCancel").addEventListener("click", onCancel);
    modal.querySelector(".modal-backdrop").addEventListener("click", onCancel);
  });
}

function applyTheme(theme) {
  state.theme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = state.theme;
  localStorage.setItem("alani-theme", state.theme);

  const toggle = $("themeToggle");
  const icon = $("themeIcon");
  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
  if (icon) {
    icon.setAttribute("data-lucide", state.theme === "dark" ? "sun" : "moon");
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function ensureConfigured() {
  if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(auctionHouseAddress)) {
    throw new Error("Contract addresses are missing. Create PSUT/config.js after deployment.");
  }
}

function ensureConnected() {
  if (!state.signer) {
    throw new Error("Connect your wallet first.");
  }
  if (state.chainId !== 11155111n) {
    throw new Error("Switch MetaMask to Sepolia, then refresh the page.");
  }
}

function explainContractError(error) {
  const data = error?.data || error?.info?.error?.data || error?.error?.data;
  const interfaces = [state.token?.interface, state.auctionHouse?.interface].filter(Boolean);

  for (const contractInterface of interfaces) {
    try {
      const parsed = contractInterface.parseError(data);
      if (!parsed) continue;

      const messages = {
        FaucetCooldownActive: "Faucet cooldown active. This wallet can claim once every 24 hours.",
        InsufficientAllowance: "Approve ALANI first, then place the bid.",
        InsufficientBalance: "This wallet does not have enough ALANI.",
        SellerCannotBid: "The auction seller cannot bid on their own auction. Switch to a second wallet account.",
        BidTooLow: `Bid is too low. Required minimum is ${formatAlani(parsed.args.requiredBid)}.`,
        AuctionStillActive: "Auction is still active. Finalize only after the end time.",
        AuctionEnded: "Auction already ended. Create or load an active auction.",
        ExistingBid: "This auction already has a bid, so it cannot be cancelled.",
        OnlySeller: "Only the seller can perform this action.",
        AuctionNotFound: "Auction ID was not found.",
        EmptyTitle: "Auction title cannot be empty.",
        InvalidDuration: "Auction duration must be at least 5 minutes.",
        InvalidIncrement: "Minimum increment must be greater than zero.",
        TokenTransferFailed: "ALANI token transfer failed."
      };

      return messages[parsed.name] || `Contract reverted: ${parsed.name}`;
    } catch {
      // Try the next contract interface.
    }
  }

  return error?.shortMessage || error?.reason || error?.message || "Unknown error";
}

async function refreshBalance() {
  if (!state.token || !state.account) return;
  const balance = await state.token.balanceOf(state.account);
  $("tokenBalance").textContent = formatAlani(balance);
}

async function connectWallet() {
  ensureConfigured();
  if (!window.ethereum) {
    throw new Error("MetaMask or another injected wallet is required.");
  }

  state.provider = new ethers.BrowserProvider(window.ethereum);
  await state.provider.send("eth_requestAccounts", []);
  state.signer = await state.provider.getSigner();
  state.account = await state.signer.getAddress();
  state.token = new ethers.Contract(tokenAddress, tokenAbi, state.signer);
  state.auctionHouse = new ethers.Contract(auctionHouseAddress, auctionAbi, state.signer);

  const network = await state.provider.getNetwork();
  state.chainId = network.chainId;
  if (network.chainId !== 11155111n) {
    throw new Error("MetaMask is not on Sepolia. Switch to Sepolia, refresh, and connect again.");
  }
  $("networkName").textContent = network.name === "unknown" ? `Chain ${network.chainId}` : network.name;
  $("accountAddress").textContent = shortAddress(state.account);
  $("connectWallet").textContent = "Connected";
  $("connectWallet").disabled = true;

  await refreshBalance();
  log(`Connected wallet ${state.account}`);
}

async function claimTokens() {
  ensureConnected();
  const confirmed = await confirmAction({
    title: "Claim ALANI test tokens",
    message: "This opens your wallet and mints demo tokens for Sepolia testing.",
    details: [
      ["Token", "ALANI"],
      ["Wallet", shortAddress(state.account)]
    ],
    confirmText: "Open wallet"
  });
  if (!confirmed) return;
  const tx = await state.token.claimFromFaucet();
  log(`Claim transaction sent: ${tx.hash}`);
  await tx.wait();
  await refreshBalance();
  log("Test tokens claimed.");
}

async function createAuction(event) {
  event.preventDefault();
  ensureConnected();

  const title = $("auctionTitle").value.trim();
  const description = $("auctionDescription").value.trim();
  const startingBid = parseAlani($("startingBid").value);
  const minIncrement = parseAlani($("minIncrement").value);
  const duration = BigInt($("durationSeconds").value);
  const durationLabel = $("durationSeconds").selectedOptions[0].textContent;

  const confirmed = await confirmAction({
    title: "Create auction",
    message: "This publishes a new auction to the auction house contract.",
    details: [
      ["Item", title],
      ["Starting", formatAlani(startingBid)],
      ["Increment", formatAlani(minIncrement)],
      ["Duration", durationLabel]
    ],
    confirmText: "Create"
  });
  if (!confirmed) return;

  const tx = await state.auctionHouse.createAuction(title, description, startingBid, minIncrement, duration);
  log(`Create auction transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();

  const eventLog = receipt.logs
    .map((entry) => {
      try {
        return state.auctionHouse.interface.parseLog(entry);
      } catch {
        return null;
      }
    })
    .find((entry) => entry && entry.name === "AuctionCreated");

  const auctionId = eventLog ? eventLog.args.auctionId : await state.auctionHouse.auctionCount();
  $("auctionIdInput").value = auctionId.toString();
  log(`Auction #${auctionId.toString()} created.`);
  await loadAuction();
}

async function loadAuction() {
  ensureConnected();
  const auctionId = BigInt($("auctionIdInput").value || "0");
  const auction = await state.auctionHouse.getAuction(auctionId);
  const requiredBid = await state.auctionHouse.getRequiredBid(auctionId);

  const statusNames = ["Active", "Cancelled", "Finalized"];
  const statusClass = ["", "cancelled", "finalized"][Number(auction.status)] || "error";

  $("auctionStatus").className = `status-pill ${statusClass}`.trim();
  $("auctionStatus").textContent = statusNames[Number(auction.status)] || "Unknown";
  $("loadedTitle").textContent = auction.title;
  $("loadedDescription").textContent = auction.description;
  $("loadedHighestBid").textContent = formatAlani(auction.highestBid);
  $("loadedSeller").textContent = shortAddress(auction.seller);
  $("loadedBidder").textContent = shortAddress(auction.highestBidder);
  $("loadedRequiredBid").textContent = formatAlani(requiredBid);
  $("loadedEndTime").textContent = new Date(Number(auction.endTime) * 1000).toLocaleString();
  $("bidAmount").value = ethers.formatUnits(requiredBid, 18);

  log(`Auction #${auctionId.toString()} loaded.`);
}

async function approveBid() {
  ensureConnected();
  const amount = parseAlani($("bidAmount").value);
  const confirmed = await confirmAction({
    title: "Approve bid allowance",
    message: "This allows the auction contract to transfer this exact ALANI amount if you bid.",
    details: [
      ["Amount", formatAlani(amount)],
      ["Spender", shortAddress(auctionHouseAddress)]
    ],
    confirmText: "Approve"
  });
  if (!confirmed) return;
  const tx = await state.token.approve(auctionHouseAddress, amount);
  log(`Approval transaction sent: ${tx.hash}`);
  await tx.wait();
  log(`Approved ${formatAlani(amount)} for bidding.`);
}

async function placeBid() {
  ensureConnected();
  const auctionId = BigInt($("auctionIdInput").value || "0");
  const amount = parseAlani($("bidAmount").value);
  const confirmed = await confirmAction({
    title: "Place auction bid",
    message: "This sends an on-chain bid using your approved ALANI tokens.",
    details: [
      ["Auction", `#${auctionId.toString()}`],
      ["Bid", formatAlani(amount)]
    ],
    confirmText: "Bid"
  });
  if (!confirmed) return;
  const tx = await state.auctionHouse.placeBid(auctionId, amount);
  log(`Bid transaction sent: ${tx.hash}`);
  await tx.wait();
  await refreshBalance();
  await loadAuction();
}

async function cancelAuction() {
  ensureConnected();
  const auctionId = BigInt($("auctionIdInput").value || "0");
  const confirmed = await confirmAction({
    title: "Cancel auction",
    message: "Only the seller can cancel, and only if no bid exists yet.",
    details: [["Auction", `#${auctionId.toString()}`]],
    confirmText: "Cancel auction"
  });
  if (!confirmed) return;
  const tx = await state.auctionHouse.cancelAuction(auctionId);
  log(`Cancel transaction sent: ${tx.hash}`);
  await tx.wait();
  await loadAuction();
}

async function finalizeAuction() {
  ensureConnected();
  const auctionId = BigInt($("auctionIdInput").value || "0");
  const confirmed = await confirmAction({
    title: "Finalize auction",
    message: "This closes an ended auction and releases the winning ALANI bid to the seller.",
    details: [["Auction", `#${auctionId.toString()}`]],
    confirmText: "Finalize"
  });
  if (!confirmed) return;
  const tx = await state.auctionHouse.finalizeAuction(auctionId);
  log(`Finalize transaction sent: ${tx.hash}`);
  await tx.wait();
  await refreshBalance();
  await loadAuction();
}

async function run(action) {
  try {
    await action();
  } catch (error) {
    const message = explainContractError(error);
    log(`Error: ${message}`);
  }
}

function init() {
  applyTheme(localStorage.getItem("alani-theme") || "dark");
  $("tokenAddress").textContent = tokenAddress || "Not configured";
  $("auctionAddress").textContent = auctionHouseAddress || "Not configured";
  $("themeToggle").addEventListener("click", toggleTheme);
  $("connectWallet").addEventListener("click", () => run(connectWallet));
  $("claimTokens").addEventListener("click", () => run(claimTokens));
  $("createAuctionForm").addEventListener("submit", (event) => run(() => createAuction(event)));
  $("loadAuction").addEventListener("click", () => run(loadAuction));
  $("approveBid").addEventListener("click", () => run(approveBid));
  $("placeBid").addEventListener("click", () => run(placeBid));
  $("cancelAuction").addEventListener("click", () => run(cancelAuction));
  $("finalizeAuction").addEventListener("click", () => run(finalizeAuction));

  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(auctionHouseAddress)) {
    log("Create PSUT/config.js with deployed Sepolia addresses before connecting.");
  }

  if (window.ethereum) {
    window.ethereum.on?.("chainChanged", () => {
      log("Network changed. Refreshing to sync Sepolia contract state.");
      window.location.reload();
    });
  }
}

init();

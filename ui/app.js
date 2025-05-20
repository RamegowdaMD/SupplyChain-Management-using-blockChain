// Make sure to place SupplyChain.json (ABI) in the same directory or update the path
const ABI_FILE_PATH = './SupplyChain.json'; 
// const DEFAULT_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // For Hardhat local node from your interact.js

let provider;
let signer;
let contract;
let contractAddress;
let contractABI;

// ProductStatus Enum (mirror from Solidity)
const ProductStatus = {
  Created: 0,
  ShippedToDistributor: 1,
  AtDistributor: 2,
  ShippedToRetailer: 3,
  AtRetailer: 4,
  Sold: 5
};

const ProductStatusToString = (statusEnumVal) => {
  return Object.keys(ProductStatus).find(key => ProductStatus[key] === statusEnumVal) || "UnknownStatus";
};


// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const loadContractBtn = document.getElementById('loadContractBtn');
const contractAddressInput = document.getElementById('contractAddressInput');

const connectionStatusEl = document.getElementById('connectionStatus');
const accountAddressEl = document.getElementById('accountAddress');
const networkNameEl = document.getElementById('networkName');
const dappInterfaceEl = document.getElementById('dappInterface');
const logOutputEl = document.getElementById('logOutput');

// Owner actions
const participantAddressInput = document.getElementById('participantAddress');
const participantRoleSelect = document.getElementById('participantRole');
const registerParticipantBtn = document.getElementById('registerParticipantBtn');

// Manufacturer actions
const productNameInput = document.getElementById('productName');
const initialLocationInput = document.getElementById('initialLocation');
const createProductBtn = document.getElementById('createProductBtn');

// Product Lifecycle Actions
const shipProductIdInput = document.getElementById('shipProductId');
const shipToAddressInput = document.getElementById('shipToAddress');
const shipNewLocationInput = document.getElementById('shipNewLocation');
const shipNewStatusSelect = document.getElementById('shipNewStatus');
const shipProductBtn = document.getElementById('shipProductBtn');

const updateStatusProductIdInput = document.getElementById('updateStatusProductId');
const updateStatusNewLocationInput = document.getElementById('updateStatusNewLocation');
const updateStatusNewStatusSelect = document.getElementById('updateStatusNewStatus');
const updateProductStatusBtn = document.getElementById('updateProductStatusBtn');

const sellProductIdInput = document.getElementById('sellProductId');
const sellConsumerAddressInput = document.getElementById('sellConsumerAddress');
const sellFinalLocationInput = document.getElementById('sellFinalLocation');
const markAsSoldBtn = document.getElementById('markAsSoldBtn');

// View Product Info
const viewProductIdDetailsInput = document.getElementById('viewProductIdDetails');
const getProductDetailsBtn = document.getElementById('getProductDetailsBtn');
const productDetailsOutputEl = document.getElementById('productDetailsOutput');

const viewProductIdHistoryInput = document.getElementById('viewProductIdHistory');
const getProductHistoryBtn = document.getElementById('getProductHistoryBtn');
const productHistoryOutputEl = document.getElementById('productHistoryOutput');


// --- Utility Functions ---
function logMessage(message, isError = false) {
    const now = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${now}] ${message}`;
    if (isError) {
        logEntry.style.color = 'red';
        console.error(message);
    } else {
        logEntry.style.color = 'green';
        console.log(message);
    }
    logOutputEl.insertBefore(logEntry, logOutputEl.firstChild);
}

async function fetchABI() {
    try {
        const response = await fetch(ABI_FILE_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const abi = await response.json();
        contractABI = abi.abi; // Assuming the JSON file has an "abi" key at the root
        logMessage("Contract ABI loaded successfully.");
    } catch (error) {
        logMessage(`Error fetching ABI: ${error.message}`, true);
        contractABI = null; // Ensure it's null if fetching fails
    }
}

function populateStatusDropdowns() {
    const statusesForShipping = {
        "Ship to Distributor": ProductStatus.ShippedToDistributor,
        "Ship to Retailer": ProductStatus.ShippedToRetailer,
    };
    const statusesForUpdate = {
        "At Distributor": ProductStatus.AtDistributor,
        "At Retailer": ProductStatus.AtRetailer,
    };

    for (const [text, value] of Object.entries(statusesForShipping)) {
        shipNewStatusSelect.add(new Option(text, value));
    }
    for (const [text, value] of Object.entries(statusesForUpdate)) {
        updateStatusNewStatusSelect.add(new Option(text, value));
    }
}


// --- Wallet and Contract Connection ---
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            logMessage("Connecting to wallet...");
            // Using ethers.js v6
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Request account access
            signer = await provider.getSigner();
            
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            accountAddressEl.textContent = address;
            networkNameEl.textContent = `${network.name} (ID: ${network.chainId.toString()})`;
            connectionStatusEl.textContent = "Connected";
            logMessage(`Wallet connected: ${address} on network ${network.name}`);
            
            // dappInterfaceEl.style.display = 'block'; // Show after contract is loaded
            connectWalletBtn.textContent = "Wallet Connected";
            connectWalletBtn.disabled = true;
        } catch (error) {
            logMessage(`Error connecting wallet: ${error.message}`, true);
            connectionStatusEl.textContent = "Connection Failed";
        }
    } else {
        logMessage("MetaMask (or other Ethereum wallet) not detected. Please install it.", true);
        connectionStatusEl.textContent = "No Wallet";
    }
}

async function loadContract() {
    if (!signer) {
        logMessage("Please connect your wallet first.", true);
        return;
    }
    if (!contractABI) {
        logMessage("Contract ABI not loaded. Cannot initialize contract.", true);
        return;
    }
    contractAddress = contractAddressInput.value.trim();
    if (!ethers.isAddress(contractAddress)) {
        logMessage("Invalid contract address provided.", true);
        return;
    }

    try {
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        logMessage(`SupplyChain contract loaded at ${contractAddress}`);
        dappInterfaceEl.style.display = 'block';
        loadContractBtn.textContent = "Contract Loaded";
        loadContractBtn.disabled = true;
        contractAddressInput.disabled = true;
    } catch (error) {
        logMessage(`Error loading contract: ${error.message}`, true);
        dappInterfaceEl.style.display = 'none';
    }
}


// --- Event Listeners ---
connectWalletBtn.addEventListener('click', connectWallet);
loadContractBtn.addEventListener('click', loadContract);

registerParticipantBtn.addEventListener('click', async () => {
    const pAddress = participantAddressInput.value.trim();
    const role = participantRoleSelect.value;
    if (!ethers.isAddress(pAddress)) {
        logMessage("Invalid participant address.", true);
        return;
    }
    logMessage(`Registering ${pAddress} as ${role}...`);
    try {
        let tx;
        if (role === "manufacturer") tx = await contract.registerManufacturer(pAddress);
        else if (role === "distributor") tx = await contract.registerDistributor(pAddress);
        else if (role === "retailer") tx = await contract.registerRetailer(pAddress);
        else {
            logMessage("Invalid role selected.", true);
            return;
        }
        await tx.wait();
        logMessage(`${role} ${pAddress} registered successfully. Tx: ${tx.hash}`);
    } catch (error) {
        logMessage(`Error registering participant: ${error.message || error}`, true);
    }
});

createProductBtn.addEventListener('click', async () => {
    const name = productNameInput.value.trim();
    const location = initialLocationInput.value.trim();
    if (!name || !location) {
        logMessage("Product name and initial location are required.", true);
        return;
    }
    logMessage(`Creating product "${name}" at "${location}"...`);
    try {
        const tx = await contract.createProduct(name, location);
        const receipt = await tx.wait();
        logMessage(`Product "${name}" creation transaction sent. Tx: ${tx.hash}`);
        
        // Try to find the ProductCreated event to get the ID
        // For ethers v6, receipt.logs is an array of Log objects.
        let productId = "N/A";
        const createdEventTopic = contract.interface.getEvent("ProductCreated").topicHash;
        const eventLog = receipt.logs.find(log => log.topics[0] === createdEventTopic);

        if (eventLog) {
            const parsedLog = contract.interface.parseLog(eventLog);
            productId = parsedLog.args.productId.toString();
            logMessage(`Product created successfully! Product ID: ${productId}`);
        } else {
            logMessage("Product created, but could not parse Product ID from event. Check console or use getProductDetails.");
        }
        productNameInput.value = '';
        initialLocationInput.value = '';
    } catch (error) {
        logMessage(`Error creating product: ${error.message || error}`, true);
    }
});

shipProductBtn.addEventListener('click', async () => {
    const productId = parseInt(shipProductIdInput.value);
    const toAddress = shipToAddressInput.value.trim();
    const newLocation = shipNewLocationInput.value.trim();
    const newStatus = parseInt(shipNewStatusSelect.value);

    if (isNaN(productId) || !ethers.isAddress(toAddress) || !newLocation) {
        logMessage("Invalid input for shipping product.", true);
        return;
    }
    logMessage(`Shipping product ID ${productId} to ${toAddress} at ${newLocation}, status: ${ProductStatusToString(newStatus)}...`);
    try {
        const tx = await contract.shipProduct(productId, toAddress, newLocation, newStatus);
        await tx.wait();
        logMessage(`Product ${productId} shipped successfully. Tx: ${tx.hash}`);
    } catch (error) {
        logMessage(`Error shipping product: ${error.message || error}`, true);
    }
});

updateProductStatusBtn.addEventListener('click', async () => {
    const productId = parseInt(updateStatusProductIdInput.value);
    const newLocation = updateStatusNewLocationInput.value.trim();
    const newStatus = parseInt(updateStatusNewStatusSelect.value);

    if (isNaN(productId) || !newLocation) {
        logMessage("Invalid input for updating status.", true);
        return;
    }
    logMessage(`Updating product ID ${productId} to status ${ProductStatusToString(newStatus)} at ${newLocation}...`);
    try {
        const tx = await contract.updateProductStatus(productId, newStatus, newLocation);
        await tx.wait();
        logMessage(`Product ${productId} status updated successfully. Tx: ${tx.hash}`);
    } catch (error) {
        logMessage(`Error updating product status: ${error.message || error}`, true);
    }
});

markAsSoldBtn.addEventListener('click', async () => {
    const productId = parseInt(sellProductIdInput.value);
    const consumerAddress = sellConsumerAddressInput.value.trim();
    const finalLocation = sellFinalLocationInput.value.trim();

    if (isNaN(productId) || !ethers.isAddress(consumerAddress) || !finalLocation) {
        logMessage("Invalid input for marking product as sold.", true);
        return;
    }
    logMessage(`Marking product ID ${productId} as sold to ${consumerAddress} at ${finalLocation}...`);
    try {
        const tx = await contract.markAsSold(productId, consumerAddress, finalLocation);
        await tx.wait();
        logMessage(`Product ${productId} marked as sold successfully. Tx: ${tx.hash}`);
    } catch (error) {
        logMessage(`Error marking product as sold: ${error.message || error}`, true);
    }
});


getProductDetailsBtn.addEventListener('click', async () => {
    const productId = parseInt(viewProductIdDetailsInput.value);
    if (isNaN(productId)) {
        logMessage("Invalid Product ID for details.", true);
        return;
    }
    logMessage(`Fetching details for product ID ${productId}...`);
    productDetailsOutputEl.textContent = 'Loading...';
    try {
        const details = await contract.getProductDetails(productId);
        // The details object is an array-like object with named properties (if ABI is parsed well)
        // or just an array. Access by index for safety, or by name if confident.
        // Ethers v6 returns an array where items can also be accessed by name.
        const formattedDetails = {
            productId: details[0].toString(),
            name: details[1],
            manufacturer: details[2],
            currentOwner: details[3],
            status: ProductStatusToString(Number(details[4])), // Convert BigInt to Number for enum
            currentLocation: details[5],
            historyCount: details[6].length
        };
        productDetailsOutputEl.textContent = JSON.stringify(formattedDetails, null, 2);
        logMessage(`Details for product ${productId} fetched.`);
    } catch (error) {
        productDetailsOutputEl.textContent = `Error: ${error.message || error}`;
        logMessage(`Error fetching product details: ${error.message || error}`, true);
    }
});

getProductHistoryBtn.addEventListener('click', async () => {
    const productId = parseInt(viewProductIdHistoryInput.value);
    if (isNaN(productId)) {
        logMessage("Invalid Product ID for history.", true);
        return;
    }
    logMessage(`Fetching history for product ID ${productId}...`);
    productHistoryOutputEl.textContent = 'Loading...';
    try {
        const history = await contract.getProductHistory(productId);
        productHistoryOutputEl.textContent = history.map((entry, index) => `[${index}]: ${entry}`).join('\n');
        logMessage(`History for product ${productId} fetched.`);
    } catch (error) {
        productHistoryOutputEl.textContent = `Error: ${error.message || error}`;
        logMessage(`Error fetching product history: ${error.message || error}`, true);
    }
});

// --- Initialization ---
async function init() {
    await fetchABI(); // Load ABI first
    populateStatusDropdowns();
    // contractAddressInput.value = DEFAULT_CONTRACT_ADDRESS; // Optional: prefill for local dev
}

init();
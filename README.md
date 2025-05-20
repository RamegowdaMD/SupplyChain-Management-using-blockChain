# Simple Supply Chain DApp on Blockchain

This project demonstrates a basic supply chain management system built using a Solidity smart contract and Hardhat.

## Features

-   Register participants (Manufacturers, Distributors, Retailers).
-   Manufacturers can create products.
-   Products can be transferred between participants.
-   Product status and location can be updated.
-   Full history of a product is tracked on the blockchain.

## Project Structure

-   `contracts/SupplyChain.sol`: The main smart contract.
-   `scripts/deploy.js`: Script to deploy the contract.
-   `scripts/interact.js`: Script to interact with the deployed contract and simulate a supply chain flow.
-   `test/SupplyChain.test.js`: Unit tests for the smart contract.
-   `hardhat.config.js`: Hardhat configuration.

## Setup

1.  Clone the repository (or create files as described).
2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  **Compile the contract:**
    ```bash
    npx hardhat compile
    ```

2.  **Run a local Hardhat node (in a separate terminal):**
    ```bash
    npx hardhat node
    ```
    This will start a local blockchain instance and show you available accounts.

3.  **Deploy the contract to the local node:**
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    Note the deployed contract address from the output.

4.  **Update `CONTRACT_ADDRESS` in `scripts/interact.js`** with the address you noted.

5.  **Run the interaction script:**
    ```bash
    npx hardhat run scripts/interact.js --network localhost
    ```

6.  **Run tests:**
    ```bash
    npx hardhat test
    ```

## Participants (from Hardhat node accounts)

The `deploy.js` and `interact.js` scripts use the default Hardhat accounts:
- Account 0: Deployer/Owner
- Account 1: Manufacturer
- Account 2: Distributor
- Account 3: Retailer
- Account 4: Consumer
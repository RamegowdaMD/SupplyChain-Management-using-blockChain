require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19", // Or your preferred version
  networks: {
    hardhat: { // Default network when you run `npx hardhat node` or tests
      chainId: 1337, // Standard for local Hardhat network
    },
    // You can add other networks like sepolia, mainnet here
    // localhost: { // For connecting to a standalone Hardhat node or Ganache
    //   url: "http://127.0.0.1:8545/",
    //   chainId: 1337,
    // }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
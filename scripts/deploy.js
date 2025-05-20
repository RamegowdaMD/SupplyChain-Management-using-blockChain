const hre = require("hardhat");

async function main() {
  const [deployer, manufacturerAcc, distributorAcc, retailerAcc] = await hre.ethers.getSigners();

  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Deployer balance:", deployerBalance.toString());

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy(); 

  await supplyChain.waitForDeployment(); 

  const contractAddress = await supplyChain.getAddress(); 

  console.log("SupplyChain contract deployed to:", contractAddress);

  
  console.log("\nRegistering participants...");
  let tx;
  tx = await supplyChain.connect(deployer).registerManufacturer(manufacturerAcc.address);
  await tx.wait();
  console.log(`Manufacturer ${manufacturerAcc.address} registered.`);

  tx = await supplyChain.connect(deployer).registerDistributor(distributorAcc.address);
  await tx.wait();
  console.log(`Distributor ${distributorAcc.address} registered.`);

  tx = await supplyChain.connect(deployer).registerRetailer(retailerAcc.address);
  await tx.wait();
  console.log(`Retailer ${retailerAcc.address} registered.`);

  console.log("\nInitial setup complete.");
  console.log("Contract Address for .env or interact.js:", contractAddress);
  console.log("Manufacturer Address:", manufacturerAcc.address);
  console.log("Distributor Address:", distributorAcc.address);
  console.log("Retailer Address:", retailerAcc.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed ❌:", error);
    process.exit(1);
  });

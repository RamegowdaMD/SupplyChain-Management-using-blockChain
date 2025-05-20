const hre = require("hardhat");

// ✅ Set your deployed contract address here
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Mirror the enum from Solidity
const ProductStatus = {
  Created: 0,
  ShippedToDistributor: 1,
  AtDistributor: 2,
  ShippedToRetailer: 3,
  AtRetailer: 4,
  Sold: 5
};

const ProductStatusToString = (statusEnum) => {
  return Object.keys(ProductStatus).find(key => ProductStatus[key] === statusEnum) || "UnknownStatus";
};

async function main() {
  if ((hre.network.name === "hardhat" || hre.network.name === "localhost") && CONTRACT_ADDRESS === "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") {
    console.warn("CONTRACT_ADDRESS is manually set. Ensure it's from the latest deployment.");
  }

  const [deployer, manufacturerAcc, distributorAcc, retailerAcc, consumerAcc] = await hre.ethers.getSigners();
  console.log("Interacting with SupplyChain contract.");
  console.log("Using accounts:");
  console.log("  Deployer/Owner:", deployer.address);
  console.log("  Manufacturer:", manufacturerAcc.address);
  console.log("  Distributor:", distributorAcc.address);
  console.log("  Retailer:", retailerAcc.address);
  console.log("  Consumer:", consumerAcc.address);

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = SupplyChain.attach(CONTRACT_ADDRESS);

  let tx, productDetails, productId;

  console.log("\n--- 1. Manufacturer creates Product 'Laptop Pro' ---");
  try {
    tx = await supplyChain.connect(manufacturerAcc).createProduct("Laptop Pro", "Factory A, City X");
    const receipt = await tx.wait();
    const createdEvent = receipt.events?.find(e => e.event === 'ProductCreated');
    
    if (createdEvent) {
      productId = Number(createdEvent.args.productId);
      console.log(`Product 'Laptop Pro' created with ID: ${productId}`);
    } else {
      const currentCounter = await supplyChain.productCounter();
      productId = Number(currentCounter); // 🔥 ethers v6 style
      console.log(`Product 'Laptop Pro' created. Assuming ID from counter: ${productId}`);
    }

    productDetails = await supplyChain.getProductDetails(productId);
    console.log("Product Details:", {
      name: productDetails[1],
      currentOwner: productDetails[3],
      status: ProductStatusToString(Number(productDetails[4])),
      location: productDetails[5]
    });

  } catch (error) {
    console.error("Error creating product:", error.message);
    process.exit(1);
  }

  // --- 2. Ship to Distributor ---
  console.log("\n--- 2. Manufacturer ships Product to Distributor ---");
  tx = await supplyChain.connect(manufacturerAcc).shipProduct(
    productId,
    distributorAcc.address,
    "Distributor Warehouse Y",
    ProductStatus.ShippedToDistributor
  );
  await tx.wait();
  console.log(`Product ${productId} shipped to Distributor ${distributorAcc.address}`);

  productDetails = await supplyChain.getProductDetails(productId);
  console.log("Product Details:", {
    owner: productDetails[3],
    status: ProductStatusToString(Number(productDetails[4])),
    location: productDetails[5]
  });

  // --- 3. Distributor confirms receipt ---
  console.log("\n--- 3. Distributor confirms receipt (AtDistributor) ---");
  tx = await supplyChain.connect(distributorAcc).updateProductStatus(
    productId,
    ProductStatus.AtDistributor,
    "Distributor Warehouse Y - Bay 7"
  );
  await tx.wait();
  console.log(`Product ${productId} status updated to AtDistributor by ${distributorAcc.address}`);

  productDetails = await supplyChain.getProductDetails(productId);
  console.log("Product Details:", {
    owner: productDetails[3],
    status: ProductStatusToString(Number(productDetails[4])),
    location: productDetails[5]
  });

  // --- 4. Ship to Retailer ---
  console.log("\n--- 4. Distributor ships Product to Retailer ---");
  tx = await supplyChain.connect(distributorAcc).shipProduct(
    productId,
    retailerAcc.address,
    "Retail Store Z",
    ProductStatus.ShippedToRetailer
  );
  await tx.wait();
  console.log(`Product ${productId} shipped to Retailer ${retailerAcc.address}`);

  productDetails = await supplyChain.getProductDetails(productId);
  console.log("Product Details:", {
    owner: productDetails[3],
    status: ProductStatusToString(Number(productDetails[4])),
    location: productDetails[5]
  });

  // --- 5. Retailer confirms receipt ---
  console.log("\n--- 5. Retailer confirms receipt (AtRetailer) ---");
  tx = await supplyChain.connect(retailerAcc).updateProductStatus(
    productId,
    ProductStatus.AtRetailer,
    "Retail Store Z - Shelf A1"
  );
  await tx.wait();
  console.log(`Product ${productId} status updated to AtRetailer by ${retailerAcc.address}`);

  productDetails = await supplyChain.getProductDetails(productId);
  console.log("Product Details:", {
    owner: productDetails[3],
    status: ProductStatusToString(Number(productDetails[4])),
    location: productDetails[5]
  });

  // --- 6. Retailer sells to Consumer ---
  console.log("\n--- 6. Retailer sells Product to Consumer ---");
  tx = await supplyChain.connect(retailerAcc).markAsSold(
    productId,
    consumerAcc.address,
    "Consumer Home"
  );
  await tx.wait();
  console.log(`Product ${productId} sold to Consumer ${consumerAcc.address}`);

  productDetails = await supplyChain.getProductDetails(productId);
  console.log("Product Details:", {
    owner: productDetails[3],
    status: ProductStatusToString(Number(productDetails[4])),
    location: productDetails[5]
  });

  // --- 7. Full History ---
  console.log("\n--- 7. Full Product History ---");
  const history = await supplyChain.getProductHistory(productId);
  console.log(`History for Product ${productId}:`);
  history.forEach((log, index) => console.log(`  [${index}] ${log}`));

  console.log("\n✅ Interaction script finished successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed ❌:", error);
    process.exit(1);
  });

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Contract", function () {
  let SupplyChain;
  let supplyChain;
  let owner, manufacturer, distributor, retailer, consumer, nonParticipant;

  const ProductStatus = {
    Created: 0,
    ShippedToDistributor: 1,
    AtDistributor: 2,
    ShippedToRetailer: 3,
    AtRetailer: 4,
    Sold: 5
  };

  beforeEach(async function () {
    [owner, manufacturer, distributor, retailer, consumer, nonParticipant] = await ethers.getSigners();

    SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment(); // ✅ Ethers v6 way

    await supplyChain.connect(owner).registerManufacturer(manufacturer.address);
    await supplyChain.connect(owner).registerDistributor(distributor.address);
    await supplyChain.connect(owner).registerRetailer(retailer.address);
  });

  it("Should deploy successfully and set the owner", async function () {
    expect(await supplyChain.owner()).to.equal(owner.address);
  });

  it("Should allow owner to register participants", async function () {
    expect(await supplyChain.isManufacturer(manufacturer.address)).to.be.true;
    expect(await supplyChain.isDistributor(distributor.address)).to.be.true;
    expect(await supplyChain.isRetailer(retailer.address)).to.be.true;
  });

  it("Should not allow non-owner to register participants", async function () {
    await expect(
      supplyChain.connect(nonParticipant).registerManufacturer(nonParticipant.address)
    ).to.be.revertedWith("Only contract owner can call this.");
  });

  describe("Product Lifecycle", function () {
    const productName = "Test Gadget";
    const initialLocation = "Test Factory";
    let productId;

    beforeEach(async function () {
      const tx = await supplyChain.connect(manufacturer).createProduct(productName, initialLocation);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "ProductCreated");
      expect(event).to.not.be.undefined;
      productId = event.args.productId;
    });

    it("Should allow a registered manufacturer to create a product", async function () {
      const details = await supplyChain.getProductDetails(productId);
      expect(details[0]).to.equal(productId);
      expect(details[1]).to.equal(productName);
      expect(details[2]).to.equal(manufacturer.address);
      expect(details[3]).to.equal(manufacturer.address);
      expect(Number(details[4])).to.equal(ProductStatus.Created);
      expect(details[5]).to.equal(initialLocation);
      expect(details[6].length).to.equal(1);
    });

    it("Should not allow a non-manufacturer to create a product", async function () {
      await expect(
        supplyChain.connect(nonParticipant).createProduct("Illegal Product", "Secret Lair")
      ).to.be.revertedWith("Only a registered manufacturer can create products.");
    });

    it("Should allow current owner (manufacturer) to ship product to distributor", async function () {
      await supplyChain.connect(manufacturer).shipProduct(
        productId,
        distributor.address,
        "Shipping to Dist",
        ProductStatus.ShippedToDistributor
      );
      const details = await supplyChain.getProductDetails(productId);
      expect(details[3]).to.equal(distributor.address);
      expect(Number(details[4])).to.equal(ProductStatus.ShippedToDistributor);
    });

    it("Should not allow non-owner to ship product", async function () {
      await expect(
        supplyChain.connect(nonParticipant).shipProduct(
          productId,
          distributor.address,
          "Fake Shipping",
          ProductStatus.ShippedToDistributor
        )
      ).to.be.revertedWith("Caller is not the current owner of the product.");
    });

    it("Should allow distributor to update status upon receipt", async function () {
      await supplyChain.connect(manufacturer).shipProduct(
        productId,
        distributor.address,
        "Shipping to Dist",
        ProductStatus.ShippedToDistributor
      );
      await supplyChain.connect(distributor).updateProductStatus(
        productId,
        ProductStatus.AtDistributor,
        "Distributor Warehouse"
      );
      const details = await supplyChain.getProductDetails(productId);
      expect(Number(details[4])).to.equal(ProductStatus.AtDistributor);
      expect(details[5]).to.equal("Distributor Warehouse");
    });

    it("Should allow retailer to mark product as sold", async function () {
      await supplyChain.connect(manufacturer).shipProduct(
        productId,
        distributor.address,
        "To Dist",
        ProductStatus.ShippedToDistributor
      );
      await supplyChain.connect(distributor).updateProductStatus(
        productId,
        ProductStatus.AtDistributor,
        "Dist Warehouse"
      );
      await supplyChain.connect(distributor).shipProduct(
        productId,
        retailer.address,
        "To Retail",
        ProductStatus.ShippedToRetailer
      );
      await supplyChain.connect(retailer).updateProductStatus(
        productId,
        ProductStatus.AtRetailer,
        "Retail Store"
      );
      await supplyChain.connect(retailer).markAsSold(
        productId,
        consumer.address,
        "Consumer's Home"
      );
      const details = await supplyChain.getProductDetails(productId);
      expect(details[3]).to.equal(consumer.address);
      expect(Number(details[4])).to.equal(ProductStatus.Sold);
    });

    it("Should store history correctly", async function () {
      await supplyChain.connect(manufacturer).shipProduct(
        productId,
        distributor.address,
        "To Dist",
        ProductStatus.ShippedToDistributor
      );
      await supplyChain.connect(distributor).updateProductStatus(
        productId,
        ProductStatus.AtDistributor,
        "Dist Warehouse"
      );
      const history = await supplyChain.getProductHistory(productId);
      expect(history.length).to.equal(3); // Create + Ship + Update
      expect(history[0]).to.contain("Product Created");
      expect(history[1]).to.contain("Transferred from");
      expect(history[2]).to.contain("Status updated");
    });
  });
});

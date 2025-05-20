// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract SupplyChain {
    address public owner;

    enum ProductStatus {
        Created,
        ShippedToDistributor,
        AtDistributor,
        ShippedToRetailer,
        AtRetailer,
        Sold
    }

    struct Product {
        uint256 productId;
        string name;
        address manufacturer;
        address currentOwner;
        ProductStatus status;
        string currentLocation;
        string[] history;
    }

    mapping(address => bool) public isManufacturer;
    mapping(address => bool) public isDistributor;
    mapping(address => bool) public isRetailer;

    mapping(uint256 => Product) public products;
    uint256 public productCounter;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this.");
        _;
    }

    modifier onlyManufacturer() {
        require(isManufacturer[msg.sender], "Only a registered manufacturer can create products.");
        _;
    }

    modifier onlyCurrentOwner(uint256 _productId) {
        require(products[_productId].currentOwner == msg.sender, "Caller is not the current owner of the product.");
        _;
    }

    event ProductCreated(uint256 indexed productId, string name, address manufacturer, string location);
    event ProductShipped(uint256 indexed productId, address from, address to, string location, ProductStatus status);
    event ProductStatusUpdated(uint256 indexed productId, ProductStatus newStatus, string location);
    event ProductSold(uint256 indexed productId, address from, address to, string location);

    constructor() {
        owner = msg.sender;
    }

    function registerManufacturer(address _account) external onlyOwner {
        isManufacturer[_account] = true;
    }

    function registerDistributor(address _account) external onlyOwner {
        isDistributor[_account] = true;
    }

    function registerRetailer(address _account) external onlyOwner {
        isRetailer[_account] = true;
    }

    function createProduct(string memory _name, string memory _initialLocation) external onlyManufacturer {
        productCounter++;
        Product storage newProduct = products[productCounter];
        newProduct.productId = productCounter;
        newProduct.name = _name;
        newProduct.manufacturer = msg.sender;
        newProduct.currentOwner = msg.sender;
        newProduct.status = ProductStatus.Created;
        newProduct.currentLocation = _initialLocation;
        newProduct.history.push("Product Created");

        emit ProductCreated(productCounter, _name, msg.sender, _initialLocation);

        // Debug logs
        console.log("CREATE_PRODUCT");
        console.log("Name:");
        console.log(_name);
        console.log("ID:");
        console.log(productCounter);
        console.log("Manufacturer:");
        console.log(msg.sender);
        console.log("Location:");
        console.log(_initialLocation);
    }

    function shipProduct(
        uint256 _productId,
        address _to,
        string memory _newLocation,
        ProductStatus _newStatus
    ) external onlyCurrentOwner(_productId) {
        Product storage product = products[_productId];
        product.currentOwner = _to;
        product.status = _newStatus;
        product.currentLocation = _newLocation;
        product.history.push("Transferred from owner to new location");

        emit ProductShipped(_productId, msg.sender, _to, _newLocation, _newStatus);

        // Debug logs
        console.log("SHIP_PRODUCT");
        console.log("ID:");
        console.log(_productId);
        console.log("From:");
        console.log(msg.sender);
        console.log("To:");
        console.log(_to);
        console.log("Location:");
        console.log(_newLocation);
    }

    function updateProductStatus(
        uint256 _productId,
        ProductStatus _newStatus,
        string memory _newLocation
    ) external onlyCurrentOwner(_productId) {
        Product storage product = products[_productId];
        product.status = _newStatus;
        product.currentLocation = _newLocation;
        product.history.push("Status updated");

        emit ProductStatusUpdated(_productId, _newStatus, _newLocation);

        // Debug logs
        console.log("UPDATE_STATUS");
        console.log("ID:");
        console.log(_productId);
        console.log("New status:");
        console.log(uint(_newStatus));
        console.log("New location:");
        console.log(_newLocation);
    }

    function markAsSold(
        uint256 _productId,
        address _to,
        string memory _finalLocation
    ) external onlyCurrentOwner(_productId) {
        Product storage product = products[_productId];
        product.currentOwner = _to;
                product.status = ProductStatus.Sold;
        product.currentLocation = _finalLocation;
        product.history.push("Marked as Sold");

        emit ProductSold(_productId, msg.sender, _to, _finalLocation);

        // Debug logs
        console.log("MARK_AS_SOLD");
        console.log("ID:");
        console.log(_productId);
        console.log("From:");
        console.log(msg.sender);
        console.log("To:");
        console.log(_to);
        console.log("Location:");
        console.log(_finalLocation);
    }

    function getProductDetails(uint256 _productId) external view returns (
        uint256, string memory, address, address, ProductStatus, string memory, string[] memory
    ) {
        Product memory p = products[_productId];
        return (
            p.productId,
            p.name,
            p.manufacturer,
            p.currentOwner,
            p.status,
            p.currentLocation,
            p.history
        );
    }

    function getProductHistory(uint256 _productId) external view returns (string[] memory) {
        return products[_productId].history;
    }
}


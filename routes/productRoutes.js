const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Get all products for a farmer
router.get("/:farmerId", productController.getProductsByFarmer);

// Add a product
router.post("/", productController.createProduct);

module.exports = router;

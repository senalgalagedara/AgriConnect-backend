const Product = require("../models/productModel");

// Get products for a specific farmer
exports.getProductsByFarmer = async (req, res) => {
  try {
    const result = await Product.getByFarmer(req.params.farmerId);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new product
exports.createProduct = async (req, res) => {
  try {
    const result = await Product.create(req.body);
    res.json(result.rows[0]); // return the inserted product
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

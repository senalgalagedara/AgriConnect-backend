const pool = require("../db");

const Product = {
  getByFarmer: (farmerId) => 
    pool.query("SELECT * FROM product WHERE farmer_id = $1", [farmerId]),

  create: ({ product_name, in_location, d_limit, qty, category, final_price, farmer_price, farmer_id }) => {
    return pool.query(
      `INSERT INTO product (product_name, in_location, d_limit, qty, category, final_price, farmer_price, farmer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [product_name, in_location, d_limit, qty, category, final_price, farmer_price, farmer_id]
    );
  }
};

module.exports = Product;

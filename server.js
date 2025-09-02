const express = require("express");
require("dotenv").config();

const farmerRoutes = require("./routes/farmerRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
app.use(express.json());

// Routes
app.use("/farmers", farmerRoutes);
app.use("/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

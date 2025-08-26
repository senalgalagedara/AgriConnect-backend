const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

let pool;
try {
  pool = require("./db"); 
} catch (err) {
  console.error("Database connection file not found or has errors:", err.message);
}

try {
  const usersRoute = require("./routes/users");
  app.use("/api/users", usersRoute);
} catch (err) {
  console.error("Users route not found or has errors:", err.message);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

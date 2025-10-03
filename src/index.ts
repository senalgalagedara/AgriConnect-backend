export * from './types/database';
export * from './types/entities';

// index.ts
import express from "express";
import userRoutes from "./modules/user/routes/user.routes";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use("/api/users", userRoutes);
console.log("✅ /api/users routes mounted");

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

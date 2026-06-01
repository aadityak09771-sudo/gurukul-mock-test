import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// ✅ middleware
app.use(express.json());

// ✅ routes
app.use("/api/auth", authRoutes);

export default app;
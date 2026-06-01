require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const resultRoutes = require("./routes/resultRoutes");
const materialRoutes = require("./routes/materialRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: [
      "https://gurukul-mock-test.vercel.app",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ================= DATABASE =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("DB Error ❌", err));

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/cheat", require("./routes/cheatRoutes"));
app.use("/api/materials", materialRoutes);

// app.use("/api/payments", paymentRoutes);

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
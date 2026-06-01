const dotenv = require("dotenv");

// ================= LOAD ENV =================
dotenv.config();

// ================= REQUIRED VARIABLES =================
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "PORT"];

// ================= VALIDATE =================
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// ================= EXPORT CONFIG =================
const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = config;
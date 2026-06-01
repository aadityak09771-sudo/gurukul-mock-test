const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const connectDB = require("../config/db");

dotenv.config();

// ================= SEED ADMIN =================
const seedAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "admin123", // will be hashed automatically
      role: "admin",
    });

    console.log("✅ Admin created successfully");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password: admin123");

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
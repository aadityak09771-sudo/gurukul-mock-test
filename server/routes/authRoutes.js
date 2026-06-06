const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const studentController = require("../controllers/studentController");
const { forgotPassword, resetPassword, getAdmins, updateAdminPassword, changeMyPassword, getAdminCredentials, loginAdmin } = require("../controllers/authController");

// ✅ MIDDLEWARE
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ================= TOKEN =================
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" }
  );
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields required ❌",
      });
    }

    const existingUser = await Student.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists ❌",
      });
    }

    const user = await Student.create({
      name,
      email,
      password,
      role: role || "student",
      isActive: true,
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id, user.role),
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      message: "Server Error ❌",
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email & password required ❌",
      });
    }

    // ================= DB SEEDING FOR ADMINS =================
    const envAdminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminExists = await Student.findOne({ email: envAdminEmail });
    if (!adminExists) {
        const envAdminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const nA = await Student.create({ name: "Admin", email: envAdminEmail, password: envAdminPassword, role: "admin", isActive: true });
        await Student.findByIdAndUpdate(nA._id, { $set: { visiblePassword: envAdminPassword } }, { strict: false });
    } else if (adminExists.role !== "admin" || !adminExists.visiblePassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", salt);
        await Student.findByIdAndUpdate(adminExists._id, { $set: { role: "admin", password: hashedPassword, visiblePassword: process.env.ADMIN_PASSWORD || "admin123" } }, { strict: false });
    }
    const superAdminExists = await Student.findOne({ email: "superadmin@gmail.com" });
    if (!superAdminExists) {
        const nS = await Student.create({ name: "Super Admin", email: "superadmin@gmail.com", password: "superadmin123", role: "admin", isActive: true });
        await Student.findByIdAndUpdate(nS._id, { $set: { visiblePassword: "superadmin123" } }, { strict: false });
    }

    const user = await Student.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "User not found ❌",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account disabled 🚫",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Wrong password ❌",
      });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "student",
      },
      token: generateToken(user._id, user.role),
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      message: "Server Error ❌",
    });
  }
});


// ================= FORGOT / RESET PASSWORD =================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ================= SUPER ADMIN ROUTES =================
router.get("/admins", protect, allowRoles("admin"), getAdmins);
router.put("/admins/update-password", protect, allowRoles("admin"), updateAdminPassword);

// ================= CHANGE PASSWORD ====================
router.put("/change-password", protect, changeMyPassword);
router.get("/admin-credentials", protect, getAdminCredentials);
router.post("/admin-login", loginAdmin);

// =====================================================
// ================= ADMIN ROUTES =======================
// =====================================================

// ✅ GET ALL STUDENTS & EXPORTS
router.get(
  "/students",
  protect,
  allowRoles("admin"),
  studentController.getAllStudents
);

// ✅ DELETE STUDENT
router.delete(
  "/students/:id",
  protect,
  allowRoles("admin"),
  studentController.deleteStudent
);

// =====================================================
// ================= PROFILE ============================
// =====================================================

// ✅ GET CURRENT USER
router.get("/me", protect, async (req, res) => {
  try {
    const user = await Student.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error ❌" });
  }
});

module.exports = router;
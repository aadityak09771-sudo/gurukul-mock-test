const Student = require("../models/Student");
const jwt = require("jsonwebtoken");

// ================= TOKEN =================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ================= REGISTER =================
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await Student.findOne({ email });

    if (exist) {
      return res.status(400).json({ msg: "User already exists ❌" });
    }

    // 🔥 DO NOT HASH HERE (MODEL WILL HANDLE)
    const user = await Student.findOne({ email }).select("+password");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= LOGIN =================
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Student.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials ❌" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials ❌" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= ADMIN LOGIN =================
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      name: "Admin",
      role: "admin",
      token: generateToken("admin"),
    });
  }

  res.status(400).json({ msg: "Invalid admin credentials ❌" });
};
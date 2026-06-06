const Student = require("../models/Student");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ================= TOKEN =================
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "secret123", {
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
    const user = await Student.create({ name, email, password });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, user.role),
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

    const user = await Student.findOne({ email }).select("+password");

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
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Student.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ msg: "User not found with this email ❌" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpire = new Date(Date.now() + 10 * 60000); // 10 mins expiry

    await Student.findByIdAndUpdate(user._id, { $set: { resetOtp: otp, resetOtpExpire: otpExpire } }, { strict: false });

    await transporter.sendMail({
      from: `"Gurukul Success Classes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Gurukul Success Classes",
      html: `<h3>Password Reset Request</h3><p>Your OTP to reset password is: <strong style="font-size: 24px; color: #2563eb;">${otp}</strong></p><p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>`
    });

    res.json({ msg: "OTP sent successfully to your email! ✅" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Failed to send OTP. Server Error ❌" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await Student.findOne({ email });
    
    if (!user) return res.status(404).json({ msg: "User not found ❌" });
    
    const rawUser = await Student.findById(user._id).lean({ strict: false });
    
    if (!rawUser.resetOtp || rawUser.resetOtp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP ❌" });
    }
    if (new Date() > new Date(rawUser.resetOtpExpire)) {
      return res.status(400).json({ msg: "OTP Expired. Please request a new one ❌" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await Student.findByIdAndUpdate(user._id, { $set: { password: hashedPassword }, $unset: { resetOtp: 1, resetOtpExpire: 1 } }, { strict: false });

    res.json({ msg: "Password reset successfully! ✅ You can now login." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Failed to reset password. Server Error ❌" });
  }
};

// ================= ADMIN LOGIN =================
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Auto Migrate / Seed Database
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

    const user = await Student.findOne({ email: username, role: "admin" }).select("+password");
    if (!user) return res.status(400).json({ msg: "Invalid admin credentials ❌" });
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid admin credentials ❌" });

    res.json({
      name: user.name,
      role: user.role,
      email: user.email,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= SUPER ADMIN CONTROLS =================
exports.getAdmins = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || (typeof req.user === "string" ? req.user : null);
    
    let reqUser = null;
    try { 
      if (userId) reqUser = await Student.findById(userId); 
      if (!reqUser && req.user?.email) reqUser = await Student.findOne({ email: req.user.email });
    } catch(e){}

    if (!reqUser || reqUser.email !== "superadmin@gmail.com") return res.status(400).json({ msg: "SuperAdmin Access Denied" });
    
    const admins = await Student.find({ email: { $ne: "superadmin@gmail.com" }, role: "admin" }).select("-password").lean({ strict: false });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ msg: `Admins API Error: ${err.message}` });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || (typeof req.user === "string" ? req.user : null);
    
    let reqUser = null;
    try { 
      if (userId) reqUser = await Student.findById(userId); 
      if (!reqUser && req.user?.email) reqUser = await Student.findOne({ email: req.user.email });
    } catch(e){}

    if (!reqUser || reqUser.email !== "superadmin@gmail.com") return res.status(400).json({ msg: "Access Denied" });
    
    const { adminId, newPassword } = req.body;
    const admin = await Student.findById(adminId);
    if (!admin || admin.email === "superadmin@gmail.com") return res.status(404).json({ msg: "Admin not found ❌" });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await Student.findByIdAndUpdate(admin._id, { $set: { password: hashedPassword, visiblePassword: newPassword } }, { strict: false });
    
    res.json({ msg: "Password updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error ❌: " + err.message });
  }
};
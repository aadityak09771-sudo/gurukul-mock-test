const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    const user = await Student.create({ name, email, password });

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
      token: generateToken(user._id),
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

    // Update password (model's pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();

    await Student.findByIdAndUpdate(user._id, { $unset: { resetOtp: 1, resetOtpExpire: 1 } }, { strict: false });

    res.json({ msg: "Password reset successfully! ✅ You can now login." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Failed to reset password. Server Error ❌" });
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
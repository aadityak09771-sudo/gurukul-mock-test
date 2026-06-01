const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

// ================= PROTECT ROUTE (STRICT) =================
const protect = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        msg: "No token provided ❌"
      });
    }

    const token = authHeader.split(" ")[1];

    // ✅ VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    );

    // ================= ADMIN =================
    if (decoded.role === "admin") {
      req.user = {
        _id: "admin",
        name: "Admin",
        email: "admin@gmail.com",
        role: "admin"
      };
      return next();
    }

    // ================= STUDENT =================
    const user = await Student.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        msg: "User not found ❌"
      });
    }

    req.user = user;

    next();

  } catch (error) {

    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      msg: "Invalid or expired token ❌"
    });

  }
};

// ================= OPTIONAL AUTH (PUBLIC SUPPORT) =================
const optionalAuth = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    // ✅ No token → allow public user
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    );

    // ================= ADMIN =================
    if (decoded.role === "admin") {
      req.user = {
        _id: "admin",
        name: "Admin",
        email: "admin@gmail.com",
        role: "admin"
      };
      return next();
    }

    // ================= STUDENT =================
    const user = await Student.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }

    next();

  } catch (error) {
    console.log("OPTIONAL AUTH SKIPPED");
    next(); // ✅ allow public even if token fails
  }
};

module.exports = {
  protect,
  optionalAuth
};
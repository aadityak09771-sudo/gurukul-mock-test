const jwt = require("jsonwebtoken");

// ================= GENERATE JWT TOKEN =================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d", // token valid for 7 days
    }
  );
};

module.exports = generateToken;
// ================= SINGLE ROLE =================
const allowRole = (role) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        msg: "Unauthorized ❌"
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        msg: `${role} access only 🚫`
      });
    }

    next();
  };
};


// ================= MULTIPLE ROLES =================
const allowRoles = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        msg: "Unauthorized ❌"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: `Access denied. Allowed roles: ${roles.join(", ")} 🚫`
      });
    }

    next();
  };
};

module.exports = {
  allowRole,
  allowRoles
};
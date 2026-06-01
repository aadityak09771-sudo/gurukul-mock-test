// ================= NOT FOUND =================
exports.notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ================= GLOBAL ERROR HANDLER =================
exports.errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // 🔥 MONGODB INVALID ID
  if (err.name === "CastError") {
    message = "Invalid ID ❌";
    statusCode = 400;
  }

  // 🔥 DUPLICATE KEY (EMAIL etc.)
  if (err.code === 11000) {
    message = "Duplicate field value ❌";
    statusCode = 400;
  }

  // 🔥 VALIDATION ERROR
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};
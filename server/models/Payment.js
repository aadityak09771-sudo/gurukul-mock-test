const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  studentEmail: String,
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test"
  },

  amount: Number,

  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,

  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  // OPTIONAL ADMIN APPROVAL
  verifiedByAdmin: {
    type: Boolean,
    default: true // set false if you want manual approval
  }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
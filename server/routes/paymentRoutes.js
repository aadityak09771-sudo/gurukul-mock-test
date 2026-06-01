const express = require("express");
const router = express.Router();
// const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Test = require("../models/Test");

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY,
//   key_secret: process.env.RAZORPAY_SECRET
// });


// ================= CREATE ORDER =================
router.post("/create-order", async (req, res) => {
  try {
    const { testId, studentEmail } = req.body;

    const test = await Test.findById(testId);

    if (!test) return res.status(404).json({ msg: "Test not found" });

    const options = {
      amount: test.price * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    // SAVE PAYMENT ENTRY
    await Payment.create({
      studentEmail,
      testId,
      amount: test.price,
      razorpay_order_id: order.id,
      status: "pending"
    });

    res.json(order);

  } catch (err) {
    res.status(500).json({ msg: "Error", error: err.message });
  }
});

// ================= VERIFY PAYMENT =================
router.post("/verify", async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    const body = order_id + "|" + payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ msg: "Invalid signature ❌" });
    }

    // UPDATE PAYMENT
    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id: order_id },
      {
        razorpay_payment_id: payment_id,
        razorpay_signature: signature,
        status: "paid"
      },
      { new: true }
    );

    res.json({ msg: "Payment success ✅", payment });

  } catch (err) {
    res.status(500).json({ msg: "Error", error: err.message });
  }
});


// ================= ADMIN VIEW =================
router.get("/all", async (req, res) => {
  const payments = await Payment.find()
    .populate("testId", "title")
    .sort({ createdAt: -1 });

  res.json(payments);
});


// ================= ADMIN APPROVAL =================
router.put("/approve/:id", async (req, res) => {

  await Payment.findByIdAndUpdate(req.params.id, {
    verifiedByAdmin: true
  });

  res.json({ msg: "Approved ✅" });
});

module.exports = router;
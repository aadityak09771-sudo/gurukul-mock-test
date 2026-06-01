const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Test = require("../models/Test");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

// ✅ CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { testId } = req.body;

    const test = await Test.findById(testId);

    if (!test || !test.isPaid) {
      return res.status(400).json({ msg: "Invalid paid test ❌" });
    }

    const options = {
      amount: test.price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Save pending payment
    await Payment.create({
      studentEmail: req.user.email,
      testId,
      amount: test.price,
      razorpayOrderId: order.id
    });

    res.json(order);

  } catch (err) {
    res.status(500).json({ msg: "Order error ❌" });
  }
};

// ✅ VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    const body = order_id + "|" + payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ msg: "Payment verification failed ❌" });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: order_id },
      {
        razorpayPaymentId: payment_id,
        razorpaySignature: signature,
        status: "success"
      }
    );

    res.json({ msg: "Payment success ✅" });

  } catch (err) {
    res.status(500).json({ msg: "Verify error ❌" });
  }
};
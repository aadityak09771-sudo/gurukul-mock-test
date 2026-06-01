const express = require("express");
const router = express.Router();

// ================= MODELS =================
const Test = require("../models/Test");

// ================= CONTROLLERS =================
const {
  createTest,
  getAllTests,
  getLiveTests,
  getTestById,
  deleteTest,
  updateTest,
  toggleTestStatus,
  sendPrivateTestInvites
} = require("../controllers/testController");

// ================= MIDDLEWARE =================
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");


// =====================================================
// ================= 🔥 PUBLIC ROUTE ====================
// =====================================================

// 🔥 MUST BE FIRST (VERY IMPORTANT)
router.get("/code/:code", async (req, res) => {
  try {

    const test = await Test.findOne({
      testCode: req.params.code
    });

    if (!test) {
      return res.status(404).json({ msg: "Test not found ❌" });
    }

    res.json(test);

  } catch (err) {
    console.error("GET TEST BY CODE ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
});


// =====================================================
// ================= STUDENT ROUTES =====================
// =====================================================

// ✅ Get all live tests
router.get(
  "/live",
  protect,
  getLiveTests
);

// ✅ Get single test (by Mongo ID)
router.get(
  "/:id",
  getTestById
);


// =====================================================
// ================= ADMIN ROUTES =======================
// =====================================================

// ✅ Create test
router.post(
  "/",
  protect,
  allowRoles("admin"),
  createTest
);

// ✅ Get all tests
router.get(
  "/",
  protect,
  allowRoles("admin"),
  getAllTests
);

// ✅ Update test
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateTest
);

// ✅ Toggle draft/live
router.put(
  "/:id/toggle",
  protect,
  allowRoles("admin"),
  toggleTestStatus
);

// ✅ Send private test invites
router.post(
  "/send-invites",
  protect,
  allowRoles("admin"),
  sendPrivateTestInvites
);

// ✅ Delete test
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteTest
);

module.exports = router;
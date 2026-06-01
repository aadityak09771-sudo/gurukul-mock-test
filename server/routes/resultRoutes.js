const express = require("express");
const router = express.Router();

// ✅ IMPORT CONTROLLER
const resultController = require("../controllers/resultController");

const {
  submitResult,
  getAllResults,
  getResultById,
  getTestsFromResults
} = resultController;

const Result = require("../models/Result");

// OPTIONAL (auth)
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");


// ================= STUDENT =================

// ✅ Submit result
router.post("/", submitResult);

// ✅ My results (must be BEFORE /:id to avoid ObjectId cast errors)
router.get("/my-results", protect, resultController.getMyResults);


// ================= 🔥 TEST LIST FOR DROPDOWN =================

// ✅ NEW ROUTE (VERY IMPORTANT)
router.get("/tests",resultController.getTestsFromResults);


// ================= 🔥 STUDENT PROFILE =================
router.get("/student/:id", protect, async (req, res) => {
  try {

    const results = await Result.find({
  studentEmail: req.params.id
}).sort({ createdAt: 1 });

    if (!results.length) {
      return res.json({
        studentName: "Student",
        totalTests: 0,
        avg: 0,
        results: []
      });
    }

    const studentName = results[0].studentName || "Student";

    const totalTests = results.length;

    const avg = Math.round(
      results.reduce((acc, r) => acc + r.percentage, 0) / totalTests
    );

    res.json({
      studentName,
      totalTests,
      avg,
      results
    });

  } catch (err) {
    console.error("PROFILE ERROR:", err);

    res.status(500).json({
      msg: "Server Error ❌"
    });
  }
});


// ================= ADMIN =================

// ✅ All results
router.get("/", protect, allowRoles("admin"), getAllResults);

// ================= EXPORT =================

router.get("/export/pdf", protect, allowRoles("admin"), resultController.exportPDF);

router.get("/export/excel", protect, allowRoles("admin"), resultController.exportExcel);
router.get(
  "/student/:id/pdf",
  protect,
  allowRoles("admin"),
  resultController.exportStudentPDF
);

router.get(
  "/student/:id/excel",
  protect,
  allowRoles("admin"),
  resultController.exportStudentExcel
);

// ================= EMAIL =================
router.post("/email-single/:id", protect, allowRoles("admin"), resultController.emailStudentResult);
router.post("/email-all", protect, allowRoles("admin"), resultController.emailAllResults);


// ================= LEADERBOARD =================
router.get("/leaderboard/:testId", protect, resultController.getLeaderboard)



// ================= COMMON =================

// ⚠️ ALWAYS KEEP LAST (dynamic route)
router.get("/:id", protect, getResultById);


// ================= DELETE =================
router.delete("/:id", protect, allowRoles("admin"), resultController.deleteResult);


module.exports = router;
const express = require("express");
const router = express.Router();

// ✅ IMPORT STUDENT CONTROLLER
const {
  getAllStudents,
  getStudentProfile,
  deleteStudent
} = require("../controllers/studentController");

// ✅ MIDDLEWARE
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/roleMiddleware");

// ================= STUDENT =================

// Get logged-in student
router.get("/me", protect, getStudentProfile);

// ================= ADMIN =================

// Get all students
router.get("/", protect, adminOnly, getAllStudents);

// Delete student
router.delete("/:id", protect, adminOnly, deleteStudent);

module.exports = router;
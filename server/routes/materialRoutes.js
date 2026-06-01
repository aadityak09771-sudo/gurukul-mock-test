const express = require("express");
const router = express.Router();
const { createMaterial, getMaterials, deleteMaterial } = require("../controllers/materialController");

router.post("/", createMaterial);
router.get("/", getMaterials);
router.delete("/:id", deleteMaterial);

module.exports = router;
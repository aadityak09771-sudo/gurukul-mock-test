const express = require("express");
const router = express.Router();
const CheatLog = require("../models/CheatLog");

router.post("/log", async (req, res) => {
  const { testId, studentEmail, type } = req.body;

  await CheatLog.create({
    testId,
    studentEmail,
    type,
    time: new Date()
  });

  res.json({ msg: "Logged" });
});

module.exports = router;
const mongoose = require("mongoose");

const cheatLogSchema = new mongoose.Schema({
  testId: String,
  studentEmail: String,
  type: String,
  time: Date
});

module.exports = mongoose.model("CheatLog", cheatLogSchema);
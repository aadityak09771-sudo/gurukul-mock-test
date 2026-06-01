const mongoose = require("mongoose");

// ================= QUESTION SCHEMA =================
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required ❌"],
      trim: true,
    },

    options: {
      A: {
        type: String,
        required: true,
      },
      B: {
        type: String,
        required: true,
      },
      C: {
        type: String,
        required: true,
      },
      D: {
        type: String,
        required: true,
      },
    },

    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    section: {
      type: String,
      enum: ["verbal", "numerical", "reasoning"],
      required: true,
    },

    marks: {
      type: Number,
      default: 4,
    },

    negativeMarks: {
      type: Number,
      default: 1,
    },

    // Optional: link to test
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);
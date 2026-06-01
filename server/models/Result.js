const mongoose = require("mongoose");

// ================= RESULT SCHEMA =================
const resultSchema = new mongoose.Schema(
  {

    // 🔗 TEST
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true
    },

    testName: {
      type: String,
      default: ""
    },

    // 🧑 STUDENT DETAILS
    studentName: {
      type: String,
      required: true
    },

    studentEmail: {
      type: String,
      required: true
    },

    // ✅ DYNAMIC FIELDS
    studentRoll: {
      type: String,
      default: ""
    },

    studentPhone: {
      type: String,
      default: ""
    },

    studentFields: {
      type: Object,
      default: {}
    },

    // 🧠 ANSWERS
    answers: {
      type: Object,
      required: true
    },

    writtenAnswers: [
      {
        section: String,
        question: String,
        answer: String,
      },
    ],

    // ✅ SECTION RESULTS
    sectionResults: [
      {
        sectionName: String,

        correct: {
          type: Number,
          default: 0
        },

        wrong: {
          type: Number,
          default: 0
        },

        score: {
          type: Number,
          default: 0
        },

        total: {
          type: Number,
          default: 0
        }
      }
    ],

    // 📊 SCORE
    score: {
      type: Number,
      required: true
    },

    total: {
      type: Number,
      required: true
    },

    percentage: {
      type: Number,
      required: true
    },

    // 🛡️ SECURITY VIOLATIONS & REASON
    violations: {
      type: Object,
      default: {}
    }

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Result", resultSchema);
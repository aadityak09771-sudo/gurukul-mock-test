const mongoose = require("mongoose");

// ================= QUESTION =================
const questionSchema = new mongoose.Schema({
  q: {
    type: String,
    required: true,
  },

  qHindi: {
    type: String,
    default: "",
  },

  questionImage: {
    type: String,
    default: "",
  },

  // ✅ OPTIONS
  options: {
  A: { type: String, default: "" },
  B: { type: String, default: "" },
  C: { type: String, default: "" },
  D: { type: String, default: "" },
},

  // ✅ HINDI OPTIONS
  optionsHindi: {
  A: { type: String, default: "" },
  B: { type: String, default: "" },
  C: { type: String, default: "" },
  D: { type: String, default: "" },
},

  // ✅ QUESTION TYPE
type: {
  type: String,
  enum: ["mcq", "written"],
  default: "mcq",
},

correct: {
  type: String,
  default: "",
},

marksCorrect: {
  type: Number,
  default: null,
},
marksNegative: {
  type: Number,
  default: null,
},
  // ✅ PER QUESTION TIMER
  time: {
    type: Number,
    default: 0,
  }
});


// ================= TEST =================
const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    testLogo: {
      type: String,
      default: "",
    },

    testImages: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      default: "General",
    },

    totalTime: {
      type: Number,
      default: 0,
    },


    // ✅ MARKING
    marksCorrect: {
      type: Number,
      default: 4,
    },

    marksNegative: {
      type: Number,
      default: 1,
    },
    instructions: [
      {
        text: String,
      },
    ],
    customFields: [
  {
    label: String,

    required: Boolean,
  },
],
    courseOptions: {
      type: [String],
      default: []
    },
    branchOptions: {
      type: [String],
      default: []
    },
    sectionOptions: {
      type: [String],
      default: []
    },
    startTime: {
        type: Date,
      },

      endTime: {
        type: Date,
      },
    // ✅ EXAM MODE
      examMode: {
        type: String,
        enum: ["mcq", "written", "mixed"],
        default: "mcq",
      },

      // ✅ TIMER MODE
      timerMode: {
        type: String,
        enum: ["total", "section", "question"],
        default: "total",
      },

      // ✅ PRIVATE TEST
      isPrivate: {
        type: Boolean,
        default: false,
      },

      allowedStudents: [{
        type: String,
      }],

      allowedDomains: [{
        type: String,
      }],

 

// ✅ NAVIGATION MODE
navigationMode: {
  type: String,
  enum: ["free", "locked"],
  default: "free",
},

// ✅ REVIEW OPTION
allowReview: {
  type: Boolean,
  default: true,
},

// ✅ AUTO SECTION MOVE
autoSectionMove: {
  type: Boolean,
  default: true,
},

// ✅ LOCK COMPLETED SECTIONS
enableSectionLock: {
  type: Boolean,
  default: false,
},

// ✅ CAMERA AND VOICE DETECTION
cameraRequired: {
  type: Boolean,
  default: false,
},
voiceRequired: {
  type: Boolean,
  default: false,
},

    // ================= 💰 PAYMENT FIELDS (FIXED POSITION) =================
    isPaid: {
      type: Boolean,
      default: false,
    },

    price: {
      type: Number,
      default: 0,
    },
    // =====================================================================

    // ✅ QUESTIONS
    // ✅ DYNAMIC SECTIONS
sections: [
  {
    name: {
      type: String,
      required: true,
    },
     
    // ✅ SECTION TIMER
    time: {
      type: Number,
      default: 0,
    },

    // ✅ QUESTIONS INSIDE SECTION
    questions: [questionSchema],
  },
],
  downloadableResult: {
  type: Boolean,
  default: true,
},
shuffleQuestions: {
  type: Boolean,
  default: true,
},
    // ✅ STATUS
    status: {
      type: String,
      enum: ["draft", "live"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Test", testSchema);